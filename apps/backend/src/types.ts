import type { JwtPayload } from "./lib/jwt";

export type AppEnv = {
  Variables: {
    jwtPayload: JwtPayload;
  };
};
