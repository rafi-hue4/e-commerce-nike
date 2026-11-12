# UI Context

## Theme

Light-only editorial streetwear showcase (`color-scheme: light`). Pure `#ffffff` stage and right-hand panel surfaces with `#151413` primary ink, `#0e0e0e` high-contrast accents, `#66625c` muted labels, and `#c8c8c8` 1px structural rules. Transparent-background WebP model cut-outs and product thumbnails sit directly on white surfaces with radial contact shadows beneath models.

## Colors

Root Shopify Horizon tokens and `<runway-section>` design tokens:

| Role | CSS Variable | Value |
| --- | --- | --- |
| Stage background | `--rw-c-stage` / `--rw-stage` | `#ffffff` |
| Panel background | `--rw-c-panel` / `--rw-panel` | `#ffffff` |
| Primary ink / text | `--rw-c-text` / `--rw-text` / `--rw-head` | `#151413` |
| Muted text | `--rw-c-muted` / `--rw-muted` | `#66625c` |
| Accent | `--rw-c-accent` / `--rw-accent` | `#0e0e0e` |
| On-accent ink | `--rw-c-on-accent` / `--rw-on-accent` | `#ffffff` |
| Hairline dividers | `--rw-c-line` / `--rw-line` | `#c8c8c8` |
| Header border / bag rule | `.site-header` / `#bag-dialog` | `#e4e4e4` / `#d9d9d9` |
| Primary button | `--color-primary-button-background` / `--rw-btn-bg` | `#151413` |
| Primary button text | `--color-primary-button-text` / `--rw-btn-fg` | `#ffffff` |

## Typography

| Role | Font | Sizes (Desktop / Mobile) |
| --- | --- | --- |
| Body & headings | `Helvetica, Arial, sans-serif` (`--font-body--family`, `--rw-hf`) | Title `46px` / `24px`, Panel heading `18px` / `16px`, Product title `13px` / `12px`, Price `12px`, Option `11px`, Label `10px` / `9px` |
| Header navigation only | `Inter, Helvetica, Arial, sans-serif` (embedded `inter-600.woff2` base64 data URI) | `14px` desktop / `11px` mobile (`font-weight: 600`) |
| Numeric alignment | `font-variant-numeric: tabular-nums` | Tick labels, popup kicker, counts |

## Border Radius

| Context | Token / Value |
| --- | --- |
| Primary buttons & thumbnails | `--rw-btn-radius: 0px`, `--rw-thumb-radius: 0px`, `--rw-radius: 0px` |
| Size option pills | `--rw-pill-radius: 30px` |
| Plus button hover/burst ring | `--rw-add-radius: 20px` |
| Mobile docked panel & sheet top corners | `--rw-bar-r: 20px` (`20px 20px 0 0`) |
| Circular controls & pins | `50%` (`.rw__pin-dot`, `.rw__num`, `.rw__lb-close`, `.rw__cursor-in`) / `999px` (pin tooltip) |

## Layout Patterns

- **Header (`.site-header.shopify-section-group-header-group`)**: `88px` desktop (`0 40px` padding) / `68px` mobile (`0 20px` padding), `border-bottom: 1px solid #e4e4e4`, `z-index: 50`.
- **Desktop (`>=1100px`)**: Split grid `minmax(0, 1fr) 380px` filling `max(380px, innerHeight - 88px)` (`--rw-frame-h`). Left column houses `.rw__head`, 3D Ring `.rw__stage`, `.rw__controls` (`Prev`, 01–06 `.rw__ticks`, `Autoplay`, `Next`), and `.rw__lb` lightbox. Right column `.rw__panel.has-rule` has `1px solid #c8c8c8` left border, scrollable `.rw__items`, and sticky `.rw__bundle` footer.
- **Tablet (`750px–1099px`)**: Stacked `.rw__head` (`36px 32px 0`), tighter `.rw__controls` (`6px 22px 26px`), active tick width `130px`.
- **Mobile (`<=749px`)**: `109vh` frame height, classic diagonal model queue, bottom `.rw__walk-line` progress bar, docked `.rw__panel` overlapping stage by `-20px` with `20px` top radius, horizontal scroll-snap `.rw__items`, `Add full look — $492.30` CTA, and `body`-portaled `.rw-sheet-host` bottom-sheet size picker.
- **Async Loading & Dialogs**: While `POST /api/bag/items` is in flight, `.rw__item.is-loading` plays thumbnail shimmer + spinner and `.rw__cta.is-loading` swaps arrow for spinner. Centered `<dialog id="bag-dialog">` (`min(560px, 100vw - 32px)`, `#0005` blurred backdrop) and `#bag-status` toast reflect server-persisted bag state.

## Icons

Inline SVGs (`stroke="currentColor"`, `fill="none"` except solid play/pause icons):
- Brand logo: external `nike-logo.svg` (`68x24` desktop, `48x17` mobile).
- Header bag: `22x24` (`viewBox="0 0 24 26"`, `stroke-width="1.3"`).
- Prev / Next / CTA arrows: `26x14` / `22x12` (`stroke-width="1.3"` / `"1.4"`).
- Autoplay play/pause: `14x14` (`viewBox="0 0 24 24"`, `fill="currentColor"`).
- Add button states: `20x20` plus (`stroke-width="1.3"`), `20x20` check (`stroke-width="1.5"`), `18x18` / `16x16` spinner.
- Lightbox close: `16x16` cross (`stroke-width="1.5"`).
