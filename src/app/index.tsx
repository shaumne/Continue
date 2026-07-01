import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSelected(pick);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: c.text }]} numberOfLines={1}>
          {t('home.greeting', { name })}
        </Text>
        <Pressable
          onPress={() => router.push('/explore')}
          style={[styles.addBtn, { backgroundColor: Brand.primary }]}
          hitSlop={8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addText}>{t('addContent.addToLibrary')}</Text>
        </Pressable>
      </View>

      {/* Hero: available time + Let's Decide */}
      <View style={[styles.hero, { backgroundColor: Brand.primaryMuted }]}>
        <Text style={styles.heroLabel}>
          {budget ? t('home.availableTime', { time: formatDuration(budget) }) : t('home.noTimeSet')}
        </Text>
        <Text style={styles.heroHint}>{t('home.notSureHint')}</Text>
        <Pressable onPress={decide} style={styles.decideBtn}>
          <Ionicons name="dice" size={18} color={Brand.primary} />
          <Text style={[styles.decideText, { color: Brand.primary }]}>{t('home.letsDecide')}</Text>
        </Pressable>
      </View>

      <Text style={[styles.section, { color: c.text }]}>{t('home.continueTitle')}</Text>

      <FlatList
        data={continueItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textSecondary }]}>{t('home.emptyHint')}</Text>
        }
        renderItem={({ item }) => {
          const type = item.content?.type;
          const hasProgress = item.progress_total && item.progress_current != null;
          const progress = hasProgress
            ? item.progress_current! / item.progress_total!
            : 0;
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
                {type ? <TypeBadge type={type} /> : null}
                <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
                  {item.content?.title ?? '—'}
                </Text>
                {hasProgress ? (
                  <Text style={[styles.progressText, { color: c.textSecondary }]}>
                    {item.progress_current} / {item.progress_total}
                    {'  ·  '}
                    {t('home.unitsLeft', {
                      count: item.progress_total! - item.progress_current!,
                    })}
                  </Text>
                ) : (
                  <Text style={[styles.progressText, { color: c.textSecondary }]}>
                    {t(`status.${item.status}`)}
                  </Text>
                )}
                <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.round(progress * 100)}%`,
                        backgroundColor: type ? ContentTypeColors[type] : Brand.primary,
                      },
                    ]}
                  />
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
  safe: { flex: 1, paddingHorizontal: Spacing.four },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  flex: { flex: 1 },
  greeting: { flex: 1, fontSize: 22, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  addText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  hero: {
    borderRadius: 16,
    padding: Spacing.four,
    marginTop: Spacing.four,
    gap: Spacing.one,
  },
  heroLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  heroHint: { color: '#ffffffcc', fontSize: 13, marginBottom: Spacing.three },
  decideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: Spacing.three,
  },
  decideText: { fontSize: 15, fontWeight: '700' },
  section: { fontSize: 17, fontWeight: '600', marginTop: Spacing.four },
  list: { paddingVertical: Spacing.three, gap: Spacing.two },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: Spacing.five },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.three,
  },
  cover: { width: 52, height: 74, borderRadius: 8, backgroundColor: '#0003' },
  cardTitle: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  progressText: { fontSize: 12, marginTop: 2, marginBottom: Spacing.one },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});
