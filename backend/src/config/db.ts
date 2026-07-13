import { Pool, types } from 'pg';
import { env } from './env';

// Par défaut pg parse les colonnes DATE en objets Date JS à partir de
// minuit UTC, puis Node les réaffiche dans le fuseau du serveur — un
// serveur en UTC-N décale la date affichée d'un jour. On garde la chaîne
// brute "YYYY-MM-DD" telle quelle (utilisée par availability_exceptions.date).
types.setTypeParser(1082, (val) => val);

export const pool = new Pool({ connectionString: env.databaseUrl });

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected PostgreSQL pool error', err);
});
