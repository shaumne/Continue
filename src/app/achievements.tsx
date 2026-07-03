import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
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

type FilterTab = 'all' | 'locked' | 'unlocked';

const FILTER_TABS: FilterTab[] = ['all', 'locked', 'unlocked'];

const MEDALLION_SIZE = 48;

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const userId = useSession((s) => s.session?.user.id);
  const { items, unlockedCount, total, isLoading } = useAchievements(userId);

  const [filter, setFilter] = useState<FilterTab>('all');

  const filteredItems = items.filter((item) => {
    if (filter === 'locked') return !item.unlocked;
    if (filter === 'unlocked') return item.unlocked;
    return true;
  });

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

      <View
        style={[styles.segmented, { backgroundColor: c.backgroundElement }]}
        accessibilityRole="tablist">
        {FILTER_TABS.map((tab) => {
          const active = tab === filter;
          return (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.segment, active && { backgroundColor: Brand.primary }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(`achievements.${tab}`)}>
              <Text
                style={[styles.segmentLabel, { color: active ? '#fff' : c.textSecondary }]}>
                {t(`achievements.${tab}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: c.textSecondary }]} accessibilityRole="text">
              {t('common.empty')}
            </Text>
          }
          renderItem={({ item }) => <AchievementRow item={item} c={c} />}
        />
      )}
    </SafeAreaView>
  );
}

function AchievementRow({ item, c }: { item: AchievementVM; c: (typeof Colors)['dark'] }) {
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
      style={[styles.card, { backgroundColor: c.backgroundElement }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={a11yLabel}>
      <View style={styles.cardTop}>
        <View
          style={[
            styles.medallion,
            { backgroundColor: item.unlocked ? Brand.xp : c.backgroundSelected },
          ]}>
          <Ionicons
            name={iconFor(item.icon)}
            size={24}
            color={item.unlocked ? '#fff' : c.textSecondary}
          />
        </View>

        <View style={styles.textCol}>
          <Text
            style={[styles.cardTitle, { color: item.unlocked ? c.text : c.textSecondary }]}
            numberOfLines={1}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={[styles.cardDesc, { color: c.textSecondary }]} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>

        {!item.unlocked ? (
          <View style={styles.rightCol}>
            <Ionicons
              name="lock-closed"
              size={14}
              color={c.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.progressText, { color: c.textSecondary }]}>
              {item.progress} / {item.target}
            </Text>
          </View>
        ) : null}
      </View>

      {!item.unlocked ? (
        <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
          <View
            style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: Brand.primary }]}
          />
        </View>
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
  empty: { fontSize: 14, textAlign: 'center', paddingTop: Spacing.five },

  segmented: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: Spacing.half,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    alignItems: 'center',
  },
  segmentLabel: { fontSize: 13, fontWeight: '700' },

  list: { padding: Spacing.four, gap: Spacing.three },
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  medallion: {
    width: MEDALLION_SIZE,
    height: MEDALLION_SIZE,
    borderRadius: MEDALLION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: Spacing.half },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 12 },
  rightCol: { alignItems: 'flex-end', gap: Spacing.half },
  progressText: { fontSize: 13, fontWeight: '600' },
  track: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: MEDALLION_SIZE + Spacing.three,
  },
  fill: { height: 5, borderRadius: 3 },
});
