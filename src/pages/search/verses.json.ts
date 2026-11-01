import { getAllChapters, getChapterVerses } from '../../lib/content';

// Search index, part 1: the short fields of every verse (title, meaning,
// Sanskrit, transliteration, reflection). Small enough to arrive first, so
// searches work almost immediately. The bulky fields ship in stories.json.
export function GET() {
  const records = [];
  for (const ch of getAllChapters().filter((c) => c.status === 'active')) {
    for (const v of getChapterVerses(ch.slug)) {
      const verseNum = String(v.verse).padStart(3, '0');
      records.push({
        u: `/chapters/${ch.slug}/${verseNum}`,
        c: v.chapter,
        v: v.verse,
        sp: v.speaker,
        t: v.story?.title ?? '',
        m: (v.meaning ?? '').trim(),
        sa: v.sanskrit ?? '',
        tr: v.transliteration ?? '',
        q: v.reflection ?? '',
      });
    }
  }
  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json' },
  });
}
