# UI_SPEC.md — Astro Chat

**Source file:** `kundali_astro_chat` (FigCraft document id `6`, page `Page 1`)
**Screens:** 6 mobile screens + 5 shared components
**Artboard size:** 375 × 812 px (iPhone X/11 Pro/12 mini logical viewport)
**Extraction date:** 2026-11-15 — every value below was read programmatically from the Figma layer tree (fills, strokes, layout, sizing, typography, variables, text styles). Nothing is eyeballed.
**Conventions:** `hug` = `fit-content`, `fill` = `100%` / stretch, `fixed` = exact px. Values marked `[INFERRED]` are not present in the Figma file and were derived by the rules stated with them.

---

## 1. Design Tokens (Exact Values Only)

### 1.1 Color Palette

#### 1.1.1 Tokenised colours (FigCraft collection `Tokens`, mode `Light`)

These 15 colours + 3 radii are the only bound variables in the file. Everything else in §1.1.2 is a hard-coded layer colour.

| Figma variable | Hex | Semantic role (CSS custom property) | Used by |
|---|---|---|---|
| `color/primary` | `#6B4FA0` | `--color-primary` / `--bg-brand` / `--accent-strong` | Primary buttons, progress fill, send button, astrologer photo ring |
| `color/on-primary` | `#FFFFFF` | `--color-on-primary` | Button labels, send icon, bot avatar fill |
| `color/text/primary` | `#1E1B2E` | `--text-primary` | All headings, body copy on light surfaces, status bar glyphs |
| `color/text/secondary` | `#3A3550` | `--text-secondary` | Screen subtitles, privacy notice copy |
| `color/text/muted` | `#4A4560` | `--text-muted` | Input labels, card descriptions, date pill, astrologer specialities |
| `color/surface/input` | `#FDFBFF` | `--surface-input` | Text field fill |
| `color/surface/card` | `#FFFFFF` | `--surface-card` | Service cards, astrologer card, composer input fill |
| `color/surface/chip` | `#F1ECF6` | `--surface-chip` | Suggestion chip fill |
| `color/bubble/bot` | `#EEE8F2` | `--surface-bubble-bot` | Bot message bubble fill |
| `color/bubble/user` | `#DCCFF3` | `--surface-bubble-user` | User message bubble fill |
| `color/border/input` | `#CFC4EA` | `--border-input` | Text field stroke, progress track |
| `color/border/card` | `#E6DEEF` | `--border-card` | Service card stroke, astrologer card stroke |
| `color/border/chip` | `#D8CFE6` | `--border-chip` | Chip stroke, composer input stroke |
| `color/accent/gold` | `#F2B84B` | `--accent-gold` | Decorative 5-point stars (splash logo, creating-chart star) |
| `color/status/online` | `#2FB24C` | `--status-online` | Online status dot + "Online" label |
| `radius/button` | `28` (px) | `--radius-button` | Primary button |
| `radius/card` | `16` (px) | `--radius-card` | Service card, astrologer card, booking panel |
| `radius/input` | `10` (px) | `--radius-input` | Text field (also used by chips) |

#### 1.1.2 Hard-coded layer colours (not tokenised — treat as local values)

| Hex | Role | Used by |
|---|---|---|
| `#FCF8F3` | `--surface-gradient-top` | Gradient stop 0 on 01, 02, 05, 06 |
| `#F3ECFA` | `--surface-gradient-bottom` | Gradient stop 1 on 01, 02, 05, 06; also the top stop of the hills fade overlay |
| `#FBF6F2` | `--surface-gradient-top-alt` | Gradient stop 0 on 03_CreatingChart |
| `#E6DAF6` | `--surface-gradient-bottom-alt` | Gradient stop 1 on 03_CreatingChart |
| `#F6F1F8` | `--surface-chat` | 04_Chat screen background (flat, no gradient) |
| `#EFE9F7` | `--surface-notice` | Privacy notice panel (02), booking panel (06) |
| `#ECE6F2` | `--surface-date-pill` | "Today" date pill |
| `#E6DCF6` | `--surface-icon-soft` | Attach button (04), service-card icon wrap for 💬 Counseling and 📊 Detailed Reports |
| `#E2DAEA` | `--border-header` | 04_Chat header bottom border (1px, bottom side only) |
| `#5B3FA0` | `--color-icon` | Input leading-icon circle stroke (2px), privacy lock icon stroke (2px), composer "＋" glyph, notch ring |
| `#5B50D0` | `--color-glyph` | Zodiac glyph text (12 glyphs, 20px) |
| `#FEFAF0` | `--surface-wheel` | Zodiac wheel circle fill + 12 glyph patch masks |
| `#FBEFC9` | `--surface-icon-leaf` | Service-card icon wrap for 🌿 Remedies |
| `#D9F0DC` | `--surface-icon-mint` | Service-card icon wrap for 🧑 Chat with a Live Astrologer |
| `#C9A98A` | `--surface-photo-fallback` | Astrologer photo fallback fill (image paints on top) |
| `#6A6580` | `--text-placeholder` | Composer placeholder text |
| `#3A2F6B` | `--text-link` | "View Other Astrologers" link |
| `#D9CCF0` | `--surface-hill-03` | 03_CreatingChart background hill ellipse |
| `#EAE0F7` | `--surface-hill-05` | 05_Services background hill ellipse |
| `#3B3050` | `--device-chrome` | **Device mockup only** — 5px artboard border (not app UI) |
| `#000000` | `--emoji-fill` | Service-card emoji glyph fill (renders as native colour emoji) |

#### 1.1.3 Gradients

| Name | Definition | Applied to |
|---|---|---|
| `--gradient-screen-warm` | `linear-gradient(180deg, #FCF8F3 0%, #F3ECFA 100%)` | 01_Splash, 02_BirthDetails, 05_Services, 06_LiveAstrologer (screen backgrounds) |
| `--gradient-screen-lilac` | `linear-gradient(180deg, #FBF6F2 0%, #E6DAF6 100%)` | 03_CreatingChart (screen background) |
| `--gradient-hills-fade` | `linear-gradient(180deg, #F3ECFA 0%, #F3ECFA00 100%)` | 06_LiveAstrologer "HillsFade" overlay, 375×70 at y=562 |

Gradient geometry in Figma is `kind: linear, from: [0.5, 0], to: [0.5, 1]` → CSS `to bottom`.

#### 1.1.4 Colour usage rules

- On `--surface-card` (`#FFFFFF`) use `--text-primary` for headings, `--text-muted` for descriptions, `--text-secondary` for subtitles.
- On `--color-primary` (`#6B4FA0`) use `--color-on-primary` (`#FFFFFF`) only — minimum contrast ratio 6.4:1.
- `--status-online` (`#2FB24C`) on white = 2.8:1 — **fails WCAG AA for 15px text**. Keep the dot as the primary signal and pair the label with `--text-primary` if AA compliance is required. `[INFERRED — design file ships as-is]`

### 1.2 Typography

**Font family:** `Inter` (single family, used for every text layer including emoji and zodiac glyphs).
**Root font size:** `16px` (`html { font-size: 16px }`) so `rem` values below are exact.
**Letter spacing:** `0%` on **every** text layer in the file — i.e. `letter-spacing: 0`.
**Line height:** every text layer uses `lineHeight: Auto` → CSS `line-height: normal`. Inter's metrics give a normal line box of **1.21 × font-size** (ascender 0.969 + descender 0.241, line-gap 0). The px values in the tables are the resolved Figma box heights at that ratio.

#### 1.2.1 Named text styles (the 8 Figma text styles)

| Figma style | CSS class | px | rem | Weight | Line-height | Letter-spacing | Colour |
|---|---|---|---|---|---|---|---|
| `Display/AppTitle` | `.t-display` | 58 | 3.625 | 700 | `normal` → 70px | 0 | `--text-primary` |
| `Heading/ScreenTitle` | `.t-h1` | 28 | 1.75 | 700 | `normal` → 34px | 0 | `--text-primary` |
| `Heading/Section` | `.t-h2` | 26 | 1.625 | 700 | `normal` → 31px | 0 | `--text-primary` |
| `Heading/CardTitle` | `.t-h3` | 18 | 1.125 | 700 | `normal` → 22px | 0 | `--text-primary` |
| `Body/Large` | `.t-lg` | 17 | 1.0625 | 400 | `normal` → 21px | 0 | `--text-primary` / `--text-secondary` |
| `Body/Regular` | `.t-md` | 16 | 1 | 400 | `normal` → 19px | 0 | `--text-primary` / `--text-secondary` |
| `Caption/Small` | `.t-sm` | 12 | 0.75 | 400 | `normal` → 15px | 0 | `--text-muted` |
| `Button/Label` | `.t-btn` | 19 | 1.1875 | 700 | `normal` → 23px | 0 | `--color-on-primary` |

#### 1.2.2 Ad-hoc text styles (set directly on layers, not named styles)

| Where | px | rem | Weight | Line-height | Colour | Align |
|---|---|---|---|---|---|---|
| 02/05/06 back arrow `←` | 26 | 1.625 | 400 | `normal` → 31px | `--text-primary` | left |
| 04 header title "Astro Chat" | 24 | 1.5 | 700 | `normal` → 29px | `--text-primary` | centre |
| 04 header menu `☰` | 24 | 1.5 | 400 | `normal` → 29px | `--text-primary` | left |
| 04 composer attach `＋` | 24 | 1.5 | 400 | `normal` → 29px | `#5B3FA0` | centre |
| Service card emoji icon | 28 | 1.75 | 400 | `normal` → 34px | `#000000` | centre |
| Service card chevron `›` | 30 | 1.875 | 400 | `normal` → 36px | `--text-primary` | left |
| 06 nav title | 19 | 1.1875 | 700 | `normal` → 23px | `--text-primary` | left |
| Astrologer name | 17 | 1.0625 | 700 | `normal` → 21px | `--text-primary` | left |
| Input value | 17 | 1.0625 | 400 | `normal` → 21px | `--text-primary` | left |
| 03 checklist steps | 16 | 1 | 400 | `normal` → 19px | `--text-primary` | left |
| 06 booking price line | 16 | 1 | 400 | `normal` → 19px | `--text-primary` | left |
| "View Other Astrologers" link | 16 | 1 | 400 | `normal` → 19px | `#3A2F6B` | centre, **underline** |
| Card title override ("Chat with a Live Astrologer") | 16 | 1 | 700 | `normal` → 19px | `--text-primary` | left |
| Composer placeholder | 16 | 1 | 400 | `normal` → 19px | `#6A6580` | left |
| Chip label | 15 | 0.9375 | 400 | `normal` → 18px | `--text-primary` | centre |
| User bubble text | 15 | 0.9375 | 400 | `normal` → 18px | `--text-primary` | left |
| "Online" status label | 15 | 0.9375 | 400 | `normal` → 18px | `--status-online` | left |
| Status bar clock "9:41" | 15 | 0.9375 | 700 | `normal` → 18px | `--text-primary` | left |
| Privacy notice copy | 14 | 0.875 | 400 | `normal` → 17px | `--text-secondary` | left |
| "Today" date pill | 14 | 0.875 | 400 | `normal` → 17px | `--text-muted` | centre |
| Input label | 13 | 0.8125 | 400 | `normal` → 16px | `--text-muted` | left |
| Card description | 12 | 0.75 | 400 | `normal` → 15px | `--text-muted` | left |
| Astrologer specialities | 11.5 | 0.71875 | 400 | `normal` → 14px | `--text-muted` | left |
| Zodiac glyph | 20 | 1.25 | 400 | `normal` → 24px | `#5B50D0` | centre |
| Composer send `➤` | 18 | 1.125 | 400 | `normal` → 22px | `--color-on-primary` | centre |

#### 1.2.3 Line-height derivation (for pixel fidelity)

The `px` line-heights above are **derived**: `round(font-size × 1.21)`. Verified against every measured Figma text box height in the file, e.g. 58→70, 28→34, 26→31, 19→23, 18→22, 17→21, 16→19, 15→18, 14→17, 13→16, 12→15, 11.5→14, 24→29, 20→24, 18→22, 30→36. Use `line-height: normal` in CSS with the Inter webfont (it reproduces these boxes exactly); if you need a fixed value, use the px column. `[INFERRED — rule derived from measured boxes; Figma stores "Auto"]`

### 1.3 Spacing Scale

Base unit **4px**. Every gap/padding in the file is a multiple of 2; the values actually used are listed below with the tokens to create.

| Token | px | rem | Where used |
|---|---|---|---|
| `--space-0` | 0 | 0 | screen frame padding, chip container vertical padding |
| `--space-0-5` | 2 | 0.125 | Input `TextCol` gap (label→value) |
| `--space-1` | 4 | 0.25 | Service-card `TextCol` gap; composer input vertical padding; chip container horizontal padding |
| `--space-1-5` | 6 | 0.375 | Chip inner gap; status-bar cluster gap; astrologer `Info` gap; chips row-gap |
| `--space-2` | 8 | 0.5 | Button inner gap; composer gap; chips column-gap; screen-title block gap |
| `--space-2-5` | 10 | 0.625 | Button vertical padding; chip vertical padding; TitleBlock gap (splash) |
| `--space-3` | 12 | 0.75 | Bubble vertical padding; service card padding; card gap; input horizontal gap |
| `--space-3-5` | 14 | 0.875 | Chip horizontal padding; header vertical padding; chips container horizontal padding; TitleBlock gap (02/05/06) |
| `--space-4` | 16 | 1 | Bubble horizontal padding; input horizontal padding; card padding; notice horizontal padding; composer input left padding; composer input right padding |
| `--space-4-5` | 18 | 1.125 | Astrologer card vertical padding; notice vertical padding |
| `--space-5` | 20 | 1.25 | Status bar row top padding |
| `--space-5-5` | 22 | 1.375 | Chat `Bottom` bottom padding |
| `--space-6` | 24 | 1.5 | Screen content padding (all screens), button horizontal padding, header horizontal padding, splash content padding, 03 content top padding |
| `--space-7` | 28 | 1.75 | Splash / birth-details content horizontal padding |
| `--space-8` | 32 | 2 | Status bar row horizontal padding; services + live-astrologer content horizontal padding |
| `--space-12` | 48 | 3 | 03_CreatingChart content top padding |

> **Grid-compliance note.** The values 2, 6, 10, 14, 18, 22 and 7 are 4px-grid half-steps present in the source file; 11.5 (astrologer specialities) and 13 (input label) are the only **off-grid** values and are kept verbatim for pixel fidelity. If your team's rule is strictly 4/8, promote 11.5→12 and 13→12 and accept a ±1.5px difference — this is the only sanctioned deviation. `[INFERRED — deviation guidance]`

### 1.4 Border Radius

| Token | px | Applied to |
|---|---|---|
| `--radius-input` | 10 | Text field, suggestion chip |
| `--radius-notice` | 12 | Privacy notice panel (02) |
| `--radius-icon-wrap` | 14 | Service-card icon wrap; "Today" date pill |
| `--radius-card` | 16 | Service card, astrologer card, booking panel |
| `--radius-bubble` | 18 | Bot & user message bubbles |
| `--radius-button` | 28 | Primary button (pill) |
| `--radius-circle` | 50% | Send button (38px), attach button (34px), avatars (34px), photo (90px), profile icon (26px), input icon (24px) |
| `--radius-pill` | 23 | Composer input (48px tall, fully rounded) |
| `--radius-device` | 44 | **Device mockup only** — artboard corner radius, not app UI |

### 1.5 Shadows / Elevation

**There are none.** Every node in the file has an empty `effects` array — verified by traversing the whole document (all 6 screens, all 5 components, 260+ layers). No layer uses a drop shadow, inner shadow, or blur.

Therefore:

```css
/* Elevation is expressed with borders only. */
--shadow-none: none;
```

**Border-based elevation hierarchy** (use exactly these):

| Element | Border |
|---|---|
| Service card, astrologer card | `1px solid #E6DEEF`, radius 16 |
| Composer input | `1px solid #D8CFE6`, radius 23 |
| Suggestion chip | `1px solid #D8CFE6`, radius 10 |
| Text field | `1.5px solid #CFC4EA`, radius 10 |
| Chat header | `1px solid #E2DAEA`, **bottom side only** |
| Progress track / fill | none (radius 4 on the fills) |

### 1.6 Copy-ready token block

```css
:root {
  /* ---- colour ---- */
  --color-primary: #6B4FA0;
  --color-on-primary: #FFFFFF;
  --color-text-primary: #1E1B2E;
  --color-text-secondary: #3A3550;
  --color-text-muted: #4A4560;
  --color-text-placeholder: #6A6580;
  --color-text-link: #3A2F6B;
  --color-icon: #5B3FA0;
  --color-glyph: #5B50D0;
  --color-accent-gold: #F2B84B;
  --color-status-online: #2FB24C;

  --surface-input: #FDFBFF;
  --surface-card: #FFFFFF;
  --surface-chip: #F1ECF6;
  --surface-bubble-bot: #EEE8F2;
  --surface-bubble-user: #DCCFF3;
  --surface-chat: #F6F1F8;
  --surface-notice: #EFE9F7;
  --surface-date-pill: #ECE6F2;
  --surface-icon-soft: #E6DCF6;
  --surface-icon-leaf: #FBEFC9;
  --surface-icon-mint: #D9F0DC;
  --surface-wheel: #FEFAF0;
  --surface-hill-03: #D9CCF0;
  --surface-hill-05: #EAE0F7;
  --surface-photo-fallback: #C9A98A;

  --border-input: #CFC4EA;
  --border-card: #E6DEEF;
  --border-chip: #D8CFE6;
  --border-header: #E2DAEA;

  --gradient-screen-warm: linear-gradient(180deg, #FCF8F3 0%, #F3ECFA 100%);
  --gradient-screen-lilac: linear-gradient(180deg, #FBF6F2 0%, #E6DAF6 100%);
  --gradient-hills-fade: linear-gradient(180deg, #F3ECFA 0%, #F3ECFA00 100%);

  /* ---- type ---- */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --text-display: 58px;   /* 3.625rem, w700 */
  --text-h1: 28px;        /* 1.75rem,  w700 */
  --text-h2: 26px;        /* 1.625rem, w700 */
  --text-h3: 18px;        /* 1.125rem, w700 */
  --text-lg: 17px;        /* 1.0625rem, w400 */
  --text-md: 16px;        /* 1rem,     w400 */
  --text-sm: 12px;        /* 0.75rem,  w400 */
  --text-button: 19px;    /* 1.1875rem, w700 */

  /* ---- space ---- */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 28px; --space-8: 32px;

  /* ---- radius ---- */
  --radius-input: 10px; --radius-notice: 12px; --radius-pill: 14px;
  --radius-card: 16px;  --radius-bubble: 18px; --radius-button: 28px;

  /* ---- elevation ---- */
  --shadow-none: none;
}
```

---

## 2. Component Hierarchy & Layout Tree

### 2.0 Reading the notation

Each node lists: `display · direction · justify-content · align-items · gap · padding · size`.
`hug` = `fit-content`, `fill` = `100%` (stretch in the parent's cross axis).

**Global shell (all 6 screens)**

```
Screen (375 × 812, fixed)
├─ device chrome: border 5px solid #3B3050 (inside), border-radius 44px  ← mockup only, omit in app
├─ background: gradient or flat colour (§1.1.3)
└─ content column (365 × 802)  ← the 5px inner border reduces the content box to 365 × 802
   ├─ StatusBarRow   (365 × 38)
   └─ ScreenContent  (365 × 764)
```

Every screen's content column starts at **y = 43** (5px chrome + 38px status bar row).

**StatusBarRow** — `flex · row · flex-start · flex-start · gap 0 · padding 20px 32px 0 32px · width fill, height hug`
└─ **StatusBar** (component instance) — `flex · row · space-between · center · gap 0 · padding 0 · width fill, height hug`
&nbsp;&nbsp;&nbsp;├─ `StatusBar/Time` — text "9:41", 15px/700, `--text-primary`, left. Box 31×18.
&nbsp;&nbsp;&nbsp;└─ **Cluster** — `flex · row · flex-start · center · gap 6px · padding 0 · hug × 11`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ `Signal` — rect 18×11, fill `#1E1B2E`, radius 2
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ `Wifi` — rect 16×8, fill `#1E1B2E`, radius 4
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ `Battery` — rect 22×11, fill `#1E1B2E`, radius 3

---

### 2.1 `01_Splash` (375 × 812)

Background: `--gradient-screen-warm`.

```
Content                       flex · column · space-between · center · gap 16px · padding 24px 28px 28px 28px · 365 × 764 (fill × fill)
├─ Logo                       no auto-layout (free positioning) · width fill (309) · height fixed 130
│  ├─ Illustration/PlanetLogo (group, abs 112.5,77 · 164.9 × 90)
│  │  ├─ Planet/Body   ellipse 90×90  · fill #FFFFFF · stroke #1E1B2E 3px (inside)
│  │  └─ Planet/Ring   ellipse 164.9 × 80.05 · stroke #1E1B2E 3px (inside) · rotate −15°
│  ├─ Deco/Star1  22×22 · fill #F2B84B · 5-point star, inner radius 0.38 · abs (63, 107)
│  ├─ Deco/Star2  34×34 · fill #F2B84B · 5-point star, inner radius 0.38 · abs (238, 67)
│  └─ Deco/Star3  14×14 · fill #F2B84B · 5-point star, inner radius 0.38 · abs (275, 112)
├─ TitleBlock                 flex · column · flex-start · center · gap 14px · padding 0 · 309 × 105 (fill × hug)
│  ├─ Text/AppTitle   "Astro Chat" · .t-display · text-align center · width fill · height hug
│  └─ Text/Tagline    "Chat  •  Understand  •  Get Guidance" · .t-lg · center · width fill · height hug
├─ Illustration/Telescope     image 290×290 (fixed × fixed) · border-radius 145px · abs (42.5, 390)
└─ Button/GetStarted          (Button/Primary instance) · 309 × 55 · fill × hug
```

`space-between` resolves to **44px** between the four children (content height 712 − children 580 = 132 free ÷ 3 gaps).
Resolved Y positions (screen coords): Logo 67, TitleBlock 241, Telescope 390, Button 724.

---

### 2.2 `02_BirthDetails` (375 × 812)

Background: `--gradient-screen-warm`.

```
Content                       flex · column · space-between · flex-start · gap 24px · padding 16px 28px 28px 28px · 365 × 764 (fill × fill)
├─ Top                        flex · column · flex-start · flex-start · gap 24px · padding 0 · 309 × 397 (fill × hug)
│  ├─ Nav/BackIcon            text "←" 26px/400 · 25×31 (hug)
│  ├─ TitleBlock              flex · column · flex-start · center · gap 12px · padding 0 · 309 × 88 (fill × hug)
│  │  ├─ Text/ScreenTitle     "Your Birth Details" · .t-h1 · center · 309 × 34 (fill × hug)
│  │  └─ Text/ScreenSubtitle  "Help us create your personal\nastrology chart." · .t-lg · #3A3550 · center · 309 × 42 (fill × hug)
│  └─ Fields                  flex · column · flex-start · flex-start · gap 16px · padding 0 · 309 × 230 (fill × hug)
│     ├─ Input/DateOfBirth    (Input/TextField instance) · 309 × 66 (fill × hug)
│     ├─ Input/TimeOfBirth    (Input/TextField instance) · 309 × 66 (fill × hug)
│     └─ Input/PlaceOfBirth   (Input/TextField instance) · 309 × 66 (fill × hug)
└─ Bottom                     flex · column · flex-start · flex-start · gap 24px · padding 0 · 309 × 145 (fill × hug)
   ├─ Notice/Privacy           flex · row · flex-start · center · gap 14px · padding 16px 18px · fill #EFE9F7 · radius 12px · 309 × 66 (fill × hug)
   │  ├─ Notice/IconLock       rect 18×16 · stroke #5B3FA0 2px (inside) · radius 3px
   │  └─ Notice/Text           "Your details are private and used only to create and save your chart." · 14px/400 · #3A3550 · left · 241 × 34 (fill × hug)
   └─ Button/CreateMyChart     (Button/Primary instance) · 309 × 55 (fill × hug)
```

`space-between` resolves to **178px** between `Top` and `Bottom` (720 available − 542 children).
Resolved screen Y: `Top` = 59, `Bottom` = 634 (i.e. 591 relative to the Content box, which itself starts at y = 43).

---

### 2.3 `03_CreatingChart` (375 × 812)

Background: `--gradient-screen-lilac`.

```
Content                       flex · column · flex-start · center · gap 32px · padding 48px 28px 28px 28px · 365 × 764 (fill × fill)
├─ Illustration/ZodiacWheel   no auto-layout (free positioning) · 300 × 300 fixed · fill #FEFAF0 · radius 150px · abs (907.5−870, 91−0) = screen (37.5, 91)
│  ├─ Wheel/Image             image 300×300 (fixed) · abs offset 0,0 inside the wheel
│  └─ 12 × (Glyph/PatchNN ellipse 30×30 · fill #FEFAF0)  +  12 × (Glyph/<Sign> text 20px · #5B50D0 · 30×24)
├─ Text/ScreenTitle           "Creating Your\nAstrology Chart..." · .t-h1 · center · 309 × 68 (fill × hug)
├─ Progress                   no auto-layout (free positioning) · 309 × 8 (fill × fixed)
│  ├─ Progress/Track          rect 319 × 8 · fill #CFC4EA · radius 4px
│  └─ Progress/Fill           rect 160 × 8 · fill #6B4FA0 · radius 4px
└─ Checklist/Steps            "✓  Calculating planetary positions\n\n✓  Generating birth chart (Kundli)\n\n✓  Saving your profile" · 16px/400 · left · 309 × 95 (fill × hug)
Deco/Star3  (absolute, outside Content) 22×22 · #F2B84B · 5-point star · abs (920, 345) → screen (50, 345)
BG/Hill     (absolute, outside Content) ellipse 360×200 · #D9CCF0 · abs (990, 640) → screen (120, 640), overflows the right edge by 105px
```

**Zodiac glyph positions** (relative to the 300×300 wheel; each patch is a 30×30 mask with the glyph text box 30×24 at patch-y + 4):

| Sign | Glyph | Patch x | Patch y | Text x | Text y |
|---|---|---|---|---|---|
| Aries | `♈︎` | 135.0 | 49.8 | 135.0 | 53.8 |
| Taurus | `♉︎` | 177.6 | 61.2 | 177.6 | 65.2 |
| Gemini | `♊︎` | 208.8 | 92.4 | 208.8 | 96.4 |
| Cancer | `♋︎` | 220.2 | 135.0 | 220.2 | 139.0 |
| Leo | `♌︎` | 208.8 | 177.6 | 208.8 | 181.6 |
| Virgo | `♍︎` | 177.6 | 208.8 | 177.6 | 212.8 |
| Libra | `♎︎` | 135.0 | 220.2 | 135.0 | 224.2 |
| Scorpio | `♏︎` | 92.4 | 208.8 | 92.4 | 212.8 |
| Sagittarius | `♐︎` | 61.2 | 177.6 | 61.2 | 181.6 |
| Capricorn | `♑︎` | 49.8 | 135.0 | 49.8 | 139.0 |
| Aquarius | `♒︎` | 61.2 | 92.4 | 61.2 | 96.4 |
| Pisces | `♓︎` | 92.4 | 61.2 | 92.4 | 65.2 |

Ring radius from wheel centre (150,150) = 85.2px. Glyphs are evenly spaced at 30° intervals.

---

### 2.4 `04_Chat` (375 × 812)

Background: flat `#F6F1F8`. The screen frame itself is a **vertical flex column, gap 0, padding 0** (unlike the other screens, the header/messages/bottom are direct children of the frame).

```
Screen                        flex · column · flex-start · flex-start · gap 0 · padding 0 · 375 × 812 fixed
├─ StatusBarRow               (see §2.0) · 365 × 38
├─ Header                     flex · row · space-between · center · gap 0 · padding 14px 28px · 365 × 58 (fill × hug)
│  ├─ Header/MenuIcon         text "☰" 24px/400 · #1E1B2E · 22×29 (hug)
│  ├─ Header/Title            text "Astro Chat" 24px/700 · #1E1B2E · center · 125×29 (hug)
│  └─ Header/ProfileIcon      ellipse 26×26 · stroke #1E1B2E 2px (inside) · no fill
│  └─ border-bottom: 1px solid #E2DAEA (bottom side only)
├─ Messages                   flex · column · flex-start · flex-start · gap 16px · padding 16px 16px 8px 16px · 365 × 478 (fill × fill)
│  ├─ DateRow                 flex · row · center · flex-start · gap 0 · padding 0 · 333 × 27 (fill × hug)
│  │  └─ DatePill             flex · row · center · center · gap 0 · padding 5px 16px · fill #ECE6F2 · radius 14px · 73 × 27 (hug)
│  │     └─ DatePill/Label    "Today" 14px/400 · #4A4560 · center · 41 × 17 (hug)
│  ├─ Message/Bot1            flex · row · flex-start · flex-start · gap 10px · padding 0 · 333 × 81 (fill × hug)
│  │  ├─ Avatar/Bot1          ellipse 34×34 · fill #FFFFFF · stroke #1E1B2E 2px (inside)
│  │  └─ Bubble               flex · column · flex-start · flex-start · gap 0 · padding 12px 16px · fill #EEE8F2 · radius 18px · max-width 270px · 254 × 81 (hug × hug)
│  │     └─ Bubble/Bot1/Text  16px/400 · #1E1B2E · max-width 238px · 222 × 57 (hug)
│  ├─ Message/User1           flex · row · flex-end · flex-start · gap 0 · padding 0 · 333 × 60 (fill × hug)
│  │  └─ Bubble               flex · column · flex-start · flex-start · gap 0 · padding 12px 16px · fill #DCCFF3 · radius 18px · max-width 280px · 273 × 60 (hug × hug)
│  │     └─ Bubble/User1/Text 15px/400 · #1E1B2E · max-width 248px · 241 × 36 (hug)
│  └─ Message/Bot2            flex · row · flex-start · flex-start · gap 10px · padding 0 · 333 × 138 (fill × hug)
│     ├─ Avatar/Bot2           ellipse 34×34 · fill #FFFFFF · stroke #1E1B2E 2px (inside)
│     └─ Bubble                flex · column · flex-start · flex-start · gap 0 · padding 12px 16px · fill #EEE8F2 · radius 18px · max-width 270px · 270 × 138 (hug × hug)
│        └─ Bubble/Bot2/Text  16px/400 · #1E1B2E · max-width 238px · width fixed 238 · 238 × 114 (fixed × hug)
└─ Bottom                     flex · column · flex-start · flex-start · gap 14px · padding 0 16px 22px 16px · 365 × 228 (fill × hug)
   ├─ Chips                   flex · row · flex-start · flex-start · gap 12px (column-gap) · row-gap 12px · wrap true · padding 0 6px · 333 × 144 (fill × hug)
   │  ├─ Chip/Career           (Chip/Suggestion) · 101 × 40 · screen (27, 579)
   │  ├─ Chip/Relationships    (Chip/Suggestion) · 144 × 40 · screen (140, 579)
   │  ├─ Chip/Health           (Chip/Suggestion) · 99 × 40 · screen (27, 631)
   │  ├─ Chip/Remedies         (Chip/Suggestion) · 123 × 40 · screen (138, 631)
   │  └─ Chip/GeneralGuidance  (Chip/Suggestion) · 172 × 40 · screen (27, 683)
   └─ Composer                flex · row · flex-start · center · gap 8px · padding 0 · 333 × 48 (fill × hug)
      ├─ AttachButton         flex · row · center · center · gap 0 · padding 0 · 34 × 34 fixed · fill #E6DCF6 · radius 17px
      │  └─ AttachIcon         text "＋" 24px/400 · #5B3FA0 · center · 16 × 29 (hug)
      └─ Composer/Input       flex · row · space-between · center · gap 0 · padding 4px 4px 4px 16px · fill #FFFFFF · stroke #D8CFE6 1px (inside) · radius 23px · 291 × 48 (fill × hug)
         ├─ Composer/Placeholder  "Ask your question..." 16px/400 · #6A6580 · left · 151 × 19 (hug)
         └─ SendButton        flex · row · center · center · gap 0 · padding 0 · 38 × 38 fixed · fill #6B4FA0 · radius 19px
            └─ SendIcon      text "➤" 18px/400 · #FFFFFF · center · 16 × 22 (hug)
```

**Message alignment:** bot messages = avatar on the left, bubble after a 10px gap. User message = bubble pushed to the right (`justify-content: flex-end`), no avatar. Bubble max-widths differ (bot 270, user 280) — keep both.

**Chip flow** (333px container, 6px horizontal padding → 321px usable, 12px gaps):
- Row 1: Career (101) + gap 12 + Relationships (144) = 257 ≤ 321 → same row; Relationships ends at x = 6+101+12+144 = 263.
- Row 2: Health (99) + gap 12 + Remedies (123) = 234.
- Row 3: General Guidance (172).
Row Y offsets: 0, 52, 104 (40px chip + 12px row-gap).

---

### 2.5 `05_Services` (375 × 812)

Background: `--gradient-screen-warm`.

```
Content                       flex · column · flex-start · flex-start · gap 24px · padding 16px 24px 24px 24px · 365 × 764 (fill × fill)
├─ Nav/BackIcon               text "←" 26px/400 · 25 × 31 (hug)
├─ TitleBlock                 flex · column · flex-start · center · gap 12px · padding 0 · 317 × 81 (fill × hug)
│  ├─ Text/ScreenTitle        "Our Services" · .t-h2 (26/700) · center · 317 × 31 (fill × hug)
│  └─ Text/ScreenSubtitle     "Explore personalized support based\non your chart and questions." · 16px/400 · #3A3550 · center · 317 × 38 (fill × hug)
└─ Cards                      flex · column · flex-start · flex-start · gap 18px · padding 0 · 317 × 464 (fill × hug)
   ├─ Card/Service/Remedies          (Card/Service instance) · 317 × 105 (fill × hug)
   ├─ Card/Service/Counseling        (Card/Service instance) · 317 × 105
   ├─ Card/Service/LiveAstrologer    (Card/Service instance) · 317 × 106
   └─ Card/Service/DetailedReports   (Card/Service instance) · 317 × 94
BG/Hill (absolute, outside Content) ellipse 320×120 · #EAE0F7 · screen (60, 700)
```

Card Y offsets inside `Cards`: 0, 123, 246, 370.

---

### 2.6 `06_LiveAstrologer` (375 × 812)

Background: `--gradient-screen-warm`, with two absolutely-positioned illustration layers behind the content.

```
Illustration/TempleHills    image 375×250 fixed · absolute · bottom-aligned (y = 562) · screen (0, 562)
Illustration/HillsFade      375×70 fixed · absolute · y = 562 · fill = --gradient-hills-fade
StatusBarRow                (see §2.0) · 365 × 38
Content                     flex · column · flex-start · flex-start · gap 24px · padding 16px 24px 24px 24px · 365 × 764 (fill × fill)
├─ Nav                       flex · row · flex-start · center · gap 16px · padding 0 · 317 × 31 (fill × hug)
│  ├─ Nav/BackIcon           text "←" 26px/400 · 25 × 31 (hug)
│  └─ Nav/Title              "Chat with a Live Astrologer" 19px/700 · #1E1B2E · left · 276 × 23 (fill × hug)
├─ AstrologerCard            flex · row · flex-start · center · gap 16px · padding 18px 16px · fill #FFFFFF · stroke #E6DEEF 1px (inside) · radius 16px · 317 × 138 (fill × hug)
│  ├─ AstrologerCard/Photo   ellipse 90×90 fixed · fill #C9A98A + image · stroke #6B4FA0 3px (inside)
│  └─ Info                   flex · column · flex-start · flex-start · gap 6px · padding 0 · 177 × 100 (fill × hug)
│     ├─ Name                "Acharya Rajiv Sharma" 17px/700 · #1E1B2E · left · 177 × 42 (fill × hug)
│     ├─ Status              flex · row · flex-start · center · gap 7px · padding 0 · 64 × 18 (hug × hug)
│     │  ├─ StatusDot        ellipse 11×11 · fill #2FB24C
│     │  └─ StatusText       "Online" 15px/400 · #2FB24C · 46 × 18 (hug)
│     └─ Specialities        "Vedic Astrology • Career • Remedies" 11.5px/400 · #4A4560 · left · 177 × 28 (fill × hug)
├─ BookingPanel              flex · column · flex-start · flex-start · gap 14px · padding 16px · fill #EFE9F7 · radius 16px · 317 × 139 (fill × hug)
│  ├─ PriceText              "💬  Chat live for personalized guidance (₹499 / 30 min)" 16px/400 · #1E1B2E · left · 285 × 38 (fill × hug)
│  └─ Button/Primary         (Button/Primary instance) · 285 × 55 (fill × hug)
└─ Link/ViewOtherAstrologers "View Other Astrologers" 16px/400 · #3A2F6B · center · underline · 317 × 19 (fill × hug)
```

Content child Y offsets: Nav 16, AstrologerCard 71, BookingPanel 233, Link 396 (relative to Content, i.e. absolute 59 / 114 / 276 / 439).

---

### 2.7 Shared component library

| Component | Root layout | Size | Children |
|---|---|---|---|
| **Button/Primary** | `flex · row · center · center · gap 8px · padding 16px 24px` · fill `#6B4FA0` · radius 28px | 275 × 55 (fixed × hug) | `Label` — text, 19px/700, `#FFFFFF`, centre |
| **StatusBar** | `flex · row · space-between · center · gap 0 · padding 0` | 311 × 18 (fixed × hug) | `Time` text 31×18; `Cluster` 68×11 |
| **Chip/Suggestion** | `flex · row · center · center · gap 6px · padding 10px 14px` · fill `#F1ECF6` · stroke `#D8CFE6` 1px (inside) · radius 10px | 101 × 40 (hug × hug) | `Label` — text 15px/400, `#1E1B2E`, centre |
| **Card/Service** | `flex · row · flex-start · center · gap 16px · padding 16px` · fill `#FFFFFF` · stroke `#E6DEEF` 1px (inside) · radius 16px | 327 × 105 (fixed × hug) | `IconWrap` 60×60 (see below); `TextCol` (vertical, gap 4px) → `Title` 18px/700, `Description` 12px/400; `Chevron` text "›" 30px/400 |
| **Input/TextField** | `flex · row · flex-start · center · gap 12px · padding 12px 16px` · fill `#FDFBFF` · stroke `#CFC4EA` 1.5px (inside) · radius 10px | 319 × 66 (fixed × hug) | `Icon/Placeholder` ellipse 24×24 stroke `#5B3FA0` 2px; `TextCol` (vertical, gap 2px) → `Label` 13px/400 `#4A4560`, `Value` 17px/400 `#1E1B2E` |

**Card/Service internals** (relative to the card's 16px padding, 327px wide):
- `IconWrap`: 60×60 fixed, radius 14px, centred content, fill varies per instance.
- `TextCol`: starts at x = 93, width = 179 in the 317px instances (189 in the 327px component), vertical gap 4px.
- `Chevron`: text "›" 30px, starts at x = 288 in the 317px instances (298 in the component), 12px wide, 36px tall.

**Input/TextField internals**:
- `Icon/Placeholder` at x = 17.5, y = 21, 24×24.
- `TextCol` at x = 53.5, y = 13.5, width = fill (238 in the 309px instances, 248 in the 319px component), vertical gap 2px.

---

## 3. Element-by-Element Breakdown

> **Coordinate convention.** Every `at screen (x, y)` value is a position **relative to the top-left of the 375 × 812 screen artboard** (the screen's own 5px device border is included in the origin). The Figma file stores these as `absoluteBounds` on the page; the values below are the page values minus the screen origin.
>
> **Placeholder shapes.** Five layers in the file are deliberately empty vector placeholders, not real icons: `Icon/Placeholder` (input leading icon, 02), `Notice/IconLock` (02), `Header/ProfileIcon` (04), `Avatar/Bot1` / `Avatar/Bot2` (04). Each is specified below with its exact geometry. Replace them with real icons/photos at the same box size and colour; do not change the box.

### 3.1 `01_Splash`

| # | Element | Type | Exact spec |
|---|---|---|---|
| 1 | Status bar clock | text | `"9:41"` · 15px/700 · `#1E1B2E` · 31×18 at screen (37, 25) |
| 2 | Signal bars | rect | 18×11, radius 2, fill `#1E1B2E`, at screen (270, 28.5) |
| 3 | Wifi | rect | 16×8, radius 4, fill `#1E1B2E`, at screen (294, 30) |
| 4 | Battery | rect | 22×11, radius 3, fill `#1E1B2E`, at screen (316, 28.5) |
| 5 | Planet body | ellipse | 90×90, fill `#FFFFFF`, stroke `#1E1B2E` 3px inside, at screen (149.95, 77) |
| 6 | Planet ring | ellipse | 164.9 × 80.05, **no fill**, stroke `#1E1B2E` 3px inside, `rotate: -15deg`, at screen (112.5, 83.98) |
| 7 | Star 1 | star | 22×22, fill `#F2B84B`, 5 points, inner radius 0.38, at screen (63, 107) |
| 8 | Star 2 | star | 34×34, fill `#F2B84B`, 5 points, inner radius 0.38, at screen (238, 67) |
| 9 | Star 3 | star | 14×14, fill `#F2B84B`, 5 points, inner radius 0.38, at screen (275, 112) |
| 10 | App title | text | `"Astro Chat"` · 58px/700 · `#1E1B2E` · centre · 309×70 at (33, 241) |
| 11 | Tagline | text | `"Chat  •  Understand  •  Get Guidance"` (two spaces before and after each `•`) · 17px/400 · `#1E1B2E` · centre · 309×21 at (33, 325) |
| 12 | Telescope illustration | image | 290×290, `border-radius: 50%`, at (42.5, 390) — `assets/astro-chat/splash-telescope.png` (580×580 @2x) |
| 13 | Primary button | component | fill `#6B4FA0`, radius 28px, 309×55 at (33, 724) |
| 14 | Button label | text | `"Get Started  →"` (two spaces before `→`) · 19px/700 · `#FFFFFF` · centre · 133×23 at (121, 740) |

### 3.2 `02_BirthDetails`

| # | Element | Type | Exact spec |
|---|---|---|---|
| 1 | Status bar | component | identical to §3.1 rows 1–4 |
| 2 | Back arrow | text | `"←"` · 26px/400 · `#1E1B2E` · 25×31 at (33, 59) |
| 3 | Screen title | text | `"Your Birth Details"` · 28px/700 · `#1E1B2E` · centre · 309×34 at (33, 114) |
| 4 | Screen subtitle | text | `"Help us create your personal\nastrology chart."` (explicit `\n`) · 17px/400 · `#3A3550` · centre · 309×42 at (33, 160) |
| 5 | Input #1 | component | `Input/TextField`, 309×66 at screen (33, 226) — fill `#FDFBFF`, stroke `#CFC4EA` 1.5px, radius 10px |
| 5a | Icon | ellipse | 24×24, no fill, stroke `#5B3FA0` 2px inside, at screen (50.5, 247) |
| 5b | Label | text | `"Date of Birth"` · 13px/400 · `#4A4560` · 78×16 at screen (86.5, 239.5) |
| 5c | Value | text | `"15 Nov 1985"` · 17px/400 · `#1E1B2E` · 97×21 at screen (86.5, 257.5) |
| 6 | Input #2 | component | 309×66 at screen (33, 308) |
| 6a | Icon | ellipse | 24×24, stroke `#5B3FA0` 2px, at screen (50.5, 329) |
| 6b | Label | text | `"Time of Birth"` · 13px/400 · `#4A4560` · 80×16 at screen (86.5, 321.5) |
| 6c | Value | text | `"06:32 AM"` · 17px/400 · `#1E1B2E` · 79×21 at screen (86.5, 339.5) |
| 7 | Input #3 | component | 309×66 at screen (33, 390) |
| 7a | Icon | ellipse | 24×24, stroke `#5B3FA0` 2px, at screen (50.5, 411) |
| 7b | Label | text | `"Place of Birth"` · 13px/400 · `#4A4560` · 83×16 at screen (86.5, 403.5) |
| 7c | Value | text | `"Lucknow, Uttar Pradesh, India"` · 17px/400 · `#1E1B2E` · 241×21 at screen (86.5, 421.5) |
| 8 | Privacy notice panel | frame | fill `#EFE9F7`, radius 12px, 309×66 at screen (33, 634) |
| 8a | Lock icon | rect | 18×16, radius 3px, **no fill**, stroke `#5B3FA0` 2px inside, at screen (51, 659) |
| 8b | Notice text | text | `"Your details are private and used only to create and save your chart."` (wraps to 2 lines at 241px) · 14px/400 · `#3A3550` · left · 241×34 at screen (83, 650) |
| 9 | Primary button | component | 309×55 at (33, 724) |
| 10 | Button label | text | `"Create My Chart"` · 19px/700 · `#FFFFFF` · centre · 153×23 |

### 3.3 `03_CreatingChart`

| # | Element | Type | Exact spec |
|---|---|---|---|
| 1 | Status bar | component | identical to §3.1 rows 1–4 |
| 2 | Zodiac wheel | image + vector | 300×300 circle, fill `#FEFAF0`, radius 150px, at (37.5, 91). Base image `assets/astro-chat/zodiac-wheel.png` (600×600 @2x) |
| 3 | 12 glyph patches | ellipse | 30×30 each, fill `#FEFAF0` (masks), positions per §2.3 table |
| 4 | 12 zodiac glyphs | text | 20px/400, `#5B50D0`, centre, 30×24 box, characters with **U+FE0E** (text presentation selector) appended — see §2.3 table |
| 5 | Screen title | text | `"Creating Your\nAstrology Chart..."` (explicit `\n`) · 28px/700 · `#1E1B2E` · centre · 309×68 at (33, 423) |
| 6 | Progress track | rect | 319×8, fill `#CFC4EA`, radius 4px, at (33, 523) — note width 319 > container 309 (bleeds 10px right) |
| 7 | Progress fill | rect | 160×8, fill `#6B4FA0`, radius 4px, at (33, 523) — **51.7% complete** (160 ÷ 309 = 51.78%) |
| 8 | Checklist | text | `"✓  Calculating planetary positions\n\n✓  Generating birth chart (Kundli)\n\n✓  Saving your profile"` · 16px/400 · `#1E1B2E` · left · 309×95 at (33, 563). Blank line = `\n\n`; paragraph spacing = 19px (= 1 line) `[INFERRED — derived from 95px total ÷ 5 lines of 19px]` |
| 9 | Decorative star | star | 22×22, fill `#F2B84B`, 5 points, inner radius 0.38, at screen (50, 345) |
| 10 | Background hill | ellipse | 360×200, fill `#D9CCF0`, at screen (120, 640) — overflows the right edge by 105px |

### 3.4 `04_Chat`

| # | Element | Type | Exact spec |
|---|---|---|---|
| 1 | Status bar | component | identical to §3.1 rows 1–4 (clock at screen (37, 25)) |
| 2 | Menu icon | text | `"☰"` (U+2630) · 24px/400 · `#1E1B2E` · 22×29 at screen (33, 57) |
| 3 | Header title | text | `"Astro Chat"` · 24px/700 · `#1E1B2E` · centre · 125×29 at screen (123, 57) |
| 4 | Profile icon | ellipse | 26×26, **no fill**, stroke `#1E1B2E` 2px inside, at screen (316, 58.5) |
| 5 | Header rule | border | 1px solid `#E2DAEA`, bottom side only, 365 wide, at y = 101 |
| 6 | Date pill | frame | fill `#ECE6F2`, radius 14px, 73×27, centred in the 333px row, at screen (151, 117) |
| 7 | Date label | text | `"Today"` · 14px/400 · `#4A4560` · centre · 41×17 at screen (167, 122) |
| 8 | Bot avatar 1 | ellipse | 34×34, fill `#FFFFFF`, stroke `#1E1B2E` 2px inside, at screen (21, 160) |
| 9 | Bot bubble 1 | frame | fill `#EEE8F2`, radius 18px, padding 12px 16px, 254×81, max-width 270px, at screen (65, 160) |
| 10 | Bot text 1 | text | `"Namaste! 👋\nYour astrology chart is ready.\nHow may I help you today?"` (explicit `\n`, 3 lines) · 16px/400 · `#1E1B2E` · left · max-width 238px · 222×57 at screen (81, 172) |
| 11 | User bubble | frame | fill `#DCCFF3`, radius 18px, padding 12px 16px, 273×60, max-width 280px, right-aligned at screen (81, 257) |
| 12 | User text | text | `"I am feeling a bit stuck in my\ncareer. Can you please guide me?"` (explicit `\n`, 2 lines) · 15px/400 · `#1E1B2E` · left · max-width 248px · 241×36 at screen (97, 269) |
| 13 | Bot avatar 2 | ellipse | 34×34, fill `#FFFFFF`, stroke `#1E1B2E` 2px inside, at screen (21, 333) |
| 14 | Bot bubble 2 | frame | fill `#EEE8F2`, radius 18px, padding 12px 16px, 270×138, max-width 270px, at screen (65, 333) |
| 15 | Bot text 2 | text | `"Sure, Abhishek. Based on your chart, I can see a phase of transition in career. Would you like a detailed insight, suggested remedies, or to speak with a live astrologer?"` (no manual breaks — wraps to 6 lines at 238px) · 16px/400 · `#1E1B2E` · left · width fixed 238px · 238×114 at screen (81, 345) |
| 16 | Chip · Career | component | 101×40 at screen (27, 579) — fill `#F1ECF6`, stroke `#D8CFE6` 1px, radius 10px |
| 16a | Chip label | text | `"💼 Career"` · 15px/400 · `#1E1B2E` · centre · 71×18 at screen (42, 590) |
| 17 | Chip · Relationships | component | 144×40 at screen (140, 579) |
| 17a | Chip label | text | `"❤️ Relationships"` (U+2764 U+FE0F) · 15px/400 · 114×18 at screen (155, 590) |
| 18 | Chip · Health | component | 99×40 at screen (27, 631) |
| 18a | Chip label | text | `"💜 Health"` (U+1F49C) · 15px/400 · 69×18 at screen (42, 642) |
| 19 | Chip · Remedies | component | 123×40 at screen (138, 631) |
| 19a | Chip label | text | `"🌿 Remedies"` (U+1F33F) · 15px/400 · 93×18 at screen (153, 642) |
| 20 | Chip · General Guidance | component | 172×40 at screen (27, 683) |
| 20a | Chip label | text | `"⭐ General Guidance"` (U+2B50) · 15px/400 · 142×18 at screen (42, 694) |
| 21 | Attach button | frame | 34×34, fill `#E6DCF6`, radius 17px, at screen (21, 744) |
| 22 | Attach glyph | text | `"＋"` — in the file this is the **ASCII plus U+002B** rendered at 24px, not full-width `＋` · `#5B3FA0` · centre · 16×29 at screen (30, 746.5) |
| 23 | Composer input | frame | fill `#FFFFFF`, stroke `#D8CFE6` 1px, radius 23px, padding 4px 4px 4px 16px, 291×48 at screen (63, 737) |
| 24 | Placeholder | text | `"Ask your question..."` · 16px/400 · `#6A6580` · left · 151×19 at screen (80, 751.5) |
| 25 | Send button | frame | 38×38, fill `#6B4FA0`, radius 19px, at screen (311, 742) |
| 26 | Send glyph | text | `"➤"` (U+27A4) · 18px/400 · `#FFFFFF` · centre · 16×22 at screen (322, 750) |

### 3.5 `05_Services`

| # | Element | Type | Exact spec |
|---|---|---|---|
| 1 | Status bar | component | identical to §3.1 rows 1–4 |
| 2 | Back arrow | text | `"←"` · 26px/400 · `#1E1B2E` · 25×31 at (29, 59) |
| 3 | Screen title | text | `"Our Services"` · 26px/700 · `#1E1B2E` · centre · 317×31 at (29, 114) |
| 4 | Screen subtitle | text | `"Explore personalized support based\non your chart and questions."` · 16px/400 · `#3A3550` · centre · 317×38 at (29, 157) |
| 5 | Card · Remedies | component | 317×105 at screen (29, 219) — fill `#FFFFFF`, stroke `#E6DEEF` 1px, radius 16px, padding 16px, gap 16px |
| 5a | IconWrap | frame | 60×60, fill `#FBEFC9`, radius 14px, at screen (46, 241.5) |
| 5b | Icon | text | `"🌿"` (U+1F33F) · 28px/400 · fill `#000000` (renders as colour emoji) · centre · 35×34 at screen (58.5, 254.5) |
| 5c | Title | text | `"Remedies"` · 18px/700 · `#1E1B2E` · left · 179×22 at screen (122, 236) |
| 5d | Description | text | `"Personalized and practical solutions (mantra, gem, ritual, lifestyle, etc.)"` · 12px/400 · `#4A4560` · left · 179×45 (3 lines) at screen (122, 262) |
| 5e | Chevron | text | `"›"` (U+203A) · 30px/400 · `#1E1B2E` · left · 12×36 at screen (317, 253.5) |
| 6 | Card · Counseling | component | 317×105 at screen (29, 342) |
| 6a | IconWrap | frame | 60×60, fill **`#E6DCF6`** (overridden), radius 14px, at screen (46, 364.5) |
| 6b | Icon | text | `"💬"` (U+1F4AC) · 28px/400 · 35×34 at screen (58.5, 377.5) |
| 6c | Title | text | `"Counseling"` · 18px/700 · 179×22 at screen (122, 359) |
| 6d | Description | text | `"Guidance for career, relationships, well-being, and important decisions"` · 12px/400 · 179×45 (3 lines) at screen (122, 385) |
| 6e | Chevron | text | `"›"` · 12×36 at screen (317, 376.5) |
| 7 | Card · Chat with a Live Astrologer | component | 317×106 at screen (29, 465) |
| 7a | IconWrap | frame | 60×60, fill **`#D9F0DC`** (overridden), radius 14px, at screen (46, 488) |
| 7b | Icon | text | `"🧑"` (U+1F9D1) · 28px/400 · 35×34 at screen (58.5, 501) |
| 7c | Title | text | `"Chat with a Live Astrologer"` · **16px/700** (overridden from 18px) · 179×38 (2 lines) at screen (122, 482) |
| 7d | Description | text | `"Get real-time, personalized advice from verified experts"` · 12px/400 · 179×30 (2 lines) at screen (122, 524) |
| 7e | Chevron | text | `"›"` · 12×36 at screen (317, 500) |
| 8 | Card · Detailed Reports | component | 317×94 at screen (29, 589) |
| 8a | IconWrap | frame | 60×60, fill **`#E6DCF6`** (overridden), radius 14px, at screen (46, 606) |
| 8b | Icon | text | `"📊"` (U+1F4CA) · 28px/400 · 35×34 at screen (58.5, 619) |
| 8c | Title | text | `"Detailed Reports"` · 18px/700 · 179×22 at screen (122, 608) |
| 8d | Description | text | `"In-depth analysis (career, marriage, health, finance, etc.)"` · 12px/400 · 179×30 (2 lines) at screen (122, 634) |
| 8e | Chevron | text | `"›"` · 12×36 at screen (317, 618) |
| 9 | Background hill | ellipse | 320×120, fill `#EAE0F7`, at screen (60, 700) |

### 3.6 `06_LiveAstrologer`

| # | Element | Type | Exact spec |
|---|---|---|---|
| 1 | Hills illustration | image | 375×250, absolute, bottom-anchored at y = 562 — `assets/astro-chat/live-astrologer-hills.png` (750×500 @2x, 3:2) |
| 2 | Hills fade overlay | rect | 375×70, absolute, y = 562, fill `--gradient-hills-fade` |
| 3 | Status bar | component | identical to §3.1 rows 1–4 (clock at screen (37, 25)) |
| 4 | Back arrow | text | `"←"` · 26px/400 · `#1E1B2E` · 25×31 at screen (29, 59) |
| 5 | Nav title | text | `"Chat with a Live Astrologer"` · 19px/700 · `#1E1B2E` · left · 276×23 at screen (70, 63) |
| 6 | Astrologer card | frame | fill `#FFFFFF`, stroke `#E6DEEF` 1px, radius 16px, padding 18px 16px, gap 16px, 317×138 at screen (29, 114) |
| 7 | Photo | ellipse | 90×90, fill `#C9A98A` under an image, stroke `#6B4FA0` 3px inside, at screen (46, 138) — `assets/astro-chat/astrologer-photo.png` (180×180 @2x, 1:1) |
| 8 | Name | text | `"Acharya Rajiv Sharma"` · 17px/700 · `#1E1B2E` · left · 177×42 (2 lines) at screen (152, 133) |
| 9 | Status dot | ellipse | 11×11, fill `#2FB24C`, at screen (152, 184.5) |
| 10 | Status text | text | `"Online"` · 15px/400 · `#2FB24C` · left · 46×18 at screen (170, 181) |
| 11 | Specialities | text | `"Vedic Astrology • Career • Remedies"` · 11.5px/400 · `#4A4560` · left · 177×28 (2 lines) at screen (152, 205) |
| 12 | Booking panel | frame | fill `#EFE9F7`, radius 16px, padding 16px, gap 14px, 317×139 at screen (29, 276) |
| 13 | Price text | text | `"💬  Chat live for personalized guidance (₹499 / 30 min)"` (two spaces after the emoji, `₹` = U+20B9) · 16px/400 · `#1E1B2E` · left · 285×38 (2 lines) at screen (45, 292) |
| 14 | Primary button | component | fill `#6B4FA0`, radius 28px, 285×55 at screen (45, 344) |
| 15 | Button label | text | `"Start Live Chat"` · 19px/700 · `#FFFFFF` · centre · 137×23 at screen (119, 360) |
| 16 | Link | text | `"View Other Astrologers"` · 16px/400 · `#3A2F6B` · centre · **underline** · 317×19 at screen (29, 439) |

### 3.7 Asset manifest

All four raster assets were exported from the Figma file at 2× and saved to `assets/astro-chat/`.

| File | Pixels | Displayed at | Aspect | Corner treatment |
|---|---|---|---|---|
| `assets/astro-chat/splash-telescope.png` | 580 × 580 | 290 × 290 | 1:1 | `border-radius: 50%` (145px) |
| `assets/astro-chat/zodiac-wheel.png` | 600 × 600 | 300 × 300 | 1:1 | `border-radius: 50%` (150px) |
| `assets/astro-chat/live-astrologer-hills.png` | 750 × 500 | 375 × 250 | 3:2 | none (rectangular, bottom-anchored) |
| `assets/astro-chat/astrologer-photo.png` | 180 × 180 | 90 × 90 | 1:1 | `border-radius: 50%` + `border: 3px solid #6B4FA0` |

**Vector artwork to reproduce in code (no asset file):**
- Splash planet: two ellipses — 90×90 body (`fill #FFFFFF`, `stroke #1E1B2E` 3px) and a 164.9 × 80.05 ring (`stroke #1E1B2E` 3px, no fill) rotated −15°, overlapping the body.
- Decorative stars: 5-point star, `innerRadius: 0.38` (Figma star ratio), fill `#F2B84B`. Render as an inline SVG with the same point count/ratio, or a star polygon with inner radius = 0.38 × outer radius.
- Zodiac glyphs: Unicode characters (see §2.3), not images.

---

## 4. Interactive States & Edge Cases

> **Evidence note.** The Figma file contains **zero** prototype interactions (verified: no node has an `interactions` array) and **no component variants / boolean props / component-set states**. Every value in §4.1–§4.3 is therefore `[INFERRED]`, derived from the token set: state colours are computed from palette colours by a stated rule, never chosen as an unrelated hue. Treat §4.1 as the binding contract.
>
> **Derived state colours.** These six values do **not** exist in the Figma file — they are computed from existing palette entries and are the only new hex values permitted by this spec:
>
> | Derived value | Rule | Derived from |
> |---|---|---|
> | `#4C3384` | −15% lightness, primary pressed | `#6B4FA0` |
> | `#2A2154` | −15% lightness, link pressed | `#3A2F6B` |
> | `#B9A8E2` | +8% lightness, input hover border | `#CFC4EA` |
> | `#D5C4EE` | −6% lightness, attach pressed | `#E6DCF6` |
> | `#A6A0B5` | 60% opacity of muted text on white | `#4A4560` |
> | `#E5484D` | system error red — the only non-purple hue; used **only** for `[aria-invalid="true"]` | n/a (one-off) |
>
> Every other state colour in §4.1 is a palette value reused verbatim (`#5B3FA0`, `#D8CFE6`, `#CFC4EA`, `#DCCFF3`, `#E6DEEF`, `#F6F1F8`, `#6B4FA0`, `#E6DCF6`, `#A6A0B5` as listed above).

### 4.1 State matrix

**Global transition:** `transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, opacity 150ms ease, box-shadow 150ms ease;` `[INFERRED]`

#### Primary button (`--color-primary` fill, `--color-on-primary` label, radius 28px)

| State | Background | Label | Other |
|---|---|---|---|
| rest | `#6B4FA0` | `#FFFFFF` | — |
| `:hover` | `#5B3FA0` | `#FFFFFF` | 1px darker than rest (matches the existing `--color-icon` value) |
| `:focus-visible` | `#6B4FA0` | `#FFFFFF` | `outline: 2px solid #5B3FA0; outline-offset: 2px;` — never remove the outline |
| `:active` | `#4C3384` | `#FFFFFF` | 2 steps darker; `transform: translateY(1px)` |
| `disabled` | `#D8CFE6` | `#FFFFFF` at 60% opacity (`#D8CFE6` on `#D8CFE6` = invisible → use `rgba(255,255,255,0.6)`) | `cursor: not-allowed;` `aria-disabled="true"` |
| `:focus-visible + :active` | `#4C3384` | `#FFFFFF` | outline retained |

#### Suggestion chip (`--surface-chip` fill, `--border-chip` stroke, radius 10px, 15px label)

| State | Fill | Border | Label |
|---|---|---|---|
| rest | `#F1ECF6` | `#D8CFE6` 1px | `#1E1B2E` |
| `:hover` | `#E6DCF6` | `#CFC4EA` 1px | `#1E1B2E` |
| `:focus-visible` | `#F1ECF6` | `#D8CFE6` 1px | `#1E1B2E` + `outline: 2px solid #6B4FA0; outline-offset: 2px;` |
| `:active` | `#DCCFF3` | `#CFC4EA` 1px | `#1E1B2E` |
| `disabled` | `#F6F1F8` | `#E6DEEF` 1px | `#A6A0B5` (60% of `#4A4560` over white) |

#### Text field (`--surface-input` fill, `--border-input` 1.5px stroke, radius 10px)

| State | Border | Ring | Fill |
|---|---|---|---|
| rest | `#CFC4EA` 1.5px | none | `#FDFBFF` |
| `:hover` | `#B9A8E2` 1.5px | none | `#FDFBFF` |
| `:focus` / `:focus-within` | `#6B4FA0` 1.5px | `0 0 0 3px rgba(107, 79, 160, 0.15)` | `#FDFBFF` |
| `:active` | `#6B4FA0` 1.5px | same ring | `#FDFBFF` |
| `disabled` | `#E6DEEF` 1.5px | none | `#F6F1F8` |
| `[aria-invalid="true"]` | `#E5484D` 1.5px | `0 0 0 3px rgba(229, 72, 77, 0.12)` | `#FDFBFF` |

- Label (`--text-muted`) stays `#4A4560` in all states except `disabled` (`#A6A0B5`).
- Value text colour: `#1E1B2E`; placeholder colour: `#6A6580`.
- Caret colour: `#6B4FA0`. Text selection: `background: rgba(107, 79, 160, 0.20);`.
- The leading icon circle keeps stroke `#5B3FA0` 2px at 100% when focused.

#### Service card (`--surface-card` fill, `--border-card` stroke, radius 16px)

| State | Fill | Border | Chevron |
|---|---|---|---|
| rest | `#FFFFFF` | `#E6DEEF` 1px | `#1E1B2E` |
| `:hover` | `#FDFBFF` | `#CFC4EA` 1px | `#6B4FA0` |
| `:focus-visible` | `#FFFFFF` | `#E6DEEF` 1px | + `outline: 2px solid #6B4FA0; outline-offset: 2px;` |
| `:active` | `#F6F1F8` | `#CFC4EA` 1px | `#6B4FA0` |
| `disabled` | `#F6F1F8` | `#E6DEEF` 1px | `#A6A0B5`; title `#A6A0B5`; icon wrap opacity 40% |

#### Send button (38×38 circle, `#6B4FA0`)

| State | Background | Glyph |
|---|---|---|
| rest | `#6B4FA0` | `#FFFFFF` |
| `:hover` | `#5B3FA0` | `#FFFFFF` |
| `:focus-visible` | `#6B4FA0` | `#FFFFFF` + `outline: 2px solid #5B3FA0; outline-offset: 2px;` |
| `:active` | `#4C3384` | `#FFFFFF` |
| `disabled` | `#D8CFE6` | `rgba(255,255,255,0.6)` |

#### Attach button (34×34 circle, `#E6DCF6`)

| State | Background | Glyph |
|---|---|---|
| rest | `#E6DCF6` | `#5B3FA0` |
| `:hover` | `#DCCFF3` | `#5B3FA0` |
| `:focus-visible` | `#E6DCF6` | `#5B3FA0` + `outline: 2px solid #6B4FA0; outline-offset: 2px;` |
| `:active` | `#D5C4EE` | `#5B3FA0` |

#### Composer input

| State | Border | Fill |
|---|---|---|
| rest | `#D8CFE6` 1px | `#FFFFFF` |
| `:focus-within` | `#6B4FA0` 1px + `0 0 0 3px rgba(107,79,160,0.15)` | `#FFFFFF` |
| `disabled` | `#E6DEEF` 1px | `#F6F1F8` |

#### Icon-only buttons (back arrow `←`, menu `☰`, profile circle, chevron `›`, link)

| State | Treatment |
|---|---|
| `:hover` | `opacity: 0.6` on the glyph / `color: #6B4FA0` for the chevron |
| `:focus-visible` | `outline: 2px solid #6B4FA0; outline-offset: 4px; border-radius: 4px;` |
| `:active` | `opacity: 0.4` |
| `disabled` | `opacity: 0.4; pointer-events: none;` |

#### Link "View Other Astrologers"

| State | Colour | Decoration |
|---|---|---|
| rest | `#3A2F6B` | underline, `text-underline-offset: 2px` |
| `:hover` | `#6B4FA0` | underline |
| `:focus-visible` | `#3A2F6B` | underline + `outline: 2px solid #6B4FA0; outline-offset: 2px;` |
| `:active` | `#2A2154` | underline |

#### Date pill, privacy notice, booking panel, background hills, zodiac wheel

Static — no interactive states. Do not add hover/active to them.

### 4.2 Focus, keyboard and semantics

- Focus order follows DOM order, which matches the visual order in §2.
- Every interactive element is reachable by Tab; nothing is removed from the tab order.
- `:focus-visible` is the only focus style. Never apply `outline: none` without an equivalent `:focus-visible` rule.
- Minimum hit target: **44 × 44 px**. The design's small controls are smaller than that and must be padded with a transparent hit area:
  - Back arrow `←` (25×31) → wrap in a `44 × 44` button with the glyph centred.
  - Send button 38×38 → `44 × 44` hit area (the visible circle stays 38px, centred).
  - Attach button 34×34 → `44 × 44` hit area.
  - Header menu `☰` (22×29) and profile icon (26×26) → `44 × 44` hit areas.
  - Service card chevron `›` (12×36) → the whole card is the click target, so the chevron is decorative (`aria-hidden="true"`).
- Buttons: `<button type="button">`. Links: `<a>`. Text fields: `<input>` with a `<label>` (visually the small `--text-muted` label above the value; use `aria-label` or a real `<label>` positioned over the field).
- Emoji and zodiac glyphs: wrap in `aria-hidden="true"` and provide a text alternative, e.g. `aria-label="Career"`, `aria-label="Aries"`.
- The status bar is decorative mock chrome — mark the whole `StatusBar` subtree `aria-hidden="true"` in web builds.
- Colour is never the only signal: the "Online" state pairs the green dot with the word "Online"; the progress bar pairs the fill with the textual checklist.

### 4.3 Text truncation and overflow

**In the Figma file no text layer uses `maxLines`, and no layer uses `text-overflow: ellipsis`.** Wrapping is `wrap` + auto-height. Implement exactly that, plus the clamps below for robustness.

| Element | Overflow rule |
|---|---|
| Bot bubble 1 text | 3 explicit lines; `max-width: 238px`; no clamp (3 lines × 19px = 57px) |
| Bot bubble 2 text | `width: 238px` fixed; wraps to 6 lines (114px); **no clamp** — do not truncate this paragraph |
| User bubble text | `max-width: 248px`; 2 explicit lines |
| Service card title | `line-clamp: 2` (max-height 44px at 18px/22px) `[INFERRED]` — "Chat with a Live Astrologer" is the only title that reaches 2 lines at 16px |
| Service card description | `line-clamp: 3` (max-height 45px at 12px/15px) `[INFERRED]` — "Personalized and practical solutions…" is exactly 3 lines |
| Astrologer name | `line-clamp: 2` (max-height 42px) `[INFERRED]` |
| Astrologer specialities | `line-clamp: 2` (max-height 28px) `[INFERRED]` |
| Booking price text | `line-clamp: 2` (max-height 38px) `[INFERRED]` |
| Privacy notice text | 2 lines (34px); allow up to 3 before scrolling `[INFERRED]` |
| Screen subtitles (02, 05) | fixed 2 lines via explicit `\n`; `white-space: pre-line` so the break survives |
| Screen title (03) | explicit `\n`; `white-space: pre-line` |
| 06 nav title | `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` — **truncate**, 1 line, 276px `[INFERRED]` |
| Chip labels | `white-space: nowrap;` — chips hug their label and never wrap |
| Composer placeholder | `text-overflow: ellipsis; white-space: nowrap;` — **truncate** `[INFERRED]` |
| Input values | `text-overflow: ellipsis; white-space: nowrap;` — **truncate** `[INFERRED]` (currently max 241px of "Lucknow, Uttar Pradesh, India" fits) |

Implementation notes:
- Explicit `\n` breaks need `white-space: pre-line` (or `<br>`); `white-space: pre-wrap` for the checklist's double newlines.
- `line-clamp` requires `display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: N; overflow: hidden;`.
- The checklist's paragraph spacing is 19px (`<p>` with `margin: 0 0 19px`, last child `margin-bottom: 0`).
- The card chevron uses `›` (U+203A), not an SVG — keep the glyph for pixel fidelity, or swap for an SVG chevron 12×36 with `stroke-width: 2`.

### 4.4 Responsive behaviour

The design is a **mobile-first 375 × 812 artboard**. There is no tablet or desktop artboard in the file, so §4.4.2–§4.4.4 are `[INFERRED]`; they extend the existing tokens without inventing new ones.

#### 4.4.1 Mobile — 375px (the reference)

- Everything in §2 and §3 is reproduced exactly. No media query changes any value below 768px.
- The device chrome (5px `#3B3050` border, 44px radius) is **mockup only** — omit it in a real app, or keep it as a presentation frame.
- Safe areas: the status bar row (38px) stands in for the iOS status bar. In a real device build, replace it with `env(safe-area-inset-top)` (typically 44–59px) and keep the 38px minimum via `min-height: max(38px, env(safe-area-inset-top))`.
- Bottom safe area: the 22px bottom padding on `04_Chat`'s `Bottom` container must become `calc(22px + env(safe-area-inset-bottom))`.

#### 4.4.2 Small phones — 320px to 374px `[INFERRED]`

| Element | Change |
|---|---|
| Screen content horizontal padding | Keep 28px (splash, birth details) / 24px (services, live astrologer); at 320px the content width becomes 264 / 272px |
| Bot bubble | `max-width: 270px` → `max-width: min(270px, 100%)`; bot text `max-width: min(238px, 100%)` |
| User bubble | `max-width: min(280px, 100%)`; text `max-width: min(248px, 100%)` |
| Composer | attach button 34px + gap 8px + input `min-width: 0` → input shrinks first; placeholder truncates |
| Chips | wrap naturally; `gap: 12px`; chips hug content and never overflow |
| Service card | icon wrap stays 60×60; `TextCol` shrinks to `min-width: 0`; title/description clamp |
| Screen title (splash, 58px) | Reduce to 48px (`3rem`) below 360px so "Astro Chat" fits the 264px content width; 58px "Astro Chat" measures 309px and overflows below 337px content width |

#### 4.4.3 Tablet — 768px `[INFERRED]`

- Render the app as a **centred 375px column**. `max-width: 375px; margin: 0 auto;` and the page background is the same screen gradient (`--gradient-screen-warm`) so the column blends into the backdrop.
- Do **not** stretch the layout to 768px: every horizontal dimension in the file (24–28px gutters, 309–317px content, 254–273px bubbles) is tuned to 375px, and widening the content column would break the bubble/typography ratios.
- If a wider presentation is required, keep the 375px column at a 1:1 scale and centre it inside a 430px-wide "device" wrapper with the gradient backdrop — do not reflow.
- Optional tablet-only enrichment (not in the file): show the Services cards in a 2-column grid of 317px cards. Only do this if the product asks for it — it is **not** in the Figma design.

#### 4.4.4 Desktop — 1440px `[INFERRED]`

- Same centred-column rule: `max-width: 375px; margin: 0 auto; min-height: 100vh;` page background = `--gradient-screen-warm`.
- The 375px column keeps its fixed internal metrics; nothing reflows.
- For a marketing/portfolio build, render the device chrome (44px radius, 5px `#3B3050` border) around the column and add a `max-width: 430px` wrapper so the bezel sits on the gradient.
- Chat screen (04) at desktop: keep `Messages` scrollable (`overflow-y: auto`) with the `Bottom` composer pinned to the bottom of the 812px column (`position: sticky; bottom: 0`).

#### 4.4.5 Behavioural rules that hold at every width

| Rule | Value |
|---|---|
| Content column | `width: 100%; max-width: 375px;` |
| Horizontal gutters | 24px (services, live astrologer), 28px (splash, birth details), 32px (status bar row) — unchanged |
| Fixed-size elements | 290×290 telescope, 300×300 wheel, 90×90 photo, 34×34 avatars, 60×60 icon wraps, 38×38 send, 34×34 attach, 26×26 profile — unchanged |
| Flexible elements | content width = `100%` of the column minus padding; bubbles hug up to their max-width; chips wrap; `TextCol` = `flex: 1; min-width: 0` |
| Touch targets | 44×44 minimum (§4.2) |
| Type scale | unchanged at all widths except the splash title below 360px (§4.4.2) |

### 4.5 Edge cases

| Case | Handling |
|---|---|
| Empty field (e.g. "Place of Birth" cleared) | Value text falls back to the placeholder colour `#6A6580`; the field keeps its 66px height (do not collapse) |
| Long place-of-birth value | Truncate with an ellipsis inside the 241px value box; the field height stays 66px |
| Long bot message | Bubble grows vertically; `max-width: 270px` is a hard cap; `Messages` scrolls (`overflow-y: auto`) |
| Chat input grows to 4 lines | Composer input height grows to 4 × 19 + 8 = 84px; radius stays 23px; the send button stays 38×38, vertically centred `[INFERRED]` |
| Progress not yet at 100% | `Progress/Fill` width = percentage of the 309px track; track stays 319px wide and bleeds 10px past the right edge (matches the design) |
| Offline astrologer | Hide the `Status` row (dot + "Online") or show it greyed at `#A6A0B5` `[INFERRED]`; the `Info` column re-flows because it is `flex: 1` with `gap: 6px` |
| Astrologer with no photo | The `#C9A98A` fallback fill shows through the image slot; the 3px `#6B4FA0` ring stays |
| Reduced motion | All transitions in §4.1 collapse to `0.01ms` under `prefers-reduced-motion: reduce` |
| Dark mode | Not designed — the token collection has a single `Light` mode. Add a `Dark` collection mode rather than inverting ad hoc. |

### 4.6 Acceptance checklist

- [ ] Screen background gradients match §1.1.3 exactly (top stop → bottom stop, `to bottom`).
- [ ] Every colour used comes from §1.1.1, §1.1.2 or the derived-state table in §4 — no other new hex values.
- [ ] All 8 named text styles plus the 27 ad-hoc styles from §1.2 render at the exact px sizes, with `letter-spacing: 0` and Inter.
- [ ] No box-shadow exists anywhere in the UI (elevation = borders only).
- [ ] Radii match §1.4 (28 / 23 / 19 / 18 / 17 / 16 / 14 / 12 / 10 / 50% / 44).
- [ ] All gaps and paddings match §2; the resolved `space-between` gaps are 44px on 01, 178px on 02.
- [ ] The 12 zodiac glyphs use U+2648–U+2653 **with U+FE0E** and sit at the §2.3 coordinates.
- [ ] The four exported PNGs are present in `assets/astro-chat/` and referenced at the §3.7 display sizes.
- [ ] All hover / focus-visible / active / disabled styles match §4.1.
- [ ] Focus rings are visible on every interactive element and nothing uses `outline: none` alone.
- [ ] Interactive targets are ≥ 44×44 px.
- [ ] Truncation rules match §4.3 (ellipsis on nav title + placeholders, line-clamp on card copy, no clamp on the bot paragraph).
- [ ] The layout holds at 375, 768 and 1440 per §4.4 (centred 375px column above 375px).
