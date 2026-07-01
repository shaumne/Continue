import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { ContentTypeColors, Spacing } from '@/constants/theme';
import type { ContentType } from '@/types/models';

const ICONS: Record<ContentType, keyof typeof Ionicons.glyphMap> = {
  game: 'game-controller',
  movie: 'film',
  tv: 'tv',
  book: 'book',
  anime: 'sparkles',
  podcast: 'mic',
  youtube: 'logo-youtube',
  course: 'school',
};

export function TypeBadge({ type }: { type: ContentType }) {
  const { t } = useTranslation();
  const color = ContentTypeColors[type];
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Ionicons name={ICONS[type]} size={12} color={color} />
      <Text style={[styles.label, { color }]}>{t(`contentType.${type}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 11, fontWeight: '700' },
});
