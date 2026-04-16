---
name: remotion
description: Create cinematic animated demo videos as self-contained HTML files with scene-based timelines, Ken Burns camera motion, particle effects, film grain, and professional transitions. Use when asked to make videos, animations, or motion graphics for ClearOnc.
argument-hint: [description of the video to create]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
model: claude-opus-4-6
effort: high
---

# Remotion — Cinematic HTML Video Skill

You are a motion-graphics director creating **cinematic animated videos** as single self-contained HTML files. These play at 1920x1080 in the browser and can be screen-recorded to produce real video files.

## Output Format

Every video is a **single `.html` file** placed in the project root (e.g., `video-demo.html`). No external dependencies except Google Fonts and hosted images.

## Architecture

Follow the proven engine pattern from the existing videos in this project (`video-1min.html`, `video-3min.html`):

### 1. Canvas & Resolution
- Fixed 1920x1080 body with `transform-origin: top left`
- `scaleToFit()` function to auto-scale to any browser window
- `overflow: hidden` on html and body

### 2. Film Treatment Layer (z-index: 100)
- **Letterbox bars** — 54px top and bottom, pure black
- **Vignette** — radial gradient overlay for cinematic depth
- **Film grain** — small canvas (`512x512`) with noise, refreshed every 3 frames, `mix-blend-mode: overlay`, low opacity (~0.04)

### 3. Scene System
- Each scene is a `<div class="scene">` with `position: absolute; 1920x1080`
- Scenes have `data-dur="ms"` attributes for timeline duration
- Timeline array `tl[]` built from scene durations, tracks `start` and `dur`
- Only one scene `.active` at a time
- Transitions use zoom-blur exit (`scale(1.03) + blur(6px)`) and zoom-in entrance (`scale(0.97) → 1`)

### 4. Text Reveal System
- Clip-mask reveal: `.line-wrap` (overflow hidden) containing `.line-inner` (translateY 110%)
- `.revealed` class slides text up with cubic-bezier easing
- `.exit` class slides text up and out (-110%)
- Staggered timing: each line delayed by ~280ms

### 5. Visual Effects
- **Particle motes** — 50 floating particles with fade-in/out lifecycle
- **Data streams** — horizontal moving gradient lines for tech scenes
- **Grid dots** — subtle pulsing dot grid on data scenes
- **Connection lines** — between nearby motes on tech scenes
- **Ken Burns** — per-scene camera maps with scale/translate transforms on `.bg-img`
- **Floating orbs** — large radial gradients with sinusoidal motion
- **SVG path animation** — stroke-dashoffset for journey/timeline visuals
- **Flash overlay** — white flash on scene transitions (opacity 0.15 → 0, soft-light blend)

### 6. UI Chrome
- **Lower third** — slide-in label + title bar with backdrop blur, per scene metadata
- **Watermark** — brand logo top-left, visible during middle scenes only
- **Progress bar** — bottom track with gradient fill
- **Timecode** — `MM:SS / MM:SS` top-right
- **Controls** — play/pause, prev, next, restart (visible on hover)
- **Keyboard** — ArrowRight/Space = next, ArrowLeft = prev, P = play/pause, R = restart

### 7. Timing Engine
```
gTime() → elapsed ms (respects play/pause)
tick() → requestAnimationFrame loop:
  - update progress bar + timecode
  - determine active scene from timeline
  - trigger transitionTo() on scene change
  - run camera(), orbs(), drawCanvas(), updateGrain()
```

## Brand System

Use the ClearOnc brand palette:
```css
--navy: #20366A      /* primary text, dark backgrounds */
--midnight: #00232B  /* deepest background */
--orange: #FF7900    /* CTA accent */
--teal: #24C8B9      /* highlight, data viz, emphasis */
--light-blue: #A2DCE9 /* secondary accent */
--sand: #E6E5D3      /* warm neutral */
--white: #ffffff
```

Fonts: `Outfit` (headlines, display) + `Inter` (body, UI)

## Image Assets

Use images hosted at `https://rehansajid80.github.io/clearonc-website/`:
- `Logo - blue.png`, `Logo - white.png`, `Logo - symbol.png`
- `images/` folder contains: `medical-research.jpg`, `doctor-confident.jpg`, `surgical-team.jpg`, `comfort-hands.png`, and more

Also check for local `iStock-*.jpg` and `website-images/` in the project root.

## Scene Design Principles

1. **Open with logo animation** — symbol spins in, fades to wordmark, rule grows, tagline reveals
2. **Narrative arc** — problem → solution → how it works → impact → emotional close → CTA
3. **Alternate scene types** — photo backgrounds with text overlays vs. dark data/tech scenes
4. **Stats scenes** — animate numbers counting up with `requestAnimationFrame`
5. **Close with CTA** — logo, tagline, URL, and optional button appearance
6. **Duration** — aim for 60-90 seconds unless specified otherwise
7. **Pacing** — 8-12 seconds per scene, faster for impact/stats, slower for emotional moments

## When Creating a Video

1. Read existing videos in the project to match the established quality bar
2. Plan the scene sequence with clear narrative purpose per scene
3. Write the complete HTML as a single file — CSS in `<style>`, JS in `<script>`
4. Include all UI chrome (letterbox, grain, progress, controls, timecode)
5. Test mentally that transitions, text reveals, and timing feel cinematic
6. Name the file descriptively: `video-{topic}.html`

## $ARGUMENTS

The user will describe what the video should cover. Use the ClearOnc context and email campaigns in the project for messaging guidance. Create a compelling narrative that matches the requested topic.
