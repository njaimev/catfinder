import { z } from "@hono/zod-openapi";

export const RegisterSchema = z
  .object({
    email: z.string().email("Email inválido").openapi({ example: "usuario@correo.com" }),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").openapi({ example: "contrasena123" }),
    nombre: z.string().min(1).max(100).optional().openapi({ example: "Javier" }),
  })
  .openapi("RegisterInput");

export const LoginSchema = z
  .object({
    email: z.string().email("Email inválido").openapi({ example: "usuario@correo.com" }),
    password: z.string().min(1, "La contraseña es obligatoria").openapi({ example: "contrasena123" }),
  })
  .openapi("LoginInput");

export const UsuarioPublicoSchema = z
  .object({
    id: z.number(),
    email: z.string(),
    nombre: z.string().nullable(),
  })
  .openapi("UsuarioPublico");

export const TokenSchema = z
  .object({
    token: z.string(),
  })
  .openapi("TokenResponse");
