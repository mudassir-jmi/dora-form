import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
    enableStreaming?: boolean;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
    const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
    return c({

        url:
            process.env.NODE_ENV === "development"
                ? "http://localhost:8600/trpc"
                : env.NEXT_PUBLIC_API_URL ?? "http://localhost:8600/trpc",
        fetch(url, options) {
            return fetch(url, {
                ...options,
                credentials: "include",
            });
        },
    });
};
