// @ts-check
import { defineConfig } from 'astro/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const assetExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.mp4',
  '.webm',
  '.mov',
  '.ogv',
]);

async function listAssetFiles(rootDir) {
  const files = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (assetExtensions.has(path.extname(entry.name).toLowerCase())) {
        try {
          const stats = await fs.stat(fullPath);
          files.push({ fullPath, mtime: stats.mtime.toISOString() });
        } catch (err) {
          // If stat fails for some reason, still include the file without mtime
          files.push({ fullPath, mtime: null });
        }
      }
    }
  }
  try {
    await walk(rootDir);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
  return files;
}

async function listPageFiles(rootDir) {
  const files = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && fullPath.endsWith('.astro')) {
        files.push(fullPath);
      }
    }
  }

  try {
    await walk(rootDir);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  return files;
}

function ensureTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function cleanText(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&copy;', '©')
    .replaceAll('&reg;', '®')
    .replaceAll('&mdash;', '—')
    .replaceAll('&ndash;', '–')
    .replaceAll('&hellip;', '…')
    .replace(/\s+/g, ' ')
    .trim();
}

function humanizeFilename(src) {
  const filename = path.basename(src, path.extname(src));
  return cleanText(
    filename
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function pagePathToUrl(pagePath, pagesDir, baseUrl) {
  const relativePath = path.relative(pagesDir, pagePath).split(path.sep).join('/');
  const withoutExtension = relativePath.replace(/\.astro$/, '');

  if (withoutExtension === 'index') {
    return baseUrl;
  }

  const routePath = withoutExtension.endsWith('/index')
    ? withoutExtension.slice(0, -'/index'.length)
    : withoutExtension;

  return ensureTrailingSlash(`${baseUrl}${routePath}`);
}

function getPageSitemapHints(pageUrl) {
  const pathname = new URL(pageUrl).pathname;

  if (pathname === '/') {
    return { changefreq: 'daily', priority: '1.0' };
  }

  if (['/contact/', '/services/', '/related-links/'].includes(pathname)) {
    return { changefreq: 'monthly', priority: '0.4' };
  }

  return { changefreq: 'weekly', priority: '0.8' };
}

function extractImageMetadata(pageSource) {
  const images = new Map();
  const figureRegex = /<figure\b[^>]*>([\s\S]*?)<\/figure>/gi;
  for (const match of pageSource.matchAll(figureRegex)) {
    const figureBlock = match[1];
    const figureCaptionMatch = figureBlock.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
    const figureCaption = figureCaptionMatch ? cleanText(figureCaptionMatch[1]) : '';
    const imgTagRegex = /<img\b[^>]*\bsrc=(['"])(.*?)\1[^>]*>/gi;

    for (const imgMatch of figureBlock.matchAll(imgTagRegex)) {
      const tag = imgMatch[0];
      const src = imgMatch[2];
      if (!src.startsWith('/')) {
        continue;
      }

      const altMatch = tag.match(/\balt=(['"])(.*?)\1/i);
      const altText = altMatch ? cleanText(altMatch[2]) : '';
      const title = altText || humanizeFilename(src);
      const caption = figureCaption || altText || title;

      images.set(src, { src, title, caption });
    }
  }

  const imgTagRegex = /<img\b[^>]*\bsrc=(['"])(.*?)\1[^>]*>/gi;
  for (const imgMatch of pageSource.matchAll(imgTagRegex)) {
    const tag = imgMatch[0];
    const src = imgMatch[2];
    if (!src.startsWith('/')) {
      continue;
    }

    if (images.has(src)) {
      continue;
    }

    const altMatch = tag.match(/\balt=(['"])(.*?)\1/i);
    const altText = altMatch ? cleanText(altMatch[2]) : '';
    const title = altText || humanizeFilename(src);
    const caption = altText || title;
    images.set(src, { src, title, caption });
  }

  return [...images.values()].sort((left, right) => left.src.localeCompare(right.src));
}

function sitemapXml(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries.map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
      const changefreq = entry.changefreq ? `\n    <changefreq>${escapeXml(entry.changefreq)}</changefreq>` : '';
      const priority = entry.priority ? `\n    <priority>${escapeXml(entry.priority)}</priority>` : '';
      const images = (entry.images ?? [])
        .map((image) => {
          const title = image.title ? `\n      <image:title>${escapeXml(image.title)}</image:title>` : '';
          const caption = image.caption ? `\n      <image:caption>${escapeXml(image.caption)}</image:caption>` : '';
          const license = image.license ? `\n      <image:license>${escapeXml(image.license)}</image:license>` : '';
          return `\n    <image:image>\n      <image:loc>${escapeXml(image.url)}</image:loc>${title}${caption}${license}\n    </image:image>`;
        })
        .join('');
      return `  <url>\n    <loc>${escapeXml(entry.url)}</loc>${lastmod}${changefreq}${priority}${images}\n  </url>`;
    }),
    '</urlset>',
    '',
  ].join('\n');
}

// https://astro.build/config
export default defineConfig({
  site: 'https://parrotspeech.org',
  integrations: [
    {
      name: 'sitemap-assets',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const publicDir = path.join(process.cwd(), 'public');
          const pagesDir = path.join(process.cwd(), 'src', 'pages');
          const distDir = dir.pathname;
          const baseUrl = ensureTrailingSlash('https://parrotspeech.org');
          const imageLicenseUrl = `${baseUrl}license`;

          const pageFiles = await listPageFiles(pagesDir);
          const pageEntries = [];

          for (const pageFile of pageFiles) {
            const pageSource = await fs.readFile(pageFile, 'utf-8');
            const stats = await fs.stat(pageFile);
            const pageUrl = pagePathToUrl(pageFile, pagesDir, baseUrl);
            const images = extractImageMetadata(pageSource).map((image) => ({
              url: `${baseUrl}${image.src.replace(/^\//, '')}`,
              title: image.title,
              caption: image.caption,
              license: imageLicenseUrl,
            }));
            const hints = getPageSitemapHints(pageUrl);
            pageEntries.push({
              url: pageUrl,
              lastmod: stats.mtime.toISOString(),
              changefreq: hints.changefreq,
              priority: hints.priority,
              images,
            });
          }

          const assetsXml = sitemapXml(pageEntries.sort((a, b) => a.url.localeCompare(b.url)));
          await fs.writeFile(path.join(distDir, 'sitemap.xml'), assetsXml, 'utf-8');

          try {
            await fs.unlink(path.join(distDir, 'sitemap-assets.xml'));
          } catch (error) {
            if (error?.code !== 'ENOENT') {
              throw error;
            }
          }
        },
      },
    },
  ],
});
