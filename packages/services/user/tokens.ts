import jwt from "jsonwebtoken";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { env } from "../env.js";

export function generatePasswordHash(password: string, salt: string) {
    return createHmac("sha256", salt).update(password).digest("hex");
}

export function createSalt() {
    return randomBytes(16).toString("hex");
}

export function createOpaqueToken() {
    const rawToken = randomBytes(32).toString("base64url");
    return {
        rawToken,
        tokenHash: hashOpaqueToken(rawToken),
    };
}

export function hashOpaqueToken(rawToken: string) {
    return createHash("sha256").update(rawToken).digest("hex");
}

export function signUserJwt(payload: { id: string }) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}

export function verifyUserJwt(token: string) {
    return jwt.verify(token, env.JWT_SECRET) as { id: string };
}
