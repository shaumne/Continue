import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Spacing } from '@/constants/theme';

// Hand-drawn night scene approximating the design's hero illustration:
// gradient sky + stars + moon + city skyline + a seated figure and a cat.
const STARS = [
  [30, 30, 1.4], [70, 55, 1], [110, 24, 1.2], [160, 44, 0.9], [210, 28, 1.3],
  [250, 60, 1], [300, 34, 1.1], [340, 52, 1.4], [380, 26, 1], [55, 90, 0.9],
  [140, 80, 1], [230, 96, 1.1], [320, 82, 0.9], [370, 100, 1.2],
] as const;

export function HeroNight({ children }: { children?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#2A1E52', '#3B2A6B', '#6B4E8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 400 220"
        preserveAspectRatio="xMidYMid slice">
        {/* moon */}
        <Circle cx={330} cy={45} r={22} fill="#F4E9C1" opacity={0.9} />
        <Circle cx={322} cy={40} r={22} fill="#3B2A6B" opacity={0.5} />
        {/* stars */}
        {STARS.map(([cx, cy, r], i) => (
          <Circle key={i} cx={cx} cy={cy} r={r} fill="#ffffff" opacity={0.85} />
        ))}
        {/* city skyline silhouette */}
        <Path
          d="M0 200 L0 165 L24 165 L24 150 L48 150 L48 172 L80 172 L80 140 L96 140 L96 172 L130 172 L130 158 L150 158 L150 176 L200 176 L200 148 L216 148 L216 176 L260 176 L260 160 L286 160 L286 178 L330 178 L330 152 L350 152 L350 180 L400 180 L400 200 Z"
          fill="#1B1436"
          opacity={0.85}
        />
        {/* seated figure */}
        <Circle cx={250} cy={176} r={10} fill="#0E0A22" />
        <Path d="M234 210 Q250 182 266 210 Z" fill="#0E0A22" />
        {/* cat */}
        <Path d="M282 208 Q288 194 296 208 Z" fill="#0E0A22" />
        <Path d="M286 197 l2 -6 l3 5 Z" fill="#0E0A22" />
        <Rect x={294} y={198} width={3} height={10} fill="#0E0A22" />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  content: { padding: Spacing.four, flex: 1 },
});
