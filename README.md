# Starfield

## Starfield - Lightweight Canvas Star Animation Library

Starfield is a lightweight, fully typed TypeScript library for rendering
animated starfield effects on an HTML canvas. It uses a cached sprite map,
high-DPI canvas scaling, density-based star generation, delta-time animation,
and runtime property updates.

---

## 🌌 Live Demo

Try Starfield in the browser:

https://crisvsgame.github.io/starfield/

---

## 📦 Installation

Install from npm:

```bash
npm install @crisvsgame/starfield
```

Import the main class:

```typescript
import { Starfield } from "@crisvsgame/starfield";
```

---

## 🚀 Quick Start

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Starfield Demo</title>
        <link rel="stylesheet" href="main.css" />
        <script type="module" src="main.js"></script>
    </head>
    <body>
        <canvas id="starfield"></canvas>
    </body>
</html>
```

```css
#starfield {
    width: 100%;
    height: 100%;
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    background-color: black;
}
```

```typescript
import { Starfield } from "@crisvsgame/starfield";

const cvs = document.getElementById("starfield");

if (!(cvs instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element not found");
}

const starfield = new Starfield(cvs);

starfield.start();
```

---

## 🌐 CDN / Browser ESM

Starfield can also be imported directly in the browser through jsDelivr:

```html
<script type="module">
    import { Starfield } from "https://cdn.jsdelivr.net/npm/@crisvsgame/starfield@1.1.0/dist/index.min.js";

    const cvs = document.getElementById("starfield");

    if (!(cvs instanceof HTMLCanvasElement)) {
        throw new Error("Canvas element not found");
    }

    const starfield = new Starfield(cvs);

    starfield.start();
</script>
```

---

## 🔧 Features

### Canvas Rendering

- High-DPI canvas scaling
- Cached sprite-map rendering
- Canvas resize handling
- Delta-time animation
- Tab inactivity protection

### Starfield Controls

- `start()`
- `pause()`
- `reset()`
- `stop()`
- `destroy()`

### Runtime Properties

- Dynamic property updates
- Density-based star count
- Weighted sprite distribution
- Configurable speed range
- Configurable star properties

### Fully Typed

```typescript
import { Starfield, type StarfieldOptions } from "@crisvsgame/starfield";
```

---

## 🎛️ Runtime Updates

```typescript
starfield.setProperties({
    stars: 500,
    sprites: 8,
    spriteWidth: 32,
    spriteHeight: 32,
    minOuterRadius: 4,
    maxOuterRadius: 8,
    innerRadiusRatio: 0.5,
    points: 5,
    color: "#fff",
    minAlpha: 0.1,
    maxAlpha: 1,
    shadowColor: "#fff",
    minShadowBlur: 0,
    maxShadowBlur: 8,
    densityDecay: 1.5,
    minSpeed: 5,
    maxSpeed: 10,
    speedVariation: 1,
});
```

Property changes are applied safely at runtime. Sprite-related changes redraw
the internal sprite map. Star distribution and motion changes recreate the star
data.

---

## 📂 Project Structure

```bash
src/
    index.ts
    Starfield.ts
```

---

## 🛠️ Build

Build the library:

```bash
npm run build
```

---

## 📝 License

MIT License

---

## 🔗 Links

- npm: https://www.npmjs.com/package/@crisvsgame/starfield
- Source Code: https://github.com/CRISvsGAME/starfield
- Demo: https://crisvsgame.github.io/starfield/

The demo randomises the starfield on each visit, so every refresh shows a slightly different version.
