import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme, typography } from '../theme/theme';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import * as catalogApi from '../api/catalog';

export function ServiceScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { serviceId } = route.params;
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    catalogApi.fetchService(serviceId).then(setService);
  }, [serviceId]);

  if (!service) return <EmptyState message="Chargement..." />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{service.title}</Text>
      <Text style={styles.price}>{service.price} DJF · {service.priceUnit}</Text>
      {service.description ? <Text style={styles.description}>{service.description}</Text> : null}
      <Text style={styles.area}>Zone d'intervention : {service.serviceAreaKm} km</Text>

      <View style={{ marginTop: 32 }}>
        <Button label="Réserver ce service" onPress={() => navigation.navigate('Booking', { serviceId: service.id })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontFamily: typography.fontFamily.headingBold, color: theme.text },
  price: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary, marginTop: 8 },
  description: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.body, color: theme.text, marginTop: 16, lineHeight: 20 },
  area: { fontSize: typography.size.sm - 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 12 },
});
