---
name: Consumer Resource Center
description: Bilingual fraud help and scam education for the Korean-American community
colors:
  community-lime: "#CDF07A"
  community-lime-soft: "#EEF8D6"
  action-red: "#C9372A"
  warning-yellow: "#F4B942"
  warning-yellow-soft: "#FDF1D7"
  grounded-ink: "#1A1E24"
  grounded-ink-soft: "#3E444D"
  warm-paper: "#FFFEFB"
  warm-paper-secondary: "#F8F7F2"
  quiet-line: "#E6E5DD"
  accessible-link: "#0F5132"
  focus-blue: "#1D4ED8"
typography:
  display:
    fontFamily: "Noto Sans KR, Segoe UI, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "clamp(2.05rem, 1.5rem + 2.5vw, 2.95rem)"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Noto Sans KR, Segoe UI, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "clamp(1.9rem, 1.45rem + 2.4vw, 2.9rem)"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Noto Sans KR, Segoe UI, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.68
  label:
    fontFamily: "Noto Sans KR, Segoe UI, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "0.925rem"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  input: "10px"
  surface: "14px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  section: "clamp(3.2rem, 7vw, 5.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.action-red}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.input}"
    padding: "0.55em 1.5em"
    height: "48px"
  button-dark:
    backgroundColor: "{colors.grounded-ink}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.input}"
    padding: "0.55em 1.5em"
    height: "48px"
  input:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.grounded-ink}"
    rounded: "{rounded.input}"
    padding: "0.6em 0.95em"
    height: "48px"
  information-surface:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.grounded-ink}"
    rounded: "{rounded.surface}"
    padding: "1.6rem"
---

# Design System: Consumer Resource Center

## Overview

**Creative North Star: "The Neighborhood Safety Desk"**

The system should feel like a clear, well-prepared desk inside a trusted community center. Important forms and phone numbers are easy to find, warnings are direct, and no visual effect competes with the next safe action. Lime gives the organization a recognizable public presence, while ink, warm paper, red, and yellow make urgency and caution immediately legible.

This is a brand surface with a functional reporting tool inside it. The homepage may be visually committed, but task pages stay calm and literal. The system rejects generic government portals, purple-gradient SaaS styling, glassmorphism, metric showcases, and repeated icon-card grids.

**Key Characteristics:**

- Large bilingual typography
- Committed lime brand surfaces
- Red reserved for urgent or primary action
- Warm paper instead of pure white
- Editorial rows for reading and navigation
- Restrained motion and unmistakable focus states

## Colors

Community Lime carries recognition and optimism. Grounded Ink provides authority without bureaucratic navy. Action Red signals the primary next step, while Warning Yellow supports caution and memory.

### Primary

- **Community Lime:** Drenched hero backgrounds, selected support surfaces, and signature details.
- **Action Red:** Urgent actions, critical borders, and warning emphasis. White text uses the darker red token only.

### Secondary

- **Warning Yellow:** Prevention rules, caution surfaces, and restrained offset shadows.
- **Accessible Link Green:** Inline text links on warm paper.

### Neutral

- **Grounded Ink:** Body text, dark action panels, and structural borders.
- **Warm Paper:** Primary page background and light text on dark controls.
- **Warm Paper Secondary:** Quiet section bands and reading surfaces.
- **Quiet Line:** Dividers inside editorial lists.

**The Three-Role Rule.** Lime identifies the organization, red drives action, and yellow communicates caution. Never assign all three colors to competing calls to action in one viewport.

## Typography

**Display Font:** Noto Sans KR with system Korean sans-serif fallbacks

**Body Font:** Noto Sans KR with system Korean sans-serif fallbacks

**Character:** A single bilingual family keeps Korean and English equally legible. Hierarchy comes from scale, weight, spacing, and line length rather than decorative font pairing.

### Hierarchy

- **Display:** Weight 900, fluid hero scale, 1.2 line height. Used only for the primary page message.
- **Headline:** Weight 900, fluid section scale. Korean headlines retain comparable visual authority.
- **Title:** Weight 700 to 900, used for task choices and guide topics.
- **Body:** Weight 400, 18px, 1.68 line height, maximum 68 characters.
- **Label:** Weight 700, used for controls, metadata, and short category names.

**The Korean Parity Rule.** Solve Korean wrapping with width and deliberate line breaks before reducing type size. Korean must never look like secondary fine print.

## Elevation

The system is flat by default. Borders, warm tonal bands, and spacing establish structure. Ambient shadows are reserved for truly floating or interactive surfaces. Offset yellow or red shadows appear only on signature prevention and directory moments.

### Shadow Vocabulary

- **Ambient Rest:** A subtle low shadow for interactive agency surfaces.
- **Ambient Lift:** A wider shadow used only on hover and the open chat panel.
- **Sticker Offset:** A solid 5 to 7px brand-color offset used sparingly on memorable teaching elements.

**The Flat-By-Default Rule.** Static information does not receive a shadow merely because it is inside a container.

## Components

### Buttons

- **Shape:** Gently rounded rectangle, 10px radius, minimum 48px height.
- **Primary:** Dark red with warm-paper text.
- **Hover / Focus:** Darken without changing semantic color; show a 3px blue focus outline.
- **Secondary:** Ink or transparent outline depending on hierarchy.

### Chips

- **Style:** Full pills are reserved for filters, language selection, and compact status labels.
- **State:** Selected filters use ink with warm-paper text; unselected filters stay on warm paper with an ink border.

### Cards / Containers

- **Corner Style:** 14px where a bounded interactive object is required.
- **Background:** Warm paper with a quiet line border.
- **Shadow Strategy:** Flat for static information, ambient shadow for interactive agency results.
- **Internal Padding:** 1.35 to 1.6rem.

### Inputs / Fields

- **Style:** 2px ink-muted border, warm-paper background, 10px radius, minimum 48px height.
- **Focus:** Border shifts to focus blue and retains the global 3px outline.
- **Error / Disabled:** Errors use dark readable red. When organizational context matters, unavailable forms may remain visible as a clearly labeled, non-interactive preview.

### Navigation

The header is solid warm paper with one dominant dark-red Get Help action. Donate or Support never competes with Get Help while online giving is unavailable. Mobile navigation uses a large menu button and 50px rows.

### Reporting Wizard

Wizard options use large bordered rows with explicit labels, visible progress crumbs, Back, and Start Over. Results name the recommended agency and explain what happens after filing.

## Do's and Don'ts

### Do:

- **Do** keep primary controls at least 48px high and every touch target at least 44px.
- **Do** put bank-first and account-protection steps before videos or educational detail.
- **Do** use editorial rows for guide indexes, news, support options, and public commitments.
- **Do** show official destinations and clearly state CRC's limits.
- **Do** use real organizational information only.
- **Do** provide equal hierarchy and complete meaning in Korean and English.

### Don't:

- **Don't** use side-stripe borders greater than 1px as card accents.
- **Don't** build identical icon-card grids for unrelated content.
- **Don't** use hero metric templates, glassmorphism, gradient text, or purple-gradient SaaS styling.
- **Don't** apply pill radii to standard buttons or every navigation item.
- **Don't** publish placeholder email addresses, empty team cards, fake testimonials, or fabricated staff imagery.
- **Don't** shrink Korean headlines until they feel secondary.
- **Don't** add bouncing, elastic, or decorative scroll motion.
