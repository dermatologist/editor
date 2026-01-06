"use client";

import { autoUpdate, shift, useFloating } from "@floating-ui/react";
import clsx from "clsx";
import React from "react";
import { useMedia } from "react-use";

interface PopupProps {
    rect?: DOMRect | null;
    visible: boolean;
    children: React.ReactNode;
    onClose?: () => void;
}

export const Popup = ({ rect, visible, children, onClose }: PopupProps) => {
    const isMobile = useMedia("(max-width: 640px)");
    const { refs, floatingStyles } = useFloating({
        whileElementsMounted: autoUpdate,
        placement: isMobile ? "bottom" : "top",
        strategy: "fixed",
        middleware: [shift()],
    });

    const overlayRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!visible || !onClose) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (
                overlayRef.current &&
                !overlayRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [visible, onClose]);

    if (!rect) {
        return null;
    }

    return (
        <div
            className={clsx(
                "flex absolute top-0 left-0 items-center justify-center pointer-events-none "
            )}
            ref={refs.setReference}
            style={{
                transform: `translate(${rect.x}px, ${rect.y}px)`,
                width: rect.width,
                height: rect.height,
            }}
        >
            {visible && (
                <div
                    ref={(el) => {
                        refs.setFloating(el);
                        overlayRef.current = el;
                    }}
                    style={floatingStyles}
                    className="flex-grow-0 flex-shrink"
                >
                    <div className="animate-in ease-in-out zoom-in-75 bg-white border rounded-md shadow-md py-2 px-3 flex flex-col flex-shrink min-w-[60vw] md:min-w-min max-w-[80vw] pointer-events-auto">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};
