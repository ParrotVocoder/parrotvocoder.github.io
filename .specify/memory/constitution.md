# ParrotSpeech.org Constitution

A static website showcasing Arielle, a Blue and Gold macaw demonstrating remarkable cognitive speech abilities. Built with Astro and hosted on GitHub Pages.

## Core Principles

### I. Content-First Design

- Educational content about Arielle's speech abilities is the primary focus
- Every page must serve a clear purpose: inform, demonstrate, or engage visitors
- Preserve the authentic, personal voice documenting Arielle's journey
- Audio samples and transcriptions are core content—ensure accessibility

### II. Component Architecture

- Reusable Astro components for consistent UI patterns
- **Required components**: `BaseLayout`, `Navigation`, `AudioPlayer`, `HighlightBox`, `Footer`, `Breadcrumb`
- Components must accept typed props with sensible defaults
- Scoped styles preferred; global styles only in `src/styles/global.css`
- All pages extend `BaseLayout` for consistent structure

### III. Accessibility & Performance

- All audio content must have text transcriptions (HighlightBox component)
- Images require meaningful alt text
- Semantic HTML structure (article, section, nav, header, footer)
- Maintain keyboard navigation support
- Zero JavaScript required for core content consumption
- Static-first: leverage Astro's zero-JS output where possible

### IV. File Organization

```text
src/
├── components/       # Reusable Astro components
├── layouts/          # Page layouts (BaseLayout.astro)
├── pages/            # Route-based pages (*.astro)
└── styles/           # Global CSS

public/
├── images/           # Photographs of Arielle
├── media/            # Audio recordings (.wav)
├── sounds/           # Additional audio samples
├── files/            # Downloadable documents (PDFs)
├── favicon/          # Site icons and manifest
└── clipart/          # Decorative assets and backgrounds
```

### V. Styling Standards

- CSS custom properties defined in `global.css` for theming
- Primary color: `#009966` (green), Secondary: `#FF0000` (red), Accent: `#00CCCC` (cyan)
- Responsive layout with sidebar navigation (desktop) and stacked layout (mobile)
- Print styles must hide navigation and maximize content width
- Font stack: Times New Roman (body), Arial (navigation, UI elements)

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Astro | ^5.17.1 |
| Language | TypeScript (optional) | - |
| Styling | CSS (scoped + global) | - |
| Hosting | GitHub Pages | - |

## Development Workflow

### Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Adding New Pages

1. Create `src/pages/page-name.astro`
2. Import and use `BaseLayout` with Navigation slot
3. Add page to `navItems` array in `Navigation.astro`
4. Include `Footer` component at bottom of content
5. Use `Breadcrumb` for secondary pages

### Adding Audio Content

1. Place audio file in `public/media/` or `public/sounds/`
2. Use `AudioPlayer` component with src, caption props
3. Add transcription below using `HighlightBox` component
4. Ensure caption describes what the audio contains

## Content Guidelines

- **Transcriptions**: Always provide written transcription for audio samples
- **Image captions**: Include copyright attribution (© Michael Dalton)
- **Scientific accuracy**: Document speech samples accurately; note context
- **Terminology**: Use "cognitive speech" or "purposeful speech" rather than "talking" when emphasizing understanding

## Quality Gates

- [ ] All pages render without JavaScript errors
- [ ] Navigation links work and highlight current page
- [ ] Audio players function with fallback download links
- [ ] Mobile layout is usable at 320px viewport width
- [ ] All images have alt text
- [ ] `npm run build` completes without errors

## Governance

This constitution guides development of ParrotSpeech.org. Changes should maintain the site's educational mission and accessibility standards.

**Version**: 1.0.0 | **Ratified**: 2026-02-06 | **Last Amended**: 2026-02-06
