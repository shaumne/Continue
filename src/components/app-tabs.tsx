import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { Brand, Colors } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

function icon(name: IoniconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function AppTabs() {
  const { t } = useTranslation();
  const c = Colors.dark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: {
          backgroundColor: c.background,
          borderTopColor: c.backgroundElement,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: icon('home') }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: t('tabs.library'), tabBarIcon: icon('library') }}
      />
      <Tabs.Screen
        name="quests"
        options={{ title: t('tabs.quests'), tabBarIcon: icon('trophy') }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: t('tabs.stats'), tabBarIcon: icon('stats-chart') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: icon('person') }}
      />
      {/* Add Content is reached via a button, not shown as a tab. */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      {/* Detail is a pushed full-page route, not a tab. */}
      <Tabs.Screen name="content/[id]" options={{ href: null }} />
      {/* Achievements is reached via a link in Profile, not a tab. */}
      <Tabs.Screen name="achievements" options={{ href: null }} />
    </Tabs>
  );
}
