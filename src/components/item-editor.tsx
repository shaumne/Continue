import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { saveProgress } from '@/api/library';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { LibraryItem } from '@/hooks/use-library';
import { queryClient } from '@/lib/query-client';
import type { ItemStatus } from '@/types/models';

const STATUSES: ItemStatus[] = ['backlog', 'started', 'paused', 'completed', 'dropped'];

function toNum(s: string): number | null {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export function ItemEditor({
  item,
  onClose,
}: {
  item: LibraryItem | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const [status, setStatus] = useState<ItemStatus>(item?.status ?? 'backlog');
  const [current, setCurrent] = useState(item?.progress_current?.toString() ?? '');
  const [total, setTotal] = useState(item?.progress_total?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!item?.content) return;
    setSaving(true);
    const { error } = await saveProgress({
      userItemId: item.id,
      contentItemId: item.content.id,
      status,
      progressCurrent: toNum(current),
      progressTotal: toNum(total),
    });
    setSaving(false);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      onClose();
    }
  }

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
          {item?.content?.title ?? ''}
        </Text>

        <Text style={[styles.label, { color: c.textSecondary }]}>
          {t('detail.statusLabel')}
        </Text>
        <View style={styles.chips}>
          {STATUSES.map((s) => {
            const active = s === status;
            return (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? Brand.primary : c.backgroundElement },
                ]}>
                <Text style={[styles.chipText, { color: active ? '#fff' : c.textSecondary }]}>
                  {t(`status.${s}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: c.textSecondary }]}>
          {t('detail.progressLabel')}
        </Text>
        <View style={styles.progressRow}>
          <TextInput
            value={current}
            onChangeText={setCurrent}
            placeholder={t('detail.current')}
            placeholderTextColor={c.textSecondary}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: c.backgroundElement, color: c.text }]}
          />
          <Text style={[styles.sep, { color: c.textSecondary }]}>/</Text>
          <TextInput
            value={total}
            onChangeText={setTotal}
            placeholder={t('detail.total')}
            placeholderTextColor={c.textSecondary}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: c.backgroundElement, color: c.text }]}
          />
        </View>

        <Pressable
          disabled={saving}
          onPress={onSave}
          style={[styles.save, { backgroundColor: Brand.primary, opacity: saving ? 0.6 : 1 }]}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>{t('common.save')}</Text>
          )}
        </Pressable>

        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: c.textSecondary }]}>{t('detail.close')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#0008' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: Spacing.two },
  label: { fontSize: 13, marginTop: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    textAlign: 'center',
  },
  sep: { fontSize: 18 },
  save: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeBtn: { alignItems: 'center', paddingVertical: Spacing.three },
  closeText: { fontSize: 14 },
});
