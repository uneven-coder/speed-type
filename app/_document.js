import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
	// Custom document for theme initialization
	return (
		<Html>
			<Head>
				<script src="/theme-init.js" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
