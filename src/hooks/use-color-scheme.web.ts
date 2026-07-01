// Continue is a dark-themed app (matches the design). Lock the scheme to dark
// on web too, so inputs and surfaces render with the dark palette regardless of
// the browser's prefers-color-scheme.
export function useColorScheme(): 'dark' {
  return 'dark';
}
