"use client"

import StarterKit from "@tiptap/starter-kit"
import { EditorContent, useEditor } from "@tiptap/react"
import { useEffect } from "react"

interface TiptapViewerProps {
    value: string
    className?: string
}

export function TiptapViewer({ value, className }: TiptapViewerProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2],
                },
            }),
        ],
        content: value,
        editable: false,
        editorProps: {
            attributes: {
                class:
                    "prose prose-invert max-w-none p-0 text-sm leading-relaxed text-zinc-400 min-h-0 focus:outline-none font-sans [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_p]:text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:marker:text-zinc-400",
            },
        },
    })

    // Keep the viewer in sync when the HTML comes from async data.
    useEffect(() => {
        if (!editor) return
        if (value !== editor.getHTML()) {
            editor.commands.setContent(value)
        }
    }, [editor, value])

    if (!editor) return null

    return <EditorContent editor={editor} className={className} />
}

