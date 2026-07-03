import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ring } from '@/components/ring';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useStreak } from '@/hooks/use-streak';
import { useSession } from '@/store/session';

/** Reference week (Mon 4 Jan 1971) used purely to read locale-correct Mon..Sun labels. */
const REFERENCE_MONDAY = new Date(1971, 0, 4);

/** A month grid cell: a day number, or `null` for a leading/trailing pad slot. */
type DayCell = number | null;

export default function StreakScreen() {
  const { t, i18n } = useTranslation();
  const c = Colors.dark;

  const userId = useSession((s) => s.session?.user.id);
  const today = useMemo(() => new Date(), []);

  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());

  const { currentStreak, longestStreak, activeDays } = useStreak(
    userId,
    visibleYear,
    visibleMonth,
  );

  // Ring fills toward the longest streak (min 30 days) so a fresh streak
  // still reads as "early progress" rather than an empty ring.
  const ringProgress = Math.min(currentStreak / Math.max(longestStreak, 30), 1);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(
        new Date(visibleYear, visibleMonth, 1),
      ),
    [i18n.language, visibleYear, visibleMonth],
  );

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(REFERENCE_MONDAY);
      date.setDate(REFERENCE_MONDAY.getDate() + i);
      return formatter.format(date);
    });
  }, [i18n.language]);

  const dayCells = useMemo<DayCell[]>(() => {
    const firstOfMonth = new Date(visibleYear, visibleMonth, 1);
    // getDay(): 0=Sun..6=Sat -> shift so the grid starts on Monday.
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();

    const cells: DayCell[] = [
      ...Array<null>(leadingBlanks).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [visibleYear, visibleMonth]);

  const isCurrentMonth =
    visibleYear === today.getFullYear() && visibleMonth === today.getMonth();

  function shiftMonth(delta: number) {
    const next = new Date(visibleYear, visibleMonth + delta, 1);
    setVisibleYear(next.getFullYear());
    setVisibleMonth(next.getMonth());
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('detail.back')}
          style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: c.text }]} numberOfLines={1}>
          {t('streak.title')}
        </Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.ringSection}>
          <Ring
            size={180}
            strokeWidth={14}
            progress={ringProgress}
            color={Brand.streak}
            trackColor={c.backgroundElement}
            accessibilityLabel={t('profile.streakRingA11y', { streak: currentStreak })}>
            <View style={styles.ringCenter}>
              <Text style={[styles.ringNumber, { color: c.text }]}>{currentStreak}</Text>
              <Text style={[styles.ringDays, { color: c.textSecondary }]}>
                {t('streak.days')}
              </Text>
              <Ionicons
                name="flame"
                size={22}
                color={Brand.streak}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
          </Ring>

          <View style={styles.messageBlock} accessibilityRole="text">
            <View style={styles.keepItUpRow}>
              <Text style={[styles.keepItUp, { color: c.text }]}>{t('streak.keepItUp')}</Text>
              <Ionicons
                name="flame"
                size={16}
                color={Brand.streak}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
            <Text style={[styles.bestStreak, { color: c.textSecondary }]}>
              {t('streak.bestStreak', { days: longestStreak })}
            </Text>
          </View>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: c.backgroundElement }]}>
          <View style={styles.calendarHeader}>
            <Pressable
              onPress={() => shiftMonth(-1)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('streak.previousMonth')}>
              <Ionicons name="chevron-back" size={20} color={c.text} />
            </Pressable>
            <Text style={[styles.calendarTitle, { color: c.text }]}>
              {monthLabel} {visibleYear}
            </Text>
            <Pressable
              onPress={() => shiftMonth(1)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('streak.nextMonth')}>
              <Ionicons name="chevron-forward" size={20} color={c.text} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayLabels.map((label, index) => (
              <Text
                key={index}
                style={[styles.weekdayLabel, { color: c.textSecondary }]}
                accessibilityElementsHidden
                importantForAccessibility="no">
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.dayGrid}>
            {dayCells.map((day, index) =>
              day === null ? (
                <View key={index} style={styles.dayCell} />
              ) : (
                <CalendarDay
                  key={index}
                  day={day}
                  active={activeDays.has(day)}
                  isToday={isCurrentMonth && day === today.getDate()}
                  c={c}
                />
              ),
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CalendarDay({
  day,
  active,
  isToday,
  c,
}: {
  day: number;
  active: boolean;
  isToday: boolean;
  c: (typeof Colors)['dark'];
}) {
  const { t } = useTranslation();

  const a11yLabel = [
    String(day),
    isToday ? t('streak.today') : null,
    active ? t('streak.activeDay') : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      style={styles.dayCell}
      accessible
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}>
      <View
        style={[
          styles.dayCircle,
          active && { backgroundColor: Brand.success },
          isToday && { borderColor: Brand.primary, borderWidth: 2 },
        ]}>
        <Text style={[styles.dayNumber, { color: active ? '#fff' : c.text }]}>{day}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  iconButton: { width: 24, alignItems: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },

  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },

  ringSection: { alignItems: 'center', gap: Spacing.three },
  ringCenter: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  ringNumber: { fontSize: 44, fontWeight: '800' },
  ringDays: { fontSize: 14, fontWeight: '600' },

  messageBlock: { alignItems: 'center', gap: Spacing.half },
  keepItUpRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  keepItUp: { fontSize: 16, fontWeight: '700' },
  bestStreak: { fontSize: 13 },

  calendarCard: { borderRadius: 20, padding: Spacing.four, gap: Spacing.three },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitle: { fontSize: 16, fontWeight: '700' },

  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },

  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.half,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { fontSize: 13, fontWeight: '600' },
});
