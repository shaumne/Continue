import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemEditor } from '@/components/item-editor';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useLibrary, type LibraryItem } from '@/hooks/use-library';
import { useSession } from '@/store/session';
import type { ContentType } from '@/types/models';

type Filter = 'all' | ContentType;

export default function LibraryScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const userId = useSession((s) => s.session?.user.id);
  const { data: items = [] } = useLibrary(userId);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<LibraryItem | null>(null);

  // Only offer filters for types actually present in the library.
  const presentTypes = useMemo(() => {
    const set = new Set<ContentType>();
    items.forEach((i) => i.content?.type && set.add(i.content.type));
    return [...set];
  }, [items]);

  const filtered =
    filter === 'all' ? items : items.filter((i) => i.content?.type === filter);

  const filters: Filter[] = ['all', ...presentTypes];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>{t('tabs.library')}</Text>

      <View style={styles.filters}>
        {filters.map((f) => {
          const active = f === filter;
          const color = f === 'all' ? Brand.primary : ContentTypeColors[f];
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, { backgroundColor: active ? color : c.backgroundElement }]}>
              <Text style={[styles.chipText, { color: active ? '#fff' : c.textSecondary }]}>
                {f === 'all' ? t('addContent.title') : t(`contentType.${f}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textSecondary }]}>{t('home.emptyHint')}</Text>
        }
        renderItem={({ item }) => {
          const type = item.content?.type;
          const progress =
            item.progress_total && item.progress_current != null
              ? item.progress_current / item.progress_total
              : 0;
          return (
            <Pressable
              onPress={() => setSelected(item)}
              style={[styles.row, { backgroundColor: c.backgroundElement }]}>
              <Image
                source={item.content?.cover_url}
                style={styles.cover}
                contentFit="cover"
                transition={150}
              />
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
                  {item.content?.title ?? '—'}
                </Text>
                <Text style={[styles.status, { color: c.textSecondary }]}>
                  {t(`status.${item.status}`)}
                </Text>
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
  title: { fontSize: 26, fontWeight: '700', marginTop: Spacing.three },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  list: { paddingVertical: Spacing.three, gap: Spacing.two },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: Spacing.five },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.three,
  },
  flex: { flex: 1 },
  cover: { width: 46, height: 66, borderRadius: 6, backgroundColor: '#0003' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 12, marginTop: 2, marginBottom: Spacing.one },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});
