module.exports = {
	// PostCSS configuration for static export compatibility
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
		...(process.env.NODE_ENV === "production" && {
			cssnano: {
				preset: [
					"default",
					{
						discardComments: { removeAll: true },
					},
				],
			},
		}),
	},
};
