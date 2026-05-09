type StarfieldOptions = {
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
};

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

const defaultStarfieldOptions: StarfieldOptions = {
    stars: 1000,
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
};

export class Starfield {
    private options: StarfieldOptions;
    private mainCvs: HTMLCanvasElement;
    private mainCtx: CanvasRenderingContext2D;
    private spriteCvs: HTMLCanvasElement;
    private spriteCtx: CanvasRenderingContext2D;
    private rob: ResizeObserver;
    private dpr: number = 0;
    private width: number = 0;
    private height: number = 0;
    private sprites: Sprite[] = [];
    private stars: Star[] = [];

    constructor(cvs: HTMLCanvasElement, options: Partial<StarfieldOptions> = {}) {
        const mainCtx = cvs.getContext("2d");
        const spriteCvs = document.createElement("canvas");
        const spriteCtx = spriteCvs.getContext("2d");

        if (!mainCtx) throw new Error("Failed to get canvas context");
        if (!spriteCtx) throw new Error("Failed to get sprite context");

        const o = { ...defaultStarfieldOptions, ...options };

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

        this.options = o;
        this.mainCvs = cvs;
        this.mainCtx = mainCtx;
        this.spriteCvs = spriteCvs;
        this.spriteCtx = spriteCtx;
        this.rob = new ResizeObserver(this.resize);

        this.rob.observe(this.mainCvs);
        this.resize();
    }

    private resize = (): void => {
        const mainCvs = this.mainCvs;
        const dpr = window.devicePixelRatio || 1;
        const bcr = mainCvs.getBoundingClientRect();
        const width = bcr.width;
        const height = bcr.height;
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
        const spriteWidthDpr = Math.round(spriteWidth * dpr);
        const spriteHeightDpr = Math.round(spriteHeight * dpr);
        const spritesList: Sprite[] = [];

        spriteCvs.width = spriteWidthDpr * sprites;
        spriteCvs.height = spriteHeightDpr;

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

    private drawSprite = (star: Star): void => {
        const { spriteIndex, x, y, width, height } = star;
        const s = this.sprites[spriteIndex]!;

        this.mainCtx.drawImage(this.spriteCvs, s.sx, s.sy, s.sw, s.sh, x, y, width, height);
    };

    public destroy = (): void => {
        this.rob.disconnect();
    };
}
