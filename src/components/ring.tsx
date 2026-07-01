import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors } from '@/constants/theme';

interface RingProps {
  size: number;
  strokeWidth: number;
  /** 0..1 */
  progress: number;
  color: string;
  trackColor?: string;
  children?: ReactNode;
  /** Accessible description, e.g. "Level 4, 62% to next level". */
  accessibilityLabel?: string;
}

/**
 * Single-value progress ring, used for streak/level progress. Pure
 * presentational component — no data fetching.
 */
export function Ring({
  size,
  strokeWidth,
  progress,
  color,
  trackColor,
  children,
  accessibilityLabel,
}: RingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const dash = clamped * circumference;

  return (
    <View
      style={{ width: size, height: size }}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'progressbar' : undefined}
      accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size} style={styles.rotate}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? Colors.dark.backgroundElement}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {children ? <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rotate: { transform: [{ rotate: '-90deg' }] },
  center: { alignItems: 'center', justifyContent: 'center' },
});
