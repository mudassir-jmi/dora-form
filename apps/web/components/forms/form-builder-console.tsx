"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    IconPlus,
    IconTrash,
    IconArrowLeft,
    IconCheck,
    IconLoader,
    IconAlertCircle,
    IconX,
    IconGripVertical,
    IconEdit,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import {
    useCreateField,
    useForm,
    usePublishForm,
    useUnpublishForm,
    useUpdateForm,
    useUpdateField,
    useDeleteField,
    useReorderFields,
} from "~/hooks/api/forms";
import type { RouterInputs } from "@repo/trpc/client";
import { TiptapEditor } from "~/components/ui/tiptap-editor";
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

type FieldType = RouterInputs["form"]["createField"]["type"];
type SelectMode = RouterInputs["form"]["createField"]["selectMode"];

const fieldTypes: Array<{ value: FieldType; label: string }> = [
    { value: "TEXT", label: "Short Text" },
    { value: "LONG_TEXT", label: "Long Text" },
    { value: "EMAIL", label: "Email Address" },
    { value: "NUMBER", label: "Number Input" },
    { value: "SELECT", label: "Multiple Choice Options" },
    { value: "CHECKBOX", label: "Checkbox Field" },
    { value: "RATING", label: "Rating Scale (1-5)" },
    { value: "DATE", label: "Date Picker" },
    { value: "FILE_URL", label: "Secure File Upload" },
    { value: "YES_NO", label: "Yes / No Toggle" },
];

interface FormBuilderConsoleProps {
    formId: string;
}

export function FormBuilderConsole({ formId }: FormBuilderConsoleProps) {
    const { form, isLoading: isFormLoading, error: formError, refetch } = useForm(formId);

    const updateForm = useUpdateForm();
    const publishForm = usePublishForm();
    const unpublishForm = useUnpublishForm();
    const createField = useCreateField();
    const updateField = useUpdateField();
    const deleteField = useDeleteField();
    const reorderFields = useReorderFields();

    const [draftTitle, setDraftTitle] = useState("");
    const [draftDescription, setDraftDescription] = useState("");
    const [draftVisibility, setDraftVisibility] = useState<"PUBLIC" | "UNLISTED">("UNLISTED");
    const [syncStatus, setSyncStatus] = useState<"SYNCED" | "SYNCING" | "ERROR">("SYNCED");

    // Popup Modal States for Field Editor
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

    // Field values inside Modal
    const [fieldLabel, setFieldLabel] = useState("");
    const [fieldType, setFieldType] = useState<FieldType>("TEXT");
    const [fieldPlaceholder, setFieldPlaceholder] = useState("");
    const [fieldIsRequired, setFieldIsRequired] = useState(false);
    const [fieldSelectMode, setFieldSelectMode] = useState<SelectMode>("SINGLE");
    const [fieldOptions, setFieldOptions] = useState<Array<{ id: string; label: string; value: string; order: number; isDefault: boolean }>>([]);

    // Validations
    const [validationMin, setValidationMin] = useState<number | undefined>(undefined);
    const [validationMax, setValidationMax] = useState<number | undefined>(undefined);
    const [validationMinLength, setValidationMinLength] = useState<number | undefined>(undefined);
    const [validationMaxLength, setValidationMaxLength] = useState<number | undefined>(undefined);

    // Sync inputs with loaded active form
    useEffect(() => {
        if (form) {
            setDraftTitle(form.title);
            setDraftDescription(form.description ?? "");
            setDraftVisibility(form.visibility);
        }
    }, [form]);

    // Sensors for drag-and-drop to prevent blocking simple clicks on inputs/buttons
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Debounced Auto-Save
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

    const handlePublishStatusChange = async (status: "PUBLISHED" | "DRAFT") => {
        setSyncStatus("SYNCING");
        try {
            if (status === "PUBLISHED") {
                await publishForm.mutateAsync({ id: formId, visibility: draftVisibility });
                toast.success("Form status updated to Published");
            } else {
                await unpublishForm.mutateAsync({ id: formId });
                toast.success("Form status updated to Draft");
            }
            setSyncStatus("SYNCED");
            await refetch();
        } catch (err) {
            setSyncStatus("ERROR");
            toast.error("Failed to update form status");
        }
    };

    // Open Modal to Add a Field
    const openAddFieldModal = () => {
        setEditingFieldId(null);
        setFieldLabel("New Question Prompt");
        setFieldType("TEXT");
        setFieldPlaceholder("e.g. Jane Doe");
        setFieldIsRequired(true);
        setFieldSelectMode("SINGLE");
        setFieldOptions([]);
        setValidationMin(undefined);
        setValidationMax(undefined);
        setValidationMinLength(undefined);
        setValidationMaxLength(undefined);
        setIsFieldModalOpen(true);
    };

    // Open Modal to Edit an Existing Field
    const openEditFieldModal = (field: any) => {
        setEditingFieldId(field.id);
        setFieldLabel(field.label);
        setFieldType(field.type);
        setFieldPlaceholder(field.placeholder ?? "");
        setFieldIsRequired(field.isRequired);
        setFieldSelectMode(field.selectMode ?? "SINGLE");
        setFieldOptions(field.options ?? []);

        const val = field.validation as any;
        const isTextField = field.type === "TEXT" || field.type === "LONG_TEXT";
        const isNumericField = field.type === "NUMBER";
        setValidationMin(isNumericField ? val?.min : undefined);
        setValidationMax(isNumericField ? val?.max : undefined);
        setValidationMinLength(
            isTextField
                ? (val?.minLength ?? val?.min)
                : undefined
        );
        setValidationMaxLength(
            isTextField
                ? (val?.maxLength ?? val?.max)
                : undefined
        );

        setIsFieldModalOpen(true);
    };

    const handleTypeChange = (type: FieldType) => {
        setFieldType(type);
        if (type === "TEXT") {
            setFieldPlaceholder("e.g. Jane Doe");
        } else if (type === "EMAIL") {
            setFieldPlaceholder("jane.doe@example.com");
        } else if (type === "LONG_TEXT") {
            setFieldPlaceholder("Type your detailed response here...");
        } else if (type === "NUMBER") {
            setFieldPlaceholder("e.g. 25");
        } else if (type === "FILE_URL") {
            setFieldPlaceholder("Upload a JPG, PNG, PDF, or MP4");
        } else if (type === "RATING") {
            setFieldPlaceholder("1-5 rating");
        } else {
            setFieldPlaceholder("");
        }
    };

    // Save changes inside Modal (Done clicked)
    const handleSaveFieldFromModal = async () => {
        if (!form) return;
        if (!fieldLabel.trim()) {
            toast.error("Question label is required");
            return;
        }

        const validation: Record<string, any> = {};
        if (fieldType === "NUMBER") {
            if (validationMin !== undefined) validation.min = validationMin;
            if (validationMax !== undefined) validation.max = validationMax;
        }
        if (fieldType === "TEXT" || fieldType === "LONG_TEXT") {
            if (validationMinLength !== undefined) validation.minLength = validationMinLength;
            if (validationMaxLength !== undefined) validation.maxLength = validationMaxLength;
        }

        setSyncStatus("SYNCING");
        try {
            if (editingFieldId) {
                // Edit existing field
                await updateField.mutateAsync({
                    id: editingFieldId,
                    formId: form.id,
                    label: fieldLabel,
                    type: fieldType,
                    placeholder: fieldPlaceholder,
                    isRequired: fieldIsRequired,
                    selectMode: fieldType === "SELECT" ? fieldSelectMode : null,
                    options: fieldType === "SELECT" ? fieldOptions : [],
                    validation,
                });
                toast.success("Question updated successfully");
            } else {
                // Add new field
                await createField.mutateAsync({
                    formId: form.id,
                    label: fieldLabel,
                    type: fieldType,
                    placeholder: fieldPlaceholder,
                    isRequired: fieldIsRequired,
                    selectMode: fieldType === "SELECT" ? fieldSelectMode : null,
                    options: fieldType === "SELECT" ? fieldOptions : [],
                    validation,
                    order: form.fields.length,
                });
                toast.success("New question added");
            }
            setSyncStatus("SYNCED");
            setIsFieldModalOpen(false);
            await refetch();
        } catch (err) {
            setSyncStatus("ERROR");
            toast.error(err instanceof Error ? err.message : "Failed to save question");
        }
    };

    // Delete question
    const handleDeleteField = async (fieldId: string) => {
        if (!form) return;

        setSyncStatus("SYNCING");
        try {
            await deleteField.mutateAsync({
                id: fieldId,
                formId: form.id,
            });
            setSyncStatus("SYNCED");
            toast.success("Question deleted");
            await refetch();
        } catch (err) {
            setSyncStatus("ERROR");
            toast.error(err instanceof Error ? err.message : "Failed to delete question");
        }
    };

    // Drag-and-drop horizontal swap reordering event handler
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !form) return;

        if (active.id !== over.id) {
            const oldIndex = form.fields.findIndex((f) => f.id === active.id);
            const newIndex = form.fields.findIndex((f) => f.id === over.id);

            const reordered = arrayMove(form.fields, oldIndex, newIndex);
            setSyncStatus("SYNCING");
            try {
                await reorderFields.mutateAsync({
                    formId: form.id,
                    fieldIds: reordered.map((f) => f.id),
                });
                setSyncStatus("SYNCED");
                toast.success("Questions reordered");
                await refetch();
            } catch (err) {
                setSyncStatus("ERROR");
                toast.error("Failed to reorder questions");
            }
        }
    };

    if (isFormLoading) {
        return (
            <main className="min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <IconLoader className="size-8 text-muted-foreground animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading builder...</p>
                </div>
            </main>
        );
    }

    if (formError || !form) {
        return (
            <main className="min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <IconAlertCircle className="size-12 text-destructive mx-auto" />
                    <h2 className="text-base font-semibold">Form not found</h2>
                    <p className="text-sm text-muted-foreground">{formError?.message ?? "This form was not found."}</p>
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
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="cursor-pointer">
                        <Link href="/dashboard/forms">
                            <IconArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold tracking-tight truncate max-w-[400px]">
                        {draftTitle || "Create Form"}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Dropdown */}
                    <Select
                        value={form.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"}
                        onValueChange={(val) => handlePublishStatusChange(val as any)}
                    >
                        <SelectTrigger className="text-sm h-9 w-36 cursor-pointer">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DRAFT" className="text-sm cursor-pointer">Draft</SelectItem>
                            <SelectItem value="PUBLISHED" className="text-sm cursor-pointer">Published</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Save status */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-2 bg-card border border-border rounded-lg">
                        {syncStatus === "SYNCING" ? (
                            <>
                                <IconLoader className="size-3.5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <IconCheck className="size-3.5 text-emerald-400" />
                                Saved
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* 2-column workspace */}
            <div className="grid gap-6 xl:grid-cols-[350px_1fr]">

                {/* Left sidebar: Form Details */}
                <aside className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4 sticky top-24 h-fit">
                        <h3 className="text-sm font-medium pb-3 border-b border-border">
                            Form Details
                        </h3>

                        <div className="space-y-4">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="form-title" className="text-xs text-muted-foreground">Name</Label>
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

                            {/* Description with Tiptap */}
                            <div className="space-y-2">
                                <Label htmlFor="form-desc" className="text-xs text-muted-foreground">Description</Label>
                                <TiptapEditor
                                    value={draftDescription}
                                    onChange={(val) => {
                                        setDraftDescription(val);
                                        handleMetadataChange({ description: val });
                                    }}
                                />
                            </div>

                            {/* Explore Listing switch */}
                            <div className="flex items-center justify-between p-3 border border-border bg-background rounded-lg">
                                <div className="space-y-0.5 pr-3">
                                    <Label className="text-xs font-medium cursor-pointer select-none">Public Explore Listing</Label>
                                    <p className="text-[11px] text-muted-foreground leading-normal">
                                        Allow others to discover this form in Explore.
                                    </p>
                                </div>
                                <Switch
                                    checked={draftVisibility === "PUBLIC"}
                                    onCheckedChange={(checked) => {
                                        const nextVal = checked ? "PUBLIC" : "UNLISTED";
                                        setDraftVisibility(nextVal);
                                        handleMetadataChange({ visibility: nextVal });
                                    }}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right: Questions */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                        <h2 className="text-lg font-semibold tracking-tight">Questions</h2>
                        <Button onClick={openAddFieldModal} variant="outline" size="sm" className="cursor-pointer">
                            <IconPlus className="size-4 mr-1.5" />
                            Add Question
                        </Button>
                    </div>

                    {/* Question sortable canvas */}
                    {form.fields.length === 0 ? (
                        <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center text-sm text-muted-foreground">
                            No questions yet. Click &quot;Add Question&quot; to build your first field.
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis]}
                        >
                            <SortableContext
                                items={form.fields.map((f) => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {form.fields.map((field, idx) => (
                                        <SortableQuestionItem
                                            key={field.id}
                                            field={field}
                                            idx={idx}
                                            openEditFieldModal={openEditFieldModal}
                                            handleDeleteField={handleDeleteField}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </section>
            </div>

            {/* POPUP QUESTION EDITOR MODAL */}
            {isFieldModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-border max-w-lg w-full rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold">
                                    {editingFieldId ? "Edit Question" : "New Question"}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {editingFieldId ? "Modify question properties" : "Add a new field to your form"}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsFieldModalOpen(false)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                            >
                                <IconX className="size-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Type Select */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Question Type</Label>
                                <Select
                                    value={fieldType}
                                    onValueChange={(val) => handleTypeChange(val as FieldType)}
                                    disabled={Boolean(editingFieldId)}
                                >
                                    <SelectTrigger className="text-sm cursor-pointer">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fieldTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value} className="text-sm cursor-pointer">
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Label Input */}
                            <div className="space-y-2">
                                <Label htmlFor="modal-label" className="text-xs text-muted-foreground">Question Label</Label>
                                <Input
                                    id="modal-label"
                                    value={fieldLabel}
                                    onChange={(e) => setFieldLabel(e.target.value)}
                                    placeholder="e.g. Enter your corporate email address"
                                    className="text-sm"
                                />
                            </div>

                            {/* Placeholder */}
                            {fieldType !== "CHECKBOX" && fieldType !== "YES_NO" && fieldType !== "DATE" && fieldType !== "SELECT" && fieldType !== "RATING" && (
                                <div className="space-y-2">
                                    <Label htmlFor="modal-placeholder" className="text-xs text-muted-foreground">Placeholder</Label>
                                    <Input
                                        id="modal-placeholder"
                                        value={fieldPlaceholder}
                                        onChange={(e) => setFieldPlaceholder(e.target.value)}
                                        placeholder="e.g. m@example.com"
                                        className="text-sm"
                                    />
                                </div>
                            )}

                            {/* Required switch */}
                            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-background">
                                <Switch
                                    checked={fieldIsRequired}
                                    onCheckedChange={setFieldIsRequired}
                                    className="cursor-pointer"
                                />
                                <Label className="text-sm cursor-pointer select-none">
                                    Required field
                                </Label>
                            </div>

                            {/* SELECT Options */}
                            {fieldType === "SELECT" && (
                                <div className="border border-border rounded-lg p-4 bg-background space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-muted-foreground">Choice Options</Label>
                                        <Select
                                            value={fieldSelectMode ?? "SINGLE"}
                                            onValueChange={(val) => setFieldSelectMode(val as any)}
                                        >
                                            <SelectTrigger className="text-xs h-7 w-28 cursor-pointer">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SINGLE" className="text-xs cursor-pointer">Single</SelectItem>
                                                <SelectItem value="MULTIPLE" className="text-xs cursor-pointer">Multiple</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        {fieldOptions.map((opt, oIdx) => (
                                            <div key={opt.id || oIdx} className="flex gap-2 items-center">
                                                <Input
                                                    value={opt.label}
                                                    onChange={(e) => {
                                                        const updated = [...fieldOptions];
                                                        updated[oIdx] = {
                                                            ...updated[oIdx]!,
                                                            label: e.target.value,
                                                            value: e.target.value.toLowerCase().replace(/ /g, "_"),
                                                        };
                                                        setFieldOptions(updated);
                                                    }}
                                                    className="text-sm h-8"
                                                    placeholder="Option label"
                                                />
                                                <button
                                                    onClick={() => {
                                                        setFieldOptions(fieldOptions.filter((_, idx) => idx !== oIdx));
                                                    }}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition cursor-pointer"
                                                >
                                                    <IconTrash className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setFieldOptions([
                                                ...fieldOptions,
                                                {
                                                    id: `temp_${Date.now()}`,
                                                    label: `Option ${fieldOptions.length + 1}`,
                                                    value: `option_${fieldOptions.length + 1}`,
                                                    order: fieldOptions.length,
                                                    isDefault: false,
                                                },
                                            ]);
                                        }}
                                        className="text-xs cursor-pointer"
                                    >
                                        <IconPlus className="size-3 mr-1" />
                                        Add Option
                                    </Button>
                                </div>
                            )}

                            {/* NUMBER Validation */}
                            {fieldType === "NUMBER" && (
                                <div className="grid gap-4 grid-cols-2 p-4 border border-border rounded-lg bg-background">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Min Value</Label>
                                        <Input
                                            type="number"
                                            value={validationMin !== undefined ? validationMin : ""}
                                            onChange={(e) => setValidationMin(e.target.value === "" ? undefined : Number(e.target.value))}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Max Value</Label>
                                        <Input
                                            type="number"
                                            value={validationMax !== undefined ? validationMax : ""}
                                            onChange={(e) => setValidationMax(e.target.value === "" ? undefined : Number(e.target.value))}
                                            className="text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TEXT Validation */}
                            {(fieldType === "TEXT" || fieldType === "LONG_TEXT") && (
                                <div className="grid gap-4 grid-cols-2 p-4 border border-border rounded-lg bg-background">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Min Characters</Label>
                                        <Input
                                            type="number"
                                            value={validationMinLength !== undefined ? validationMinLength : ""}
                                            onChange={(e) => setValidationMinLength(e.target.value === "" ? undefined : Number(e.target.value))}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Max Characters</Label>
                                        <Input
                                            type="number"
                                            value={validationMaxLength !== undefined ? validationMaxLength : ""}
                                            onChange={(e) => setValidationMaxLength(e.target.value === "" ? undefined : Number(e.target.value))}
                                            className="text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                            <Button
                                onClick={() => setIsFieldModalOpen(false)}
                                variant="outline"
                                className="cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveFieldFromModal}
                                disabled={createField.isPending || updateField.isPending}
                                className="cursor-pointer"
                            >
                                {(createField.isPending || updateField.isPending) && (
                                    <IconLoader className="size-3.5 animate-spin mr-1.5" />
                                )}
                                {editingFieldId ? "Save Changes" : "Add Question"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

interface SortableQuestionItemProps {
    field: any;
    idx: number;
    openEditFieldModal: (field: any) => void;
    handleDeleteField: (id: string) => void;
}

function SortableQuestionItem({
    field,
    idx,
    openEditFieldModal,
    handleDeleteField,
}: SortableQuestionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 2 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-card border ${isDragging ? "border-zinc-600" : "border-border"} hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between gap-4 transition-colors`}
        >
            <div className="min-w-0 flex items-start gap-3">
                {/* Drag handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 mt-0.5"
                    title="Drag to reorder"
                >
                    <IconGripVertical className="size-4" />
                </button>

                <div className="min-w-0 space-y-0.5">
                    <span className="text-xs text-muted-foreground block">
                        Question {idx + 1}
                    </span>
                    <h4 className="text-sm font-medium line-clamp-1">{field.label}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{field.type}</Badge>
                        <span className={`text-[10px] ${field.isRequired ? "text-amber-400" : "text-muted-foreground"}`}>
                            {field.isRequired ? "Required" : "Optional"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditFieldModal(field)}
                    className="text-xs cursor-pointer"
                >
                    <IconEdit className="size-3.5 mr-1" />
                    Edit
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition cursor-pointer"
                            title="Delete Question"
                        >
                            <IconTrash className="size-4" />
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border rounded-xl max-w-sm">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-base">
                                Delete Question?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-muted-foreground">
                                This will permanently delete this question and all collected responses for it. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleDeleteField(field.id)}
                                className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
