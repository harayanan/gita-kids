import { useState, useRef, useEffect, type ReactNode } from 'react';

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
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<'above' | 'below'>('above');
  const ref = useRef<HTMLSpanElement>(null);
  // Show the IAST spelling, keeping the capitalisation used in the text
  const heading = iast && term[0] !== term[0].toLowerCase() ? iast[0].toUpperCase() + iast.slice(1) : iast ?? term;

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition(rect.top < 120 ? 'below' : 'above');
    }
  }, [show]);

  const handleClick = (e: React.MouseEvent) => {
    // Tap-to-toggle for touch devices
    e.preventDefault();
    setShow((prev) => !prev);
  };

  // Close on outside tap
  useEffect(() => {
    if (!show) return;
    const handleOutside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [show]);

  return (
    <span
      ref={ref}
      className="relative inline-block cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-expanded={show}
      aria-label={`${term}: ${definition}`}
    >
      <span className="border-b border-dashed border-gold/60 text-saffron font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-saffron/50 focus-visible:rounded-sm">
        {term}
      </span>
      {show && (
        <span
          className={`absolute z-50 left-1/2 -translate-x-1/2 w-56 max-w-[calc(100vw-2rem)] px-3 py-2 rounded-lg shadow-lg bg-gray-900 text-white text-sm font-sans leading-snug pointer-events-none ${
            position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          role="tooltip"
        >
          <span className="block font-semibold text-gold mb-0.5">{heading}</span>
          <span className="block text-gray-200">{definition}</span>
          <span
            aria-hidden="true"
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 ${
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

  // Build regex matching any glossary term (case-insensitive, word boundaries)
  const pattern = new RegExp(
    `\\b(${sorted.map((g) => g.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
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
