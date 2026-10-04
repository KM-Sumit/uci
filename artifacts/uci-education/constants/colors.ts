/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#18344a',
    tint: '#d87735',

    // Core surfaces
    background: '#f7f5f0',
    foreground: '#18344a',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#18344a',

    // Primary action color (buttons, links, active states)
    primary: '#d87735',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#edf0ed',
    secondaryForeground: '#18344a',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#eeece6',
    mutedForeground: '#71808a',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#f6e8da',
    accentForeground: '#7b4728',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e4e1d9',
    input: '#d9d8d2',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
