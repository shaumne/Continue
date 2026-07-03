import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { saveDailyBudget } from '@/api/profile';
import { Ring } from '@/components/ring';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { useLibrary } from '@/hooks/use-library';
import { useProfile } from '@/hooks/use-profile';
import { formatDuration } from '@/lib/format';
import { queryClient } from '@/lib/query-client';
import { useLanguage } from '@/store/language';
import { useSession } from '@/store/session';

const XP_PER_LEVEL = 1000;
const RING_SIZE = 92;
const RING_STROKE = 8;

/** Presets shown as chips in the daily time budget setter, in minutes. */
const BUDGET_PRESETS = [30, 60, 90, 120, 180];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const email = useSession((s) => s.session?.user.email ?? '');
  const userId = useSession((s) => s.session?.user.id);
  const signOut = useSession((s) => s.signOut);

  const { data: profile } = useProfile(userId);
  const { data: items = [] } = useLibrary(userId);

  const resolved = useLanguage((s) => s.resolved);
  const setLanguage = useLanguage((s) => s.setLanguage);

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;
  const intoLevel = xp % XP_PER_LEVEL;
  const levelProgress = intoLevel / XP_PER_LEVEL;
  const streakProgress = Math.min(streak / Math.max(longestStreak, 7), 1);
  const backlog = items.filter((i) => i.status === 'backlog').length;
  const completed = items.filter((i) => i.status === 'completed').length;

  const savedBudget = profile?.daily_time_budget_minutes ?? null;
  const [budget, setBudget] = useState<number | null>(savedBudget);
  const [savingBudget, setSavingBudget] = useState(false);
  const savingBudgetRef = useRef(false);

  // Keep local state in sync once the profile query resolves/refetches,
  // but don't clobber an in-flight optimistic update.
  useEffect(() => {
    if (!savingBudgetRef.current) setBudget(savedBudget);
  }, [savedBudget]);

  async function selectBudget(minutes: number | null) {
    if (!userId || savingBudget) return;
    const previous = budget;
    setBudget(minutes);
    setSavingBudget(true);
    savingBudgetRef.current = true;
    const { error } = await saveDailyBudget(userId, minutes);
    setSavingBudget(false);
    savingBudgetRef.current = false;
    if (error) {
      setBudget(previous);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: Brand.primary }]}>
            <Text style={styles.avatarText}>
              {(email[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
              {email.split('@')[0]}
            </Text>
            <Text style={[styles.level, { color: Brand.primary }]}>
              {t('profile.level', { level })}
            </Text>
          </View>
        </View>

        <View style={styles.ringsRow}>
          <View style={styles.ringItem}>
            <Ring
              size={RING_SIZE}
              strokeWidth={RING_STROKE}
              progress={levelProgress}
              color={Brand.primary}
              accessibilityLabel={t('profile.levelRingA11y', {
                level,
                percent: Math.round(levelProgress * 100),
              })}>
              <Text style={[styles.ringValue, { color: c.text }]}>{level}</Text>
              <Text style={[styles.ringLabel, { color: c.textSecondary }]}>
                {t('profile.levelRingLabel')}
              </Text>
            </Ring>
          </View>
          <View style={styles.ringItem}>
            <Ring
              size={RING_SIZE}
              strokeWidth={RING_STROKE}
              progress={streakProgress}
              color={Brand.streak}
              accessibilityLabel={t('profile.streakRingA11y', { streak })}>
              <Text style={[styles.ringValue, { color: c.text }]}>{streak}</Text>
              <Text style={[styles.ringLabel, { color: c.textSecondary }]}>
                {t('profile.streak')}
              </Text>
            </Ring>
          </View>
        </View>

        {/* XP progress within the current level */}
        <View style={[styles.xpTrack, { backgroundColor: c.backgroundElement }]}>
          <View
            style={[
              styles.xpFill,
              { width: `${(intoLevel / XP_PER_LEVEL) * 100}%`, backgroundColor: Brand.primary },
            ]}
          />
        </View>
        <Text style={[styles.xpText, { color: c.textSecondary }]}>
          {t('profile.xp', { xp })}
        </Text>

        <View style={styles.stats}>
          <Stat label={t('profile.streak')} value={streak} color={Brand.streak} c={c} />
          <Stat label={t('profile.backlog')} value={backlog} color={Brand.primary} c={c} />
          <Stat label={t('profile.completed')} value={completed} color={Brand.success} c={c} />
        </View>

        <Pressable
          onPress={() => router.push('/achievements')}
          accessibilityRole="button"
          accessibilityLabel={t('achievements.title')}
          style={[styles.achievementsRow, { backgroundColor: c.backgroundElement }]}>
          <Ionicons name="trophy" size={20} color={Brand.xp} />
          <Text style={[styles.achievementsRowText, { color: c.text }]}>
            {t('achievements.title')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/wrapped')}
          accessibilityRole="button"
          accessibilityLabel={t('profile.wrapped')}
          style={[styles.achievementsRow, { backgroundColor: c.backgroundElement }]}>
          <Ionicons name="gift" size={20} color={Brand.primary} />
          <Text style={[styles.achievementsRowText, { color: c.text }]}>
            {t('profile.wrapped')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
        </Pressable>

        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
          {t('profile.timeBudget')}
        </Text>
        <Text style={[styles.timeBudgetValue, { color: Brand.primary }]}>
          {budget != null ? formatDuration(budget) : t('profile.timeBudgetNotSet')}
        </Text>
        <View style={styles.budgetRow}>
          {BUDGET_PRESETS.map((minutes) => {
            const active = budget === minutes;
            return (
              <Pressable
                key={minutes}
                onPress={() => selectBudget(minutes)}
                disabled={savingBudget}
                accessibilityRole="button"
                accessibilityLabel={formatDuration(minutes)}
                accessibilityState={{ selected: active, disabled: savingBudget }}
                style={[
                  styles.langChip,
                  { backgroundColor: active ? Brand.primary : c.backgroundElement },
                ]}>
                <Text style={[styles.langText, { color: active ? '#fff' : c.textSecondary }]}>
                  {formatDuration(minutes)}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => selectBudget(null)}
            disabled={savingBudget}
            accessibilityRole="button"
            accessibilityLabel={t('profile.timeBudgetNotSet')}
            accessibilityState={{ selected: budget == null, disabled: savingBudget }}
            style={[
              styles.langChip,
              { backgroundColor: budget == null ? Brand.primary : c.backgroundElement },
            ]}>
            <Text style={[styles.langText, { color: budget == null ? '#fff' : c.textSecondary }]}>
              {t('profile.timeBudgetClear')}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
          {t('settings.language')}
        </Text>
        <View style={styles.langRow}>
          {SUPPORTED_LANGUAGES.map((lng: SupportedLanguage) => {
            const active = lng === resolved;
            return (
              <Pressable
                key={lng}
                onPress={() => setLanguage(lng)}
                style={[
                  styles.langChip,
                  { backgroundColor: active ? Brand.primary : c.backgroundElement },
                ]}>
                <Text style={[styles.langText, { color: active ? '#fff' : c.textSecondary }]}>
                  {t(`languages.${lng}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={signOut}
          style={[styles.signOut, { borderColor: Brand.danger }]}>
          <Text style={[styles.signOutText, { color: Brand.danger }]}>
            {t('auth.signOut')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  color,
  c,
}: {
  label: string;
  value: number;
  color: string;
  c: (typeof Colors)['dark'];
}) {
  return (
    <View style={[styles.stat, { backgroundColor: c.backgroundElement }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700' },
  level: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: Spacing.two,
  },
  ringItem: { alignItems: 'center' },
  ringValue: { fontSize: 22, fontWeight: '700' },
  ringLabel: { fontSize: 11 },
  xpTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: Spacing.two },
  xpFill: { height: 8, borderRadius: 4 },
  xpText: { fontSize: 12 },
  stats: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  achievementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  achievementsRowText: { flex: 1, fontSize: 15, fontWeight: '600' },
  stat: { flex: 1, borderRadius: 12, padding: Spacing.three, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  sectionLabel: { fontSize: 13, marginTop: Spacing.four },
  timeBudgetValue: { fontSize: 20, fontWeight: '700', marginTop: Spacing.half },
  budgetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  langRow: { flexDirection: 'row', gap: Spacing.two },
  langChip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  langText: { fontSize: 14, fontWeight: '600' },
  signOut: {
    marginTop: Spacing.five,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  signOutText: { fontSize: 15, fontWeight: '600' },
});
