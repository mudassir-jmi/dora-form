"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    IconArrowLeft,
    IconDownload,
    IconLoader,
    IconAlertCircle,
    IconEye,
    IconChartBar,
    IconDatabase,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    useForm,
    useFormAnalytics,
    useFormResponses,
} from "~/hooks/api/forms";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";

interface FormAnalyticsConsoleProps {
    formId: string;
}

export function FormAnalyticsConsole({ formId }: FormAnalyticsConsoleProps) {
    const { form, isLoading: isFormLoading, error: formError, refetch } = useForm(formId);
    const { analytics, isLoading: isAnalyticsLoading, error: analyticsError } = useFormAnalytics(formId, Boolean(formId));
    const { responses, isLoading: isResponsesLoading, error: responsesError } = useFormResponses({ formId, limit: 100 }, Boolean(formId));

    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);

    const handleCsvExport = () => {
        if (!form || responses.length === 0) {
            toast.error("No responses available to export.");
            return;
        }

        const headers = ["submittedAt", "respondentEmail", ...form.fields.map((f) => f.labelKey)];
        const rows = responses.map((res) => {
            const answerMap = new Map(res.answers.map((a) => [a.fieldKey, a.value]));
            return [
                res.submittedAt ?? "",
                res.respondentEmail ?? "anonymous",
                ...form.fields.map((f) => {
                    const val = answerMap.get(f.labelKey);
                    if (val === undefined || val === null) return "";
                    return Array.isArray(val) ? `"${val.join(", ")}"` : `"${String(val).replace(/"/g, '""')}"`;
                }),
            ];
        });

        const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `form_responses_${form.slug}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV exported successfully!");
    };

    // Prepare chart data format
    const chartData = useMemo(() => {
        if (!analytics?.responsesByDay || analytics.responsesByDay.length === 0) {
            return [{ date: "No data", Submissions: 0 }];
        }
        return analytics.responsesByDay.map((d) => ({
            date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            Submissions: d.count,
        }));
    }, [analytics]);

    const isLoading = isFormLoading || isAnalyticsLoading || isResponsesLoading;
    const error = formError || analyticsError || responsesError;

    if (isLoading) {
        return (
            <main className="min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <IconLoader className="size-8 text-muted-foreground animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading analytics...</p>
                </div>
            </main>
        );
    }

    if (error || !form) {
        return (
            <main className="min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <IconAlertCircle className="size-12 text-destructive mx-auto" />
                    <h2 className="text-base font-semibold">Error loading analytics</h2>
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
        <main className="space-y-6 p-6 w-full max-w-7xl mx-auto min-w-0 animate-in fade-in duration-300">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="cursor-pointer">
                        <Link href="/dashboard/forms">
                            <IconArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight truncate max-w-[300px]">
                            {form.title || "Untitled form"}
                        </h1>
                        <p className="text-xs text-muted-foreground">Analytics & Responses</p>
                    </div>
                </div>

                <Button
                    onClick={() => window.open(`/f/${form.slug}?preview=true`, "_blank")}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                >
                    <IconEye className="size-4 mr-1.5" />
                    Preview
                </Button>
            </header>

            {/* Metrics */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total Submissions" value={(analytics?.totalSubmissions ?? 0).toString()} />
                <MetricCard label="Response Limit" value={analytics?.responseLimit?.toString() ?? "∞"} />
                <MetricCard label="Remaining" value={analytics?.remainingResponses?.toString() ?? "∞"} />
                <MetricCard label="Completion Rate" value={`${Math.round((analytics?.completionRate ?? 0) * 100)}%`} />
            </section>

            {/* Chart & Table */}
            <section>
                {/* Responses Table */}
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                        <div>
                            <h2 className="text-sm font-medium flex items-center gap-2">
                                <IconDatabase className="size-4 text-muted-foreground" />
                                Responses
                                <Badge 
                                    variant="secondary" 
                                    className="ml-2 cursor-pointer hover:bg-primary/20 transition-colors"
                                    onClick={() => setIsTrendModalOpen(true)}
                                >
                                    <IconChartBar className="size-3 mr-1" />
                                    Trends
                                </Badge>
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{responses.length} total responses</p>
                        </div>
                        <Button
                            onClick={handleCsvExport}
                            disabled={responses.length === 0}
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                        >
                            <IconDownload className="size-3.5 mr-1.5" />
                            CSV
                        </Button>
                    </div>

                    <div className="overflow-x-auto overflow-y-auto w-full max-w-full rounded-lg border border-border bg-background max-h-[260px]">
                        {responses.length === 0 ? (
                            <div className="text-center py-16 text-sm text-muted-foreground">
                                No responses yet.
                            </div>
                        ) : (
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-left">
                                        <th className="p-3 text-xs font-medium text-muted-foreground w-12 border-r border-border">#</th>
                                        {form.fields.map((field) => (
                                            <th key={field.id} className="p-3 text-xs font-medium text-muted-foreground border-r border-border max-w-[180px] truncate" title={field.label}>
                                                {field.label}
                                            </th>
                                        ))}
                                        <th className="p-3 text-xs font-medium text-muted-foreground text-right">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {responses.map((response, index) => (
                                        <tr
                                            key={response.id}
                                            onClick={() => setSelectedSubmission(response)}
                                            className="border-b border-border/50 hover:bg-muted/80 transition-colors cursor-pointer even:bg-muted/10"
                                        >
                                            <td className="p-3 text-xs text-muted-foreground border-r border-border/50">{index + 1}</td>
                                            {form.fields.map((field) => {
                                                const ansObj = response.answers.find((a: any) => a.fieldId === field.id);
                                                const val = ansObj?.value;
                                                let display = "—";
                                                if (val !== undefined && val !== null && val !== "") {
                                                    display = Array.isArray(val) ? val.join(", ") : String(val);
                                                }
                                                return (
                                                    <td key={field.id} className="p-3 text-xs truncate max-w-[180px] border-r border-border/50">
                                                        {display}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-3 text-xs text-muted-foreground text-right whitespace-nowrap">
                                                {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </section>

            {/* Detailed Submission Modal */}
            <Dialog open={selectedSubmission !== null} onOpenChange={(open) => { if (!open) setSelectedSubmission(null); }}>
                <DialogContent className="bg-card border-border rounded-xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base">
                            Submission Details
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            ID: {selectedSubmission?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSubmission && (
                        <div className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-border text-sm">
                                <div>
                                    <span className="block text-xs text-muted-foreground">Respondent</span>
                                    <span className="font-medium text-sm">{selectedSubmission.respondentEmail ?? "Anonymous"}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-muted-foreground">Submitted</span>
                                    <span className="font-medium text-sm">{new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {form.fields.map((field, idx) => {
                                    const ansObj = selectedSubmission.answers.find((a: any) => a.fieldId === field.id);
                                    const val = ansObj?.value;
                                    let displayVal = "Empty";
                                    if (val !== undefined && val !== null && val !== "") {
                                        displayVal = Array.isArray(val) ? val.join(", ") : String(val);
                                    }
                                    return (
                                        <div key={field.id} className="p-3 border border-border bg-background rounded-lg space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Field {idx + 1}</span>
                                                <Badge variant="secondary" className="text-[10px]">{field.type}</Badge>
                                            </div>
                                            <p className="text-sm font-medium">{field.label}</p>
                                            <p className="text-sm mt-1">{displayVal}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Submissions Trend Modal */}
            <Dialog open={isTrendModalOpen} onOpenChange={setIsTrendModalOpen}>
                <DialogContent className="bg-card border-border rounded-xl max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                            <IconChartBar className="size-5 text-muted-foreground" />
                            Submissions Trend
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Daily submissions over time
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorAnalyticsSub" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#1c1c1e" strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#3f3f46"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={8}
                                />
                                <YAxis
                                    stroke="#3f3f46"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
                                                    <p className="font-medium">{payload[0]?.payload.date}</p>
                                                    <p className="text-muted-foreground mt-0.5">
                                                        {payload[0]?.value} submissions
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Submissions"
                                    stroke="#71717a"
                                    strokeWidth={1.5}
                                    fillOpacity={1}
                                    fill="url(#colorAnalyticsSub)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </DialogContent>
            </Dialog>
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
