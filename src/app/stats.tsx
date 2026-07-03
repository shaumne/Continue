import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Donut } from '@/components/donut';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useStats } from '@/hooks/use-stats';
import { useSession } from '@/store/session';

type StatsWindow = 'week' | 'month' | 'year' | 'allTime';

const WINDOWS: StatsWindow[] = ['week', 'month', 'year', 'allTime'];

/** Icons for the four colored summary tiles — matches the per-type icon used by `TypeBadge`. */
const TILE_ICONS: Record<'game' | 'movie' | 'book' | 'anime', keyof typeof Ionicons.glyphMap> = {
  game: 'game-controller',
  movie: 'film',
  book: 'book',
  anime: 'sparkles',
};

export default function StatsScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const userId = useSession((s) => s.session?.user.id);
  const stats = useStats(userId);

  // TODO: wire this to real time-window scoped aggregation once the server
  // (or a client-side date filter over activity_log) supports it. For now
  // it's UI-only and every window reads the same whole-library `useStats`.
  const [window, setWindow] = useState<StatsWindow>('year');
  // TODO: same as above — the year navigator doesn't yet re-scope the query.
  const [year, setYear] = useState(() => new Date().getFullYear());

  const isEmpty = !stats.isLoading && stats.total === 0;

  const tiles: {
    type: 'game' | 'movie' | 'book' | 'anime';
    value: number;
    label: string;
  }[] = [
    { type: 'game', value: stats.completedByType.game, label: t('stats.gamesFinished') },
    { type: 'movie', value: stats.completedByType.movie, label: t('stats.moviesWatched') },
    { type: 'book', value: stats.completedByType.book, label: t('stats.booksRead') },
    { type: 'anime', value: stats.animeEpisodes, label: t('stats.animeEpisodes') },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: c.text }]}>{t('tabs.stats')}</Text>

        <View
          style={[styles.segmented, { backgroundColor: c.backgroundElement }]}
          accessibilityRole="tablist">
          {WINDOWS.map((w) => {
            const active = w === window;
            return (
              <Pressable
                key={w}
                onPress={() => setWindow(w)}
                style={[styles.segment, active && { backgroundColor: Brand.primary }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t(`stats.${w}`)}>
                <Text
                  style={[
                    styles.segmentLabel,
                    { color: active ? '#fff' : c.textSecondary },
                  ]}>
                  {t(`stats.${w}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.yearRow}>
          <Pressable
            onPress={() => setYear((y) => y - 1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('stats.previousYear')}>
            <Ionicons name="chevron-back" size={22} color={c.text} />
          </Pressable>
          <Text style={[styles.year, { color: c.text }]}>{year}</Text>
          <Pressable
            onPress={() => setYear((y) => y + 1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('stats.nextYear')}>
            <Ionicons name="chevron-forward" size={22} color={c.text} />
          </Pressable>
        </View>

        {isEmpty ? (
          <Text style={[styles.empty, { color: c.textSecondary }]} accessibilityRole="text">
            {t('stats.emptyHint')}
          </Text>
        ) : (
          <>
            <View style={styles.tileGrid}>
              {tiles.map((tile) => (
                <ColorTile
                  key={tile.type}
                  icon={TILE_ICONS[tile.type]}
                  value={tile.value}
                  label={tile.label}
                  color={ContentTypeColors[tile.type]}
                />
              ))}
            </View>

            <View style={styles.tileRow}>
              {/* TODO: `useLibrary` doesn't select `time_spent_minutes` yet, so
                  total time / average-per-day can't be derived client-side.
                  Needs a data-hook extension (flagged to the hook owner). */}
              <PlainTile label={t('stats.totalTime')} value="—" c={c} />
              <PlainTile label={t('stats.avgPerDay')} value="—" c={c} />
            </View>

            <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>
                {t('stats.mostConsumedGenres')}
              </Text>
              {/* TODO: this is a by-content-type breakdown, not real genres —
                  `content_items.metadata.genres` isn't selected by
                  `useLibrary` yet. Swap in a true genre aggregation once that
                  field is available (data-hook/schema change, out of scope
                  here). */}
              <View style={styles.donutRow}>
                <Donut
                  size={130}
                  strokeWidth={20}
                  segments={stats.byType.map((entry) => ({
                    value: entry.count,
                    color: entry.color,
                  }))}
                  accessibilityLabel={t('stats.byTypeA11y', { count: stats.total })}
                />
                <View style={styles.legend}>
                  {stats.byType.map((entry) => (
                    <View key={entry.type} style={styles.legendRow}>
                      <View style={[styles.dot, { backgroundColor: entry.color }]} />
                      <Text
                        style={[styles.legendLabel, { color: c.text }]}
                        numberOfLines={1}>
                        {t(`contentType.${entry.type}`)}
                      </Text>
                      <Text style={[styles.legendPercent, { color: c.textSecondary }]}>
                        {stats.total > 0 ? Math.round((entry.count / stats.total) * 100) : 0}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ColorTile({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View
      style={[styles.colorTile, { backgroundColor: color }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={20} color="#fff" style={styles.colorTileIcon} />
      <Text style={styles.colorTileValue}>{value}</Text>
      <Text style={styles.colorTileLabel}>{label}</Text>
    </View>
  );
}

function PlainTile({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: (typeof Colors)['dark'];
}) {
  return (
    <View
      style={[styles.plainTile, { backgroundColor: c.backgroundElement }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.plainTileLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.plainTileValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  title: { fontSize: 26, fontWeight: '700', marginTop: Spacing.three },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: Spacing.five },

  segmented: { flexDirection: 'row', borderRadius: 999, padding: Spacing.half },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    alignItems: 'center',
  },
  segmentLabel: { fontSize: 13, fontWeight: '700' },

  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  year: { fontSize: 18, fontWeight: '700' },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  colorTile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  colorTileIcon: { marginBottom: Spacing.one },
  colorTileValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  colorTileLabel: { fontSize: 12, fontWeight: '600', color: '#fff' },

  tileRow: { flexDirection: 'row', gap: Spacing.two },
  plainTile: { flex: 1, borderRadius: 16, padding: Spacing.three, gap: Spacing.one },
  plainTileLabel: { fontSize: 12 },
  plainTileValue: { fontSize: 20, fontWeight: '700' },

  card: { borderRadius: 16, padding: Spacing.four, gap: Spacing.three },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  legend: { flex: 1, gap: Spacing.two },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  legendPercent: { fontSize: 13, fontWeight: '600' },
});
