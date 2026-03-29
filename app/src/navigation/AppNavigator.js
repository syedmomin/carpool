import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../components';
import { useApp } from '../context/AppContext';

// Auth
import SplashScreen from '../screens/auth/SplashScreen';
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

const SPLASH_SEEN_KEY = '@chalparo_splash_seen';

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
const CIRCLE  = 44;   // floating icon bubble diameter
const HALO    = 56;   // background halo (fakes bar cutout)
const BAR_H   = 56;   // height of the bar
const LIFT    = HALO / 2; // bar pushed down by this amount

function CustomTabBar({ state, descriptors, navigation }) {
  const pbottom = Platform.OS === 'ios' ? 20 : 8;
  return (
    <View style={[tabStyles.wrapper, { paddingBottom: pbottom }]}>
      {/* ── Dark bar (renders below the floating layer) ── */}
      <View style={tabStyles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label   = options.tabBarLabel || route.name;
          return (
            <TouchableOpacity
              key={route.key}
              style={tabStyles.slot}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.75}
            >
              <View style={tabStyles.iconSpace}>
                {!focused && (
                  <Ionicons name={options._iconName} size={20} color="#9ca3af" />
                )}
              </View>
              <Text style={[tabStyles.lbl, focused && tabStyles.lblActive]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Floating bubbles overlay (pointer-events none — taps fall through to bar) ── */}
      <View style={tabStyles.floatLayer} pointerEvents="none">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          return (
            <View key={route.key} style={tabStyles.floatItem}>
              {focused && (
                /* Halo (matches app bg) hides bar behind bubble → fake cutout */
                <View style={tabStyles.halo}>
                  <View style={tabStyles.bubble}>
                    <Ionicons name={options._iconFocused} size={24} color="#fff" />
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  bar: {
    flexDirection:         'row',
    height:                BAR_H,
    backgroundColor:       '#fff',
    marginTop:             LIFT,
    borderTopLeftRadius:   20,
    borderTopRightRadius:  20,
    shadowColor:           '#000',
    shadowOffset:          { width: 0, height: -3 },
    shadowOpacity:         0.07,
    shadowRadius:          10,
    elevation:             14,
  },
  slot: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 6,
    gap:             2,
  },
  iconSpace: {
    height:         22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  lbl: {
    fontSize:      10,
    color:         '#9ca3af',
    fontWeight:    '500',
    letterSpacing: 0.1,
  },
  lblActive: {
    color:      COLORS.primary,
    fontWeight: '700',
  },
  floatLayer: {
    position:      'absolute',
    top:           0,
    left:          0,
    right:         0,
    flexDirection: 'row',
    height:        HALO,
  },
  floatItem: {
    flex:       1,
    alignItems: 'center',
  },
  halo: {
    width:           HALO,
    height:          HALO,
    borderRadius:    HALO / 2,
    backgroundColor: COLORS.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  bubble: {
    width:           CIRCLE,
    height:          CIRCLE,
    borderRadius:    CIRCLE / 2,
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.35,
    shadowRadius:    8,
    elevation:       10,
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
      tabBar={(props) => <CustomTabBar {...props} />}
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
      tabBar={(props) => <CustomTabBar {...props} />}
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
export default function AppNavigator({ navigationRef }) {
  const { currentUser, userRole, isLoading } = useApp();
  const [splashSeen, setSplashSeen] = useState(null); // null = not checked yet

  useEffect(() => {
    AsyncStorage.getItem(SPLASH_SEEN_KEY).then(val => setSplashSeen(!!val));
  }, []);

  // Waiting for: auth check + storage check
  if (isLoading || splashSeen === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1b4b' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Route logic:
  // 1. Never seen splash → show Splash
  // 2. Logged in → go to app tabs
  // 3. Otherwise → Login
  const getInitialRoute = () => {
    if (!splashSeen) return 'Splash';
    if (currentUser) return userRole === 'driver' ? 'DriverApp' : 'PassengerApp';
    return 'Login';
  };

  const handleSplashDone = () => {
    AsyncStorage.setItem(SPLASH_SEEN_KEY, '1');
    setSplashSeen(true);
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {/* Auth */}
        <Stack.Screen name="Splash">
          {props => <SplashScreen {...props} onDone={handleSplashDone} />}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} />
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
