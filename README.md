# catFinder

Sistema de gestión para coleccionistas de láminas de álbum: coleccionar todas
las razas de gatos. Cada usuario tiene su propia cuenta y su propio álbum;
al agregar una lámina solo elige la raza y la fecha en que la consiguió — la
foto y la rareza ("qué tan legendaria" es) se completan solas, tomadas del
catálogo.

## Qué hace

- **Cuentas de usuario**: registro y login con JWT; el álbum de cada usuario
  es privado.
- **Catálogo de 50 razas reales**, cada una con una rareza asignada
  (Común / Poco común / Rara / Legendaria) y su foto oficial.
- **CRUD de láminas**: alta unitaria, alta masiva (varias de una vez),
  listar, editar y eliminar — siempre acotado al álbum del usuario logueado.
- **Reportes**: razas que faltan por coleccionar, y razas repetidas con la
  cantidad de copias de más por cada una.
- **API REST documentada** con Swagger/OpenAPI, generada automáticamente
  desde los mismos esquemas de validación del backend.

## Stack y por qué se eligió cada pieza

| Pieza | Elección | Por qué es adecuada para este proyecto |
|---|---|---|
| Runtime backend | **Bun** | Runtime y gestor de paquetes en uno, arranque rápido, corre TypeScript directo sin paso de compilación aparte, y trae utilidades nativas que se usan tal cual (`Bun.password` para hashear contraseñas, sin sumar `bcrypt` como dependencia extra). |
| Framework HTTP | **Hono** | Pensado para runtimes modernos como Bun, con tipado de extremo a extremo y sin la sobrecarga de un framework tipo Express/Nest. Trae listo el middleware de JWT y CORS, y se integra de forma nativa con Zod para generar OpenAPI. |
| Lenguaje | **TypeScript** (front y back) | En un proyecto con relaciones entre usuario, lámina y raza, el tipado estático atrapa en tiempo de compilación errores de contrato (ids, fechas, forma de las respuestas) que en JS puro solo aparecerían en producción. |
| Validación | **Zod** | Los mismos esquemas que validan el body/params de cada request son la fuente de los tipos de TypeScript y de la documentación OpenAPI — una sola definición en vez de mantener tipos, validación y docs por separado. |
| Documentación API | **OpenAPI + Swagger UI** | Requisito del proyecto (API navegable y probable desde el navegador). Al generarse desde los esquemas Zod, la documentación nunca queda desincronizada del comportamiento real de la API. |
| ORM | **Prisma** | Genera un cliente TypeScript a partir de un schema declarativo, con autocompletado y chequeo de tipos en cada consulta. Simplifica especialmente las consultas de agregación (`groupBy`, conteos) que usan los reportes de faltantes/repetidas. |
| Base de datos | **MySQL** | Requisito del proyecto. Guardar la foto de cada raza como `LONGBLOB` directamente en la base evita depender de un storage de archivos externo, manteniendo todo el estado de la app en un solo lugar — más simple de levantar y respaldar para un proyecto de este tamaño. |
| Contenedores | **Docker + Docker Compose** | Requisito del proyecto. Empaqueta backend, frontend y base de datos con sus dependencias exactas: se levanta todo con un solo comando, sin instalar Bun/Node/MySQL en la máquina de quien lo prueba, evitando el clásico "en mi máquina sí funciona". |
| UI | **React + Vite** | React encaja bien con una SPA de varias vistas (álbum, alta, carga masiva, reportes) que comparten estado de sesión. Vite da un dev server con recarga instantánea y un build de producción liviano, sin la configuración pesada de alternativas más antiguas. |
| Ruteo | **React Router** | Navegación entre login/registro y las vistas protegidas del álbum sin recargar la página, con guardas simples para las rutas que requieren sesión. |
| Estilos | **Bootstrap 5** | Requisito del proyecto (minimalista, paleta pastel). Da grid, formularios, cards y badges listos para usar; sus variables CSS permiten re-temizar los colores por componente sin tener que compilar Sass. |

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

Documentación de diseño completa en [docs/](docs/):
[BRIEF.md](docs/BRIEF.md) (requisitos), [STACK.md](docs/STACK.md) (decisiones
técnicas), [CATALOGO_RAZAS.md](docs/CATALOGO_RAZAS.md) (las 50 razas del
seed) y [ATTRIBUTIONS.md](docs/ATTRIBUTIONS.md) (créditos de las fotos).

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

- Las fotos del catálogo vienen de Wikipedia/Wikimedia Commons con licencia
  libre (CC BY / CC BY-SA / dominio público). Antes de usar este catálogo
  fuera de un ejercicio educativo, revisar [ATTRIBUTIONS.md](docs/ATTRIBUTIONS.md).
- Las migraciones de Prisma usan `db push` en vez de `migrate deploy` por
  simplicidad. Para producción conviene pasar a `prisma migrate dev` /
  `migrate deploy` con migraciones versionadas.
