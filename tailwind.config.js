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
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
