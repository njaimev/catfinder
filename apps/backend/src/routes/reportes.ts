import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";
import { fotoUrl } from "./razas";
import { RazaFaltanteSchema, RazaRepetidaSchema } from "../schemas/reporte";
import { defaultHook } from "../lib/validation";
import type { AppEnv } from "../types";

export const reporteRoutes = new OpenAPIHono<AppEnv>({ defaultHook });
reporteRoutes.use("*", authMiddleware);

function getUsuarioId(c: Context<AppEnv>): number {
  const payload = c.get("jwtPayload");
  return payload.sub;
}

const faltantesRoute = createRoute({
  method: "get",
  path: "/faltantes",
  tags: ["Reportes"],
  summary: "Razas del catálogo que el usuario aún no tiene",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: z.array(RazaFaltanteSchema) } },
      description: "Razas faltantes",
    },
  },
});

reporteRoutes.openapi(faltantesRoute, async (c) => {
  const usuarioId = getUsuarioId(c);

  const razasConLamina = await prisma.lamina.findMany({
    where: { usuarioId },
    select: { razaId: true },
    distinct: ["razaId"],
  });
  const idsConLamina = razasConLamina.map((l) => l.razaId);

  const faltantes = await prisma.raza.findMany({
    where: { id: { notIn: idsConLamina } },
    orderBy: { nombre: "asc" },
  });

  return c.json(
    faltantes.map((r) => ({ id: r.id, nombre: r.nombre, rareza: r.rareza, fotoUrl: fotoUrl(r.id) })),
    200
  );
});

const repetidasRoute = createRoute({
  method: "get",
  path: "/repetidas",
  tags: ["Reportes"],
  summary: "Razas de las que el usuario tiene copias repetidas",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: z.array(RazaRepetidaSchema) } },
      description: "Razas repetidas",
    },
  },
});

reporteRoutes.openapi(repetidasRoute, async (c) => {
  const usuarioId = getUsuarioId(c);

  const agrupadas = await prisma.lamina.groupBy({
    by: ["razaId"],
    where: { usuarioId },
    _count: { razaId: true },
    having: { razaId: { _count: { gt: 1 } } },
  });

  if (agrupadas.length === 0) return c.json([], 200);

  const razas = await prisma.raza.findMany({ where: { id: { in: agrupadas.map((a) => a.razaId) } } });
  const razaPorId = new Map(razas.map((r) => [r.id, r]));

  const resultado = agrupadas
    .map((a) => {
      const raza = razaPorId.get(a.razaId);
      if (!raza) return null;
      const total = a._count.razaId;
      return {
        raza: { id: raza.id, nombre: raza.nombre, rareza: raza.rareza, fotoUrl: fotoUrl(raza.id) },
        total,
        repetidas: total - 1,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.raza.nombre.localeCompare(b.raza.nombre));

  return c.json(resultado, 200);
});
