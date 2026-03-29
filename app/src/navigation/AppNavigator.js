import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../components';
import { useApp } from '../context/AppContext';

// Auth
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Passenger
import PassengerHomeScreen from '../screens/passenger/HomeScreen';
import SearchScreen from '../screens/passenger/SearchScreen';
import RideDetailScreen from '../screens/passenger/RideDetailScreen';
import BookingConfirmScreen from '../screens/passenger/BookingConfirmScreen';
import BookingHistoryScreen from '../screens/passenger/BookingHistoryScreen';
import ScheduleScreen from '../screens/passenger/ScheduleScreen';

// Driver
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import PostRideScreen from '../screens/driver/PostRideScreen';
import MyRidesScreen from '../screens/driver/MyRidesScreen';
import MyVehiclesScreen from '../screens/driver/MyVehiclesScreen';
import VehicleSetupScreen from '../screens/driver/VehicleSetupScreen';
import EarningsScreen from '../screens/driver/EarningsScreen';

// Common
import ProfileScreen from '../screens/common/ProfileScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import CnicVerificationScreen from '../screens/common/CnicVerificationScreen';
import ChangePasswordScreen from '../screens/common/ChangePasswordScreen';
import SupportScreen from '../screens/common/SupportScreen';
import TermsScreen from '../screens/common/TermsScreen';
import PrivacyScreen from '../screens/common/PrivacyScreen';
import AboutScreen from '../screens/common/AboutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const SPLASH_SEEN_KEY = '@safarishare_splash_seen';

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
// Floating pill bar — active item has a gradient pill, inactive items are flat
function CustomTabBar({ state, descriptors, navigation, tintColor }) {
  return (
    <View style={[tabStyles.outerWrap, { paddingBottom: Platform.OS === 'ios' ? 20 : 6 }]}>
      <View style={tabStyles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused  = state.index === index;
          const label    = options.tabBarLabel || route.name;
          const iconName = focused ? options._iconFocused : options._iconName;
          const press    = () => navigation.navigate(route.name);

          if (focused) {
            return (
              <View key={route.key} style={tabStyles.tab}>
                <LinearGradient
                  colors={[tintColor, tintColor + 'cc']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={tabStyles.activePill}
                >
                  <Ionicons name={iconName} size={18} color="#fff" />
                  <Text style={tabStyles.activeLabel} numberOfLines={1}>{label}</Text>
                </LinearGradient>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={tabStyles.tab}
              onPress={press}
              activeOpacity={0.7}
            >
              <Ionicons name={iconName} size={22} color={COLORS.textSecondary} />
              <Text style={tabStyles.inactiveLabel} numberOfLines={1}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  outerWrap: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  bar: {
    flexDirection:   'row',
    backgroundColor: '#fff',
    borderRadius:    32,
    height:          62,
    alignItems:      'center',
    paddingHorizontal: 6,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.10,
    shadowRadius:    16,
    elevation:       14,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    height:         62,
  },
  activePill: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingHorizontal: 14,
    paddingVertical:   9,
    borderRadius:   22,
    maxWidth:       120,
  },
  activeLabel: {
    fontSize:    12,
    fontWeight:  '700',
    color:       '#fff',
    letterSpacing: 0.2,
  },
  inactiveLabel: {
    fontSize:    10,
    color:       COLORS.textSecondary,
    marginTop:   3,
    letterSpacing: 0.2,
  },
});

// ─── Shared stack screens (added inside both tab navigators) ──────────────────
function SharedStack(Stack, TabNavigator) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ animation: 'none' }} />
      <Stack.Screen name="RideDetail"      component={RideDetailScreen} />
      <Stack.Screen name="BookingConfirm"  component={BookingConfirmScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="BookingHistory"  component={BookingHistoryScreen} />
      <Stack.Screen name="Schedule"        component={ScheduleScreen} />
      <Stack.Screen name="MyVehicles"      component={MyVehiclesScreen} />
      <Stack.Screen name="VehicleSetup"    component={VehicleSetupScreen} />
      <Stack.Screen name="Earnings"        component={EarningsScreen} />
      <Stack.Screen name="Notifications"   component={NotificationsScreen} />
      <Stack.Screen name="EditProfile"     component={EditProfileScreen} />
      <Stack.Screen name="CnicVerify"      component={CnicVerificationScreen} />
      <Stack.Screen name="ChangePassword"  component={ChangePasswordScreen} />
      <Stack.Screen name="Support"         component={SupportScreen} />
      <Stack.Screen name="Terms"           component={TermsScreen} />
      <Stack.Screen name="Privacy"         component={PrivacyScreen} />
      <Stack.Screen name="About"           component={AboutScreen} />
    </Stack.Navigator>
  );
}

const PASSENGER_TABS = [
  { name: 'PassengerHome',    icon: 'home-outline',    iconFocused: 'home',       label: 'Home',     component: PassengerHomeScreen },
  { name: 'Search',           icon: 'search-outline',  iconFocused: 'search',     label: 'Search',   component: SearchScreen },
  { name: 'BookingHistory',   icon: 'receipt-outline', iconFocused: 'receipt',    label: 'Bookings', component: BookingHistoryScreen },
  { name: 'PassengerProfile', icon: 'person-outline',  iconFocused: 'person',     label: 'Profile',  component: ProfileScreen },
];

const DRIVER_TABS = [
  { name: 'DriverHome',    icon: 'grid-outline',          iconFocused: 'grid',          label: 'Dashboard', component: DriverHomeScreen },
  { name: 'PostRide',      icon: 'add-circle-outline',    iconFocused: 'add-circle',    label: 'Post Ride', component: PostRideScreen },
  { name: 'MyRides',       icon: 'car-sport-outline',     iconFocused: 'car-sport',     label: 'My Rides',  component: MyRidesScreen },
  { name: 'MyVehicles',    icon: 'car-outline',           iconFocused: 'car',           label: 'Vehicles',  component: MyVehiclesScreen },
  { name: 'DriverProfile', icon: 'person-outline',        iconFocused: 'person',        label: 'Profile',   component: ProfileScreen },
];

function PassengerTabNav() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} tintColor={COLORS.primary} />}
      screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: COLORS.bg } }}
    >
      {PASSENGER_TABS.map(t => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{ tabBarLabel: t.label, _iconName: t.icon, _iconFocused: t.iconFocused }}
        />
      ))}
    </Tab.Navigator>
  );
}

function DriverTabNav() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} tintColor={COLORS.teal} />}
      screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: COLORS.bg } }}
    >
      {DRIVER_TABS.map(t => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{ tabBarLabel: t.label, _iconName: t.icon, _iconFocused: t.iconFocused }}
        />
      ))}
    </Tab.Navigator>
  );
}

// ─── Passenger App Stack ──────────────────────────────────────────────────────
function PassengerApp() {
  const PassengerStack = createNativeStackNavigator();
  return (
    <PassengerStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <PassengerStack.Screen name="Tabs"           component={PassengerTabNav}      options={{ animation: 'none' }} />
      <PassengerStack.Screen name="RideDetail"     component={RideDetailScreen} />
      <PassengerStack.Screen name="BookingConfirm" component={BookingConfirmScreen} options={{ animation: 'slide_from_bottom' }} />
      <PassengerStack.Screen name="BookingHistory" component={BookingHistoryScreen} />
      <PassengerStack.Screen name="Schedule"       component={ScheduleScreen} />
      <PassengerStack.Screen name="Notifications"  component={NotificationsScreen} />
      <PassengerStack.Screen name="EditProfile"    component={EditProfileScreen} />
      <PassengerStack.Screen name="CnicVerify"     component={CnicVerificationScreen} />
      <PassengerStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <PassengerStack.Screen name="Support"        component={SupportScreen} />
      <PassengerStack.Screen name="Terms"          component={TermsScreen} />
      <PassengerStack.Screen name="Privacy"        component={PrivacyScreen} />
      <PassengerStack.Screen name="About"          component={AboutScreen} />
    </PassengerStack.Navigator>
  );
}

// ─── Driver App Stack ─────────────────────────────────────────────────────────
function DriverApp() {
  const DriverStack = createNativeStackNavigator();
  return (
    <DriverStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <DriverStack.Screen name="Tabs"           component={DriverTabNav}          options={{ animation: 'none' }} />
      <DriverStack.Screen name="VehicleSetup"   component={VehicleSetupScreen} />
      <DriverStack.Screen name="Earnings"       component={EarningsScreen} />
      <DriverStack.Screen name="Notifications"  component={NotificationsScreen} />
      <DriverStack.Screen name="EditProfile"    component={EditProfileScreen} />
      <DriverStack.Screen name="CnicVerify"     component={CnicVerificationScreen} />
      <DriverStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <DriverStack.Screen name="Support"        component={SupportScreen} />
      <DriverStack.Screen name="Terms"          component={TermsScreen} />
      <DriverStack.Screen name="Privacy"        component={PrivacyScreen} />
      <DriverStack.Screen name="About"          component={AboutScreen} />
      {/* Passenger screens drivers might need */}
      <DriverStack.Screen name="RideDetail"     component={RideDetailScreen} />
      <DriverStack.Screen name="BookingHistory" component={BookingHistoryScreen} />
    </DriverStack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { currentUser, userRole, isLoading } = useApp();
  const [splashSeen, setSplashSeen] = useState(null); // null = not checked yet

  useEffect(() => {
    AsyncStorage.getItem(SPLASH_SEEN_KEY).then(val => setSplashSeen(!!val));
  }, []);

  // Waiting for both: auth check + splash-seen check
  if (isLoading || splashSeen === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a73e8' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Decide initial route:
  // - First-ever open (no splash seen): show Splash → Onboarding/Tabs
  // - Already seen splash + logged in: go directly to tabs
  // - Already seen splash + not logged in: go to Onboarding
  const getInitialRoute = () => {
    if (!splashSeen) return 'Splash';
    if (currentUser) return userRole === 'driver' ? 'DriverApp' : 'PassengerApp';
    return 'Onboarding';
  };

  const handleSplashDone = () => {
    AsyncStorage.setItem(SPLASH_SEEN_KEY, '1');
    setSplashSeen(true);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {/* Auth (no guard needed) */}
        <Stack.Screen name="Splash">
          {props => <SplashScreen {...props} onDone={handleSplashDone} />}
        </Stack.Screen>
        <Stack.Screen name="Onboarding"  component={OnboardingScreen} />
        <Stack.Screen name="Login"       component={LoginScreen} />
        <Stack.Screen name="Register"    component={RegisterScreen} />

        {/* Protected app stacks */}
        {currentUser ? (
          userRole === 'driver' ? (
            <Stack.Screen name="DriverApp"    component={DriverApp}    options={{ animation: 'none' }} />
          ) : (
            <Stack.Screen name="PassengerApp" component={PassengerApp} options={{ animation: 'none' }} />
          )
        ) : (
          <>
            <Stack.Screen name="DriverApp"    component={DriverApp}    options={{ animation: 'none' }} />
            <Stack.Screen name="PassengerApp" component={PassengerApp} options={{ animation: 'none' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
