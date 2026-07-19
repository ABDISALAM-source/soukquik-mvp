// Seed de démonstration SoukQuik — peuple la base PROD via l'API HTTPS.
// Crée des comptes vendeurs/prestataires, leurs boutiques/services, et un gros
// catalogue de produits avec photos réelles (loremflickr, par mot-clé, stables)
// + descriptions. Créer les produits via l'API déclenche le calcul de
// l'empreinte perceptuelle (dHash) côté serveur => la recherche par photo les
// indexe automatiquement.
//
// Idempotent : ré-exécutable sans doublons (login si le compte existe, et on
// n'ajoute des produits que si la boutique est vide).

const API = process.env.SEED_API || 'https://api-soukquik.katatia.com/api';
const PASSWORD = 'Demo1234!';
const BASE_LAT = 11.588, BASE_LNG = 43.145; // Djibouti-ville

let lock = 1000;
const img = (kw) => `https://loremflickr.com/600/600/${encodeURIComponent(kw)}?lock=${lock++}`;
const rnd = (n) => Math.round((Math.random() - 0.5) * n * 1000) / 1000;
const near = () => ({ latitude: +(BASE_LAT + rnd(0.06)).toFixed(5), longitude: +(BASE_LNG + rnd(0.06)).toFixed(5) });
const phone = () => '77' + Math.floor(100000 + Math.random() * 899999);
const patente = () => 'DJ-' + Math.floor(10000 + Math.random() * 89999);

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const msg = json.error || res.status;
    const e = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    e.status = res.status;
    throw e;
  }
  return json.data;
}

async function auth(email, fullName, role) {
  try {
    return await api('/auth/register', { method: 'POST', body: { fullName, email, phone: phone(), password: PASSWORD, role } });
  } catch (e) {
    // Déjà inscrit -> on se connecte.
    return await api('/auth/login', { method: 'POST', body: { email, password: PASSWORD } });
  }
}

// ---- Catalogue ----
const SHOPS = [
  {
    email: 'techno@soukquik.demo', owner: 'Idris Techno', shop: 'TechnoPlus', cat: 'Électronique',
    slogan: 'La high-tech à petit prix', logoKw: 'electronics store',
    desc: "Smartphones, ordinateurs et accessoires derniers cris, garantis et au meilleur prix de Djibouti.",
    products: [
      ['iPhone 15 Pro', 'smartphone', 165000, 12, 'Écran Super Retina 6,1", puce A17 Pro, triple caméra 48 Mpx. Neuf sous blister, garantie 1 an.', ['téléphone','apple','5G']],
      ['Samsung Galaxy S24', 'samsung phone', 140000, 9, 'Android 14, écran AMOLED 120 Hz, batterie 4000 mAh. Débloqué tous opérateurs.', ['téléphone','android']],
      ['MacBook Air M2', 'macbook', 280000, 5, 'Ordinateur portable ultra-fin, 8 Go RAM, 256 Go SSD, autonomie 18 h.', ['ordinateur','apple']],
      ['Casque Sony WH-1000', 'headphones', 45000, 20, 'Casque sans fil à réduction de bruit active, 30 h d’autonomie.', ['audio','bluetooth']],
      ['AirPods Pro', 'earbuds', 38000, 25, 'Écouteurs intra-auriculaires avec réduction de bruit et boîtier MagSafe.', ['audio','apple']],
      ['TV LED 55" 4K', 'television', 190000, 6, 'Téléviseur Ultra HD 4K, Smart TV, HDR, 3 ports HDMI.', ['tv','maison']],
      ['Chargeur rapide 65W', 'usb charger', 8500, 40, 'Chargeur GaN USB-C 65 W, compatible téléphone et ordinateur.', ['accessoire']],
      ['Montre connectée', 'smartwatch', 42000, 15, 'Suivi cardio, GPS, notifications, étanche 50 m.', ['montre','sport']],
      ['Tablette 10"', 'tablet', 95000, 8, 'Tablette Android 10 pouces, 128 Go, idéale multimédia et travail.', ['tablette']],
      ['Enceinte Bluetooth', 'bluetooth speaker', 22000, 18, 'Enceinte portable étanche, son 360°, 12 h d’autonomie.', ['audio']],
    ],
  },
  {
    email: 'chaussures@soukquik.demo', owner: 'Farah Kicks', shop: 'Chaussures Katatia', cat: 'Chaussures',
    slogan: 'Marche avec style', logoKw: 'shoe store',
    desc: 'Baskets, sandales et souliers pour toute la famille. Marques originales et prix imbattables.',
    products: [
      ['Baskets running', 'sneakers', 24000, 22, 'Chaussures de course légères, semelle amortie, respirantes.', ['sport','homme']],
      ['Nike Air Max', 'nike shoes', 39000, 14, 'Sneakers iconiques à bulle d’air, confort toute la journée.', ['nike','streetwear']],
      ['Sandales cuir', 'leather sandals', 15000, 30, 'Sandales en cuir véritable, fabrication artisanale.', ['été','homme']],
      ['Escarpins élégants', 'high heels', 28000, 10, 'Escarpins à talon 8 cm, parfaits pour les soirées.', ['femme','soirée']],
      ['Bottines cuir', 'leather boots', 45000, 8, 'Bottines montantes en cuir, doublure chaude.', ['femme','hiver']],
      ['Tongs plage', 'flip flops', 5000, 50, 'Tongs légères et colorées pour la plage.', ['été']],
      ['Chaussures ville', 'dress shoes', 33000, 12, 'Souliers derby en cuir pour homme, semelle cousue.', ['homme','classe']],
      ['Baskets enfant', 'kids shoes', 12000, 25, 'Baskets à scratch pour enfant, semelle antidérapante.', ['enfant']],
    ],
  },
  {
    email: 'mode@soukquik.demo', owner: 'Amina Style', shop: 'Mode Djibouti', cat: 'Mode & Vêtements',
    slogan: 'Ta mode, ton identité', logoKw: 'clothing boutique',
    desc: 'Vêtements tendance pour homme et femme : robes, chemises, jeans et vestes de saison.',
    products: [
      ['Robe d’été fleurie', 'summer dress', 18000, 16, 'Robe légère à motifs floraux, tissu fluide et respirant.', ['femme','été']],
      ['Chemise en lin', 'linen shirt', 14000, 20, 'Chemise homme en lin, coupe droite, idéale par temps chaud.', ['homme']],
      ['Jean slim', 'jeans', 16000, 24, 'Jean stretch coupe slim, denim résistant.', ['unisexe']],
      ['Veste en cuir', 'leather jacket', 55000, 7, 'Veste en cuir véritable, doublure intérieure zippée.', ['homme','hiver']],
      ['T-shirt coton bio', 'tshirt', 6000, 60, 'T-shirt uni 100% coton biologique, plusieurs coloris.', ['unisexe']],
      ['Abaya brodée', 'abaya', 32000, 10, 'Abaya élégante avec broderies dorées, tissu premium.', ['femme','traditionnel']],
      ['Costume 2 pièces', 'suit', 78000, 5, 'Costume homme veste + pantalon, laine mélangée.', ['homme','cérémonie']],
      ['Foulard soie', 'silk scarf', 9000, 35, 'Foulard en soie aux motifs colorés.', ['accessoire','femme']],
    ],
  },
  {
    email: 'maison@soukquik.demo', owner: 'Hassan Déco', shop: 'Maison & Confort', cat: 'Mobilier',
    slogan: 'Ton intérieur, sublimé', logoKw: 'furniture store',
    desc: 'Meubles et électroménager pour équiper toute la maison, du salon à la cuisine.',
    products: [
      ['Canapé 3 places', 'sofa', 210000, 4, 'Canapé confortable en tissu, structure bois massif.', ['salon']],
      ['Table à manger', 'dining table', 95000, 6, 'Table 6 personnes en bois massif, finition vernie.', ['salle à manger']],
      ['Réfrigérateur 300L', 'refrigerator', 175000, 5, 'Frigo combiné No Frost, classe A++, faible consommation.', ['électroménager','cuisine']],
      ['Machine à laver', 'washing machine', 155000, 4, 'Lave-linge 8 kg, 1200 tr/min, 15 programmes.', ['électroménager']],
      ['Lit double + matelas', 'bed', 130000, 6, 'Lit 160×200 avec matelas à ressorts ensachés.', ['chambre']],
      ['Lampe de salon', 'floor lamp', 22000, 15, 'Lampadaire design LED, lumière chaude réglable.', ['déco']],
      ['Micro-ondes', 'microwave', 38000, 12, 'Four micro-ondes 25 L, gril intégré.', ['cuisine']],
      ['Ventilateur sur pied', 'fan', 18000, 20, 'Ventilateur 3 vitesses, oscillation, silencieux.', ['été']],
    ],
  },
  {
    email: 'beaute@soukquik.demo', owner: 'Nasra Glow', shop: 'Beauté Éclat', cat: 'Beauté & Cosmétiques',
    slogan: 'Révèle ta beauté', logoKw: 'cosmetics',
    desc: 'Parfums, soins et maquillage de marques sélectionnées pour prendre soin de toi.',
    products: [
      ['Parfum femme 100ml', 'perfume', 42000, 14, 'Eau de parfum florale et boisée, tenue longue durée.', ['parfum','femme']],
      ['Crème hydratante', 'face cream', 15000, 30, 'Crème visage à l’acide hyaluronique, hydratation 24 h.', ['soin']],
      ['Palette maquillage', 'makeup palette', 19000, 18, 'Palette 18 fards à paupières, couleurs mates et satinées.', ['maquillage']],
      ['Rouge à lèvres', 'lipstick', 7000, 40, 'Rouge à lèvres mat longue tenue, fini velours.', ['maquillage']],
      ['Huile d’argan', 'argan oil', 12000, 25, 'Huile 100% pure pour cheveux et peau.', ['soin','bio']],
      ['Sérum vitamine C', 'skincare serum', 21000, 16, 'Sérum éclat anti-taches à la vitamine C.', ['soin']],
      ['Parfum homme', 'perfume bottle', 39000, 12, 'Eau de toilette masculine fraîche et boisée.', ['parfum','homme']],
    ],
  },
  {
    email: 'epicerie@soukquik.demo', owner: 'Omar Souk', shop: 'Épicerie du Coin', cat: 'Alimentation',
    slogan: 'Le goût du quartier', logoKw: 'grocery store',
    desc: 'Produits frais, épices et douceurs locales et importées au quotidien.',
    products: [
      ['Café moulu 500g', 'coffee', 6500, 40, 'Café arabica moulu, torréfaction artisanale.', ['boisson']],
      ['Dattes Medjool 1kg', 'dates fruit', 9000, 30, 'Dattes moelleuses premium, idéales pour le ramadan.', ['fruit','local']],
      ['Miel naturel 500g', 'honey jar', 8000, 25, 'Miel pur récolté localement, non pasteurisé.', ['bio']],
      ['Épices mélangées', 'spices', 4000, 50, 'Assortiment d’épices pour cuisine orientale.', ['épice']],
      ['Huile d’olive 1L', 'olive oil', 11000, 20, 'Huile d’olive extra vierge première pression à froid.', ['cuisine']],
      ['Thé vert 250g', 'green tea', 5000, 35, 'Thé vert à la menthe, feuilles entières.', ['boisson']],
      ['Riz basmati 5kg', 'rice bag', 13000, 22, 'Riz basmati long grain, qualité supérieure.', ['féculent']],
    ],
  },
  {
    email: 'quincaillerie@soukquik.demo', owner: 'Ali Outils', shop: 'Quincaillerie Pro', cat: 'Quincaillerie',
    slogan: 'Tout pour bricoler', logoKw: 'hardware tools',
    desc: 'Outillage, plomberie et matériel de construction pour pros et particuliers.',
    products: [
      ['Perceuse visseuse', 'power drill', 34000, 14, 'Perceuse sans fil 18 V, 2 batteries, mallette incluse.', ['outil']],
      ['Marteau', 'hammer tool', 4500, 40, 'Marteau à panne fendue, manche fibre antichoc.', ['outil']],
      ['Jeu de tournevis', 'screwdriver set', 9000, 25, 'Set 12 tournevis magnétiques, isolés.', ['outil']],
      ['Peinture murale 5L', 'paint bucket', 16000, 20, 'Peinture acrylique mate, lessivable, blanc pur.', ['peinture']],
      ['Échelle 3m', 'ladder', 42000, 8, 'Échelle aluminium télescopique, légère et robuste.', ['matériel']],
      ['Rallonge électrique', 'extension cord', 6000, 30, 'Rallonge 10 m, 3 prises, câble renforcé.', ['électricité']],
    ],
  },
  {
    email: 'sport@soukquik.demo', owner: 'Kaltoum Fit', shop: 'Sport Zone', cat: 'Sport',
    slogan: 'Bouge, dépasse-toi', logoKw: 'sport equipment',
    desc: 'Équipement et vêtements de sport pour tous les niveaux.',
    products: [
      ['Ballon de football', 'football ball', 12000, 30, 'Ballon taille 5 cousu main, usage terrain.', ['football']],
      ['Haltères 10kg (paire)', 'dumbbells', 28000, 12, 'Paire d’haltères revêtus, prise antidérapante.', ['musculation']],
      ['Tapis de yoga', 'yoga mat', 9000, 25, 'Tapis antidérapant 6 mm, avec sangle de transport.', ['yoga']],
      ['Vélo VTT 26"', 'mountain bike', 145000, 5, 'VTT 21 vitesses, freins à disque, cadre aluminium.', ['vélo']],
      ['Corde à sauter', 'jump rope', 4000, 40, 'Corde à sauter réglable avec roulement à billes.', ['cardio']],
      ['Gants de boxe', 'boxing gloves', 18000, 15, 'Gants 12 oz, rembourrage haute densité.', ['boxe']],
    ],
  },
  {
    email: 'bijoux@soukquik.demo', owner: 'Zahra Or', shop: 'Bijoux d’Or', cat: 'Bijouterie',
    slogan: 'L’éclat qui vous ressemble', logoKw: 'jewelry',
    desc: 'Bijoux en or et argent, montres et accessoires précieux.',
    products: [
      ['Bague or 18 carats', 'gold ring', 120000, 6, 'Bague en or 18 carats sertie d’un zircon.', ['or','femme']],
      ['Collier argent', 'silver necklace', 35000, 12, 'Collier en argent 925 avec pendentif.', ['argent']],
      ['Montre homme', 'wristwatch', 65000, 8, 'Montre automatique bracelet acier, étanche.', ['montre','homme']],
      ['Boucles d’oreilles', 'earrings', 28000, 15, 'Boucles d’oreilles en or fin, motif goutte.', ['or','femme']],
      ['Bracelet cuir', 'leather bracelet', 9000, 20, 'Bracelet en cuir tressé avec fermoir acier.', ['homme']],
    ],
  },
  {
    email: 'pharmacie@soukquik.demo', owner: 'Dr Warsama', shop: 'Pharmacie Centrale', cat: 'Pharmacie',
    slogan: 'Votre santé, notre priorité', logoKw: 'pharmacy',
    desc: 'Parapharmacie, compléments et matériel de soin.',
    products: [
      ['Vitamine C 1000', 'vitamins', 6000, 40, 'Complément vitamine C, 60 comprimés effervescents.', ['santé']],
      ['Gel hydroalcoolique', 'hand sanitizer', 3000, 60, 'Gel désinfectant 500 ml, 70% alcool.', ['hygiène']],
      ['Thermomètre digital', 'thermometer', 8000, 25, 'Thermomètre infrarouge sans contact.', ['matériel']],
      ['Masques (x50)', 'face mask', 5000, 50, 'Boîte de 50 masques chirurgicaux 3 plis.', ['hygiène']],
      ['Tensiomètre', 'blood pressure monitor', 22000, 10, 'Tensiomètre bras automatique, écran large.', ['matériel']],
    ],
  },
];

const SERVICES = [
  ['electricien@soukquik.demo', 'Guedi Volt', 'Électricien à domicile', 'Électricien', 5000, 'heure', 'electrician', 'Dépannage rapide 7j/7', 'Installation, dépannage et mise aux normes électriques. Intervention rapide dans toute la ville.'],
  ['plombier@soukquik.demo', 'Robleh Aqua', 'Plombier dépannage', 'Plombier', 6000, 'heure', 'plumber', 'Fuite ? On arrive vite', 'Réparation de fuites, installation sanitaire, débouchage. Devis gratuit.'],
  ['menuisier@soukquik.demo', 'Saïd Bois', 'Menuisier sur mesure', 'Menuisier', 15000, 'forfait', 'carpenter', 'Le bois dans tous ses états', 'Meubles sur mesure, portes, placards et réparations en bois massif.'],
  ['mecano@soukquik.demo', 'Farhan Moteur', 'Mécanicien auto', 'Mécanicien auto', 8000, 'heure', 'car mechanic', 'Ton auto entre de bonnes mains', 'Vidange, freins, diagnostic et réparation toutes marques.'],
  ['coiffeur@soukquik.demo', 'Yacin Style', 'Barbier & coiffeur', 'Coiffeur / Barbier', 3000, 'forfait', 'barber', 'La coupe qui te ressemble', 'Coupe homme, barbe, dégradé et soins. Sur rendez-vous.'],
  ['photographe@soukquik.demo', ' Layla Lens', 'Photographe événements', 'Photographe', 25000, 'forfait', 'photographer', 'Vos moments, immortalisés', 'Mariages, portraits et événements. Photos retouchées livrées sous 7 jours.'],
  ['traiteur@soukquik.demo', 'Cuisine Halima', 'Traiteur & cuisine', 'Traiteur / Cuisine', 40000, 'forfait', 'catering food', 'Des saveurs pour vos fêtes', 'Plats traditionnels et buffets pour mariages et réceptions.'],
  ['menage@soukquik.demo', 'Clean Express', 'Ménage & nettoyage', 'Ménage & Nettoyage', 4000, 'heure', 'cleaning', 'Une maison qui brille', 'Nettoyage maison, bureaux et grand ménage. Personnel de confiance.'],
  ['peintre@soukquik.demo', 'Idriss Couleur', 'Peintre en bâtiment', 'Peintre', 12000, 'forfait', 'house painter', 'Donnez des couleurs à vos murs', 'Peinture intérieure et extérieure, enduits et décoration murale.'],
  ['clim@soukquik.demo', 'Froid Plus', 'Climatisation & froid', 'Climatisation / Froid', 10000, 'forfait', 'air conditioner technician', 'Gardez la fraîcheur', 'Installation et entretien de climatiseurs et chambres froides.'],
  ['jardinier@soukquik.demo', 'Vert Oasis', 'Jardinier paysagiste', 'Jardinier', 7000, 'heure', 'gardener', 'Votre jardin, notre passion', 'Entretien d’espaces verts, taille et aménagement paysager.'],
  ['couturier@soukquik.demo', 'Atelier Nima', 'Couturier sur mesure', 'Couturier', 8000, 'forfait', 'tailor sewing', 'Cousu main, juste pour vous', 'Confection et retouches de vêtements traditionnels et modernes.'],
];

async function main() {
  console.log('API =', API);
  const cats = await api('/categories');
  const catId = (name, type) => {
    const c = cats.find((x) => x.name === name && x.type === type && !x.parentId);
    if (!c) console.warn('  ⚠ catégorie introuvable:', name, type);
    return c ? c.id : undefined;
  };

  let nShops = 0, nProducts = 0, nServices = 0;

  for (const s of SHOPS) {
    try {
      const session = await auth(s.email, s.owner, 'vendor');
      const token = session.accessToken;
      // Boutique existante ?
      const allShops = await api('/shops');
      let shop = allShops.find((x) => x.ownerId === session.user.id);
      if (!shop) {
        const loc = near();
        shop = await api('/shops', {
          method: 'POST', token,
          body: {
            name: s.shop, description: s.desc, categoryId: catId(s.cat, 'product'),
            latitude: loc.latitude, longitude: loc.longitude, address: 'Djibouti-ville',
            logoUrl: img(s.logoKw), patente: patente(), slogan: s.slogan,
          },
        });
        nShops++;
        console.log('🏪 Boutique créée:', s.shop);
      } else {
        console.log('🏪 Boutique existante:', s.shop);
      }
      // Produits (seulement si vide)
      const existing = await api(`/shops/${shop.id}/products`);
      if (existing.length > 0) {
        console.log('   produits déjà présents, on saute');
        continue;
      }
      for (const [name, kw, price, stock, desc, tags] of s.products) {
        try {
          await api(`/shops/${shop.id}/products`, {
            method: 'POST', token,
            body: { name, description: desc, price, stock, imageUrl: img(kw), categoryId: catId(s.cat, 'product'), tags },
          });
          nProducts++;
          process.stdout.write('.');
        } catch (e) {
          process.stdout.write('x');
        }
      }
      console.log('  +', s.products.length, 'produits pour', s.shop);
    } catch (e) {
      console.error('❌ Boutique', s.shop, ':', e.message);
    }
  }

  for (const [email, owner, title, cat, price, unit, kw, slogan, desc] of SERVICES) {
    try {
      const session = await auth(email, owner, 'provider');
      const token = session.accessToken;
      const mine = (await api('/services')).filter((x) => x.providerId === session.user.id);
      if (mine.length > 0) { console.log('🧰 Service existant:', title); continue; }
      const loc = near();
      await api('/services', {
        method: 'POST', token,
        body: {
          title, description: desc, categoryId: catId(cat, 'service'), price, priceUnit: unit,
          latitude: loc.latitude, longitude: loc.longitude, serviceAreaKm: 15,
          logoUrl: img(kw), patente: patente(), slogan,
        },
      });
      nServices++;
      console.log('🧰 Service créé:', title);
    } catch (e) {
      console.error('❌ Service', title, ':', e.message);
    }
  }

  console.log(`\n✅ Terminé : +${nShops} boutiques, +${nProducts} produits, +${nServices} services.`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
