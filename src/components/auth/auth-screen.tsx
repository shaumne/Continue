import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSession } from '@/store/session';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const c = Colors[scheme === 'unspecified' ? 'dark' : scheme];

  const signIn = useSession((s) => s.signIn);
  const signUp = useSession((s) => s.signUp);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isLogin = mode === 'login';
  const canSubmit = email.trim().length > 3 && password.length >= 6 && !loading;

  async function onSubmit() {
    setLoading(true);
    setMessage(null);
    const fn = isLogin ? signIn : signUp;
    const result = await fn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setMessage(result.error);
    } else if (result.needsConfirmation) {
      setMessage(t('auth.checkEmail'));
    }
    // On success with a session, the auth listener swaps this screen out.
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: c.text }]}>
            {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {t('auth.subtitle')}
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: c.textSecondary }]}>
              {t('auth.email')}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={c.textSecondary}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              style={[styles.input, { backgroundColor: c.backgroundElement, color: c.text }]}
            />

            <Text style={[styles.label, { color: c.textSecondary }]}>
              {t('auth.password')}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={c.textSecondary}
              autoCapitalize="none"
              secureTextEntry
              style={[styles.input, { backgroundColor: c.backgroundElement, color: c.text }]}
            />

            {message ? (
              <Text style={[styles.message, { color: Brand.danger }]}>{message}</Text>
            ) : null}

            <Pressable
              disabled={!canSubmit}
              onPress={onSubmit}
              style={[
                styles.button,
                { backgroundColor: Brand.primary, opacity: canSubmit ? 1 : 0.5 },
              ]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? t('auth.login') : t('auth.register')}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setMode(isLogin ? 'register' : 'login');
                setMessage(null);
              }}
              style={styles.toggle}>
              <Text style={[styles.toggleText, { color: Brand.primary }]}>
                {isLogin ? t('auth.toggleToRegister') : t('auth.toggleToLogin')}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: Spacing.two },
  form: { marginTop: Spacing.five },
  label: { fontSize: 13, marginBottom: Spacing.one, marginTop: Spacing.three },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  message: { marginTop: Spacing.three, fontSize: 14 },
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggle: { alignItems: 'center', marginTop: Spacing.four },
  toggleText: { fontSize: 14, fontWeight: '500' },
});
