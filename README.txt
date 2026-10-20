AZZAM AL-SAEDI / LIQUID GLASS PORTFOLIO
====================================

START
Unzip the whole folder, then open index.html in a browser.
For hosting, upload the folder contents with index.html at the root.
No installation, build step, framework, API key or backend is required.

FILES
index.html   Complete bilingual portfolio content.
style.css    Layout, responsive rules, liquid-glass navbar and visual effects.
script.js    Language + theme switch, project selector, motion controls, menu, nav indicator,
             scroll reveals and email draft.
orb.js       The live sphere: WebGL shader drawing animated contour lines (no libraries).
             Falls back to assets/contour-orb.svg if WebGL is unavailable.
assets/      CV, favicon, contour-sphere SVG.
assets/fonts/     IBM Plex Sans + IBM Plex Sans Arabic (bundled, works offline, OFL licence).
assets/projects/  Case-study covers (WebP, 720px + 1280px) used in the sphere card and the work grid.
                  To change one, replace both sizes and keep the file names.
Icons: Phosphor Icons (MIT), embedded as an inline SVG sprite at the top of index.html.
VALIDATION.json  Static checks and verification limits.

DESIGN
Inspired by the supplied reference's warm background, spacious composition,
central blue contour sculpture and quiet edge typography. The site is adapted
to Azzam's actual projects, career, education, certifications and contact details.
The reference screenshot and its other person's name/content are not included.

The navbar uses translucent layers, backdrop blur, saturation, reflections and
soft inset shadows. It has an opaque fallback when backdrop-filter is unavailable.
At 900px and below it moves to the bottom for easier thumb access and the hero stacks vertically.
The native directory menu exposes all sections and the résumé.

INTERACTIONS
- Dark mode: follows the device setting; the sun/moon button in the nav overrides it
  (remembered). Colours live as tokens at the top of style.css (light + dark blocks).
- The sphere is live: contour lines flow slowly, lean toward the cursor, and each
  project turns it to its own landscape with a ripple. Pause motion stops it.
- The hero background is an animated gradient with a cursor spotlight.
- Liquid-glass nav and card: blur + specular highlight + rim; on Chrome/Edge they
  also refract what is behind them.
- The project card (image, title, summary, link) sits inside the sphere. Click a project name,
  use the arrows on the card, or swipe the card on touch screens to switch projects.
- To use real screenshots: replace the files in assets/projects/ (keep the names, or change
  the src in index.html). Any 16:10 PNG/JPG/WebP works; it is cropped to fit.
- Arrow keys, Home and End also operate the project selector when focused.
- Explore project links jump to the full original descriptions below.
- English initially; switch to Arabic for RTL layout. Language is remembered
  locally where browser storage is available.
- The sculpture has restrained floating/parallax motion, a pause control,
  reduced-motion support and automatic pausing when offscreen or the tab is hidden.
- The form validates, then prepares a mailto draft in the visitor's email app.
  The visitor must send it there. Nothing is sent or stored by this static site.
- Email copy uses the clipboard when available; otherwise the address is shown
  for manual copying. Clipboard access may require HTTPS.
- Main content, direct links, directory and CV remain available without JavaScript.

CUSTOMIZE
Edit the CSS variables at the top of style.css for colors.
Change both data-ar and data-en when editing translated text in index.html.
Keep PDF and asset paths relative so the folder continues to work independently.

PERFORMANCE
No external requests. IBM Plex is bundled locally (6 woff2 files, ~200 KB, loaded only when used). The artwork is SVG, not a
WebGL scene. PDF downloads only when requested. Initial page assets total about
174 KB before compression, roughly 55 KB estimated gzip. Actual transfer sizes
and load times depend on hosting, device and network.

VERIFICATION
Passed static checks: HTML nesting, unique IDs, one H1, local file/fragment links,
translation/ARIA references, project selector-panel matching, original portfolio
content/links and unchanged CV checksum, SVG XML and JavaScript syntax.

A browser test environment was unavailable: the complete page was not visually
rendered or tested on real touch devices, and no Lighthouse/Core Web Vitals
score is claimed. Test the chosen layout on the target browsers before public use.
External portfolio links were preserved but not checked for current availability.

بالعربية
========
فك الضغط بالكامل وافتح index.html. الموقع مستقل بـHTML وCSS وJavaScript فقط.
يمكنك تبديل اللغة من شريط التنقل الزجاجي، واختيار مشروع من الواجهة الرئيسية،
وتحميل السيرة الذاتية. على الهاتف يظهر شريط التنقل أسفل الشاشة.
نموذج التواصل يفتح مسودة في تطبيق البريد؛ لا يرسل الرسالة تلقائيًا.
نجحت الفحوص الثابتة للملفات والروابط؛ لم يتوفر اختبار متصفح بصري أو لمس فعلي.
