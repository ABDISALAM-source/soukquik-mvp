import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { theme } from '../theme/theme';
import * as catalogApi from '../api/catalog';

export function SearchScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState(route.params?.initialQuery || '');
  const [results, setResults] = useState<{ products: any[]; services: any[]; shops: any[] }>({
    products: [],
    services: [],
    shops: [],
  });

  async function runSearch() {
    const data = await catalogApi.search({ q: query, type: 'all' });
    setResults(data);
  }

  useEffect(() => {
    runSearch();
  }, []);

  const combined = [
    ...results.shops.map((s) => ({ ...s, __type: 'shop' })),
    ...results.products.map((p) => ({ ...p, __type: 'product' })),
    ...results.services.map((s) => ({ ...s, __type: 'service' })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar value={query} onChangeText={setQuery} onSubmit={runSearch} />
      </View>
      {combined.length === 0 ? (
        <EmptyState message="Aucun résultat pour cette recherche." />
      ) : (
        <FlatList
          data={combined}
          keyExtractor={(item, idx) => `${item.__type}-${item.id}-${idx}`}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Text
              style={styles.result}
              onPress={() => {
                if (item.__type === 'shop') navigation.navigate('Shop', { shopId: item.id });
                if (item.__type === 'service') navigation.navigate('Service', { serviceId: item.id });
              }}
            >
              {item.__type === 'shop' ? '🏪 ' : item.__type === 'service' ? '🧑‍🔧 ' : '📦 '}
              {item.name || item.title}
            </Text>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { padding: 20, paddingTop: 60 },
  result: {
    fontSize: 15,
    color: theme.text,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
});
