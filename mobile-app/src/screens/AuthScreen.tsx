import React, { useMemo, useState, useEffect } from 'react';
import { 
  Alert, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  LayoutAnimation,
  UIManager,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useSession } from '../store/session';
import * as authApi from '../api/auth';

// Imports pour l'authentification Google
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Permet de fermer le navigateur automatiquement après la connexion Google
WebBrowser.maybeCompleteAuthSession();

// Activer LayoutAnimation pour Android (animations fluides)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Palette sombre forcée : l'écran de connexion garde volontairement le look
// sombre de la maquette quel que soit le thème choisi (le toggle clair/sombre
// reprend ses droits une fois connecté). Constante de module (et non objet
// local au composant) pour que le useMemo des styles soit réellement stable.
const forcedDarkColors = {
  background: '#090A0F',
  surface: '#15171E',
  surfaceAlt: '#23252E',
  text: '#FFFFFF',
  muted: '#8E8E93',
  primary: '#00BFFF',
  border: '#2C2C2E',
};

export function AuthScreen() {
  const { spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(forcedDarkColors, spacing, radius, typography), [spacing, radius, typography]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'vendor' | 'provider'>('client');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const setSession = useSession((s) => s.setSession);

  // --- CONFIGURATION GOOGLE OAUTH ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Votre identifiant Android fraîchement généré !
    androidClientId: '315459013363-jgj9juqlun7k0qi6vvk59jl7m9rgl3uj.apps.googleusercontent.com',
    iosClientId: '', // À remplir plus tard pour la version iPhone
    // IMPORTANT : Remplacez ceci par l'ID "Application Web" si vous testez sur Expo Go
    webClientId: 'VOTRE_ID_WEB_ICI.apps.googleusercontent.com', 
  });

  // Écoute le retour de Google une fois l'utilisateur connecté
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleLoginToBackend(authentication.accessToken);
      }
    } else if (response?.type === 'error') {
      Alert.alert("Annulé", "La connexion avec Google a échoué ou a été annulée.");
      setGoogleLoading(false);
    }
  }, [response]);

  async function handleGoogleLoginToBackend(accessToken: string) {
    try {
      // Le backend vérifie le token auprès de Google (userinfo), crée le
      // compte au premier passage (avec le rôle sélectionné), puis renvoie
      // les mêmes tokens JWT que le login classique.
      const result = await authApi.loginWithGoogle({ accessToken, role });
      setSession(result.user, result.accessToken, result.refreshToken, false);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de lier le compte Google.');
    } finally {
      setGoogleLoading(false);
    }
  }

  const signInWithGoogle = () => {
    setGoogleLoading(true);
    promptAsync();
  };
  // ----------------------------------

  const toggleMode = (newMode: 'login' | 'register') => {
    if (mode === newMode) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(newMode);
  };

  async function submit() {
    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await authApi.login({ email, password })
          : await authApi.register({ fullName, email, phone, password, role });
      setSession(result.user, result.accessToken, result.refreshToken, mode === 'register');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#090A0F" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER & LOGO */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="water" size={36} color={forcedDarkColors.primary} />
          </View>
          <Text style={styles.logo}>
            Souk<Text style={styles.logoAccent}>Quik</Text>
          </Text>
          <Text style={styles.tagline}>Tout. Partout. Pour vous.</Text>
        </View>

        {/* SELECTEUR DE MODE (Connexion / Inscription) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, mode === 'login' && styles.tabActive]} 
            onPress={() => toggleMode('login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, mode === 'register' && styles.tabActive]} 
            onPress={() => toggleMode('register')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {/* FORMULAIRE */}
        <View style={styles.formContainer}>
          {mode === 'register' && (
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={forcedDarkColors.muted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Nom complet" 
                value={fullName} 
                onChangeText={setFullName} 
                placeholderTextColor={forcedDarkColors.muted} 
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={forcedDarkColors.muted} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Email" 
              autoCapitalize="none" 
              keyboardType="email-address"
              value={email} 
              onChangeText={setEmail} 
              placeholderTextColor={forcedDarkColors.muted} 
            />
          </View>

          {mode === 'register' && (
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={forcedDarkColors.muted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Téléphone" 
                keyboardType="phone-pad"
                value={phone} 
                onChangeText={setPhone} 
                placeholderTextColor={forcedDarkColors.muted} 
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={forcedDarkColors.muted} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Mot de passe" 
              secureTextEntry 
              value={password} 
              onChangeText={setPassword} 
              placeholderTextColor={forcedDarkColors.muted} 
            />
          </View>

          {mode === 'login' && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}

          {mode === 'register' && (
            <View style={styles.roleContainer}>
              <Text style={styles.roleTitle}>Je suis un :</Text>
              <View style={styles.roleRow}>
                {(['client', 'vendor', 'provider'] as const).map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    onPress={() => setRole(r)} 
                    style={[styles.roleChip, role === r && styles.roleChipActive]}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={r === 'client' ? 'basket-outline' : r === 'vendor' ? 'storefront-outline' : 'construct-outline'} 
                      size={16} 
                      color={role === r ? forcedDarkColors.primary : forcedDarkColors.muted} 
                      style={styles.roleIcon}
                    />
                    <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                      {r === 'client' ? 'Client' : r === 'vendor' ? 'Vendeur' : 'Prestataire'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* BOUTON D'ACTION PRINCIPAL */}
          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={submit} 
            disabled={loading || googleLoading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#090A0F" />
            ) : (
              <Text style={styles.mainButtonText}>
                {mode === 'login' ? 'Se connecter' : "Créer mon compte"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* SÉPARATEUR */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Ou continuer avec</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* RÉSEAUX SOCIAUX */}
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={[styles.socialBtn, styles.googleBtn]} 
            activeOpacity={0.8}
            onPress={signInWithGoogle}
            disabled={!request || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                <Text style={styles.socialBtnText}>Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialBtn, styles.facebookBtn]}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Bientôt disponible', "La connexion Facebook n'est pas encore branchée.")}
          >
            <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
            <Text style={styles.socialBtnText}>Facebook</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- STYLES ---
function makeStyles(
  theme: any,
  spacing: any,
  radius: any,
  typography: any
) {
  return StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.background 
    },
    content: { 
      flexGrow: 1,
      paddingHorizontal: 24, 
      paddingTop: 60,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 35,
    },
    logoCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: 'rgba(0, 191, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
      borderWidth: 1,
      borderColor: 'rgba(0, 191, 255, 0.3)',
    },
    logo: { 
      fontSize: 36, 
      fontWeight: 'bold', 
      color: theme.text, 
    },
    logoAccent: {
      color: theme.primary,
    },
    tagline: {
      fontSize: typography.size.sm,
      color: theme.muted,
      marginTop: 6,
      letterSpacing: 0.5,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: radius.pill,
      padding: 4,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: radius.pill,
    },
    tabActive: {
      backgroundColor: theme.surfaceAlt,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    tabText: {
      fontSize: typography.size.md - 1,
      fontWeight: '600',
      color: theme.muted,
    },
    tabTextActive: {
      color: theme.text,
    },
    formContainer: {
      width: '100%',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.sm + 6,
      height: 56,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: '100%',
      fontSize: typography.size.md,
      color: theme.text,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: theme.primary,
      fontSize: typography.size.sm,
      fontWeight: '600',
    },
    roleContainer: {
      marginBottom: 24,
      marginTop: 4,
    },
    roleTitle: {
      color: theme.text,
      fontSize: typography.size.sm,
      fontWeight: '600',
      marginBottom: 12,
    },
    roleRow: { 
      flexDirection: 'row', 
      gap: 10, 
    },
    roleChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      paddingVertical: 12,
    },
    roleChipActive: { 
      backgroundColor: 'rgba(0, 191, 255, 0.1)', 
      borderColor: theme.primary, 
    },
    roleIcon: {
      marginRight: 6,
    },
    roleChipText: {
      fontSize: typography.size.xs + 2,
      fontWeight: '500',
      color: theme.muted,
    },
    roleChipTextActive: { 
      color: theme.primary, 
      fontWeight: '700',
    },
    mainButton: {
      backgroundColor: theme.primary,
      height: 56,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 5,
    },
    mainButtonText: {
      color: '#090A0F', // Texte sombre pour le contraste
      fontSize: typography.size.md,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 30,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      color: theme.muted,
      paddingHorizontal: 15,
      fontSize: typography.size.sm,
      fontWeight: '500',
    },
    socialContainer: {
      flexDirection: 'row',
      gap: 15,
    },
    socialBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
      borderRadius: radius.pill,
      gap: 10,
    },
    googleBtn: {
      backgroundColor: '#EA4335',
    },
    facebookBtn: {
      backgroundColor: '#1877F2',
    },
    socialBtnText: {
      color: '#FFFFFF',
      fontSize: typography.size.sm + 1,
      fontWeight: 'bold',
    }
  });
}