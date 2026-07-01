// Side-effect / module imports for stylesheets used by the Expo template
// (global.css, *.module.css). Keeps `tsc --noEmit` clean.
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
