"use client";

import { useEffect, useState, useMemo } from "react";
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
    IconChartBar,
    IconForms,
    IconPlus,
    IconFlame,
    IconLoader,
    IconChevronRight,
    IconUsers,
    IconFileText,
    IconExternalLink,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useDashboardActivity, useMyForms, useSeedMissions } from "~/hooks/api/forms";

export function DashboardOverview() {
    const { forms, isLoading, error, refetch: refetchForms } = useMyForms({ limit: 50 });
    const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);
    const { activity, isLoading: isActivityLoading, refetch: refetchActivity } = useDashboardActivity({
        timezoneOffsetMinutes,
    });
    const seedMissions = useSeedMissions();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const activeForms = useMemo(() => forms.filter((f) => f.status !== "ARCHIVED"), [forms]);
    const totalForms = activeForms.length;
    const totalResponses = activeForms.reduce((count, form) => count + form.submissionCount, 0);
    const publishedCount = activeForms.filter((f) => f.status === "PUBLISHED").length;
    const draftCount = activeForms.filter((f) => f.status === "DRAFT").length;

    async function handleSeedMissions() {
        const loadingToast = toast.loading("Deploying template surveys...");
        try {
            const res = await seedMissions.mutateAsync(undefined);
            toast.dismiss(loadingToast);
            toast.success(`${res.count} templates & responses loaded!`);
            await Promise.all([refetchForms(), refetchActivity()]);
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("Failed to seed template data");
        }
    }

    const aggregatedChartData = useMemo(() => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        if (activity.length === 0) {
            return days.map((day) => ({ day, responses: 0 }));
        }
        return activity;
    }, [activity]);

    const displayForms = useMemo(() => activeForms.slice(0, 5), [activeForms]);

    return (
        <main className="space-y-6 p-6 w-full max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Overview of your forms and recent activity.
                </p>
            </div>

            {/* Stats Cards — inspired by the MasterJi screenshot */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={<IconForms className="size-5" />}
                    iconBg="bg-blue-500/10 text-blue-400"
                    label="Active Forms"
                    description="Total non-archived forms"
                    value={isLoading ? "..." : totalForms.toString()}

                />
                <StatCard
                    icon={<IconUsers className="size-5" />}
                    iconBg="bg-green-500/10 text-green-400"
                    label="Total Responses"
                    description="Across all active forms"
                    value={isLoading ? "..." : totalResponses.toString()}
                />
                <StatCard
                    icon={<IconExternalLink className="size-5" />}
                    iconBg="bg-orange-500/10 text-orange-400"
                    label="Published"
                    description="Live & accepting responses"
                    value={isLoading ? "..." : publishedCount.toString()}
                />
                <StatCard
                    icon={<IconFileText className="size-5" />}
                    iconBg="bg-purple-500/10 text-purple-400"
                    label="Drafts"
                    description="Not yet published"
                    value={isLoading ? "..." : draftCount.toString()}
                />
            </section>

            {/* Chart */}
            <section className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-medium">Response Activity</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Last 7 days from actual submissions</p>
                    </div>
                </div>

                <div className="h-60 w-full">
                    {mounted && !isActivityLoading ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={aggregatedChartData}
                                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorDashSub" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#1c1c1e" strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="day"
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
                                                    <p className="font-medium">{payload[0]?.payload.day}</p>
                                                    <p className="text-muted-foreground mt-0.5">
                                                        {payload[0]?.value} responses
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="responses"
                                    stroke="#71717a"
                                    strokeWidth={1.5}
                                    fillOpacity={1}
                                    fill="url(#colorDashSub)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                            Loading chart...
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Forms */}
            <section className="bg-card border border-border rounded-xl">
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div>
                        <h2 className="text-sm font-medium">Recent Forms</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Your latest survey worksheets</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="cursor-pointer">
                        <Link href="/dashboard/forms">
                            View All
                            <IconChevronRight className="size-3.5 ml-1" />
                        </Link>
                    </Button>
                </div>

                {error && (
                    <div className="p-4 text-sm text-destructive">{error.message}</div>
                )}

                <div className="divide-y divide-border">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            Loading forms...
                        </div>
                    ) : displayForms.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No forms yet. Create your first form to get started.
                        </div>
                    ) : (
                        displayForms.map((form) => (
                            <div key={form.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{form.title || "Untitled form"}</p>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                        <span>/{form.slug}</span>
                                        <span>·</span>
                                        <span>{form.submissionCount} responses</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <Badge
                                        variant={form.status === "PUBLISHED" ? "default" : "secondary"}
                                        className="text-[10px]"
                                    >
                                        {form.status === "PUBLISHED" ? "Public" : "Draft"}
                                    </Badge>
                                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs cursor-pointer">
                                        <Link href={`/dashboard/forms/${form.id}/builder`}>
                                            Edit
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}

function StatCard({
    icon,
    iconBg,
    label,
    description,
    value,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    description: string;
    value: string
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between min-h-35">
            <div className="flex items-start justify-between">
                <div className={`size-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-3">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{description}</p>
            </div>
            <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-bold tracking-tight">{value}</p>
            </div>
        </div>
    );
}
