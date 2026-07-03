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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { saveProgress } from '@/api/library';
import { Segmented } from '@/components/segmented';
import { TypeBadge } from '@/components/type-badge';
import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import { useItem } from '@/hooks/use-item';
import { formatDuration } from '@/lib/format';
import { queryClient } from '@/lib/query-client';
import type { ItemStatus } from '@/types/models';

const STATUSES: ItemStatus[] = ['backlog', 'started', 'paused', 'completed', 'dropped'];

type DetailTab = 'progress' | 'info' | 'notes' | 'activity';

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

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** `progress_detail.trophies` (game shape) — supports `{current,total}` or a bare percent. */
function asFraction(value: unknown): { current: number; total: number } | null {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const current = asNumber(obj.current);
    const total = asNumber(obj.total);
    if (current != null && total != null && total > 0) return { current, total };
  }
  return null;
}

/** "Today" / "Yesterday" / localized date — `t` is passed in since this runs outside a component. */
function formatLastPlayed(iso: string | null, t: (key: string) => string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, now)) return t('detail.today');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return t('detail.yesterday');
  return date.toLocaleDateString();
}

export default function ContentDetailScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height: windowHeight } = useWindowDimensions();

  const { data: item, isLoading, isError } = useItem(id);

  const [status, setStatus] = useState<ItemStatus>('backlog');
  const [current, setCurrent] = useState('');
  const [total, setTotal] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('progress');

  // Seed the editable fields once the item loads (or reloads after a refetch).
  useEffect(() => {
    if (!item) return;
    setStatus(item.status);
    setCurrent(item.progress_current?.toString() ?? '');
    setTotal(item.progress_total?.toString() ?? '');
  }, [item]);

  async function onSave(overrideStatus?: ItemStatus) {
    if (!item?.content) return;
    const nextStatus = overrideStatus ?? status;
    setSaving(true);
    const { error } = await saveProgress({
      userItemId: item.id,
      contentItemId: item.content.id,
      status: nextStatus,
      progressCurrent: toNum(current),
      progressTotal: toNum(total),
    });
    setSaving(false);
    if (!error) {
      if (overrideStatus) setStatus(overrideStatus);
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
    }
  }

  function onContinuePress() {
    setActiveTab('progress');
    void onSave(status === 'backlog' ? 'started' : status);
  }

  const type = item?.content?.type;
  const hasProgress = item?.progress_total != null && item?.progress_current != null;
  const pct = hasProgress ? item!.progress_current! / item!.progress_total! : 0;
  const barColor = type ? ContentTypeColors[type] : Brand.primary;

  const metadata = item?.content?.metadata ?? {};
  const metaEntries = item?.content?.metadata
    ? Object.entries(item.content.metadata)
        .map(([key, value]) => [humanizeKey(key), formatMetaValue(value)] as const)
        .filter((entry): entry is [string, string] => entry[1] != null)
    : [];

  const genres = Array.isArray(metadata.genres)
    ? metadata.genres.filter((g): g is string => typeof g === 'string')
    : [];
  const genre = genres[0] ?? null;
  const platform = item?.platform ?? (typeof metadata.platform === 'string' ? metadata.platform : null);
  const lastPlayed = formatLastPlayed(item?.last_activity_at ?? null, t);

  // TODO real estimate: no finalized metadata key for "estimated time to finish"
  // across providers yet (IGDB/TMDB/etc). Only render it when present.
  const estimateMinutes = asNumber(metadata.estimate_minutes);

  const progressDetail = item?.progress_detail ?? {};
  const mainPct = asNumber(progressDetail.main);
  const sidePct = asNumber(progressDetail.side);
  const trophies = asFraction(progressDetail.trophies);
  const hasSubProgress = mainPct != null || sidePct != null || trophies != null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.overlayHeader} pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('detail.back')}
          style={[styles.iconBtn, { backgroundColor: `${c.background}B3` }]}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        {item ? (
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('library.moreOptions', { title: item.content?.title ?? '' })}
            style={[styles.iconBtn, { backgroundColor: `${c.background}B3` }]}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
          </Pressable>
        ) : null}
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Image
            source={item.content?.cover_url}
            style={[styles.cover, { height: windowHeight * 0.4, backgroundColor: c.backgroundElement }]}
            contentFit="cover"
            transition={150}
            accessibilityLabel={item.content?.title ?? ''}
          />

          <View style={styles.body}>
            <Text style={[styles.title, { color: c.text }]}>{item.content?.title ?? '—'}</Text>
            {type ? <TypeBadge type={type} /> : null}

            <View style={styles.statsRow}>
              <Text style={[styles.bigPct, { color: barColor }]}>
                {hasProgress ? `${Math.round(pct * 100)}%` : '—'}
              </Text>
              <View style={styles.statsCol}>
                <Text style={[styles.statText, { color: c.text }]}>
                  {t('detail.played', { time: formatDuration(item.time_spent_minutes) })}
                </Text>
                {estimateMinutes != null ? (
                  <Text style={[styles.statText, { color: c.textSecondary }]}>
                    {t('detail.estimate', { time: formatDuration(estimateMinutes) })}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor },
                ]}
              />
            </View>

            <View style={styles.grid}>
              <InfoCell
                label={t('detail.statusLabel')}
                value={t(`status.${item.status}`)}
                c={c}
                caret
                onPress={() => setActiveTab('progress')}
              />
              <InfoCell label={t('detail.platform')} value={platform ?? '—'} c={c} />
              <InfoCell label={t('detail.genre')} value={genre ?? '—'} c={c} />
              <InfoCell label={t('detail.lastPlayed')} value={lastPlayed} c={c} />
            </View>

            <Pressable
              disabled={saving}
              onPress={onContinuePress}
              accessibilityRole="button"
              accessibilityLabel={t('detail.continue')}
              style={[styles.continueBtn, { backgroundColor: Brand.primary, opacity: saving ? 0.6 : 1 }]}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueText}>{t('detail.continue')}</Text>
              )}
            </Pressable>

            <Segmented
              options={[
                { value: 'progress', label: t('detail.tabProgress') },
                { value: 'info', label: t('detail.tabInfo') },
                { value: 'notes', label: t('detail.tabNotes') },
                { value: 'activity', label: t('detail.tabActivity') },
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />

            {activeTab === 'progress' ? (
              <View style={styles.tabContent}>
                {hasSubProgress ? (
                  <View style={styles.subBars}>
                    {mainPct != null ? (
                      <SubProgressBar
                        label={t('detail.mainStory')}
                        valueLabel={`${Math.round(mainPct)}%`}
                        pct={mainPct / 100}
                        color={Brand.primary}
                        c={c}
                      />
                    ) : null}
                    {sidePct != null ? (
                      <SubProgressBar
                        label={t('detail.sideContent')}
                        valueLabel={`${Math.round(sidePct)}%`}
                        pct={sidePct / 100}
                        color={ContentTypeColors.tv}
                        c={c}
                      />
                    ) : null}
                    {trophies != null ? (
                      <SubProgressBar
                        label={t('detail.trophies')}
                        valueLabel={`${trophies.current} / ${trophies.total}`}
                        pct={trophies.current / trophies.total}
                        color={Brand.xp}
                        c={c}
                      />
                    ) : null}
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
                    onPress={() => onSave()}
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
              </View>
            ) : null}

            {activeTab === 'info' ? (
              <View style={styles.tabContent}>
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
                {!metaEntries.length && item.rating == null ? (
                  <Text style={[styles.hint, { color: c.textSecondary }]}>{t('common.empty')}</Text>
                ) : null}
              </View>
            ) : null}

            {activeTab === 'notes' ? (
              <View style={styles.tabContent}>
                {item.notes ? (
                  // TODO: make notes editable inline and wire through saveProgress.
                  <Text style={[styles.notes, { color: c.textSecondary }]}>{item.notes}</Text>
                ) : (
                  <Text style={[styles.hint, { color: c.textSecondary }]}>{t('common.empty')}</Text>
                )}
              </View>
            ) : null}

            {activeTab === 'activity' ? (
              // TODO: wire to `activity_log` once a dedicated data hook exists.
              <View style={styles.tabContent}>
                <Text style={[styles.hint, { color: c.textSecondary }]}>{t('common.comingSoon')}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoCell({
  label,
  value,
  c,
  caret,
  onPress,
}: {
  label: string;
  value: string;
  c: (typeof Colors)['dark'];
  caret?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.infoCell, { backgroundColor: c.backgroundElement }]}>
      <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{label}</Text>
      <View style={styles.infoValueRow}>
        <Text style={[styles.infoValue, { color: c.text }]} numberOfLines={1}>
          {value}
        </Text>
        {caret ? <Ionicons name="chevron-down" size={14} color={c.textSecondary} /> : null}
      </View>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}>
      {content}
    </Pressable>
  );
}

function SubProgressBar({
  label,
  valueLabel,
  pct,
  color,
  c,
}: {
  label: string;
  valueLabel: string;
  pct: number;
  color: string;
  c: (typeof Colors)['dark'];
}) {
  return (
    <View style={styles.subBar}>
      <View style={styles.subBarHeader}>
        <Text style={[styles.subBarLabel, { color: c.text }]}>{label}</Text>
        <Text style={[styles.subBarValue, { color: c.textSecondary }]}>{valueLabel}</Text>
      </View>
      <View style={[styles.thinTrack, { backgroundColor: c.backgroundSelected }]}>
        <View
          style={[
            styles.thinFill,
            { width: `${Math.round(Math.min(Math.max(pct, 0), 1) * 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  hint: { fontSize: 14 },
  scrollContent: { paddingBottom: Spacing.five },
  cover: { width: '100%' },
  body: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two },
  title: { fontSize: 24, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  bigPct: { fontSize: 40, fontWeight: '800' },
  statsCol: { alignItems: 'flex-end', gap: Spacing.one },
  statText: { fontSize: 13, fontWeight: '600' },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  fill: { height: 8, borderRadius: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  infoCell: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  infoLabel: { fontSize: 12 },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  infoValue: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  continueBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tabContent: { marginTop: Spacing.three, gap: Spacing.two },
  subBars: { gap: Spacing.three },
  subBar: { gap: Spacing.one },
  subBarHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  subBarLabel: { fontSize: 14, fontWeight: '600' },
  subBarValue: { fontSize: 14, fontWeight: '600' },
  thinTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  thinFill: { height: 6, borderRadius: 3 },
  card: {
    borderRadius: 14,
    padding: Spacing.three,
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
