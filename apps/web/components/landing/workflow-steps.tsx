"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { LandingSectionHeader } from "~/components/landing/landing-section-header";
import { SectionReveal } from "~/components/landing/section-reveal";

const STEPS = [
  {
    title: "Create a blank form",
    description: "Start from zero—no template lock-in. Name your form and open the builder.",
  },
  {
    title: "Add fields and validation",
    description: "Text length, numeric digits, email, and year rules enforced before submit.",
  },
  {
    title: "Publish, list, or share",
    description: "Public Explore listing or unlisted link—your choice per form.",
  },
  {
    title: "Review responses and export",
    description: "Submission counts, analytics, and CSV export from one workspace.",
  },
];

function WorkflowGlowTrack() {
  return (
    <div
      className="pointer-events-none absolute left-6 right-[calc(25%-42px)] top-6 hidden md:block"
      aria-hidden
    >
      {/* Base track */}
      <div className="absolute inset-x-0 top-0 h-px bg-zinc-800" />

      {/* Moving glow — travels step 1 → step 4 */}
      <motion.div
        className="absolute top-0 h-0.5 w-[18%] -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-500/20 via-rose-400 to-amber-400 shadow-[0_0_20px_rgba(251,113,133,0.55)]"
        initial={{ left: "0%", opacity: 0 }}
        animate={{
          left: ["0%", "82%"],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          left: {
            duration: 3.2,
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 1.5,
            ease: [0.45, 0, 0.55, 1],
          },
          opacity: {
            duration: 3.2,
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 1.5,
            times: [0, 0.15, 0.85, 1],
            ease: "easeInOut",
          },
        }}
      />
    </div>
  );
}

function WorkflowMobileGlowTrack({
  scrollYProgress,
  trackHeight,
}: {
  scrollYProgress: any;
  trackHeight: number;
}) {
  const beamHeight = 48; // 48px height for the vertical beam on mobile
  const beamY = useTransform(scrollYProgress, [0, 1], [0, Math.max(0, trackHeight - beamHeight)]);

  if (trackHeight <= 0) return null;

  return (
    <div
      className="pointer-events-none absolute left-6 top-6 w-px md:hidden"
      style={{ height: trackHeight }}
      aria-hidden
    >
      {/* Base track */}
      <div className="absolute inset-0 bg-zinc-800" />

      {/* Moving vertical glow — driven by scroll */}
      <motion.div
        className="absolute left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-rose-500/20 via-rose-400 to-amber-400 shadow-[0_0_20px_rgba(251,113,133,0.55)]"
        style={{
          height: beamHeight,
          y: beamY,
        }}
      />
    </div>
  );
}

function StepIcon({ delay, stepNumber }: { delay: number; stepNumber: number }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="step-icon-container relative z-10 flex size-12 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
    >
      {/* On desktop (md), show the checkmark SVG. On mobile, show the step number. */}
      <div className="hidden md:block">
        <motion.svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          className="text-rose-500"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="rgba(244,63,94,0.12)" />
          <path
            d="M8 12.5l2.5 2.5L16 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </div>
      <div className="block md:hidden">
        <span className="text-sm font-bold text-rose-500">
          {stepNumber}
        </span>
      </div>
    </motion.div>
  );
}

export function WorkflowSteps() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackHeight, setTrackHeight] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 65%", "end 65%"],
  });

  useEffect(() => {
    const measureTrack = () => {
      if (!containerRef.current) return;
      const icons = containerRef.current.querySelectorAll(".step-icon-container");
      if (icons.length >= 4) {
        const firstIcon = icons[0];
        const lastIcon = icons[3];
        if (firstIcon && lastIcon) {
          const firstRect = firstIcon.getBoundingClientRect();
          const lastRect = lastIcon.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          const firstCenterY = (firstRect.top + firstRect.bottom) / 2 - containerRect.top;
          const lastCenterY = (lastRect.top + lastRect.bottom) / 2 - containerRect.top;

          setTrackHeight(lastCenterY - firstCenterY);
        }
      }
    };

    measureTrack();
    window.addEventListener("resize", measureTrack);
    return () => window.removeEventListener("resize", measureTrack);
  }, []);

  return (
    <section id="workflow" className="landing-section mx-auto max-w-6xl px-4 py-20 md:py-28">
      <SectionReveal>
        <LandingSectionHeader
          label="Workflow"
          title="From blank page to response insight"
          labelClassName="text-rose-500"
        />
      </SectionReveal>

      <div className="relative mt-14 md:mt-16" ref={containerRef}>
        <WorkflowGlowTrack />
        <WorkflowMobileGlowTrack scrollYProgress={scrollYProgress} trackHeight={trackHeight} />

        <ol className="grid gap-10 md:grid-cols-4 md:gap-6">
          {STEPS.map((step, i) => (
            <SectionReveal key={step.title} delay={i * 0.08}>
              <li className="relative flex flex-row items-start gap-4 text-left md:flex-col md:items-start md:text-left">
                <StepIcon delay={0.08 + i * 0.1} stepNumber={i + 1} />
                <div className="flex-1">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-zinc-500 md:mb-1.5 md:mt-4">
                    Step {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-[0.9375rem]">
                    {step.description}
                  </p>
                </div>
              </li>
            </SectionReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
