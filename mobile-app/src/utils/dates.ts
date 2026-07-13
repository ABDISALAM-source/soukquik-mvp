const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
export const WEEKDAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Prochains `count` jours (aujourd'hui inclus), en UTC pour rester cohérent avec le backend (weekday calculé via getUTCDay). */
export function nextDays(count: number): { date: string; label: string; weekday: number }[] {
  const today = new Date();
  const base = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const result = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    const weekday = d.getUTCDay();
    result.push({ date: toDateString(d), label: `${WEEKDAY_LABELS[weekday]} ${d.getUTCDate()}`, weekday });
  }
  return result;
}
