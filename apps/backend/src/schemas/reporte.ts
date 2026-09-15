import { z } from "@hono/zod-openapi";
import { RazaSchema } from "./raza";

export const RazaFaltanteSchema = RazaSchema.openapi("RazaFaltante");

export const RazaRepetidaSchema = z
  .object({
    raza: RazaSchema,
    total: z.number(),
    repetidas: z.number(),
  })
  .openapi("RazaRepetida");
