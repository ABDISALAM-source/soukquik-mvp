import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useSession } from '../store/session';
import { theme } from '../theme/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(activeName: IoniconName, inactiveName: IoniconName): BottomTabNavigationOptions['tabBarIcon'] {
  return ({ focused, color, size }) => (
    <Ionicons name={focused ? activeName : inactiveName} size={size} color={color} />
  );
}

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ClientTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.primary }}>
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
        name="Cart"
        component={CartScreen}
        options={{ title: 'Panier', tabBarIcon: tabIcon('cart', 'cart-outline') }}
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
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.primary }}>
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
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.primary }}>
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

function MainStack() {
  const role = useSession((s) => s.user?.role);

  const RoleTabs = role === 'vendor' ? VendorTabs : role === 'provider' ? ProviderTabs : ClientTabs;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Tabs" component={RoleTabs} />
      <Stack.Screen name="Shop" component={ShopScreen} />
      <Stack.Screen name="Service" component={ServiceScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const user = useSession((s) => s.user);

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthScreen />}
    </NavigationContainer>
  );
}
