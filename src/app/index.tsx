import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemEditor } from '@/components/item-editor';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useLibrary, type LibraryItem } from '@/hooks/use-library';
import { useSession } from '@/store/session';

export default function HomeScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const email = useSession((s) => s.session?.user.email ?? '');
  const userId = useSession((s) => s.session?.user.id);
  const name = email.split('@')[0] || 'there';

  const { data: items = [] } = useLibrary(userId);
  const [selected, setSelected] = useState<LibraryItem | null>(null);

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

      <Text style={[styles.section, { color: c.text }]}>{t('home.continueTitle')}</Text>

      <FlatList
        data={items}
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
                <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
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
  section: { fontSize: 17, fontWeight: '600', marginTop: Spacing.four },
  list: { paddingVertical: Spacing.three, gap: Spacing.two },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: Spacing.five },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.three,
  },
  cover: { width: 46, height: 66, borderRadius: 6, backgroundColor: '#0003' },
  title: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 12, marginTop: 2, marginBottom: Spacing.one },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});
