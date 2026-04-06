/**
 * @fileoverview 应用导航
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SearchScreen, GalleryScreen, PhotoDetailScreen } from '@/screens';

export type RootStackParamList = {
  Main: undefined;
  PhotoDetail: { photoId: number };
};

export type MainTabParamList = {
  Search: undefined;
  Gallery: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: '搜索',
        }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          title: '相册',
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator(): React.ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PhotoDetail"
          component={PhotoDetailScreen}
          options={{
            title: '照片详情',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
