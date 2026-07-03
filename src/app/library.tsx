import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TypeBadge } from '@/components/type-badge';
import { BottomTabInset, Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useLibrary } from '@/hooks/use-library';
import { useSession } from '@/store/session';
import type { ContentType } from '@/types/models';

type Filter = 'all' | ContentType;

// Fixed filter set matching the mockup: All + the five primary content types
// (podcast/youtube/course exist in the data model but aren't in the mockup's chip row).
const FILTERS: Filter[] = ['all', 'game', 'movie', 'tv', 'book', 'anime'];

export default function LibraryScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const userId = useSession((s) => s.session?.user.id);
  const { data: items = [] } = useLibrary(userId);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = filter === 'all' || item.content?.type === filter;
      const matchesQuery = !q || (item.content?.title ?? '').toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [items, filter, query]);

  function resetFilters() {
    setFilter('all');
    setQuery('');
    setSearchOpen(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>{t('tabs.library')}</Text>
        <View style={styles.headerIcons}>
          <Pressable
            onPress={() => setSearchOpen((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.search')}
            accessibilityState={{ selected: searchOpen }}>
            <Ionicons name="search" size={22} color={c.text} />
          </Pressable>
          <Pressable
            onPress={resetFilters}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('library.filtersLabel')}>
            <Ionicons name="options-outline" size={22} color={c.text} />
          </Pressable>
        </View>
      </View>

      {searchOpen ? (
        <View style={[styles.searchRow, { backgroundColor: c.backgroundElement }]}>
          <Ionicons name="search" size={16} color={c.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('addContent.searchPlaceholder')}
            placeholderTextColor={c.textSecondary}
            autoFocus
            autoCapitalize="none"
            accessibilityLabel={t('addContent.searchPlaceholder')}
            style={[styles.searchInput, { color: c.text }]}
          />
          <Pressable
            onPress={closeSearch}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}>
            <Ionicons name="close" size={18} color={c.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => {
          const active = f === filter;
          const color = f === 'all' ? Brand.primary : ContentTypeColors[f];
          const label = f === 'all' ? t('library.filterAll') : t(`contentType.${f}`);
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              style={[styles.chip, { backgroundColor: active ? color : c.backgroundElement }]}>
              <Text style={[styles.chipText, { color: active ? '#fff' : c.textSecondary }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textSecondary }]}>{t('home.emptyHint')}</Text>
        }
        renderItem={({ item }) => {
          const type = item.content?.type;
          const hasProgress = item.progress_total && item.progress_current != null;
          const pct = hasProgress ? item.progress_current! / item.progress_total! : 0;
          const barColor = type ? ContentTypeColors[type] : Brand.primary;
          const title = item.content?.title ?? '—';
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
                    {title}
                  </Text>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/content/[id]', params: { id: item.id } })
                    }
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('library.moreOptions', { title })}>
                    <Ionicons name="ellipsis-horizontal" size={18} color={c.textSecondary} />
                  </Pressable>
                </View>

                {type ? <TypeBadge type={type} /> : null}

                <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor },
                    ]}
                  />
                </View>

                <View style={styles.cardBottom}>
                  <Text style={[styles.metaLeft, { color: c.textSecondary }]}>
                    {hasProgress ? `${Math.round(pct * 100)}%` : t(`status.${item.status}`)}
                  </Text>
                  {hasProgress ? (
                    <Text style={[styles.metaRight, { color: c.textSecondary }]}>
                      {t('home.unitsLeft', {
                        count: item.progress_total! - item.progress_current!,
                      })}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      <Pressable
        onPress={() => router.push('/explore')}
        accessibilityRole="button"
        accessibilityLabel={t('addContent.title')}
        style={[styles.addBtn, { backgroundColor: Brand.primary, marginBottom: BottomTabInset }]}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>{t('addContent.title')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: Spacing.four },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  title: { fontSize: 26, fontWeight: '700' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filters: { gap: Spacing.two, paddingVertical: Spacing.three },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  list: { paddingBottom: Spacing.four, gap: Spacing.two },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: Spacing.five },
  flex: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.two,
    gap: Spacing.three,
  },
  cover: { width: 54, height: 76, borderRadius: 8, backgroundColor: '#0003' },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: Spacing.two },
  fill: { height: 6, borderRadius: 3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  metaLeft: { fontSize: 12, fontWeight: '600' },
  metaRight: { fontSize: 12 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: 14,
    marginTop: Spacing.two,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
