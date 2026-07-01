import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { saveProgress } from '@/api/library';
import { TypeBadge } from '@/components/type-badge';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useItem } from '@/hooks/use-item';
import { formatDuration } from '@/lib/format';
import { queryClient } from '@/lib/query-client';
import type { ItemStatus } from '@/types/models';

const STATUSES: ItemStatus[] = ['backlog', 'started', 'paused', 'completed', 'dropped'];

function toNum(s: string): number | null {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

/** Turn an arbitrary catalog metadata key (e.g. "runtime_minutes") into a display label. */
function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/** Render a metadata value as plain display text, gracefully skipping empty/nested values. */
function formatMetaValue(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).join(', ');
    return joined.length ? joined : null;
  }
  if (typeof value === 'object') return null;
  const str = String(value).trim();
  return str.length ? str : null;
}

export default function ContentDetailScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: item, isLoading, isError } = useItem(id);

  const [status, setStatus] = useState<ItemStatus>('backlog');
  const [current, setCurrent] = useState('');
  const [total, setTotal] = useState('');
  const [saving, setSaving] = useState(false);

  // Seed the editable fields once the item loads (or reloads after a refetch).
  useEffect(() => {
    if (!item) return;
    setStatus(item.status);
    setCurrent(item.progress_current?.toString() ?? '');
    setTotal(item.progress_total?.toString() ?? '');
  }, [item]);

  async function onSave() {
    if (!item?.content) return;
    setSaving(true);
    const { error } = await saveProgress({
      userItemId: item.id,
      contentItemId: item.content.id,
      status,
      progressCurrent: toNum(current),
      progressTotal: toNum(total),
    });
    setSaving(false);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
    }
  }

  const type = item?.content?.type;
  const hasProgress = item?.progress_total != null && item?.progress_current != null;
  const pct = hasProgress ? item!.progress_current! / item!.progress_total! : 0;
  const barColor = type ? ContentTypeColors[type] : Brand.primary;

  const metaEntries = item?.content?.metadata
    ? Object.entries(item.content.metadata)
        .map(([key, value]) => [humanizeKey(key), formatMetaValue(value)] as const)
        .filter((entry): entry is [string, string] => entry[1] != null)
    : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('detail.back')}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : isError || !item ? (
        <View style={styles.center}>
          <Text style={[styles.hint, { color: c.textSecondary }]}>{t('detail.notFound')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Image
            source={item.content?.cover_url}
            style={styles.cover}
            contentFit="cover"
            transition={150}
            accessibilityLabel={item.content?.title ?? ''}
          />

          <Text style={[styles.title, { color: c.text }]}>{item.content?.title ?? '—'}</Text>
          {type ? <TypeBadge type={type} /> : null}

          <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
            <View
              style={[
                styles.fill,
                { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor },
              ]}
            />
          </View>
          <View style={styles.progressMeta}>
            <Text style={[styles.metaLeft, { color: c.textSecondary }]}>
              {hasProgress ? `${Math.round(pct * 100)}%` : t(`status.${item.status}`)}
            </Text>
            {hasProgress ? (
              <Text style={[styles.metaRight, { color: c.textSecondary }]}>
                {t('home.unitsLeft', { count: item.progress_total! - item.progress_current! })}
              </Text>
            ) : null}
          </View>

          {metaEntries.length || item.platform || item.time_spent_minutes || item.rating != null ? (
            <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{t('detail.aboutTitle')}</Text>
              {item.platform ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: c.textSecondary }]}>
                    {t('detail.platform')}
                  </Text>
                  <Text style={[styles.metaValue, { color: c.text }]}>{item.platform}</Text>
                </View>
              ) : null}
              {item.time_spent_minutes ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: c.textSecondary }]}>
                    {t('detail.timeSpent')}
                  </Text>
                  <Text style={[styles.metaValue, { color: c.text }]}>
                    {formatDuration(item.time_spent_minutes)}
                  </Text>
                </View>
              ) : null}
              {item.rating != null ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: c.textSecondary }]}>
                    {t('detail.rating')}
                  </Text>
                  <Text style={[styles.metaValue, { color: c.text }]}>{item.rating}</Text>
                </View>
              ) : null}
              {metaEntries.map(([label, value]) => (
                <View style={styles.metaRow} key={label}>
                  <Text style={[styles.metaLabel, { color: c.textSecondary }]}>{label}</Text>
                  <Text style={[styles.metaValue, { color: c.text }]} numberOfLines={2}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {item.notes ? (
            <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{t('detail.notes')}</Text>
              <Text style={[styles.notes, { color: c.textSecondary }]}>{item.notes}</Text>
            </View>
          ) : null}

          <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t('detail.editTitle')}</Text>

            <Text style={[styles.label, { color: c.textSecondary }]}>
              {t('detail.statusLabel')}
            </Text>
            <View style={styles.chips}>
              {STATUSES.map((s) => {
                const active = s === status;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    accessibilityRole="button"
                    accessibilityLabel={t(`status.${s}`)}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? Brand.primary : c.backgroundSelected },
                    ]}>
                    <Text style={[styles.chipText, { color: active ? '#fff' : c.textSecondary }]}>
                      {t(`status.${s}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { color: c.textSecondary }]}>
              {t('detail.progressLabel')}
            </Text>
            <View style={styles.progressRow}>
              <TextInput
                value={current}
                onChangeText={setCurrent}
                placeholder={t('detail.current')}
                placeholderTextColor={c.textSecondary}
                keyboardType="number-pad"
                accessibilityLabel={t('detail.current')}
                style={[styles.input, { backgroundColor: c.backgroundSelected, color: c.text }]}
              />
              <Text style={[styles.sep, { color: c.textSecondary }]}>/</Text>
              <TextInput
                value={total}
                onChangeText={setTotal}
                placeholder={t('detail.total')}
                placeholderTextColor={c.textSecondary}
                keyboardType="number-pad"
                accessibilityLabel={t('detail.total')}
                style={[styles.input, { backgroundColor: c.backgroundSelected, color: c.text }]}
              />
            </View>

            <Pressable
              disabled={saving}
              onPress={onSave}
              accessibilityRole="button"
              accessibilityLabel={t('common.save')}
              style={[styles.save, { backgroundColor: Brand.primary, opacity: saving ? 0.6 : 1 }]}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>{t('common.save')}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  hint: { fontSize: 14 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.two },
  cover: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    backgroundColor: '#0003',
    marginTop: Spacing.two,
  },
  title: { fontSize: 24, fontWeight: '800', marginTop: Spacing.three },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: Spacing.three,
  },
  fill: { height: 8, borderRadius: 4 },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  metaLeft: { fontSize: 13, fontWeight: '600' },
  metaRight: { fontSize: 13 },
  card: {
    borderRadius: 14,
    padding: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  metaLabel: { fontSize: 13, flex: 1 },
  metaValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  notes: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, marginTop: Spacing.one },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    textAlign: 'center',
  },
  sep: { fontSize: 18 },
  save: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
