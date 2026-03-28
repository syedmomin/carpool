import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../components';

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

const TAB_BAR_STYLE = {
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
  paddingBottom: 8,
  paddingTop: 6,
  height: 62,
};

function PassengerTabs() {
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
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
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
        tabBarActiveTintColor: COLORS.teal,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
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
        {/* Auth */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Tabs */}
        <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
        <Stack.Screen name="DriverTabs" component={DriverTabs} />

        {/* Passenger */}
        <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ animation: 'slide_from_right' }} />

        {/* Driver */}
        <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="VehicleSetup" component={VehicleSetupScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Earnings" component={EarningsScreen} options={{ animation: 'slide_from_right' }} />

        {/* Common */}
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="CnicVerify" component={CnicVerificationScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Support" component={SupportScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
