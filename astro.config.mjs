// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
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

function ensureTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function assetSitemapXml(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${entry.url}</loc>${lastmod}\n  </url>`;
    }),
    '</urlset>',
    '',
  ].join('\n');
}

function addAssetSitemapToIndex(indexXml, assetSitemapUrl) {
  if (indexXml.includes(`<loc>${assetSitemapUrl}</loc>`)) {
    return indexXml;
  }

  const sitemapEntry = `  <sitemap>\n    <loc>${assetSitemapUrl}</loc>\n  </sitemap>`;
  if (indexXml.includes('</sitemapindex>')) {
    return indexXml.replace('</sitemapindex>', `${sitemapEntry}\n</sitemapindex>`);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemapEntry,
    '</sitemapindex>',
    '',
  ].join('\n');
}

// https://astro.build/config
export default defineConfig({
  site: 'https://parrotspeech.org',
  integrations: [
    sitemap(),
    {
      name: 'sitemap-assets',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const publicDir = path.join(process.cwd(), 'public');
          const distDir = dir.pathname;
          const baseUrl = ensureTrailingSlash('https://parrotspeech.org');
          const assetFiles = await listAssetFiles(publicDir);
          const entries = assetFiles
            .map(({ fullPath, mtime }) => {
              const relativePath = path.relative(publicDir, fullPath).split(path.sep).join('/');
              return { url: `${baseUrl}${relativePath}`, lastmod: mtime };
            })
            .sort((a, b) => a.url.localeCompare(b.url));

          const assetsXml = assetSitemapXml(entries);
          const assetsSitemapPath = path.join(distDir, 'sitemap-assets.xml');
          await fs.writeFile(assetsSitemapPath, assetsXml, 'utf-8');

          const indexPath = path.join(distDir, 'sitemap-index.xml');
          let indexXml = '';
          try {
            indexXml = await fs.readFile(indexPath, 'utf-8');
          } catch (error) {
            if (error?.code !== 'ENOENT') {
              throw error;
            }
          }

          const assetsSitemapUrl = `${baseUrl}sitemap-assets.xml`;
          const updatedIndex = addAssetSitemapToIndex(indexXml, assetsSitemapUrl);
          await fs.writeFile(indexPath, updatedIndex, 'utf-8');
        },
      },
    },
  ],
});
