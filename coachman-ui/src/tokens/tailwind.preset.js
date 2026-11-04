/**
 * Coachman UI — Tailwind-preset.
 * Spiegelt tokens.css: elke waarde verwijst naar een CSS-variabele,
 * zodat dag/nacht automatisch meewisselt via data-mode.
 *
 * Gebruik:  presets: [coachmanPreset]
 *
 * Voorbeelden: bg-bg, bg-surface, bg-surface-2, border-line, text-ink,
 * text-muted, text-faint, bg-accent, text-on-accent, bg-accent-soft,
 * p-s-5, gap-s-3, rounded-md, shadow-1, text-label, font-mono,
 * duration-fast, ease-heavy, max-w-read.
 */
/** @param {string} name */
const v = (name) => `var(--${name})`;

/** @type {Partial<import("tailwindcss").Config>} */
const preset = {
  theme: {
    // Kleuren volledig vervangen: alleen tokens, geen Tailwind-palet.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      bg: v("bg"),
      surface: { DEFAULT: v("surface"), 2: v("surface-2") },
      line: v("line"),
      ink: v("text"),
      muted: v("text-muted"),
      faint: v("text-faint"),
      accent: {
        DEFAULT: v("accent"),
        hover: v("accent-hover"),
        soft: v("accent-soft"),
      },
      "on-accent": v("on-accent"),
      success: { DEFAULT: v("success"), soft: v("success-soft") },
      warning: { DEFAULT: v("warning"), soft: v("warning-soft") },
      danger: { DEFAULT: v("danger"), soft: v("danger-soft") },
      info: { DEFAULT: v("info"), soft: v("info-soft") },
      backdrop: v("backdrop"),
    },
    fontFamily: {
      display: v("font-display"),
      ui: v("font-ui"),
      sans: v("font-ui"),
      mono: v("font-mono"),
    },
    fontSize: {
      display: [
        v("text-display"),
        { lineHeight: v("text-display-lh"), letterSpacing: v("text-display-ls") },
      ],
      h1: [v("text-h1"), { lineHeight: v("text-h1-lh") }],
      h2: [v("text-h2"), { lineHeight: v("text-h2-lh"), fontWeight: "600" }],
      h3: [v("text-h3"), { lineHeight: v("text-h3-lh"), fontWeight: "600" }],
      body: [v("text-body"), { lineHeight: v("text-body-lh") }],
      small: [v("text-small"), { lineHeight: v("text-small-lh") }],
      label: [
        v("text-label"),
        { lineHeight: v("text-label-lh"), letterSpacing: v("text-label-ls"), fontWeight: "500" },
      ],
      mono: [v("text-mono"), { lineHeight: v("text-mono-lh") }],
    },
    borderRadius: {
      none: "0",
      sm: v("r-sm"),
      DEFAULT: v("r-md"),
      md: v("r-md"),
      lg: v("r-lg"),
      full: v("r-full"),
    },
    boxShadow: {
      none: "none",
      1: v("shadow-1"),
      2: v("shadow-2"),
      glow: v("accent-glow"),
    },
    extend: {
      spacing: {
        "s-1": v("s-1"),
        "s-2": v("s-2"),
        "s-3": v("s-3"),
        "s-4": v("s-4"),
        "s-5": v("s-5"),
        "s-6": v("s-6"),
        "s-7": v("s-7"),
        "s-8": v("s-8"),
        hit: v("hit-min"),
        "control-sm": v("control-sm"),
        "control-md": v("control-md"),
        "control-lg": v("control-lg"),
        "icon-ui": v("icon-ui"),
        "icon-nav": v("icon-nav"),
        sidebar: v("sidebar-w"),
        bottombar: v("bottombar-h"),
      },
      maxWidth: {
        read: v("w-read"),
        dashboard: v("w-dashboard"),
      },
      minHeight: { hit: v("hit-min") },
      minWidth: { hit: v("hit-min") },
      backdropBlur: { DEFAULT: v("backdrop-blur") },
      letterSpacing: {
        night: v("display-ls-extra"),
        display: v("text-display-ls"),
        label: v("text-label-ls"),
      },
      keyframes: {
        "cm-fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "cm-pop-in": {
          from: { opacity: "0", transform: "translateY(var(--s-2)) scale(0.98)" },
          to: { opacity: "1", transform: "none" },
        },
        "cm-sheet-in": {
          from: { transform: "translateY(100%)" },
          to: { transform: "none" },
        },
        "cm-toast-in": {
          from: { opacity: "0", transform: "translateY(var(--s-3))" },
          to: { opacity: "1", transform: "none" },
        },
        "cm-toast-in-top": {
          from: { opacity: "0", transform: "translateY(calc(var(--s-3) * -1))" },
          to: { opacity: "1", transform: "none" },
        },
        "cm-spin": { to: { transform: "rotate(360deg)" } },
        "cm-glow-pulse": {
          "0%": { boxShadow: "var(--accent-glow)" },
          "100%": { boxShadow: "none" },
        },
        "cm-shimmer": {
          from: { backgroundPosition: "150% 0" },
          to: { backgroundPosition: "-50% 0" },
        },
        "cm-indeterminate": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(300%)" },
        },
      },
      animation: {
        "fade-in": "cm-fade-in var(--dur-base) var(--ease) both",
        "pop-in": "cm-pop-in var(--dur-base) var(--ease) both",
        "sheet-in": "cm-sheet-in var(--dur-base) var(--ease) both",
        "toast-in": "cm-toast-in var(--dur-base) var(--ease) both",
        "toast-in-top": "cm-toast-in-top var(--dur-base) var(--ease) both",
        spin: "cm-spin 800ms linear infinite",
        "night-enter": v("display-enter"),
        "glow-pulse": "cm-glow-pulse var(--dur-slow) var(--ease) both",
        shimmer: "cm-shimmer 1600ms var(--ease) infinite",
        indeterminate: "cm-indeterminate 1400ms var(--ease) infinite",
      },
      borderColor: { DEFAULT: v("line") },
      transitionTimingFunction: {
        DEFAULT: v("ease"),
        heavy: v("ease-heavy"),
      },
      transitionDuration: {
        DEFAULT: v("dur-fast"),
        fast: v("dur-fast"),
        base: v("dur-base"),
        slow: v("dur-slow"),
        mode: v("dur-mode"),
      },
    },
  },
};

export default preset;
