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

  const scrollPos = useScrollPosition(contentRef);
  const visiblePercent = useVisiblePercent(contentRef);

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
    try {
      if (!input.name) return;
    } catch {
      return;
    }
    try {
      input.value = Math.max(0, Math.min(100, value));
    } catch {}
  }, []);

  const setVisiblePct = useCallback((value: number) => {
    const input = visiblePctInputRef.current;
    if (!input) return;
    try {
      if (!input.name) return;
    } catch {
      return;
    }
    try {
      input.value = Math.max(0, Math.min(100, value));
    } catch {}
  }, []);

  useEffect(() => {
    if (!rive) return;

    const timeoutId = setTimeout(() => {
      try {
        const inputs = rive.stateMachineInputs(stateMachineName);

        if (inputs && Array.isArray(inputs)) {
          const scrollInput = inputs.find((i) => i.name === inputName);
          if (scrollInput) {
			scrollPctInputRef.current = scrollInput;
		  
			const content = contentRef.current;
			if (!content) return;
		  
			const maxScrollPx = Math.max(0, content.scrollHeight - window.innerHeight);
		  
			const TARGET_SCROLL_PX = window.innerHeight * 8;
			const MAX_START_AT = 70;
		  
			const t = Math.min(1, maxScrollPx / TARGET_SCROLL_PX);
			const startAt = (1 - t) * MAX_START_AT;
		  
			const adjusted = startAt + (scrollPos / 100) * (100 - startAt);
		  
			setScrollPct(adjusted);
		  }

          const visibleInput = inputs.find((i) => i.name === visiblePctInputName);
          if (visibleInput) {
            visiblePctInputRef.current = visibleInput;
            setVisiblePct(visiblePercent);
          }
        }
      } catch (error) {
        console.error("Error getting state machine inputs:", error);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [rive, scrollPos, visiblePercent, setScrollPct, setVisiblePct]);

  useEffect(() => {
	if (!scrollPctInputRef.current) return;
  
	const rafId = requestAnimationFrame(() => {
	  const content = contentRef.current;
	  if (!content) return;
  
	  const maxScrollPx = Math.max(0, content.scrollHeight - window.innerHeight);
  
	  const TARGET_SCROLL_PX = window.innerHeight * 8;
	  const MAX_START_AT = 70;
  
	  const t = Math.min(1, maxScrollPx / TARGET_SCROLL_PX);
	  const startAt = (1 - t) * MAX_START_AT;
  
	  const adjusted = startAt + (scrollPos / 100) * (100 - startAt);
  
	  setScrollPct(adjusted);
	});
  
	return () => cancelAnimationFrame(rafId);
  }, [scrollPos, setScrollPct]);

  useEffect(() => {
    if (!visiblePctInputRef.current) return;
    const rafId = requestAnimationFrame(() => {
      try {
        setVisiblePct(visiblePercent);
      } catch {}
    });
    return () => cancelAnimationFrame(rafId);
  }, [visiblePercent, setVisiblePct]);

  return (
    <div className="App" style={{ position: "relative" }}>
      <div
        id={stageId}
        className="stage"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <RiveComponent style={{ width: "100%", height: "100%" }} />
      </div>

      <div
        ref={contentRef}
        id={contentId}
        className="content"
        style={{ position: "relative", zIndex: 1 }}
      >
        {sections.map((section) => (
          <div key={section.title} className="content-section">
            <h2>{section.title}</h2>
            {section.content.map((paragraph, pIndex) => (
              <p key={`${section.title}-para-${pIndex}`}>{paragraph}</p>
            ))}
          </div>
        ))}
      </div>

      <TextOverlay scrollPos={scrollPos} visiblePercent={visiblePercent} />
    </div>
  );
}
