# STACK — Decisiones técnicas

## 1. Estructura del repositorio

Un solo repositorio, sin workspaces (sin `pnpm-workspace.yaml` / `turborepo`).
Cada app maneja sus propias dependencias con su propio `package.json` y su
propio `Dockerfile`.

```
catFinder/
├── docs/
│   ├── BRIEF.md
│   ├── STACK.md
│   └── API.md               # documentación de endpoints (request/response)
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   └── Dockerfile
│   └── frontend/
│       ├── src/
│       ├── package.json
│       └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 2. Backend

| Área | Elección | Notas |
|---|---|---|
| Runtime | **Bun** | Runtime y gestor de paquetes del backend. |
| Framework | **Hono** | Router HTTP liviano, corre nativo sobre Bun. |
| Lenguaje | **TypeScript** | Tipado estricto en todo el backend. |
| Validación | **Zod** | Validación de body/query/params y de cada fila en la carga masiva. |
| Documentación API | **OpenAPI + Swagger UI** | Generado con `@hono/zod-openapi` (Hono + Zod → spec OpenAPI) y servido con `@hono/swagger-ui`. |
| ORM | **Prisma** | Acceso a datos y migraciones contra MySQL. |
| Base de datos | **MySQL** | Contenedor propio en docker-compose, con volumen para persistencia. |
| Autenticación | **JWT** (`hono/jwt` o `jsonwebtoken`) + hash de contraseña con **bcrypt** (o `Bun.password`, nativo de Bun) | Registro/login emiten un JWT; middleware de Hono valida el token en cada ruta protegida. |
| Tests | **Bun test** (o Vitest) | Tests de integración contra la API y unitarios de la lógica de negocio (faltantes/repetidas). |

### Módulos previstos del backend
- `auth` — registro, login, hash/verificación de contraseña, emisión y
  verificación de JWT, middleware de autenticación.
- `catalogo` (razas de gatos + rareza + foto) — lectura, endpoint para
  servir la foto de una raza, y seed inicial (global, no depende del
  usuario).
- `laminas` — CRUD unitario y endpoint de carga masiva (solo `razaId` +
  `fechaAgregada`; foto y rareza se resuelven por relación con `Raza`),
  siempre acotado al `usuario_id` del token autenticado.
- `reportes` — `GET` de faltantes y `GET` de repetidas (con conteo), acotado
  al usuario autenticado.
- `openapi` — definición de schemas Zod reutilizados como contratos OpenAPI,
  incluyendo el esquema de seguridad (Bearer JWT) para las rutas protegidas.

### Notas de implementación
- Definir los schemas de Zod una sola vez y reutilizarlos tanto para
  validación de entrada como para generar los tipos de respuesta y el spec
  OpenAPI (single source of truth).
- Prisma como capa de acceso a datos; migraciones versionadas en
  `apps/backend/prisma/migrations`.
- Variables de entorno (`DATABASE_URL`, `JWT_SECRET`, puerto, etc.) vía
  `.env`, inyectadas por docker-compose. `JWT_SECRET` nunca se commitea.
- Todas las queries de `laminas`/`reportes` filtran siempre por
  `usuario_id = usuario_autenticado.id`; nunca se confía en un `usuario_id`
  recibido en el body/query del cliente.

### Modelo de datos (Prisma)

Cada copia de lámina es una fila propia, relacionada por FK a `Usuario` y a
`Raza` (ver justificación en BRIEF.md, sección 4). El conteo de láminas por
usuario y las repetidas por raza se calculan agregando filas, no con un
contador manual.

```prisma
model Usuario {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  nombre       String?
  creadoEn     DateTime @default(now())

  laminas      Lamina[]
}

enum Rareza {
  COMUN
  POCO_COMUN
  RARA
  LEGENDARIA
}

model Raza {
  id         Int      @id @default(autoincrement())
  nombre     String   @unique
  rareza     Rareza
  foto       Bytes    @db.LongBlob
  fotoTipo   String   // MIME type, ej. "image/jpeg", para servir la imagen con el Content-Type correcto
  fotoNombre String?  // nombre de archivo original (opcional, informativo)

  laminas    Lamina[]
}

model Lamina {
  id            Int      @id @default(autoincrement())
  usuarioId     Int
  usuario       Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  razaId        Int
  raza          Raza     @relation(fields: [razaId], references: [id])
  fechaAgregada DateTime
  creadoEn      DateTime @default(now())

  @@index([usuarioId])
  @@index([usuarioId, razaId])
}
```

La imagen se guarda como binario (`Bytes` / `LONGBLOB`) **en la fila de la
raza del catálogo**, no en la lámina ni en filesystem/storage externo (S3,
etc.): todas las copias de una misma raza comparten la misma foto, obtenida
siempre por relación (`lamina.raza.foto`).

- `@@index([usuarioId])`: acelera listar/contar todas las láminas de un
  usuario (`COUNT(*) WHERE usuarioId = ?`).
- `@@index([usuarioId, razaId])`: acelera el `GROUP BY razaId` acotado a un
  usuario, usado tanto para el reporte de repetidas como para el de
  faltantes.
- `onDelete: Cascade` en `usuario`: si se elimina una cuenta, se eliminan
  sus láminas (a confirmar si se desea este comportamiento o un borrado
  lógico).

Consultas de referencia:

```sql
-- Total de láminas del usuario
SELECT COUNT(*) FROM Lamina WHERE usuarioId = :usuarioId;

-- Repetidas por raza (cantidad de copias de más, por raza)
SELECT razaId, COUNT(*) AS total, COUNT(*) - 1 AS repetidas
FROM Lamina
WHERE usuarioId = :usuarioId
GROUP BY razaId
HAVING COUNT(*) > 1;

-- Faltantes (razas del catálogo sin ninguna lámina de ese usuario)
SELECT r.*
FROM Raza r
WHERE r.id NOT IN (
  SELECT razaId FROM Lamina WHERE usuarioId = :usuarioId
);
```

### Carga de imágenes (multipart) — a nivel de catálogo, no de lámina

La foto vive en `Raza`, no en `Lamina`: el usuario final nunca sube un
archivo al agregar una lámina, solo elige `razaId` y `fechaAgregada`. Por
eso los endpoints de alta de láminas van con `Content-Type: application/json`
normal (ver tabla de endpoints más abajo); el multipart se usa solo para
cargar la foto de cada raza en el catálogo:

- **Seed inicial** (camino principal): un script `apps/backend/prisma/seed.ts`
  lee un archivo de imagen por raza desde una carpeta local (ej.
  `apps/backend/prisma/seed-assets/<nombre-raza>.jpg`), lo convierte a
  `Buffer` y hace `upsert` del registro `Raza` completo (nombre, rareza,
  foto, fotoTipo) — no pasa por la API ni por multipart real, es lectura de
  filesystem al momento del seed.
- **Gestión futura del catálogo** (si se agrega un panel de administración):
  un endpoint tipo `POST /api/v1/razas` o `PATCH /api/v1/razas/:id` que sí
  reciba `Content-Type: multipart/form-data` con campos `nombre`, `rareza` y
  `foto` (archivo). Hono expone `c.req.parseBody()` para leer campos y
  archivos de un formulario multipart directamente sobre Bun/Web APIs
  (`File`/`Blob`), sin librerías adicionales tipo `multer`.
- En ambos casos, antes de guardar se valida tipo MIME permitido (jpg/png/
  webp) y tamaño máximo del archivo — con un `refine` de Zod sobre el
  objeto `File` cuando viene por la API, o una validación equivalente en el
  script de seed.
- Servir la imagen: `GET /api/v1/razas/:id/foto` responde el binario crudo
  con el header `Content-Type` tomado de `fotoTipo`. El listado/detalle de
  láminas devuelve el `razaId` (y opcionalmente la URL a este endpoint), no
  el binario embebido en el JSON.

## 3. Frontend

| Área | Elección | Notas |
|---|---|---|
| Lenguaje | **TypeScript** | Consistente con el backend. |
| Framework | A definir (sugerido: React + Vite) | Simple, rápido de levantar, sirve para un panel CRUD + vistas de reportes. |
| Estilos/UI | **Bootstrap** (v5) | Grid, formularios, tarjetas, navbar, listo para usar. Look **minimalista** y **paleta pastel** (ver abajo), no el tema por defecto de Bootstrap. |
| Cliente HTTP | `fetch` nativo o `axios` | Consumo de la API REST del backend. |
| Tipos compartidos | Se replican/derivan desde el spec OpenAPI o los tipos de Zod del backend (sin workspace compartido, por decisión del proyecto) | Evita acoplar los repos de frontend/backend en tiempo de build. |

### Estilo visual (Bootstrap minimalista + pastel)

- Se usa Bootstrap solo por su sistema de grid/componentes (cards para cada
  lámina, forms, navbar, badges para la rareza), evitando saturarlo de
  componentes: layout limpio, harto espacio en blanco, pocas líneas
  divisorias.
- Se sobrescriben las variables de color de Bootstrap 5 (`$primary`,
  `$secondary`, etc., vía Sass, o las CSS custom properties `--bs-*` si se
  usa el CSS ya compilado) con una paleta pastel propia en vez del azul/gris
  por defecto. Paleta sugerida de partida:

  | Uso | Color | Hex |
  |---|---|---|
  | Primario (botones, acentos) | Lavanda pastel | `#B8A9E3` |
  | Secundario | Menta pastel | `#A8D8C9` |
  | Fondo | Crema muy claro | `#FBF7F4` |
  | Superficie (cards) | Blanco cálido | `#FFFFFF` |
  | Texto principal | Gris carbón suave | `#4A4A4A` |
  | Éxito | Verde pastel | `#B5E3B0` |
  | Advertencia/repetidas | Durazno pastel | `#F6C9A0` |
  | Peligro | Rosa pastel | `#F3B6C2` |

  Cada nivel de rareza puede tener su propio color de `badge` dentro de esta
  misma paleta (ej. Común = gris suave, Poco común = menta, Rara = lavanda,
  Legendaria = durazno/dorado pastel), para reforzar visualmente el nivel
  de la lámina sin salirse de la paleta.
- Se define esta paleta una sola vez (variables Sass o `:root` con
  `--bs-*`) y se reutiliza en toda la app, evitando colores sueltos por
  componente.

Pantallas mínimas sugeridas:
- Listado de láminas coleccionadas (con foto y rareza de la raza, y fecha
  agregada; foto/rareza vienen del catálogo, no se ingresan a mano).
- Formulario de alta unitaria: selector de raza (con su foto/rareza de
  referencia) + fecha. Sin subida de archivo.
- Formulario/importador de carga masiva: solo raza + fecha por fila.
- Vista de "faltantes" y vista de "repetidas".

## 4. Infraestructura (Docker)

- `docker-compose.yml` en la raíz, con 3 servicios:
  - `mysql`: imagen oficial `mysql`, con volumen persistente y variables de
    entorno para usuario/clave/base de datos.
  - `backend`: build desde `apps/backend/Dockerfile`, expone el puerto de la
    API y la documentación Swagger, depende de `mysql`.
  - `frontend`: build desde `apps/frontend/Dockerfile`, expone el puerto web,
    depende de `backend`.
- Un único `docker-compose up` debe dejar todo el sistema operativo,
  incluyendo la ejecución de migraciones de Prisma (por ejemplo, como paso
  de arranque del contenedor backend) y el seed del catálogo de razas.

## 5. API REST (visión general)

Prefijo sugerido: `/api/v1`

| Método | Ruta | Auth | Content-Type | Descripción |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | No | JSON | Registro de usuario (email + contraseña). |
| POST | `/api/v1/auth/login` | No | JSON | Login, devuelve un JWT. |
| GET | `/api/v1/razas` | Sí | — | Catálogo completo de razas (con rareza y URL de foto). |
| GET | `/api/v1/razas/:id/foto` | Sí | — | Devuelve la imagen binaria oficial de la raza, con su `Content-Type`. |
| GET | `/api/v1/laminas` | Sí | — | Listar láminas del usuario autenticado (metadatos + datos de su raza). |
| GET | `/api/v1/laminas/:id` | Sí | — | Detalle de una lámina propia. |
| POST | `/api/v1/laminas` | Sí | JSON | Alta unitaria: solo `{ razaId, fechaAgregada }`. |
| POST | `/api/v1/laminas/bulk` | Sí | JSON | Alta masiva: `{ laminas: [{ razaId, fechaAgregada }, ...] }`. |
| PATCH | `/api/v1/laminas/:id` | Sí | JSON | Actualizar `razaId` y/o `fechaAgregada` de una lámina propia. |
| DELETE | `/api/v1/laminas/:id` | Sí | — | Eliminar una lámina propia. |
| GET | `/api/v1/reportes/faltantes` | Sí | — | Razas del catálogo que aún no se tienen. |
| GET | `/api/v1/reportes/repetidas` | Sí | — | Razas repetidas y cantidad de repetidas c/u. |
| GET | `/api/docs` | No | — | Swagger UI. |
| GET | `/api/openapi.json` | No | — | Spec OpenAPI en crudo. |

Rutas marcadas "Sí" requieren header `Authorization: Bearer <jwt>`, obtenido
desde `/api/v1/auth/login`. La gestión del catálogo (`Raza`, incluida su
foto) no se expone como CRUD público en esta primera versión — se puebla
por seed; ver "Carga de imágenes (multipart)" arriba.

El detalle de cada endpoint (parámetros, body, ejemplos de request/response,
códigos de error) se documenta en `docs/API.md`, complementando el Swagger UI
interactivo.

## 6. Pruebas y evidencia

- Tests automatizados por endpoint (casos felices + validaciones/errores) y
  por regla de negocio (cálculo de faltantes y repetidas).
- Informe de pruebas (`docs/TESTING.md` o similar, a crear más adelante) con
  capturas de pantalla de:
  - Ejecución de la suite de tests (resultado en consola).
  - Pruebas manuales de cada endpoint en Swagger UI o Postman.
