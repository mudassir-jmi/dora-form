"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    IconArrowLeft,
    IconLoader,
    IconCheck,
    IconAlertCircle,
    IconEye,
    IconSettings,
    IconTools,
    IconShare3,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {
    useForm,
    useUpdateForm,
    usePublishForm,
    useUnpublishForm,
    useFormAnalytics,
} from "~/hooks/api/forms";
import { ShareFormDialog } from "~/components/forms/share-form-dialog";

interface FormOverviewConsoleProps {
    formId: string;
}

export function FormOverviewConsole({ formId }: FormOverviewConsoleProps) {
    const { form, isLoading, error, refetch } = useForm(formId);
    const updateForm = useUpdateForm();
    const publishForm = usePublishForm();
    const unpublishForm = useUnpublishForm();
    const { analytics } = useFormAnalytics(formId, Boolean(formId));

    const [isShareOpen, setIsShareOpen] = useState(false);
    const [draftTitle, setDraftTitle] = useState("");
    const [draftDescription, setDraftDescription] = useState("");
    const [draftVisibility, setDraftVisibility] = useState<"PUBLIC" | "UNLISTED">("UNLISTED");
    const [syncStatus, setSyncStatus] = useState<"SYNCED" | "SYNCING" | "ERROR">("SYNCED");

    // Sync inputs with loaded active form
    useEffect(() => {
        if (form) {
            setDraftTitle(form.title);
            setDraftDescription(form.description ?? "");
            setDraftVisibility(form.visibility);
        }
    }, [form]);

    const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleMetadataChange = (updatedFields: {
        title?: string;
        description?: string;
        visibility?: "PUBLIC" | "UNLISTED";
    }) => {
        setSyncStatus("SYNCING");
        if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

        autoSaveTimeout.current = setTimeout(async () => {
            if (!formId) return;
            try {
                await updateForm.mutateAsync({
                    id: formId,
                    title: updatedFields.title !== undefined ? updatedFields.title : draftTitle,
                    description: updatedFields.description ?? draftDescription,
                    visibility: updatedFields.visibility ?? draftVisibility,
                });
                setSyncStatus("SYNCED");
            } catch (err) {
                setSyncStatus("ERROR");
                toast.error("Failed to auto-save settings");
            }
        }, 800);
    };

    const handleVisibilityChange = async (value: "PUBLIC" | "UNLISTED") => {
        setDraftVisibility(value);
        setSyncStatus("SYNCING");
        try {
            await updateForm.mutateAsync({
                id: formId,
                visibility: value,
            });
            setSyncStatus("SYNCED");
            toast.success(`Visibility updated to ${value}`);
        } catch (err) {
            setSyncStatus("ERROR");
            toast.error("Failed to auto-save visibility");
        }
    };

    const handlePublish = async () => {
        try {
            await publishForm.mutateAsync({ id: formId, visibility: draftVisibility });
            toast.success("Form published successfully!");
            await refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to publish");
        }
    };

    const handleUnpublish = async () => {
        try {
            await unpublishForm.mutateAsync({ id: formId });
            toast.success("Form reverted to draft");
            await refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to unpublish");
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <IconLoader className="size-8 text-muted-foreground animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading form...</p>
                </div>
            </main>
        );
    }

    if (error || !form) {
        return (
            <main className="min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <IconAlertCircle className="size-12 text-destructive mx-auto" />
                    <h2 className="text-base font-semibold">Form not found</h2>
                    <p className="text-sm text-muted-foreground">{error?.message ?? "This form was not found."}</p>
                    <Button asChild variant="outline" className="cursor-pointer">
                        <Link href="/dashboard/forms">
                            <IconArrowLeft className="size-4 mr-2" />
                            Back to forms
                        </Link>
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="space-y-6 p-6 w-full max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="cursor-pointer">
                        <Link href="/dashboard/forms">
                            <IconArrowLeft className="size-4" />
                        </Link>
                    </Button>

                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">{form.title || "Untitled form"}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            {syncStatus === "SYNCING" ? (
                                <span className="text-xs text-amber-400 flex items-center gap-1">
                                    <IconLoader className="size-3 animate-spin" />
                                    Saving...
                                </span>
                            ) : syncStatus === "ERROR" ? (
                                <span className="text-xs text-destructive flex items-center gap-1">
                                    <IconAlertCircle className="size-3" />
                                    Save error
                                </span>
                            ) : (
                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                    <IconCheck className="size-3" />
                                    Saved
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {form.status === "PUBLISHED" ? (
                        <Button onClick={handleUnpublish} variant="outline" size="sm" className="cursor-pointer">
                            Make Draft
                        </Button>
                    ) : (
                        <Button onClick={handlePublish} size="sm" className="cursor-pointer">
                            Publish
                        </Button>
                    )}

                    <Button
                        onClick={() => window.open(`/f/${form.slug}?preview=true`, "_blank")}
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                    >
                        <IconEye className="size-4 mr-1.5" />
                        Preview
                    </Button>
                </div>
            </header>

            {/* Sub-nav tabs */}
            <div className="flex bg-card border border-border rounded-lg p-1">
                <Link
                    href={`/dashboard/forms/${formId}`}
                    className="flex-1 text-center py-2 text-xs font-medium rounded-md transition bg-background text-foreground"
                >
                    Overview
                </Link>
                <Link
                    href={`/dashboard/forms/${formId}/builder`}
                    className="flex-1 text-center py-2 text-xs font-medium rounded-md transition text-muted-foreground hover:text-foreground"
                >
                    Builder
                </Link>
                <Link
                    href={`/dashboard/forms/${formId}/analytics`}
                    className="flex-1 text-center py-2 text-xs font-medium rounded-md transition text-muted-foreground hover:text-foreground"
                >
                    Analytics
                </Link>
            </div>

            {/* 2-column layout */}
            <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
                {/* Left: Settings */}
                <aside className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-1.5 pb-3 border-b border-border">
                            <IconSettings className="size-4 text-muted-foreground" />
                            Settings
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="form-title" className="text-xs text-muted-foreground">Title</Label>
                                <Input
                                    id="form-title"
                                    value={draftTitle}
                                    placeholder="Name your form"
                                    onChange={(e) => {
                                        setDraftTitle(e.target.value);
                                        handleMetadataChange({ title: e.target.value });
                                    }}
                                    className="text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="form-desc" className="text-xs text-muted-foreground">Description</Label>
                                <Textarea
                                    id="form-desc"
                                    value={draftDescription}
                                    onChange={(e) => {
                                        setDraftDescription(e.target.value);
                                        handleMetadataChange({ description: e.target.value });
                                    }}
                                    rows={4}
                                    className="text-sm resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Visibility</Label>
                                <Select
                                    value={draftVisibility}
                                    onValueChange={(val) => handleVisibilityChange(val as "PUBLIC" | "UNLISTED")}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PUBLIC">Public</SelectItem>
                                        <SelectItem value="UNLISTED">Unlisted</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-border space-y-2">
                            <Button onClick={() => setIsShareOpen(true)} variant="outline" size="sm" className="w-full cursor-pointer">
                                <IconShare3 className="size-3.5 mr-1.5" />
                                Share Form
                            </Button>
                            <Button asChild variant="outline" size="sm" className="w-full cursor-pointer">
                                <Link href={`/f/${form.slug}`} target="_blank">
                                    <IconEye className="size-3.5 mr-1.5" />
                                    Open Live Form
                                </Link>
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Right: Metrics & Questions */}
                <section className="space-y-4">
                    {/* Metrics */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard label="Total Submissions" value={(analytics?.totalSubmissions ?? 0).toString()} />
                        <MetricCard label="Response Limit" value={analytics?.responseLimit?.toString() ?? "∞"} />
                        <MetricCard label="Remaining" value={analytics?.remainingResponses?.toString() ?? "∞"} />
                        <MetricCard label="Completion Rate" value={`${Math.round((analytics?.completionRate ?? 0) * 100)}%`} />
                    </div>

                    {/* Questions outline */}
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div>
                                <h3 className="text-sm font-medium">Questions</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {form.fields.length} fields in this form
                                </p>
                            </div>

                            <Button asChild variant="outline" size="sm" className="cursor-pointer">
                                <Link href={`/dashboard/forms/${formId}/builder`}>
                                    <IconTools className="size-3.5 mr-1.5" />
                                    Open Builder
                                </Link>
                            </Button>
                        </div>

                        {form.fields.length === 0 ? (
                            <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground rounded-lg">
                                No questions yet. Open the builder to add fields.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {form.fields.map((field, idx) => (
                                    <div
                                        key={field.id}
                                        className="bg-background border border-border rounded-lg p-3.5 flex items-center gap-3"
                                    >
                                        <span className="text-xs font-semibold text-muted-foreground w-6 text-right shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium truncate">{field.label}</span>
                                                <Badge variant="secondary" className="text-[10px] shrink-0">{field.type}</Badge>
                                                {field.isRequired && (
                                                    <span className="text-[10px] text-amber-400 shrink-0">Required</span>
                                                )}
                                            </div>
                                            {field.placeholder && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    Placeholder: {field.placeholder}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Link
                            href={`/dashboard/forms/${formId}/builder`}
                            className="bg-card border border-border p-5 rounded-xl hover:border-zinc-700 transition group"
                        >
                            <h4 className="text-sm font-medium group-hover:text-foreground transition">
                                Questions Builder →
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                Add options, validation, and reorder fields with drag-and-drop.
                            </p>
                        </Link>

                        <Link
                            href={`/dashboard/forms/${formId}/analytics`}
                            className="bg-card border border-border p-5 rounded-xl hover:border-zinc-700 transition group"
                        >
                            <h4 className="text-sm font-medium group-hover:text-foreground transition">
                                Submissions &amp; Analytics →
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                View submissions table, download CSV exports, and review metrics.
                            </p>
                        </Link>
                    </div>
                </section>
            </div>

            <ShareFormDialog
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                formTitle={form.title}
                slug={form.slug}
            />
        </main>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
    );
}
