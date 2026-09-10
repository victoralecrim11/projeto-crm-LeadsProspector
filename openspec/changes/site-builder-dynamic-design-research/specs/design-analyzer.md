# Spec: Reference Design Analyzer & Safe CSS Policy

## Requirements
1. **Deterministic HTML/CSS Signal Extraction:**
   - No JavaScript execution, no DOM emulation, no headless browser.
   - Strips `<script>`, `<template>`, `<noscript>` prior to extraction.
2. **Color Normalization:**
   - Converts 3-digit hex, 6-digit hex, 8-digit hex (opaque), `rgb()`, `rgba()`, `hsl()`, `hsla()` to standard lowercase 6-digit hex (`#rrggbb`).
   - Context detection: categorizes uses as `background`, `button`, `heading`, `text`, `border`.
   - Filters out non-color tokens (`inherit`, `initial`, `unset`, `transparent`, `currentColor`).
3. **Typography Extraction:**
   - Extracts `font-family` from CSS rules.
   - Extracts Google Fonts links from `<link rel="stylesheet">`.
   - Categorizes fonts into heading vs body families.
4. **Layout & Theme Classification:**
   - Determines theme: `light`, `dark`, or `mixed`.
   - Determines hero: `full-bleed`, `split`, `centered`, or `minimal`.
   - Determines services: `list`, `cards`, `editorial`, or `grid`.
   - Determines shape by average radius: `sharp` (0-4px), `soft` (5-20px), `pill-heavy` (>20px).
5. **Safe CSS Security Policy:**
   - Maximum stylesheet size: 256 KiB.
   - Content-Type verification: `text/css` or `text/plain`.
   - Strips `@import` rules to prevent recursive SSRF chains.
   - Strips `url(...)` to prevent exfiltration and secondary requests.
   - Strips legacy active scripting (`expression()`, `behavior:`, `-moz-binding`).
