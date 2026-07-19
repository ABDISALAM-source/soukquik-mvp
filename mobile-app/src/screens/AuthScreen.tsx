import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useSession } from '../store/session';
import { useLocationStore } from '../store/location';
import * as authApi from '../api/auth';
import { createShop, createService, fetchCategories } from '../api/catalog';
import { pickImageAsDataUri } from '../utils/imagePick';
import { signInWithGoogleNative } from '../utils/googleAuth';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Palette sombre forcée : l'écran d'auth garde le look sombre de la maquette
// quel que soit le thème choisi (le toggle clair/sombre reprend ses droits une
// fois connecté). Constante de module pour que le useMemo des styles soit stable.
const C = {
  background: '#090A0F',
  surface: '#15171E',
  surfaceAlt: '#23252E',
  text: '#FFFFFF',
  muted: '#8E8E93',
  primary: '#00BFFF',
  border: '#2C2C2E',
  danger: '#FF453A',
};

type Role = 'client' | 'vendor' | 'provider';
type Category = { id: string; name: string; type: string; icon?: string; parentId: string | null };
type Tokens = { user: any; accessToken: string; refreshToken: string };

const PRICE_UNITS = ['forfait', 'heure', 'jour'];

export function AuthScreen() {
  const { spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(spacing, radius, typography), [spacing, radius, typography]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  // Inscription multi-étapes : 0 = choix du rôle, 1 = compte, 2 = infos pro (marchands).
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>('client');

  // Compte
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Infos pro (marchand / prestataire)
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [bizName, setBizName] = useState('');
  const [patente, setPatente] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('forfait');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Tokens conservés quand un marchand s'inscrit via Google : le compte est
  // déjà créé côté serveur, on passe à l'étape "infos pro" avant de finaliser.
  const [pendingTokens, setPendingTokens] = useState<Tokens | null>(null);

  const setSession = useSession((s) => s.setSession);
  const coords = useLocationStore((s) => s.coords);
  const locStatus = useLocationStore((s) => s.status);
  const requestLocation = useLocationStore((s) => s.requestLocation);

  // Entrée animée de la carte (fondu + glissement).
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 650, delay: 120, useNativeDriver: true }).start();
  }, []);

  // Charge les types de boutique/service pour le sélecteur (une fois).
  useEffect(() => {
    fetchCategories()
      .then((all: Category[]) => setCategories(all))
      .catch(() => {});
  }, []);

  const shopTypes = useMemo(
    () => categories.filter((c) => c.type === 'product' && !c.parentId),
    [categories]
  );
  const serviceTypes = useMemo(
    () => categories.filter((c) => c.type === 'service' && !c.parentId),
    [categories]
  );

  function animateNext() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  function switchMode(next: 'login' | 'register') {
    if (mode === next) return;
    animateNext();
    setMode(next);
    setStep(0);
  }

  function pickRole(r: Role) {
    animateNext();
    setRole(r);
    setCategoryId(null);
    setStep(1);
  }

  function goBack() {
    animateNext();
    if (step === 2) setStep(1);
    else if (step === 1) setStep(0);
  }

  async function pick(setter: (v: string) => void, size: number) {
    const uri = await pickImageAsDataUri(size);
    if (uri) setter(uri);
  }

  // Validation de l'étape compte avant de continuer / créer.
  function validateAccount(): string | null {
    if (fullName.trim().length < 2) return 'Entre ton nom complet.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Entre un email valide.';
    if (phone.trim().length < 6) return 'Entre un numéro de téléphone valide.';
    if (password.length < 6) return 'Le mot de passe doit faire au moins 6 caractères.';
    return null;
  }

  function validateBusiness(): string | null {
    if (!categoryId) return role === 'vendor' ? 'Choisis un type de boutique.' : 'Choisis ton métier.';
    if (bizName.trim().length < 2)
      return role === 'vendor' ? 'Donne un nom à ta boutique.' : "Donne un titre à ta prestation.";
    if (patente.trim().length < 2) return 'Le numéro de patente est requis pour valider ton compte.';
    if (!idDocumentUrl) return "Ajoute une photo de ta carte d'identité.";
    if (!coords) return 'Enregistre ta localisation.';
    if (role === 'provider') {
      const p = Number(price);
      if (!p || p <= 0) return 'Indique un tarif valide.';
    }
    return null;
  }

  // Étape compte : client -> crée directement ; marchand -> passe aux infos pro.
  function submitAccountStep() {
    const err = validateAccount();
    if (err) return Alert.alert('Vérifie tes infos', err);
    if (role === 'client') {
      finalize();
    } else {
      animateNext();
      setStep(2);
    }
  }

  // Création finale : compte (si pas déjà créé via Google) + boutique/service.
  async function finalize() {
    if (role !== 'client') {
      const err = validateBusiness();
      if (err) return Alert.alert('Vérifie tes infos', err);
    }
    setLoading(true);
    try {
      let tokens = pendingTokens;
      if (!tokens) {
        tokens = await authApi.register({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role,
          avatarUrl: avatarUrl ?? undefined,
        });
        // On pose seulement le token (pas l'utilisateur) : le client API peut
        // s'authentifier pour créer la boutique/service sans que le navigateur
        // bascule déjà hors de l'écran d'inscription.
        useSession.setState({ accessToken: tokens.accessToken });
      }

      if (role === 'vendor') {
        await createShop({
          name: bizName.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId!,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          address: address.trim() || undefined,
          logoUrl: logoUrl ?? undefined,
          patente: patente.trim(),
          slogan: slogan.trim() || undefined,
          idDocumentUrl: idDocumentUrl ?? undefined,
        });
      } else if (role === 'provider') {
        await createService({
          title: bizName.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId!,
          price: Number(price),
          priceUnit,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          logoUrl: logoUrl ?? undefined,
          patente: patente.trim(),
          slogan: slogan.trim() || undefined,
          idDocumentUrl: idDocumentUrl ?? undefined,
        });
      }

      setSession(tokens.user, tokens.accessToken, tokens.refreshToken, true);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || "L'inscription a échoué.");
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return Alert.alert('Vérifie tes infos', 'Entre un email valide.');
    if (!password) return Alert.alert('Vérifie tes infos', 'Entre ton mot de passe.');
    setLoading(true);
    try {
      const result = await authApi.login({ email: email.trim(), password });
      setSession(result.user, result.accessToken, result.refreshToken, false);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  // Connexion Google NATIVE. En login ou pour un client -> session complète.
  // Pour un marchand en inscription -> on garde les tokens et on passe aux
  // infos pro (le compte est créé, il reste la boutique/service à renseigner).
  async function onGoogle() {
    setGoogleLoading(true);
    try {
      const accessToken = await signInWithGoogleNative();
      if (!accessToken) return; // annulé
      const result = await authApi.loginWithGoogle({ accessToken, role: mode === 'register' ? role : undefined });
      if (mode === 'login' || role === 'client') {
        setSession(result.user, result.accessToken, result.refreshToken, mode === 'register');
      } else {
        useSession.setState({ accessToken: result.accessToken });
        setPendingTokens(result);
        // Pré-remplit le nom depuis le compte Google si vide.
        if (!fullName && result.user?.fullName) setFullName(result.user.fullName);
        if (!email && result.user?.email) setEmail(result.user.email);
        animateNext();
        setStep(2);
      }
    } catch (err: any) {
      Alert.alert('Connexion Google', err.message || "La connexion a échoué. Réessaie ou utilise l'email.");
    } finally {
      setGoogleLoading(false);
    }
  }

  const busy = loading || googleLoading;

  // ---- Sous-rendus ----

  function renderField(
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    opts: any = {}
  ) {
    return (
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color={C.muted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, opts.multiline && styles.inputMultiline]}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          value={value}
          onChangeText={onChange}
          {...opts}
        />
      </View>
    );
  }

  function renderImagePick(
    label: string,
    hint: string,
    value: string | null,
    onPress: () => void,
    round = false
  ) {
    return (
      <TouchableOpacity style={styles.pickRow} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.pickThumb, round && styles.pickThumbRound]}>
          {value ? (
            <Image source={{ uri: value }} style={[styles.pickImg, round && styles.pickThumbRound]} />
          ) : (
            <Ionicons name="camera-outline" size={22} color={C.muted} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pickLabel}>{label}</Text>
          <Text style={styles.pickHint}>{value ? 'Appuie pour changer' : hint}</Text>
        </View>
        {value && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
      </TouchableOpacity>
    );
  }

  function renderLogin() {
    return (
      <>
        {renderField('mail-outline', 'Email', email, setEmail, {
          autoCapitalize: 'none',
          keyboardType: 'email-address',
        })}
        {renderField('lock-closed-outline', 'Mot de passe', password, setPassword, { secureTextEntry: true })}
        <TouchableOpacity style={styles.forgot}>
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
        <PrimaryButton label="Se connecter" onPress={submitLogin} loading={loading} disabled={busy} styles={styles} />
        {renderSocial()}
      </>
    );
  }

  function renderRoleStep() {
    const roles: { key: Role; title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { key: 'client', title: 'Client', sub: 'Acheter & réserver près de moi', icon: 'basket-outline' },
      { key: 'vendor', title: 'Vendeur', sub: 'Ouvrir ma boutique', icon: 'storefront-outline' },
      { key: 'provider', title: 'Prestataire', sub: 'Proposer mes services', icon: 'construct-outline' },
    ];
    return (
      <>
        <Text style={styles.stepTitle}>Je veux m'inscrire en tant que</Text>
        {roles.map((r) => (
          <TouchableOpacity key={r.key} style={styles.roleCard} onPress={() => pickRole(r.key)} activeOpacity={0.85}>
            <View style={styles.roleCardIcon}>
              <Ionicons name={r.icon} size={26} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleCardTitle}>{r.title}</Text>
              <Text style={styles.roleCardSub}>{r.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={C.muted} />
          </TouchableOpacity>
        ))}
      </>
    );
  }

  function renderAccountStep() {
    return (
      <>
        <Text style={styles.stepTitle}>Tes informations</Text>
        {/* Photo de profil (optionnelle pour tous) */}
        <View style={styles.avatarRow}>
          <TouchableOpacity onPress={() => pick(setAvatarUrl, 400)} activeOpacity={0.8}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={34} color={C.muted} />
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={13} color="#090A0F" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Photo de profil{'\n'}(optionnel)</Text>
        </View>

        {renderField('person-outline', 'Nom complet', fullName, setFullName)}
        {renderField('mail-outline', 'Email', email, setEmail, {
          autoCapitalize: 'none',
          keyboardType: 'email-address',
        })}
        {renderField('call-outline', 'Téléphone', phone, setPhone, { keyboardType: 'phone-pad' })}
        {renderField('lock-closed-outline', 'Mot de passe', password, setPassword, { secureTextEntry: true })}

        <PrimaryButton
          label={role === 'client' ? 'Créer mon compte' : 'Continuer'}
          onPress={submitAccountStep}
          loading={loading && role === 'client'}
          disabled={busy}
          styles={styles}
        />
        {renderSocial()}
      </>
    );
  }

  function renderBusinessStep() {
    const types = role === 'vendor' ? shopTypes : serviceTypes;
    return (
      <>
        <Text style={styles.stepTitle}>{role === 'vendor' ? 'Ta boutique' : 'Ton activité'}</Text>

        {/* Type de boutique / métier */}
        <Text style={styles.fieldLabel}>{role === 'vendor' ? 'Type de boutique' : 'Métier'}</Text>
        <View style={styles.typeWrap}>
          {types.map((t) => {
            const active = categoryId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => setCategoryId(t.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={((t.icon || 'pricetag') + '-outline') as any}
                  size={15}
                  color={active ? C.primary : C.muted}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{t.name}</Text>
              </TouchableOpacity>
            );
          })}
          {types.length === 0 && <Text style={styles.pickHint}>Chargement des catégories…</Text>}
        </View>

        {renderField(
          role === 'vendor' ? 'storefront-outline' : 'briefcase-outline',
          role === 'vendor' ? 'Nom de la boutique' : 'Titre de la prestation',
          bizName,
          setBizName
        )}
        {renderField('reader-outline', 'Numéro de patente', patente, setPatente)}
        {renderField('sparkles-outline', 'Slogan (optionnel)', slogan, setSlogan)}
        {renderField('information-circle-outline', 'Description', description, setDescription, {
          multiline: true,
          numberOfLines: 3,
        })}

        {role === 'vendor' &&
          renderField('location-outline', 'Adresse (optionnel)', address, setAddress)}

        {role === 'provider' && (
          <>
            {renderField('cash-outline', 'Tarif (FCFA)', price, setPrice, { keyboardType: 'numeric' })}
            <View style={styles.unitRow}>
              {PRICE_UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, priceUnit === u && styles.unitChipActive]}
                  onPress={() => setPriceUnit(u)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.unitChipText, priceUnit === u && styles.unitChipTextActive]}>
                    {u === 'forfait' ? 'Forfait' : u === 'heure' ? 'Par heure' : 'Par jour'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Localisation GPS */}
        <TouchableOpacity style={styles.pickRow} onPress={() => requestLocation()} activeOpacity={0.8}>
          <View style={styles.pickThumb}>
            <Ionicons name="navigate-outline" size={22} color={coords ? C.primary : C.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickLabel}>Localisation</Text>
            <Text style={styles.pickHint}>
              {coords
                ? `Enregistrée (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
                : locStatus === 'requesting'
                ? 'Localisation en cours…'
                : locStatus === 'denied'
                ? 'Accès refusé — appuie pour réessayer'
                : 'Appuie pour utiliser ma position'}
            </Text>
          </View>
          {coords && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
        </TouchableOpacity>

        {renderImagePick("Carte d'identité", 'Requis pour valider ton compte', idDocumentUrl, () =>
          pick(setIdDocumentUrl, 900)
        )}
        {renderImagePick(
          role === 'vendor' ? 'Logo de la boutique' : 'Logo / photo',
          'Optionnel',
          logoUrl,
          () => pick(setLogoUrl, 500),
          true
        )}

        <PrimaryButton
          label="Finaliser mon inscription"
          onPress={finalize}
          loading={loading}
          disabled={busy}
          styles={styles}
        />
      </>
    );
  }

  function renderSocial() {
    return (
      <>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Ou continuer avec</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialBtn, styles.googleBtn]}
            activeOpacity={0.85}
            onPress={onGoogle}
            disabled={busy}
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
            activeOpacity={0.85}
            onPress={() => Alert.alert('Bientôt', "La connexion Facebook n'est pas encore branchée.")}
          >
            <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
            <Text style={styles.socialBtnText}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const showBack = mode === 'register' && step > 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* HEADER + VRAI LOGO */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImg} resizeMode="cover" />
          </View>
          <Text style={styles.logo}>
            Souk<Text style={styles.logoAccent}>Quik</Text>
          </Text>
          <Text style={styles.tagline}>Tout. Partout. Pour vous.</Text>
        </View>

        <Animated.View
          style={{
            opacity: enter,
            transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }}
        >
          {/* TABS */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => switchMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              onPress={() => switchMode('register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Inscription</Text>
            </TouchableOpacity>
          </View>

          {/* Fil d'ariane / retour pour l'inscription marchand */}
          {showBack && (
            <TouchableOpacity style={styles.backRow} onPress={goBack} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={C.primary} />
              <Text style={styles.backText}>Retour</Text>
              <View style={styles.stepDots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
                ))}
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.form}>
            {mode === 'login' && renderLogin()}
            {mode === 'register' && step === 0 && renderRoleStep()}
            {mode === 'register' && step === 1 && renderAccountStep()}
            {mode === 'register' && step === 2 && renderBusinessStep()}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  styles,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  styles: any;
}) {
  return (
    <TouchableOpacity style={[styles.mainBtn, disabled && { opacity: 0.7 }]} onPress={onPress} disabled={disabled} activeOpacity={0.85}>
      {loading ? <ActivityIndicator color="#090A0F" /> : <Text style={styles.mainBtnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

function makeStyles(spacing: any, radius: any, typography: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 44 },
    header: { alignItems: 'center', marginBottom: 26 },
    logoCircle: {
      width: 84,
      height: 84,
      borderRadius: 26,
      overflow: 'hidden',
      marginBottom: 14,
      borderWidth: 2,
      borderColor: 'rgba(0,191,255,0.35)',
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 18,
      elevation: 10,
    },
    logoImg: { width: '100%', height: '100%' },
    logo: { fontSize: 34, fontWeight: 'bold', color: C.text },
    logoAccent: { color: C.primary },
    tagline: { fontSize: typography.size.sm, color: C.muted, marginTop: 6, letterSpacing: 0.5 },

    tabRow: {
      flexDirection: 'row',
      backgroundColor: C.surface,
      borderRadius: radius.pill,
      padding: 4,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.pill },
    tabActive: { backgroundColor: C.surfaceAlt },
    tabText: { fontSize: typography.size.md - 1, fontWeight: '600', color: C.muted },
    tabTextActive: { color: C.text },

    backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    backText: { color: C.primary, fontSize: typography.size.sm, fontWeight: '600', marginLeft: 2 },
    stepDots: { flexDirection: 'row', marginLeft: 'auto', gap: 6 },
    stepDot: { width: 22, height: 4, borderRadius: 2, backgroundColor: C.border },
    stepDotActive: { backgroundColor: C.primary },

    form: { width: '100%' },
    stepTitle: { color: C.text, fontSize: typography.size.lg, fontWeight: '700', marginBottom: 16 },
    fieldLabel: { color: C.muted, fontSize: typography.size.sm, fontWeight: '600', marginBottom: 8 },

    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      borderRadius: radius.sm + 6,
      minHeight: 56,
      paddingHorizontal: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: C.border,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: typography.size.md, color: C.text, paddingVertical: 14 },
    inputMultiline: { textAlignVertical: 'top', minHeight: 72 },

    forgot: { alignSelf: 'flex-end', marginBottom: 20 },
    forgotText: { color: C.primary, fontSize: typography.size.sm, fontWeight: '600' },

    // Choix du rôle
    roleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: C.border,
      padding: 16,
      marginBottom: 14,
    },
    roleCardIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: 'rgba(0,191,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    roleCardTitle: { color: C.text, fontSize: typography.size.md, fontWeight: '700' },
    roleCardSub: { color: C.muted, fontSize: typography.size.sm, marginTop: 2 },

    // Avatar
    avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    avatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImg: { width: 76, height: 76, borderRadius: 38 },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: C.background,
    },
    avatarHint: { color: C.muted, fontSize: typography.size.sm, marginLeft: 16 },

    // Types (boutique / métier)
    typeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    typeChipActive: { backgroundColor: 'rgba(0,191,255,0.12)', borderColor: C.primary },
    typeChipText: { color: C.muted, fontSize: typography.size.sm, fontWeight: '500' },
    typeChipTextActive: { color: C.primary, fontWeight: '700' },

    // Unité de prix
    unitRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    unitChip: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: C.surface,
      borderRadius: radius.sm + 4,
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: 10,
    },
    unitChipActive: { backgroundColor: 'rgba(0,191,255,0.12)', borderColor: C.primary },
    unitChipText: { color: C.muted, fontSize: typography.size.sm, fontWeight: '500' },
    unitChipTextActive: { color: C.primary, fontWeight: '700' },

    // Sélecteurs image / localisation
    pickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      borderRadius: radius.sm + 6,
      borderWidth: 1,
      borderColor: C.border,
      padding: 12,
      marginBottom: 14,
    },
    pickThumb: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: C.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      overflow: 'hidden',
    },
    pickThumbRound: { borderRadius: 24 },
    pickImg: { width: 48, height: 48 },
    pickLabel: { color: C.text, fontSize: typography.size.md, fontWeight: '600' },
    pickHint: { color: C.muted, fontSize: typography.size.sm, marginTop: 2 },

    mainBtn: {
      backgroundColor: C.primary,
      height: 56,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 5,
    },
    mainBtnText: { color: '#090A0F', fontSize: typography.size.md, fontWeight: 'bold', letterSpacing: 0.5 },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { color: C.muted, paddingHorizontal: 14, fontSize: typography.size.sm, fontWeight: '500' },

    socialRow: { flexDirection: 'row', gap: 14 },
    socialBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
      borderRadius: radius.pill,
      gap: 10,
    },
    googleBtn: { backgroundColor: '#EA4335' },
    facebookBtn: { backgroundColor: '#1877F2' },
    socialBtnText: { color: '#FFFFFF', fontSize: typography.size.sm + 1, fontWeight: 'bold' },
  });
}
