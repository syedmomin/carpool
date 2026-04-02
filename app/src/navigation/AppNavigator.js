import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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


// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
// const CIRCLE = 44;   // floating icon bubble diameter
// const HALO = 56;   // background halo (fakes bar cutout)
// const BAR_H = 56;   // height of the bar
// const LIFT = HALO / 2; // bar pushed down by this amount
const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 65;


export function CustomTabBar({ state, descriptors, navigation }) {
  const activeIndex = state.index;
  const tabWidth = width / state.routes.length;

  // Exact curve calculation based on the image
  const getPath = () => {
    const s = tabWidth * activeIndex; // start point
    const c = s + tabWidth / 2; // center point
    const r = 35; // curve radius

    return `
      M 0,0 
      L ${c - r - 10},0 
      C ${c - r},0 ${c - r + 5},${r} ${c},${r} 
      C ${c + r - 5},${r} ${c + r},0 ${c + r + 10},0 
      L ${width},0 
      L ${width},${TAB_BAR_HEIGHT} 
      L 0,${TAB_BAR_HEIGHT} 
      Z
    `;
  };

  return (
    <View style={styles.container}>
      {/* SVG Background with shadow for the cutout look */}
      <View style={styles.svgWrapper}>
        <Svg width={width} height={TAB_BAR_HEIGHT}>
          <Path
            fill="white"
            d={getPath()}
          />
        </Svg>
      </View>

      {/* Interactive Tabs */}
      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.tabBarLabel || route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={1}
            >
              <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
                <Ionicons
                  name={isFocused ? options._iconFocused : options._iconName}
                  size={24}
                  color={isFocused ? COLORS.primary : COLORS.gray}
                />
              </View>
              <Text style={[styles.label, isFocused && styles.activeLabel]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: width,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  svgWrapper: {
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  content: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 15 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.3s',
  },
  activeIconWrapper: {
    backgroundColor: 'white',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginTop: -10, // Pushes icon into the cutout
  },
  label: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  activeLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

const PASSENGER_TABS = [
  { name: 'PassengerHome', icon: 'home-outline', iconFocused: 'home', label: 'Home', component: PassengerHomeScreen },
  { name: 'Search', icon: 'search-outline', iconFocused: 'search', label: 'Search', component: SearchScreen },
  { name: 'BookingHistory', icon: 'receipt-outline', iconFocused: 'receipt', label: 'Bookings', component: BookingHistoryScreen },
  { name: 'PassengerProfile', icon: 'person-outline', iconFocused: 'person', label: 'Profile', component: ProfileScreen },
];

const DRIVER_TABS = [
  { name: 'DriverHome', icon: 'grid-outline', iconFocused: 'grid', label: 'Dashboard', component: DriverHomeScreen },
  { name: 'PostRide', icon: 'add-circle-outline', iconFocused: 'add-circle', label: 'Post Ride', component: PostRideScreen },
  { name: 'MyRides', icon: 'car-sport-outline', iconFocused: 'car-sport', label: 'My Rides', component: MyRidesScreen },
  { name: 'MyVehicles', icon: 'car-outline', iconFocused: 'car', label: 'Vehicles', component: MyVehiclesScreen },
  { name: 'DriverProfile', icon: 'person-outline', iconFocused: 'person', label: 'Profile', component: ProfileScreen },
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
      <PassengerStack.Screen name="Tabs" component={PassengerTabNav} options={{ animation: 'none' }} />
      <PassengerStack.Screen name="RideDetail" component={RideDetailScreen} />
      <PassengerStack.Screen name="BookingConfirm" component={BookingConfirmScreen} options={{ animation: 'slide_from_bottom' }} />
      <PassengerStack.Screen name="BookingHistory" component={BookingHistoryScreen} />
      <PassengerStack.Screen name="Schedule" component={ScheduleScreen} />
      <PassengerStack.Screen name="Notifications" component={NotificationsScreen} />
      <PassengerStack.Screen name="EditProfile" component={EditProfileScreen} />
      <PassengerStack.Screen name="CnicVerify" component={CnicVerificationScreen} />
      <PassengerStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <PassengerStack.Screen name="Support" component={SupportScreen} />
      <PassengerStack.Screen name="Terms" component={TermsScreen} />
      <PassengerStack.Screen name="Privacy" component={PrivacyScreen} />
      <PassengerStack.Screen name="About" component={AboutScreen} />
    </PassengerStack.Navigator>
  );
}

// ─── Driver App Stack ─────────────────────────────────────────────────────────
function DriverApp() {
  const DriverStack = createNativeStackNavigator();
  return (
    <DriverStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <DriverStack.Screen name="Tabs" component={DriverTabNav} options={{ animation: 'none' }} />
      <DriverStack.Screen name="VehicleSetup" component={VehicleSetupScreen} />
      <DriverStack.Screen name="Earnings" component={EarningsScreen} />
      <DriverStack.Screen name="Notifications" component={NotificationsScreen} />
      <DriverStack.Screen name="EditProfile" component={EditProfileScreen} />
      <DriverStack.Screen name="CnicVerify" component={CnicVerificationScreen} />
      <DriverStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <DriverStack.Screen name="Support" component={SupportScreen} />
      <DriverStack.Screen name="Terms" component={TermsScreen} />
      <DriverStack.Screen name="Privacy" component={PrivacyScreen} />
      <DriverStack.Screen name="About" component={AboutScreen} />
      {/* Passenger screens drivers might need */}
      <DriverStack.Screen name="RideDetail" component={RideDetailScreen} />
      <DriverStack.Screen name="BookingHistory" component={BookingHistoryScreen} />
    </DriverStack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function AppNavigator({ navigationRef }) {
  const { currentUser, userRole, isLoading } = useApp();

  // Waiting for: auth check + storage check
  if (isLoading) {
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
    if (currentUser) return userRole === 'driver' ? 'DriverApp' : 'PassengerApp';
    return 'Login';
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
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Protected app stacks */}
        {currentUser ? (
          userRole === 'driver' ? (
            <Stack.Screen name="DriverApp" component={DriverApp} options={{ animation: 'none' }} />
          ) : (
            <Stack.Screen name="PassengerApp" component={PassengerApp} options={{ animation: 'none' }} />
          )
        ) : (
          <>
            <Stack.Screen name="DriverApp" component={DriverApp} options={{ animation: 'none' }} />
            <Stack.Screen name="PassengerApp" component={PassengerApp} options={{ animation: 'none' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
