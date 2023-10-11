"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
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

    return (
        <div className="relative">
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
