import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				mono: [
					"ui-monospace",
					"SFMono-Regular",
					"Monaco",
					"Consolas",
					"Liberation Mono",
					"Courier New",
					"monospace",
				],
				sans: ["Arial", "Helvetica", "sans-serif"],
			},
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
				text: "var(--text)",
				fadedText: "var(--fadedText)",
				accent: "var(--accent)",
				correctedWord: "var(--correctedWord)",
				incorrectWord: "var(--incorectWord)",
				highlightedText: "var(--hilightedText)",
			},
		},
	},
	plugins: [],
};

export default config;
