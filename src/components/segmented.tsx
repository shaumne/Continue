import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Colors, Spacing } from '@/constants/theme';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/**
 * Generic underline-style tab control (label + purple underline on the
 * active item). Used by the content Detail screen's Progress/Info/Notes/
 * Activity tabs; kept generic (typed by option value) so it can be reused
 * anywhere a small in-page tab switcher is needed.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const c = Colors.dark;
  return (
    <View
      style={[styles.row, { borderBottomColor: c.backgroundSelected }]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={styles.item}
            hitSlop={4}>
            <Text
              style={[
                styles.label,
                { color: active ? c.text : c.textSecondary, fontWeight: active ? '700' : '500' },
              ]}
              numberOfLines={1}>
              {opt.label}
            </Text>
            <View
              style={[styles.underline, { backgroundColor: active ? Brand.primary : 'transparent' }]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: 1 },
  item: { flex: 1, alignItems: 'center', paddingBottom: Spacing.two, gap: Spacing.two },
  label: { fontSize: 14 },
  underline: { height: 2, width: '60%', borderRadius: 1 },
});
