import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

export default function QuestsScreen() {
  const { t } = useTranslation();
  const c = Colors.dark;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>{t('tabs.quests')}</Text>
      <View style={styles.center}>
        <Text style={[styles.hint, { color: c.textSecondary }]}>{t('common.comingSoon')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: Spacing.four },
  title: { fontSize: 26, fontWeight: '700', marginTop: Spacing.three },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 15 },
});
