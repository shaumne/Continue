import { View } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

interface AstronautProps {
  /** Rendered width/height in px (the SVG viewBox is square). */
  size?: number;
}

/**
 * Small, self-contained astronaut mascot for the Wrapped hero card. Flat
 * shapes only (helmet, visor, suit, backpack, arms) — no external image
 * assets. Colors are intentionally hardcoded (same approach as
 * `hero-night.tsx`): this illustration sits on its own purple gradient
 * card, not the app's themed surfaces, so it doesn't take theme tokens.
 */
export function Astronaut({ size = 72 }: AstronautProps) {
  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Astronaut mascot">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* backpack */}
        <Rect x="33" y="48" width="34" height="32" rx="9" fill="#C9CEDA" />
        {/* left arm */}
        <Rect x="13" y="50" width="16" height="20" rx="8" fill="#F3F5F9" />
        {/* right arm, raised in a wave */}
        <Rect
          x="70"
          y="34"
          width="16"
          height="20"
          rx="8"
          fill="#F3F5F9"
          transform="rotate(-35 78 44)"
        />
        {/* body/suit */}
        <Rect x="25" y="44" width="50" height="40" rx="19" fill="#F3F5F9" />
        {/* chest badge */}
        <Circle cx="50" cy="62" r="7" fill="#7C5CFC" />
        {/* helmet */}
        <Circle cx="50" cy="34" r="25" fill="#F3F5F9" />
        <Circle cx="50" cy="34" r="25" fill="none" stroke="#C9CEDA" strokeWidth="2" />
        {/* visor */}
        <Ellipse cx="50" cy="35" rx="17" ry="14" fill="#4C3AA8" />
        {/* visor reflection */}
        <Ellipse cx="43" cy="29" rx="4.5" ry="5.5" fill="#ffffff" opacity="0.55" />
      </Svg>
    </View>
  );
}
