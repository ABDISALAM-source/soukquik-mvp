// Seed "activité" : commandes (clients -> boutiques) et réservations
// (clients -> services), avec avancement des statuts par les vendeurs /
// prestataires. Remplit historiques, notifications et stats des dashboards
// (revenus, commandes du jour, réservations en attente).
// Idempotent-ish : n'ajoute des commandes/réservations que si la cible en a
// peu (< seuil), pour rester ré-exécutable sans explosion.

const API = process.env.SEED_API || 'https://api-soukquik.katatia.com/api';
const PASSWORD = 'Demo1234!';
const ORDERS_PER_SHOP = 4;
const BOOKINGS_PER_SERVICE = 3;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sample = (a, n) => [...a].sort(() => Math.random() - 0.5).slice(0, n);
const phone = () => '77' + Math.floor(100000 + Math.random() * 899999);

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const e = new Error(typeof json.error === 'string' ? json.error : res.status);
    e.status = res.status; throw e;
  }
  return json.data;
}
const login = (email) => api('/auth/login', { method: 'POST', body: { email, password: PASSWORD } });

const VENDORS = ['techno','chaussures','mode','maison','beaute','epicerie','quincaillerie','sport','bijoux','pharmacie'].map((x) => x + '@soukquik.demo');
const PROVIDERS = ['electricien','plombier','menuisier','mecano','coiffeur','photographe','traiteur','menage','peintre','clim','jardinier','couturier'].map((x) => x + '@soukquik.demo');
const QUARTIERS = ['Héron', 'Balbala', 'Gabode', 'Q7', 'Boulaos', 'Einguela', 'Djebel'];
const NOTES = ['Intervention rapide svp', 'RDV standard', 'Devis à confirmer', 'Merci de me rappeler avant', 'Urgent si possible', ''];

// Chemin d'avancement des commandes.
const ORDER_STEPS = ['pending', 'accepted', 'preparing', 'delivered'];
async function advanceOrderTo(token, orderId, from, target) {
  let idx = ORDER_STEPS.indexOf(from);
  const t = ORDER_STEPS.indexOf(target);
  while (idx < t) { idx++; await api(`/orders/${orderId}/status`, { method: 'PATCH', token, body: { status: ORDER_STEPS[idx] } }); }
}

function futureSlot() {
  const d = new Date(Date.now() + (1 + Math.floor(Math.random() * 12)) * 86400000);
  const day = d.toISOString().slice(0, 10);
  const h = pick(['09', '10', '11', '14', '15', '16']);
  return `${day}T${h}:00:00.000Z`;
}

async function main() {
  console.log('API =', API);

  // Clients
  const clients = [];
  for (let i = 1; i <= 10; i++) {
    try { clients.push(await login(`client${i}@soukquik.demo`)); } catch { try { clients.push(await api('/auth/register', { method: 'POST', body: { fullName: `Client ${i}`, email: `client${i}@soukquik.demo`, phone: phone(), password: PASSWORD, role: 'client' } })); } catch (e) { console.error('client', i, e.message); } }
  }
  console.log('👥 clients:', clients.length);

  const allShops = await api('/shops');
  let nOrders = 0;

  // ---- COMMANDES ----
  for (const email of VENDORS) {
    try {
      const v = await login(email);
      const shop = allShops.find((s) => s.ownerId === v.user.id);
      if (!shop) continue;
      const products = await api(`/shops/${shop.id}/products`);
      if (!products.length) continue;
      let existing = await api(`/shops/${shop.id}/orders`, { token: v.accessToken });
      const toCreate = Math.max(0, ORDERS_PER_SHOP - existing.length);
      for (let i = 0; i < toCreate; i++) {
        const client = pick(clients);
        const items = sample(products, 1 + Math.floor(Math.random() * 3)).map((p) => ({ productId: p.id, quantity: 1 + Math.floor(Math.random() * 3) }));
        const delivery = Math.random() < 0.5 ? `Quartier ${pick(QUARTIERS)}` : undefined;
        try { await api('/orders', { method: 'POST', token: client.accessToken, body: { shopId: shop.id, items, deliveryAddress: delivery } }); nOrders++; process.stdout.write('.'); }
        catch { process.stdout.write('x'); }
      }
      // Avancement des statuts : mélange réaliste.
      const orders = await api(`/shops/${shop.id}/orders`, { token: v.accessToken });
      const targets = ['delivered', 'delivered', 'preparing', 'accepted', 'pending'];
      let ti = 0;
      for (const o of orders) {
        if (o.status !== 'pending') continue;
        const target = targets[ti++ % targets.length];
        try { await advanceOrderTo(v.accessToken, o.id, 'pending', target); } catch {}
      }
    } catch (e) { console.error('commandes', email, e.message); }
  }
  console.log('\n🧾 commandes créées:', nOrders);

  // ---- RÉSERVATIONS ----
  const allServices = await api('/services');
  const tokenByService = {};
  for (const email of PROVIDERS) {
    try {
      const p = await login(email);
      allServices.filter((s) => s.providerId === p.user.id).forEach((s) => { tokenByService[s.id] = p.accessToken; });
    } catch {}
  }
  let nBookings = 0;
  for (const svc of allServices) {
    const ptok = tokenByService[svc.id];
    if (!ptok) continue;
    let existing = await api(`/services/${svc.id}/bookings`, { token: ptok });
    const toCreate = Math.max(0, BOOKINGS_PER_SERVICE - existing.length);
    for (let i = 0; i < toCreate; i++) {
      const client = pick(clients);
      try { await api('/bookings', { method: 'POST', token: client.accessToken, body: { serviceId: svc.id, scheduledAt: futureSlot(), notes: pick(NOTES) } }); nBookings++; process.stdout.write('.'); }
      catch { process.stdout.write('x'); }
    }
    // Statuts : quelques-unes acceptées / terminées, d'autres en attente.
    const bookings = await api(`/services/${svc.id}/bookings`, { token: ptok });
    const targets = ['completed', 'accepted', 'pending', 'completed'];
    let ti = 0;
    for (const b of bookings) {
      if (b.status !== 'pending') continue;
      const target = targets[ti++ % targets.length];
      try {
        if (target === 'accepted') await api(`/bookings/${b.id}/status`, { method: 'PATCH', token: ptok, body: { status: 'accepted' } });
        else if (target === 'completed') { await api(`/bookings/${b.id}/status`, { method: 'PATCH', token: ptok, body: { status: 'accepted' } }); await api(`/bookings/${b.id}/status`, { method: 'PATCH', token: ptok, body: { status: 'completed' } }); }
      } catch {}
    }
  }
  console.log('\n📅 réservations créées:', nBookings);
  console.log(`\n✅ Terminé : +${nOrders} commandes, +${nBookings} réservations.`);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
