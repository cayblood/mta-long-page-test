import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";

/**
 * Custom hook to track scroll position as a percentage (0-100)
 * @param contentRef - Reference to the scrollable content element
 * @returns scrollPositionPercent - Current scroll position as percentage (0-100)
 */
export function useScrollPosition(
	contentRef: RefObject<HTMLElement | null>,
): number {
	const [scrollPositionPercent, setScrollPositionPercent] = useState(0);

	const calculateScrollPosition = useCallback(() => {
		const content = contentRef.current;
		if (!content) return 0;

		const windowHeight = window.innerHeight;
		const documentHeight = content.scrollHeight;
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

		// Calculate scroll position as percentage (0-100)
		const maxScroll = Math.max(0, documentHeight - windowHeight);
		const scrollPositionPercent =
			maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

		return Math.min(100, Math.max(0, scrollPositionPercent));
	}, [contentRef]);

	const updateScrollPosition = useCallback(() => {
		const position = calculateScrollPosition();
		setScrollPositionPercent(position);
	}, [calculateScrollPosition]);

	// Handle scroll events
	useEffect(() => {
		const handleScroll = () => {
			updateScrollPosition();
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [updateScrollPosition]);

	// Handle resize events (scroll position may change on resize)
	useEffect(() => {
		let resizeTimeout: number;
		const handleResize = () => {
			cancelAnimationFrame(resizeTimeout);
			resizeTimeout = requestAnimationFrame(() => {
				updateScrollPosition();
			});
		};

		window.addEventListener("resize", handleResize, { passive: true });
		return () => {
			window.removeEventListener("resize", handleResize);
			cancelAnimationFrame(resizeTimeout);
		};
	}, [updateScrollPosition]);

	// Initialize scroll position on mount
	useEffect(() => {
		// Use requestAnimationFrame to ensure DOM is ready
		const rafId = requestAnimationFrame(() => {
			updateScrollPosition();
		});
		return () => cancelAnimationFrame(rafId);
	}, [updateScrollPosition]);

	return scrollPositionPercent;
}
