import {  router } from "./trpc.js";

import { healthRouter } from "./routes/health/route.js";
import { authRouter } from "./routes/auth/route.js";
import { formRouter } from "./routes/form/route.js";
import { productRouter } from "./routes/product/route.js";

export const serverRouter = router({
    health: healthRouter,
    auth: authRouter,
    form: formRouter,
    product: productRouter,
});

export { createContext } from "./context.js";
export type ServerRouter = typeof serverRouter;
