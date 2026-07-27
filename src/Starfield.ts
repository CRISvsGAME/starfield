import { StarfieldState } from "./StarfieldState.js";
import { StarfieldCadence } from "./StarfieldCadence.js";
import { Cadence } from "@crisvsgame/cadence";
import type { CadenceFrame } from "@crisvsgame/cadence";

export type StarfieldOptions = {
    stars: number;
    sprites: number;
    spriteWidth: number;
    spriteHeight: number;
    minOuterRadius: number;
    maxOuterRadius: number;
    innerRadiusRatio: number;
    points: number;
    color: string;
    minAlpha: number;
    maxAlpha: number;
    shadowColor: string;
    minShadowBlur: number;
    maxShadowBlur: number;
    densityDecay: number;
    minSpeed: number;
    maxSpeed: number;
    speedVariation: number;
    onFrame?: OnFrameCallback;
};

export type StarfieldFrame = {
    time: number;
    deltaTime: number;
    elapsedTime: number;
};

export type OnFrameCallback = (frame: StarfieldFrame) => void;

type StarOptions = {
    ctx?: CanvasRenderingContext2D;
    centerX: number;
    centerY: number;
    outerRadius: number;
    innerRadius: number;
    color: string;
    alpha: number;
    shadowColor: string;
    shadowBlur: number;
};

type Sprite = {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
};

type Star = {
    spriteIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    vx: number;
    vy: number;
};

const MAX_DELTA_TIME = 50;

const defaultStarfieldOptions: StarfieldOptions = {
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
};

export class Starfield {
    #state: StarfieldState = StarfieldState.STOPPED;
    #starfieldCadence: StarfieldCadence;

    #onAnimationFrame = (_frame: CadenceFrame): void => {};

    public constructor(cadence?: Cadence) {
        this.#starfieldCadence = new StarfieldCadence(this.#onAnimationFrame, cadence);
    }

    public get state(): StarfieldState {
        return this.#state;
    }

    public stop(): void {
        const state = this.#state;

        if (state !== StarfieldState.RUNNING && state !== StarfieldState.PAUSED) {
            return;
        }

        if (state === StarfieldState.RUNNING) {
            this.#starfieldCadence.unsubscribe();
        }

        this.#state = StarfieldState.STOPPED;
    }

    public start(): void {
        const state = this.#state;

        if (state === StarfieldState.DESTROYED) {
            throw new Error("Starfield: Cannot start a destroyed instance.");
        }

        if (state === StarfieldState.RUNNING) {
            return;
        }

        this.#starfieldCadence.subscribe();
        this.#state = StarfieldState.RUNNING;
    }

    public pause(): void {
        if (this.#state !== StarfieldState.RUNNING) {
            return;
        }

        this.#starfieldCadence.unsubscribe();
        this.#state = StarfieldState.PAUSED;
    }

    public destroy(): void {
        if (this.#state === StarfieldState.DESTROYED) {
            return;
        }

        if (this.#state === StarfieldState.RUNNING) {
            this.#starfieldCadence.unsubscribe();
        }

        this.#state = StarfieldState.DESTROYED;
    }
}

export class StarfieldBack {
    private options: StarfieldOptions;
    private mainCvs: HTMLCanvasElement;
    private mainCtx: CanvasRenderingContext2D;
    private spriteCvs: HTMLCanvasElement;
    private spriteCtx: CanvasRenderingContext2D;
    private rob: ResizeObserver;
    private dpr: number = 0;
    private width: number = 0;
    private height: number = 0;
    private frameId: number | null = null;
    private frameTime: number | null = null;
    private state: StarfieldState = StarfieldState.STOPPED;
    private sprites: Sprite[] = [];
    private stars: Star[] = [];
    private elapsedTime: number = 0;

    constructor(cvs: HTMLCanvasElement, options: Partial<StarfieldOptions> = {}) {
        const mainCtx = cvs.getContext("2d");
        const spriteCvs = document.createElement("canvas");
        const spriteCtx = spriteCvs.getContext("2d");

        if (!mainCtx) throw new Error("Failed to get canvas context");
        if (!spriteCtx) throw new Error("Failed to get sprite context");

        const o = { ...defaultStarfieldOptions, ...options };
        this.validateOptions(o);

        this.options = o;
        this.mainCvs = cvs;
        this.mainCtx = mainCtx;
        this.spriteCvs = spriteCvs;
        this.spriteCtx = spriteCtx;
        this.rob = new ResizeObserver(this.resize);

        this.rob.observe(cvs);
        this.resize();

        document.addEventListener("visibilitychange", this.visibilityChange);
    }

    private resize = (): void => {
        const mainCvs = this.mainCvs;
        const dpr = window.devicePixelRatio || 1;
        const bcr = mainCvs.getBoundingClientRect();
        const width = bcr.width;
        const height = bcr.height;

        if (width <= 0 || height <= 0) return;

        const dprChanged = this.dpr !== dpr;
        const sizeChanged = this.width !== width || this.height !== height;

        if (!dprChanged && !sizeChanged) return;

        this.dpr = dpr;
        this.width = width;
        this.height = height;

        mainCvs.width = Math.round(width * dpr);
        mainCvs.height = Math.round(height * dpr);

        this.mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (dprChanged) {
            this.createSpriteMap();
        }

        this.createStars();

        if (this.state === StarfieldState.PAUSED) {
            this.clear();
            this.renderStars(0);
        }
    };

    private visibilityChange = (): void => {
        this.frameTime = null;
    };

    private clear = (): void => {
        this.mainCtx.clearRect(0, 0, this.width + 1, this.height + 1);
    };

    private drawStar = (options: StarOptions): void => {
        const { centerX, centerY, outerRadius, innerRadius, color, alpha, shadowColor, shadowBlur } = options;
        const ctx = options.ctx ?? this.mainCtx;
        const points = this.options.points;
        const max = points * 2;
        const step = Math.PI / points;
        const startAngle = -Math.PI / 2;

        ctx.save();

        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.beginPath();

        for (let i = 0; i < max; i++) {
            const angle = startAngle + i * step;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    private createSpriteMap = (): void => {
        const { sprites, spriteWidth, spriteHeight, minOuterRadius, maxOuterRadius, innerRadiusRatio, color, minAlpha, maxAlpha, shadowColor, minShadowBlur, maxShadowBlur } = this.options;
        const spriteCvs = this.spriteCvs;
        const spriteCtx = this.spriteCtx;
        const dpr = this.dpr;
        const spritesMinusOne = sprites - 1;
        const tStep = sprites === 1 ? 0 : 1 / spritesMinusOne;
        const halfSpriteWidth = spriteWidth / 2;
        const halfSpriteHeight = spriteHeight / 2;
        const radiusRange = maxOuterRadius - minOuterRadius;
        const alphaRange = maxAlpha - minAlpha;
        const blurRange = maxShadowBlur - minShadowBlur;
        const spriteWidthDpr = spriteWidth * dpr;
        const spriteHeightDpr = spriteHeight * dpr;
        const spritesList: Sprite[] = [];

        spriteCvs.width = Math.ceil(spriteWidthDpr * sprites);
        spriteCvs.height = Math.ceil(spriteHeightDpr);

        spriteCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        for (let i = 0; i < sprites; i++) {
            const t = i * tStep;
            const centerX = i * spriteWidth + halfSpriteWidth;
            const centerY = halfSpriteHeight;
            const outerRadius = minOuterRadius + t * radiusRange;
            const innerRadius = outerRadius * innerRadiusRatio;
            const alpha = minAlpha + t * alphaRange;
            const shadowBlur = minShadowBlur + t * blurRange;

            this.drawStar({ ctx: spriteCtx, centerX, centerY, outerRadius, innerRadius, color, alpha, shadowColor, shadowBlur });

            spritesList[i] = {
                sx: i * spriteWidthDpr,
                sy: 0,
                sw: spriteWidthDpr,
                sh: spriteHeightDpr,
            };
        }

        this.sprites = spritesList;
    };

    private createStars = (): void => {
        const { stars, sprites, spriteWidth, spriteHeight, densityDecay, minSpeed, maxSpeed, speedVariation } = this.options;
        const width = this.width;
        const height = this.height;
        const area = width * height;
        const totalStars = (stars * area) / 1000000;
        const spritesMinusOne = sprites - 1;
        const tStep = sprites === 1 ? 0 : 1 / spritesMinusOne;
        const speedRange = maxSpeed - minSpeed;
        const spawnX = width + spriteWidth;
        const spawnY = height + spriteHeight;
        const doublePi = 2 * Math.PI;
        const starsList: Star[] = [];
        const weights: number[] = [];

        let totalWeight = 0;

        for (let i = 0; i < sprites; i++) {
            const weight = densityDecay ** (spritesMinusOne - i);
            weights[i] = weight;
            totalWeight += weight;
        }

        for (let spriteIndex = 0; spriteIndex < sprites; spriteIndex++) {
            const weight = weights[spriteIndex]!;
            const count = Math.ceil((weight / totalWeight) * totalStars);
            const t = spriteIndex * tStep;
            const baseSpeed = minSpeed + t * speedRange;
            const speedMin = baseSpeed * (1 - speedVariation);
            const speedMax = baseSpeed * (1 + speedVariation);
            const speedRangeForIndex = speedMax - speedMin;

            for (let i = 0; i < count; i++) {
                const x = Math.random() * spawnX - spriteWidth;
                const y = Math.random() * spawnY - spriteHeight;
                const angle = Math.random() * doublePi;
                const speed = speedMin + Math.random() * speedRangeForIndex;
                const vx = speed * Math.cos(angle);
                const vy = speed * Math.sin(angle);

                starsList.push({ spriteIndex, x, y, width: spriteWidth, height: spriteHeight, vx, vy });
            }
        }

        this.stars = starsList;
    };

    private renderStars = (deltaTime: number): void => {
        const mainCtx = this.mainCtx;
        const spriteCvs = this.spriteCvs;
        const stars = this.stars;
        const sprites = this.sprites;
        const canvasWidth = this.width;
        const canvasHeight = this.height;
        const length = stars.length;
        const delta = deltaTime / 1000;

        for (let i = 0; i < length; i++) {
            const star = stars[i]!;
            const { spriteIndex, x, y, width, height, vx, vy } = star;
            const sprite = sprites[spriteIndex]!;

            mainCtx.drawImage(spriteCvs, sprite.sx, sprite.sy, sprite.sw, sprite.sh, x, y, width, height);

            let starX = x + vx * delta;
            let starY = y + vy * delta;

            if (starX < -width) starX = canvasWidth;
            else if (starX > canvasWidth) starX = -width;
            if (starY < -height) starY = canvasHeight;
            else if (starY > canvasHeight) starY = -height;

            star.x = starX;
            star.y = starY;
        }
    };

    private animate = (time: number): void => {
        if (this.state !== StarfieldState.RUNNING) {
            this.frameId = null;
            this.frameTime = null;
            return;
        }

        const frameTime = this.frameTime ?? time;
        const deltaTime = Math.min(time - frameTime, MAX_DELTA_TIME);
        const onFrame = this.options.onFrame;

        this.elapsedTime += deltaTime;

        if (onFrame) {
            onFrame({ time, deltaTime, elapsedTime: this.elapsedTime });
        }

        this.clear();
        this.renderStars(deltaTime);

        this.frameTime = time;
        this.frameId = requestAnimationFrame(this.animate);
    };

    public start = (): void => {
        if (this.state === StarfieldState.RUNNING) return;

        this.state = StarfieldState.RUNNING;
        this.frameTime = null;
        this.frameId = requestAnimationFrame(this.animate);
    };

    public pause = (): void => {
        if (this.state !== StarfieldState.RUNNING) return;

        this.state = StarfieldState.PAUSED;
        this.frameTime = null;

        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    };

    public reset = (): void => {
        this.createStars();

        if (this.state !== StarfieldState.RUNNING) {
            this.state = StarfieldState.PAUSED;
            this.clear();
            this.renderStars(0);
        }
    };

    public stop = (): void => {
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }

        this.state = StarfieldState.STOPPED;
        this.frameTime = null;
        this.clear();
    };

    public setProperties = (properties: Partial<StarfieldOptions>): void => {
        const c = this.options;
        const p = properties;
        const n = { ...c, ...p };

        this.validateOptions(n);

        const spritesChanged = (p.sprites !== undefined && p.sprites !== c.sprites) || (p.spriteWidth !== undefined && p.spriteWidth !== c.spriteWidth) || (p.spriteHeight !== undefined && p.spriteHeight !== c.spriteHeight);

        const bitmapChanged = spritesChanged || (p.minOuterRadius !== undefined && p.minOuterRadius !== c.minOuterRadius) || (p.maxOuterRadius !== undefined && p.maxOuterRadius !== c.maxOuterRadius) || (p.innerRadiusRatio !== undefined && p.innerRadiusRatio !== c.innerRadiusRatio) || (p.points !== undefined && p.points !== c.points) || (p.color !== undefined && p.color !== c.color) || (p.minAlpha !== undefined && p.minAlpha !== c.minAlpha) || (p.maxAlpha !== undefined && p.maxAlpha !== c.maxAlpha) || (p.shadowColor !== undefined && p.shadowColor !== c.shadowColor) || (p.minShadowBlur !== undefined && p.minShadowBlur !== c.minShadowBlur) || (p.maxShadowBlur !== undefined && p.maxShadowBlur !== c.maxShadowBlur);

        const starsChanged = spritesChanged || (p.stars !== undefined && p.stars !== c.stars) || (p.densityDecay !== undefined && p.densityDecay !== c.densityDecay) || (p.minSpeed !== undefined && p.minSpeed !== c.minSpeed) || (p.maxSpeed !== undefined && p.maxSpeed !== c.maxSpeed) || (p.speedVariation !== undefined && p.speedVariation !== c.speedVariation);

        if (!bitmapChanged && !starsChanged) return;

        this.options = n;

        if (bitmapChanged) {
            this.createSpriteMap();
        }

        if (starsChanged) {
            this.createStars();
        }

        if (this.state === StarfieldState.PAUSED) {
            this.clear();
            this.renderStars(0);
        }
    };

    public destroy = (): void => {
        this.stop();
        this.rob.disconnect();
        this.sprites = [];
        this.stars = [];

        document.removeEventListener("visibilitychange", this.visibilityChange);
    };

    private validateOptions(options: StarfieldOptions): void {
        const o = options;

        if (!Number.isInteger(o.stars)) throw new Error("Stars must be an integer");
        if (!Number.isInteger(o.sprites)) throw new Error("Sprites must be an integer");
        if (!Number.isInteger(o.spriteWidth)) throw new Error("Sprite width must be an integer");
        if (!Number.isInteger(o.spriteHeight)) throw new Error("Sprite height must be an integer");
        if (!Number.isInteger(o.points)) throw new Error("Points must be an integer");
        if (!Number.isFinite(o.minOuterRadius)) throw new Error("Min outer radius must be a number");
        if (!Number.isFinite(o.maxOuterRadius)) throw new Error("Max outer radius must be a number");
        if (!Number.isFinite(o.innerRadiusRatio)) throw new Error("Inner radius ratio must be a number");
        if (!Number.isFinite(o.minAlpha)) throw new Error("Min alpha must be a number");
        if (!Number.isFinite(o.maxAlpha)) throw new Error("Max alpha must be a number");
        if (!Number.isFinite(o.minShadowBlur)) throw new Error("Min shadow blur must be a number");
        if (!Number.isFinite(o.maxShadowBlur)) throw new Error("Max shadow blur must be a number");
        if (!Number.isFinite(o.densityDecay)) throw new Error("Density decay must be a number");
        if (!Number.isFinite(o.minSpeed)) throw new Error("Min speed must be a number");
        if (!Number.isFinite(o.maxSpeed)) throw new Error("Max speed must be a number");
        if (!Number.isFinite(o.speedVariation)) throw new Error("Speed variation must be a number");
        if (o.stars < 1) throw new Error("Stars must be greater than 0");
        if (o.sprites < 1) throw new Error("Sprites must be greater than 0");
        if (o.spriteWidth < 1) throw new Error("Sprite width must be greater than 0");
        if (o.spriteHeight < 1) throw new Error("Sprite height must be greater than 0");
        if (o.minOuterRadius < 1) throw new Error("Min outer radius must be greater than 0");
        if (o.maxOuterRadius < 1) throw new Error("Max outer radius must be greater than 0");
        if (o.minOuterRadius > o.maxOuterRadius) throw new Error("Min outer radius must be less than or equal to max outer radius");
        if (o.innerRadiusRatio < 0 || o.innerRadiusRatio > 1) throw new Error("Inner radius ratio must be between 0 and 1");
        if (o.points < 3) throw new Error("Points must be greater than or equal to 3");
        if (o.minAlpha < 0 || o.minAlpha > 1) throw new Error("Min alpha must be between 0 and 1");
        if (o.maxAlpha < 0 || o.maxAlpha > 1) throw new Error("Max alpha must be between 0 and 1");
        if (o.minAlpha > o.maxAlpha) throw new Error("Min alpha must be less than or equal to max alpha");
        if (o.minShadowBlur < 0) throw new Error("Min shadow blur must be greater than or equal to 0");
        if (o.maxShadowBlur < 0) throw new Error("Max shadow blur must be greater than or equal to 0");
        if (o.minShadowBlur > o.maxShadowBlur) throw new Error("Min shadow blur must be less than or equal to max shadow blur");
        if (o.densityDecay < 0) throw new Error("Density decay must be greater than or equal to 0");
        if (o.minSpeed < 0) throw new Error("Min speed must be greater than or equal to 0");
        if (o.maxSpeed < 0) throw new Error("Max speed must be greater than or equal to 0");
        if (o.minSpeed > o.maxSpeed) throw new Error("Min speed must be less than or equal to max speed");
        if (o.speedVariation < 0 || o.speedVariation > 1) throw new Error("Speed variation must be between 0 and 1");
        if (typeof o.color !== "string" || o.color.length === 0) throw new Error("Color must be a non-empty string");
        if (typeof o.shadowColor !== "string" || o.shadowColor.length === 0) throw new Error("Shadow color must be a non-empty string");
        if (o.onFrame !== undefined && typeof o.onFrame !== "function") throw new Error("onFrame must be a function");
    }
}
