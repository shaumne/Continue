import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Donut } from '@/components/donut';
import { TypeBadge } from '@/components/type-badge';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useWrapped } from '@/hooks/use-wrapped';
import { formatDuration } from '@/lib/format';
import { useSession } from '@/store/session';

/** Locale-aware month name, e.g. "March" / "Mart" / "3月". No new i18n keys needed. */
function monthName(monthIndex: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2020, monthIndex, 1));
}

export default function WrappedScreen() {
  const { t, i18n } = useTranslation();
  const c = Colors.dark;
  const { year: yearParam } = useLocalSearchParams<{ year?: string }>();

  const userId = useSession((s) => s.session?.user.id);
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const { data: wrapped, isLoading } = useWrapped(userId, year);
  const isEmpty = !isLoading && wrapped.completedCount === 0 && wrapped.totalActivities === 0;

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
        <Text style={[styles.title, { color: c.text }]}>{t('wrapped.title', { year })}</Text>
        {!isLoading ? (
          <Text style={[styles.summary, { color: c.textSecondary }]}>
            {t('wrapped.summary', { count: wrapped.completedCount, year })}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={[styles.empty, { color: c.textSecondary }]} accessibilityRole="text">
            {t('wrapped.emptyHint')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.tileRow}>
            <StatTile
              label={t('wrapped.completed')}
              value={wrapped.completedCount}
              color={Brand.success}
              c={c}
            />
            <StatTile
              label={t('wrapped.hoursSpent')}
              value={formatDuration(wrapped.hoursSpent)}
              color={Brand.xp}
              c={c}
            />
            <StatTile
              label={t('wrapped.busiestMonth')}
              value={
                wrapped.busiestMonth != null ? monthName(wrapped.busiestMonth, i18n.language) : '—'
              }
              color={Brand.primary}
              c={c}
            />
          </View>

          {wrapped.byType.length ? (
            <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{t('stats.byType')}</Text>
              <View style={styles.donutRow}>
                <Donut
                  size={140}
                  strokeWidth={18}
                  segments={wrapped.byType.map((entry) => ({
                    value: entry.count,
                    color: entry.color,
                  }))}
                  accessibilityLabel={t('stats.byTypeA11y', { count: wrapped.completedCount })}
                  center={
                    <View style={styles.donutCenter}>
                      <Text style={[styles.donutTotal, { color: c.text }]}>
                        {wrapped.completedCount}
                      </Text>
                      <Text style={[styles.donutTotalLabel, { color: c.textSecondary }]}>
                        {t('stats.items')}
                      </Text>
                    </View>
                  }
                />
                <View style={styles.legend}>
                  {wrapped.byType.map((entry) => (
                    <View key={entry.type} style={styles.legendRow}>
                      <View style={[styles.dot, { backgroundColor: entry.color }]} />
                      <Text style={[styles.legendLabel, { color: c.text }]} numberOfLines={1}>
                        {t(`contentType.${entry.type}`)}
                      </Text>
                      <Text style={[styles.legendCount, { color: c.textSecondary }]}>
                        {entry.count}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {wrapped.topItems.length ? (
            <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{t('wrapped.topTitles')}</Text>
              <View style={styles.topList}>
                {wrapped.topItems.map((item) => (
                  <View
                    key={item.id}
                    accessible
                    accessibilityRole="summary"
                    accessibilityLabel={`${item.title}. ${t(`contentType.${item.type}`)}`}
                    style={[styles.topRow, { backgroundColor: c.backgroundSelected }]}>
                    <Image
                      source={item.cover_url}
                      style={styles.cover}
                      contentFit="cover"
                      transition={150}
                      accessibilityLabel={item.title}
                    />
                    <View style={styles.flex}>
                      <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <TypeBadge type={item.type} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatTile({
  label,
  value,
  color,
  c,
}: {
  label: string;
  value: number | string;
  color: string;
  c: (typeof Colors)['dark'];
}) {
  return (
    <View
      style={[styles.tile, { backgroundColor: c.backgroundElement }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.tileValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.tileLabel, { color: c.textSecondary }]}>{label}</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  empty: { fontSize: 14, textAlign: 'center', paddingHorizontal: Spacing.five },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  tileRow: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1, borderRadius: 12, padding: Spacing.three, alignItems: 'center', gap: 2 },
  tileValue: { fontSize: 20, fontWeight: '700' },
  tileLabel: { fontSize: 12, textAlign: 'center' },
  card: { borderRadius: 16, padding: Spacing.four, gap: Spacing.three },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  donutCenter: { alignItems: 'center' },
  donutTotal: { fontSize: 24, fontWeight: '800' },
  donutTotalLabel: { fontSize: 11 },
  legend: { flex: 1, gap: Spacing.two },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  legendCount: { fontSize: 13, fontWeight: '600' },
  topList: { gap: Spacing.two },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.three,
  },
  flex: { flex: 1 },
  cover: { width: 46, height: 66, borderRadius: 6, backgroundColor: '#0003' },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: Spacing.one },
});
