import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { Carousel } from '../components/Carousel';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCardRow } from '../components/Skeleton';
import { theme, spacing, typography } from '../theme/theme';
import * as catalogApi from '../api/catalog';

function SectionTitle({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionIconBadge}>
        <Ionicons name={icon} size={15} color={theme.primary} />
      </View>
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [shops, setShops] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([catalogApi.fetchShops(), catalogApi.fetchServices()])
      .then(([s, sv]) => {
        setShops(s);
        setServices(sv);
      })
      .finally(() => setLoading(false));
  }, []);

  function goSearch() {
    navigation.navigate('Search', { initialQuery: query });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.hello}>SoukQuik</Text>
        <SearchBar value={query} onChangeText={setQuery} onSubmit={goSearch} />
      </View>

      <View style={styles.section}>
        <SectionTitle icon="storefront" label="Boutiques populaires" />
        {loading ? (
          <View style={styles.rowPadding}>
            <SkeletonCardRow />
          </View>
        ) : shops.length === 0 ? (
          <EmptyState message="Aucune boutique pour le moment." />
        ) : (
          <Carousel
            data={shops}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item, index }: { item: any; index: number }) => (
              <Card
                title={item.name}
                subtitle={item.address}
                imageUrl={item.logoUrl}
                index={index}
                onPress={() => navigation.navigate('Shop', { shopId: item.id })}
              />
            )}
          />
        )}
      </View>

      <View style={[styles.section, styles.sectionAlt]}>
        <SectionTitle icon="construct" label="Services les plus demandés" />
        {loading ? (
          <View style={styles.rowPadding}>
            <SkeletonCardRow />
          </View>
        ) : services.length === 0 ? (
          <EmptyState message="Aucun service pour le moment." />
        ) : (
          <Carousel
            data={services}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item, index }: { item: any; index: number }) => (
              <Card
                title={item.title}
                subtitle={`${item.price} DJF`}
                index={index}
                onPress={() => navigation.navigate('Service', { serviceId: item.id })}
              />
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { paddingBottom: spacing.xxl },
  header: { padding: spacing.lg - 4, paddingTop: 60, gap: spacing.md },
  hello: { fontSize: typography.size.xl - 2, fontFamily: typography.fontFamily.headingBold, color: theme.text },
  section: { paddingTop: spacing.lg },
  sectionAlt: { backgroundColor: theme.surface, marginTop: spacing.sm },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.lg - 4,
    marginBottom: spacing.sm + 4,
  },
  sectionIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary + '18',
  },
  sectionTitle: {
    fontSize: typography.size.md + 1,
    fontFamily: typography.fontFamily.heading,
    color: theme.text,
  },
  rowPadding: { paddingLeft: spacing.lg - 4 },
});
