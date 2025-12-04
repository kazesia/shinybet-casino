/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        'tap': '44px', // Minimum tap target size
        'tap-sm': '36px',
        'tap-lg': '56px',
      },
      minHeight: {
        'tap': '44px',
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      minWidth: {
        'tap': '44px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#1475e1",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#1a2c38",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#b1bad3",
          foreground: "#b1bad3",
        },
        accent: {
          DEFAULT: "#213743",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#1a2c38",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#1a2c38",
          foreground: "#ffffff",
        },
        // Admin Specific Palette
        admin: {
          bg: "#05070A",       // Main Background
          surface: "#0D1016",  // Card/Sidebar Background
          accent: "#F59E0B",   // Gold Accent
          border: "#1F2937",   // Dark Border
        },
        // Legacy/App Palette
        stake: {
          dark: "#0f212e",
          card: "#1a2c38",
          hover: "#213743",
          text: "#b1bad3",
          white: "#ffffff",
          blue: "#1475e1",
          green: "#00e701",
          vip: "#b17827",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        // Mobile-first font sizes
        'xs-mobile': ['0.75rem', { lineHeight: '1rem' }],
        'sm-mobile': ['0.875rem', { lineHeight: '1.25rem' }],
        'base-mobile': ['1rem', { lineHeight: '1.5rem' }],
        'lg-mobile': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl-mobile': ['1.25rem', { lineHeight: '1.75rem' }],
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
        "slide-in-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-out-bottom": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
        "slide-out-bottom": "slide-out-bottom 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      screens: {
        'xs': '475px',
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Add custom utilities
    function ({ addUtilities }) {
      addUtilities({
        '.tap-target': {
          'min-width': '44px',
          'min-height': '44px',
        },
        '.tap-target-sm': {
          'min-width': '36px',
          'min-height': '36px',
        },
        '.tap-target-lg': {
          'min-width': '56px',
          'min-height': '56px',
        },
        '.safe-area-inset': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.safe-area-pb': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-area-pt': {
          'padding-top': 'env(safe-area-inset-top)',
        },
      });
    },
  ],
}
