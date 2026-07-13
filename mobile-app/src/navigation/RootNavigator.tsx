import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useSession } from '../store/session';
import { useTheme } from '../theme/ThemeContext';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { ServiceScreen } from '../screens/ServiceScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VendorDashboardScreen } from '../screens/VendorDashboardScreen';
import { ProviderDashboardScreen } from '../screens/ProviderDashboardScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { CreateShopScreen } from '../screens/CreateShopScreen';
import { ProductFormScreen } from '../screens/ProductFormScreen';
import { ServiceFormScreen } from '../screens/ServiceFormScreen';
import { AvailabilityScreen } from '../screens/AvailabilityScreen';
import { MapScreen } from '../screens/MapScreen';

type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(activeName: IoniconName, inactiveName: IoniconName): BottomTabNavigationOptions['tabBarIcon'] {
  return ({ focused, color, size }) => (
    <Ionicons name={focused ? activeName : inactiveName} size={size} color={color} />
  );
}

// Bouton de tab surélevé (façon FAB), pour l'onglet Panier au centre de la
// barre — même traitement visuel que le bouton central de la maquette de
// référence (qui y met "Carte" ; on a gardé Panier au centre pour ne pas
// perturber la navigation déjà en place, "Carte" est un onglet normal).
function ElevatedTabButton(props: BottomTabBarButtonProps) {
  const { colors, shadow } = useTheme();
  const focused = !!props.accessibilityState?.selected;
  return (
    <Pressable
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      accessibilityState={props.accessibilityState}
      style={[elevatedStyles.button, { backgroundColor: colors.primary }, shadow.lg]}
    >
      <Ionicons name={focused ? 'cart' : 'cart-outline'} size={26} color="#fff" />
    </Pressable>
  );
}

const elevatedStyles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: -20,
  },
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ClientTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Accueil', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Recherche', tabBarIcon: tabIcon('search', 'search-outline') }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Carte', tabBarIcon: tabIcon('map', 'map-outline') }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Panier', tabBarButton: ElevatedTabButton }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favoris', tabBarIcon: tabIcon('heart', 'heart-outline') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tab.Navigator>
  );
}

function VendorTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="VendorDashboard"
        component={VendorDashboardScreen}
        options={{ title: 'Dashboard', tabBarIcon: tabIcon('grid', 'grid-outline') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="ProviderDashboard"
        component={ProviderDashboardScreen}
        options={{ title: 'Dashboard', tabBarIcon: tabIcon('grid', 'grid-outline') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Modération', tabBarIcon: tabIcon('shield-checkmark', 'shield-checkmark-outline') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  const role = useSession((s) => s.user?.role);

  const RoleTabs =
    role === 'vendor' ? VendorTabs : role === 'provider' ? ProviderTabs : role === 'admin' ? AdminTabs : ClientTabs;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Tabs" component={RoleTabs} />
      <Stack.Screen name="Shop" component={ShopScreen} />
      <Stack.Screen name="Service" component={ServiceScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="CreateShop" component={CreateShopScreen} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} />
      <Stack.Screen name="ServiceForm" component={ServiceFormScreen} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const user = useSession((s) => s.user);
  const justRegistered = useSession((s) => s.justRegistered);

  return (
    <NavigationContainer>
      {!user ? <AuthScreen /> : justRegistered ? <OnboardingScreen /> : <MainStack />}
    </NavigationContainer>
  );
}
