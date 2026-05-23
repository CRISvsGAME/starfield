import { Starfield } from "https://cdn.jsdelivr.net/npm/@crisvsgame/starfield@1.0.0/dist/index.js";

const cvs = document.getElementById("starfield");

if (!(cvs instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element not found");
}

const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
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

const constrastRgb = (isDark) => {
    return isDark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
};

const backgroundRgb = randomRgb();
const backgroundColor = rgbToCss(backgroundRgb);
const backgroundLuminance = relativeLuminance(backgroundRgb);
const backgroundIsDark = isDarkColor(backgroundLuminance);
const starRgb = constrastRgb(backgroundIsDark);
const starColor = rgbToCss(starRgb);

document.body.style.backgroundColor = backgroundColor;
document.body.style.color = starColor;

const starfield = new Starfield(cvs, {
    color: starColor,
    shadowColor: starColor,
});
starfield.start();
