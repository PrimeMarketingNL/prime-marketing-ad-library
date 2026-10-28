# Prime Marketing ad library

Open `index.html` in a browser for local development. The site needs no framework or dependencies. Keep `assets/`, `js/`, and `styles.css` alongside the HTML file. For hosting, the build below prepares a separate public directory.

## Cloudflare Pages

Connect this Git repository in Cloudflare's **Workers & Pages → Create application → Pages → Connect to Git** flow. Use these build settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Root directory | Leave blank (repository root) |
| Build command | `npm run build` |
| Build output directory | `dist` |

The build uses Node.js 22 or newer and requires no packages. `.node-version` selects Node.js 22 for Cloudflare's build environment. `wrangler.jsonc` also sets the Pages output directory to `dist`. If you choose a different Pages project name, update `name` in that file to match.

To prepare the same deployment locally:

```sh
npm run build
```

Deploy **only `dist/`**, never the repository root. `scripts/build.mjs` recreates that directory from an explicit list of public HTML, CSS, and JavaScript files, and copies only the assets referenced by those files. New catalog images and thumbnails are included automatically. Add new browser scripts or stylesheets to the build's `entries` list. Keep local asset references as quoted `assets/...` paths, as in the existing code; computed paths need explicit build support.

The homepage is `index.html`. Its optimized images, webfonts, styles, and JavaScript remain accessible because browsers need them to display the page. Files in `library/`, `brand guide/`, `Fonts/`, `Logo/`, `old prototype/`, `.preview/`, Git metadata, asset manifests, and unused assets are not copied or deployed. The output includes a small `404.html` so requests for missing files return a real 404 instead of Cloudflare's default homepage fallback.

The existing `noindex,nofollow` meta directive is retained, and `_headers` applies it to all deployed files. These directives ask search engines not to index content; they do not make the website private. Keep the Git repository private if its original files should remain private on GitHub or GitLab. For a login-protected website, configure Cloudflare Access separately.

Cloudflare automatically builds and deploys subsequent pushes to the connected branch. The generated `dist/` is ignored by Git.

Cloudflare documentation: [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [serving pages and 404 behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/).

The page presents real artwork from `library/Ad library 2026/` as a browsable collection, with brand search, two collection filters (All creatives and Whitepapers), and progressive loading. Ad cards are intentionally non-clickable. The hero shows three continuously scrolling columns with alternating directions, using square static artwork. The existing scroll-driven 1:1-to-4:5 comparison is retained, including its short-screen and reduced-motion fallbacks.

## Content and media

`js/creatives.js` is the page's static creative catalog. Each entry records the client, descriptive title, category, format, dimensions, optimized image URL, and thumbnail. Update this catalog to add or reorder work. Keeping it as a script lets the page work when opened directly from disk, without a fetch request or local server.

`assets/library/manifest.json` records the relationship between original files and optimized WebP/WebM assets. Original files remain in `library/`. Small WebP variants serve the hero and responsive gallery; full-size WebP variants preserve ad readability. The page uses static WebP creative only; animated ad assets are absent from its catalog and rendering code. The main collection starts with twelve creatives and loads twelve more at a time.

All 52 supplied media files are converted: 49 WebP images and 3 WebM animations. Primary media totals 5.43 MB, down from 82.25 MB (93.4% smaller); every thumbnail and poster brings generated media to 6.39 MB. The page displays 47 static creatives: 36 square ads in the main library and all 11 portrait ads in the dedicated 4:5 collection. The animated ads and the Nance and Woonstaete artwork containing placeholder copy are excluded from the page.

The format demonstration uses real portrait artwork. The 4:5 collection is a continuously flowing carousel of all 11 portrait creatives, with horizontal swipe/scroll and previous/next buttons. Duplicate slides make the loop seamless and are hidden from accessibility tools. The no-JavaScript version provides a static selection and a fully expanded format example.

## Brand and motion

The page uses Prime's existing Safiro and Stabil Grotesk webfonts, logo, and palette. The animated gradient and grain treatment are reproduced from `primemarketing.nl`; the gradient contains the same four radial fields on 50-second motion paths. Blue, 4px-radius buttons use the orange lightning mark from the live site's visual language.

The page respects the device's reduced-motion setting, which stops the hero columns and portrait carousel and switches the ambient gradient to its static equivalent. The carousel keeps moving on mouse hover and pauses while focused, manually scrolled, outside the viewport, or in a hidden tab. Hero scrolling pauses on hover and outside the viewport. There are no visible pause controls.

The hero and agency section use the animated gradient. The ad library, portrait carousel, and footer use the light background, with the full-color Prime logo in the footer.

Agency outcome figures link directly to their supporting Prime case studies. The strategy-session buttons link to Prime's existing intake page. The existing `noindex,nofollow` directive is retained when publishing.

## Verification

All 97 focused browser checks pass. Verification covers the two collection filters, search and progressive loading, exclusive portrait placement, no video elements or requests, automatic carousel looping and controls, native swipes, desktop/tablet/phone/small-phone layouts, reduced motion, loaded images, and the preserved format comparison. Local check scripts and screenshots are stored in ignored `.preview/`.
