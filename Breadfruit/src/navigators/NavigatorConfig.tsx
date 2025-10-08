import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// This function handles which icon is shown for each tab
const tabBarIconHandler = (routeName: string, color: string, size: number) => {
  let iconName: string = 'circle';
  if (routeName === 'Dashboard') iconName = 'dashboard';
  else if (routeName === 'Map') iconName = 'map';
  else if (routeName === 'Trees') iconName = 'forest';
  else if (routeName === 'Accounts') iconName = 'people';
  else if (routeName === 'Profile') iconName = 'person';
  return <MaterialIcons name={iconName} size={size} color={color} />;
};

// These are the shared screen options for all tab navigators
export const tabScreenOptions = ({ route }: { route: RouteProp<any> }): BottomTabNavigationOptions => ({
  headerShown: false,
  tabBarActiveTintColor: '#2ecc71',
  tabBarIcon: ({ color, size }) => tabBarIconHandler(route.name, color, size),
});