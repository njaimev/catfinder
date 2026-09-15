import { z } from "@hono/zod-openapi";

export const ErrorSchema = z
  .object({
    error: z.string().openapi({ example: "Mensaje de error" }),
  })
  .openapi("Error");

export const IdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Debe ser un número")
    .transform(Number)
    .openapi({ param: { name: "id", in: "path" }, example: "1" }),
});
