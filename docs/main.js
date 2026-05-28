import { Starfield } from "https://cdn.jsdelivr.net/npm/@crisvsgame/starfield@1.1.0/dist/index.min.js";

const cvs = document.getElementById("starfield");

if (!(cvs instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element not found");
}

const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const randomFloat = (min, max) => {
    return Math.random() * (max - min) + min;
};

const randomRgb = () => {
    return {
        r: randomInt(0, 255),
        g: randomInt(0, 255),
        b: randomInt(0, 255),
    };
};

const rgbToCss = ({ r, g, b }) => {
    return `rgb(${r}, ${g}, ${b})`;
};

const rgbToLinear = (channel) => {
    const normalized = channel / 255;

    return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
};

const relativeLuminance = ({ r, g, b }) => {
    return 0.2126 * rgbToLinear(r) + 0.7152 * rgbToLinear(g) + 0.0722 * rgbToLinear(b);
};

const isDarkColor = (luminance) => {
    return luminance < 0.5;
};

const contrastRgb = (isDark) => {
    return isDark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
};

const backgroundRgb = randomRgb();
const backgroundColor = rgbToCss(backgroundRgb);
const backgroundLuminance = relativeLuminance(backgroundRgb);
const backgroundIsDark = isDarkColor(backgroundLuminance);
const starRgb = contrastRgb(backgroundIsDark);
const starColor = rgbToCss(starRgb);
const shadowRgb = contrastRgb(!backgroundIsDark);
const shadowColor = rgbToCss(shadowRgb);

document.body.style.backgroundColor = backgroundColor;
document.body.style.color = starColor;
document.body.style.textShadow = `
    0 0 4px ${shadowColor},
    0 0 8px ${shadowColor},
    0 0 16px ${shadowColor},
    0 0 32px ${shadowColor}
`;

const randomStarfieldOptions = () => {
    const maxSpriteMap = 8192;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const size = randomInt(2, 32) * 8;
    const maxSprites = Math.max(2, Math.floor(maxSpriteMap / (size * dpr)));
    const sprites = randomInt(2, Math.min(32, maxSprites));
    const radius = size / 4;
    const alpha = randomFloat(0.8, 1);
    const shadow = radius * 0.8;
    const speed = randomInt(10, 1000);

    return {
        stars: randomInt(2, 1000),
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
        shadowColor: starColor,
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
