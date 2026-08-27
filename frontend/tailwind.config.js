/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                graphx: {
                    dark: "#0a0f1d",
                    card: "#111827",
                    surface: "#1e293b",
                    border: "#334155",
                    cyan: "#06b6d4",
                    blue: "#3b82f6",
                    purple: "#8b5cf6",
                    pink: "#ec4899",
                    emerald: "#10b981",
                    amber: "#f59e0b",
                },
            },
            fontFamily: {
                mono: ["Fira Code", "JetBrains Mono", "Consolas", "monospace"],
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
            },
            animation: {
                "glow-pulse": "glow 3s ease-in-out infinite",
            },
            keyframes: {
                glow: {
                    "0%, 100%": { opacity: "0.4" },
                    "50%": { opacity: "0.8" },
                },
            },
        },
    },
    plugins: [],
};
