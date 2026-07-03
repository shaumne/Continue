import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Astronaut } from '@/components/astronaut';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useWrapped } from '@/hooks/use-wrapped';
import { formatDuration } from '@/lib/format';
import { useSession } from '@/store/session';

/** The four content types shown as rows in the hero card, mockup order. */
const HERO_TYPES = ['game', 'movie', 'book', 'anime'] as const;

type HeroType = (typeof HERO_TYPES)[number];

const HERO_ICONS: Record<HeroType, keyof typeof Ionicons.glyphMap> = {
  game: 'game-controller',
  movie: 'film',
  book: 'book',
  anime: 'sparkles',
};

const HERO_LABEL_KEYS: Record<HeroType, string> = {
  game: 'wrapped.games',
  movie: 'wrapped.movies',
  book: 'wrapped.books',
  anime: 'wrapped.animeEpisodes',
};

export default function WrappedScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;
  const { year: yearParam } = useLocalSearchParams<{ year?: string }>();

  const userId = useSession((s) => s.session?.user.id);
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const { data: wrapped, isLoading } = useWrapped(userId, year);
  const { data: profile } = useProfile(userId);
  const isEmpty = !isLoading && wrapped.completedCount === 0 && wrapped.totalActivities === 0;

  const longestStreak = profile?.longest_streak ?? 0;
  // TODO real genre: no per-item genre data yet, so "top genre" is really
  // the most-completed content type for the year.
  const topGenreLabel = wrapped.byType.length ? t(`contentType.${wrapped.byType[0].type}`) : '—';

  async function handleShare() {
    const message = `${t('wrapped.title', { year })} — ${t('wrapped.summary', {
      count: wrapped.completedCount,
      year,
    })}`;
    try {
      await Share.share({ message });
    } catch {
      // Share can reject on unsupported platforms (e.g. web without the
      // Web Share API) — fail silently rather than crash.
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('detail.back')}
          style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: c.text }]} numberOfLines={1}>
          {t('wrapped.title', { year })}
        </Text>
        <Pressable
          onPress={handleShare}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.share')}
          style={styles.iconButton}>
          <Ionicons name="share-outline" size={22} color={c.text} />
        </Pressable>
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
          <LinearGradient
            colors={[Brand.primary, Brand.primaryMuted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}>
            <Text style={styles.heroKicker}>{t('wrapped.heading')}</Text>
            <Text style={styles.heroYear}>{year}</Text>

            <View style={styles.heroBody}>
              <View style={styles.mascotWrap}>
                <Astronaut size={76} />
              </View>
              <View style={styles.heroStatList}>
                {HERO_TYPES.map((type) => (
                  <HeroStatRow
                    key={type}
                    type={type}
                    count={wrapped.byType.find((entry) => entry.type === type)?.count ?? 0}
                    label={t(HERO_LABEL_KEYS[type])}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>

          <View style={styles.tileRow}>
            <StatTile
              label={t('wrapped.totalTime')}
              value={formatDuration(wrapped.hoursSpent)}
              color={Brand.xp}
              c={c}
            />
            <StatTile label={t('wrapped.topGenre')} value={topGenreLabel} color={Brand.primary} c={c} />
            <StatTile
              label={t('wrapped.longestStreak')}
              value={`${longestStreak} ${t('wrapped.days')}`}
              color={Brand.streak}
              c={c}
            />
          </View>

          <Text style={[styles.tag, { color: Brand.primary }]}>{t('wrapped.tag')}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function HeroStatRow({ type, count, label }: { type: HeroType; count: number; label: string }) {
  return (
    <View
      style={styles.heroStatRow}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${count}`}>
      <Ionicons name={HERO_ICONS[type]} size={16} color={ContentTypeColors[type]} />
      <Text style={styles.heroStatLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.heroStatValue}>{count}</Text>
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  iconButton: { width: 24, alignItems: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  empty: { fontSize: 14, textAlign: 'center', paddingHorizontal: Spacing.five },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  heroCard: { borderRadius: 20, padding: Spacing.four, gap: Spacing.half },
  heroKicker: { fontSize: 15, fontWeight: '600', color: '#fff' },
  heroYear: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: Spacing.three },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  mascotWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatList: { flex: 1, gap: Spacing.two, minWidth: 0 },
  heroStatRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroStatLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  heroStatValue: { fontSize: 15, fontWeight: '800', color: '#fff' },
  tileRow: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1, borderRadius: 12, padding: Spacing.three, alignItems: 'center', gap: 2 },
  tileValue: { fontSize: 18, fontWeight: '700' },
  tileLabel: { fontSize: 12, textAlign: 'center' },
  tag: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: Spacing.one },
});
