import { Errors } from '../../common/errors';
import { shopsRepository } from '../shops/shops.repository';
import { computeDHash, computeDHashFromUrl, hammingDistance } from '../../common/imageHash';
import { productsRepository, mapProduct } from './products.repository';
import { CreateProductInput, UpdateProductInput } from './products.types';

// Seuil de similarité pour la recherche par image : un dHash à ≤ 14 bits de
// différence (sur 64) est considéré comme un match plausible.
const IMAGE_MATCH_THRESHOLD = 14;

async function assertShopOwner(shopId: string, ownerId: string) {
  const shop = await shopsRepository.findRawById(shopId);
  if (!shop) throw Errors.notFound('Boutique introuvable');
  if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
  return shop;
}

async function assertProductOwner(productId: string, ownerId: string) {
  const product = await productsRepository.findById(productId);
  if (!product) throw Errors.notFound('Produit introuvable');
  const shop = await shopsRepository.findRawById(product.shop_id);
  if (!shop || shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de ce produit");
  return product;
}

export const productsService = {
  listByShop(shopId: string) {
    return productsRepository.findByShop(shopId);
  },

  async create(shopId: string, ownerId: string, input: CreateProductInput) {
    await assertShopOwner(shopId, ownerId);
    // Empreinte perceptuelle de l'image (best-effort) pour la recherche photo.
    const imageHash = input.imageUrl ? await computeDHashFromUrl(input.imageUrl) : null;
    return productsRepository.create(shopId, { ...input, imageHash });
  },

  async update(productId: string, ownerId: string, input: UpdateProductInput) {
    await assertProductOwner(productId, ownerId);
    // Recalcule le hash uniquement si l'image change.
    const imageHash = input.imageUrl ? await computeDHashFromUrl(input.imageUrl) : undefined;
    return productsRepository.update(productId, { ...input, imageHash });
  },

  async remove(productId: string, ownerId: string) {
    await assertProductOwner(productId, ownerId);
    await productsRepository.softDelete(productId);
  },

  async getById(productId: string) {
    const product = await productsRepository.findById(productId);
    if (!product) throw Errors.notFound('Produit introuvable');
    return mapProduct(product);
  },

  priceHint(categoryId: string) {
    return productsRepository.priceHint(categoryId);
  },

  compare(q: string, lat: number | null, lng: number | null, sort: 'price' | 'distance', limit = 40) {
    if (!q.trim()) return Promise.resolve([]);
    return productsRepository.compare(q.trim(), lat, lng, sort, limit);
  },

  // Recherche par photo : calcule l'empreinte de l'image reçue, classe les
  // produits (qui ont une empreinte) par similarité visuelle. Renvoie
  // { matched, results } — matched=false si aucun produit du catalogue n'a
  // encore d'empreinte exploitable (repli texte côté client).
  async imageSearch(imageBase64: string, lat: number | null, lng: number | null, limit = 30) {
    const buffer = Buffer.from(imageBase64, 'base64');
    const queryHash = await computeDHash(buffer);
    if (!queryHash) throw Errors.badRequest('Image illisible');

    const candidates = await productsRepository.withImageHash(lat, lng);
    if (candidates.length === 0) return { matched: false, results: [] as any[] };

    const scored = candidates
      .map((c) => ({ ...c, distance: hammingDistance(queryHash, c.imageHash) }))
      .filter((c) => c.distance <= IMAGE_MATCH_THRESHOLD)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(({ imageHash, distance, ...rest }) => ({ ...rest, similarity: Math.round((1 - distance / 64) * 100) }));

    return { matched: true, results: scored };
  },
};
