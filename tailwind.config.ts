import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Manrope", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "app-loading": {
          from: { transform: "translateX(-110%)" },
          to: { transform: "translateX(410%)" },
        },
        "alarm-flash": {
          "0%, 49%": { backgroundColor: "#DC2626" },
          "50%, 100%": { backgroundColor: "#7F1D1D" },
        },
        "logo-enter": {
          from: { opacity: "0", transform: "translateY(14px) scale(0.965)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "logo-halo": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "35%": { opacity: "0.55" },
          "100%": { opacity: "0", transform: "scale(1.08)" },
        },
        "ambient-drift": {
          from: { transform: "translate3d(-2%, 1%, 0)" },
          to: { transform: "translate3d(3%, -2%, 0)" },
        },
        "logo-shutter": {
          from: { opacity: "0.25", clipPath: "inset(0 50% round 28px)" },
          to: { opacity: "1", clipPath: "inset(0 0% round 28px)" },
        },
        "flag-reveal": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "route-draw": {
          "0%": { opacity: "0", strokeDasharray: "1", strokeDashoffset: "1" },
          "15%": { opacity: "1" },
          "100%": { opacity: "1", strokeDasharray: "1", strokeDashoffset: "0" },
        },
        "route-signal": {
          "0%": { strokeDasharray: "0 100", strokeDashoffset: "0" },
          "35%": { strokeDasharray: "24 76" },
          "100%": { strokeDasharray: "0 100", strokeDashoffset: "-100" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "app-loading": "app-loading 1.35s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "alarm-flash": "alarm-flash 1s step-end infinite",
        "logo-enter": "logo-enter 0.65s cubic-bezier(0.16, 1, 0.3, 1) both",
        "logo-halo": "logo-halo 2.6s ease-out 0.5s infinite",
        "ambient-drift": "ambient-drift 12s ease-in-out infinite alternate",
        "logo-shutter": "logo-shutter 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both",
        "flag-reveal": "flag-reveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        "route-draw": "route-draw 1.2s ease-out both",
        "route-signal": "route-signal 2.1s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
