// Seed "encore plus" : produits additionnels par boutique, avis/notes par des
// comptes clients, et promotions (créées par les vendeurs puis validées par
// l'admin -> actives, donc visibles dans le bandeau sponsorisé de l'accueil).
// Idempotent : produits dédupliqués par nom, avis protégés par contrainte
// "1 avis/auteur/cible", promotions non recréées si déjà présentes.

const API = process.env.SEED_API || 'https://api-soukquik.katatia.com/api';
const PASSWORD = 'Demo1234!';
const ADMIN = { email: 'admin@soukquik.dj', password: 'password123' };
const BASE_LAT = 11.588, BASE_LNG = 43.145;

let lock = 5000;
const img = (kw) => `https://loremflickr.com/600/600/${encodeURIComponent(kw)}?lock=${lock++}`;
const phone = () => '77' + Math.floor(100000 + Math.random() * 899999);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const e = new Error(typeof json.error === 'string' ? json.error : res.status);
    e.status = res.status;
    throw e;
  }
  return json.data;
}
async function auth(email, fullName, role) {
  try {
    return await api('/auth/register', { method: 'POST', body: { fullName, email, phone: phone(), password: PASSWORD, role } });
  } catch {
    return await api('/auth/login', { method: 'POST', body: { email, password: PASSWORD } });
  }
}

// Produits additionnels par boutique (clé = email vendeur)
const MORE = {
  'techno@soukquik.demo': [
    ['Clavier mécanique', 'keyboard', 18000, 20, 'Clavier gaming rétroéclairé RGB, switches bleus.', ['pc','gaming']],
    ['Souris sans fil', 'computer mouse', 9000, 30, 'Souris ergonomique 2,4 GHz, silencieuse.', ['pc']],
    ['Disque SSD 1To', 'ssd drive', 42000, 15, 'SSD externe USB-C, vitesse 1050 Mo/s.', ['stockage']],
    ['Webcam HD', 'webcam', 15000, 18, 'Webcam 1080p avec micro intégré.', ['pc']],
    ['Powerbank 20000', 'power bank', 14000, 25, 'Batterie externe 20 000 mAh, charge rapide 2 ports.', ['accessoire']],
    ['Manette de jeu', 'game controller', 21000, 12, 'Manette sans fil compatible PC et console.', ['gaming']],
    ['Routeur Wi-Fi 6', 'wifi router', 33000, 10, 'Routeur double bande, couverture longue portée.', ['réseau']],
  ],
  'chaussures@soukquik.demo': [
    ['Mocassins cuir', 'loafers', 30000, 14, 'Mocassins souples en cuir, confort premium.', ['homme']],
    ['Baskets montantes', 'high top sneakers', 27000, 16, 'Sneakers montantes tendance, semelle épaisse.', ['streetwear']],
    ['Ballerines', 'ballet flats', 14000, 20, 'Ballerines confortables pour tous les jours.', ['femme']],
    ['Chaussures de sécurité', 'safety boots', 36000, 10, 'Embout acier, semelle anti-perforation.', ['pro']],
    ['Sandales sport', 'sport sandals', 11000, 22, 'Sandales de randonnée réglables.', ['été']],
    ['Baskets toile', 'canvas shoes', 13000, 25, 'Baskets en toile légère, style casual.', ['unisexe']],
  ],
  'mode@soukquik.demo': [
    ['Pull en laine', 'wool sweater', 22000, 15, 'Pull chaud en laine mérinos.', ['hiver']],
    ['Short en jean', 'denim shorts', 12000, 20, 'Short en jean coupe droite.', ['été']],
    ['Casquette', 'cap hat', 5000, 40, 'Casquette réglable brodée.', ['accessoire']],
    ['Jupe plissée', 'skirt', 15000, 16, 'Jupe midi plissée, taille haute.', ['femme']],
    ['Sweat à capuche', 'hoodie', 19000, 24, 'Sweat molletonné à capuche, unisexe.', ['streetwear']],
    ['Ceinture cuir', 'leather belt', 8000, 30, 'Ceinture en cuir avec boucle métal.', ['accessoire']],
  ],
  'maison@soukquik.demo': [
    ['Aspirateur', 'vacuum cleaner', 48000, 10, 'Aspirateur sans sac 2000 W, filtre HEPA.', ['ménage']],
    ['Bureau bois', 'desk', 62000, 8, 'Bureau en bois avec tiroirs, plateau spacieux.', ['bureau']],
    ['Étagère 5 niveaux', 'bookshelf', 40000, 9, 'Étagère modulable en bois.', ['rangement']],
    ['Bouilloire électrique', 'electric kettle', 12000, 20, 'Bouilloire 1,7 L, arrêt automatique.', ['cuisine']],
    ['Tapis salon', 'rug carpet', 34000, 12, 'Tapis doux 160×230, motif moderne.', ['déco']],
  ],
  'beaute@soukquik.demo': [
    ['Sèche-cheveux', 'hair dryer', 24000, 14, 'Sèche-cheveux ionique 2200 W.', ['coiffure']],
    ['Coffret soin', 'skincare set', 29000, 10, 'Coffret complet nettoyant, tonique, crème.', ['soin']],
    ['Vernis à ongles', 'nail polish', 4000, 45, 'Vernis longue tenue, coloris variés.', ['maquillage']],
    ['Brosse lissante', 'hair brush', 17000, 15, 'Brosse chauffante lissante céramique.', ['coiffure']],
  ],
  'epicerie@soukquik.demo': [
    ['Chocolat noir', 'chocolate', 3500, 50, 'Tablette chocolat noir 70% cacao.', ['sucré']],
    ['Amandes 500g', 'almonds', 8500, 25, 'Amandes grillées non salées.', ['snack']],
    ['Confiture fraise', 'jam', 4500, 30, 'Confiture artisanale extra fraise.', ['petit-déj']],
    ['Pâtes 1kg', 'pasta', 3000, 40, 'Pâtes de blé dur de qualité supérieure.', ['féculent']],
    ['Lait en poudre', 'milk powder', 9000, 20, 'Lait en poudre entier enrichi.', ['petit-déj']],
  ],
  'quincaillerie@soukquik.demo': [
    ['Scie circulaire', 'circular saw', 52000, 8, 'Scie circulaire 1400 W, lame 185 mm.', ['outil']],
    ['Meuleuse', 'angle grinder', 31000, 10, 'Meuleuse d’angle 125 mm, 900 W.', ['outil']],
    ['Boîte à outils', 'toolbox', 22000, 14, 'Mallette 120 pièces complète.', ['outil']],
    ['Cadenas', 'padlock', 3500, 40, 'Cadenas laiton anti-cisaille, 3 clés.', ['sécurité']],
  ],
  'sport@soukquik.demo': [
    ['Tapis de course', 'treadmill', 195000, 3, 'Tapis de course pliable, 12 programmes.', ['fitness']],
    ['Maillot football', 'football jersey', 15000, 25, 'Maillot respirant séchage rapide.', ['football']],
    ['Sac de sport', 'gym bag', 13000, 20, 'Sac de sport avec compartiment chaussures.', ['accessoire']],
    ['Protéine 1kg', 'protein powder', 26000, 15, 'Whey protéine saveur vanille.', ['nutrition']],
  ],
  'bijoux@soukquik.demo': [
    ['Chaîne homme', 'gold chain', 78000, 7, 'Chaîne plaqué or maille figaro.', ['homme']],
    ['Alliance couple', 'wedding ring', 95000, 6, 'Paire d’alliances or blanc.', ['mariage']],
    ['Montre femme', 'women watch', 48000, 10, 'Montre élégante bracelet doré.', ['femme']],
    ['Pendentif', 'pendant necklace', 22000, 14, 'Pendentif argent avec pierre.', ['femme']],
  ],
  'pharmacie@soukquik.demo': [
    ['Oxymètre', 'pulse oximeter', 12000, 15, 'Oxymètre de pouls au doigt, écran LED.', ['matériel']],
    ['Pansements', 'bandage', 2500, 60, 'Boîte de pansements assortis.', ['soin']],
    ['Sirop toux', 'cough syrup', 4000, 30, 'Sirop apaisant pour la toux.', ['santé']],
    ['Complément fer', 'iron supplement', 7000, 20, 'Complément fer + vitamines.', ['santé']],
  ],
};

const CLIENTS = Array.from({ length: 10 }, (_, i) => ({
  email: `client${i + 1}@soukquik.demo`, name: ['Sahra','Bilal','Nawal','Kadar','Ismahan','Waïs','Deka','Moussa','Hodan','Ayan'][i] + ' Client',
}));

const COMMENTS = {
  5: ['Excellent, je recommande vivement !', 'Service au top, très satisfait.', 'Qualité au rendez-vous, rien à redire.', 'Parfait du début à la fin.', 'Rapide et professionnel, merci !'],
  4: ['Très bien dans l’ensemble.', 'Bon rapport qualité-prix.', 'Bonne expérience, je reviendrai.', 'Sérieux et à l’écoute.', 'Content de mon achat.'],
  3: ['Correct, sans plus.', 'Ça fait le travail.', 'Moyen mais acceptable.', 'Peut mieux faire mais ok.'],
};
const ratingWeighted = () => pick([5, 5, 5, 4, 4, 4, 5, 4, 3, 5]);

async function main() {
  console.log('API =', API);
  let nProd = 0, nRev = 0, nPromo = 0, nApproved = 0;

  // 1) Comptes clients
  const clients = [];
  for (const c of CLIENTS) {
    try { clients.push(await auth(c.email, c.name, 'client')); } catch (e) { console.error('client', c.email, e.message); }
  }
  console.log('👥 clients prêts:', clients.length);

  // 2) Produits additionnels + promotions (par vendeur)
  const shops = await api('/shops');
  const pendingPromos = [];
  for (const [email, extra] of Object.entries(MORE)) {
    try {
      const s = await auth(email, 'Vendeur', 'vendor');
      const token = s.accessToken;
      const shop = shops.find((x) => x.ownerId === s.user.id);
      if (!shop) { console.log('  (pas de boutique pour', email, ')'); continue; }
      const existing = await api(`/shops/${shop.id}/products`);
      const names = new Set(existing.map((p) => p.name));
      for (const [name, kw, price, stock, desc, tags] of extra) {
        if (names.has(name)) continue;
        try { await api(`/shops/${shop.id}/products`, { method: 'POST', token, body: { name, description: desc, price, stock, imageUrl: img(kw), categoryId: shop.categoryId, tags } }); nProd++; process.stdout.write('.'); }
        catch { process.stdout.write('x'); }
      }
      // Promotion boutique (si pas déjà une)
      const mine = await api('/promotions/mine', { token });
      if (!mine.some((p) => p.targetType === 'shop' && p.targetId === shop.id)) {
        try { const pr = await api('/promotions', { method: 'POST', token, body: { targetType: 'shop', targetId: shop.id, budget: pick([5000, 8000, 10000, 15000]) } }); pendingPromos.push(pr.id); nPromo++; } catch (e) { /* ignore */ }
      }
    } catch (e) { console.error('vendeur', email, e.message); }
  }
  console.log('\n🛒 produits ajoutés:', nProd, '| promotions créées:', nPromo);

  // 3) Avis sur boutiques ET services (auteurs tournants)
  const services = await api('/services');
  const targets = [
    ...shops.map((s) => ({ type: 'shop', id: s.id })),
    ...services.map((s) => ({ type: 'service', id: s.id })),
  ];
  let ci = 0;
  for (const t of targets) {
    const n = 3 + Math.floor(Math.random() * 3); // 3..5 avis
    for (let i = 0; i < n && clients.length; i++) {
      const author = clients[(ci++) % clients.length];
      const rating = ratingWeighted();
      try {
        await api('/reviews', { method: 'POST', token: author.accessToken, body: { targetType: t.type, targetId: t.id, rating, comment: pick(COMMENTS[rating]) } });
        nRev++; process.stdout.write('.');
      } catch { process.stdout.write('x'); }
    }
  }
  console.log('\n⭐ avis créés:', nRev);

  // 4) Admin valide les promotions en attente -> actives
  try {
    const admin = await api('/auth/login', { method: 'POST', body: ADMIN });
    const list = await api('/promotions', { token: admin.accessToken });
    for (const p of list) {
      if (p.status === 'pending') {
        try { await api(`/promotions/${p.id}/status`, { method: 'PATCH', token: admin.accessToken, body: { status: 'active' } }); nApproved++; } catch {}
      }
    }
  } catch (e) { console.error('admin/promos', e.message); }
  console.log('📣 promotions activées:', nApproved);

  console.log(`\n✅ Terminé : +${nProd} produits, +${nRev} avis, +${nPromo} promotions (${nApproved} activées).`);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
