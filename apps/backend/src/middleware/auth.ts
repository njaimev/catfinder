import { jwt } from "hono/jwt";
import { env } from "../env";
import { JWT_ALG } from "../lib/jwt";

export const authMiddleware = jwt({ secret: env.JWT_SECRET, alg: JWT_ALG });
