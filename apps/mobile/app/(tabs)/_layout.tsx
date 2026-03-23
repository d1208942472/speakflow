import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text.primary,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: 'rgba(108, 99, 255, 0.2)',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Learn',
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="📚" color={color} size={size} />
          ),
          headerTitle: 'SpeakFlow',
          headerTitleStyle: {
            color: Colors.text.primary,
            fontSize: 20,
            fontWeight: '800',
          },
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: 'Leagues',
          tabBarLabel: 'Leagues',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🏆" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: 'Analyze',
          tabBarLabel: 'Analyze',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🔬" color={color} size={size} />
          ),
          headerTitle: 'AI Slide Analyzer',
          headerTitleStyle: {
            color: Colors.text.primary,
            fontSize: 18,
            fontWeight: '800',
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="👤" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple emoji tab icon wrapper
function TabIcon({
  emoji,
  size,
}: {
  emoji: string;
  color: string;
  size: number;
}): React.JSX.Element {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: size - 4 }}>{emoji}</Text>;
}
