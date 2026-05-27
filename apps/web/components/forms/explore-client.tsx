"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  IconExternalLink,
  IconFileText,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconSparkles,
} from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { useUser } from "~/hooks/api/auth";
import { useExploreForms } from "~/hooks/api/forms";
import { getSignInHref } from "~/lib/landing-plans";

export function ExploreClient() {
  const { forms, isLoading, error } = useExploreForms({ limit: 48 });
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery]);

  // Matching Suggestions List
  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return forms.filter(f => f.title.toLowerCase().includes(query)).slice(0, 5);
  }, [forms, searchQuery]);

  // Filtered List
  const filteredForms = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) return forms;

    return forms.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        stripHtml(f.description ?? "").toLowerCase().includes(query) ||
        f.slug.toLowerCase().includes(query),
    );
  }, [forms, debouncedQuery]);

  // Sliced Paginated List
  const totalPages = Math.ceil(filteredForms.length / 6) || 1;
  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * 6;
    return filteredForms.slice(start, start + 6);
  }, [filteredForms, currentPage]);

  const createFormHref = user
    ? "/dashboard/forms"
    : getSignInHref("/dashboard/forms");

  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 pb-12 pt-24 md:px-8 hex-grid-bg">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 z-10">
        <header className="flex flex-col gap-5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-none">Explore Forms</h1>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              Explore public surveys and forms from the community.
            </p>
          </div>

          {/* Debounced Search with active suggestions dropdown */}
          <div className="relative w-full sm:w-80" ref={dropdownRef}>
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <Input
              className="pl-9 pr-8 text-xs border-zinc-800 bg-zinc-950/30 text-zinc-100 focus-visible:ring-emerald-500/30 focus:border-emerald-500/50 transition-all rounded-md py-2 h-9 placeholder-zinc-500 outline-none w-full"
              placeholder="Search public forms..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-md shadow-xl overflow-hidden py-1.5 animate-in fade-in duration-200">
                <div className="px-3 py-1 text-[9px] font-bold text-zinc-550 uppercase tracking-widest border-b border-zinc-850">
                  Search Suggestions
                </div>
                <div className="max-h-[180px] overflow-y-auto">
                  {suggestions.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSearchQuery(f.title);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-zinc-350 hover:bg-zinc-800/80 hover:text-white transition-all cursor-pointer font-medium flex items-center gap-2"
                    >
                      <IconSparkles className="size-3 text-amber-500/60" />
                      <span className="truncate">{f.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-rose-400">
            {error.message}
          </div>
        ) : null}

        {/* 3 Forms in a Row Grid Layout */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <GallerySkeleton />
          ) : paginatedForms.length === 0 ? (
            <div className="col-span-full mx-auto w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
              <IconFileText className="mx-auto size-12 text-zinc-550" />
              <h2 className="mt-4 text-base font-bold text-white tracking-tight">No Forms Found</h2>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400 font-normal">
                No public forms match your search query yet. Enable form public directory visibility to view it here.
              </p>
              <Button
                asChild
                className="mt-5 cursor-pointer rounded-md cta-primary font-semibold text-xs py-2 px-4"
              >
                <Link href={createFormHref}>Create Form</Link>
              </Button>
            </div>
          ) : (
            paginatedForms.map((form) => (
              <article
                key={form.id}
                className="relative overflow-hidden bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg transition-all hover:border-zinc-700 flex flex-col justify-between min-h-[180px]"
              >
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-emerald-500/40 via-orange-500/30 to-yellow-500/20" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest bg-zinc-950/40 px-2 py-0.5 rounded border border-zinc-850">
                      Directory Item
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-zinc-950/30 border-zinc-800 text-zinc-455 uppercase font-semibold px-2 py-0.5 tracking-wider leading-none shadow-sm">
                      Public Form
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="line-clamp-1 text-base font-bold tracking-tight text-white">
                      {form.title || "Untitled form"}
                    </h2>
                    <p className="line-clamp-3 text-xs leading-relaxed text-zinc-400 font-normal">
                      {stripHtml(form.description ?? "Active survey form ready for responses.")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-850 flex items-center justify-end gap-3">
                  <Button asChild size="sm" variant="outline" className="shrink-0 cursor-pointer text-xs rounded-md border-zinc-800 bg-zinc-950/10 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all">
                    <Link href={`/f/${form.slug}`}>
                      <IconExternalLink className="size-3.5 mr-1" />
                      Open Form
                    </Link>
                  </Button>
                </div>
              </article>
            ))
          )}
        </section>

        {/* Tactile Page Pagination Deck */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-6 border-t border-white/5">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(prev => prev - 1);
                }
              }}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-zinc-800 bg-zinc-950/20 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
            >
              <IconChevronLeft className="size-3.5" />
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isCurrent = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => {
                      if (page !== currentPage) {
                        setCurrentPage(page);
                      }
                    }}
                    className={`size-8 text-xs font-bold rounded-md transition-all cursor-pointer border flex items-center justify-center ${
                      isCurrent
                        ? "border-emerald-500/60 bg-emerald-500/10 text-white shadow-sm"
                        : "border-zinc-800 bg-zinc-950/20 hover:bg-zinc-850 text-zinc-450 hover:text-zinc-200"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(prev => prev + 1);
                }
              }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-zinc-800 bg-zinc-950/20 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
            >
              Next
              <IconChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function GallerySkeleton() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-lg border border-zinc-800 bg-zinc-950/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-lg mt-4" />
          <Skeleton className="h-4 w-full rounded-md mt-2" />
          <Skeleton className="h-4 w-5/6 rounded-md mt-1" />
          <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}
