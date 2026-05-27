"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    IconPlus,
    IconTrash,
    IconLoader,
    IconUsers,
    IconEdit,
    IconLink,
    IconChartBar,
    IconFileText,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useMyForms, useCreateForm, useArchiveForm } from "~/hooks/api/forms";
import { ShareFormDialog } from "~/components/forms/share-form-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

export function FormsListConsole() {
    const { forms, isLoading, refetch: refetchForms } = useMyForms({ limit: 50 });
    const createForm = useCreateForm();
    const archiveForm = useArchiveForm();
    const [shareForm, setShareForm] = useState<{ slug: string; title: string } | null>(null);

    const activeForms = useMemo(() => forms.filter((f) => f.status !== "ARCHIVED"), [forms]);

    const handleCreateForm = async () => {
        try {
            const created = await createForm.mutateAsync({
                title: "",
                description: null,
                visibility: "UNLISTED",
                fields: [],
            });
            toast.success("Blank form created");
            await refetchForms();
            window.location.href = `/dashboard/forms/${created.id}/builder`;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create form");
        }
    };

    const handleArchiveForm = async (id: string) => {
        try {
            await archiveForm.mutateAsync({ id });
            toast.success("Form deleted successfully");
            await refetchForms();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete form");
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <IconLoader className="size-8 text-muted-foreground animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading forms...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="space-y-6 p-6 w-full max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">My Forms</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage and view analytics for your forms
                    </p>
                </div>

                <Button
                    onClick={handleCreateForm}
                    disabled={createForm.isPending}
                    className="cursor-pointer"
                >
                    <IconPlus className="size-4 mr-1.5" />
                    Create Form
                </Button>
            </div>

            {/* Empty State */}
            {activeForms.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-16 text-center max-w-md mx-auto space-y-4">
                    <IconFileText className="size-12 text-muted-foreground mx-auto" />
                    <h3 className="text-base font-semibold">No Active Forms</h3>
                    <p className="text-sm text-muted-foreground">
                        Create your first form to start gathering responses.
                    </p>
                    <Button onClick={handleCreateForm} className="cursor-pointer">
                        <IconPlus className="size-4 mr-1.5" />
                        Create Form
                    </Button>
                </div>
            ) : (
                <section className="grid gap-4 xl:grid-cols-3">
                    {activeForms.map((item) => (
                        <article
                            key={item.id}
                            className="bg-card border border-zinc-800 rounded-md p-5 flex flex-col gap-5 transition-colors hover:border-zinc-600"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950">
                                        <IconFileText className="size-4 text-zinc-300" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`rounded-md px-3 py-1 text-xs font-semibold ${item.status === "PUBLISHED"
                                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                                }`}
                                        >
                                            {item.status === "PUBLISHED" ? "Published" : "Draft"}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="rounded-md border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-semibold text-zinc-300"
                                        >
                                            {item.visibility === "PUBLIC" ? "Listed" : "Unlisted"}
                                        </Badge>
                                    </div>

                                </div>

                                <div className="flex items-center gap-2">

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="cursor-pointer rounded-md border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                                                aria-label="Delete form"
                                            >
                                                <IconTrash className="size-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-card border-border rounded-xl max-w-sm">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-base">
                                                    Delete form?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-sm text-muted-foreground">
                                                    This will permanently delete &quot;{item.title || "Untitled form"}&quot; and all associated responses. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-4 gap-2">
                                                <AlertDialogCancel className="cursor-pointer">
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleArchiveForm(item.id)}
                                                    className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-semibold leading-tight tracking-tight line-clamp-2">
                                    {item.title || "Untitled form"}
                                </h2>
                            </div>

                            <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-md bg-zinc-900">
                                            <IconUsers className="size-5 text-zinc-400" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                                                Responses collected
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-3xl font-semibold text-zinc-100">
                                        {item.submissionCount}
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-2 border-t border-zinc-800 pt-4">
                                <Button
                                    asChild
                                    variant="default"
                                    size="sm"
                                    className="h-11 w-full cursor-pointer rounded-md border border-white bg-white px-4 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-zinc-100 hover:text-zinc-950 [&_svg]:text-zinc-950"
                                >
                                    <Link href={`/dashboard/forms/${item.id}/builder`}>
                                        <IconEdit className="size-4 mr-1" />
                                        Open builder
                                    </Link>
                                </Button>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShareForm({ slug: item.slug, title: item.title })}
                                        className="h-10 cursor-pointer rounded-md border-zinc-700 bg-zinc-950 text-sm text-zinc-100 hover:bg-zinc-900 hover:text-white"
                                    >
                                        <IconLink className="size-4 mr-1 text-amber-300" />
                                        Share
                                    </Button>

                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-10 cursor-pointer rounded-md border-zinc-700 bg-zinc-950 text-sm text-zinc-100 hover:bg-zinc-900 hover:text-white"
                                    >
                                        <Link href={`/dashboard/forms/${item.id}/analytics`}>
                                            <IconChartBar className="size-4 mr-1 text-emerald-300" />
                                            Analytics
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            <ShareFormDialog
                isOpen={shareForm !== null}
                onClose={() => setShareForm(null)}
                formTitle={shareForm?.title ?? ""}
                slug={shareForm?.slug ?? ""}
            />
        </main>
    );
}
