import { sign } from "hono/jwt";
import { env } from "../env";

export interface JwtPayload {
  sub: number;
  email: string;
  exp: number;
  [key: string]: unknown;
}

export const JWT_ALG = "HS256";

const SIETE_DIAS_EN_SEGUNDOS = 60 * 60 * 24 * 7;

export async function createToken(usuarioId: number, email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SIETE_DIAS_EN_SEGUNDOS;
  return sign({ sub: usuarioId, email, exp }, env.JWT_SECRET, JWT_ALG);
}
