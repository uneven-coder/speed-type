(() => {
	try {
		const stored =
			localStorage.getItem("speedtype_theme") ||
			(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
		document.documentElement.setAttribute("data-theme", stored);
	} catch (_e) {
		document.documentElement.setAttribute("data-theme", "dark");
	}
})();
