# ParrotSpeech.org (Astro)

Static Astro website for `parrotspeech.org`, focused on Arielle the talking macaw, research content, media playback, and long-form educational pages.

## Tech Stack

- Framework: Astro 5 (`astro`)
- Runtime: Node.js (ESM)
- Integrations: `@astrojs/sitemap`
- Styling: Global CSS + page/component-scoped Astro `<style>` blocks
- Hosting target: Static output from Astro build (`dist/`)

## Scripts

- `npm run dev`: Start Astro dev server
- `npm run build`: Build production site
- `npm run preview`: Preview production build locally
- `npm run astro`: Run Astro CLI directly

## Project Structure

```text
.
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── clipart/
│   ├── favicon/
│   ├── files/
│   ├── images/
│   ├── media/
│   └── sounds/
└── src/
		├── components/
		├── layouts/
		├── pages/
		└── styles/
```

### `src/layouts`

- `BaseLayout.astro`
	- Shared HTML shell (`<head>`, meta tags, favicon links, analytics script)
	- Defines two slots:
		- named slot `navigation`
		- default slot for page content
	- Imports global stylesheet: `src/styles/global.css`

### `src/components`

- `Navigation.astro`: Left sidebar navigation menu with active link highlighting
- `AudioPlayer.astro`: Reusable audio player wrapper with caption support
- `HighlightBox.astro`: Reusable yellow emphasis box for transcriptions/notices
- `NoticeSection.astro`: Shared informational callout section
- `Footer.astro`: Footer content + visitor counter fetch from GoatCounter JSON API
- `Breadcrumb.astro`: Breadcrumb display component (currently markup commented in file)

### `src/pages`

Top-level routes are file-based Astro pages:

- `/` (`index.astro`)
- `/welcome` (`welcome.astro`)
- `/photo-album` (`photo-album.astro`)
- `/macaw-speech` (`macaw-speech.astro`)
- `/difficulties-interspecies-communication` (`difficulties-interspecies-communication.astro`)
- `/recording-bird-speech` (`recording-bird-speech.astro`)
- `/related-links` (`related-links.astro`)
- `/another-mind` (`another-mind.astro`)
- `/history-background` (`history-background.astro`)
- `/contact` (`contact.astro`)
- `/speech-investigation` (`speech-investigation.astro`)
- `/services` (`services.astro`)

## Architecture Overview

1. Routing

- Astro file-based routing maps each `.astro` page in `src/pages` to a public route.

2. Layout Composition

- Each page imports `BaseLayout.astro`.
- Pages pass metadata (`title`, `description`) to layout props for SEO and page title.
- Pages inject `Navigation.astro` into the `navigation` slot.

3. Styling Model

- Global baseline styles in `src/styles/global.css`:
	- typography, base colors, page wrapper, navigation/sidebar, utility classes, media defaults.
- Page-specific styles are colocated inside each page file in `<style>`.
- Component-specific styles are scoped in component files unless marked `is:global`.

4. Media and Static Assets

- Static files are served from `public/`.
- Typical usage:
	- images in `/public/images`
	- audio in `/public/media` or `/public/sounds`
	- downloadable files in `/public/files`

5. Analytics and Counter

- GoatCounter script is loaded globally in `BaseLayout.astro`.
- `Footer.astro` fetches counter JSON from GoatCounter and renders visitor count.

## Sitemap Generation

`astro.config.mjs` includes two sitemap behaviors:

- Standard sitemap generation via `@astrojs/sitemap`
- Custom integration (`sitemap-assets`) that:
	- recursively scans `public/` for media/image asset extensions
	- creates `sitemap-assets.xml` in build output
	- injects that assets sitemap into `sitemap-index.xml`

This ensures both route URLs and static asset URLs are discoverable.

## Responsive Design Strategy

The site uses a classic sidebar layout on desktop and collapses to a stacked layout on smaller screens via global breakpoints in `global.css`.

Recommended pattern for pages/components:

- avoid fixed pixel widths on `<video>`, `<iframe>`, and other embedded media
- use wrapper classes with `width: 100%`, `max-width`, and `aspect-ratio`
- scale large headings/body text down under `768px`
- preserve readable spacing while reducing padding/margins on narrow viewports

## Development Notes

- Keep content assets under `public/` to avoid bundling overhead.
- Prefer shared components for repeated UI patterns (audio blocks, highlights, notices, footer).
- Avoid naming collisions with global utility class names (for example `.main-content` already exists globally).
