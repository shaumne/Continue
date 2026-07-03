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
import { formatDuration, splitAroundValue } from '@/lib/format';
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

  // Split the (already-translated) greeting/time sentences around their
  // interpolated values so the hero can render them in two typographic
  // tiers, like the mockup — without hardcoding word order per locale.
  const greeting = splitAroundValue(t('home.greeting', { name }), name);
  const timeStr = budget ? formatDuration(budget) : '—';
  const available = splitAroundValue(t('home.availableTime', { time: timeStr }), timeStr);

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
              <View>
                <Text style={styles.heroGreetingLine1}>{greeting.before}</Text>
                <Text style={styles.heroGreetingLine2}>
                  {greeting.value || name}
                  {greeting.after} 👋
                </Text>
              </View>
              <View style={styles.heroBottom}>
                <Text style={styles.heroTimeLabel}>{available.before.trim()}</Text>
                <Text style={styles.heroTimeLine}>
                  <Text style={styles.heroTimeAccent}>{available.value || timeStr}</Text>
                  <Text style={styles.heroTimeSuffix}>{available.after}</Text>
                </Text>
              </View>
            </HeroNight>

            <Pressable
              style={styles.sectionRow}
              onPress={() => router.push('/library')}
              accessibilityRole="button"
              accessibilityLabel={t('home.continueTitle')}>
              <Text style={[styles.section, { color: c.text }]}>{t('home.continueTitle')}</Text>
              <Ionicons name="arrow-forward" size={20} color={c.textSecondary} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textSecondary }]}>{t('home.emptyHint')}</Text>
        }
        ListFooterComponent={
          <View style={[styles.decideCard, { backgroundColor: `${Brand.primary}26` }]}>
            <View style={styles.flex}>
              <Text style={[styles.decideTitle, { color: c.text }]}>{t('home.notSure')}</Text>
              {budget != null ? (
                <Text style={[styles.decideHint, { color: c.textSecondary }]}>
                  {t('home.notSureHint')}
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
            <Pressable
              onPress={decide}
              accessibilityRole="button"
              accessibilityLabel={t('home.letsDecide')}
              style={styles.decideAction}>
              <View style={[styles.decideBtn, { backgroundColor: Brand.primary }]}>
                <Text style={styles.decideBtnText}>{t('home.letsDecide')}</Text>
              </View>
              <Text style={styles.decideDice}>🎲</Text>
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
              accessibilityRole="button"
              accessibilityLabel={item.content?.title ?? undefined}
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
                <View style={styles.cardMeta}>
                  <Text style={[styles.metaLeft, { color: c.text }]} numberOfLines={1}>
                    {hasProgress ? `${Math.round(pct * 100)}%` : t(`status.${item.status}`)}
                  </Text>
                  {estimate != null ? (
                    <Text style={[styles.metaRight, { color: c.textSecondary }]}>
                      {t('home.timeLeft', { time: formatDuration(estimate) })}
                    </Text>
                  ) : hasProgress ? (
                    <Text style={[styles.metaRight, { color: c.textSecondary }]}>
                      {t('home.unitsLeft', { count: item.progress_total! - item.progress_current! })}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
                  <View
                    style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]}
                  />
                </View>
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
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  heroGreetingLine1: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '500' },
  heroGreetingLine2: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  heroBottom: { marginTop: Spacing.four },
  heroTimeLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },
  heroTimeLine: { marginTop: 2 },
  heroTimeAccent: { color: '#C9B6FF', fontSize: 22, fontWeight: '800' },
  heroTimeSuffix: { color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '600' },
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
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cover: { width: 68, height: 88, borderRadius: 12, backgroundColor: '#0003' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  metaLeft: { fontSize: 15, fontWeight: '700' },
  metaRight: { fontSize: 13, fontWeight: '500' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: Spacing.two },
  fill: { height: 6, borderRadius: 3 },
  decideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: Spacing.four,
    marginTop: Spacing.one,
    gap: Spacing.three,
  },
  decideTitle: { fontSize: 16, fontWeight: '700' },
  decideHint: { fontSize: 13, marginTop: 2 },
  decideHintLink: { textDecorationLine: 'underline' },
  decideAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  decideBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },
  decideBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  decideDice: { fontSize: 26 },
});
