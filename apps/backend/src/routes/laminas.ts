import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";
import { fotoUrl } from "./razas";
import {
  CrearLaminaSchema,
  ActualizarLaminaSchema,
  CargaMasivaSchema,
  LaminaSchema,
  CargaMasivaResultadoSchema,
} from "../schemas/lamina";
import { ErrorSchema, IdParamSchema } from "../schemas/common";
import { defaultHook } from "../lib/validation";
import type { AppEnv } from "../types";
import type { Raza } from "@prisma/client";

export const laminaRoutes = new OpenAPIHono<AppEnv>({ defaultHook });
laminaRoutes.use("*", authMiddleware);

function getUsuarioId(c: Context<AppEnv>): number {
  const payload = c.get("jwtPayload");
  return payload.sub;
}

function serializeLamina(lamina: { id: number; fechaAgregada: Date; raza: Raza }) {
  return {
    id: lamina.id,
    fechaAgregada: lamina.fechaAgregada.toISOString(),
    raza: {
      id: lamina.raza.id,
      nombre: lamina.raza.nombre,
      rareza: lamina.raza.rareza,
      fotoUrl: fotoUrl(lamina.raza.id),
    },
  };
}

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Laminas"],
  summary: "Listar las láminas del usuario autenticado",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { content: { "application/json": { schema: z.array(LaminaSchema) } }, description: "Listado de láminas" },
  },
});

laminaRoutes.openapi(listRoute, async (c) => {
  const usuarioId = getUsuarioId(c);
  const laminas = await prisma.lamina.findMany({
    where: { usuarioId },
    include: { raza: true },
    orderBy: { fechaAgregada: "desc" },
  });
  return c.json(laminas.map(serializeLamina), 200);
});

const detailRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Laminas"],
  summary: "Detalle de una lámina propia",
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: { content: { "application/json": { schema: LaminaSchema } }, description: "Lámina encontrada" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "No encontrada" },
  },
});

laminaRoutes.openapi(detailRoute, async (c) => {
  const usuarioId = getUsuarioId(c);
  const { id } = c.req.valid("param");
  const lamina = await prisma.lamina.findFirst({ where: { id, usuarioId }, include: { raza: true } });
  if (!lamina) return c.json({ error: "No encontrada" }, 404);
  return c.json(serializeLamina(lamina), 200);
});

const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: ["Laminas"],
  summary: "Alta unitaria de una lámina",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CrearLaminaSchema } } } },
  responses: {
    201: { content: { "application/json": { schema: LaminaSchema } }, description: "Lámina creada" },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "Raza inexistente o datos inválidos" },
  },
});

laminaRoutes.openapi(createRouteDef, async (c) => {
  const usuarioId = getUsuarioId(c);
  const { razaId, fechaAgregada } = c.req.valid("json");

  const raza = await prisma.raza.findUnique({ where: { id: razaId } });
  if (!raza) return c.json({ error: "La raza indicada no existe" }, 400);

  const lamina = await prisma.lamina.create({
    data: { usuarioId, razaId, fechaAgregada: new Date(fechaAgregada) },
    include: { raza: true },
  });
  return c.json(serializeLamina(lamina), 201);
});

const bulkRoute = createRoute({
  method: "post",
  path: "/bulk",
  tags: ["Laminas"],
  summary: "Alta masiva de láminas",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CargaMasivaSchema } } } },
  responses: {
    201: {
      content: { "application/json": { schema: CargaMasivaResultadoSchema } },
      description: "Resultado de la carga masiva",
    },
  },
});

laminaRoutes.openapi(bulkRoute, async (c) => {
  const usuarioId = getUsuarioId(c);
  const { laminas } = c.req.valid("json");

  const razaIds = [...new Set(laminas.map((l) => l.razaId))];
  const razasExistentes = await prisma.raza.findMany({ where: { id: { in: razaIds } } });
  const razaIdsValidos = new Set(razasExistentes.map((r) => r.id));

  let creadas = 0;
  const fallidas: { indice: number; error: string }[] = [];

  for (let indice = 0; indice < laminas.length; indice++) {
    const item = laminas[indice];
    if (!razaIdsValidos.has(item.razaId)) {
      fallidas.push({ indice, error: `La raza ${item.razaId} no existe` });
      continue;
    }
    try {
      await prisma.lamina.create({
        data: { usuarioId, razaId: item.razaId, fechaAgregada: new Date(item.fechaAgregada) },
      });
      creadas++;
    } catch {
      fallidas.push({ indice, error: "No se pudo guardar la lámina" });
    }
  }

  return c.json({ creadas, fallidas }, 201);
});

const updateRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Laminas"],
  summary: "Actualizar una lámina propia",
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { "application/json": { schema: ActualizarLaminaSchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: LaminaSchema } }, description: "Lámina actualizada" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "No encontrada" },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "Raza inexistente" },
  },
});

laminaRoutes.openapi(updateRoute, async (c) => {
  const usuarioId = getUsuarioId(c);
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const existente = await prisma.lamina.findFirst({ where: { id, usuarioId } });
  if (!existente) return c.json({ error: "No encontrada" }, 404);

  if (body.razaId !== undefined) {
    const raza = await prisma.raza.findUnique({ where: { id: body.razaId } });
    if (!raza) return c.json({ error: "La raza indicada no existe" }, 400);
  }

  const lamina = await prisma.lamina.update({
    where: { id },
    data: {
      razaId: body.razaId,
      fechaAgregada: body.fechaAgregada ? new Date(body.fechaAgregada) : undefined,
    },
    include: { raza: true },
  });

  return c.json(serializeLamina(lamina), 200);
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Laminas"],
  summary: "Eliminar una lámina propia",
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    204: { description: "Eliminada" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "No encontrada" },
  },
});

laminaRoutes.openapi(deleteRoute, async (c) => {
  const usuarioId = getUsuarioId(c);
  const { id } = c.req.valid("param");

  const existente = await prisma.lamina.findFirst({ where: { id, usuarioId } });
  if (!existente) return c.json({ error: "No encontrada" }, 404);

  await prisma.lamina.delete({ where: { id } });
  return c.body(null, 204);
});
