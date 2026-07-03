import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { saveDailyBudget } from '@/api/profile';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { useAchievements } from '@/hooks/use-achievements';
import { useLibrary } from '@/hooks/use-library';
import { useProfile } from '@/hooks/use-profile';
import { formatDuration } from '@/lib/format';
import { queryClient } from '@/lib/query-client';
import { useLanguage } from '@/store/language';
import { useSession } from '@/store/session';

// TODO: replace with the real level curve once game design settles on one;
// for now every level is a flat 1000 XP band.
const XP_PER_LEVEL = 1000;

/** Presets shown as chips in the daily time budget setter, in minutes. */
const BUDGET_PRESETS = [30, 60, 90, 120, 180];

type ThemeColors = (typeof Colors)['dark'];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;

  const email = useSession((s) => s.session?.user.email ?? '');
  const userId = useSession((s) => s.session?.user.id);
  const signOut = useSession((s) => s.signOut);

  const { data: profile } = useProfile(userId);
  const { data: items = [] } = useLibrary(userId);
  const { unlockedCount: badges } = useAchievements(userId);

  const resolved = useLanguage((s) => s.resolved);
  const setLanguage = useLanguage((s) => s.setLanguage);

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.current_streak ?? 0;
  // Next 1000-XP threshold strictly above the current total.
  const nextLevelXp = Math.ceil((xp + 1) / XP_PER_LEVEL) * XP_PER_LEVEL;
  const xpProgress = Math.min(xp / nextLevelXp, 1);
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
            <Text style={[styles.level, { color: c.text }]}>
              {t('profile.level', { level })}
            </Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              {t('profile.contentExplorer')}
            </Text>
          </View>
        </View>

        {/* XP progress toward the next level */}
        <View
          style={[styles.xpTrack, { backgroundColor: c.backgroundElement }]}
          accessibilityRole="progressbar"
          accessibilityLabel={t('stats.levelProgressA11y', {
            level,
            percent: Math.round(xpProgress * 100),
          })}>
          <View
            style={[
              styles.xpFill,
              { width: `${xpProgress * 100}%`, backgroundColor: Brand.primary },
            ]}
          />
        </View>
        <Text style={[styles.xpText, { color: c.textSecondary }]}>
          {t('profile.xpProgress', { xp: xp.toLocaleString(), nextLevel: nextLevelXp.toLocaleString() })}
        </Text>

        <View style={styles.stats}>
          <Stat label={t('profile.streak')} value={streak} color={Brand.streak} c={c} />
          <Stat label={t('profile.badges')} value={badges} color={Brand.xp} c={c} />
          <Stat label={t('profile.backlog')} value={backlog} color={Brand.success} c={c} />
          <Stat label={t('profile.completed')} value={completed} color={Brand.success} c={c} />
        </View>

        <View style={styles.menu}>
          <MenuRow
            icon="trophy"
            label={t('achievements.title')}
            onPress={() => router.push('/achievements')}
            iconColor={Brand.xp}
            c={c}
          />
          <MenuRow
            icon="flame"
            label={t('streak.title')}
            onPress={() => router.push('/streak')}
            iconColor={Brand.streak}
            c={c}
          />
          <MenuRow
            icon="gift"
            label={t('profile.wrapped')}
            onPress={() => router.push('/wrapped')}
            iconColor={Brand.primary}
            c={c}
          />
          {/* TODO: link to a real Settings screen once one exists. */}
          <MenuRow icon="settings-outline" label={t('profile.settings')} disabled c={c} />
          {/* TODO: wire up once cloud backup/sync ships. */}
          <MenuRow icon="cloud-outline" label={t('profile.backupSync')} disabled c={c} />
          {/* TODO: wire up once import/export ships. */}
          <MenuRow icon="swap-horizontal" label={t('profile.importExport')} disabled c={c} />
          {/* TODO: wire up once in-app purchases ship. */}
          <MenuRow
            icon="star"
            label={t('profile.getPremium')}
            disabled
            accentColor={Brand.xp}
            c={c}
          />
        </View>

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
  c: ThemeColors;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: c.backgroundElement }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );
}

/**
 * One row in the profile menu list: leading icon, label, trailing chevron.
 * Working destinations pass `onPress`; placeholders pass `disabled` and are
 * dimmed with a "coming soon" accessibility hint instead of navigating.
 */
function MenuRow({
  icon,
  label,
  onPress,
  disabled,
  iconColor,
  accentColor,
  c,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Icon-only tint, used for the working rows (achievements, streak, wrapped). */
  iconColor?: string;
  /** Icon + label tint, used to highlight "Get Premium". */
  accentColor?: string;
  c: ThemeColors;
}) {
  const { t } = useTranslation();
  const textColor = accentColor ?? c.text;
  const glyphColor = accentColor ?? iconColor ?? c.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={disabled ? `${label}. ${t('common.comingSoon')}` : label}
      accessibilityState={{ disabled: disabled || !onPress }}
      style={[
        styles.menuRow,
        { backgroundColor: c.backgroundElement, opacity: disabled ? 0.5 : 1 },
      ]}>
      <Ionicons name={icon} size={20} color={glyphColor} />
      <Text style={[styles.menuRowText, { color: textColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
    </Pressable>
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
  level: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  subtitle: { fontSize: 13, marginTop: 1 },
  xpTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: Spacing.two },
  xpFill: { height: 8, borderRadius: 4 },
  xpText: { fontSize: 12 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  stat: {
    flexBasis: '22%',
    flexGrow: 1,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  menu: { gap: Spacing.two, marginTop: Spacing.two },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
  },
  menuRowText: { flex: 1, fontSize: 15, fontWeight: '600' },
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
