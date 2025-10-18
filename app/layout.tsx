import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
	title: "Speed Type",
	description: "A typing speed test application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	// Main layout wrapper configured for static export with theme support
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<base href="./" />
			</head>
			<body>
				<ThemeProvider
					attribute="data-theme"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange={false}
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
