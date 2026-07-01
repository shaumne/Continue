import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroNight } from '@/components/hero-night';
import { ItemEditor } from '@/components/item-editor';
import { TypeBadge } from '@/components/type-badge';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useLibrary, type LibraryItem } from '@/hooks/use-library';
import { useProfile } from '@/hooks/use-profile';
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
  const [selected, setSelected] = useState<LibraryItem | null>(null);

  const continueItems = items.filter((i) => IN_PROGRESS.has(i.status));
  const budget = profile?.daily_time_budget_minutes ?? null;

  function decide() {
    const pool = continueItems.length ? continueItems : items;
    if (!pool.length) return;
    setSelected(pool[Math.floor(Math.random() * pool.length)]);
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
              <Text style={[styles.decideHint, { color: c.textSecondary }]}>
                {t('home.notSureHint')}
              </Text>
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
          return (
            <Pressable
              onPress={() => setSelected(item)}
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
              </View>
            </Pressable>
          );
        }}
      />

      {selected ? (
        <ItemEditor key={selected.id} item={selected} onClose={() => setSelected(null)} />
      ) : null}
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
