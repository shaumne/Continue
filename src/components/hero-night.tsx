import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Spacing } from '@/constants/theme';

// Hand-drawn night scene approximating the design mockup's hero illustration:
// indigo -> purple -> magenta sky gradient, scattered stars, a city skyline
// with lit windows, and a boy sitting with a cat on a rooftop ledge.
// Colors are sampled from the mockup and are intentionally hardcoded here —
// this illustration sits on its own gradient, not the app's themed surfaces.
const STARS = [
  [30, 26, 1.3], [66, 50, 1], [112, 20, 1.1], [150, 40, 0.9], [205, 24, 1.2],
  [244, 52, 1], [288, 30, 1.3], [330, 46, 1], [360, 22, 1.1], [50, 78, 0.9],
  [130, 68, 1], [180, 84, 0.9], [230, 90, 1], [310, 76, 0.9], [370, 88, 1.1],
] as const;

const WINDOWS = [
  [20, 164], [62, 158], [100, 174], [154, 164], [210, 178], [268, 168], [336, 184],
] as const;

export function HeroNight({ children }: { children?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#03153F', '#221C68', '#5A2E8E', '#B24F8C', '#E97583']}
        locations={[0, 0.32, 0.55, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 400 220"
        preserveAspectRatio="xMidYMid slice">
        {/* stars */}
        {STARS.map(([cx, cy, r], i) => (
          <Circle key={`s-${i}`} cx={cx} cy={cy} r={r} fill="#ffffff" opacity={0.8} />
        ))}
        {/* one bright "wish" sparkle star, four-pointed */}
        <Path
          d="M220 47 L223 55 L231 58 L223 61 L220 69 L217 61 L209 58 L217 55 Z"
          fill="#ffffff"
          opacity={0.95}
        />

        {/* city skyline silhouette */}
        <Path
          d="M0 220 L0 176 L18 176 L18 158 L34 158 L34 182 L58 182 L58 150 L72 150 L72 182 L96 182 L96 168 L112 168 L112 188 L150 188 L150 156 L166 156 L166 188 L206 188 L206 172 L224 172 L224 190 L262 190 L262 162 L280 162 L280 192 L330 192 L330 178 L344 178 L344 196 L400 196 L400 220 Z"
          fill="#0A0A1E"
        />
        {/* tiny lit windows */}
        {WINDOWS.map(([x, y], i) => (
          <Rect key={`w-${i}`} x={x} y={y} width={2.4} height={3.2} fill="#FFC773" opacity={0.85} />
        ))}

        {/* rooftop ledge the boy & cat sit on */}
        <Rect x={228} y={196} width={172} height={6} fill="#0A0A1E" />

        {/* cat, seen from behind: haunches, ears, tail */}
        <Path d="M296 196 C296 184 306 178 312 178 C318 178 328 184 328 196 Z" fill="#0A0A1E" />
        <Path d="M300 180 L303 170 L307 179 Z" fill="#0A0A1E" />
        <Path d="M318 179 L322 170 L325 180 Z" fill="#0A0A1E" />
        <Path d="M328 194 C338 191 345 197 341 205 C337 210 330 206 328 200 Z" fill="#0A0A1E" />

        {/* boy, sitting cross-legged, seen from behind/side, hood up */}
        <Path
          d="M336 196 C336 172 352 156 368 156 C384 156 396 172 396 190 L396 196
             C392 202 388 206 380 208 L360 208 C348 208 340 204 336 196 Z"
          fill="#0A0A1E"
        />
        {/* boy's raised knee */}
        <Path d="M346 197 C344 187 351 181 359 183 C365 185 365 195 358 199 Z" fill="#0A0A1E" />
        {/* stray hair strands */}
        <Path d="M368 156 L364 148 L370 152 L374 146 L378 154 Z" fill="#0A0A1E" />
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
