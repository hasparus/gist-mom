# DESIGN AUDIT RESULTS

**Overall Assessment:** The app is functional and structurally sound — editor-always-visible is the right call — but it looks like a raw prototype. There's no typographic system, no spacing scale, no color palette. Everything is browser-default buttons, hardcoded pixel values, and system fonts. The bones are good. The surface needs to be designed.

---

## PHASE 1 — Critical

**1. Navbar / EditorPage toolbar — double chrome, no hierarchy**
- **What's wrong:** Two horizontal bars stack at top: Navbar (`gist.mom` + user menu) and toolbar (`hasparus/a8390723` + Preview + Commit). Both use `borderBottom: 1px solid #e5e5e5`. They compete visually, waste vertical space, and the gist slug is crammed left with 13px text that's easy to miss.
- **What it should be:** Merge into a single top bar. Left: `gist.mom` logo. Center-left: `hasparus/a8390723` breadcrumb. Right: `Preview` toggle + `Commit` button + user avatar. One border, one rhythm.
- **Why:** Two bars of chrome on a tool that's essentially a text editor is clutter. Every pixel of vertical space is content space. The eye has no single anchor — two competing strips create visual noise.

**2. Buttons are unstyled browser defaults**
- **What's wrong:** `<button>` elements render as OS-default buttons (bordered, raised, gray). `Preview` and `Commit` have `fontSize: 13` but no other styling. `Sign in with GitHub` is completely unstyled. These look broken, not minimal.
- **What it should be:** Ghost buttons with subtle hover states. `Commit` as primary action gets a filled style (dark bg, white text). `Preview` as toggle gets an active/inactive state. `Sign in with GitHub` gets proper contrast and padding.
- **Why:** Unstyled defaults signal "unfinished" not "minimal." Interactive elements must look intentionally designed. The Commit button is the most important action — it should be visually distinct.

**3. No CSS reset / base styles**
- **What's wrong:** No `<style>`, no CSS file, no reset. Body has default margins. No `font-family` set on `<html>` or `<body>`. Typography inherits browser defaults (Times New Roman fallback). Line heights, margins on `<p>`, `<h2>` in preview are all browser defaults.
- **What it should be:** A minimal CSS reset: `box-sizing: border-box`, `margin: 0`, system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", ...`), base `color` and `background`. Preview markdown needs prose styles.
- **Why:** Without a reset, every component fights the browser. The preview panel renders raw markdown with default UA styles — `<h2>` has massive margins, `<p>` is Times New Roman on some browsers. This is the foundation everything else sits on.

**4. Mobile is broken**
- **What's wrong:** At 375px, the toolbar row (`hasparus/a8390723` + Preview + Commit) overflows or wraps awkwardly. The user menu button with full name "Piotr Monwid-Olechnowicz" is way too wide for mobile. No touch targets meet 44px minimum.
- **What it should be:** On mobile: user menu shows avatar only (no name). Toolbar buttons stack or collapse. Touch targets are minimum 44x44px. The gist slug truncates properly.
- **Why:** This is a writing tool. Mobile users will read and make small edits. If the chrome doesn't fit the viewport, it's hostile UX.

**Review:** Phase 1 addresses structural failures — double chrome, missing CSS foundation, broken mobile, unstyled controls. These must be fixed before any refinement makes sense. Without Phase 1, the app looks unfinished.

---

## PHASE 2 — Refinement

**5. Editor toolbar spacing and alignment**
- **What's wrong:** Toolbar uses `gap: 8`, `padding: "4px 16px"`. The gist slug, buttons, and right edge don't align with the editor's gutter. Spacing between elements feels arbitrary.
- **What it should be:** Toolbar padding should match editor gutter width. Buttons should have consistent padding (`8px 12px`). Elements should breathe — gap of 12px between action buttons, 8px between slug and spacer.
- **Why:** Alignment between chrome and content creates visual continuity. The toolbar feels disconnected from the editor below it.

**6. Preview panel typography**
- **What's wrong:** Preview uses `padding: "16px 32px"`, `maxWidth: 720`. No prose typography — headings, paragraphs, lists, code blocks all use browser defaults. The `diff` code block has no styled container. Links are default blue underline.
- **What it should be:** Proper prose styles: heading sizes (h1: 24px, h2: 20px, h3: 16px), paragraph line-height 1.6, code blocks with background `#f6f8fa` and border-radius 6px, inline code with subtle background, list indentation, link color matching the palette.
- **Why:** The preview is how users see their rendered markdown. If it looks ugly, the tool feels like it produces ugly output. The preview IS the product.

**7. Color palette lacks intention**
- **What's wrong:** Colors are scattered: `#e5e5e5` borders, `#666` slug text, `#24292f` menu text, `#d0d7de` avatar border, `#6e7781` fallback bg, `#cf222e` danger red, `#d8dee4` separator, `#f6f8fa` hover. These are loosely GitHub-flavored but not systematized.
- **What it should be:** Define 5-6 core tokens: `--border` (one consistent value), `--text-primary`, `--text-secondary`, `--text-muted`, `--bg-hover`, `--bg-surface`. Use them everywhere.
- **Why:** Inconsistent grays create visual noise. Three different border colors (`#e5e5e5`, `#d0d7de`, `#d8dee4`) in one app is undisciplined. A system makes every new component automatic.

**8. User menu dropdown needs refinement**
- **What's wrong:** Dropdown is functional but: the trigger button has invisible border (`1px solid transparent`) which causes subtle layout shift on hover, the chevron rotation is the only animation, menu items have 6px vertical padding (tight for touch), no focus-visible ring for keyboard nav.
- **What it should be:** Trigger: remove invisible border, use padding alone. Add subtle fade/scale animation on menu open. Menu items: 8px vertical padding minimum. Focus-visible ring: `2px solid #0969da` with 2px offset.
- **Why:** The menu is production-quality functionally (ARIA, click-outside, Escape) but the visual polish doesn't match. Focus states are critical for accessibility.

**Review:** Phase 2 builds the design system the app currently lacks — consistent spacing, color tokens, prose typography, and polished interactive states. This is where "works" becomes "feels right."

---

## PHASE 3 — Polish

**9. "Connecting..." loading state**
- **What's wrong:** When Y.js is connecting, the user sees `<div style={{ padding: 32 }}>Connecting...</div>` — raw text, no visual treatment.
- **What it should be:** A subtle pulse animation or skeleton shimmer matching the editor's line height. The word "Connecting..." is fine, but it should feel alive, not static.
- **Why:** The first 1-2 seconds of load are the user's first impression. A static text label feels frozen.

**10. Editor/Preview split divider**
- **What's wrong:** Split view uses `borderLeft: "1px solid #e5e5e5"` — a hard line. No resize handle. No way to adjust proportions.
- **What it should be:** A draggable divider (2px wide, cursor: col-resize) with subtle hover highlight. Or at minimum, a visually softer separator.
- **Why:** Power users will want more editor or more preview. Even without drag, the visual treatment should feel intentional — the current border is identical to every other border, giving it no semantic meaning.

**11. Commit feedback**
- **What's wrong:** Commit button text changes to "Committing..." but there's no success/failure feedback. After commit, button just goes back to "Commit" — the user doesn't know if it worked.
- **What it should be:** Brief success state — button text becomes "Committed" with a check icon for 2 seconds, or turns red briefly on failure with "Failed". No toast/modal needed.
- **Why:** Commit is the highest-stakes action. Silence after a critical action creates anxiety.

**12. Cursor party (multiplayer presence)**
- **What's wrong:** Y.js awareness shows remote cursors in the editor (via yCollab) but there's no user presence indicator in the UI — no list of who's connected, no cursor labels.
- **What it should be:** This is a design decision — potentially a subtle presence dot or avatar stack in the toolbar showing connected users. Flagging for product decision.
- **Why:** Multiplayer is the app's differentiator. If users can't see who else is editing, the collaboration feels invisible.

**Review:** Phase 3 is where the app goes from "solid tool" to "delightful tool." Loading states, feedback, and presence indicators are the details that make users feel the care put into the product.
