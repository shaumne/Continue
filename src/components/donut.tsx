import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors } from '@/constants/theme';

export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutProps {
  size: number;
  strokeWidth: number;
  segments: DonutSegment[];
  center?: ReactNode;
  /** Accessible description of the whole chart, e.g. a summary of the totals. */
  accessibilityLabel?: string;
}

/**
 * Reusable donut/pie chart. Each segment is drawn as a stroked arc on a
 * shared circle (rotated so the first segment starts at 12 o'clock).
 * Pure presentational component — no data fetching.
 */
export function Donut({ size, strokeWidth, segments, center, accessibilityLabel }: DonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  let cumulative = 0;

  return (
    <View
      style={{ width: size, height: size }}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size} style={styles.rotate}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.dark.backgroundElement}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {total > 0
          ? segments.map((segment, index) => {
              const fraction = segment.value / total;
              const dash = fraction * circumference;
              const dashOffset = -cumulative * circumference;
              cumulative += fraction;
              return (
                <Circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={dashOffset}
                  fill="none"
                />
              );
            })
          : null}
      </Svg>
      {center ? <View style={[StyleSheet.absoluteFill, styles.center]}>{center}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rotate: { transform: [{ rotate: '-90deg' }] },
  center: { alignItems: 'center', justifyContent: 'center' },
});
