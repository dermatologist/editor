"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";

import {
    CompletionExtension,
    PreviewCompletionNode,
    SelectionHighlightMark,
    TextReplacementExtension,
} from "./extensions";
import { Menu } from "./menu";
import { useCompletion, useSentenceGeneration, useSuggestions } from "./utils";

const EditorControls = () => {
    const { editor } = useCurrentEditor();
    const { manualGetSuggestions, suggestions, status, context, onBlur } = useSuggestions();
    const { generateSentences, isGenerating } = useSentenceGeneration();
    const [selectedLLM, setSelectedLLM] = useState<string>("gemini");

    const handleSuggestCitations = () => {
        if (editor) {
            manualGetSuggestions(editor);
        }
    };

    const handleGenerateSentences = () => {
        if (editor) {
            generateSentences(editor, selectedLLM);
        }
    };

    return (
        <>
            <div className="flex gap-2 mb-4 items-center flex-wrap">
                <label className="flex items-center gap-2">
                    <span className="text-sm font-medium">LLM:</span>
                    <select
                        value={selectedLLM}
                        onChange={(e) => setSelectedLLM(e.target.value)}
                        className="px-3 py-2 border rounded-md bg-white text-sm"
                    >
                        <option value="gemini">Gemini</option>
                        <option value="ollama">Ollama</option>
                    </select>
                </label>
                <button
                    onClick={handleGenerateSentences}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 text-sm font-medium"
                >
                    {isGenerating ? "Generating..." : "Next 3 Sentences"}
                </button>
                <button
                    onClick={handleSuggestCitations}
                    disabled={status === "fetching"}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 text-sm font-medium"
                >
                    {status === "fetching" ? "Loading..." : "Suggest Citations"}
                </button>
            </div>
            <Menu
                suggestions={suggestions}
                context={context}
                status={status}
                onClose={onBlur}
            />
        </>
    );
};

export const Editor = () => {
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
                onUpdate={({ editor, transaction }) => {
                    onContentChange(editor, transaction);
                }}
            >
                <EditorControls />
            </EditorProvider>
        </div>
    );
};
