import type { Hook } from "@hono/zod-openapi";

export const defaultHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    const primero = result.error.issues[0];
    const campo = primero?.path?.length ? primero.path.join(".") : result.target;
    const mensaje = primero ? `${campo}: ${primero.message}` : "Datos inválidos";
    return c.json({ error: mensaje }, 400);
  }
};
