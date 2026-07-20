import { brandsRepository } from './brands.repository';

export const brandsService = {
  search(q: string, limit = 10) {
    if (!q.trim()) return Promise.resolve([]);
    return brandsRepository.search(q.trim(), limit);
  },

  // Dédup insensible à la casse : "Nike" / "nike" / "NIKE" -> une seule marque.
  async findOrCreate(name: string) {
    const clean = name.trim();
    const existing = await brandsRepository.findByNameCI(clean);
    if (existing) return existing;
    return brandsRepository.create(clean);
  },
};
