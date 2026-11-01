import { useState, useRef, useEffect, useLayoutEffect, type ReactNode } from 'react';

interface GlossaryEntry {
  term: string;
  iast?: string;
  definition: string;
}

interface TooltipProps {
  glossary: GlossaryEntry[];
  text: string;
}

function TooltipWord({ term, iast, definition }: { term: string; iast?: string; definition: string }) {
  // Three independent reasons to show the definition: a mouse hovering over the term,
  // keyboard focus, or a tap/click that pins it open. A touch tap fires focus and click
  // in sequence, so focus only counts when it is keyboard focus (:focus-visible).
  const [hover, setHover] = useState(false);
  const [kbd, setKbd] = useState(false);
  const [pinned, setPinned] = useState(false);
  const show = hover || kbd || pinned;
  const [position, setPosition] = useState<'above' | 'below'>('above');
  const [shift, setShift] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  // useId is unique only within one React root, and every Tooltip is its own Astro island,
  // so build a page-unique id. It is only rendered while the popup is open (client-side).
  const tipIdRef = useRef<string>('');
  if (!tipIdRef.current) tipIdRef.current = `gk-tip-${Math.random().toString(36).slice(2, 9)}`;
  const tipId = tipIdRef.current;
  // Show the IAST spelling, keeping the capitalisation used in the text
  const heading = iast && term[0] !== term[0].toLowerCase() ? iast[0].toUpperCase() + iast.slice(1) : iast ?? term;

  const closeAll = () => {
    setHover(false);
    setKbd(false);
    setPinned(false);
  };

  // Place the popup above or below the term and keep it inside the viewport horizontally.
  useLayoutEffect(() => {
    if (!show) {
      setShift(0);
      return;
    }
    const term = ref.current;
    const pop = popRef.current;
    if (!term || !pop) return;
    const t = term.getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    // Space taken by the sticky site header at the top of the viewport
    const topLimit = 88;
    setPosition(t.top - p.height - 12 < topLimit ? 'below' : 'above');
    const margin = 8;
    const vw = document.documentElement.clientWidth;
    const naturalLeft = p.left - shift;
    const naturalRight = naturalLeft + p.width;
    let next = 0;
    if (naturalLeft < margin) next = margin - naturalLeft;
    else if (naturalRight > vw - margin) next = vw - margin - naturalRight;
    if (Math.round(next) !== Math.round(shift)) setShift(Math.round(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pinned) {
      closeAll();
    } else {
      setPinned(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (show) closeAll();
      else setPinned(true);
    }
  };

  // Close on outside tap/click and on Escape
  useEffect(() => {
    if (!show) return;
    const handleOutside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeAll();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [show]);

  return (
    <span
      ref={ref}
      className="relative inline cursor-help rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron after:absolute after:-inset-x-1 after:-inset-y-2 after:content-['']"
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHover(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setHover(false);
      }}
      onFocus={(e) => {
        let keyboard = false;
        try {
          keyboard = e.currentTarget.matches(':focus-visible');
        } catch {
          keyboard = false;
        }
        if (keyboard) setKbd(true);
      }}
      onBlur={closeAll}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-expanded={show}
      aria-describedby={show ? tipId : undefined}
      aria-label={`${term}: ${definition}`}
    >
      <span className="border-b border-dashed border-gold text-saffron-ink font-medium">{term}</span>
      {show && (
        <span
          ref={popRef}
          id={tipId}
          style={{ transform: `translateX(calc(-50% + ${shift}px))` }}
          className={`absolute z-50 left-1/2 w-64 max-w-[calc(100vw-1rem)] px-3.5 py-2.5 rounded-lg shadow-lg bg-gray-900 text-white font-ui text-sm sm:text-base font-normal not-italic text-left leading-snug tracking-normal pointer-events-none ${
            position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          role="tooltip"
        >
          <span className="block font-semibold text-gold mb-0.5">{heading}</span>
          <span className="block text-gray-100">{definition}</span>
          <span
            aria-hidden="true"
            style={{ left: `calc(50% - ${shift}px)` }}
            className={`absolute -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 ${
              position === 'above' ? '-bottom-1' : '-top-1'
            }`}
          />
        </span>
      )}
    </span>
  );
}

/**
 * Tooltip component that scans text for glossary terms and wraps them
 * in interactive tooltip spans. Used as a React island in Astro.
 */
export default function Tooltip({ glossary, text }: TooltipProps) {
  if (!glossary || glossary.length === 0 || !text) return <>{text}</>;

  // Sort terms by length (longest first) to match longer terms before substrings
  const sorted = [...glossary].sort((a, b) => b.term.length - a.term.length);

  // Build regex matching any glossary term (case-insensitive). \b is ASCII-only and
  // treats IAST letters such as ṇ or ā as word breaks, so use Unicode letter/mark lookarounds.
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{M}])(${sorted.map((g) => g.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{M}])`,
    'giu'
  );

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  // Track which terms we've already tooltipped to avoid duplicates in same block
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const matchedTerm = match[0];
    const termLower = matchedTerm.toLowerCase();

    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Only tooltip the first occurrence of each term
    if (seen.has(termLower)) {
      parts.push(matchedTerm);
    } else {
      const entry = sorted.find((g) => g.term.toLowerCase() === termLower);
      if (entry) {
        seen.add(termLower);
        parts.push(
          <TooltipWord key={`${termLower}-${match.index}`} term={matchedTerm} iast={entry.iast} definition={entry.definition} />
        );
      } else {
        parts.push(matchedTerm);
      }
    }

    lastIndex = match.index + matchedTerm.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
