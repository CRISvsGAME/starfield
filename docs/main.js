import { Starfield } from "https://cdn.jsdelivr.net/npm/@crisvsgame/starfield@1.0.0/dist/index.js";

const cvs = document.getElementById("starfield");

if (!(cvs instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element not found");
}

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const randomRgb = () => ({
    r: randomInt(0, 255),
    g: randomInt(0, 255),
    b: randomInt(0, 255),
});

const rgbToCss = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;

const rgbToLinear = (channel) => {
    const normalized = channel / 255;

    return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
};

const relativeLuminance = ({ r, g, b }) => {
    return 0.2126 * rgbToLinear(r) + 0.7152 * rgbToLinear(g) + 0.0722 * rgbToLinear(b);
};

const backgroundRgb = randomRgb();
const backgroundColor = rgbToCss(backgroundRgb);

document.body.style.backgroundColor = backgroundColor;

const starfield = new Starfield(cvs);
starfield.start();
