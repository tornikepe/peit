import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#07070f",
        "bg-card": "rgba(255,255,255,0.04)",
        "bg-card-hover": "rgba(255,255,255,0.07)",
        border: "rgba(255,255,255,0.08)",
        primary: "#2563eb",
        "primary-hover": "#1e40af",
        accent: "#0ea5e9",
        muted: "#6b7280",
      },
      fontFamily: {
        sans: ["Inter", "BPG Arial", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235,0.3) 0%, transparent 60%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(37, 99, 235,0.08) 0%, rgba(14, 165, 233,0.04) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
