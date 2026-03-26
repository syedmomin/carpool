import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../components';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Passenger Screens
import PassengerHomeScreen from '../screens/passenger/HomeScreen';
import SearchScreen from '../screens/passenger/SearchScreen';
import RideDetailScreen from '../screens/passenger/RideDetailScreen';
import BookingConfirmScreen from '../screens/passenger/BookingConfirmScreen';
import BookingHistoryScreen from '../screens/passenger/BookingHistoryScreen';

// Driver Screens
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import PostRideScreen from '../screens/driver/PostRideScreen';
import MyRidesScreen from '../screens/driver/MyRidesScreen';
import VehicleSetupScreen from '../screens/driver/VehicleSetupScreen';

// Common Screens
import ProfileScreen from '../screens/common/ProfileScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function PassengerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            PassengerHome: focused ? 'home' : 'home-outline',
            Search: focused ? 'search' : 'search-outline',
            BookingHistory: focused ? 'receipt' : 'receipt-outline',
            PassengerProfile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="PassengerHome" component={PassengerHomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Dhundho' }} />
      <Tab.Screen name="BookingHistory" component={BookingHistoryScreen} options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="PassengerProfile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#00897b',
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            DriverHome: focused ? 'grid' : 'grid-outline',
            PostRide: focused ? 'add-circle' : 'add-circle-outline',
            MyRides: focused ? 'car-sport' : 'car-sport-outline',
            DriverProfile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DriverHome" component={DriverHomeScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="PostRide" component={PostRideScreen} options={{ tabBarLabel: 'Post Ride' }} />
      <Tab.Screen name="MyRides" component={MyRidesScreen} options={{ tabBarLabel: 'My Rides' }} />
      <Tab.Screen name="DriverProfile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
        <Stack.Screen name="DriverTabs" component={DriverTabs} />

        {/* Passenger Screens */}
        <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} options={{ animation: 'slide_from_bottom' }} />

        {/* Driver Screens */}
        <Stack.Screen name="VehicleSetup" component={VehicleSetupScreen} options={{ animation: 'slide_from_right' }} />

        {/* Common Screens */}
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
