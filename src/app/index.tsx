import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/store/session';

export default function HomeScreen() {
  const { t } = useTranslation();
  const signOut = useSession((s) => s.signOut);
  const email = useSession((s) => s.session?.user.email ?? '');
  const name = email.split('@')[0] || 'there';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t('home.greeting', { name })}</ThemedText>
        <ThemedText type="subtitle">{email}</ThemedText>

        <Pressable
          onPress={signOut}
          style={[styles.signOut, { borderColor: Brand.primary }]}>
          <Text style={[styles.signOutText, { color: Brand.primary }]}>
            {t('auth.signOut')}
          </Text>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  signOut: {
    marginTop: Spacing.four,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  signOutText: { fontSize: 15, fontWeight: '600' },
});
