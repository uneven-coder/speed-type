"use client";
import React, { JSX, useEffect, useState } from "react";

interface TypingAreaProps {
	functionalQuote: string[];
	typedText: string;
}

interface TypingStats {
	currentLine: number;
	isComplete: boolean;
}

function useLineTracking(
	typedText: string,
	functionalQuote: string[],
): TypingStats {
	// Track current line position and completion status
	const [currentLine, setCurrentLine] = useState(0);
	const isComplete = typedText.length >= functionalQuote.length;

	useEffect(() => {
		// Calculate line positions for each character span
		const container = document.querySelector("p");
		const spans = container?.querySelectorAll("span");

		if (!spans) return;

		let currentTop: number | null = null;
		let lineIndex = 0;

		spans.forEach((span) => {
			// Assign line numbers based on vertical position
			const rect = span.getBoundingClientRect();
			if (currentTop === null) currentTop = rect.top;

			if (Math.abs(rect.top - currentTop) > 1) {
				// New line detected
				lineIndex++;
				currentTop = rect.top;
			}
			span.setAttribute("data-line", String(lineIndex));
		});

		// Update current line based on typing position
		const currentCharIndex = typedText.length;
		if (currentCharIndex < spans.length) {
			// Use current character position
			const newCurrentLine = Number(
				spans[currentCharIndex].getAttribute("data-line") || "0",
			);
			setCurrentLine(newCurrentLine);
		} else if (spans.length > 0) {
			// Use last line if typed past end
			const lastLineNumber = Number(
				spans[spans.length - 1].getAttribute("data-line") || "0",
			);
			setCurrentLine(lastLineNumber);
		}
	}, [typedText, functionalQuote]);

	return { currentLine, isComplete };
}

function useScrollAndFade(currentLine: number, typedText: string): void {
	// Handle scrolling and opacity effects for typing lines
	useEffect(() => {
		// Scroll current line into view and apply fade effects
		const active = document.querySelector(`span[data-line="${currentLine}"]`);
		if (active) active.scrollIntoView({ block: "center", behavior: "smooth" });

		const allSpans = document.querySelectorAll("span");
		allSpans.forEach((span) => {
			// Apply opacity based on distance from current line
			const line = Number(span.getAttribute("data-line"));

			if (line < currentLine) span.style.opacity = "0.05";
			else if (line === currentLine) span.style.opacity = "1";
			else {
				// Gradual fade for lines below cursor
				const distance = line - currentLine;
				const opacity = Math.max(0.05, 1 - distance * 0.3);
				span.style.opacity = String(opacity);
			}
		});
	}, [currentLine, typedText]);
}

function renderCharacterComparison(
	functionalQuote: string[],
	typedText: string,
): JSX.Element[] {
	// Create character-by-character comparison elements
	let quotePointer = 0;
	let typedPointer = 0;
	const elements: JSX.Element[] = [];

	// Compare typed characters with expected characters
	while (
		quotePointer < functionalQuote.length &&
		typedPointer < typedText.length
	) {
		// Process each typed character
		const quoteChar = functionalQuote[quotePointer];
		const typedChar = typedText[typedPointer];
		const isMatch = quoteChar === typedChar;

		elements.push(
			<span
				key={typedPointer}
				className={`relative ${isMatch ? "text-[var(--text)]" : "text-[var(--incorectWord)]"}`}
			>
				{!isMatch ? (typedChar === " " ? "_" : typedChar) : typedChar}
				{!isMatch && (
					<em className="absolute -top-10 left-0 text-[var(--fadedText)] z-10">
						{quoteChar === " " ? "_" : quoteChar}
					</em>
				)}
			</span>,
		);

		quotePointer++;
		typedPointer++;
	}

	// Add remaining untyped characters
	if (quotePointer < functionalQuote.length) {
		// Show remaining characters to be typed
		for (; quotePointer < functionalQuote.length; quotePointer++) {
			// Mark current position and remaining text
			const isCurrentChar = quotePointer === typedText.length;
			elements.push(
				<span
					key={`remaining-${quotePointer}`}
					className={`${isCurrentChar ? "cursor" : ""} text-[var(--fadedText)]`}
				>
					{functionalQuote[quotePointer]}
				</span>,
			);
		}
	}

	return elements;
}

function TypingArea({ functionalQuote, typedText }: TypingAreaProps) {
	// Main typing display component with character comparison
	const { currentLine } = useLineTracking(typedText, functionalQuote);
	useScrollAndFade(currentLine, typedText);

	const characterElements = renderCharacterComparison(
		functionalQuote,
		typedText,
	);

	return (
		<p className="text-[var(--text)] text-6xl font-mono">{characterElements}</p>
	);
}

function useTypingInput(
	quote: string[],
	onReset: () => void,
): [string, string] {
	// Handle keyboard input and typing state management
	const [typedText, setTypedText] = useState<string>("");
	const [lastTyped, setLastTyped] = useState<string>("");

	const isValidChar = (key: string): boolean =>
		/^[A-Za-z.']+$/.test(key) || key === " ";

	useEffect(() => {
		// Process keyboard events for typing input
		const handleKeyPress = (e: KeyboardEvent) => {
			// Handle user keyboard input
			const quoteText = quote.join(" ");

			// Prevent space bar from scrolling page
			if (e.key === " ") e.preventDefault();

			if (typedText.length >= quoteText.length) {
				// Handle completion state
				if (e.ctrlKey && e.key === "Enter") {
					// Reset on Ctrl+Enter when complete
					onReset();
					setTypedText("");
					setLastTyped("");
				}
			} else {
				// Handle active typing state
				if ((isValidChar(e.key) && e.key.length === 1) || e.key === " ") {
					// Add valid character
					setTypedText((prev) => prev + e.key);
					setLastTyped(e.key);
				} else if (e.key === "Backspace") {
					// Remove last character
					setTypedText((prev) => prev.slice(0, -1));
					setLastTyped("Backspace");
				}
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [typedText, quote, onReset]);

	return [typedText, lastTyped];
}

export default function Home() {
	// Main typing test application component
	const [quote, setQuote] = useState<string[]>(
		"Your problem is you spent your whole life thinking there are rules. There aren't.".split(
			" ",
		),
	);
	const [functionalQuote, setFunctionalQuote] = useState<string[]>([]);

	const resetQuote = (): void => {
		// Reset to default quote for new test
		setQuote(
			"Your problem is you spent your whole life thinking there are rules. There aren't.".split(
				" ",
			),
		);
	};

	const [typedText, lastTyped] = useTypingInput(quote, resetQuote);

	useEffect(() => {
		// Convert quote array to character array for comparison
		setFunctionalQuote(quote.join(" ").split(""));
	}, [quote]);

	return (
		<div className="font-sans min-h-screen flex flex-col gap-4 p-10">
			<div className="flex-1 w-full rounded-2xl p-4 flex items-center justify-center">
				<TypingArea functionalQuote={functionalQuote} typedText={typedText} />
			</div>
			<aside className="h-70 rounded-2xl bg-[var(--background)] border-solid border-[var(--accent)] border-8">
				<p className="text-[var(--text)] text-6xl">
					{lastTyped === " " ? "space" : lastTyped}
				</p>
			</aside>
		</div>
	);
}
