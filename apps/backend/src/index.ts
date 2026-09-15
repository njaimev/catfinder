import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { env } from "./env";
import type { AppEnv } from "./types";
import { authRoutes } from "./routes/auth";
import { razaRoutes } from "./routes/razas";
import { laminaRoutes } from "./routes/laminas";
import { reporteRoutes } from "./routes/reportes";

const app = new OpenAPIHono<AppEnv>();

app.use("/api/*", cors());

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/razas", razaRoutes);
app.route("/api/v1/laminas", laminaRoutes);
app.route("/api/v1/reportes", reporteRoutes);

app.doc("/api/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "catFinder API",
    version: "1.0.0",
    description:
      "API para gestionar un álbum de láminas de razas de gatos: alta de láminas (unitaria y masiva), y reportes de faltantes/repetidas.",
  },
});

app.get("/api/docs", swaggerUI({ url: "/api/openapi.json" }));

app.get("/health", (c) => c.json({ status: "ok" }));

console.log(`catFinder API escuchando en el puerto ${env.PORT}`);
console.log(`Swagger UI: http://localhost:${env.PORT}/api/docs`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
