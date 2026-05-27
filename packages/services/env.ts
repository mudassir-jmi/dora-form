import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().min(32).describe("Secret key for JWT token"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
