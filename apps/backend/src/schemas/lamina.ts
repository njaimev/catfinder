import { z } from "@hono/zod-openapi";
import { RazaSchema } from "./raza";

function esFechaValida(valor: string): boolean {
  return !Number.isNaN(Date.parse(valor));
}

export const CrearLaminaSchema = z
  .object({
    razaId: z.number().int().positive().openapi({ example: 1 }),
    fechaAgregada: z
      .string()
      .refine(esFechaValida, "Fecha inválida")
      .openapi({ example: "2026-01-15" }),
  })
  .openapi("CrearLaminaInput");

export const ActualizarLaminaSchema = z
  .object({
    razaId: z.number().int().positive().optional(),
    fechaAgregada: z.string().refine(esFechaValida, "Fecha inválida").optional(),
  })
  .openapi("ActualizarLaminaInput");

export const CargaMasivaSchema = z
  .object({
    laminas: z.array(CrearLaminaSchema).min(1).max(1000),
  })
  .openapi("CargaMasivaInput");

export const LaminaSchema = z
  .object({
    id: z.number(),
    fechaAgregada: z.string(),
    raza: RazaSchema,
  })
  .openapi("Lamina");

export const CargaMasivaResultadoSchema = z
  .object({
    creadas: z.number(),
    fallidas: z.array(
      z.object({
        indice: z.number(),
        error: z.string(),
      })
    ),
  })
  .openapi("CargaMasivaResultado");
