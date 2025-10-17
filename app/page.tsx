"use client";
import { useTheme } from "next-themes";
import {
	type Dispatch,
	type JSX,
	type SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import "./globals.css";

interface TypingAreaProps {
	functionalQuote: string[];
	typedText: string;
	onAreaClick: () => void;
}

interface TypingStats {
	currentLine: number;
	isComplete: boolean;
	startTime: number | null;
	wpm: number;
	progress: number;
}

interface StatsDisplayProps {
	lastTyped: string;
	progress: number;
	wpm: number;
	fastestWpm: number;
	isComplete: boolean;
	onReset?: () => void;
}

const QUOTES = [
	"Your problem is you spent your whole life thinking there are rules. There aren't.",
	"The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
	"Innovation distinguishes between a leader and a follower. Stay hungry, stay foolish.",
	"Life is what happens to you while you're busy making other plans. Embrace the unexpected.",
	"The future belongs to those who believe in the beauty of their dreams. Never give up.",
	"Success is not final, failure is not fatal: it is the courage to continue that counts.",
	"It is during our darkest moments that we must focus to see the light. Stay strong.",
	"The way to get started is to quit talking and begin doing. Action speaks louder than words.",
	"Don't let yesterday take up too much of today. Focus on what matters now.",
	"You learn more from failure than from success. Don't let it stop you; failure builds character.",
	"Programs must be written for people to read, and only incidentally for machines to execute. — Harold Abelson",
	"Talk is cheap. Show me the code. — Linus Torvalds",
	"Simplicity is the soul of efficiency. — Austin Freeman",
	"Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler",
	"Experience is the name everyone gives to their mistakes. — Oscar Wilde",
	"Before software can be reusable it first has to be usable. — Ralph Johnson",
	"Programming isn't about what you know; it's about what you can figure out. — Chris Pine",
];

const WPM_STORAGE_KEY = "speedtype_fastest_wpm";

function getRandomQuote(): string[] {
	const randomIndex = Math.floor(Math.random() * QUOTES.length);
	return QUOTES[randomIndex].split(" ");
}

function getFastestWpm(): number {
	if (typeof window === "undefined") return 0;

	const stored = localStorage.getItem(WPM_STORAGE_KEY);
	return stored ? parseFloat(stored) : 0;
}

function saveFastestWpm(wpm: number): void {
	if (typeof window === "undefined") return;

	localStorage.setItem(WPM_STORAGE_KEY, wpm.toString());
}

function calculateWpm(typedText: string, startTime: number | null): number {
	if (!startTime || typedText.length === 0) return 0;

	const timeElapsed = (Date.now() - startTime) / 1000 / 60;
	const wordsTyped = typedText.split(" ").length - (typedText.endsWith(" ") ? 0 : 1);

	return timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
}

function assignLineNumbers(spans: NodeListOf<Element>): void {
	// Assign line numbers to spans based on their vertical position
	let currentTop: number | null = null;
	let lineIndex = 0;

	for (const span of spans) {
		// Check vertical position and assign line numbers
		const rect = span.getBoundingClientRect();

		if (currentTop === null) currentTop = rect.top;

		if (Math.abs(rect.top - currentTop) > 1) {
			// New line detected
			lineIndex++;
			currentTop = rect.top;
		}
		span.setAttribute("data-line", String(lineIndex));
	}
}

function updateCurrentLine(
	typedText: string,
	spans: NodeListOf<Element>,
	setCurrentLine: (line: number) => void,
): void {
	// Update the current line based on typed text position
	const currentCharIndex = typedText.length;

	if (currentCharIndex < spans.length) {
		// Set line based on current character position
		const newCurrentLine = Number(spans[currentCharIndex].getAttribute("data-line") || "0");
		setCurrentLine(newCurrentLine);
	} else if (spans.length > 0) {
		// Use last line when typing is complete
		const lastLineNumber = Number(spans[spans.length - 1].getAttribute("data-line") || "0");
		setCurrentLine(lastLineNumber);
	}
}

function useLineTracking(typedText: string, functionalQuote: string[]): TypingStats {
	// Track current line and typing progress
	const [currentLine, setCurrentLine] = useState(0);
	const [startTime, setStartTime] = useState<number | null>(null);

	const isComplete = typedText.length >= functionalQuote.length;
	const progress =
		functionalQuote.length > 0 ? (typedText.length / functionalQuote.length) * 100 : 0;
	const wpm = useMemo(() => calculateWpm(typedText, startTime), [typedText, startTime]);

	useEffect(() => {
		// Start timing when first character is typed
		if (typedText.length === 1 && !startTime) setStartTime(Date.now());
	}, [typedText.length, startTime]);

	useEffect(() => {
		// Update line tracking when text changes
		const container = document.querySelector(".typing-container");
		const spans = container?.querySelectorAll("span");

		if (!spans) return;

		assignLineNumbers(spans);
		updateCurrentLine(typedText, spans, setCurrentLine);
	}, [typedText]);

	return { currentLine, isComplete, startTime, wpm, progress };
}

function useScrollAndFade(currentLine: number): void {
	useEffect(() => {
		const active = document.querySelector(`span[data-line="${currentLine}"]`);

		if (active) {
			const container = document.querySelector(".typing-container");
			if (container) {
				const containerRect = container.getBoundingClientRect();
				const activeRect = active.getBoundingClientRect();
				const scrollTop = container.scrollTop;
				const targetPosition =
					scrollTop + activeRect.top - containerRect.top - containerRect.height / 2;

				container.scrollTo({ top: targetPosition, behavior: "smooth" });
			}
		}

		const allSpans = document.querySelectorAll("span");
		for (const span of allSpans) {
			const line = Number(span.getAttribute("data-line"));

			if (line < currentLine) span.style.opacity = "0.2";
			else if (line === currentLine) span.style.opacity = "1";
			else {
				const distance = line - currentLine;
				const opacity = Math.max(0.05, 1 - distance * 0.6);
				span.style.opacity = String(opacity);
			}
		}
	}, [currentLine]);
}

function createCharacterElements(functionalQuote: string[], typedText: string): JSX.Element[] {
	const elements: JSX.Element[] = [];
	const minLength = Math.min(functionalQuote.length, typedText.length);

	for (let i = 0; i < minLength; i++) {
		const typedChar = typedText[i];
		const quoteChar = functionalQuote[i];
		const isMatch = quoteChar === typedChar;
		const displayChar = !isMatch ? (typedChar === " " ? "_" : typedChar) : typedChar;

		elements.push(
			<span
				key={i}
				className={`relative ${isMatch ? "text-[var(--text)]" : "text-[var(--incorectWord)]"}`}
			>
				{displayChar}
				{!isMatch && (
					<em
						className="absolute left-0 z-10 text-[var(--fadedText)] not-italic leading-none"
						style={{ top: "-0.9em", fontSize: "0.9em" }}
					>
						{quoteChar === " " ? "_" : quoteChar}
					</em>
				)}
			</span>,
		);
	}

	for (let i = minLength; i < functionalQuote.length; i++) {
		// the rest of the charaters
		const isCurrentChar = i === typedText.length;
		elements.push(
			<span
				key={`remaining-${i}`}
				className={`${isCurrentChar ? "cursor" : ""} text-[var(--fadedText)]`}
			>
				{functionalQuote[i]}
			</span>,
		);
	}

	return elements;
}

function useViewportHeight(): void {
	// Track actual visible viewport height accounting for soft keyboard and adjust layout
	useEffect(() => {
		function updateHeight(): void {
			const visualViewport = window.visualViewport;
			const height = visualViewport ? visualViewport.height : window.innerHeight;
			const width = window.innerWidth;
			const footer = document.querySelector(".stats-footer");
			const footerHeight = footer ? footer.getBoundingClientRect().height : 0;

			const isKeyboardVisible = window.innerHeight - height > 150;
			const isSmallScreen = width < 380 || height < 500;

			document.documentElement.style.setProperty("--viewport-height", `${height}px`);
			document.documentElement.style.setProperty(
				"--typing-area-height",
				`${height - footerHeight}px`,
			);

			if (isKeyboardVisible) {
				document.documentElement.setAttribute("data-keyboard-visible", "true");
			} else {
				document.documentElement.removeAttribute("data-keyboard-visible");
			}

			if (isSmallScreen) {
				document.documentElement.setAttribute("data-small-screen", "true");
			} else {
				document.documentElement.removeAttribute("data-small-screen");
			}
		}

		updateHeight();
		window.visualViewport?.addEventListener("resize", updateHeight);
		window.visualViewport?.addEventListener("scroll", updateHeight);
		window.addEventListener("resize", updateHeight);

		return () => {
			window.visualViewport?.removeEventListener("resize", updateHeight);
			window.visualViewport?.removeEventListener("scroll", updateHeight);
			window.removeEventListener("resize", updateHeight);
		};
	}, []);
}

function useHorizontalScroll(typedText: string, _quote: string[], isComplete: boolean): void {
	useEffect(() => {
		const isSmallScreen = document.documentElement.hasAttribute("data-small-screen");
		const isKeyboardVisible = document.documentElement.hasAttribute("data-keyboard-visible");
		const container = document.querySelector(".typing-container");
		if (!container) return;
		const textElement = container.querySelector("p");
		if (!textElement) return;

		if (isComplete) {
			textElement.style.transform = "";
			textElement.style.transition = "";
			textElement.style.textAlign = "";
			return;
		}

		if (!isSmallScreen || !isKeyboardVisible) {
			textElement.style.transform = "";
			textElement.style.transition = "";
			textElement.style.textAlign = "";
			return;
		}

		textElement.style.textAlign = "left";
		const currentIndex = typedText.length;
		const spans = container?.querySelectorAll("span");

		if (spans && currentIndex < spans.length) {
			const currentSpan = spans[currentIndex];
			const containerWidth = container.getBoundingClientRect().width;
			const spanRect = currentSpan.getBoundingClientRect();
			const textRect = textElement.getBoundingClientRect();

			const charOffsetFromTextStart = spanRect.left - textRect.left;
			const targetOffset = containerWidth / 2 - charOffsetFromTextStart - spanRect.width / 2;

			textElement.style.transform = `translateX(${targetOffset}px)`;
			textElement.style.transition = "transform 0.3s ease-out";
		} else if (typedText.length === 0) textElement.style.transform = "translateX(0)";
	}, [typedText, isComplete]);
}

function handleKeyDown(
	e: KeyboardEvent,
	typedText: string,
	quote: string[],
	onReset: () => void,
	setTypedText: Dispatch<SetStateAction<string>>,
	setLastTyped: (key: string) => void,
	isValidChar: (key: string) => boolean,
): void {
	// Handle keyboard input for typing
	const quoteText = quote.join(" ");

	if (e.key === " ") e.preventDefault();

	if (typedText.length >= quoteText.length) {
		// Handle completion state
		if (e.ctrlKey && e.key === "Enter") {
			// Reset on Ctrl+Enter
			onReset();
			setTypedText("");
			setLastTyped("");
		}
	} else {
		// Handle normal typing
		if ((isValidChar(e.key) && e.key.length === 1) || e.key === " ") {
			// Add valid characters
			setTypedText((prev) => prev + e.key);
			setLastTyped(e.key);
		} else if (e.key === "Backspace") {
			// Handle backspace
			setTypedText((prev) => prev.slice(0, -1));
			setLastTyped("Backspace");
		}
	}
}

function useTypingInput(quote: string[], onReset: () => void): [string, string, TypingStats] {
	// Manage typing input and statistics
	const [typedText, setTypedText] = useState<string>("");
	const [lastTyped, setLastTyped] = useState<string>("");

	const functionalQuote = useMemo(() => quote.join(" ").split(""), [quote]);
	const stats = useLineTracking(typedText, functionalQuote);
	const isValidChar = useCallback(
		(key: string): boolean => /^[A-Za-z.,;:'"!? -]+$/.test(key) || key === " ",
		[],
	);

	useEffect(() => {
		// Set up keyboard event listener
		function handleKeyPress(e: KeyboardEvent): void {
			// Delegate to extracted handler function
			handleKeyDown(e, typedText, quote, onReset, setTypedText, setLastTyped, isValidChar);
		}

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [typedText, quote, onReset, isValidChar]);

	return [typedText, lastTyped, stats];
}

function TypingArea({ functionalQuote, typedText, onAreaClick }: TypingAreaProps): JSX.Element {
	// Main typing interface component
	const { currentLine } = useLineTracking(typedText, functionalQuote);
	const inputRef = useRef<HTMLInputElement>(null);
	useScrollAndFade(currentLine);
	const isComplete = typedText.length >= functionalQuote.length;
	useHorizontalScroll(typedText, functionalQuote, isComplete);

	const characterElements = useMemo(
		() => createCharacterElements(functionalQuote, typedText),
		[functionalQuote, typedText],
	);

	const handleClick = (): void => {
		// Focus input and trigger callback
		inputRef.current?.focus();
		onAreaClick();
	};

	const handleKeyDown = (e: React.KeyboardEvent): void => {
		// Handle keyboard events for accessibility
		if (e.key === "Enter" || e.key === " ") {
			// Activate on Enter or Space
			e.preventDefault();
			handleClick();
		}
	};

	return (
		<button
			type="button"
			className="typing-container"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			tabIndex={0}
		>
			<input
				ref={inputRef}
				type="text"
				className="pointer-events-none absolute opacity-0"
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				spellCheck="false"
				inputMode="text"
				onFocus={() => window.scrollTo(0, 0)}
			/>
			<p className="font-mono text-[var(--text)]">{characterElements}</p>
		</button>
	);
}

function StatCard({
	label,
	value,
	color = "text-[var(--text)]",
}: {
	label: string;
	value: string | number;
	color?: string;
}): JSX.Element {
	return (
		<div className="flex flex-col items-center justify-center gap-0.5">
			<h3 className="text-[0.55rem] text-[var(--accent)] leading-none sm:text-xs md:text-sm lg:text-lg">
				{label}
			</h3>
			<p className={`font-mono text-xs sm:text-base md:text-xl lg:text-2xl ${color} leading-none`}>
				{value}
			</p>
		</div>
	);
}

function StatsDisplay({
	lastTyped,
	progress,
	wpm,
	fastestWpm,
	isComplete,
	onReset,
}: StatsDisplayProps): JSX.Element {
	// Display typing statistics and controls
	const { theme, setTheme } = useTheme();
	const [isMobile, setIsMobile] = useState<boolean>(false);
	const toggleTheme = (): void => setTheme(theme === "dark" ? "light" : "dark");

	useEffect(() => {
		// Check for mobile viewport
		const checkMobile = (): void => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return (
		<div className="w-full rounded-md border border-[var(--accent)] bg-[var(--foreground)] px-1.5 py-1 sm:rounded-lg sm:border-2 sm:p-2 md:rounded-2xl md:border-4 md:p-3 lg:p-4">
			<div className="grid grid-cols-3 gap-x-1 gap-y-0.5 sm:grid-cols-5 sm:gap-1.5 md:gap-2 lg:gap-4">
				<StatCard label="Last Key" value={lastTyped === " " ? "space" : lastTyped || "—"} />
				<StatCard label="Progress" value={`${progress.toFixed(1)}%`} />
				<StatCard label="Current WPM" value={wpm} />
				<StatCard label="Best WPM" value={fastestWpm} color="text-[var(--correctedWord)]" />

				{onReset && (
					<div className="flex flex-col items-center justify-center gap-0.5">
						<h3
							className={`${isMobile ? "text-[0.55rem]" : "text-xs md:text-sm lg:text-lg"} text-[var(--accent)] leading-none`}
						>
							Reset
						</h3>
						<button
							type="button"
							onClick={isComplete ? onReset : undefined}
							disabled={!isComplete}
							className={`rounded-md border-2 border-[var(--accent)] bg-[var(--background)] px-2 py-1 font-semibold text-[var(--text)] text-sm leading-none md:rounded-lg md:border-4 md:px-4 md:py-2 md:text-base ${
								isComplete
									? "cursor-pointer transition-colors hover:bg-[var(--accent)] hover:text-[var(--background)]"
									: "cursor-not-allowed opacity-50"
							}`}
							aria-label="Reset quote"
						>
							{isMobile ? "New" : "New Quote"}
						</button>
					</div>
				)}

				<div className="flex flex-col items-center justify-center gap-0.5">
					<h3 className="text-[0.55rem] text-[var(--accent)] leading-none sm:text-xs md:text-sm lg:text-lg">
						Theme
					</h3>
					<button
						type="button"
						onClick={toggleTheme}
						className="rounded-md border-2 border-[var(--accent)] bg-[var(--background)] px-2 py-1 font-semibold text-[var(--text)] text-sm leading-none md:rounded-lg md:border-4 md:px-4 md:py-2 md:text-base"
						aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
					>
						{theme === "dark" ? "Light" : "Dark"}
					</button>
				</div>
			</div>
		</div>
	);
}

export default function Home(): JSX.Element {
	// Main application component
	const [quote, setQuote] = useState<string[]>(() => getRandomQuote());
	const [fastestWpm, setFastestWpm] = useState<number>(0);
	const [isMounted, setIsMounted] = useState<boolean>(false);

	const functionalQuote = useMemo(() => quote.join(" ").split(""), [quote]);
	const resetQuote = useCallback((): void => setQuote(getRandomQuote()), []);
	const [typedText, lastTyped, stats] = useTypingInput(quote, resetQuote);

	useViewportHeight();

	useEffect(() => {
		// Initialize component state
		setIsMounted(true);
		setFastestWpm(getFastestWpm());
	}, []);

	useEffect(() => {
		// Update fastest WPM when completed
		if (stats.isComplete && stats.wpm > fastestWpm) {
			// Save new record
			setFastestWpm(stats.wpm);
			saveFastestWpm(stats.wpm);
		}
	}, [stats.isComplete, stats.wpm, fastestWpm]);

	useEffect(() => {
		// Mark completion state for layout adjustments
		if (stats.isComplete) document.documentElement.setAttribute("data-typing-complete", "true");
		else document.documentElement.removeAttribute("data-typing-complete");
	}, [stats.isComplete]);

	if (!isMounted) return <div className="min-h-screen bg-[var(--background)]" />;

	return (
		<div className="app-container flex flex-col overflow-hidden bg-[var(--background)] font-sans antialiased">
			<div className="typing-wrapper">
				<div className="h-full w-full overflow-hidden rounded-md md:rounded-lg lg:rounded-2xl">
					<TypingArea
						functionalQuote={functionalQuote}
						typedText={typedText}
						onAreaClick={() => window.focus()}
					/>
				</div>
			</div>

			<footer className="stats-footer">
				<StatsDisplay
					lastTyped={lastTyped}
					progress={stats.progress}
					wpm={stats.wpm}
					fastestWpm={fastestWpm}
					isComplete={stats.isComplete}
					onReset={resetQuote}
				/>
			</footer>
		</div>
	);
}
