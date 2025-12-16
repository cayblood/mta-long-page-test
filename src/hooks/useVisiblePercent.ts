import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";

/**
 * Custom hook to track the percentage of document that is visible in the viewport
 * @param contentRef - Reference to the scrollable content element
 * @returns visiblePercent - Percentage of document visible (0-100)
 */
export function useVisiblePercent(
	contentRef: RefObject<HTMLElement | null>,
): number {
	const [visiblePercent, setVisiblePercent] = useState(0);

	const calculateVisiblePercent = useCallback(() => {
		const content = contentRef.current;
		if (!content) return 0;

		const windowHeight = window.innerHeight;
		const documentHeight = content.scrollHeight;

		// Calculate percentage of document that is visible
		const visiblePercent = (windowHeight / documentHeight) * 100;

		return Math.min(100, Math.max(0, visiblePercent));
	}, [contentRef]);

	const updateVisiblePercent = useCallback(() => {
		const percent = calculateVisiblePercent();
		setVisiblePercent(percent);
	}, [calculateVisiblePercent]);

	// Handle scroll events (visible percent may change slightly during scroll)
	useEffect(() => {
		const handleScroll = () => {
			updateVisiblePercent();
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [updateVisiblePercent]);

	// Handle resize events (visible percent changes on resize)
	useEffect(() => {
		let resizeTimeout: number;
		const handleResize = () => {
			cancelAnimationFrame(resizeTimeout);
			resizeTimeout = requestAnimationFrame(() => {
				updateVisiblePercent();
			});
		};

		window.addEventListener("resize", handleResize, { passive: true });
		return () => {
			window.removeEventListener("resize", handleResize);
			cancelAnimationFrame(resizeTimeout);
		};
	}, [updateVisiblePercent]);

	// Initialize visible percent on mount
	useEffect(() => {
		// Use requestAnimationFrame to ensure DOM is ready
		const rafId = requestAnimationFrame(() => {
			updateVisiblePercent();
		});
		return () => cancelAnimationFrame(rafId);
	}, [updateVisiblePercent]);

	return visiblePercent;
}
