import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroNight } from '@/components/hero-night';
import { TypeBadge } from '@/components/type-badge';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { type LibraryItem, useLibrary } from '@/hooks/use-library';
import { useProfile } from '@/hooks/use-profile';
import { estimateRemainingMinutes, fitsBudget } from '@/lib/estimate';
import { formatDuration } from '@/lib/format';
import { useSession } from '@/store/session';

const IN_PROGRESS = new Set(['started', 'paused']);

export default function HomeScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const email = useSession((s) => s.session?.user.email ?? '');
  const userId = useSession((s) => s.session?.user.id);
  const name = email.split('@')[0] || 'there';

  const { data: items = [] } = useLibrary(userId);
  const { data: profile } = useProfile(userId);

  const continueItems = items.filter((i) => IN_PROGRESS.has(i.status));
  const budget = profile?.daily_time_budget_minutes ?? null;

  function decide() {
    const pool = continueItems.length ? continueItems : items;
    if (!pool.length) return;

    let pick: LibraryItem | undefined;
    if (budget != null) {
      const fitting = pool.filter((item) => fitsBudget(item, budget));
      if (fitting.length) {
        pick = fitting[Math.floor(Math.random() * fitting.length)];
      } else {
        // Nothing fits the remaining budget — fall back to the item with the
        // smallest estimate, then to any random item if nothing has one.
        const bySmallestEstimate = [...pool].sort((a, b) => {
          const ea = estimateRemainingMinutes(a);
          const eb = estimateRemainingMinutes(b);
          if (ea == null && eb == null) return 0;
          if (ea == null) return 1;
          if (eb == null) return -1;
          return ea - eb;
        });
        pick = bySmallestEstimate[0];
      }
    } else {
      pick = pool[Math.floor(Math.random() * pool.length)];
    }

    if (!pick) return;
    router.push({ pathname: '/content/[id]', params: { id: pick.id } });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <FlatList
        data={continueItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <HeroNight>
              <Text style={styles.heroGreeting}>{t('home.greeting', { name })} 👋</Text>
              <View style={styles.heroBottom}>
                <Text style={styles.heroTime}>
                  {t('home.availableTime', { time: budget ? formatDuration(budget) : '—' })}
                </Text>
              </View>
            </HeroNight>

            <Pressable style={styles.sectionRow} onPress={() => router.push('/library')}>
              <Text style={[styles.section, { color: c.text }]}>{t('home.continueTitle')}</Text>
              <Ionicons name="arrow-forward" size={20} color={c.textSecondary} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textSecondary }]}>{t('home.emptyHint')}</Text>
        }
        ListFooterComponent={
          <View style={[styles.decideCard, { backgroundColor: c.backgroundElement }]}>
            <View style={styles.flex}>
              <Text style={[styles.decideTitle, { color: c.text }]}>{t('home.notSure')}</Text>
              {budget != null ? (
                <Text style={[styles.decideHint, { color: c.textSecondary }]}>
                  {t('home.budgetHint', { time: formatDuration(budget) })}
                </Text>
              ) : (
                <Pressable
                  onPress={() => router.push('/profile')}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.noTimeSet')}>
                  <Text style={[styles.decideHint, styles.decideHintLink, { color: c.textSecondary }]}>
                    {t('home.noTimeSet')}
                  </Text>
                </Pressable>
              )}
            </View>
            <Pressable onPress={decide} style={[styles.decideBtn, { backgroundColor: Brand.primary }]}>
              <Text style={styles.decideBtnText}>{t('home.letsDecide')}</Text>
              <Ionicons name="dice" size={18} color="#fff" />
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const type = item.content?.type;
          const hasProgress = item.progress_total && item.progress_current != null;
          const pct = hasProgress ? item.progress_current! / item.progress_total! : 0;
          const barColor = type ? ContentTypeColors[type] : Brand.primary;
          const estimate = estimateRemainingMinutes(item);
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/content/[id]', params: { id: item.id } })}
              style={[styles.card, { backgroundColor: c.backgroundElement }]}>
              <Image
                source={item.content?.cover_url}
                style={styles.cover}
                contentFit="cover"
                transition={150}
              />
              <View style={styles.flex}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
                    {item.content?.title ?? '—'}
                  </Text>
                  {type ? <TypeBadge type={type} /> : null}
                </View>
                <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
                  <View
                    style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]}
                  />
                </View>
                <View style={styles.cardBottom}>
                  <Text style={[styles.metaLeft, { color: c.textSecondary }]}>
                    {hasProgress ? `${Math.round(pct * 100)}%` : t(`status.${item.status}`)}
                  </Text>
                  {hasProgress ? (
                    <Text style={[styles.metaRight, { color: c.textSecondary }]}>
                      {t('home.unitsLeft', { count: item.progress_total! - item.progress_current! })}
                    </Text>
                  ) : null}
                </View>
                {estimate != null ? (
                  <View style={styles.estimateRow}>
                    <Ionicons name="time-outline" size={12} color={c.textSecondary} />
                    <Text style={[styles.estimateText, { color: c.textSecondary }]}>
                      {t('home.timeLeft', { time: formatDuration(estimate) })}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.two },
  heroGreeting: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroBottom: { marginTop: 'auto' },
  heroTime: { color: '#C9B6FF', fontSize: 18, fontWeight: '800' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
    marginBottom: Spacing.one,
  },
  section: { fontSize: 18, fontWeight: '700' },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: Spacing.four },
  flex: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: Spacing.two,
    gap: Spacing.three,
  },
  cover: { width: 54, height: 76, borderRadius: 8, backgroundColor: '#0003' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: Spacing.two },
  fill: { height: 6, borderRadius: 3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  metaLeft: { fontSize: 12, fontWeight: '600' },
  metaRight: { fontSize: 12 },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    marginTop: Spacing.one,
  },
  estimateText: { fontSize: 11, fontWeight: '600' },
  decideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: Spacing.four,
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  decideTitle: { fontSize: 15, fontWeight: '700' },
  decideHint: { fontSize: 13, marginTop: 2 },
  decideHintLink: { textDecorationLine: 'underline' },
  decideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  decideBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
