"use client";

import { useState, useEffect, useRef } from "react";
import type React from "react";
import {
    IconSend,
    IconChevronRight,
    IconChevronLeft,
    IconSparkles,
    IconArrowRight,
    IconCheck,
    IconStar,
    IconVolume,
    IconVolumeOff,
    IconUpload,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
    PublicFormBrandBar,
    PublicFormError,
    PublicFormLoading,
    PublicFormReceipt,
    formCardClass,
    formShellClass,
} from "~/components/forms/public-form-shell";
import { usePublicForm, useSignFileUpload, useSubmitForm } from "~/hooks/api/forms";
import { cn } from "~/lib/utils";
import { TiptapViewer } from "~/components/ui/tiptap-viewer";

type AnswerValue = string | number | boolean | string[] | null;
type UploadStatus = "idle" | "uploading" | "uploaded" | "error";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf", "video/mp4"];
const ALLOWED_FILE_EXTENSIONS = ".jpg,.jpeg,.png,.pdf,.mp4";

function getNumberDigitCount(value: number) {
    return String(value).replace(/\D/g, "").length;
}

function getPublicReceiptAnswers(
    fields: NonNullable<ReturnType<typeof usePublicForm>["form"]>["fields"],
    answers: Record<string, AnswerValue>,
) {
    return Object.fromEntries(
        fields.map((field) => [
            field.labelKey,
            field.type === "FILE_URL" && answers[field.labelKey] ? "Uploaded file" : answers[field.labelKey] ?? null,
        ]),
    );
}

// Synthesized warm acoustic tones (Web Audio API)
const playSound = (type: "click" | "tock" | "success") => {
    if (typeof window === "undefined") return;
    const isMuted = localStorage.getItem("DoraForm_audio_muted") === "true";
    if (isMuted) return;

    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "click") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } else if (type === "tock") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(240, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.12);
            osc.start();
            osc.stop(ctx.currentTime + 0.14);
        } else if (type === "success") {
            const now = ctx.currentTime;
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(261.63, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.5);
            osc.start();
            osc.stop(now + 0.5);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(329.63, now + 0.08);
            gain2.gain.setValueAtTime(0.05, now + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.58);
            osc2.start();
            osc2.stop(now + 0.58);

            const osc3 = ctx.createOscillator();
            const gain3 = ctx.createGain();
            osc3.connect(gain3);
            gain3.connect(ctx.destination);
            osc3.type = "sine";
            osc3.frequency.setValueAtTime(392.00, now + 0.16);
            gain3.gain.setValueAtTime(0.05, now + 0.16);
            gain3.gain.exponentialRampToValueAtTime(0.005, now + 0.66);
            osc3.start();
            osc3.stop(now + 0.66);

            const osc4 = ctx.createOscillator();
            const gain4 = ctx.createGain();
            osc4.connect(gain4);
            gain4.connect(ctx.destination);
            osc4.type = "sine";
            osc4.frequency.setValueAtTime(523.25, now + 0.24);
            gain4.gain.setValueAtTime(0.07, now + 0.24);
            gain4.gain.exponentialRampToValueAtTime(0.005, now + 0.74);
            osc4.start();
            osc4.stop(now + 0.74);
        }
    } catch (e) {
        console.warn("AudioContext synthesis failed", e);
    }
};

// Canvas confetti particle class
class ConfettiParticle {
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight + 20;
        this.size = Math.random() * 7 + 5;
        const colors = ["#fb7185", "#f43f5e", "#34d399", "#10b981", "#fbbf24", "#a1a1aa"];
        this.color = colors[Math.floor(Math.random() * colors.length)]!;
        this.speedX = (Math.random() - 0.5) * 14;
        this.speedY = -(Math.random() * 14 + 10);
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 8;
    }

    update(gravity: number) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += gravity;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

export function PublicFormClient({ slug }: { slug: string }) {
    const { form, isLoading, error } = usePublicForm(slug);
    const submitForm = useSubmitForm();
    const signFileUpload = useSignFileUpload();

    const [currentStep, setCurrentStep] = useState(-1);
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
    const [uploadedFileUrls, setUploadedFileUrls] = useState<Record<string, string | null>>({});
    const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatus>>({});
    const [respondentEmail, setRespondentEmail] = useState("");
    const [done, setDone] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [isPreview, setIsPreview] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [audioMuted, setAudioMuted] = useState(false);

    const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsPreview(new URLSearchParams(window.location.search).get("preview") === "true");
        }
    }, []);

    // Initial check for double submission and draft on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const muted = localStorage.getItem("DoraForm_audio_muted") === "true";
            setAudioMuted(muted);

            const submitted = localStorage.getItem(`DoraForm_submitted_${slug}`) === "true";
            if (submitted) {
                setAlreadySubmitted(true);
                try {
                    const savedAnswers = localStorage.getItem(`DoraForm_answers_${slug}`);
                    if (savedAnswers) {
                        setAnswers(JSON.parse(savedAnswers));
                    }
                } catch (e) {
                    console.error("Failed to parse saved answers", e);
                }
                return;
            }

            const draftStr = localStorage.getItem(`DoraForm_draft_${slug}`);
            if (draftStr) {
                try {
                    const draft = JSON.parse(draftStr);
                    if (draft && (
                        (draft.answers && Object.keys(draft.answers).length > 0) ||
                        draft.respondentEmail ||
                        draft.currentStep > -1
                    )) {
                        setShowResumeModal(true);
                    }
                } catch (e) {
                    console.error("Failed to parse draft", e);
                }
            }
        }
    }, [slug]);

    // Save draft periodically on answers/step changes
    useEffect(() => {
        if (typeof window !== "undefined" && !alreadySubmitted && !done && form && !showResumeModal) {
            const draft = {
                answers,
                currentStep,
                respondentEmail,
            };
            localStorage.setItem(`DoraForm_draft_${slug}`, JSON.stringify(draft));
        }
    }, [answers, currentStep, respondentEmail, slug, alreadySubmitted, done, form, showResumeModal]);

    // Spark confetti fountain on done for exactly 2.5 seconds
    useEffect(() => {
        if (done && confettiCanvasRef.current) {
            const canvas = confettiCanvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            let animationFrameId: number;
            const startTime = Date.now();
            const duration = 2500; // 2.5 seconds
            
            const handleResize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            window.addEventListener("resize", handleResize);
            handleResize();

            const particles: ConfettiParticle[] = [];
            const gravity = 0.45;

            for (let i = 0; i < 150; i++) {
                particles.push(new ConfettiParticle(canvas.width, canvas.height));
            }

            const renderLoop = () => {
                const elapsed = Date.now() - startTime;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Continually spawn minor sparks only during the first 1.5 seconds
                if (elapsed < 1500 && particles.length < 250 && Math.random() < 0.4) {
                    particles.push(new ConfettiParticle(canvas.width, canvas.height));
                }

                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i]!;
                    p.update(gravity);
                    p.draw(ctx);

                    if (p.y > canvas.height + 40 || p.x < -40 || p.x > canvas.width + 40) {
                        particles.splice(i, 1);
                    }
                }

                // Stop loop completely after 2.5 seconds and clear canvas
                if (elapsed < duration || particles.length > 0) {
                    animationFrameId = requestAnimationFrame(renderLoop);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            };

            renderLoop();

            return () => {
                cancelAnimationFrame(animationFrameId);
                window.removeEventListener("resize", handleResize);
            };
        }
    }, [done]);

    const handleResumeDraft = () => {
        playSound("click");
        if (typeof window !== "undefined") {
            const draftStr = localStorage.getItem(`DoraForm_draft_${slug}`);
            if (draftStr) {
                try {
                    const draft = JSON.parse(draftStr);
                    if (draft) {
                        if (draft.answers) setAnswers(draft.answers);
                        if (draft.currentStep !== undefined) setCurrentStep(draft.currentStep);
                        if (draft.respondentEmail !== undefined) setRespondentEmail(draft.respondentEmail);
                        toast.success("Progress restored!");
                    }
                } catch (e) {
                    console.error("Failed to resume draft", e);
                }
            }
        }
        setShowResumeModal(false);
    };

    const handleDiscardDraft = () => {
        playSound("tock");
        if (typeof window !== "undefined") {
            localStorage.removeItem(`DoraForm_draft_${slug}`);
        }
        setShowResumeModal(false);
        setAnswers({});
        setCurrentStep(-1);
        setRespondentEmail("");
        toast.success("Started fresh!");
    };

    const toggleAudioMuted = () => {
        const nextMute = !audioMuted;
        setAudioMuted(nextMute);
        if (typeof window !== "undefined") {
            localStorage.setItem("DoraForm_audio_muted", String(nextMute));
        }
        if (!nextMute) {
            playSound("click");
        }
    };

    const validateFile = (file: File) => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return "File must be 50MB or less.";
        }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return "Only JPG, PNG, PDF, and MP4 files are allowed.";
        }
        return null;
    };

    const uploadFileAnswer = async (fieldKey: string, file: File) => {
        if (!form) throw new Error("Form is not loaded.");

        const signedUpload = await signFileUpload.mutateAsync({
            slug: form.slug,
            fieldKey,
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
        });

        const body = new FormData();
        for (const [key, value] of Object.entries(signedUpload.fields)) {
            body.append(key, value);
        }
        body.append("file", file);

        const response = await fetch(signedUpload.uploadUrl, {
            method: "POST",
            body,
        });

        if (!response.ok) {
            throw new Error("File upload failed. Please try again.");
        }

        const uploaded = (await response.json()) as { secure_url?: string };
        if (!uploaded.secure_url) {
            throw new Error("Cloudinary did not return an uploaded file URL.");
        }

        return uploaded.secure_url;
    };

    const handleUploadFileSelection = async (fieldKey: string, file: File | null) => {
        if (!file) {
            setSelectedFiles((prev) => ({ ...prev, [fieldKey]: null }));
            setUploadedFileUrls((prev) => ({ ...prev, [fieldKey]: null }));
            setUploadStatus((prev) => ({ ...prev, [fieldKey]: "idle" }));
            setAnswers((prev) => ({ ...prev, [fieldKey]: null }));
            return;
        }

        const fileError = validateFile(file);
        if (fileError) {
            setErrorMessage(fileError);
            setUploadStatus((prev) => ({ ...prev, [fieldKey]: "error" }));
            return;
        }

        setErrorMessage(null);
        setSelectedFiles((prev) => ({ ...prev, [fieldKey]: file }));
        setUploadedFileUrls((prev) => ({ ...prev, [fieldKey]: null }));
        setUploadStatus((prev) => ({ ...prev, [fieldKey]: "uploading" }));
        setAnswers((prev) => ({ ...prev, [fieldKey]: file.name }));

        try {
            const uploadedUrl = await uploadFileAnswer(fieldKey, file);
            setUploadedFileUrls((prev) => ({ ...prev, [fieldKey]: uploadedUrl }));
            setUploadStatus((prev) => ({ ...prev, [fieldKey]: "uploaded" }));
            setAnswers((prev) => ({ ...prev, [fieldKey]: "Uploaded file" }));
            toast.success("File uploaded");
        } catch (error) {
            setUploadedFileUrls((prev) => ({ ...prev, [fieldKey]: null }));
            setUploadStatus((prev) => ({ ...prev, [fieldKey]: "error" }));
            setErrorMessage(error instanceof Error ? error.message : "File upload failed.");
        }
    };

    // Focus input automatically when step changes
    useEffect(() => {
        if (activeInputRef.current) {
            activeInputRef.current.focus();
        }
        setErrorMessage(null);
    }, [currentStep]);

    const toggleOption = (field: any, optVal: string) => {
        playSound("click");
        const isMultiple = field.selectMode === "MULTIPLE";
        const currentVal = answers[field.labelKey];
        const selectedList = Array.isArray(currentVal) ? currentVal : [];

        if (isMultiple) {
            if (selectedList.includes(optVal)) {
                setAnswers((prev) => ({
                    ...prev,
                    [field.labelKey]: selectedList.filter((v) => v !== optVal),
                }));
            } else {
                setAnswers((prev) => ({
                    ...prev,
                    [field.labelKey]: [...selectedList, optVal],
                }));
            }
        } else {
            setAnswers((prev) => ({
                ...prev,
                [field.labelKey]: optVal,
            }));
        }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (!form) return;

        const activeElement = document.activeElement;

        // Enter: Advance to next step (only if not typing in textarea)
        if (e.key === "Enter" && !e.shiftKey) {
            if (activeElement && activeElement.tagName === "TEXTAREA") {
                return;
            }
            e.preventDefault();
            handleNext();
            return;
        }
    };

    // Connect standard keyboard advance listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            handleGlobalKeyDown(e);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [currentStep, form, answers, selectedFiles, uploadedFileUrls, uploadStatus, respondentEmail, alreadySubmitted, done]);

    const validateStep = (): boolean => {
        if (currentStep === -1) {
            if (respondentEmail && !/^\S+@\S+\.\S+$/.test(respondentEmail)) {
                setErrorMessage("Please input a valid email address.");
                return false;
            }
            return true;
        }

        const field = form?.fields[currentStep];
        if (!field) return true;

        const val = answers[field.labelKey];
        const isEmpty =
            val === undefined ||
            val === null ||
            val === "" ||
            (Array.isArray(val) && val.length === 0);

        if (field.isRequired && isEmpty) {
            setErrorMessage(`${field.label} is a required field.`);
            return false;
        }

        if (field.type === "EMAIL" && typeof val === "string" && val && !/^\S+@\S+\.\S+$/.test(val)) {
            setErrorMessage(`${field.label} must be a valid email address.`);
            return false;
        }

        if (field.type === "FILE_URL") {
            const status = uploadStatus[field.labelKey] ?? "idle";
            const uploadedUrl = uploadedFileUrls[field.labelKey];
            if (status === "uploading") {
                setErrorMessage("Please wait for the file upload to finish.");
                return false;
            }
            if (status === "error") {
                setErrorMessage("Please choose the file again. The last upload failed.");
                return false;
            }
            if (field.isRequired && !uploadedUrl) {
                setErrorMessage(`${field.label} is a required field.`);
                return false;
            }
            if (val && !uploadedUrl) {
                setErrorMessage(`Please upload ${field.label} before continuing.`);
                return false;
            }
        }

        if ((field.type === "NUMBER" || field.type === "RATING") && typeof val === "number") {
            const validation = field.validation as any;
            if (field.type === "NUMBER") {
                const digitCount = getNumberDigitCount(val);
                if (validation?.minLength !== undefined && digitCount < validation.minLength) {
                    setErrorMessage(`Input is too short (min ${validation.minLength} digits required).`);
                    return false;
                }
                if (validation?.maxLength !== undefined && digitCount > validation.maxLength) {
                    setErrorMessage(`Input exceeds max length limit of ${validation.maxLength} digits.`);
                    return false;
                }
            }
            if (validation?.min !== undefined && val < validation.min) {
                setErrorMessage(`Value must be at least ${validation.min}.`);
                return false;
            }
            if (validation?.max !== undefined && val > validation.max) {
                setErrorMessage(`Value must be at most ${validation.max}.`);
                return false;
            }
        }

        if ((field.type === "TEXT" || field.type === "LONG_TEXT") && typeof val === "string") {
            const validation = field.validation as any;
            const minLength = validation?.minLength ?? validation?.min;
            const maxLength = validation?.maxLength ?? validation?.max;
            if (typeof minLength === "number" && val.length < minLength) {
                setErrorMessage(`Input is too short (min ${minLength} chars required).`);
                return false;
            }
            if (typeof maxLength === "number" && val.length > maxLength) {
                setErrorMessage(`Input exceeds max length limit of ${maxLength} chars.`);
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (!form) return;
        if (!validateStep()) return;

        playSound("tock");
        if (currentStep < form.fields.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            setCurrentStep(form.fields.length);
        }
    };

    const handleBack = () => {
        playSound("tock");
        if (currentStep > -1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    async function handleSubmit() {
        if (!form) return;

        for (let i = 0; i < form.fields.length; i++) {
            const field = form.fields[i]!;
            const val = answers[field.labelKey];
            const isEmpty =
                val === undefined ||
                val === null ||
                val === "" ||
                (Array.isArray(val) && val.length === 0);

            if (field.isRequired && isEmpty) {
                setCurrentStep(i);
                setErrorMessage(`${field.label} is a required field.`);
                return;
            }

            if (field.type === "EMAIL" && typeof val === "string" && val && !/^\S+@\S+\.\S+$/.test(val)) {
                setCurrentStep(i);
                setErrorMessage(`${field.label} must be a valid email address.`);
                return;
            }

            if (field.type === "FILE_URL") {
                const status = uploadStatus[field.labelKey] ?? "idle";
                const uploadedUrl = uploadedFileUrls[field.labelKey];
                if (status === "uploading") {
                    setCurrentStep(i);
                    setErrorMessage("Please wait for the file upload to finish.");
                    return;
                }
                if (status === "error") {
                    setCurrentStep(i);
                    setErrorMessage("Please choose the file again. The last upload failed.");
                    return;
                }
                if (field.isRequired && !uploadedUrl) {
                    setCurrentStep(i);
                    setErrorMessage(`${field.label} is a required field.`);
                    return;
                }
                if (val && !uploadedUrl) {
                    setCurrentStep(i);
                    setErrorMessage(`Please upload ${field.label} before submitting.`);
                    return;
                }
            }

            if ((field.type === "TEXT" || field.type === "LONG_TEXT") && typeof val === "string") {
                const validation = field.validation as any;
                const minLength = validation?.minLength ?? validation?.min;
                const maxLength = validation?.maxLength ?? validation?.max;
                if (typeof minLength === "number" && val.length < minLength) {
                    setCurrentStep(i);
                    setErrorMessage(`Input is too short (min ${minLength} chars required).`);
                    return;
                }
                if (typeof maxLength === "number" && val.length > maxLength) {
                    setCurrentStep(i);
                    setErrorMessage(`Input exceeds max length limit of ${maxLength} chars.`);
                    return;
                }
            }

            if ((field.type === "NUMBER" || field.type === "RATING") && typeof val === "number") {
                const validation = field.validation as any;
                if (field.type === "NUMBER") {
                    const digitCount = getNumberDigitCount(val);
                    if (validation?.minLength !== undefined && digitCount < validation.minLength) {
                        setCurrentStep(i);
                        setErrorMessage(`Input is too short (min ${validation.minLength} digits required).`);
                        return;
                    }
                    if (validation?.maxLength !== undefined && digitCount > validation.maxLength) {
                        setCurrentStep(i);
                        setErrorMessage(`Input exceeds max length limit of ${validation.maxLength} digits.`);
                        return;
                    }
                }
                if (validation?.min !== undefined && val < validation.min) {
                    setCurrentStep(i);
                    setErrorMessage(`Value must be at least ${validation.min}.`);
                    return;
                }
                if (validation?.max !== undefined && val > validation.max) {
                    setCurrentStep(i);
                    setErrorMessage(`Value must be at most ${validation.max}.`);
                    return;
                }
            }
        }

        if (isPreview) {
            setDone(true);
            playSound("success");
            toast.success("Preview submission simulated");
            return;
        }

        try {
            const answersToSubmit = Object.fromEntries(
                form.fields.map((field) => [
                    field.labelKey,
                    field.type === "FILE_URL"
                        ? uploadedFileUrls[field.labelKey] ?? null
                        : answers[field.labelKey] ?? null,
                ]),
            ) as Record<string, AnswerValue>;

            await submitForm.mutateAsync({
                slug: form.slug,
                respondentEmail: respondentEmail || null,
                answers: form.fields.map((field) => ({
                    fieldKey: field.labelKey,
                    value: answersToSubmit[field.labelKey] ?? null,
                })),
            });

            if (typeof window !== "undefined") {
                localStorage.setItem(`DoraForm_submitted_${slug}`, "true");
                localStorage.setItem(`DoraForm_answers_${slug}`, JSON.stringify(answersToSubmit));
                localStorage.removeItem(`DoraForm_draft_${slug}`);
            }

            setDone(true);
            playSound("success");
            toast.success("Response submitted successfully!");
        } catch (mutationError) {
            toast.error(
                mutationError instanceof Error ? mutationError.message : "Form response submission failed.",
            );
        }
    }

    if (isLoading) {
        return <PublicFormLoading />;
    }

    if (error || !form) {
        return <PublicFormError message={error?.message} />;
    }

    const receiptAnswers = getPublicReceiptAnswers(form.fields, answers);
    const isAnyFileUploading = Object.values(uploadStatus).includes("uploading");
    const receiptActions = (
        <div className="grid gap-3 sm:grid-cols-2">
            <Button
                type="button"
                variant="outline"
                className="rounded-md border-zinc-700"
                onClick={() => {
                    playSound("click");
                    void navigator.clipboard.writeText(JSON.stringify(receiptAnswers, null, 2));
                    toast.success("Answers copied");
                }}
            >
                Copy answers
            </Button>
            <Button asChild className="cta-primary rounded-md font-semibold">
                <Link href="/explore">Explore forms</Link>
            </Button>
        </div>
    );

    if (alreadySubmitted) {
        return (
            <PublicFormReceipt
                title={form.title}
                fields={form.fields}
                answers={receiptAnswers}
                headline="Response already recorded"
                description={
                    <>
                        You already submitted this form. Multiple responses are not allowed from this
                        browser.
                    </>
                }
            >
                {receiptActions}
            </PublicFormReceipt>
        );
    }

    if (done) {
        return (
            <>
                <canvas
                    ref={confettiCanvasRef}
                    className="pointer-events-none fixed inset-0 z-50 h-full w-full"
                />
                <PublicFormReceipt
                    title={form.title}
                    fields={form.fields}
                    answers={receiptAnswers}
                    headline="Response submitted"
                    description="Thank you — your answers were saved successfully."
                >
                    {receiptActions}
                    <p className="text-center text-[10px] text-zinc-500">You can close this window.</p>
                </PublicFormReceipt>
            </>
        );
    }

    const totalSteps = form.fields.length;
    const progressPercent = Math.min(
        Math.round(((currentStep + 1) / (totalSteps + 1)) * 100),
        100,
    );

    const audioControl = (
        <button
            type="button"
            onClick={toggleAudioMuted}
            className="flex size-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:text-white"
            title={audioMuted ? "Unmute sounds" : "Mute sounds"}
        >
            {audioMuted ? <IconVolumeOff className="size-4" /> : <IconVolume className="size-4" />}
        </button>
    );

    return (
        <div className={cn(formShellClass, "justify-between p-4 sm:p-6 md:p-8 select-none")}>
            {showResumeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm space-y-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center shadow-xl">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10">
                            <IconSparkles className="size-6 text-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Resume your draft?</h3>
                            <p className="text-sm leading-relaxed text-zinc-400">
                                Saved progress for <span className="text-zinc-200">{form.title}</span>.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-md border-zinc-700"
                                onClick={handleDiscardDraft}
                            >
                                Start fresh
                            </Button>
                            <Button type="button" className="cta-primary rounded-md font-semibold" onClick={handleResumeDraft}>
                                Resume
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <PublicFormBrandBar title={form.title || "Untitled form"} audioControl={audioControl} />

            {/* Core Card Slides Container */}
            <section className="flex-1 flex items-center justify-center max-w-2xl w-full mx-auto py-8 z-10 min-h-0">
                <div className="w-full transition-all duration-300">

                    {/* Welcome Slide */}
                    {currentStep === -1 && (
                        <div className={cn(formCardClass, "space-y-6")}>
                            <div className="space-y-4">
                                <Badge
                                    variant="outline"
                                    className="rounded-md border-emerald-500/30 bg-emerald-500/10 text-[10px] uppercase tracking-wider text-emerald-400"
                                >
                                    DoraForm
                                </Badge>
                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    {form.title || "Untitled form"}
                                </h1>
                                {form.description ? (
                                    <div
                                        className="rounded-md border border-zinc-800 bg-zinc-950/50 p-4"
                                    >
                                        <TiptapViewer value={form.description} />
                                    </div>
                                ) : null}
                                {isPreview ? (
                                    <p className="text-xs text-amber-400/90">Preview mode — submissions are not saved.</p>
                                ) : null}
                            </div>

                            <div className="space-y-4 border-t border-zinc-800 pt-4">
                                {errorMessage ? (
                                    <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                                        {errorMessage}
                                    </div>
                                ) : null}

                                {totalSteps === 0 ? (
                                    <p className="text-sm text-zinc-500">This form has no questions yet.</p>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        className="cta-primary group rounded-md font-semibold"
                                    >
                                        Start form
                                        <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Question Steps */}
                    {form.fields.map((field, idx) => {
                        if (idx !== currentStep) return null;
                        const isFileUploadPending =
                            field.type === "FILE_URL" && uploadStatus[field.labelKey] === "uploading";
                        return (
                            <div
                                key={field.id}
                                className={cn(formCardClass, "animate-in fade-in slide-in-from-right-4 space-y-6 duration-300")}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                                            Question {idx + 1} of {totalSteps}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "rounded-md text-[10px]",
                                                field.isRequired
                                                    ? "border-rose-500/30 text-rose-300"
                                                    : "border-zinc-700 text-zinc-400",
                                            )}
                                        >
                                            {field.isRequired ? "Required" : "Optional"}
                                        </Badge>
                                    </div>

                                    <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                                        {field.label}
                                    </h2>

                                    {field.description ? (
                                        <p className="text-sm leading-relaxed text-zinc-400">{field.description}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-4 border-t border-zinc-800 pt-4">
                                    <FieldControl
                                        field={field}
                                        value={answers[field.labelKey] ?? null}
                                        onChange={(val) => {
                                            playSound("click");
                                            setAnswers((prev) => ({ ...prev, [field.labelKey]: val }));
                                        }}
                                        selectedFile={selectedFiles[field.labelKey] ?? null}
                                        uploadStatus={uploadStatus[field.labelKey] ?? "idle"}
                                        onFileChange={(file) => {
                                            void handleUploadFileSelection(field.labelKey, file);
                                        }}
                                        inputRef={activeInputRef as any}
                                        toggleOption={(optVal) => toggleOption(field, optVal)}
                                    />

                                    {errorMessage ? (
                                        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                                            {errorMessage}
                                        </div>
                                    ) : null}

                                    <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBack}
                                            className="rounded-md border-zinc-700"
                                        >
                                            <IconChevronLeft className="size-4" />
                                            Back
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={isFileUploadPending}
                                            className="cta-primary rounded-md font-semibold"
                                        >
                                            {isFileUploadPending ? "Uploading..." : "Next"}
                                            <IconChevronRight className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Review & Submit */}
                    {currentStep === totalSteps && totalSteps > 0 && (
                        <div className={cn(formCardClass, "animate-in fade-in space-y-6 duration-300")}>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                                    Review
                                </p>
                                <h2 className="text-xl font-bold text-white sm:text-2xl">Review your answers</h2>
                                <p className="text-sm text-zinc-400">
                                    Tap a row to edit before you submit.
                                </p>
                            </div>

                            <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                                {form.fields.map((f, i) => {
                                    const rawVal = answers[f.labelKey];
                                    let displayVal = "—";
                                    if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
                                        displayVal =
                                            f.type === "FILE_URL"
                                                ? "Uploaded file"
                                                : Array.isArray(rawVal)
                                                    ? rawVal.join(", ")
                                                    : String(rawVal);
                                    }
                                    return (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => {
                                                playSound("tock");
                                                setCurrentStep(i);
                                            }}
                                            className="group flex w-full items-start justify-between gap-4 rounded-md border border-zinc-800 bg-zinc-950/40 p-3 text-left text-xs transition-colors hover:border-zinc-700"
                                        >
                                            <span className="max-w-[200px] truncate text-zinc-400 group-hover:text-white">
                                                {i + 1}. {f.label}
                                            </span>
                                            <span className="max-w-[220px] break-all text-right font-medium text-zinc-200">
                                                {displayVal}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="rounded-md border-zinc-700"
                                >
                                    <IconChevronLeft className="size-4" />
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitForm.isPending || isAnyFileUploading}
                                    className="cta-primary flex-1 rounded-md font-semibold"
                                >
                                    {submitForm.isPending || isAnyFileUploading ? (
                                        <span className="size-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
                                    ) : (
                                        <>
                                            <IconSend className="size-4" />
                                            Submit response
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </section>

            <footer className="z-10 mx-auto w-full max-w-2xl space-y-2 border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    <span>{progressPercent}% complete</span>
                    <span>
                        Step {Math.max(currentStep + 2, 1)} / {Math.max(totalSteps + 1, 1)}
                    </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
                    <div
                        className="h-full rounded-full bg-emerald-500/80 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </footer>
        </div>
    );
}

function FieldControl({
    field,
    value,
    onChange,
    selectedFile,
    uploadStatus,
    onFileChange,
    inputRef,
    toggleOption,
}: {
    field: NonNullable<ReturnType<typeof usePublicForm>["form"]>["fields"][number];
    value: AnswerValue;
    onChange: (value: AnswerValue) => void;
    selectedFile: File | null;
    uploadStatus: UploadStatus;
    onFileChange: (file: File | null) => void;
    inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
    toggleOption: (optVal: string) => void;
}) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    if (field.type === "LONG_TEXT") {
        return (
            <Textarea
                id={field.labelKey}
                placeholder={field.placeholder ?? "Type your answer here..."}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => onChange(event.target.value)}
                ref={inputRef as any}
                rows={4}
                className="w-full rounded-md border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/30"
            />
        );
    }

    if (field.type === "SELECT") {
        const isMultiple = field.selectMode === "MULTIPLE";
        const selectedList = Array.isArray(value) ? value : [];

        return (
            <div className="grid gap-3 sm:grid-cols-2 mt-1">
                {field.options.map((option) => {
                    const isSelected = isMultiple
                        ? selectedList.includes(option.value)
                        : value === option.value;
                    return (
                        <button
                            key={option.id}
                            onClick={() => toggleOption(option.value)}
                            className={cn(
                                "group relative flex cursor-pointer items-center justify-between rounded-md border p-3.5 text-left transition-all",
                                isSelected
                                    ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                                    : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
                            )}
                            type="button"
                        >
                            <span className="font-semibold text-xs truncate max-w-[170px] sm:max-w-[220px]">{option.label}</span>
                            <div
                                className={`size-4.5 border flex items-center justify-center transition-all shrink-0 ${
                                    isMultiple
                                        ? `${isSelected ? "border-emerald-500 bg-emerald-500" : "border-zinc-700 group-hover:border-zinc-600"} rounded-md`
                                        : `${isSelected ? "border-emerald-500 bg-emerald-500" : "border-zinc-700 group-hover:border-zinc-600"} rounded-full`
                                }`}
                            >
                                {isSelected && (
                                    isMultiple
                                        ? <IconCheck className="size-3 text-white font-bold" />
                                        : <div className="size-1.5 bg-white rounded-full" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }

    if (field.type === "YES_NO") {
        const activeVal = value === true;
        const inactiveVal = value === false;
        return (
            <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                    onClick={() => onChange(true)}
                    className={cn(
                        "flex cursor-pointer items-center justify-between rounded-md border p-3.5 text-left transition-all",
                        activeVal
                            ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                            : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700",
                    )}
                    type="button"
                >
                    <span className="text-xs font-semibold">Yes</span>
                    <div className={`size-4.5 border flex items-center justify-center transition-all rounded-full shrink-0 ${
                        activeVal ? "border-emerald-500 bg-emerald-500" : "border-zinc-700"
                    }`}>
                        {activeVal && <div className="size-1.5 bg-white rounded-full" />}
                    </div>
                </button>

                <button
                    onClick={() => onChange(false)}
                    className={cn(
                        "flex cursor-pointer items-center justify-between rounded-md border p-3.5 text-left transition-all",
                        inactiveVal
                            ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                            : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700",
                    )}
                    type="button"
                >
                    <span className="text-xs font-semibold">No</span>
                    <div className={`size-4.5 border flex items-center justify-center transition-all rounded-full shrink-0 ${
                        inactiveVal ? "border-emerald-500 bg-emerald-500" : "border-zinc-700"
                    }`}>
                        {inactiveVal && <div className="size-1.5 bg-white rounded-full" />}
                    </div>
                </button>
            </div>
        );
    }

    if (field.type === "CHECKBOX") {
        const activeVal = Boolean(value);
        return (
            <button
                onClick={() => onChange(!activeVal)}
                className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border p-3.5 text-left transition-all",
                    activeVal
                        ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                        : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700",
                )}
                type="button"
            >
                <div
                    className={`size-4.5 border flex items-center justify-center transition-all shrink-0 ${
                        activeVal ? "border-emerald-500 bg-emerald-500" : "border-zinc-700"
                    } rounded-md`}
                >
                    {activeVal && <IconCheck className="size-3 text-white font-bold" />}
                </div>
                <span className="font-semibold text-xs">Confirm choice</span>
            </button>
        );
    }

    if (field.type === "FILE_URL") {
        const fileLabel = selectedFile?.name ?? "Choose a secure file";
        const statusLabel =
            uploadStatus === "uploading"
                ? "Uploading..."
                : uploadStatus === "uploaded"
                    ? "Uploaded"
                    : uploadStatus === "error"
                        ? "Upload failed"
                        : "JPG, PNG, PDF, or MP4 up to 50MB";

        return (
            <label
                htmlFor={field.labelKey}
                className="block cursor-pointer rounded-md border border-dashed border-emerald-500/40 bg-emerald-500/5 p-6 transition-colors hover:border-emerald-400/70 hover:bg-emerald-500/10"
            >
                <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                            <IconUpload className="size-5" />
                        </span>
                        <div className="min-w-0 space-y-1">
                            <span className="block truncate text-sm font-semibold text-zinc-100">{fileLabel}</span>
                            <span className={cn(
                                "block text-xs",
                                uploadStatus === "uploaded"
                                    ? "text-emerald-300"
                                    : uploadStatus === "error"
                                        ? "text-rose-300"
                                        : "text-zinc-500",
                            )}>
                                {statusLabel}
                            </span>
                        </div>
                    </div>
                    <span className="inline-flex shrink-0 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950">
                        {uploadStatus === "uploading" ? "Uploading" : "Select file"}
                    </span>
                </div>
                <Input
                    id={field.labelKey}
                    type="file"
                    accept={ALLOWED_FILE_EXTENSIONS}
                    disabled={uploadStatus === "uploading"}
                    onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                    ref={inputRef as any}
                    className="sr-only"
                />
            </label>
        );
    }

    if (field.type === "RATING") {
        const valRating = typeof value === "number" ? value : 0;
        return (
            <div className="flex justify-center py-4 gap-2.5">
                {[1, 2, 3, 4, 5].map((rating) => {
                    const isActive = (hoverRating !== null ? hoverRating : valRating) >= rating;
                    return (
                        <button
                            key={rating}
                            onMouseEnter={() => setHoverRating(rating)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => onChange(rating)}
                            className={cn(
                                "flex size-11 cursor-pointer items-center justify-center rounded-md border transition-all",
                                isActive
                                    ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                                    : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700",
                            )}
                            type="button"
                        >
                            <IconStar
                                className={cn(
                                    "size-5",
                                    isActive ? "fill-amber-400 text-amber-400" : "text-zinc-600",
                                )}
                            />
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <Input
            id={field.labelKey}
            type={
                field.type === "EMAIL"
                    ? "email"
                    : field.type === "NUMBER"
                        ? "number"
                        : field.type === "DATE"
                            ? "date"
                            : "text"
            }
            placeholder={field.placeholder ?? "Type your answer here..."}
            value={typeof value === "string" || typeof value === "number" ? value : ""}
            onChange={(event) => {
                const nextValue = field.type === "NUMBER" ? (event.target.value === "" ? null : Number(event.target.value)) : event.target.value;
                onChange(nextValue);
            }}
            ref={inputRef as any}
            className="h-auto w-full rounded-md border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/30"
        />
    );
}
