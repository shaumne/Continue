import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Colors, Spacing } from '@/constants/theme';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { useLibrary } from '@/hooks/use-library';
import { useProfile } from '@/hooks/use-profile';
import { useLanguage } from '@/store/language';
import { useSession } from '@/store/session';

const XP_PER_LEVEL = 1000;

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
  const intoLevel = xp % XP_PER_LEVEL;
  const backlog = items.filter((i) => i.status === 'backlog').length;
  const completed = items.filter((i) => i.status === 'completed').length;

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
  xpTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: Spacing.two },
  xpFill: { height: 8, borderRadius: 4 },
  xpText: { fontSize: 12 },
  stats: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  stat: { flex: 1, borderRadius: 12, padding: Spacing.three, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  sectionLabel: { fontSize: 13, marginTop: Spacing.four },
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
