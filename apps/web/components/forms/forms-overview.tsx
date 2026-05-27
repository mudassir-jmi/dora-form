"use client";

import Link from "next/link";
import {
  IconArchive,
  IconChartBar,
  IconEdit,
  IconExternalLink,
  IconPlus,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useArchiveForm, useCreateForm, useMyForms } from "~/hooks/api/forms";

export function FormsOverview() {
  const { forms, isLoading, error } = useMyForms({ limit: 80 });
  const createForm = useCreateForm();
  const archiveForm = useArchiveForm();

  async function handleCreateForm() {
    try {
      const form = await createForm.mutateAsync({
        title: "",
        description: null,
        visibility: "UNLISTED",
        fields: [],
      });
      toast.success("Blank form created");
      window.location.href = `/dashboard/forms/${form.id}/builder`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create form");
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveForm.mutateAsync({ id });
      toast.success("Form archived");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not archive form");
    }
  }

  return (
    <main className="space-y-6 p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Form Operations</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage form cards here. Builder and analytics live on separate focused pages.
            </p>
          </div>
          <Button onClick={handleCreateForm} disabled={createForm.isPending} className="cursor-pointer">
            <IconPlus className="size-4 mr-1.5" />
            Create form
          </Button>
        </div>
      </section>

      {error ? (
        <div className="border border-border bg-card p-4 text-sm text-destructive rounded-xl">
          {error.message}
        </div>
      ) : null}

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </section>
      ) : forms.length === 0 ? (
        <section className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <h2 className="font-semibold">No forms yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a form to open the dedicated builder workspace.
          </p>
          <Button className="mt-4 cursor-pointer" onClick={handleCreateForm}>
            <IconPlus className="size-4 mr-1.5" />
            Create first form
          </Button>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {forms.map((form) => (
            <article key={form.id} className="rounded-xl border border-border bg-card p-5 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{form.title || "Untitled form"}</h2>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">/{form.slug}</p>
                </div>
                <Badge variant={form.status === "PUBLISHED" ? "default" : "secondary"} className="text-[10px]">
                  {form.status === "PUBLISHED" ? "Public" : "Draft"}
                </Badge>
              </div>

              <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                {form.description ?? "No description yet."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat label="Responses" value={form.submissionCount.toString()} />
                <Stat label="View" value={form.visibility} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="outline" className="cursor-pointer">
                  <Link href={`/dashboard/forms/${form.id}/builder`}>
                    <IconEdit className="size-3.5 mr-1" />
                    Builder
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="cursor-pointer">
                  <Link href={`/dashboard/forms/analytics/${form.id}`}>
                    <IconChartBar className="size-3.5 mr-1" />
                    Analytics
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="cursor-pointer">
                  <Link href={`/f/${form.slug}`}>
                    <IconExternalLink className="size-3.5 mr-1" />
                    Public
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleArchive(form.id)} className="cursor-pointer">
                  <IconArchive className="size-3.5 mr-1" />
                  Archive
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2">
      <p className="truncate text-sm font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
