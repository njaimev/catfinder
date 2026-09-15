import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";
import { RazaSchema } from "../schemas/raza";
import { defaultHook } from "../lib/validation";
import type { AppEnv } from "../types";

export const razaRoutes = new OpenAPIHono<AppEnv>({ defaultHook });

// La lista de razas es privada (requiere sesión), pero la foto se sirve sin
// autenticación: un <img src> del navegador no puede mandar el header
// Authorization, y una foto de raza no es información sensible.
razaRoutes.use("/", authMiddleware);

export function fotoUrl(razaId: number): string {
  return `/api/v1/razas/${razaId}/foto`;
}

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Razas"],
  summary: "Listar el catálogo completo de razas",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { content: { "application/json": { schema: z.array(RazaSchema) } }, description: "Catálogo de razas" },
  },
});

razaRoutes.openapi(listRoute, async (c) => {
  const razas = await prisma.raza.findMany({ orderBy: { nombre: "asc" } });
  return c.json(
    razas.map((r) => ({ id: r.id, nombre: r.nombre, rareza: r.rareza, fotoUrl: fotoUrl(r.id) })),
    200
  );
});

razaRoutes.get("/:id/foto", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "Id inválido" }, 400);
  }

  const raza = await prisma.raza.findUnique({ where: { id } });
  if (!raza) {
    return c.json({ error: "Raza no encontrada" }, 404);
  }

  return c.body(new Uint8Array(raza.foto), 200, {
    "Content-Type": raza.fotoTipo,
    "Cache-Control": "public, max-age=86400",
  });
});
