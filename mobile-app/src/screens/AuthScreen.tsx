import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';
import { useSession } from '../store/session';
import * as authApi from '../api/auth';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'vendor' | 'provider'>('client');
  const [loading, setLoading] = useState(false);
  const setSession = useSession((s) => s.setSession);

  async function submit() {
    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await authApi.login({ email, password })
          : await authApi.register({ fullName, email, phone, password, role });
      setSession(result.user, result.accessToken, result.refreshToken);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>SoukQuik</Text>
      <Text style={styles.tagline}>Le marché local, à portée de main</Text>

      <View style={styles.tabs}>
        <Text onPress={() => setMode('login')} style={[styles.tab, mode === 'login' && styles.tabActive]}>
          Connexion
        </Text>
        <Text onPress={() => setMode('register')} style={[styles.tab, mode === 'register' && styles.tabActive]}>
          Inscription
        </Text>
      </View>

      {mode === 'register' && (
        <TextInput style={styles.input} placeholder="Nom complet" value={fullName} onChangeText={setFullName} placeholderTextColor={theme.muted} />
      )}
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} placeholderTextColor={theme.muted} />
      {mode === 'register' && (
        <TextInput style={styles.input} placeholder="Téléphone" value={phone} onChangeText={setPhone} placeholderTextColor={theme.muted} />
      )}
      <TextInput style={styles.input} placeholder="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} placeholderTextColor={theme.muted} />

      {mode === 'register' && (
        <View style={styles.roleRow}>
          {(['client', 'vendor', 'provider'] as const).map((r) => (
            <Text key={r} onPress={() => setRole(r)} style={[styles.roleChip, role === r && styles.roleChipActive]}>
              {r === 'client' ? 'Client' : r === 'vendor' ? 'Vendeur' : 'Prestataire'}
            </Text>
          ))}
        </View>
      )}

      <Button label={mode === 'login' ? 'Se connecter' : "S'inscrire"} onPress={submit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: 24, paddingTop: 80 },
  logo: { fontSize: 32, fontWeight: '800', color: theme.primary, textAlign: 'center' },
  tagline: { fontSize: 14, color: theme.muted, textAlign: 'center', marginTop: 4, marginBottom: 32 },
  tabs: { flexDirection: 'row', marginBottom: 24, justifyContent: 'center', gap: 24 },
  tab: { fontSize: 15, color: theme.muted, fontWeight: '600' },
  tabActive: { color: theme.primary, textDecorationLine: 'underline' },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 12,
    color: theme.text,
  },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleChip: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: theme.muted,
  },
  roleChipActive: { borderColor: theme.primary, color: theme.primary, fontWeight: '700' },
});
