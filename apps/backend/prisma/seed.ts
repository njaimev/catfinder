import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function main() {
  for (const raza of razas) {
    const rutaFoto = path.join(__dirname, "seed-assets", raza.archivo);
    const foto = await readFile(rutaFoto);

    await prisma.raza.upsert({
      where: { nombre: raza.nombre },
      update: {
        rareza: raza.rareza,
        foto,
        fotoTipo: raza.fotoTipo,
        fotoNombre: raza.archivo,
      },
      create: {
        nombre: raza.nombre,
        rareza: raza.rareza,
        foto,
        fotoTipo: raza.fotoTipo,
        fotoNombre: raza.archivo,
      },
    });
    console.log(`Seed: ${raza.nombre}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
