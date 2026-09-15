# catFinder

Sistema de gestión para coleccionistas de láminas de álbum: coleccionar todas
las razas de gatos. Cada usuario tiene su propia cuenta y su propio álbum;
al agregar una lámina solo se elige la raza y la fecha — la foto y la rareza
("qué tan legendaria" es) se completan solas desde el catálogo.

Documentación de diseño completa en [docs/](docs/):
[BRIEF.md](docs/BRIEF.md) (requisitos), [STACK.md](docs/STACK.md) (decisiones
técnicas), [CATALOGO_RAZAS.md](docs/CATALOGO_RAZAS.md) (las 50 razas del
seed) y [ATTRIBUTIONS.md](docs/ATTRIBUTIONS.md) (créditos de las fotos).

## Cómo levantar el proyecto

Requisito único: **Docker** y **Docker Compose**. No hace falta instalar
Bun, Node ni MySQL en tu máquina — todo corre en contenedores.

```bash
cp .env.example .env
docker compose up --build
```

Esto levanta:

- **MySQL** en `localhost:3306` (persistente en un volumen).
- **Backend** (Hono + Bun + Prisma) en `http://localhost:3000`. Al arrancar,
  aplica el esquema a la base de datos (`prisma db push`) y siembra las 50
  razas del catálogo con sus fotos.
- **Frontend** (React + Vite + Bootstrap) en `http://localhost:5173`.

Documentación interactiva de la API: `http://localhost:3000/api/docs`
(Swagger UI). Spec en crudo: `http://localhost:3000/api/openapi.json`.

## Estructura del repo

```
catFinder/
├── docs/                 # Documentación de diseño y de la API
├── apps/
│   ├── backend/          # Hono + Bun + Prisma + MySQL
│   └── frontend/         # React + Vite + Bootstrap
└── docker-compose.yml
```

Repositorio único, sin workspace: cada app tiene su propio `package.json`.

## Desarrollo local (opcional, sin Docker)

Si tienes Bun instalado y una base de datos MySQL accesible:

```bash
cd apps/backend
cp .env.example .env   # ajusta DATABASE_URL
bun install
bun run prisma:generate
bun run prisma:push
bun run prisma:seed
bun run dev
```

```bash
cd apps/frontend
cp .env.example .env
bun install
bun run dev
```

## Notas

- Este proyecto no se compiló ni se ejecutó en el entorno donde se generó
  (no había Docker/Bun/Node disponibles ahí) — está pendiente el primer
  `docker compose up --build` real. Si algo falla al levantarlo, comparte
  el log del servicio que falló para corregirlo.
- Las migraciones de Prisma usan `db push` en vez de `migrate deploy` por
  ahora (no había una base de datos disponible para generar los archivos de
  migración versionados). Se puede migrar a `prisma migrate dev` más
  adelante corriendo el comando localmente con la base de datos levantada.
