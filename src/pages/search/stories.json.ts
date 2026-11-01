import { getAllChapters, getChapterVerses } from '../../lib/content';

// Search index, part 2: [story body, word-by-word] per verse, in the same
// order as verses.json. This is most of the text, so it loads after part 1.
export function GET() {
  const rows: [string, string][] = [];
  for (const ch of getAllChapters().filter((c) => c.status === 'active')) {
    for (const v of getChapterVerses(ch.slug)) {
      rows.push([
        (v.story?.body ?? '').replace(/\s+/g, ' ').trim(),
        (v.dhatu_breakdown ?? []).map((e) => `${e.word}: ${e.meaning}`).join(' · '),
      ]);
    }
  }
  return new Response(JSON.stringify(rows), {
    headers: { 'Content-Type': 'application/json' },
  });
}
