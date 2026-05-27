import { GalleryVerticalEnd, Sparkles } from "lucide-react"

import { SignupForm } from "~/components/signup-form"

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-10 text-slate-100">
      <div className="pointer-events-none absolute -left-16 top-12 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-10">
        <div className="flex flex-col gap-6 rounded-[1.75rem] border border-sky-400/10 bg-slate-900/80 p-6 shadow-lg shadow-sky-900/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-xl shadow-sky-500/30">
                D
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200/80">Welcome to</p>
                <h1 className="text-3xl font-semibold text-white">DoraForm</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-800/90 px-4 py-2 text-xs uppercase tracking-[0.25em] text-sky-100 shadow-sm shadow-sky-500/10">
              <Sparkles className="h-4 w-4 text-sky-300" />
              Cartoon Mode
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            Sign up to build playful forms with a cute Doraemon-inspired interface. Bright colors, rounded cards, and friendly UI help make form creation feel fun.
          </p>
          <div className="flex items-center justify-between rounded-3xl border border-sky-400/10 bg-sky-500/10 p-4 text-slate-100 shadow-inner shadow-sky-900/10">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-200/80">Fast setup</p>
              <p className="text-lg font-medium text-white">Create your first form in minutes</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950/80 text-sky-300 shadow-lg shadow-sky-500/20">
              <GalleryVerticalEnd className="h-6 w-6" />
            </div>
          </div>
        </div>

        <SignupForm />
      </div>
    </div>
  )
}
