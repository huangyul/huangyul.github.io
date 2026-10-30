import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { Marked } from 'marked';
import katex from 'katex';
import { minimatch } from 'minimatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

// Ensure highlight.js is installed even if dev-server was started before Phase 2
if (!fs.existsSync(path.join(SITE_ROOT, 'node_modules', 'highlight.js'))) {
  console.log('[prepare-data] 正在安装代码高亮依赖 highlight.js...');
  execSync('npm install', { cwd: SITE_ROOT, stdio: 'inherit' });
}
const { default: hljs } = await import('highlight.js');
const VAULT_ROOT = path.resolve(SITE_ROOT, '..');
const CONFIG_PATH = path.join(VAULT_ROOT, 'publish.config.yml');
const OUTPUT_DATA_DIR = path.join(SITE_ROOT, 'src', 'data');
const OUTPUT_JSON_PATH = path.join(OUTPUT_DATA_DIR, 'generated.json');
const PUBLIC_IMAGES_DIR = path.join(SITE_ROOT, 'public', 'obsidian-images');

const rawBase = process.env.SITE_BASE || '/';
const basePrefix = rawBase === '/' ? '' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;

function withBase(routePath) {
  const clean = String(routePath || '').replace(/^\/+/, '');
  return `${basePrefix}/${clean}`;
}

function normalizeSlash(p) {
  return p.split(path.sep).join('/');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Load publish.config.yml
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`publish.config.yml not found at ${CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return yaml.load(raw);
}

/**
 * Check if a relative path from VAULT_ROOT is excluded
 */
function isExcluded(relPath, excludePatterns = []) {
  const norm = normalizeSlash(relPath).replace(/^\/+/, '');
  const parts = norm.split('/');

  for (const pattern of excludePatterns) {
    const cleanPattern = normalizeSlash(String(pattern)).replace(/^\/+|\/+$/g, '');
    if (!cleanPattern) continue;

    if (norm === cleanPattern || norm.startsWith(`${cleanPattern}/`)) {
      return true;
    }
    if (parts.includes(cleanPattern)) {
      return true;
    }
    if (minimatch(norm, cleanPattern, { dot: true, nocase: true })) {
      return true;
    }
    if (minimatch(path.basename(norm), cleanPattern, { dot: true, nocase: true })) {
      return true;
    }
  }
  return false;
}

/**
 * Index all images in the vault (especially static/image) for Obsidian shortest-path resolution
 */
function buildImageIndex(excludePatterns) {
  const byName = new Map();
  const byRelPath = new Map();
  const imageExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);

  function walkDir(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = normalizeSlash(path.relative(VAULT_ROOT, fullPath));
      if (isExcluded(relPath, excludePatterns)) continue;

      if (entry.isDirectory()) {
        if (entry.name.startsWith('.')) continue;
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExts.has(ext)) {
          byRelPath.set(relPath.toLowerCase(), fullPath);
          if (!byName.has(entry.name.toLowerCase()) || relPath.startsWith('static/image/')) {
            byName.set(entry.name.toLowerCase(), fullPath);
          }
        }
      }
    }
  }

  walkDir(VAULT_ROOT);
  return { byName, byRelPath };
}

/**
 * Copy a referenced image into .site/public/obsidian-images/ and return its public URL
 */
function resolveAndCopyImage(rawTarget, noteRelDir, imageIndex, copiedCache) {
  let target = String(rawTarget || '').trim();
  if (!target) return null;
  if (/^(https?:|data:)/i.test(target)) return target;

  try {
    target = decodeURIComponent(target);
  } catch {
    // keep raw target
  }

  target = normalizeSlash(target).replace(/^\.\//, '');

  let sourceFullPath = null;
  const relFromNote = normalizeSlash(path.join(noteRelDir, target)).toLowerCase();
  const relFromRoot = target.replace(/^\/+/, '').toLowerCase();
  const baseName = path.basename(target).toLowerCase();

  if (imageIndex.byRelPath.has(relFromNote)) {
    sourceFullPath = imageIndex.byRelPath.get(relFromNote);
  } else if (imageIndex.byRelPath.has(relFromRoot)) {
    sourceFullPath = imageIndex.byRelPath.get(relFromRoot);
  } else if (imageIndex.byName.has(baseName)) {
    sourceFullPath = imageIndex.byName.get(baseName);
  }

  if (!sourceFullPath || !fs.existsSync(sourceFullPath)) {
    return null;
  }

  if (copiedCache.has(sourceFullPath)) {
    return copiedCache.get(sourceFullPath);
  }

  fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
  const ext = path.extname(sourceFullPath).toLowerCase();
  const asciiStem =
    path
      .basename(sourceFullPath, path.extname(sourceFullPath))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'img';
  const shortHash = crypto
    .createHash('sha1')
    .update(normalizeSlash(path.relative(VAULT_ROOT, sourceFullPath)))
    .digest('hex')
    .slice(0, 10);
  const destFileName = `${asciiStem}_${shortHash}${ext}`;
  const destFullPath = path.join(PUBLIC_IMAGES_DIR, destFileName);

  fs.copyFileSync(sourceFullPath, destFullPath);
  const publicUrl = withBase(`obsidian-images/${destFileName}`);
  copiedCache.set(sourceFullPath, publicUrl);
  return publicUrl;
}

/**
 * Get file date from frontmatter, Git commit history, or filesystem mtime
 */
function resolveFileDate(fullPath, relPath, frontmatterDate) {
  if (frontmatterDate) {
    const parsed = new Date(frontmatterDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  try {
    const gitIso = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', relPath],
      { cwd: VAULT_ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    if (gitIso) {
      const parsed = new Date(gitIso);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  } catch {
    // Fallback to mtime
  }

  const stat = fs.statSync(fullPath);
  return stat.mtime || new Date();
}

function formatDateYMD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMonthDay(dateObj) {
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

/**
 * Make URL-safe readable slug from relative path
 */
function createSlug(sectionId, relPath) {
  const withoutExt = normalizeSlash(relPath).replace(/\.md$/i, '');
  const segments = withoutExt.split('/').map((seg) =>
    seg
      .trim()
      .replace(/^[#\s]+/, '')
      .replace(/[\s·&?#%\\:*<>|"']+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  );
  return [sectionId, ...segments.filter(Boolean)].join('/');
}

/**
 * Clean title from filename into a human-readable label
 * (underscores → spaces, numbered prefixes, light English title-case / acronyms)
 */
function cleanTitleFromFilename(filePath) {
  let name = path
    .basename(filePath, path.extname(filePath))
    .replace(/^[#\s]+/, '')
    .trim();

  name = name.replace(/_/g, ' ');
  // "1-基础知识" / "10-DFS" → "1 基础知识" / "10 DFS"
  name = name.replace(/^(\d+)[-_.]+/, '$1 ');
  // Collapse leftover multi-hyphens between latin tokens: "foo-bar" → "foo bar"
  if (!/[\u4e00-\u9fa5]/.test(name)) {
    name = name.replace(/-/g, ' ');
  }

  name = name
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (/[\u4e00-\u9fa5]/.test(token)) return token;
      if (/^[A-Z0-9]{2,}$/.test(token)) return token;
      if (/^[a-z]{1,3}$/.test(token)) return token.toUpperCase(); // ai, llm, api, go
      if (/^[a-z]/.test(token)) return token.charAt(0).toUpperCase() + token.slice(1);
      return token;
    })
    .join(' ');

  return name.replace(/\s+/g, ' ').trim();
}

/**
 * Compute word count (CJK characters + English words) and reading time in minutes
 */
function computeWordStats(markdownBody) {
  const clean = markdownBody
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, ''))
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/[#*_~>`|-]/g, ' ');

  const cjkMatches = clean.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || [];
  const nonCjkText = clean.replace(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g, ' ');
  const enWords = nonCjkText.trim().split(/\s+/).filter(Boolean);

  const wordCount = cjkMatches.length + enWords.length;
  const readingMinutes = Math.max(1, Math.round(wordCount / 320));
  return { wordCount, readingMinutes };
}

/**
 * Extract plain text summary & search text
 */
function extractPlainAndSummary(markdownBody, frontmatterSummary) {
  const stripped = markdownBody
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/!\[\[[^\]]+\]\]/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s*\[![^\]]+\]/gm, '')
    .replace(/==([^=\n]+)==/g, '$1')
    .replace(/[`*_~>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let summary = '';
  if (frontmatterSummary && String(frontmatterSummary).trim()) {
    summary = String(frontmatterSummary).trim();
  } else {
    summary = stripped.length <= 150 ? stripped : `${stripped.slice(0, 148).trim()}…`;
  }

  const searchText = stripped.slice(0, 2500);
  return { summary, searchText };
}

/**
 * Render Obsidian Flavored Markdown (WikiLinks, Image Embeds, Callouts, ==Highlight==, KaTeX, Highlight.js, Mermaid)
 */
function renderObsidianMarkdown(
  markdownBody,
  noteRelDir,
  currentSlug,
  imageIndex,
  copiedCache,
  noteSlugByName,
  outboundSlugs
) {
  const codePlaceholders = [];
  const mathPlaceholders = [];
  let firstImageUrl = null;
  let hasMermaid = false;

  // 1. Protect fenced code blocks & inline code from math/wikilink/highlight regexes
  let text = markdownBody.replace(/```[\s\S]*?```|`[^`\n]+`/g, (match) => {
    const idx = codePlaceholders.length;
    codePlaceholders.push(match);
    return `@@CODE_BLOCK_${idx}@@`;
  });

  // 2. Render display math $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    const html = katex.renderToString(expr.trim(), {
      displayMode: true,
      throwOnError: false,
    });
    const idx = mathPlaceholders.length;
    mathPlaceholders.push(`<div class="math-block">${html}</div>`);
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // 3. Render inline math $...$
  text = text.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (full, expr) => {
    const trimmed = expr.trim();
    if (!trimmed) return full;
    const html = katex.renderToString(trimmed, {
      displayMode: false,
      throwOnError: false,
    });
    const idx = mathPlaceholders.length;
    mathPlaceholders.push(`<span class="math-inline">${html}</span>`);
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // 4. Convert Obsidian ==highlight== syntax
  text = text.replace(/==([^=\n]+?)==/g, '<mark class="obsidian-mark">$1</mark>');

  // 4b. Fix CommonMark flanking failures for **bold** next to CJK punctuation/quotes
  //     e.g. **"遍历..."** would otherwise leak raw asterisks
  text = text.replace(/\*\*((?:(?!\*\*)[^\n])+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');

  // 4c. Bare LaTeX arrows outside $...$ (and collapse →\\rightarrow→ artifacts)
  text = text.replace(/→\s*\\rightarrow\s*→/g, '→');
  text = text.replace(/←\s*\\leftarrow\s*←/g, '←');
  text = text.replace(/⇒\s*\\Rightarrow\s*⇒/g, '⇒');
  text = text.replace(/\\(rightarrow|to|longrightarrow)\b/g, '→');
  text = text.replace(/\\(leftarrow|longleftarrow)\b/g, '←');
  text = text.replace(/\\(Rightarrow|implies)\b/g, '⇒');
  text = text.replace(/\\(Leftarrow)\b/g, '⇐');
  text = text.replace(/\\(leftrightarrow|Leftrightarrow)\b/g, '↔');

  // 5. Convert Obsidian image embeds: ![[filename.png]] or ![[filename.png|400]]
  text = text.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, rawTarget, rawSize) => {
    const publicUrl = resolveAndCopyImage(rawTarget, noteRelDir, imageIndex, copiedCache);
    const alt = path.basename(rawTarget.trim());
    if (!publicUrl) {
      return `<span class="broken-embed" title="未找到图片: ${escapeHtml(alt)}">🖼️ ${escapeHtml(alt)}</span>`;
    }
    if (!firstImageUrl) firstImageUrl = publicUrl;
    const widthAttr = rawSize && /^\d+$/.test(rawSize.trim()) ? ` width="${rawSize.trim()}"` : '';
    return `<figure class="obsidian-figure"><img src="${publicUrl}" alt="${escapeHtml(alt)}" loading="lazy" data-zoomable="true"${widthAttr} /></figure>`;
  });

  // 6. Convert standard Markdown images ![alt](target) using Obsidian shortest-path lookup
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, rawTarget) => {
    const cleanTarget = rawTarget.trim().replace(/^<|>$/g, '');
    const publicUrl = resolveAndCopyImage(cleanTarget, noteRelDir, imageIndex, copiedCache);
    if (!publicUrl) return full;
    if (!firstImageUrl) firstImageUrl = publicUrl;
    const finalAlt = escapeHtml(alt || path.basename(cleanTarget));
    return `<figure class="obsidian-figure"><img src="${publicUrl}" alt="${finalAlt}" loading="lazy" data-zoomable="true" /></figure>`;
  });

  // 7. Convert Obsidian WikiLinks: [[Target Note]] or [[Target Note|Alias]] and track backlinks
  text = text.replace(/\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g, (_, rawTarget, hash, alias) => {
    const targetName = path.basename(rawTarget.trim(), '.md').toLowerCase();
    const display = escapeHtml((alias || rawTarget).trim());
    const matchedSlug = noteSlugByName.get(targetName);
    if (matchedSlug) {
      if (matchedSlug !== currentSlug) {
        outboundSlugs.add(matchedSlug);
      }
      const hashSuffix = hash ? `#${hash.trim().toLowerCase().replace(/\s+/g, '-')}` : '';
      return `<a href="${withBase(`post/${matchedSlug}/`)}${hashSuffix}" class="wikilink">${display}</a>`;
    }
    return `<span class="wikilink-unresolved">${display}</span>`;
  });

  // 8. Restore code blocks before Marked parsing
  text = text.replace(/@@CODE_BLOCK_(\d+)@@/g, (_, idx) => codePlaceholders[Number(idx)]);

  // 9. Parse Markdown to HTML, syntax-highlight code blocks, and collect headings for TOC
  const headings = [];
  const slugCounts = new Map();
  const markedInstance = new Marked({
    gfm: true,
    breaks: false,
  });

  markedInstance.use({
    renderer: {
      heading({ tokens, depth }) {
        const renderedText = this.parser.parseInline(tokens);
        const plainText = renderedText.replace(/<[^>]+>/g, '').trim();
        let baseId = plainText
          .toLowerCase()
          .replace(/[\s·?#%&/\\:*<>|"']+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        if (!baseId) baseId = `heading-${headings.length + 1}`;
        const count = slugCounts.get(baseId) || 0;
        slugCounts.set(baseId, count + 1);
        const id = count === 0 ? baseId : `${baseId}-${count}`;

        if (depth >= 1 && depth <= 3) {
          headings.push({ depth, text: plainText, id });
        }
        return `<h${depth} id="${id}">${renderedText}</h${depth}>\n`;
      },
      code({ text: codeText, lang }) {
        const cleanLang = (lang || '').trim().split(/\s+/)[0].toLowerCase();
        if (cleanLang === 'mermaid') {
          hasMermaid = true;
          return `<div class="mermaid-wrapper"><div class="mermaid-header"><span>❖ 流程图 · Mermaid</span></div><pre class="mermaid">${escapeHtml(codeText)}</pre></div>\n`;
        }

        let highlighted = '';
        let displayLang = cleanLang || 'text';
        try {
          if (cleanLang && hljs.getLanguage(cleanLang)) {
            highlighted = hljs.highlight(codeText, {
              language: cleanLang,
              ignoreIllegals: true,
            }).value;
          } else {
            const auto = hljs.highlightAuto(codeText);
            highlighted = auto.value;
            if (!cleanLang && auto.language) {
              displayLang = auto.language;
            }
          }
        } catch {
          highlighted = escapeHtml(codeText);
        }

        return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang">${escapeHtml(displayLang.toUpperCase())}</span><button type="button" class="code-copy-btn" aria-label="复制代码">复制</button></div><pre><code class="hljs language-${escapeHtml(displayLang)}">${highlighted}</code></pre></div>\n`;
      },
    },
  });

  let html = markedInstance.parse(text);

  // 10. Transform Obsidian Callouts inside blockquotes: <blockquote><p>[!NOTE] Title...
  html = html.replace(
    /<blockquote>\s*<p>\[!([A-Za-z]+)\](?:[ \t]*([^\n<]*))?(?:\n|<br\s*\/?>)?([\s\S]*?)<\/blockquote>/g,
    (_, typeRaw, titleRaw, restHtml) => {
      const type = typeRaw.toLowerCase();
      const title = (titleRaw || typeRaw).trim();
      const bodyContent = restHtml.trim().endsWith('</p>') ? `<p>${restHtml}` : restHtml;
      return `<aside class="callout callout-${type}"><div class="callout-title">${title}</div><div class="callout-body">${bodyContent}</div></aside>`;
    }
  );

  // 11. Restore rendered KaTeX blocks
  html = html.replace(/@@MATH_BLOCK_(\d+)@@/g, (_, idx) => mathPlaceholders[Number(idx)]);

  return { html, headings, firstImageUrl, hasMermaid };
}

/**
 * Recursively collect .md files from a file or directory
 */
function collectMarkdownFiles(targetRelPath, excludePatterns) {
  const fullTarget = path.join(VAULT_ROOT, targetRelPath);
  if (!fs.existsSync(fullTarget)) return [];

  const results = [];
  const stat = fs.statSync(fullTarget);

  if (stat.isFile()) {
    const rel = normalizeSlash(path.relative(VAULT_ROOT, fullTarget));
    if (rel.toLowerCase().endsWith('.md') && !isExcluded(rel, excludePatterns)) {
      results.push(rel);
    }
    return results;
  }

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }));

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = normalizeSlash(path.relative(VAULT_ROOT, fullPath));
      if (isExcluded(relPath, excludePatterns)) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        results.push(relPath);
      }
    }
  }

  walk(fullTarget);
  return results;
}

function main() {
  const config = loadConfig();
  const excludePatterns = config.exclude || [];
  const imageIndex = buildImageIndex(excludePatterns);
  const copiedImagesCache = new Map();

  let avatarUrl = null;
  if (config.site?.avatar) {
    avatarUrl = resolveAndCopyImage(config.site.avatar, '', imageIndex, copiedImagesCache);
  }

  // First pass: discover all markdown files across sections to build WikiLink lookup map
  const rawEntries = [];
  const noteSlugByName = new Map();

  for (const section of config.sections || []) {
    if (section.type === 'archive') continue;
    const sources = section.sources || [];

    for (const srcItem of sources) {
      const srcPath = typeof srcItem === 'string' ? srcItem : srcItem.path;
      const srcLabel =
        typeof srcItem === 'object' && srcItem.label
          ? srcItem.label
          : path.basename(srcPath);

      const mdFiles = collectMarkdownFiles(srcPath, excludePatterns);
      for (const relPath of mdFiles) {
        const slug = createSlug(section.id, relPath);
        const fileBaseName = path.basename(relPath, '.md').toLowerCase();
        noteSlugByName.set(fileBaseName, slug);
        rawEntries.push({
          sectionId: section.id,
          sectionTitle: section.title,
          sectionNavLabel: section.navLabel || section.title,
          sectionType: section.type,
          sourceRoot: normalizeSlash(srcPath).replace(/^\/+|\/+$/g, ''),
          sourceLabel: srcLabel,
          relPath,
          slug,
        });
      }
    }
  }

  // Second pass: parse & render each markdown file
  const allPosts = [];
  const outboundLinksMap = new Map(); // sourceSlug -> Set<targetSlug>
  let totalWordCount = 0;

  for (const item of rawEntries) {
    const fullPath = path.join(VAULT_ROOT, item.relPath);
    const rawFile = fs.readFileSync(fullPath, 'utf-8');
    const parsed = matter(rawFile);

    if (parsed.data?.draft === true) continue;

    const title = parsed.data?.title
      ? String(parsed.data.title).trim()
      : cleanTitleFromFilename(item.relPath);

    const dateObj = resolveFileDate(fullPath, item.relPath, parsed.data?.date);
    const noteRelDir = normalizeSlash(path.dirname(item.relPath));
    const outboundSlugs = new Set();

    const { html, headings, firstImageUrl, hasMermaid } = renderObsidianMarkdown(
      parsed.content,
      noteRelDir === '.' ? '' : noteRelDir,
      item.slug,
      imageIndex,
      copiedImagesCache,
      noteSlugByName,
      outboundSlugs
    );

    outboundLinksMap.set(item.slug, outboundSlugs);

    const { summary, searchText } = extractPlainAndSummary(
      parsed.content,
      parsed.data?.summary
    );
    const { wordCount, readingMinutes } = computeWordStats(parsed.content);
    totalWordCount += wordCount;

    let subFolder = '';
    if (item.relPath.startsWith(`${item.sourceRoot}/`)) {
      const insideRoot = item.relPath.slice(item.sourceRoot.length + 1);
      const dirPart = normalizeSlash(path.dirname(insideRoot));
      subFolder = dirPart === '.' ? '' : dirPart;
    }

    allPosts.push({
      ...item,
      title,
      dateIso: dateObj.toISOString(),
      dateYMD: formatDateYMD(dateObj),
      monthDay: formatMonthDay(dateObj),
      year: String(dateObj.getFullYear()),
      timestamp: dateObj.getTime(),
      tags: Array.isArray(parsed.data?.tags) ? parsed.data.tags : [],
      summary,
      searchText,
      wordCount,
      readingMinutes,
      html,
      headings,
      coverImage: firstImageUrl,
      hasMermaid,
      subFolder,
      backlinks: [],
    });
  }

  // Third pass: populate Backlinks for each post
  const postBySlug = new Map(allPosts.map((p) => [p.slug, p]));
  for (const [fromSlug, targetSlugs] of outboundLinksMap.entries()) {
    const sourcePost = postBySlug.get(fromSlug);
    if (!sourcePost) continue;
    for (const targetSlug of targetSlugs) {
      const targetPost = postBySlug.get(targetSlug);
      if (targetPost) {
        targetPost.backlinks.push({
          slug: sourcePost.slug,
          title: sourcePost.title,
          sectionTitle: sourcePost.sectionTitle,
          dateYMD: sourcePost.dateYMD,
          summary: sourcePost.summary,
        });
      }
    }
  }

  // Build structured sections for frontend rendering
  const processedSections = (config.sections || []).map((section) => {
    const sectionPosts = allPosts.filter((p) => p.sectionId === section.id);

    if (section.type === 'blog') {
      sectionPosts.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Group knowledge posts by sourceLabel -> subFolder
    const knowledgeGroups = [];
    if (section.type === 'knowledge') {
      const groupMap = new Map();
      for (const post of sectionPosts) {
        if (!groupMap.has(post.sourceLabel)) {
          groupMap.set(post.sourceLabel, {
            label: post.sourceLabel,
            sourceRoot: post.sourceRoot,
            folders: new Map(),
          });
        }
        const group = groupMap.get(post.sourceLabel);
        const folderKey = post.subFolder || '核心笔记';
        if (!group.folders.has(folderKey)) {
          group.folders.set(folderKey, []);
        }
        group.folders.get(folderKey).push({
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          dateYMD: post.dateYMD,
          wordCount: post.wordCount,
          readingMinutes: post.readingMinutes,
          headingsCount: post.headings.length,
        });
      }

      for (const grp of groupMap.values()) {
        const foldersArr = [];
        for (const [folderName, items] of grp.folders.entries()) {
          foldersArr.push({ folderName, items });
        }
        knowledgeGroups.push({
          label: grp.label,
          sourceRoot: grp.sourceRoot,
          totalCount: sectionPosts.filter((p) => p.sourceLabel === grp.label).length,
          folders: foldersArr,
        });
      }

      // Attach sibling chapter tree to each knowledge post for the 3-column ebook reader
      for (const post of sectionPosts) {
        const matchedGroup = knowledgeGroups.find((g) => g.label === post.sourceLabel);
        if (matchedGroup) {
          post.siblingTree = matchedGroup;
        }
      }
    }

    return {
      id: section.id,
      navLabel: section.navLabel || section.title,
      title: section.title,
      motto: section.motto || '',
      type: section.type,
      postCount: sectionPosts.length,
      posts: sectionPosts.map((p) => ({
        slug: p.slug,
        title: p.title,
        dateIso: p.dateIso,
        dateYMD: p.dateYMD,
        monthDay: p.monthDay,
        year: p.year,
        summary: p.summary,
        wordCount: p.wordCount,
        readingMinutes: p.readingMinutes,
        coverImage: p.coverImage,
        sourceLabel: p.sourceLabel,
        subFolder: p.subFolder,
        tags: p.tags,
      })),
      knowledgeGroups,
    };
  });

  // Link prev/next within each section
  for (const section of processedSections) {
    const slugsInOrder = section.posts.map((p) => p.slug);
    for (let i = 0; i < slugsInOrder.length; i++) {
      const postObj = postBySlug.get(slugsInOrder[i]);
      if (!postObj) continue;
      const prevSlug = i > 0 ? slugsInOrder[i - 1] : null;
      const nextSlug = i < slugsInOrder.length - 1 ? slugsInOrder[i + 1] : null;
      const prevPost = prevSlug ? postBySlug.get(prevSlug) : null;
      const nextPost = nextSlug ? postBySlug.get(nextSlug) : null;
      postObj.prev = prevPost ? { slug: prevPost.slug, title: prevPost.title } : null;
      postObj.next = nextPost ? { slug: nextPost.slug, title: nextPost.title } : null;
    }
  }

  // Build Archive grouped by year (newest first)
  const sortedForArchive = [...allPosts].sort((a, b) => b.timestamp - a.timestamp);
  const archiveByYearMap = new Map();
  for (const post of sortedForArchive) {
    if (!archiveByYearMap.has(post.year)) {
      archiveByYearMap.set(post.year, []);
    }
    archiveByYearMap.get(post.year).push({
      slug: post.slug,
      title: post.title,
      dateIso: post.dateIso,
      dateYMD: post.dateYMD,
      monthDay: post.monthDay,
      readingMinutes: post.readingMinutes,
      sectionTitle: post.sectionTitle,
      sectionId: post.sectionId,
    });
  }
  const archiveYears = Array.from(archiveByYearMap.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, items]) => ({ year, items }));

  // Build lightweight search index for Ctrl+K modal
  const searchIndex = sortedForArchive.map((p) => ({
    slug: p.slug,
    title: p.title,
    sectionTitle: p.sectionTitle,
    sourceLabel: p.sourceLabel,
    subFolder: p.subFolder,
    dateYMD: p.dateYMD,
    tags: p.tags,
    summary: p.summary,
    searchText: p.searchText,
  }));

  const output = {
    generatedAt: new Date().toISOString(),
    site: {
      ...config.site,
      avatarUrl,
    },
    home: config.home || {},
    sections: processedSections,
    archiveYears,
    searchIndex,
    totalPostsCount: allPosts.length,
    totalWordCount,
    posts: allPosts,
  };

  fs.mkdirSync(OUTPUT_DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(
    `[prepare-data] Prepared ${allPosts.length} posts (${totalWordCount.toLocaleString()} words) across ${processedSections.length} sections.`
  );
}

main();
