import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { Carousel } from '../components/Carousel';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCardRow } from '../components/Skeleton';
import { HeroBanner, HeroBannerItem } from '../components/HeroBanner';
import { TrendingRow, TrendingItem } from '../components/TrendingRow';
import { CategoryTile } from '../components/CategoryTile';
import { SponsoredBanner } from '../components/SponsoredBanner';
import { FilterChips, FilterChipOption } from '../components/FilterChips';
import { DiscoveryCard } from '../components/DiscoveryCard';
import { NotificationBell } from '../components/NotificationBell';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import * as catalogApi from '../api/catalog';
import * as presenceApi from '../api/presence';
import * as likesApi from '../api/likes';
import * as notificationsApi from '../api/notifications';
import * as promotionsApi from '../api/promotions';
import type { Promotion } from '../api/promotions';
import { useLocationStore } from '../store/location';
import { haversineKm, formatDistanceKm } from '../utils/geo';

const NEARBY_RADIUS_KM = 15;

// La table categories stocke des noms d'icônes façon Feather ("zap",
// "wrench"...) côté seed réel, et on garde aussi des clés françaises pour
// la liste de secours ci-dessous. Correspondance manuelle, avec repli
// générique si un nom n'est pas reconnu.
const CATEGORY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  zap: 'flash',
  shirt: 'shirt',
  hammer: 'hammer',
  plug: 'flash-outline',
  wrench: 'construct',
  book: 'book',
  car: 'car',
  scissors: 'cut',
  magasins: 'bag-handle',
  services: 'briefcase',
  mode: 'shirt',
  electronique: 'phone-portrait',
  quincaillerie: 'construct',
  beaute: 'flower',
  plus: 'grid',
};
function iconForCategory(icon?: string): keyof typeof Ionicons.glyphMap {
  return (icon && CATEGORY_ICON_MAP[icon.toLowerCase()]) || 'pricetag-outline';
}

// Repli si l'API ne renvoie aucune catégorie (ex: base fraîchement installée
// sans seed) — évite une section vide, mêmes libellés que la maquette.
const FALLBACK_CATEGORIES = [
  { id: 'fallback-1', name: 'Magasins', icon: 'magasins' },
  { id: 'fallback-2', name: 'Services', icon: 'services' },
  { id: 'fallback-3', name: 'Mode', icon: 'mode' },
  { id: 'fallback-4', name: 'Électronique', icon: 'electronique' },
  { id: 'fallback-5', name: 'Quincaillerie', icon: 'quincaillerie' },
  { id: 'fallback-6', name: 'Beauté', icon: 'beaute' },
  { id: 'fallback-7', name: 'Plus', icon: 'plus' },
];

const FILTER_OPTIONS: FilterChipOption[] = [
  { value: 'all', label: 'Tout' },
  { value: 'shops', label: 'Magasins' },
  { value: 'services', label: 'Services' },
  { value: 'nearby', label: 'Près de moi', icon: 'location' },
  { value: 'fast', label: 'Livraison rapide', icon: 'flash' },
];

// Données de démo (blocs sans backend branché) : bannière promo (Phase 9
// pour le vrai flux), présence (Phase 8), bandeau sponsorisé (Phase 9).
const HERO_ITEMS: HeroBannerItem[] = [
  {
    id: 'h1',
    badge: 'OFFRE DU JOUR 🔥',
    title: "Jusqu'à -50% chez ElectroPro",
    subtitle: 'Sur tous les appareils électroménagers',
    ctaLabel: "Voir l'offre",
    accentColor: '#007AFF',
  },
];

function SectionTitle({ title, icon, onSeeAll }: { title: string; icon?: string; onSeeAll?: () => void }) {
  const { colors, spacing, typography } = useTheme();
  const styles = useMemo(() => makeSectionStyles(colors, spacing, typography), [colors, spacing, typography]);

  return (
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>
        {title} {icon ? <Text style={styles.emoji}>{icon}</Text> : null}
      </Text>
      {onSeeAll ? (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllText}>Voir tout</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Écrans pas encore construits (Notifications, recherche photo, filtres
// avancés, détail d'offre, listes "voir tout", carte, campagnes
// sponsorisées, recommandations...) : phases futures. On garde les
// éléments visuels/tactiles en place mais sans navigation réelle pour ne
// pas planter sur une route inexistante.
function notYetAvailable() {}

export function HomeScreen() {
  const { colors, spacing, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, typography), [colors, spacing, typography]);
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [shops, setShops] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  // Rangée "En ce moment" : classement réel par popularité (ventes + visites
  // récentes), distinct des annuaires magasins/services.
  const [trendingShops, setTrendingShops] = useState<any[]>([]);
  const [trendingServices, setTrendingServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoIndex, setPromoIndex] = useState(0);
  const [usingNearby, setUsingNearby] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  // Présence réelle par boutique (shopId -> {count, intensity}), remplie via
  // l'endpoint HTTP. On ne compte pas ouvrir une WebSocket par boutique du
  // Home (trop lourd) — le temps réel live est réservé à ShopScreen. Ici on
  // affiche un instantané réel plutôt que des valeurs simulées.
  const [shopPresence, setShopPresence] = useState<Record<string, { count: number; intensity: number }>>({});
  const coords = useLocationStore((s) => s.coords);
  const locationStatus = useLocationStore((s) => s.status);
  const requestLocation = useLocationStore((s) => s.requestLocation);

  // Demande silencieuse au montage (pas d'alerte si refusée ici) : sert
  // uniquement à peupler la distance réelle sur les cartes produit sans
  // attendre une action explicite. Le message clair en cas de refus
  // n'apparaît que quand l'utilisateur cherche activement "Près de moi".
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Déclenche la permission (si jamais demandée) ou prévient clairement
  // l'utilisateur (si refusée) dès que le filtre "Près de moi" est actif.
  useEffect(() => {
    if (filter !== 'nearby') return;
    if (locationStatus === 'unknown') {
      requestLocation();
    } else if (locationStatus === 'denied') {
      Alert.alert(
        'Localisation désactivée',
        "Active la localisation dans les réglages de ton téléphone pour voir les boutiques et prestataires près de toi."
      );
    }
  }, [filter, locationStatus, requestLocation]);

  // Une fois les coordonnées connues et le filtre "Près de moi" actif, on
  // remplace shops/services par les résultats réels triés par distance
  // (backend). En quittant le filtre, on revient à la liste générique.
  useEffect(() => {
    if (filter === 'nearby' && coords) {
      setNearbyLoading(true);
      Promise.all([
        catalogApi.fetchNearbyShops(coords.latitude, coords.longitude, NEARBY_RADIUS_KM),
        catalogApi.fetchNearbyServices(coords.latitude, coords.longitude, NEARBY_RADIUS_KM),
      ])
        .then(([nearShops, nearServices]) => {
          setShops(nearShops);
          setServices(nearServices);
          setUsingNearby(true);
        })
        .finally(() => setNearbyLoading(false));
    } else if (filter !== 'nearby' && usingNearby) {
      Promise.all([catalogApi.fetchShops(), catalogApi.fetchServices()]).then(([s, sv]) => {
        setShops(s);
        setServices(sv);
        setUsingNearby(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, coords]);

  function productDistanceLabel(item: any): string | undefined {
    if (!coords || item.shopLatitude == null || item.shopLongitude == null) return undefined;
    return formatDistanceKm(haversineKm(coords.latitude, coords.longitude, item.shopLatitude, item.shopLongitude));
  }

  useEffect(() => {
    Promise.all([
      catalogApi.fetchShops(),
      catalogApi.fetchServices(),
      catalogApi.search({ type: 'product' }),
      catalogApi.fetchCategories(),
      likesApi.fetchMyLikes('product'),
      promotionsApi.fetchActivePromotions(5).catch(() => []),
      catalogApi.fetchTrendingShops(10).catch(() => []),
      catalogApi.fetchTrendingServices(10).catch(() => []),
    ])
      .then(([s, sv, searchRes, cats, likedProducts, promos, trShops, trServices]) => {
        setShops(s);
        setServices(sv);
        setTrendingShops(trShops);
        setTrendingServices(trServices);
        setProducts(searchRes.products || []);
        setCategories(cats.length ? cats : FALLBACK_CATEGORIES);
        setLikedIds(new Set(likedProducts.map((l) => l.targetId)));
        setPromotions(promos);
      })
      .finally(() => setLoading(false));
  }, []);

  // Rotation automatique entre les promotions actives (le tirage pondéré
  // par budget se fait déjà côté SQL à chaque fetch ; ici on fait juste
  // défiler l'ensemble reçu tant que l'écran reste ouvert).
  useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setPromoIndex((i) => (i + 1) % promotions.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [promotions.length]);

  // Impression comptée dès qu'une promotion (ré)devient la bannière affichée
  // — au montage et à chaque rotation.
  useEffect(() => {
    const current = promotions[promoIndex];
    if (current) promotionsApi.trackImpression(current.id).catch(() => {});
  }, [promoIndex, promotions]);

  function handlePromoPress(promo: Promotion) {
    promotionsApi.trackClick(promo.id).catch(() => {});
    if (promo.targetType === 'shop') navigation.navigate('Shop', { shopId: promo.targetId });
    else if (promo.targetType === 'service') navigation.navigate('Service', { serviceId: promo.targetId });
    else navigation.navigate('ProductDetail', { productId: promo.targetId, shopId: promo.targetShopId });
  }

  // Le compteur non-lu doit se rafraîchir à chaque retour sur l'accueil
  // (ex: après avoir lu des notifications ailleurs), pas juste au montage.
  useFocusEffect(
    useCallback(() => {
      notificationsApi.fetchUnreadCount().then((r) => setUnreadCount(r.count)).catch(() => {});
    }, [])
  );

  function goSearch() {
    navigation.navigate('Search', { initialQuery: query });
  }

  async function toggleLike(id: string) {
    // Optimiste : bascule tout de suite, resynchronise si l'appel échoue.
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      await likesApi.toggleLike('product', id);
    } catch {
      likesApi.fetchMyLikes('product').then((liked) => setLikedIds(new Set(liked.map((l) => l.targetId)))).catch(() => {});
    }
  }

  // Récupère la présence réelle de chaque boutique susceptible d'être
  // affichée dans la rangée "En ce moment" (union annuaire + trending,
  // dédupliquée). Une requête légère par boutique, en parallèle.
  useEffect(() => {
    const byId = new Map<string, any>();
    for (const s of [...trendingShops, ...shops]) byId.set(s.id, s);
    const list = Array.from(byId.values());
    if (list.length === 0) return;
    let cancelled = false;
    Promise.all(
      list.map((s) =>
        presenceApi
          .fetchShopPresence(s.id)
          .then((p) => ({ id: s.id, count: p.count, intensity: p.intensity }))
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, { count: number; intensity: number }> = {};
      for (const r of results) {
        if (r) map[r.id] = { count: r.count, intensity: r.intensity };
      }
      setShopPresence(map);
    });
    return () => {
      cancelled = true;
    };
  }, [shops, trendingShops]);

  const showShops = filter === 'all' || filter === 'shops' || filter === 'nearby' || filter === 'fast';
  const showServices = filter === 'all' || filter === 'services';

  // Rangée "En ce moment" = classement réel par popularité (backend), avec
  // présence live superposée. En mode "Près de moi", on montre plutôt les
  // boutiques proches (déjà triées par distance dans `shops`).
  const rowShops = filter === 'nearby' ? shops : trendingShops;
  const rowServices = filter === 'nearby' ? services : trendingServices;

  const trendingItems: TrendingItem[] = [
    ...(showShops
      ? rowShops.map((s, i) => ({
          id: `shop-${s.id}`,
          name: s.name,
          imageUrl: s.logoUrl,
          verified: i % 2 === 0,
          rating: 4.5 + (i % 5) * 0.1,
          likes: 12000 + i * 1000,
          // Présence réelle (instantané HTTP) ; undefined tant que non chargée
          // → l'anneau et le "X en ce moment" ne s'affichent tout simplement pas.
          presenceIntensity: shopPresence[s.id]?.intensity,
          presenceCount: shopPresence[s.id]?.count,
          onPress: () => navigation.navigate('Shop', { shopId: s.id }),
        }))
      : []),
    ...(showServices
      ? rowServices.map((sv, i) => ({
          id: `service-${sv.id}`,
          name: sv.title,
          verified: i % 3 === 0,
          rating: 4.3 + (i % 4) * 0.15,
          likes: 400 * (i + 1),
          // Les services ne sont pas rattachés à une présence (la présence
          // est scopée boutique dans ce schéma) : pas de compteur affiché.
          onPress: () => navigation.navigate('Service', { serviceId: sv.id }),
        }))
      : []),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <Ionicons name="water" size={32} color={colors.primary} style={styles.logoIcon} />
            <View>
              <Text style={styles.hello}>
                Souk<Text style={styles.helloAccent}>Quik</Text>
              </Text>
              <Text style={styles.tagline}>Tout. Partout. Pour vous.</Text>
            </View>
          </View>
          <NotificationBell count={unreadCount} onPress={() => navigation.navigate('Notifications')} />
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={goSearch}
          placeholder="Rechercher un article, service..."
          onPressCamera={notYetAvailable}
          rightIcon="options-outline"
          onPressRightIcon={notYetAvailable}
        />
      </View>

      {/* HERO BANNER (HeroBanner gère déjà son propre padding horizontal en interne) */}
      <View style={styles.heroWrapper}>
        <HeroBanner items={HERO_ITEMS} onPress={notYetAvailable} />
      </View>

      {/* EN CE MOMENT */}
      {loading || nearbyLoading ? (
        <View style={styles.rowPadding}>
          <SkeletonCardRow />
        </View>
      ) : trendingItems.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title={filter === 'nearby' ? 'Près de toi' : 'En ce moment'} icon={filter === 'nearby' ? '📍' : '🔥'} onSeeAll={notYetAvailable} />
          <TrendingRow items={trendingItems} />
        </View>
      ) : filter === 'nearby' ? (
        <View style={styles.rowPadding}>
          <EmptyState message="Rien à proximité pour le moment. Essaie d'élargir ta recherche." />
        </View>
      ) : null}

      {/* TENDANCES DU JOUR */}
      {showShops && (
        <View style={styles.section}>
          <SectionTitle title="Tendances du jour" icon="⚡" onSeeAll={notYetAvailable} />
          {loading ? (
            <View style={styles.rowPadding}>
              <SkeletonCardRow />
            </View>
          ) : products.length === 0 ? (
            <EmptyState message="Aucun article pour le moment." />
          ) : (
            <Carousel
              data={products}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item, index }: { item: any; index: number }) => (
                <Card
                  title={item.name}
                  brand={item.brand}
                  price={`${item.price} DJF`}
                  distance={productDistanceLabel(item)}
                  deliveryBadge={`Livraison ${30 + index * 15} min`}
                  imageUrl={item.imageUrl}
                  index={index}
                  likable
                  liked={likedIds.has(item.id)}
                  onToggleLike={() => toggleLike(item.id)}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id, shopId: item.shopId })}
                />
              )}
            />
          )}
        </View>
      )}

      {/* CATÉGORIES */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <SectionTitle title="Catégories" onSeeAll={notYetAvailable} />
          <Carousel
            data={categories}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item, index }: { item: any; index: number }) => (
              <CategoryTile
                label={item.name}
                icon={iconForCategory(item.icon)}
                index={index}
                onPress={() => navigation.navigate('Search', { initialQuery: item.name })}
              />
            )}
          />
        </View>
      )}

      {/* BANNIÈRE SPONSORISÉE (promotions réelles, table promotions) */}
      {promotions.length > 0 && (
        <View style={styles.sponsoredWrapper}>
          <SponsoredBanner
            title={promotions[promoIndex].targetName ?? 'Offre sponsorisée'}
            subtitle="Boutique et produits mis en avant"
            ctaLabel="Découvrir"
            imageUrl={promotions[promoIndex].targetImage}
            onPress={() => handlePromoPress(promotions[promoIndex])}
          />
        </View>
      )}

      {/* FILTRES & DÉCOUVERTE */}
      <View style={styles.filtersWrapper}>
        <FilterChips options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </View>

      <View style={styles.discoveryRow}>
        <DiscoveryCard
          icon="location"
          title="Près de chez toi"
          subtitle={`${shops.length} magasins ouverts`}
          linkLabel="Voir sur la carte"
          layout="map"
          onPress={() => navigation.navigate('Map')}
        />
        <DiscoveryCard
          icon="flash"
          title="Électriciens"
          subtitle="Disponibles maintenant"
          linkLabel="Voir tous"
          layout="avatars"
          onPress={notYetAvailable}
        />
        <DiscoveryCard
          icon="heart"
          title="Pour toi"
          subtitle="Basé sur tes favoris"
          linkLabel="Découvrir"
          layout="product"
          onPress={notYetAvailable}
        />
      </View>
    </ScrollView>
  );
}

function makeSectionStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; lg: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg - 4,
      marginBottom: spacing.sm + 4,
    },
    sectionTitle: {
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.headingBold,
      color: theme.text,
    },
    emoji: { fontSize: typography.size.md },
    seeAllText: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.primary,
    },
  });
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xxl: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { paddingBottom: spacing.xxl + 40 },
    header: { paddingHorizontal: spacing.lg - 4, paddingTop: 60, paddingBottom: spacing.sm, gap: spacing.md },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logoRow: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { marginRight: 8 },
    hello: { fontSize: typography.size.xl, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    helloAccent: { color: theme.primary },
    tagline: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
    heroWrapper: { marginTop: spacing.xs },
    section: { paddingTop: spacing.lg + 8 },
    rowPadding: { paddingLeft: spacing.lg - 4 },
    sponsoredWrapper: { marginTop: spacing.lg + 10, paddingHorizontal: spacing.lg - 4 },
    filtersWrapper: { marginTop: spacing.lg + 5 },
    discoveryRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg - 4, marginTop: spacing.lg },
  });
}
