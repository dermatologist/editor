"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useRef } from "react";
import ReactDOM from "react-dom";

import {
    CompletionExtension,
    PreviewCompletionNode,
    SelectionHighlightMark,
    TextReplacementExtension,
} from "./extensions";
import { Menu } from "./menu";
import { useCompletion, useSuggestions } from "./utils";

export const Editor = () => {
    const { suggestions, status, debouncedGetSuggestions, context, onBlur } =
        useSuggestions();

    const { onContentChange, removePreviewCompletion } = useCompletion();

    const fileInput = useRef<HTMLInputElement>(null);

    async function uploadFile(
        evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        evt.preventDefault();

        const formData = new FormData();
        formData.append("file", fileInput?.current?.files?.[0]!);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        console.log(result);
    }

    return (
        <div className="relative">
            <form className="flex flex-col gap-4">
                <label>
                    <span>Upload a file</span>
                    <input type="file" name="file" ref={fileInput} />
                </label>
                <button type="submit" onClick={uploadFile}>
                    Submit
                </button>
            </form>
            <EditorProvider
                extensions={[
                    StarterKit,
                    SelectionHighlightMark,
                    PreviewCompletionNode,
                    TextReplacementExtension,
                    Placeholder.configure({
                        placeholder: "Start typing the next big thing...",
                    }),
                    CompletionExtension,
                ]}
                editorProps={{
                    attributes: {
                        class: "prose !outline-none p-4 min-h-[50vh]",
                    },
                }}
                onBlur={onBlur}
                onSelectionUpdate={({ editor, transaction }) => {
                    const isSystemAction =
                        transaction.getMeta("isSystemAction");

                    if (!isSystemAction) {
                        removePreviewCompletion(editor);
                        debouncedGetSuggestions(editor, transaction);
                    }
                }}
                onUpdate={({ editor, transaction }) => {
                    onContentChange(editor, transaction);
                }}
            >
                <Menu
                    suggestions={suggestions}
                    context={context}
                    status={status}
                />
            </EditorProvider>
        </div>
    );
};
