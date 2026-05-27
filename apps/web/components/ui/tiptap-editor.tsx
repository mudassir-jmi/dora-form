"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
    IconBold,
    IconItalic,
    IconStrikethrough,
    IconH1,
    IconH2,
    IconList,
    IconListNumbers,
    IconQuote,
    IconCode,
} from "@tabler/icons-react";

interface TiptapEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2],
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-invert max-w-none focus:outline-none min-h-[120px] p-3 text-sm text-foreground font-mono [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_p]:text-sm",
            },
        },
    });

    // Synchronize editor content when value changes from outside (e.g. initial load)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="border border-border bg-background rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-primary">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-1.5">
                <button
                    type="button"
                    className={`p-1.5 rounded-md transition ${
                        editor.isActive("bold")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Bold"
                >
                    <IconBold className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded-md transition ${
                        editor.isActive("italic")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Italic"
                >
                    <IconItalic className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded-md transition ${
                        editor.isActive("strike")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Strikethrough"
                >
                    <IconStrikethrough className="size-3.5" />
                </button>
                
                <span className="h-4 w-[1px] bg-border/50 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-1.5 rounded-md transition ${
                        editor.isActive("heading", { level: 1 })
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Heading 1"
                >
                    <IconH1 className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded-md transition ${
                        editor.isActive("heading", { level: 2 })
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Heading 2"
                >
                    <IconH2 className="size-3.5" />
                </button>

                <span className="h-4 w-[1px] bg-border/50 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded-md transition ${
                        editor.isActive("bulletList")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Bullet List"
                >
                    <IconList className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded-md transition ${
                        editor.isActive("orderedList")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Numbered List"
                >
                    <IconListNumbers className="size-3.5" />
                </button>

                <span className="h-4 w-[1px] bg-border/50 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-1.5 rounded-md transition ${
                        editor.isActive("blockquote")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Blockquote"
                >
                    <IconQuote className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`p-1.5 rounded-md transition ${
                        editor.isActive("codeBlock")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Code Block"
                >
                    <IconCode className="size-3.5" />
                </button>
            </div>

            {/* Editor Content */}
            <div className="bg-background border-t-0 min-h-[120px]">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
