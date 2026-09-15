# BRIEF — Sistema de Gestión de Álbum de Láminas (Razas de Gatos)

## 1. Resumen del proyecto

Aplicación web para que un coleccionista lleve el control de su álbum de láminas
de razas de gatos: qué láminas tiene, cuáles le faltan y cuáles tiene repetidas.
El proyecto es una prueba/ejercicio técnico, por lo que además del sistema
funcionando se debe entregar documentación de la API y evidencia de pruebas
(capturas de pantalla) por cada endpoint/regla de negocio verificada.

## 2. Objetivo

Permitir registrar, consultar, actualizar y eliminar láminas coleccionadas,
y obtener reportes de:
- Láminas faltantes (razas del catálogo que el usuario aún no tiene).
- Láminas repetidas, con la cantidad de copias repetidas por cada raza.

## 3. Alcance

### Incluido
- Aplicación web (frontend + backend) contenerizada con Docker Compose.
- Registro (sign up) e inicio de sesión (login) de usuarios.
- Cada usuario tiene **un único álbum personal**: el álbum no se comparte
  entre cuentas y las láminas de un usuario no son visibles ni editables
  por otro.
- API REST con operaciones CRUD sobre láminas, protegida por autenticación
  (cada operación aplica sobre el álbum del usuario autenticado).
- Carga unitaria de una lámina y carga masiva (listado largo) de láminas.
- Endpoint de reporte: faltantes y repetidas (con conteo de repetidas),
  calculado sobre el álbum del usuario autenticado.
- Documentación de API navegable (OpenAPI/Swagger) más una guía simple en
  Markdown con ejemplos de request/response listos para probar (curl/Postman).
- Pruebas de los endpoints y de la lógica de negocio, documentadas con
  screenshots en un informe.

### Fuera de alcance (por ahora)
- Colaboración o compartición de un mismo álbum entre varias cuentas.
- Roles/permisos (admin vs usuario); todos los usuarios tienen el mismo tipo
  de cuenta.
- Recuperación de contraseña, verificación de email, login social (a menos
  que se pida más adelante).
- Marketplace o intercambio de láminas entre usuarios.
- Notificaciones, pagos o integraciones externas.

## 4. Entidades y datos

### Usuario
Cada usuario tiene su propia cuenta y su propio álbum (relación 1 a 1
usuario–álbum, o bien las láminas quedan directamente asociadas a un
`usuario_id`, sin entidad álbum intermedia).

Campos sugeridos:
- `id`
- `email` (único, usado para login)
- `password_hash` (nunca se guarda ni se devuelve la contraseña en texto plano)
- `nombre` (opcional, para mostrar en la UI)
- `creado_en`

### Catálogo de razas (base del álbum)
El álbum se completa contra un catálogo fijo de razas de gatos. Cada raza tiene
un nivel de rareza que determina qué tan "legendaria" es la lámina
(mientras más rara es la raza, más legendaria es la lámina), y **también
tiene su propia foto oficial**: la imagen de la lámina de una raza es la
misma para todos los usuarios y para todas las copias que se tengan de ella.

Campos del catálogo de razas:
- `id`
- `nombre` (nombre de la raza, único)
- `rareza` (Común, Poco común, Rara, Legendaria)
- `foto`: imagen oficial de la raza, **guardada como binario dentro de
  MySQL** (no como archivo en disco ni en un storage externo).

El catálogo se construye desde cero con un listado curado de razas de gatos
reales, con rareza asignada al azar (no en base a la rareza real de la
raza en el mundo real, sino como mecánica del juego/álbum), y su respectiva
foto. Ver el listado completo en [CATALOGO_RAZAS.md](CATALOGO_RAZAS.md).

### Lámina coleccionada (registro del usuario)
Al ingresar una lámina, el usuario **solo indica la raza (elegida desde el
listado del catálogo) y la fecha en que la agregó**. Tanto la rareza como
la foto de la lámina **se completan automáticamente** a partir de la raza
elegida, tomándolas siempre del catálogo. Ninguna de las dos se sube ni se
edita a nivel de lámina individual — solo existen a nivel de catálogo.

Datos mínimos solicitados:
- `usuario_id`: dueño de la lámina (FK al usuario autenticado; toda lámina
  pertenece a un único usuario).
- `fecha_agregada`: fecha en que se agregó la lámina a la colección.
- `raza_id`: raza de gato que representa la lámina (FK al catálogo; se elige
  de un listado, no se escribe libremente).

Datos derivados/adicionales:
- `id` autogenerado.
- `rareza` y `foto`: **no se guardan duplicadas en la lámina**, se obtienen
  siempre por join/relación contra el catálogo de razas — así, si la foto o
  la rareza de una raza cambian en el catálogo, se reflejan automáticamente
  en todas las láminas ya coleccionadas de esa raza, sin tener que
  actualizar cada fila.

### Relación usuario–lámina (decidido)
**Cada copia física de una lámina es una fila independiente** en la tabla
`Lamina`, relacionada por FK tanto al `Usuario` dueño como a la `Raza` que
representa (`Usuario 1—N Lamina`, `Raza 1—N Lamina`). No se guarda un campo
`cantidad` manual: se calcula siempre agregando filas, lo que evita
inconsistencias (un contador manual se puede desincronizar; contar filas no).
Esto encaja con que cada copia tiene su propia `fecha_agregada` (dos copias
de la misma raza pueden haberse agregado en momentos distintos), aunque la
foto y la rareza sean las mismas para todas las copias de una misma raza
(vienen del catálogo).

Con este modelo, los conteos salen directamente de la base de datos:
- **Total de láminas de un usuario**: `COUNT(*)` de `Lamina` filtrando por
  `usuario_id`.
- **Repetidas por raza**: agrupar las láminas del usuario por `raza_id`
  (`GROUP BY raza_id`) y quedarse con los grupos que tienen más de una fila;
  la cantidad de repetidas de esa raza es `COUNT(*) - 1`.
- **Faltantes**: razas del catálogo cuyo `id` no aparece en ninguna fila de
  `Lamina` de ese usuario (`NOT IN` / `LEFT JOIN ... WHERE NULL`).

## 5. Funcionalidades (requisitos funcionales)

1. **Autenticación**
   - Registro de usuario (`email` + contraseña; contraseña almacenada
     hasheada, nunca en texto plano).
   - Inicio de sesión, devolviendo un token (JWT) o sesión que el frontend
     usa para las siguientes llamadas.
   - Todos los endpoints de láminas y reportes requieren estar autenticado
     y operan únicamente sobre el álbum del usuario autenticado.

2. **CRUD de láminas**
   - Crear una lámina (alta unitaria): el usuario solo indica la raza
     (elegida desde el listado del catálogo) y la fecha en que la agregó;
     la foto y la rareza se completan automáticamente desde el catálogo, sin
     que el usuario deba subir ni elegir nada más.
   - Alta masiva: permitir cargar un listado largo de láminas en una sola
     operación (cada fila trae solo `raza_id` + `fecha_agregada`; foto y
     rareza se resuelven igual por relación con el catálogo).
   - Listar láminas registradas (la respuesta trae los metadatos más la foto
     de la raza correspondiente, ver sección 7).
   - Consultar el detalle de una lámina.
   - Actualizar una lámina (ej. corregir fecha o raza; la foto/rareza se
     recalculan solas si cambia la raza).
   - Eliminar una lámina.

3. **Reporte de faltantes**
   - Comparar el catálogo completo de razas contra las láminas que el usuario
     ya posee y devolver el listado de razas que faltan.

4. **Reporte de repetidas**
   - Devolver el listado de razas de las que el usuario tiene más de una
     copia, indicando la cantidad de repetidas por cada una
     (repetidas = cantidad total − 1, o el criterio que se defina).

5. **Documentación de la API**
   - Documentación interactiva vía OpenAPI/Swagger.
   - Guía simple en Markdown con ejemplos de request/response y datos
     necesarios para poder probar cada endpoint (ej. con curl o Postman).

6. **Pruebas**
   - Pruebas automatizadas (unitarias/integración) que cubran los endpoints
     CRUD y la lógica de negocio de faltantes/repetidas.
   - Informe de pruebas con capturas de pantalla de cada prueba ejecutada
     (por ejemplo, ejecución de la suite de tests y/o pruebas manuales en
     Swagger UI o Postman).

## 6. Reglas de negocio

- Una raza es "más legendaria" cuanto más rara es (a definir escala de
  rareza en el catálogo, ej.: Común, Poco común, Rara, Legendaria).
- Una lámina repetida es cualquier copia adicional de una raza que el
  usuario ya posee.
- El listado de faltantes se calcula como: catálogo total de razas − razas
  que el usuario ya tiene al menos una vez, **dentro del álbum del usuario
  autenticado** (nunca contra láminas de otros usuarios).
- El catálogo de razas es global y compartido por todos los usuarios; lo
  único que es privado por usuario son sus láminas coleccionadas.
- La carga masiva no debe interrumpirse completa por un solo registro
  inválido; se debe informar qué registros se guardaron y cuáles fallaron
  (a validar con Zod).
- No se permite consultar, editar ni borrar láminas que pertenecen a otro
  usuario (el `usuario_id` de la lámina siempre debe coincidir con el del
  usuario autenticado).

## 7. Manejo de la foto (decidido)

- La foto **pertenece a la raza del catálogo, no a la lámina individual**:
  todas las copias de una misma raza (de cualquier usuario) comparten la
  misma imagen. El usuario nunca sube una foto al agregar una lámina.
- El binario se guarda **directamente en MySQL** (columna tipo `LONGBLOB` en
  la tabla `Raza`), junto con su tipo MIME (ej. `image/jpeg`), para poder
  devolverlo con el `Content-Type` correcto al servirlo.
- Las fotos del catálogo se cargan como **archivo binario** vía
  `multipart/form-data` — ya sea a través del script de seed inicial (que
  lee los archivos de imagen de cada raza desde disco y los inserta en la
  base de datos) o, si más adelante se agrega un panel de administración
  del catálogo, a través de un endpoint de gestión de razas.
- Para no inflar las respuestas de listado (que no deberían traer megabytes
  de imagen por cada fila), la imagen se sirve por un endpoint dedicado
  (`GET /api/v1/razas/:id/foto`); el listado y el detalle de una lámina
  devuelven solo metadatos (incluyendo `raza_id`) más la URL a ese endpoint.
- Se debe validar tipo de archivo permitido (ej. solo imágenes: jpg/png/webp)
  y un tamaño máximo razonable por archivo, para evitar cargar la base de
  datos con archivos arbitrarios o demasiado pesados.

## 8. Entregables

- Código fuente del frontend y backend en un solo repositorio.
- `docker-compose.yml` para levantar todo el stack (frontend, backend, MySQL).
- Documentación OpenAPI/Swagger expuesta por el backend.
- `docs/` con esta guía, la guía de stack técnico, el catálogo inicial de
  razas y la documentación de endpoints con ejemplos de request/response.
- Informe de pruebas con screenshots.

## 9. Preguntas abiertas / a confirmar

- ¿Autenticación con JWT stateless o sesión con cookie? (por defecto se
  propone JWT, ver STACK.md).

### Ya decidido
- La raza de una lámina se elige desde el listado del catálogo (no se
  escribe libremente); la rareza y la foto se autocompletan a partir de esa
  raza, obtenidas siempre por relación con el catálogo (no se duplican en
  la lámina). Al agregar una lámina, el usuario solo indica raza + fecha.
- El álbum es por usuario: existen registro (sign up) y login; cada cuenta
  tiene un único álbum propio, sin colaboración ni álbumes compartidos entre
  cuentas.
- Cada copia de una lámina es una fila propia en la tabla `Lamina`, con FK a
  `Usuario` y a `Raza`. No existe un campo `cantidad` manual: el total por
  usuario y las repetidas por raza se calculan agregando filas (`COUNT` /
  `GROUP BY`), ver sección 4.
- La foto vive en el catálogo (`Raza`), no en la lámina: se carga como
  binario dentro de MySQL vía `multipart/form-data` (a través del seed
  inicial, o de un futuro endpoint de administración del catálogo) y se
  sirve por un endpoint dedicado. Ver sección 7.
- El catálogo inicial se construye desde cero con un listado curado de ~50
  razas de gatos reales, con rareza asignada al azar (no según rareza real
  de la raza) para definir qué tan "legendaria" es cada lámina, y con su
  foto oficial correspondiente. Se carga por un script de seed de Prisma.
  Ver [CATALOGO_RAZAS.md](CATALOGO_RAZAS.md).
- Las 50 fotos del catálogo ya se obtuvieron (de Wikipedia/Wikimedia Commons,
  con licencia libre) y están en `apps/backend/prisma/seed-assets/`, listas
  para que el seed las cargue. El crédito/licencia de cada una está en
  [ATTRIBUTIONS.md](ATTRIBUTIONS.md) — revisar antes de usar el catálogo
  fuera de este ejercicio educativo.
