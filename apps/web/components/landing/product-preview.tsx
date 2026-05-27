"use client";

import { motion } from "motion/react";
import {
  IconArrowLeft,
  IconCheck,
  IconEdit,
  IconGripVertical,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";

const MOCK_QUESTIONS = [
  { label: "Full name", type: "TEXT", required: true },
  { label: "Email address", type: "EMAIL", required: true },
  { label: "Year of study", type: "NUMBER", required: false },
] as const;

/** Static mock of the real dashboard form builder (Form Details + Questions). */
export function ProductPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-12 w-full max-w-4xl text-left"
    >
      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-2xl shadow-black/40">
        {/* Builder header — matches form-builder-console */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
              <IconArrowLeft className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                Campus placement survey
              </p>
              <p className="text-[11px] text-muted-foreground">Form builder</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground">
              Published
            </span>
            <span className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <IconCheck className="size-3.5 text-rose-500" />
              Saved
            </span>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[minmax(0,280px)_1fr]">
          {/* Form Details sidebar */}
          <aside className="border-b border-border bg-card p-4 md:border-b-0 md:border-r md:p-5">
            <h3 className="border-b border-border pb-3 text-sm font-medium text-foreground">
              Form Details
            </h3>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Name</p>
                <div className="h-9 rounded-md border border-input bg-background px-3 text-xs leading-9 text-foreground">
                  Campus placement survey
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Description</p>
                <div className="min-h-[72px] rounded-md border border-input bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                  Collect student details for the 2026 placement drive.
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <div className="pr-2">
                  <p className="text-xs font-medium text-foreground">Public Explore Listing</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    Allow others to discover this form in Explore.
                  </p>
                </div>
                <div
                  className="h-5 w-9 shrink-0 rounded-full bg-rose-500/80 p-0.5"
                  aria-hidden
                >
                  <div className="ml-auto size-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            </div>
          </aside>

          {/* Questions panel */}
          <section className="bg-background p-4 md:p-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold tracking-tight text-foreground">Questions</h2>
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
                <IconPlus className="size-3.5" />
                Add Question
              </span>
            </div>

            <ul className="mt-3 space-y-2.5">
              {MOCK_QUESTIONS.map((q, idx) => (
                <li
                  key={q.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-zinc-600"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <IconGripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Question {idx + 1}</p>
                      <p className="truncate text-sm font-medium text-foreground">{q.label}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {q.type}
                        </Badge>
                        <span
                          className={
                            q.required ? "text-[10px] text-amber-400" : "text-[10px] text-muted-foreground"
                          }
                        >
                          {q.required ? "Required" : "Optional"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="inline-flex items-center rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground">
                      <IconEdit className="mr-1 size-3" />
                      Edit
                    </span>
                    <IconTrash className="size-4 text-muted-foreground" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-600">
        The same builder you use in the dashboard—form details on the left, questions on the right.
      </p>
    </motion.div>
  );
}
