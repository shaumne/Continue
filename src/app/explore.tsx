import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchCatalog } from '@/api/catalog';
import { addToLibrary } from '@/api/library';
import { queryClient } from '@/lib/query-client';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toProviderLocale } from '@/i18n';
import { useLanguage } from '@/store/language';
import { useSession } from '@/store/session';
import type { ContentType } from '@/types/models';

// Only TMDB (movies + TV) is deployed so far; more types unlock as providers land.
const TYPES: ContentType[] = ['movie', 'tv'];

export default function SearchScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const userId = useSession((s) => s.session?.user.id);
  const locale = useLanguage((s) => toProviderLocale(s.resolved));

  const [type, setType] = useState<ContentType>('movie');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [added, setAdded] = useState<Set<string>>(new Set());

  const query = useQuery({
    queryKey: ['catalog', type, submitted, locale],
    queryFn: () => searchCatalog({ type, query: submitted, locale }),
    enabled: submitted.trim().length > 0,
  });

  async function onAdd(id: string) {
    if (!userId) return;
    const { error } = await addToLibrary(userId, id);
    if (!error) {
      setAdded((prev) => new Set(prev).add(id));
      queryClient.invalidateQueries({ queryKey: ['library'] });
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>{t('addContent.title')}</Text>
      </View>

      <View style={styles.types}>
        {TYPES.map((ty) => {
          const active = ty === type;
          return (
            <Pressable
              key={ty}
              onPress={() => setType(ty)}
              style={[
                styles.chip,
                { backgroundColor: active ? ContentTypeColors[ty] : c.backgroundElement },
              ]}>
              <Text style={[styles.chipText, { color: active ? '#fff' : c.textSecondary }]}>
                {t(`contentType.${ty}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => setSubmitted(text)}
        placeholder={t('addContent.searchPlaceholder')}
        placeholderTextColor={c.textSecondary}
        returnKeyType="search"
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: c.backgroundElement, color: c.text }]}
      />

      {query.isFetching ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.primary} />
          <Text style={[styles.hint, { color: c.textSecondary }]}>
            {t('addContent.searching')}
          </Text>
        </View>
      ) : query.data && query.data.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.hint, { color: c.textSecondary }]}>
            {t('addContent.noResults', { query: submitted })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isAdded = added.has(item.id);
            return (
              <View style={[styles.row, { backgroundColor: c.backgroundElement }]}>
                <Image
                  source={item.cover_url}
                  style={styles.cover}
                  contentFit="cover"
                  transition={150}
                />
                <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Pressable
                  disabled={isAdded}
                  onPress={() => onAdd(item.id)}
                  style={[
                    styles.addBtn,
                    { backgroundColor: isAdded ? c.backgroundSelected : Brand.primary },
                  ]}>
                  <Text style={[styles.addText, { color: isAdded ? c.textSecondary : '#fff' }]}>
                    {isAdded ? t('addContent.added') : t('addContent.addToLibrary')}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: Spacing.four },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  title: { fontSize: 26, fontWeight: '700' },
  types: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    marginTop: Spacing.three,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.six,
    gap: Spacing.two,
  },
  hint: { fontSize: 14 },
  list: { paddingVertical: Spacing.three, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.three,
  },
  cover: { width: 46, height: 66, borderRadius: 6, backgroundColor: '#0003' },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '500' },
  addBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  addText: { fontSize: 14, fontWeight: '600' },
});
