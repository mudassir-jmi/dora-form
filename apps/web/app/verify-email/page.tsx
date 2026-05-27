import { Suspense } from "react";

import { VerifyEmailForm } from "~/components/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-12 text-slate-100">
      <div className="pointer-events-none absolute left-0 top-12 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-12 top-24 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-xl sm:p-10">
        <div className="flex flex-col gap-6 rounded-[1.75rem] border border-sky-400/10 bg-slate-800/95 p-6 shadow-lg shadow-sky-500/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-200/80">Friendly access</p>
              <h1 className="text-3xl font-semibold text-white">DoraForm</h1>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-300">Friendly form building with cartoon-inspired design and playful details.</p>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-slate-700/70 bg-slate-950/95 p-6 shadow-xl shadow-slate-950/20">
          <Suspense fallback={<div className="h-52 animate-pulse rounded-lg bg-zinc-900" />}>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
