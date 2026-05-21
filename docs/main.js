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

const backgroundRgb = randomRgb();
const backgroundColor = rgbToCss(backgroundRgb);

document.body.style.backgroundColor = backgroundColor;

const starfield = new Starfield(cvs);
starfield.start();
