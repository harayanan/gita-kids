import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const CONTENT_DIR = path.resolve('content/chapters');
const GLOSSARY_PATH = path.resolve('src/data/glossary.yaml');
const ART_STYLES_PATH = path.resolve('src/data/art-styles.yaml');
const ALT_TEXT_PATH = path.resolve('src/data/illustration-alt-text.yaml');

export interface ChapterMeta {
  number: number;
  slug: string;
  name: string;
  sanskrit_name: string;
  transliterated_name: string;
  verse_count: number;
  folk_art_style: 'madhubani' | 'pichwai' | 'pattachitra' | 'warli' | 'kalamkari' | 'gond' | 'kerala-mural';
  summary: string;
  status: 'active' | 'coming_soon';
}

export interface DhatuEntry {
  word: string;
  parts: string[];
  meaning: string;
}

export interface Story {
  title: string;
  source: string;
  body: string;
}

export interface Verse {
  chapter: number;
  verse: number;
  speaker: string;
  sanskrit: string;
  transliteration: string;
  dhatu_breakdown: DhatuEntry[];
  meaning: string;
  story: Story;
  reflection: string;
}

export interface GlossaryEntry {
  term: string;
  sanskrit?: string;
  definition: string;
}

export interface ArtStyle {
  id: string;
  name: string;
  region: string;
  also_known_as: string;
  description: string;
  signature_elements: string[];
  fun_fact: string;
}

export function getAllChapters(): ChapterMeta[] {
  const dirs = fs.readdirSync(CONTENT_DIR).filter((d) => {
    const metaPath = path.join(CONTENT_DIR, d, 'meta.yaml');
    return fs.existsSync(metaPath);
  });

  return dirs
    .map((dir) => {
      const metaPath = path.join(CONTENT_DIR, dir, 'meta.yaml');
      const content = fs.readFileSync(metaPath, 'utf-8');
      return yaml.load(content) as ChapterMeta;
    })
    .sort((a, b) => a.number - b.number);
}

export function getChapter(slug: string): ChapterMeta | undefined {
  const metaPath = path.join(CONTENT_DIR, slug, 'meta.yaml');
  if (!fs.existsSync(metaPath)) return undefined;
  const content = fs.readFileSync(metaPath, 'utf-8');
  return yaml.load(content) as ChapterMeta;
}

export function getChapterVerses(slug: string): Verse[] {
  const versesDir = path.join(CONTENT_DIR, slug, 'verses');
  if (!fs.existsSync(versesDir)) return [];

  const files = fs.readdirSync(versesDir)
    .filter((f) => f.endsWith('.yaml'))
    .sort();

  return files.map((f) => {
    const content = fs.readFileSync(path.join(versesDir, f), 'utf-8');
    return yaml.load(content) as Verse;
  });
}

export function getVerse(slug: string, verseNum: string): Verse | undefined {
  const versePath = path.join(CONTENT_DIR, slug, 'verses', `${verseNum}.yaml`);
  if (!fs.existsSync(versePath)) return undefined;
  const content = fs.readFileSync(versePath, 'utf-8');
  return yaml.load(content) as Verse;
}

export function getGlossary(): GlossaryEntry[] {
  const content = fs.readFileSync(GLOSSARY_PATH, 'utf-8');
  return (yaml.load(content) as GlossaryEntry[]).sort((a, b) =>
    a.term.localeCompare(b.term)
  );
}

export function getArtStyle(styleId: string): ArtStyle | undefined {
  const content = fs.readFileSync(ART_STYLES_PATH, 'utf-8');
  const styles = yaml.load(content) as ArtStyle[];
  return styles.find((s) => s.id === styleId);
}

export function getIllustrationAltText(chapterSlug: string, verseNum: string): string | undefined {
  const content = fs.readFileSync(ALT_TEXT_PATH, 'utf-8');
  const data = yaml.load(content) as Record<string, string>;
  return data[`${chapterSlug}/${verseNum}`];
}
