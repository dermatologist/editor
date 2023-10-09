import { posToDOMRect, useCurrentEditor } from "@tiptap/react";
import { SparklesIcon } from "lucide-react";
import React from "react";

import { SelectionContext } from "~/app/types";

import { Popup } from "./popup";
import { Suggestions } from "./suggestions";

interface MenuProps {
    suggestions: string[];
    context: SelectionContext | null;
    status: "idle" | "fetching" | "done";
}

export const Menu = ({ suggestions, context, status }: MenuProps) => {
    const { editor } = useCurrentEditor();

    const lastRect = React.useRef<DOMRect | null>(null);

    const rect = React.useMemo(() => {
        if (!editor || status === "done") {
            return lastRect.current;
        }

        const rect = posToDOMRect(
            editor.view,
            editor.state.selection.from,
            editor.state.selection.to
        );

        const editorRect = editor.view.dom.getBoundingClientRect();

        rect.y -= editorRect.y;
        rect.x -= editorRect.x;

        lastRect.current = rect;

        return rect;
    }, [
        status,
        editor?.view,
        editor?.state.selection.from,
        editor?.state.selection.to,
    ]);

    if (!editor || editor.isDestroyed) {
        return null;
    }

    return (
        <Popup rect={rect} visible={status !== "idle"}>
            <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center gap-1">
                    <span className="text-sm font-semibold">Suggestions</span>
                    <SparklesIcon className="w-4 h-4 text-violet-500" />
                </div>
                <Suggestions
                    isLoading={status === "fetching" || status === "idle"}
                    suggestions={suggestions}
                    context={context}
                />
            </div>
        </Popup>
    );
};
