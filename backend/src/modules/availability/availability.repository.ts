import { pool } from '../../config/db';

function mapRule(r: any) {
  return { id: r.id, providerId: r.provider_id, weekday: r.weekday, startTime: r.start_time, endTime: r.end_time };
}

function mapException(r: any) {
  return { id: r.id, providerId: r.provider_id, date: r.date, isClosed: r.is_closed, startTime: r.start_time, endTime: r.end_time };
}

export const availabilityRepository = {
  async findRulesByProvider(providerId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM availability_rules WHERE provider_id = $1 ORDER BY weekday, start_time',
      [providerId]
    );
    return rows.map(mapRule);
  },

  async findExceptionsByProvider(providerId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM availability_exceptions WHERE provider_id = $1 AND date >= CURRENT_DATE ORDER BY date',
      [providerId]
    );
    return rows.map(mapException);
  },

  async createRule(providerId: string, input: { weekday: number; startTime: string; endTime: string }) {
    const { rows } = await pool.query(
      'INSERT INTO availability_rules (provider_id, weekday, start_time, end_time) VALUES ($1,$2,$3,$4) RETURNING *',
      [providerId, input.weekday, input.startTime, input.endTime]
    );
    return mapRule(rows[0]);
  },

  async findRuleById(id: string) {
    const { rows } = await pool.query('SELECT * FROM availability_rules WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async deleteRule(id: string) {
    await pool.query('DELETE FROM availability_rules WHERE id = $1', [id]);
  },

  async upsertException(providerId: string, input: { date: string; isClosed: boolean; startTime?: string; endTime?: string }) {
    const { rows } = await pool.query(
      `INSERT INTO availability_exceptions (provider_id, date, is_closed, start_time, end_time)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (provider_id, date) DO UPDATE SET is_closed = $3, start_time = $4, end_time = $5
       RETURNING *`,
      [providerId, input.date, input.isClosed, input.startTime ?? null, input.endTime ?? null]
    );
    return mapException(rows[0]);
  },

  async findExceptionById(id: string) {
    const { rows } = await pool.query('SELECT * FROM availability_exceptions WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async deleteException(id: string) {
    await pool.query('DELETE FROM availability_exceptions WHERE id = $1', [id]);
  },

  // Résolution pour une date donnée : une exception (fermeture ou horaire
  // modifié) remplace entièrement les règles hebdo de ce jour-là, elle ne
  // s'y ajoute pas. hasAnyRule distingue "prestataire n'a rien configuré"
  // (pas de contrainte, rétrocompatible avec les réservations existantes)
  // de "configuré mais fermé ce jour précis" (vraiment indisponible).
  async resolveForDate(providerId: string, date: string, weekday: number) {
    const { rows: exceptionRows } = await pool.query(
      'SELECT * FROM availability_exceptions WHERE provider_id = $1 AND date = $2',
      [providerId, date]
    );
    if (exceptionRows[0]) {
      const ex = exceptionRows[0];
      if (ex.is_closed) return { closed: true, windows: [] as { startTime: string; endTime: string }[], hasAnyRule: true };
      return { closed: false, windows: [{ startTime: ex.start_time, endTime: ex.end_time }], hasAnyRule: true };
    }

    const { rows: anyRuleRows } = await pool.query('SELECT 1 FROM availability_rules WHERE provider_id = $1 LIMIT 1', [providerId]);
    if (anyRuleRows.length === 0) {
      return { closed: false, windows: [] as { startTime: string; endTime: string }[], hasAnyRule: false };
    }

    const { rows: ruleRows } = await pool.query(
      'SELECT * FROM availability_rules WHERE provider_id = $1 AND weekday = $2 ORDER BY start_time',
      [providerId, weekday]
    );
    if (ruleRows.length === 0) return { closed: true, windows: [] as { startTime: string; endTime: string }[], hasAnyRule: true };
    return { closed: false, windows: ruleRows.map((r: any) => ({ startTime: r.start_time, endTime: r.end_time })), hasAnyRule: true };
  },
};
