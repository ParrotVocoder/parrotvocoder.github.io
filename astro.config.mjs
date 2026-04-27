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

function extractImageSources(pageSource) {
  const sources = new Set();
  const imgTagRegex = /<img\b[^>]*\bsrc=(['"])(.*?)\1/gi;
  for (const match of pageSource.matchAll(imgTagRegex)) {
    const src = match[2];
    if (src.startsWith('/')) {
      sources.add(src);
    }
  }
  return [...sources].sort();
}

function sitemapXml(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries.map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
      const images = (entry.images ?? [])
        .map((imageUrl) => `\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n    </image:image>`)
        .join('');
      return `  <url>\n    <loc>${escapeXml(entry.url)}</loc>${lastmod}${images}\n  </url>`;
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

          const pageFiles = await listPageFiles(pagesDir);
          const pageEntries = [];

          for (const pageFile of pageFiles) {
            const pageSource = await fs.readFile(pageFile, 'utf-8');
            const stats = await fs.stat(pageFile);
            const pageUrl = pagePathToUrl(pageFile, pagesDir, baseUrl);
            const images = extractImageSources(pageSource).map((src) => `${baseUrl}${src.replace(/^\//, '')}`);
            pageEntries.push({ url: pageUrl, lastmod: stats.mtime.toISOString(), images });
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
