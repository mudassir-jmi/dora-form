"use client";

import React, { useEffect, useState } from "react";
import {
  IconCopy,
  IconCheck,
  IconDownload,
  IconShare3,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import QRCode from "qrcode";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface ShareFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  slug: string;
}

export function ShareFormDialog({
  isOpen,
  onClose,
  formTitle,
  slug,
}: ShareFormDialogProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const shareLink = typeof window !== "undefined"
    ? `${window.location.origin}/f/${slug}`
    : `/f/${slug}`;

  useEffect(() => {
    if (isOpen && shareLink) {
      QRCode.toDataURL(
        shareLink,
        {
          width: 300,
          margin: 1.5,
          color: {
            dark: "#000000", // Dark bits
            light: "#ffffff", // Light background
          },
        },
        (err, url) => {
          if (err) {
            console.error("QR Code Error:", err);
            return;
          }
          setQrCodeUrl(url);
        }
      );
    }
  }, [isOpen, shareLink]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qrcode_${slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <IconShare3 className="size-5 text-rose-500" />
            Share Form
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            {formTitle ? `Share "${formTitle}" with your respondents` : "Share this form with your respondents"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Form Link
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareLink}
                className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-200 text-sm focus-visible:ring-rose-500"
              />
              <Button
                onClick={handleCopy}
                className="h-10 shrink-0 bg-white hover:bg-zinc-200 text-zinc-950 px-4 font-semibold rounded-md flex items-center gap-1.5"
              >
                {copied ? (
                  <IconCheck className="size-4 text-emerald-600" />
                ) : (
                  <IconCopy className="size-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center space-y-4 border-t border-zinc-800 pt-6">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center w-full">
              QR Code
            </label>
            <div className="relative p-3 bg-white rounded-lg shadow-xl shadow-black/40 transition-transform duration-300 hover:scale-105">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Form QR Code"
                  className="size-44 object-contain rounded-md"
                />
              ) : (
                <div className="size-44 bg-zinc-900 animate-pulse rounded-md" />
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleDownloadQr}
              disabled={!qrCodeUrl}
              className="mt-2 w-full max-w-[200px] border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-md flex items-center justify-center gap-2 font-medium"
            >
              <IconDownload className="size-4" />
              Download QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
