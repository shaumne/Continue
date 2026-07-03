import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Colors, ContentTypeColors, Spacing } from '@/constants/theme';
import type { QuestVM } from '@/hooks/use-quests';
import { useQuests } from '@/hooks/use-quests';
import { useSession } from '@/store/session';
import type { ContentType } from '@/types/models';

type QuestTab = 'daily' | 'weekly' | 'challenges';

const TABS: QuestTab[] = ['daily', 'weekly', 'challenges'];

/** Per-content-type icon, mirroring `TypeBadge` (not exported from there, so
 * kept local like the equivalent `TILE_ICONS` map on the Stats screen). */
const CONTENT_ICONS: Record<ContentType, keyof typeof Ionicons.glyphMap> = {
  game: 'game-controller',
  movie: 'film',
  tv: 'tv',
  book: 'book',
  anime: 'sparkles',
  podcast: 'mic',
  youtube: 'logo-youtube',
  course: 'school',
};

function questIcon(type: ContentType | null): keyof typeof Ionicons.glyphMap {
  return type ? CONTENT_ICONS[type] : 'flag';
}

function questColor(type: ContentType | null): string {
  return type ? ContentTypeColors[type] : Brand.primary;
}

export default function QuestsScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const userId = useSession((s) => s.session?.user.id);
  const { daily, weekly, isLoading } = useQuests(userId);
  const [tab, setTab] = useState<QuestTab>('daily');

  const activeQuests = tab === 'daily' ? daily : tab === 'weekly' ? weekly : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: c.text }]}>{t('tabs.quests')}</Text>

        <View
          style={[styles.segmented, { backgroundColor: c.backgroundElement }]}
          accessibilityRole="tablist">
          {TABS.map((tabKey) => {
            const active = tabKey === tab;
            return (
              <Pressable
                key={tabKey}
                onPress={() => setTab(tabKey)}
                style={[styles.segment, active && { backgroundColor: Brand.primary }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t(`quests.${tabKey}`)}>
                <Text
                  style={[styles.segmentLabel, { color: active ? '#fff' : c.textSecondary }]}>
                  {t(`quests.${tabKey}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? null : tab === 'challenges' ? (
          // TODO: `quests.scope` only supports 'daily' | 'weekly' server-side today
          // (see supabase/migrations/20260701030000_seed_quests_achievements_engine.sql).
          // Wire this tab up once a 'challenges' scope + rows exist.
          <Text style={[styles.empty, { color: c.textSecondary }]} accessibilityRole="text">
            {t('quests.challengesSoon')}
          </Text>
        ) : activeQuests.length === 0 ? (
          <Text style={[styles.empty, { color: c.textSecondary }]} accessibilityRole="text">
            {t('quests.emptyHint')}
          </Text>
        ) : (
          <View style={styles.list}>
            {activeQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} c={c} />
            ))}
          </View>
        )}

        {!isLoading && tab === 'daily' ? <DailyCompletionCard daily={daily} c={c} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuestCard({ quest, c }: { quest: QuestVM; c: (typeof Colors)['dark'] }) {
  const { t } = useTranslation();
  const pct = quest.target > 0 ? Math.min(quest.progress / quest.target, 1) : 0;
  const typeColor = questColor(quest.content_type);
  const barColor = quest.completed ? Brand.success : typeColor;

  return (
    <View
      style={[styles.card, { backgroundColor: c.backgroundElement }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${quest.title}, ${quest.progress}/${quest.target}, ${t(
        'quests.xpReward',
        { xp: quest.xp_reward },
      )}${quest.completed ? `, ${t('quests.completed')}` : ''}`}>
      <View style={styles.cardTop}>
        <View style={[styles.iconWell, { backgroundColor: typeColor }]}>
          <Ionicons name={questIcon(quest.content_type)} size={20} color="#fff" />
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
              {quest.title}
            </Text>
            {quest.completed ? (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Brand.success}
                accessibilityLabel={t('quests.completed')}
              />
            ) : null}
          </View>
          <Text style={[styles.progressText, { color: c.textSecondary }]}>
            {quest.progress} / {quest.target}
          </Text>
        </View>

        <View style={[styles.xpChip, { backgroundColor: `${Brand.xp}22` }]}>
          <Text style={[styles.xpText, { color: Brand.xp }]}>
            {t('quests.xpReward', { xp: quest.xp_reward })}
          </Text>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
        <View
          style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]}
        />
      </View>
    </View>
  );
}

/**
 * Bottom highlighted card: "complete all daily quests" meta-progress.
 * TODO: this meta-reward isn't backed by a real `quests` row yet — the XP
 * value shown is illustrative only and is NOT awarded by the server. Wire
 * this up to a real bonus-quest row once one exists (server/schema change,
 * out of scope here).
 */
function DailyCompletionCard({ daily, c }: { daily: QuestVM[]; c: (typeof Colors)['dark'] }) {
  const { t } = useTranslation();
  const total = daily.length;
  const completed = daily.filter((q) => q.completed).length;
  const pct = total > 0 ? completed / total : 0;
  const META_XP = 100;

  if (total === 0) return null;

  return (
    <View
      style={[styles.summaryCard, { backgroundColor: `${Brand.primary}1F` }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${t('quests.completeAllDaily')}, ${completed}/${total}, ${t(
        'quests.xpReward',
        { xp: META_XP },
      )}`}>
      <View style={[styles.iconWell, { backgroundColor: Brand.xp }]}>
        {/* No dedicated "treasure chest" glyph in Ionicons — 'gift' reads as a reward icon. */}
        <Ionicons name="gift" size={22} color="#fff" />
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
            {t('quests.completeAllDaily')}
          </Text>
          <View style={[styles.xpChip, { backgroundColor: `${Brand.xp}22` }]}>
            <Text style={[styles.xpText, { color: Brand.xp }]}>
              {t('quests.xpReward', { xp: META_XP })}
            </Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
          <View
            style={[
              styles.fill,
              { width: `${Math.round(pct * 100)}%`, backgroundColor: Brand.primary },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: c.textSecondary }]}>
          {completed} / {total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.four },
  title: { fontSize: 26, fontWeight: '700', marginTop: Spacing.three },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: Spacing.three },

  segmented: { flexDirection: 'row', borderRadius: 999, padding: Spacing.half },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    alignItems: 'center',
  },
  segmentLabel: { fontSize: 13, fontWeight: '700' },

  list: { gap: Spacing.two },
  card: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconWell: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  progressText: { fontSize: 12, fontWeight: '600' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  xpChip: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: 999 },
  xpText: { fontSize: 12, fontWeight: '700' },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
