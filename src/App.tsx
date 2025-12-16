import { useCallback, useEffect, useId, useRef } from "react";
import {
	useRive,
	Alignment,
	Fit,
	Layout,
	type StateMachineInput,
} from "@rive-app/react-canvas";

import { useScrollPosition } from "./hooks/useScrollPosition";
import { useVisiblePercent } from "./hooks/useVisiblePercent";
import TextOverlay, { sections } from "./TextOverlay";

const fileSrc = "/long_page_test_v8.riv";
const artboardName = "MTA Long Page";
const stateMachineName = "statemachine";
const inputName = "scroll";
const visiblePctInputName = "visible";

export default function App() {
	const contentRef = useRef<HTMLDivElement>(null);
	const scrollPctInputRef = useRef<StateMachineInput | null>(null);
	const visiblePctInputRef = useRef<StateMachineInput | null>(null);

	const contentId = useId();
	const stageId = useId();

	// Use custom hooks for scroll position and visible percentage
	const scrollPos = useScrollPosition(contentRef);
	const visiblePercent = useVisiblePercent(contentRef);

	// Use React Canvas hook - handles initialization and resize automatically
	const { RiveComponent, rive } = useRive({
		src: fileSrc,
		artboard: artboardName,
		stateMachines: stateMachineName,
		autoplay: true,
		layout: new Layout({
			fit: Fit.Cover,
			alignment: Alignment.BottomCenter,
		}),
	});

	const setScrollPct = useCallback((value: number) => {
		const input = scrollPctInputRef.current;
		if (!input) return;

		// Double-check that input is actually ready by trying to read its name
		// If it throws, the input isn't ready yet
		try {
			if (!input.name) return;
		} catch {
			return;
		}

		try {
			input.value = Math.max(0, Math.min(100, value));
		} catch {
			// Input might not be ready yet, ignore silently
		}
	}, []);

	const setVisiblePct = useCallback((value: number) => {
		const input = visiblePctInputRef.current;
		if (!input) return;

		// Double-check that input is actually ready by trying to read its name
		// If it throws, the input isn't ready yet
		try {
			if (!input.name) return;
		} catch {
			return;
		}

		try {
			input.value = Math.max(0, Math.min(100, value));
		} catch {
			// Input might not be ready yet, ignore silently
		}
	}, []);

	// Get state machine inputs once Rive is loaded
	useEffect(() => {
		if (!rive) return;

		// Wait a bit for Rive to fully initialize
		const timeoutId = setTimeout(() => {
			try {
				// Use the stateMachineInputs method to get inputs
				const inputs = rive.stateMachineInputs(stateMachineName);

				if (inputs && Array.isArray(inputs)) {
					const scrollInput = inputs.find((input) => input.name === inputName);
					if (scrollInput) {
						scrollPctInputRef.current = scrollInput;
						// Initialize with current scroll position
						setScrollPct(scrollPos);
					}

					const visiblePctInput = inputs.find(
						(input) => input.name === visiblePctInputName,
					);
					if (visiblePctInput) {
						visiblePctInputRef.current = visiblePctInput;
						// Initialize with current visible percentage
						setVisiblePct(visiblePercent);
					}
				}
			} catch (error) {
				console.error("Error getting state machine inputs:", error);
			}
		}, 100);

		return () => clearTimeout(timeoutId);
	}, [rive, scrollPos, visiblePercent, setScrollPct, setVisiblePct]);

	// Update Rive scroll input when scroll position changes
	// Only update if the input has been initialized
	useEffect(() => {
		if (!scrollPctInputRef.current) return;

		// Use requestAnimationFrame to ensure Rive is ready
		const rafId = requestAnimationFrame(() => {
			try {
				setScrollPct(scrollPos);
			} catch {
				// Ignore errors if input isn't ready yet
			}
		});

		return () => cancelAnimationFrame(rafId);
	}, [scrollPos, setScrollPct]);

	// Update Rive visiblePct input when visible percentage changes
	// Only update if the input has been initialized
	useEffect(() => {
		if (!visiblePctInputRef.current) return;

		// Use requestAnimationFrame to ensure Rive is ready
		const rafId = requestAnimationFrame(() => {
			try {
				setVisiblePct(visiblePercent);
			} catch {
				// Ignore errors if input isn't ready yet
			}
		});

		return () => cancelAnimationFrame(rafId);
	}, [visiblePercent, setVisiblePct]);

	return (
		<div className="App">
			{/* Long scrollable document */}
			<div ref={contentRef} id={contentId} className="content">
				{sections.map((section) => (
					<div key={section.title} className="content-section">
						<h2>{section.title}</h2>
						{section.content.map((paragraph, pIndex) => (
							<p key={`${section.title}-para-${pIndex}`}>{paragraph}</p>
						))}
					</div>
				))}
			</div>

			{/* Fixed Rive animation covering viewport */}
			{/* React Canvas component handles resize automatically */}
			<div id={stageId} className="stage">
				<RiveComponent style={{ width: "100%", height: "100%" }} />
			</div>

			{/* Controls overlay */}
			<TextOverlay scrollPos={scrollPos} visiblePercent={visiblePercent} />
		</div>
	);
}
