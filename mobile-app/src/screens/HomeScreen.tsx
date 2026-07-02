import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { theme } from '../theme/theme';
import * as catalogApi from '../api/catalog';

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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.hello}>SoukQuik</Text>
        <SearchBar value={query} onChangeText={setQuery} onSubmit={goSearch} />
      </View>

      <Text style={styles.sectionTitle}>Boutiques populaires</Text>
      {shops.length === 0 && !loading ? (
        <EmptyState message="Aucune boutique pour le moment." />
      ) : (
        <FlatList
          horizontal
          data={shops}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          renderItem={({ item }) => (
            <Card
              title={item.name}
              subtitle={item.address}
              imageUrl={item.logoUrl}
              onPress={() => navigation.navigate('Shop', { shopId: item.id })}
            />
          )}
        />
      )}

      <Text style={styles.sectionTitle}>Services les plus demandés</Text>
      {services.length === 0 && !loading ? (
        <EmptyState message="Aucun service pour le moment." />
      ) : (
        <FlatList
          horizontal
          data={services}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          renderItem={({ item }) => (
            <Card
              title={item.title}
              subtitle={`${item.price} DJF`}
              onPress={() => navigation.navigate('Service', { serviceId: item.id })}
            />
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { padding: 20, paddingTop: 60, gap: 16 },
  hello: { fontSize: 26, fontWeight: '800', color: theme.text },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.text, marginLeft: 20, marginTop: 24, marginBottom: 12 },
  row: { paddingHorizontal: 20 },
});
