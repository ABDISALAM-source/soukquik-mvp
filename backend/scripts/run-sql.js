/* Petit runner pour appliquer les fichiers .sql du dossier /database
 * Usage: node scripts/run-sql.js migrations   -> applique database/migrations/*.sql dans l'ordre
 *        node scripts/run-sql.js seed         -> applique database/seed/*.sql
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`Applying ${kind}/${file} ...`);
    await client.query(sql);
  }

  await client.end();
  console.log(`Done: ${kind}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
