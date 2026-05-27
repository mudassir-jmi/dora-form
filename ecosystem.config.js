const fs = require("fs");
const path = require("path");

// Robust pure Node.js parser to load .env variables without external dependencies
function loadEnv() {
    const envPath = path.resolve(__dirname, ".env");
    const env = {};
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
                const index = trimmed.indexOf("=");
                if (index > -1) {
                    const key = trimmed.substring(0, index).trim();
                    let val = trimmed.substring(index + 1).trim();
                    // Strip enclosing quotes if present
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }
                    env[key] = val;
                }
            }
        });
    }
    return env;
}

const parsedEnv = loadEnv();

const nodeEnv = parsedEnv.NODE_ENV || "production";
const frontendPort = parseInt(parsedEnv.FRONTEND_PORT || "5600", 10);
const backendPort = parseInt(parsedEnv.BACKEND_PORT || "8600", 10);

module.exports = {
    apps: [
        {
            name: "DoraForm-frontend",
            cwd: "/root/projects/DoraForm-a-Formbuilder",
            script: "pnpm",
            args: "--filter web start",
            env: {
                NODE_ENV: nodeEnv,
                PORT: frontendPort,
            },
        },
        {
            name: "DoraForm-backend",
            cwd: "/root/projects/DoraForm-a-Formbuilder",
            script: "pnpm",
            args: "--filter @repo/api start",
            env: {
                NODE_ENV: nodeEnv,
                PORT: backendPort,
            },
        },
    ],
};
