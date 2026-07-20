// Formule de Haversine en SQL (distance à vol d'oiseau, en km). Le
// LEAST(1, ...) protège contre les erreurs d'arrondi en virgule flottante
// qui peuvent pousser l'argument d'acos légèrement au-dessus de 1 (ce qui
// ferait renvoyer NaN au lieu d'une distance ~0).
export function haversineSql(latParam: string, lngParam: string, latCol: string, lngCol: string) {
  return `(6371 * acos(LEAST(1, cos(radians(${latParam})) * cos(radians(${latCol})) * cos(radians(${lngCol}) - radians(${lngParam})) + sin(radians(${latParam})) * sin(radians(${latCol})))))`;
}
