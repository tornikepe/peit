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
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
        accent: "#a855f7",
        muted: "#6b7280",
      },
      fontFamily: {
        sans: ["Inter", "BPG Arial", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.3) 0%, transparent 60%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(168,85,247,0.04) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
