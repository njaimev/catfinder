import { z } from "@hono/zod-openapi";

export const RarezaEnum = z.enum(["COMUN", "POCO_COMUN", "RARA", "LEGENDARIA"]).openapi("Rareza");

export const RazaSchema = z
  .object({
    id: z.number(),
    nombre: z.string(),
    rareza: RarezaEnum,
    fotoUrl: z.string().openapi({ example: "/api/v1/razas/1/foto" }),
  })
  .openapi("Raza");
