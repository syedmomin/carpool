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
import RideBookingsScreen from '../screens/driver/RideBookingsScreen';

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

const Stack = createNativeStackNavigator<any>();
const Tab = createBottomTabNavigator<any>();


// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
// const CIRCLE = 44;   // floating icon bubble diameter
// const HALO = 56;   // background halo (fakes bar cutout)
// const BAR_H = 56;   // height of the bar
// const LIFT = HALO / 2; // bar pushed down by this amount
const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 65;


export function CustomTabBar({ state, descriptors, navigation }: any) {
  const activeIndex = state.index;
  const tabWidth = width / state.routes.length;

  // Exact curve calculation based on the image
  const getPath = () => {
    const s = tabWidth * activeIndex;
    const c = s + tabWidth / 2;
    const r = 32;
    const h = 36; // slightly less deep

    return `
    M 0,0 
    L ${c - r - 22},0 
    C ${c - r},0 ${c - r + 18},${h} ${c},${h} 
    C ${c + r - 18},${h} ${c + r},0 ${c + r + 22},0 
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
          const options = descriptors[route.key].options as any;
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
              <View style={styles.iconContainer}>
                <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
                  <Ionicons name={(isFocused ? options._iconFocused : options._iconName) as any}
                    size={24}
                    color={isFocused ? COLORS.primary : COLORS.gray}
                  />
                </View>
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
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: TAB_BAR_HEIGHT + 30, // Extra space for floating icon
  },
  iconContainer: {
    height: 45, // Fixed container height to prevent shifting
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activeIconWrapper: {
    backgroundColor: '#fff',
    width: 38,
    height: 38,
    borderRadius: 21,
    marginBottom: 20, // Dropped lower (closer to label)
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  label: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '600',
    marginTop: 4,
  },
  activeLabel: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});

// ─── Tab Stacks ───────────────────────────────────────────────────────────────

const UserDashboardStack = createNativeStackNavigator<any>();
function DriverDashboardStack() {
  return (
    <UserDashboardStack.Navigator id="UserDashboard" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <UserDashboardStack.Screen name="DriverHome" component={DriverHomeScreen} />
      <UserDashboardStack.Screen name="PostRide" component={PostRideScreen} />
      <UserDashboardStack.Screen name="MyRides" component={MyRidesScreen} />
      <UserDashboardStack.Screen name="MyVehicles" component={MyVehiclesScreen} />
      <UserDashboardStack.Screen name="Notifications" component={NotificationsScreen} />
      <UserDashboardStack.Screen name="Earnings" component={EarningsScreen} />
    </UserDashboardStack.Navigator>
  );
}

const UserRidesStack = createNativeStackNavigator<any>();
function DriverRidesStack() {
  return (
    <UserRidesStack.Navigator id="DriverRides" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <UserRidesStack.Screen name="MyRides" component={MyRidesScreen} />
      <UserRidesStack.Screen name="PostRide" component={PostRideScreen} />
      <UserRidesStack.Screen name="RideBookings" component={RideBookingsScreen} />
      <UserRidesStack.Screen name="RideDetail" component={RideDetailScreen} />
    </UserRidesStack.Navigator>
  );
}

const UserVehiclesStack = createNativeStackNavigator<any>();
function DriverVehiclesStack() {
  return (
    <UserVehiclesStack.Navigator id="DriverVehicles" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <UserVehiclesStack.Screen name="MyVehicles" component={MyVehiclesScreen} />
      <UserVehiclesStack.Screen name="VehicleSetup" component={VehicleSetupScreen} />
    </UserVehiclesStack.Navigator>
  );
}

const UserProfileStack = createNativeStackNavigator<any>();
function CommonProfileStack() {
  return (
    <UserProfileStack.Navigator id="ProfileStack" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <UserProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <UserProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <UserProfileStack.Screen name="CnicVerify" component={CnicVerificationScreen} />
      <UserProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <UserProfileStack.Screen name="Support" component={SupportScreen} />
      <UserProfileStack.Screen name="Terms" component={TermsScreen} />
      <UserProfileStack.Screen name="Privacy" component={PrivacyScreen} />
      <UserProfileStack.Screen name="About" component={AboutScreen} />
    </UserProfileStack.Navigator>
  );
}

const PassengerActivityStack = createNativeStackNavigator<any>();
function PassengerRidesStack() {
  return (
    <PassengerActivityStack.Navigator id="PassengerActivity" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <PassengerActivityStack.Screen name="PassengerHomeMain" component={PassengerHomeScreen} />
      <PassengerActivityStack.Screen name="Notifications" component={NotificationsScreen} />
      <PassengerActivityStack.Screen name="Search" component={SearchScreen} />
      <PassengerActivityStack.Screen name="RideDetail" component={RideDetailScreen} />
      <PassengerActivityStack.Screen name="BookingConfirm" component={BookingConfirmScreen} options={{ animation: 'slide_from_bottom' }} />
      <PassengerActivityStack.Screen name="Schedule" component={ScheduleScreen} />
    </PassengerActivityStack.Navigator>
  );
}

const PassengerSearchActivityStack = createNativeStackNavigator<any>();
function PassengerSearchStack() {
  return (
    <PassengerSearchActivityStack.Navigator id="PassengerSearch" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <PassengerSearchActivityStack.Screen name="SearchMain" component={SearchScreen} />
      <PassengerSearchActivityStack.Screen name="Notifications" component={NotificationsScreen} />
      <PassengerSearchActivityStack.Screen name="RideDetail" component={RideDetailScreen} />
      <PassengerSearchActivityStack.Screen name="BookingConfirm" component={BookingConfirmScreen} options={{ animation: 'slide_from_bottom' }} />
    </PassengerSearchActivityStack.Navigator>
  );
}

const PASSENGER_TABS = [
  { name: 'PassengerHomeTab', icon: 'home-outline', iconFocused: 'home', label: 'Home', component: PassengerRidesStack },
  { name: 'SearchTab', icon: 'search-outline', iconFocused: 'search', label: 'Search', component: PassengerSearchStack },
  { name: 'BookingHistoryTab', icon: 'receipt-outline', iconFocused: 'receipt', label: 'Bookings', component: BookingHistoryScreen },
  { name: 'PassengerProfileTab', icon: 'person-outline', iconFocused: 'person', label: 'Profile', component: CommonProfileStack },
];

const DRIVER_TABS = [
  { name: 'DriverHomeTab', icon: 'grid-outline', iconFocused: 'grid', label: 'Dashboard', component: DriverDashboardStack },
  { name: 'PostRideTab', icon: 'add-circle-outline', iconFocused: 'add-circle', label: 'Post Ride', component: PostRideScreen },
  { name: 'MyRidesTab', icon: 'car-sport-outline', iconFocused: 'car-sport', label: 'My Rides', component: DriverRidesStack },
  { name: 'MyVehiclesTab', icon: 'car-outline', iconFocused: 'car', label: 'Vehicles', component: DriverVehiclesStack },
  { name: 'DriverProfileTab', icon: 'person-outline', iconFocused: 'person', label: 'Profile', component: CommonProfileStack },
];

function PassengerTabNav() {
  return (
    <Tab.Navigator
      id="PassengerTab"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: COLORS.bg } }}
    >
      {PASSENGER_TABS.map(t => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{ tabBarLabel: t.label, _iconName: t.icon, _iconFocused: t.iconFocused } as any}
        />
      ))}
    </Tab.Navigator>
  );
}

function DriverTabNav() {
  return (
    <Tab.Navigator
      id="DriverTab"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: COLORS.bg } }}
    >
      {DRIVER_TABS.map(t => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{ tabBarLabel: t.label, _iconName: t.icon, _iconFocused: t.iconFocused } as any}
        />
      ))}
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function AppNavigator({ navigationRef }: any) {
  const { currentUser, userRole, isLoading } = useApp();
  const [splashVisible, setSplashVisible] = useState(true);

  if (isLoading || splashVisible) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d1b4b' }}>
        <SplashScreen navigation={null} onDone={() => setSplashVisible(false)} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        id="RootStack"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {/* Protected app stacks */}
        {currentUser ? (
          userRole === 'driver' ? (
            <Stack.Screen name="DriverApp" component={DriverTabNav} options={{ animation: 'none' }} />
          ) : (
            <Stack.Screen name="PassengerApp" component={PassengerTabNav} options={{ animation: 'none' }} />
          )
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
