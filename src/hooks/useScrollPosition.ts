import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";

export function useScrollPosition(
	contentRef: RefObject<HTMLElement | null>,
): number {
	const [pct, setPct] = useState(0);

	const calculate = useCallback(() => {
		const content = contentRef.current;
		if (!content) return 0;

		const rect = content.getBoundingClientRect();
		const start = rect.top + window.scrollY;
		const end = start + content.scrollHeight - window.innerHeight;

		if (end <= start) return 100;

		const y = Math.max(start, Math.min(end, window.scrollY));
		const raw = ((y - start) / (end - start)) * 100;

		return Math.max(0, Math.min(100, raw));
	}, [contentRef]);

	useEffect(() => {
		const update = () => setPct(calculate());
		update();

		window.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);

		return () => {
			window.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		};
	}, [calculate]);

	return pct;
}
