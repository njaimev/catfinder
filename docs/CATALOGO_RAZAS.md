# Catálogo inicial de razas (seed)

Listado inicial de razas de gatos reales y reconocidas, para poblar la tabla
`Raza` (ver [STACK.md](STACK.md)) al levantar el proyecto por primera vez.

La **rareza se asignó al azar** entre las 4 categorías definidas en el enum
`Rareza` (`COMUN`, `POCO_COMUN`, `RARA`, `LEGENDARIA`) — no refleja qué tan
rara es la raza en la vida real, es únicamente el nivel de "legendaria" que
tendrá esa lámina dentro del juego/álbum, tal como se definió en
[BRIEF.md](BRIEF.md).

Distribución usada (a modo de referencia, para que el álbum se sienta
balanceado): 18 comunes, 16 poco comunes, 11 raras, 5 legendarias.

Cada raza también tiene su **foto oficial** (ver
[STACK.md](STACK.md#carga-de-imágenes-multipart--a-nivel-de-catálogo-no-de-lámina)):
es la imagen que verán todos los usuarios para esa raza, sin importar cuántas
copias tengan.

**Las 50 fotos ya están descargadas** en
`apps/backend/prisma/seed-assets/<slug-de-la-raza>.<ext>` (el nombre de
archivo sigue la convención `<nombre-en-minúscula-y-guiones>`, ej.
`maine-coon.jpeg`, `turkish-van.png`; la extensión varía según el archivo
original). Se obtuvieron de Wikipedia/Wikimedia Commons (contenido con
licencia libre tipo CC BY / CC BY-SA / dominio público). **El crédito y la
licencia de cada foto están documentados en
[ATTRIBUTIONS.md](ATTRIBUTIONS.md)** — revisar ese archivo antes de usar el
catálogo fuera de este ejercicio educativo, ya que varias licencias exigen
mantener la atribución.

| id | nombre | rareza |
|---|---|---|
| 1 | Abyssinian (Abisinio) | RARA |
| 2 | American Bobtail | POCO_COMUN |
| 3 | American Curl | POCO_COMUN |
| 4 | American Shorthair | COMUN |
| 5 | American Wirehair | RARA |
| 6 | Balinese (Balinés) | POCO_COMUN |
| 7 | Bengal (Bengalí) | COMUN |
| 8 | Birman (Sagrado de Birmania) | COMUN |
| 9 | Bombay | POCO_COMUN |
| 10 | British Shorthair | COMUN |
| 11 | British Longhair | POCO_COMUN |
| 12 | Burmese (Burmés) | POCO_COMUN |
| 13 | Burmilla | RARA |
| 14 | Chartreux | RARA |
| 15 | Chausie | LEGENDARIA |
| 16 | Cornish Rex | POCO_COMUN |
| 17 | Devon Rex | POCO_COMUN |
| 18 | Egyptian Mau (Mau Egipcio) | RARA |
| 19 | Exotic Shorthair | COMUN |
| 20 | Havana Brown | LEGENDARIA |
| 21 | Himalayan (Himalayo) | COMUN |
| 22 | Japanese Bobtail | RARA |
| 23 | Javanese (Javanés) | POCO_COMUN |
| 24 | Korat | LEGENDARIA |
| 25 | LaPerm | POCO_COMUN |
| 26 | Maine Coon | COMUN |
| 27 | Manx | COMUN |
| 28 | Munchkin | POCO_COMUN |
| 29 | Norwegian Forest Cat (Bosque de Noruega) | COMUN |
| 30 | Ocicat | RARA |
| 31 | Oriental Shorthair | POCO_COMUN |
| 32 | Persian (Persa) | COMUN |
| 33 | Peterbald | LEGENDARIA |
| 34 | Pixie-bob | RARA |
| 35 | Ragamuffin | POCO_COMUN |
| 36 | Ragdoll | COMUN |
| 37 | Russian Blue (Azul Ruso) | COMUN |
| 38 | Savannah | RARA |
| 39 | Scottish Fold | COMUN |
| 40 | Selkirk Rex | POCO_COMUN |
| 41 | Siamese (Siamés) | COMUN |
| 42 | Siberian (Siberiano) | COMUN |
| 43 | Singapura | LEGENDARIA |
| 44 | Snowshoe | POCO_COMUN |
| 45 | Somali | RARA |
| 46 | Sphynx | COMUN |
| 47 | Tonkinese | POCO_COMUN |
| 48 | Toyger | RARA |
| 49 | Turkish Angora (Angora Turco) | COMUN |
| 50 | Turkish Van (Van Turco) | COMUN |

## Uso como seed de Prisma

Este listado se traduce a un script `apps/backend/prisma/seed.ts` que hace
`upsert` de cada raza por `nombre` (para poder correrlo más de una vez sin
duplicar filas), leyendo además el archivo de imagen correspondiente desde
`apps/backend/prisma/seed-assets/`:

```ts
import { readFile } from "node:fs/promises";
import path from "node:path";

const razas = [
  { nombre: "Abyssinian", rareza: "RARA", archivo: "abyssinian.jpg", fotoTipo: "image/jpeg" },
  { nombre: "American Bobtail", rareza: "POCO_COMUN", archivo: "american-bobtail.jpg", fotoTipo: "image/jpeg" },
  { nombre: "American Curl", rareza: "POCO_COMUN", archivo: "american-curl.jpg", fotoTipo: "image/jpeg" },
  { nombre: "American Shorthair", rareza: "COMUN", archivo: "american-shorthair.jpg", fotoTipo: "image/jpeg" },
  { nombre: "American Wirehair", rareza: "RARA", archivo: "american-wirehair.JPG", fotoTipo: "image/jpeg" },
  { nombre: "Balinese", rareza: "POCO_COMUN", archivo: "balinese.png", fotoTipo: "image/png" },
  { nombre: "Bengal", rareza: "COMUN", archivo: "bengal.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Birman", rareza: "COMUN", archivo: "birman.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Bombay", rareza: "POCO_COMUN", archivo: "bombay.JPG", fotoTipo: "image/jpeg" },
  { nombre: "British Shorthair", rareza: "COMUN", archivo: "british-shorthair.jpg", fotoTipo: "image/jpeg" },
  { nombre: "British Longhair", rareza: "POCO_COMUN", archivo: "british-longhair.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Burmese", rareza: "POCO_COMUN", archivo: "burmese.JPG", fotoTipo: "image/jpeg" },
  { nombre: "Burmilla", rareza: "RARA", archivo: "burmilla.jpeg", fotoTipo: "image/jpeg" },
  { nombre: "Chartreux", rareza: "RARA", archivo: "chartreux.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Chausie", rareza: "LEGENDARIA", archivo: "chausie.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Cornish Rex", rareza: "POCO_COMUN", archivo: "cornish-rex.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Devon Rex", rareza: "POCO_COMUN", archivo: "devon-rex.jpeg", fotoTipo: "image/jpeg" },
  { nombre: "Egyptian Mau", rareza: "RARA", archivo: "egyptian-mau.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Exotic Shorthair", rareza: "COMUN", archivo: "exotic-shorthair.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Havana Brown", rareza: "LEGENDARIA", archivo: "havana-brown.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Himalayan", rareza: "COMUN", archivo: "himalayan.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Japanese Bobtail", rareza: "RARA", archivo: "japanese-bobtail.JPG", fotoTipo: "image/jpeg" },
  { nombre: "Javanese", rareza: "POCO_COMUN", archivo: "javanese.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Korat", rareza: "LEGENDARIA", archivo: "korat.JPG", fotoTipo: "image/jpeg" },
  { nombre: "LaPerm", rareza: "POCO_COMUN", archivo: "laperm.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Maine Coon", rareza: "COMUN", archivo: "maine-coon.jpeg", fotoTipo: "image/jpeg" },
  { nombre: "Manx", rareza: "COMUN", archivo: "manx.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Munchkin", rareza: "POCO_COMUN", archivo: "munchkin.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Norwegian Forest Cat", rareza: "COMUN", archivo: "norwegian-forest-cat.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Ocicat", rareza: "RARA", archivo: "ocicat.JPG", fotoTipo: "image/jpeg" },
  { nombre: "Oriental Shorthair", rareza: "POCO_COMUN", archivo: "oriental-shorthair.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Persian", rareza: "COMUN", archivo: "persian.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Peterbald", rareza: "LEGENDARIA", archivo: "peterbald.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Pixie-bob", rareza: "RARA", archivo: "pixie-bob.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Ragamuffin", rareza: "POCO_COMUN", archivo: "ragamuffin.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Ragdoll", rareza: "COMUN", archivo: "ragdoll.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Russian Blue", rareza: "COMUN", archivo: "russian-blue.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Savannah", rareza: "RARA", archivo: "savannah.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Scottish Fold", rareza: "COMUN", archivo: "scottish-fold.JPG", fotoTipo: "image/jpeg" },
  { nombre: "Selkirk Rex", rareza: "POCO_COMUN", archivo: "selkirk-rex.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Siamese", rareza: "COMUN", archivo: "siamese.JPG", fotoTipo: "image/jpeg" },
  { nombre: "Siberian", rareza: "COMUN", archivo: "siberian.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Singapura", rareza: "LEGENDARIA", archivo: "singapura.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Snowshoe", rareza: "POCO_COMUN", archivo: "snowshoe.JPG", fotoTipo: "image/jpeg" },
  { nombre: "Somali", rareza: "RARA", archivo: "somali.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Sphynx", rareza: "COMUN", archivo: "sphynx.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Tonkinese", rareza: "POCO_COMUN", archivo: "tonkinese.jpg", fotoTipo: "image/jpeg" },
  { nombre: "Toyger", rareza: "RARA", archivo: "toyger.JPG", fotoTipo: "image/jpeg" },
  { nombre: "Turkish Angora", rareza: "COMUN", archivo: "turkish-angora.JPG", fotoTipo: "image/jpeg" },
  { nombre: "Turkish Van", rareza: "COMUN", archivo: "turkish-van.png", fotoTipo: "image/png" },
] as const;

for (const raza of razas) {
  const rutaFoto = path.join(__dirname, "seed-assets", raza.archivo);
  const foto = await readFile(rutaFoto);

  await prisma.raza.upsert({
    where: { nombre: raza.nombre },
    update: {},
    create: {
      nombre: raza.nombre,
      rareza: raza.rareza,
      foto,
      fotoTipo: raza.fotoTipo,
      fotoNombre: raza.archivo,
    },
  });
}
```

El seed se ejecuta una vez al levantar el proyecto (por ejemplo, como parte
del arranque del contenedor `backend` en `docker-compose`, después de
aplicar las migraciones de Prisma). Si falta el archivo de imagen de alguna
raza, el seed debe fallar de forma explícita en vez de crear la raza sin
foto, para detectar de inmediato assets faltantes.
