import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import * as likesApi from '../api/likes';
import * as notificationsApi from '../api/notifications';

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
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    Promise.all([
      catalogApi.fetchShops(),
      catalogApi.fetchServices(),
      catalogApi.search({ type: 'product' }),
      catalogApi.fetchCategories(),
      likesApi.fetchMyLikes('product'),
    ])
      .then(([s, sv, searchRes, cats, likedProducts]) => {
        setShops(s);
        setServices(sv);
        setProducts(searchRes.products || []);
        setCategories(cats.length ? cats : FALLBACK_CATEGORIES);
        setLikedIds(new Set(likedProducts.map((l) => l.targetId)));
      })
      .finally(() => setLoading(false));
  }, []);

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

  const showShops = filter === 'all' || filter === 'shops' || filter === 'nearby' || filter === 'fast';
  const showServices = filter === 'all' || filter === 'services';

  const trendingItems: TrendingItem[] = [
    ...(showShops
      ? shops.map((s, i) => ({
          id: `shop-${s.id}`,
          name: s.name,
          imageUrl: s.logoUrl,
          verified: i % 2 === 0,
          rating: 4.5 + (i % 5) * 0.1,
          likes: 12000 + i * 1000,
          presenceIntensity: Math.min(0.5 + i * 0.15, 1),
          presenceCount: 180 + i * 47,
          onPress: () => navigation.navigate('Shop', { shopId: s.id }),
        }))
      : []),
    ...(showServices
      ? services.map((sv, i) => ({
          id: `service-${sv.id}`,
          name: sv.title,
          verified: i % 3 === 0,
          rating: 4.3 + (i % 4) * 0.15,
          likes: 400 * (i + 1),
          presenceIntensity: Math.min(0.2 + i * 0.2, 1),
          presenceCount: 15 + i * 18,
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
      {loading ? (
        <View style={styles.rowPadding}>
          <SkeletonCardRow />
        </View>
      ) : trendingItems.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="En ce moment" icon="🔥" onSeeAll={notYetAvailable} />
          <TrendingRow items={trendingItems} />
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
                  distance={`${(1.2 + index * 0.3).toFixed(1)} km`}
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

      {/* BANNIÈRE SPONSORISÉE */}
      <View style={styles.sponsoredWrapper}>
        <SponsoredBanner
          title="Nouveau ! Collection Luxe"
          subtitle="Découvrez les montres premium à prix exclusifs"
          ctaLabel="Découvrir"
          onPress={notYetAvailable}
        />
      </View>

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
          onPress={notYetAvailable}
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
