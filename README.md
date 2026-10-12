# Prime Marketing ad library

Open `index.html` in a browser. This is a buildless static site: no installation, framework, or build step is needed. Keep `assets/`, `js/`, and `styles.css` alongside the HTML file.

The page presents real artwork from `library/Ad library 2026/` as a browsable collection, with brand search, two collection filters (All creatives and Whitepapers), and progressive loading. Ad cards are intentionally non-clickable. The hero shows three continuously scrolling columns with alternating directions, using square static artwork. The existing scroll-driven 1:1-to-4:5 comparison is retained, including its short-screen and reduced-motion fallbacks.

## Content and media

`js/creatives.js` is the page's static creative catalog. Each entry records the client, descriptive title, category, format, dimensions, optimized image URL, and thumbnail. Update this catalog to add or reorder work. Keeping it as a script lets the page work when opened directly from disk, without a fetch request or local server.

`assets/library/manifest.json` records the relationship between original files and optimized WebP/WebM assets. Original files remain in `library/`. Small WebP variants serve the hero and responsive gallery; full-size WebP variants preserve ad readability. The page uses static WebP creative only; animated ad assets are absent from its catalog and rendering code. The main collection starts with twelve creatives and loads twelve more at a time.

All 52 supplied media files are converted: 49 WebP images and 3 WebM animations. Primary media totals 5.43 MB, down from 82.25 MB (93.4% smaller); every thumbnail and poster brings generated media to 6.39 MB. The page displays 47 static creatives: 36 square ads in the main library and all 11 portrait ads in the dedicated 4:5 collection. The animated ads and the Nance and Woonstaete artwork containing placeholder copy are excluded from the page.

The format demonstration uses real portrait artwork. The 4:5 collection is a continuously flowing carousel of all 11 portrait creatives, with horizontal swipe/scroll, previous/next buttons, and a pause control. Duplicate slides make the loop seamless and are hidden from accessibility tools. The no-JavaScript version provides a static selection and a fully expanded format example.

## Brand and motion

The page uses Prime's existing Safiro and Stabil Grotesk webfonts, logo, and palette. The animated gradient and grain treatment are reproduced from `primemarketing.nl`; the gradient contains the same four radial fields on 50-second motion paths. Blue, 4px-radius buttons use the orange lightning mark from the live site's visual language.

Pause animation stops the hero columns and portrait carousel and switches the ambient gradient to its static equivalent. The page respects the device's reduced-motion setting. The carousel also pauses while hovered, focused, manually scrolled, outside the viewport, or in a hidden tab; its own pause control works independently. Hero scrolling pauses outside the viewport.

Agency outcome figures link directly to their supporting Prime case studies. The strategy-session buttons link to Prime's existing intake page. This checkout remains a local design preview; the existing `noindex,nofollow` directive is retained.

## Verification

All 97 focused browser checks pass. Verification covers the two collection filters, search and progressive loading, exclusive portrait placement, no video elements or requests, automatic carousel looping and controls, native swipes, desktop/tablet/phone/small-phone layouts, reduced motion, loaded images, and the preserved format comparison. Local check scripts and screenshots are stored in ignored `.preview/`.
