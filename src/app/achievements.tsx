import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Colors, Spacing } from '@/constants/theme';
import { useAchievements, type AchievementVM } from '@/hooks/use-achievements';
import { useSession } from '@/store/session';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** The seeded `achievements.icon` values aren't Ionicons names — map them here. */
const ICON_MAP: Record<string, IoniconName> = {
  sprout: 'leaf',
  'flag-checkered': 'flag',
  running: 'walk',
  fire: 'flame',
};

function iconFor(icon: string | null): IoniconName {
  return (icon && ICON_MAP[icon]) || 'trophy';
}

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const userId = useSession((s) => s.session?.user.id);
  const { items, unlockedCount, total, isLoading } = useAchievements(userId);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('detail.back')}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>{t('achievements.title')}</Text>
        {!isLoading ? (
          <Text style={[styles.summary, { color: c.textSecondary }]}>
            {t('achievements.summary', { unlocked: unlockedCount, total })}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <AchievementCard item={item} c={c} />}
        />
      )}
    </SafeAreaView>
  );
}

function AchievementCard({ item, c }: { item: AchievementVM; c: (typeof Colors)['dark'] }) {
  const { t } = useTranslation();
  const pct = item.target > 0 ? Math.min(item.progress / item.target, 1) : 0;

  const a11yLabel = item.unlocked
    ? `${item.title}. ${item.description ?? ''}. ${t('achievements.unlocked')}`
    : `${item.title}. ${item.description ?? ''}. ${t('achievements.progressA11y', {
        progress: item.progress,
        target: item.target,
      })}`;

  return (
    <View
      style={[styles.card, { backgroundColor: c.backgroundElement }, !item.unlocked && styles.cardLocked]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={a11yLabel}>
      <View
        style={[
          styles.medallion,
          { backgroundColor: item.unlocked ? Brand.xp : c.backgroundSelected },
        ]}>
        <Ionicons
          name={iconFor(item.icon)}
          size={26}
          color={item.unlocked ? '#fff' : c.textSecondary}
        />
        {item.unlocked ? (
          <View style={[styles.check, { backgroundColor: Brand.success }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        ) : null}
      </View>

      <Text
        style={[styles.cardTitle, { color: item.unlocked ? c.text : c.textSecondary }]}
        numberOfLines={1}>
        {item.title}
      </Text>
      {item.description ? (
        <Text style={[styles.cardDesc, { color: c.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {!item.unlocked ? (
        <>
          <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
            <View
              style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: Brand.primary }]}
            />
          </View>
          <Text style={[styles.progressText, { color: c.textSecondary }]}>
            {t('achievements.progressA11y', { progress: item.progress, target: item.target })}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  header: { paddingHorizontal: Spacing.four, marginTop: Spacing.two, gap: Spacing.half },
  title: { fontSize: 26, fontWeight: '700' },
  summary: { fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { padding: Spacing.four, gap: Spacing.three },
  row: { gap: Spacing.three },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardLocked: { opacity: 0.85 },
  medallion: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  check: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardDesc: { fontSize: 12, lineHeight: 16 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: Spacing.one },
  fill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 11, marginTop: 2 },
});
