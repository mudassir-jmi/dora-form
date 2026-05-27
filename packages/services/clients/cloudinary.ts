import { createHash, randomUUID } from "node:crypto";
import { env } from "../env.js";

const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "pdf", "mp4"] as const;
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "video/mp4",
]);
export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

export function assertAllowedUpload(file: { filename: string; mimeType: string; sizeBytes: number }) {
    const ext = file.filename.split(".").pop()?.toLowerCase() ?? "";

    if (file.sizeBytes <= 0 || file.sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
        throw new Error("File size must be 50MB or less.");
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimeType) || !ALLOWED_FORMATS.includes(ext as any)) {
        throw new Error("Only JPG, PNG, PDF, and MP4 files are allowed.");
    }
}

export function isCloudinaryUrl(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
    } catch {
        return false;
    }
}

export function createSignedUploadPayload(input: {
    slug: string;
    fieldKey: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
}) {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
        throw new Error("Cloudinary credentials are not configured.");
    }

    assertAllowedUpload(input);

    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `${input.fieldKey}-${randomUUID()}`;
    const folder = `DoraForm/${input.slug}`;
    const allowedFormats = ALLOWED_FORMATS.join(",");
    const context = `source=DoraForm|field=${input.fieldKey}`;
    const params = {
        allowed_formats: allowedFormats,
        context,
        folder,
        public_id: publicId,
        timestamp: String(timestamp),
    };

    const signatureBase = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

    const signature = createHash("sha1")
        .update(`${signatureBase}${env.CLOUDINARY_API_SECRET}`)
        .digest("hex");

    return {
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
        maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
        allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
        fields: {
            ...params,
            api_key: env.CLOUDINARY_API_KEY,
            signature,
        },
    };
}
