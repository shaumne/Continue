import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Donut } from '@/components/donut';
import { Ring } from '@/components/ring';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useStats } from '@/hooks/use-stats';
import { useSession } from '@/store/session';

// TODO: the real XP curve is computed server-side (see user_profile triggers).
// This constant is a client-side placeholder for the level-progress ring only,
// kept consistent with the same placeholder used in profile.tsx.
const XP_PER_LEVEL = 1000;

export default function StatsScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const userId = useSession((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const stats = useStats(userId);

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const intoLevel = xp % XP_PER_LEVEL;
  const levelProgress = intoLevel / XP_PER_LEVEL;

  const isEmpty = !stats.isLoading && stats.total === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: c.text }]}>{t('tabs.stats')}</Text>

        {isEmpty ? (
          <Text
            style={[styles.empty, { color: c.textSecondary }]}
            accessibilityRole="text">
            {t('stats.emptyHint')}
          </Text>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{t('stats.byType')}</Text>
              <View style={styles.donutRow}>
                <Donut
                  size={140}
                  strokeWidth={18}
                  segments={stats.byType.map((entry) => ({
                    value: entry.count,
                    color: entry.color,
                  }))}
                  accessibilityLabel={t('stats.byTypeA11y', { count: stats.total })}
                  center={
                    <View style={styles.donutCenter}>
                      <Text style={[styles.donutTotal, { color: c.text }]}>{stats.total}</Text>
                      <Text style={[styles.donutTotalLabel, { color: c.textSecondary }]}>
                        {t('stats.items')}
                      </Text>
                    </View>
                  }
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
                      <Text style={[styles.legendCount, { color: c.textSecondary }]}>
                        {entry.count}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.tileRow}>
              <StatTile
                label={t('status.completed')}
                value={stats.completed}
                color={Brand.success}
                c={c}
              />
              <StatTile
                label={t('stats.inProgress')}
                value={stats.inProgress}
                color={Brand.primary}
                c={c}
              />
              <StatTile
                label={t('status.backlog')}
                value={stats.backlog}
                color={c.textSecondary}
                c={c}
              />
            </View>

            <View style={[styles.card, styles.levelCard, { backgroundColor: c.backgroundElement }]}>
              <Ring
                size={100}
                strokeWidth={10}
                progress={levelProgress}
                color={Brand.xp}
                accessibilityLabel={t('stats.levelProgressA11y', {
                  level,
                  percent: Math.round(levelProgress * 100),
                })}>
                <Text style={[styles.ringLevel, { color: c.text }]}>{level}</Text>
              </Ring>
              <View style={styles.flex}>
                <Text style={[styles.cardTitle, { color: c.text }]}>
                  {t('profile.level', { level })}
                </Text>
                <Text style={[styles.levelHint, { color: c.textSecondary }]}>
                  {t('stats.xpToNextLevel', { xp: XP_PER_LEVEL - intoLevel })}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
  value: number;
  color: string;
  c: (typeof Colors)['dark'];
}) {
  return (
    <View
      style={[styles.tile, { backgroundColor: c.backgroundElement }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  title: { fontSize: 26, fontWeight: '700', marginTop: Spacing.three },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: Spacing.five },
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
  tileRow: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1, borderRadius: 12, padding: Spacing.three, alignItems: 'center', gap: 2 },
  tileValue: { fontSize: 22, fontWeight: '700' },
  tileLabel: { fontSize: 12 },
  levelCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  ringLevel: { fontSize: 22, fontWeight: '800' },
  flex: { flex: 1 },
  levelHint: { fontSize: 13, marginTop: 2 },
});
