const { Pool } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Error: La variable de entorno DATABASE_URL no está configurada.");
    console.error("Por favor, ejecuta el script de la siguiente manera:");
    console.error('  $env:DATABASE_URL="tu-connection-string"; node migrate.js');
    process.exit(1);
  }

  console.log("Conectando a la base de datos...");
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log("Verificando y agregando columna 'startTime' a la tabla 'match'...");
    await client.query('ALTER TABLE "match" ADD COLUMN IF NOT EXISTS "startTime" timestamp;');
    console.log("Agregando columna 'externalId' a la tabla 'match'...");
    await client.query('ALTER TABLE "match" ADD COLUMN IF NOT EXISTS "externalId" text UNIQUE;');
    console.log("Agregando columna 'matchday' a la tabla 'match'...");
    await client.query('ALTER TABLE "match" ADD COLUMN IF NOT EXISTS "matchday" integer;');
    console.log("Agregando columna 'status' a la tabla 'match'...");
    await client.query('ALTER TABLE "match" ADD COLUMN IF NOT EXISTS "status" text;');
    console.log("Agregando columna 'scoreHome' a la tabla 'match'...");
    await client.query('ALTER TABLE "match" ADD COLUMN IF NOT EXISTS "scoreHome" integer;');
    console.log("Agregando columna 'scoreAway' a la tabla 'match'...");
    await client.query('ALTER TABLE "match" ADD COLUMN IF NOT EXISTS "scoreAway" integer;');
    console.log("Haciendo 'roomId' opcional en la tabla 'match'...");
    await client.query('ALTER TABLE "match" ALTER COLUMN "roomId" DROP NOT NULL;');
    console.log("¡Migración completada con éxito!");
  } catch (error) {
    console.error("Error durante la migración:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
