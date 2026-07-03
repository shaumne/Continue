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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchCatalog } from '@/api/catalog';
import { addToLibrary } from '@/api/library';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { toProviderLocale } from '@/i18n';
import { queryClient } from '@/lib/query-client';
import { useLanguage } from '@/store/language';
import { useSession } from '@/store/session';
import type { ContentType } from '@/types/models';

// All 8 type tiles shown in the mockup grid, in mockup order (2 rows x 4 cols).
const ALL_TYPES: ContentType[] = [
  'game',
  'movie',
  'tv',
  'book',
  'anime',
  'podcast',
  'youtube',
  'course',
];

// TMDB (movie/tv), AniList (anime) and Google Books (book) need no secrets, so
// only these have a live catalog provider today. `game` (IGDB) unlocks once
// IGDB_CLIENT_ID / IGDB_CLIENT_SECRET are set; `podcast`/`youtube`/`course`
// have no provider yet. All four render as "coming soon" tiles.
const ENABLED_TYPES = new Set<ContentType>(['movie', 'tv', 'anime', 'book']);

const TYPE_ICONS: Record<ContentType, keyof typeof Ionicons.glyphMap> = {
  game: 'game-controller',
  movie: 'film',
  tv: 'tv',
  book: 'book',
  anime: 'sparkles',
  podcast: 'mic',
  youtube: 'logo-youtube',
  course: 'school',
};

interface TypeTileProps {
  type: ContentType;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}

/** One rounded, color-coded tile in the "what are you adding?" grid. */
function TypeTile({ type, active, disabled, onPress }: TypeTileProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const color = ContentTypeColors[type];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        disabled
          ? `${t(`contentType.${type}`)}. ${t('common.comingSoon')}`
          : t(`contentType.${type}`)
      }
      accessibilityState={{ disabled, selected: active }}
      style={[
        styles.tile,
        {
          backgroundColor: c.backgroundElement,
          borderColor: active && !disabled ? color : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
      ]}>
      <View style={[styles.tileIconWrap, { backgroundColor: `${color}22` }]}>
        <Ionicons name={TYPE_ICONS[type]} size={22} color={color} />
      </View>
      <Text style={[styles.tileLabel, { color: c.text }]} numberOfLines={1}>
        {t(`contentType.${type}`)}
      </Text>
      {disabled ? (
        <Text style={[styles.tileBadge, { color: c.textSecondary }]} numberOfLines={1}>
          {t('common.comingSoon')}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** One row in the "Recent Searches" list. */
function RecentSearchRow({ query, onPress }: { query: string; onPress: () => void }) {
  const scheme = useColorScheme();
  const c = Colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={query}
      style={[styles.recentRow, { backgroundColor: c.backgroundElement }]}>
      <Ionicons name="time-outline" size={18} color={c.textSecondary} />
      <Text style={[styles.recentText, { color: c.text }]} numberOfLines={1}>
        {query}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
    </Pressable>
  );
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const userId = useSession((s) => s.session?.user.id);
  const locale = useLanguage((s) => toProviderLocale(s.resolved));
  const recentQueries = useRecentSearches((s) => s.queries);
  const addRecentSearch = useRecentSearches((s) => s.add);

  const [type, setType] = useState<ContentType>('movie');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [added, setAdded] = useState<Set<string>>(new Set());

  // Mockup: empty query -> type grid + recent searches. Non-empty -> results.
  const isBrowsing = text.trim().length === 0;

  const query = useQuery({
    queryKey: ['catalog', type, submitted, locale],
    queryFn: () => searchCatalog({ type, query: submitted, locale }),
    enabled: submitted.trim().length > 0,
  });

  function onSubmitSearch(raw: string) {
    const trimmed = raw.trim();
    setSubmitted(trimmed);
    if (trimmed) addRecentSearch(trimmed);
  }

  function onPressRecent(recentQuery: string) {
    setText(recentQuery);
    onSubmitSearch(recentQuery);
  }

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
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('detail.back')}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>{t('addContent.title')}</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: c.backgroundElement }]}>
        <Ionicons name="search" size={18} color={c.textSecondary} />
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => onSubmitSearch(text)}
          placeholder={t('addContent.searchPlaceholder')}
          placeholderTextColor={c.textSecondary}
          returnKeyType="search"
          autoCapitalize="none"
          accessibilityLabel={t('common.search')}
          style={[styles.input, { color: c.text }]}
        />
      </View>

      {isBrowsing ? (
        <ScrollView contentContainerStyle={styles.browseContent}>
          <Text style={[styles.prompt, { color: c.text }]}>{t('addContent.typePrompt')}</Text>
          <View style={styles.grid}>
            {ALL_TYPES.map((ty) => (
              <TypeTile
                key={ty}
                type={ty}
                active={ty === type}
                disabled={!ENABLED_TYPES.has(ty)}
                onPress={() => setType(ty)}
              />
            ))}
          </View>

          {recentQueries.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { color: c.text }]}>
                {t('addContent.recentSearches')}
              </Text>
              <View style={styles.recentList}>
                {recentQueries.map((recentQuery) => (
                  <RecentSearchRow
                    key={recentQuery}
                    query={recentQuery}
                    onPress={() => onPressRecent(recentQuery)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      ) : query.isFetching ? (
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
                  accessibilityRole="button"
                  accessibilityLabel={
                    isAdded ? t('addContent.added') : t('addContent.addToLibrary')
                  }
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
  },
  input: { flex: 1, height: '100%', fontSize: 16 },
  browseContent: { paddingBottom: Spacing.six },
  prompt: { fontSize: 15, fontWeight: '600', marginTop: Spacing.four },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  tile: {
    width: '23%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    marginBottom: Spacing.three,
    gap: Spacing.one,
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  tileBadge: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: Spacing.three },
  recentList: { gap: Spacing.two, marginTop: Spacing.three },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  recentText: { flex: 1, fontSize: 15, fontWeight: '500' },
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
