import { Starfield } from "https://cdn.jsdelivr.net/npm/@crisvsgame/starfield@1.1.0/dist/index.min.js";
import { Chroma } from "https://cdn.jsdelivr.net/npm/@crisvsgame/chroma@1.0.0/dist/index.min.js";

const cvs = document.getElementById("starfield");

if (!(cvs instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element not found");
}

const randomInt = Chroma.randomInt;
const randomFloat = Chroma.randomFloat;

const randomStarfieldOptions = () => {
    const baseColors = Chroma.randomPair();
    const backgroundColor = Chroma.rgbToCss(baseColors.bg);
    const starColor = Chroma.rgbToCss(baseColors.fg);
    const starShadow = Chroma.rgbToCss(Chroma.randomWithContrast(baseColors.fg, { flexible: true }));
    const headColors = Chroma.randomPair();
    const textColor = Chroma.rgbToCss(headColors.fg);
    const textShadow = Chroma.rgbToCss(headColors.bg);

    document.body.style.backgroundColor = backgroundColor;
    document.body.style.color = textColor;
    document.body.style.textShadow = `
        0 0 4px ${textShadow},
        0 0 8px ${textShadow},
        0 0 16px ${textShadow},
        0 0 32px ${textShadow}
    `;

    const maxSpriteMap = 8192;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const size = randomInt(2, 32) * 8;
    const maxSprites = Math.max(2, Math.floor(maxSpriteMap / (size * dpr)));
    const sprites = randomInt(2, Math.min(32, maxSprites));
    const radius = size / 4;
    const alpha = randomFloat(0.8, 1);
    const shadow = radius * 0.8;
    const speed = randomInt(10, 250);

    return {
        stars: randomInt(2, 250),
        sprites: sprites,
        spriteWidth: size,
        spriteHeight: size,
        minOuterRadius: radius / 2,
        maxOuterRadius: radius,
        innerRadiusRatio: randomFloat(0.1, 0.9),
        points: randomInt(3, 32),
        color: starColor,
        minAlpha: alpha / 4,
        maxAlpha: alpha,
        shadowColor: starShadow,
        minShadowBlur: randomFloat(0, shadow / 2),
        maxShadowBlur: shadow,
        densityDecay: randomFloat(1.1, 2.9),
        minSpeed: speed / 4,
        maxSpeed: speed,
        speedVariation: randomFloat(0.1, 1),
    };
};

const starfield = new Starfield(cvs, randomStarfieldOptions());
starfield.start();

setInterval(() => {
    const starfieldOptions = randomStarfieldOptions();
    starfield.setProperties(starfieldOptions);
}, 5_000);
