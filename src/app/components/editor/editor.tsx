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
    const redisIndex = useRef<HTMLInputElement>(null);
    const zoteroCollection = useRef<HTMLInputElement>(null);
    const webPage = useRef<HTMLInputElement>(null);

    async function uploadFile(
        evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        evt.preventDefault();

        const formData = new FormData();
        formData.append("file", fileInput?.current?.files?.[0]!);
        formData.append("index", redisIndex?.current?.value!);
        // formData.append("zotero", zoteroCollection?.current?.value!);
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        console.log(result);
    }

    async function indexZotero(
        evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        evt.preventDefault();
        const formData = new FormData();
        // formData.append("file", fileInput?.current?.files?.[0]!);
        formData.append("index", redisIndex?.current?.value!);
        formData.append("zotero", zoteroCollection?.current?.value!);
        const response = await fetch("/api/zotero", {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        console.log(result);
    }

    async function indexWebpage(
        evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        evt.preventDefault();
        const formData = new FormData();
        formData.append("index", redisIndex?.current?.value!);
        formData.append("webpage", webPage?.current?.value!);
        const response = await fetch("/api/webpage", {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        console.log(result);
    }

    async function setIndex(
        evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        evt.preventDefault();
        const formData = new FormData();
        formData.append("index", redisIndex?.current?.value!);
        const response = await fetch("/api/setindex", {
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
                    <input type="text" name="index" ref={redisIndex} placeholder="Redis index" />
                    <input type="text" name="zotero" ref={zoteroCollection} placeholder="Zotero collection" />
                    <input type="text" name="webpage" ref={webPage} placeholder="Webpage" />
                    <br />
                    <button type="submit" onClick={uploadFile}>
                        <b>| Submit file to index | </b>
                    </button>
                    <button type="submit" onClick={indexZotero}>
                        <b>| Add Zotero to index | </b>
                    </button>
                    <button type="submit" onClick={indexWebpage}>
                        <b>| Add Webpage to index |</b>
                    </button>
                    <button type="submit" onClick={setIndex}>
                        <b>| Setindex |</b>
                    </button>
                </label>
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
