import { Ionicons } from '@expo/vector-icons';
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
  const c = Colors[scheme];

  const signIn = useSession((s) => s.signIn);
  const signUp = useSession((s) => s.signUp);
  const signInWithGoogle = useSession((s) => s.signInWithGoogle);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  async function onGoogle() {
    setGoogleLoading(true);
    setMessage(null);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (result.error) setMessage(result.error);
    // On success, the auth listener swaps this screen out.
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

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: c.backgroundSelected }]} />
              <Text style={[styles.dividerText, { color: c.textSecondary }]}>
                {t('auth.or')}
              </Text>
              <View style={[styles.divider, { backgroundColor: c.backgroundSelected }]} />
            </View>

            <Pressable
              disabled={googleLoading || loading}
              onPress={onGoogle}
              style={[
                styles.googleButton,
                { backgroundColor: c.backgroundElement, opacity: googleLoading ? 0.6 : 1 },
              ]}>
              {googleLoading ? (
                <ActivityIndicator color={c.text} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color={c.text} />
                  <Text style={[styles.googleText, { color: c.text }]}>
                    {t('auth.continueWithGoogle')}
                  </Text>
                </>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  googleButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  googleText: { fontSize: 16, fontWeight: '600' },
  toggle: { alignItems: 'center', marginTop: Spacing.four },
  toggleText: { fontSize: 14, fontWeight: '500' },
});
