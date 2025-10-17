/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "export",
	reactStrictMode: true,
	trailingSlash: true,
	distDir: "out",
	assetPrefix: "./",
	images: {
		unoptimized: true,
	},
	compiler: {
		removeConsole: process.env.NODE_ENV === "production",
	},
	generateBuildId: () => "build",
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: false,
	},
};

module.exports = nextConfig;
