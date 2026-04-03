import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const VAULT_PATH = "/Users/charliemonaghan/Desktop/chad/chad/agentic maker project #2/Chad's Human Guide";
const DEST_PATH = join(__dirname, '../src/content/notes');

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[,;:!?()[\]{}]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)/m);
  if (!match) return null;
  // Strip emojis and clean up
  return match[1].replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/\s+/g, ' ').trim();
}

function escapeYaml(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const slugMap = { notes: {}, categories: {} };

// Clear destination
try { rmSync(DEST_PATH, { recursive: true }); } catch {}
mkdirSync(DEST_PATH, { recursive: true });

// Process vault root entries
const rootEntries = readdirSync(VAULT_PATH).filter(e => !e.startsWith('.'));

for (const folderName of rootEntries) {
  const folderPath = join(VAULT_PATH, folderName);
  const stat = statSync(folderPath);

  if (stat.isDirectory()) {
    const catSlug = slugify(folderName);
    slugMap.categories[folderName] = catSlug;

    const folderEntries = readdirSync(folderPath).filter(e => !e.startsWith('.'));

    for (const entry of folderEntries) {
      const entryPath = join(folderPath, entry);
      const entryStat = statSync(entryPath);

      if (entryStat.isDirectory()) {
        // Subfolder (e.g. Careers)
        const subfolderName = entry;
        const subfolderPath = entryPath;

        const subEntries = readdirSync(subfolderPath).filter(e => !e.startsWith('.') && e.endsWith('.md'));

        for (const subFile of subEntries) {
          const subFilePath = join(subfolderPath, subFile);
          const originalName = basename(subFile, '.md');
          const noteSlug = slugify(originalName);
          const content = readFileSync(subFilePath, 'utf-8');
          const title = extractTitle(content) || originalName;

          slugMap.notes[originalName] = noteSlug;

          const frontmatter = [
            '---',
            `title: "${escapeYaml(title)}"`,
            `category: "${escapeYaml(folderName)}"`,
            `categorySlug: "${catSlug}"`,
            `subcategory: "${escapeYaml(subfolderName)}"`,
            `subcategorySlug: "${slugify(subfolderName)}"`,
            '---',
            '',
          ].join('\n');

          writeFileSync(join(DEST_PATH, `${noteSlug}.md`), frontmatter + content, 'utf-8');
          console.log(`  ✓ ${originalName} → ${noteSlug}.md (${folderName}/${subfolderName})`);
        }
      } else if (entry.endsWith('.md')) {
        // Direct note in category folder
        const originalName = basename(entry, '.md');
        const noteSlug = slugify(originalName);
        const content = readFileSync(entryPath, 'utf-8');
        const title = extractTitle(content) || originalName;

        slugMap.notes[originalName] = noteSlug;

        const frontmatter = [
          '---',
          `title: "${escapeYaml(title)}"`,
          `category: "${escapeYaml(folderName)}"`,
          `categorySlug: "${catSlug}"`,
          '---',
          '',
        ].join('\n');

        writeFileSync(join(DEST_PATH, `${noteSlug}.md`), frontmatter + content, 'utf-8');
        console.log(`  ✓ ${originalName} → ${noteSlug}.md (${folderName})`);
      }
    }
  } else if (folderName.endsWith('.md')) {
    // Root-level file (MASTER INDEX.md, update-log.md)
    const originalName = basename(folderName, '.md');
    const noteSlug = slugify(originalName);
    const content = readFileSync(folderPath, 'utf-8');
    const title = extractTitle(content) || originalName;

    slugMap.notes[originalName] = noteSlug;

    const frontmatter = [
      '---',
      `title: "${escapeYaml(title)}"`,
      `category: "root"`,
      `categorySlug: "root"`,
      '---',
      '',
    ].join('\n');

    writeFileSync(join(DEST_PATH, `${noteSlug}.md`), frontmatter + content, 'utf-8');
    console.log(`  ✓ ${originalName} → ${noteSlug}.md (root)`);
  }
}

// Write slug map to project root (outside src/content to avoid Astro collection conflicts)
writeFileSync(
  join(__dirname, '../slug-map.json'),
  JSON.stringify(slugMap, null, 2),
  'utf-8'
);

console.log(`\nDone! Copied ${Object.keys(slugMap.notes).length} notes, ${Object.keys(slugMap.categories).length} categories.`);
console.log('slug-map.json written to project root');
