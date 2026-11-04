import coachmanPreset from "coachman-ui/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [coachmanPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./coachman-ui/src/**/*.{ts,tsx}"],
};
