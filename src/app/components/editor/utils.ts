import { Editor as IEditor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import React from "react";
import { useDebouncedCallback } from "use-debounce";

import { SelectionContext } from "~/app/types";
import { exponentialBackoff, fetchWithRetry } from "~/app/utils";


export const fetchSuggestions = async (context: SelectionContext) => {
    const response = await fetchWithRetry("/api/citation", {
        retryOn: [429],
        retryDelay: exponentialBackoff,
        retries: 5,
        method: "POST",
        body: JSON.stringify(context),
    });

    return response.json() as Promise<string[]>;
};

export const fetchCompletion = async (text: string, llm?: string) => {
    const response = await fetchWithRetry("/api/llmcompletion", {
        retryOn: [429],
        retryDelay: exponentialBackoff,
        retries: 5,
        method: "POST",
        body: JSON.stringify({ text, llm }),
    });

    return (await response.json()).completionText as string;
};

export const fetchSentences = async (text: string, llm?: string) => {
    const response = await fetchWithRetry("/api/sentences", {
        retryOn: [429],
        retryDelay: exponentialBackoff,
        retries: 5,
        method: "POST",
        body: JSON.stringify({ text, llm }),
    });

    return (await response.json()).sentences as string;
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
    const [fstatus, setFstatus] = React.useState<"idle" | "fetching">(
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

    const manualGetSuggestions = React.useCallback(
        async (editor: IEditor) => {
            const { from, to } = editor.state.selection;
            
            if (from === to) {
                // No text selected, show warning
                alert("Please select some text to get citation suggestions.");
                return;
            }

            const context = getSelectionContext(
                editor.state.doc,
                from,
                to
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

            if(fstatus === "idle") {
                setFstatus("fetching");
                fetchSuggestions(context).then((result) => {
                    setFstatus("idle");
                    if (
                        transactionId === transactionRef.current &&
                        statusRef.current === "fetching"
                    ) {
                        setSuggestions(result);
                        setStatus("done");
                    }
                }).catch((error) => {
                    console.error(error);
                    setFstatus("idle");
                    setStatus("idle");
                });
            }
        },
        [fstatus]
    );

    return {
        context,
        suggestions,
        status,
        manualGetSuggestions,
        onBlur,
    };
};

const MIN_DOC_LENGTH_FOR_COMPLETION = 32;
const COMPLETION_CONTEXT_CHARS = 256; //128

export const useCompletion = () => {
    const [fstatus, setFstatus] = React.useState<"idle" | "fetching">(
        "idle"
    );

    const removePreviewCompletion = React.useCallback((editor: IEditor) => {
        editor.commands.revertCompletion();
    }, []);

    const onContentChange = React.useCallback(
        (editor: IEditor, transaction: Transaction) => {
            const isSystemAction = transaction.getMeta("isSystemAction");
            if (!isSystemAction) {
                editor.commands.revertCompletion();
            }
        },
        []
    );

    return { onContentChange, removePreviewCompletion };
};

export const useSentenceGeneration = () => {
    const [isGenerating, setIsGenerating] = React.useState(false);

    const generateSentences = React.useCallback(
        async (editor: IEditor, llm: string) => {
            if (isGenerating) return;
            
            const text = getTextForSlice(
                editor.state.doc.cut(
                    Math.max(
                        0,
                        editor.state.selection.from - COMPLETION_CONTEXT_CHARS
                    ),
                    editor.state.selection.from
                )
            );

            if (text.length < MIN_DOC_LENGTH_FOR_COMPLETION) {
                alert("Please write at least a few words before generating sentences.");
                return;
            }

            setIsGenerating(true);
            try {
                const sentences = await fetchSentences(text, llm);
                editor.commands.previewCompletion(sentences);
            } catch (error) {
                console.error(error);
                alert("Failed to generate sentences. Please try again.");
            } finally {
                setIsGenerating(false);
            }
        },
        [isGenerating]
    );

    return { generateSentences, isGenerating };
};
