/* Petit runner pour appliquer les fichiers .sql du dossier /database
 * Usage: node scripts/run-sql.js migrations   -> applique database/migrations/*.sql dans l'ordre
 *        node scripts/run-sql.js seed         -> applique database/seed/*.sql
 *
 * Pour "migrations", une table schema_migrations garde la trace des fichiers
 * déjà appliqués, pour ne rejouer que les nouveaux à chaque exécution.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ALREADY_EXISTS = '42P07';

async function main() {
  const kind = process.argv[2];
  if (!kind || !['migrations', 'seed'].includes(kind)) {
    console.error('Usage: node scripts/run-sql.js <migrations|seed>');
    process.exit(1);
  }

  const dir = path.join(__dirname, '..', '..', 'database', kind);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let applied = new Set();
  if (kind === 'migrations') {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    const { rows } = await client.query('SELECT filename FROM schema_migrations');
    applied = new Set(rows.map((r) => r.filename));
  }

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping ${kind}/${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`Applying ${kind}/${file} ...`);
    try {
      await client.query(sql);
    } catch (err) {
      // Bascule vers le suivi par schema_migrations depuis une base où une
      // ancienne migration (ex: 001_init.sql) avait déjà été appliquée
      // avant que cette table n'existe : on la marque appliquée sans la
      // rejouer plutôt que d'échouer sur "relation already exists".
      if (kind === 'migrations' && err.code === ALREADY_EXISTS) {
        console.log(`  (déjà présent en base, ${file} marqué comme appliqué sans être rejoué)`);
      } else {
        throw err;
      }
    }

    if (kind === 'migrations') {
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
    }
  }

  await client.end();
  console.log(`Done: ${kind}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
