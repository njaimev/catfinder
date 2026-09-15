import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { prisma } from "../db";
import { hashPassword, verifyPassword } from "../lib/password";
import { createToken } from "../lib/jwt";
import { RegisterSchema, LoginSchema, UsuarioPublicoSchema, TokenSchema } from "../schemas/auth";
import { ErrorSchema } from "../schemas/common";
import { defaultHook } from "../lib/validation";
import type { AppEnv } from "../types";

export const authRoutes = new OpenAPIHono<AppEnv>({ defaultHook });

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  tags: ["Auth"],
  summary: "Registrar un nuevo usuario",
  request: {
    body: { content: { "application/json": { schema: RegisterSchema } } },
  },
  responses: {
    201: { content: { "application/json": { schema: UsuarioPublicoSchema } }, description: "Usuario creado" },
    409: { content: { "application/json": { schema: ErrorSchema } }, description: "El email ya está registrado" },
  },
});

authRoutes.openapi(registerRoute, async (c) => {
  const { email, password, nombre } = c.req.valid("json");

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return c.json({ error: "El email ya está registrado" }, 409);
  }

  const passwordHash = await hashPassword(password);
  const usuario = await prisma.usuario.create({
    data: { email, passwordHash, nombre },
  });

  return c.json({ id: usuario.id, email: usuario.email, nombre: usuario.nombre }, 201);
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  tags: ["Auth"],
  summary: "Iniciar sesión",
  request: {
    body: { content: { "application/json": { schema: LoginSchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: TokenSchema } }, description: "Login exitoso" },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Credenciales inválidas" },
  },
});

authRoutes.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid("json");

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return c.json({ error: "Credenciales inválidas" }, 401);
  }

  const valido = await verifyPassword(password, usuario.passwordHash);
  if (!valido) {
    return c.json({ error: "Credenciales inválidas" }, 401);
  }

  const token = await createToken(usuario.id, usuario.email);
  return c.json({ token }, 200);
});
