import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Colors, Spacing } from '@/constants/theme';
import type { QuestVM } from '@/hooks/use-quests';
import { useQuests } from '@/hooks/use-quests';
import { useSession } from '@/store/session';

export default function QuestsScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const userId = useSession((s) => s.session?.user.id);
  const { daily, weekly, isLoading } = useQuests(userId);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: c.text }]}>{t('tabs.quests')}</Text>

        {isLoading ? null : (
          <>
            <QuestSection title={t('quests.daily')} quests={daily} c={c} />
            <QuestSection title={t('quests.weekly')} quests={weekly} c={c} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuestSection({
  title,
  quests,
  c,
}: {
  title: string;
  quests: QuestVM[];
  c: (typeof Colors)['dark'];
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      {quests.length === 0 ? (
        <Text style={[styles.empty, { color: c.textSecondary }]}>{t('quests.emptyHint')}</Text>
      ) : (
        <View style={styles.list}>
          {quests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} c={c} />
          ))}
        </View>
      )}
    </View>
  );
}

function QuestCard({ quest, c }: { quest: QuestVM; c: (typeof Colors)['dark'] }) {
  const { t } = useTranslation();
  const pct = quest.target > 0 ? Math.min(quest.progress / quest.target, 1) : 0;
  const barColor = quest.completed ? Brand.success : Brand.primary;

  return (
    <View
      style={[styles.card, { backgroundColor: c.backgroundElement }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${quest.title}, ${quest.progress}/${quest.target}${
        quest.completed ? `, ${t('quests.completed')}` : ''
      }`}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
          {quest.title}
        </Text>
        {quest.completed ? (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={Brand.success}
            accessibilityLabel={t('quests.completed')}
          />
        ) : null}
      </View>

      {quest.description ? (
        <Text style={[styles.cardDescription, { color: c.textSecondary }]} numberOfLines={2}>
          {quest.description}
        </Text>
      ) : null}

      <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
        <View
          style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]}
        />
      </View>

      <View style={styles.cardBottom}>
        <Text style={[styles.progressText, { color: c.textSecondary }]}>
          {quest.progress}/{quest.target}
        </Text>
        <View style={[styles.xpChip, { backgroundColor: `${Brand.xp}22` }]}>
          <Text style={[styles.xpText, { color: Brand.xp }]}>
            {t('quests.xpReward', { xp: quest.xp_reward })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.four },
  title: { fontSize: 26, fontWeight: '700', marginTop: Spacing.three },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: Spacing.three },
  list: { gap: Spacing.two },
  card: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  cardDescription: { fontSize: 13 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressText: { fontSize: 12, fontWeight: '600' },
  xpChip: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: 999 },
  xpText: { fontSize: 12, fontWeight: '700' },
});
