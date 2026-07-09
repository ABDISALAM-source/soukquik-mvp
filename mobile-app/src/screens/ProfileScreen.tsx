import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, typography } from '../theme/theme';
import { Button } from '../components/Button';
import { useSession } from '../store/session';

export function ProfileScreen() {
  const { user, clearSession } = useSession();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.fullName?.charAt(0).toUpperCase() || '?'}</Text>
      </View>
      <Text style={styles.name}>{user?.fullName}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.role}>{user?.role}</Text>

      <View style={{ marginTop: 40, width: '100%' }}>
        <Button label="Se déconnecter" variant="secondary" onPress={clearSession} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 80, alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontFamily: typography.fontFamily.headingBold, color: theme.primary },
  name: { fontSize: 20, fontFamily: typography.fontFamily.headingBold, color: theme.text },
  email: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 4 },
  role: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: theme.primary,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
