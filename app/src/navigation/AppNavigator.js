import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../components';
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

const TAB_BAR_STYLE = {
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
  paddingBottom: 8,
  paddingTop: 6,
  height: 62,
};

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

function PassengerTabNav() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            PassengerHome:  focused ? 'home'    : 'home-outline',
            Search:         focused ? 'search'  : 'search-outline',
            BookingHistory: focused ? 'receipt' : 'receipt-outline',
            PassengerProfile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="PassengerHome"    component={PassengerHomeScreen}  options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Search"           component={SearchScreen}          options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="BookingHistory"   component={BookingHistoryScreen}  options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="PassengerProfile" component={ProfileScreen}         options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function DriverTabNav() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.teal,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            DriverHome:    focused ? 'grid'       : 'grid-outline',
            PostRide:      focused ? 'add-circle' : 'add-circle-outline',
            MyRides:       focused ? 'car-sport'  : 'car-sport-outline',
            DriverProfile: focused ? 'person'     : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DriverHome"    component={DriverHomeScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="PostRide"      component={PostRideScreen}   options={{ tabBarLabel: 'Post Ride' }} />
      <Tab.Screen name="MyRides"       component={MyRidesScreen}    options={{ tabBarLabel: 'My Rides' }} />
      <Tab.Screen name="DriverProfile" component={ProfileScreen}    options={{ tabBarLabel: 'Profile' }} />
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
      <DriverStack.Screen name="MyVehicles"     component={MyVehiclesScreen} />
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
