import { Editor as IEditor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import React from "react";
import { useDebouncedCallback } from "use-debounce";

import { SelectionContext } from "~/app/types";
import { exponentialBackoff, fetchWithRetry } from "~/app/utils";

import bootstrap from "../../llm/bootstrap";
import { ChainService } from '../../llm/chain';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined.");
}

export const fetchSuggestions = async (context: SelectionContext) => {
    const _system = `You are a text improvement tool. `;
    const _user = `Given the text before as ${context.before}

    and the text after as ${context.after},

    improve only the selected text below.
    selected text: ${context.selection}`;
    let _req;
    if(process.env.NEXT_PUBLIC_BACKEND === "ollama") {
        _req = {
            "model": "phi3",
            "max_tokens": 256,
            "temperature": 0.2,
            "messages": [
                {
                    "role": "system",
                    "content": _system
                },
                {
                    "role": "user",
                    "content": _user
                }
            ]
        }

    }else{
        _req = {
            prompt: _system + _user,
            n_predict: 256,
            temperature: 0.3,
            cache_prompt: true,
            stream: false,
        }
    }
    const response = await fetchWithRetry(apiUrl, {
        retryOn: [429],
        retryDelay: exponentialBackoff,
        retries: 2,
        method: "POST",
        body: JSON.stringify(_req),
    });
    let _reply;
    if(process.env.NEXT_PUBLIC_BACKEND === "ollama") {
        _reply = (await response.json()).choices[0].message.content as string;
    }else{
        _reply = (await response.json()).content as string;
    }
    return [_reply.replace("\n", "").replace(/\s\s+/g, ' ')] as string[];

    // return [(await response.json()).content] as string[];
};

export const fetchCompletion = async (text: string) => {
    const _system = `You are a text completion agent. `;
    const _user = `Complete the following text.
            Make sure the what you write works in the context of the text.
            No special characters. No assistant annotation.
            If there is an incomplete word, complete the word.

            text: ${text} `
    const chain = await new ChainService(await bootstrap(), "main-llm", "prompt", "tools");

    const _reply = await chain.chain({'question': 'How may I help you?', 'context': "The user has asthma."})

    return _reply.replace("\n", "").replace(/\s\s+/g, ' ');
};

export const getTextForSlice = (node: Node) => {
    return node.textBetween(0, node.nodeSize - 2, "\n");
};

const CONTEXT_PADDING_CHARS = 64;

export const getSelectionContext = (
    doc: Node,
    selectionStart: number,
    selectionEnd: number
) => {
    let contextStart = Math.max(0, selectionStart - CONTEXT_PADDING_CHARS);
    let contextEnd = Math.min(
        selectionEnd + CONTEXT_PADDING_CHARS,
        doc.content.size
    );

    const wordBoundaryRegex = /[\s\(\)\[\]\.,;:!?]/;
    const textBeforeSelection = getTextForSlice(
        doc.cut(contextStart, selectionStart)
    );
    const reversedTextBeforeSelection = textBeforeSelection
        .split("")
        .reverse()
        .join("");
    let wordBoundaryBefore =
        reversedTextBeforeSelection.search(wordBoundaryRegex);
    if (wordBoundaryBefore === -1) {
        wordBoundaryBefore = reversedTextBeforeSelection.length;
    }
    const textAfterSelection = getTextForSlice(
        doc.cut(selectionEnd, contextEnd)
    );

    let wordBoundaryAfter = textAfterSelection.search(wordBoundaryRegex);
    if (wordBoundaryAfter === -1) {
        wordBoundaryAfter = textAfterSelection.length;
    }

    selectionStart -= wordBoundaryBefore;
    selectionEnd += wordBoundaryAfter;

    const context: SelectionContext = {
        before: getTextForSlice(doc.cut(contextStart, selectionStart)),
        selection: getTextForSlice(doc.cut(selectionStart, selectionEnd)),
        after: getTextForSlice(doc.cut(selectionEnd, contextEnd)),
        selectionStart,
        selectionEnd,
    };

    return context;
};

export const useSuggestions = () => {
    const [context, setContext] = React.useState<SelectionContext | null>(null);
    const [suggestions, setSuggestions] = React.useState<string[]>([]);
    const [status, setStatus] = React.useState<"idle" | "fetching" | "done">(
        "idle"
    );

    const transactionRef = React.useRef<number>(0);

    const statusRef = React.useRef<"idle" | "fetching" | "done">("idle");
    React.useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const onBlur = React.useCallback(() => {
        setSuggestions([]);
        setStatus("idle");
        setContext(null);
    }, []);

    const debouncedGetSuggestions = useDebouncedCallback(
        async (editor: IEditor, transaction: Transaction) => {
            const context = getSelectionContext(
                editor.state.doc,
                transaction.selection.from,
                transaction.selection.to
            );

            setContext(context);
            setStatus("fetching");

            editor
                .chain()
                .setTextSelection({
                    from: context.selectionStart,
                    to: context.selectionEnd,
                })
                .setMeta("isSystemAction", true)
                .run();

            const transactionId = Date.now();
            transactionRef.current = transactionId;

            const suggestions = await fetchSuggestions(context);

            if (
                transactionId === transactionRef.current &&
                statusRef.current === "fetching"
            ) {
                setSuggestions(suggestions);
                setStatus("done");
            }
        },
        1000,
        {
            leading: false,
        }
    );

    const getSuggestionsHandler = React.useCallback(
        (editor: IEditor, transaction: Transaction) => {
            if (transaction.selection.empty) {
                setSuggestions([]);
                setStatus("idle");
                setContext(null);
            } else if (
                status === "idle" ||
                (status === "done" && !transaction.getMeta("isSystemAction"))
            ) {
                debouncedGetSuggestions(editor, transaction);
            }
        },
        [debouncedGetSuggestions, status]
    );

    return {
        context,
        suggestions,
        status,
        debouncedGetSuggestions: getSuggestionsHandler,
        onBlur,
    };
};

const MIN_DOC_LENGTH_FOR_COMPLETION = 16;
const COMPLETION_CONTEXT_CHARS = 128;


export const useCompletion = () => {
    const debouncedCompletion = useDebouncedCallback(
        async (editor: IEditor, transaction: Transaction) => {
            const text = getTextForSlice(
                editor.state.doc.cut(
                    Math.max(
                        0,
                        editor.state.selection.from - COMPLETION_CONTEXT_CHARS
                    ),
                    editor.state.selection.from
                )
            );

            const completion = await fetchCompletion(text);
            editor.commands.previewCompletion(completion);

        },
        4000, // Timeout delay
        { leading: false }
    );

    const removePreviewCompletion = React.useCallback((editor: IEditor) => {
        editor.commands.revertCompletion();
    }, []);

    const onContentChange = React.useCallback(
        (editor: IEditor, transaction: Transaction) => {
            const isSystemAction = transaction.getMeta("isSystemAction");
            if (!isSystemAction) {
                editor.commands.revertCompletion();
                if (
                    editor.state.selection.empty &&
                    editor.state.doc.textContent.length >
                        MIN_DOC_LENGTH_FOR_COMPLETION
                ) {
                    debouncedCompletion(editor, transaction);
                }
            }
        },
        [debouncedCompletion]
    );

    return { onContentChange, removePreviewCompletion };
};
