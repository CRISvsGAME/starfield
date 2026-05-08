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
};

type StarOptions = {
    ctx?: CanvasRenderingContext2D;
    centerX: number;
    centerY: number;
    outerRadius: number;
    innerRadius: number;
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
};

export class Starfield {
    private options: StarfieldOptions;
    private mainCvs: HTMLCanvasElement;
    private mainCtx: CanvasRenderingContext2D;
    private spriteCvs: HTMLCanvasElement | null = null;
    private rob: ResizeObserver;
    private dpr: number = 0;
    private width: number = 0;
    private height: number = 0;
    private sprites: Sprite[] = [];
    private stars: Star[] = [];

    constructor(cvs: HTMLCanvasElement, options: Partial<StarfieldOptions> = {}) {
        const ctx = cvs.getContext("2d");

        if (!ctx) throw new Error("Failed to get canvas context");

        const o = { ...defaultStarfieldOptions, ...options };

        if (!Number.isInteger(o.stars)) throw new Error("Stars must be an integer");
        if (!Number.isInteger(o.sprites)) throw new Error("Sprites must be an integer");
        if (!Number.isInteger(o.spriteWidth)) throw new Error("Sprite width must be an integer");
        if (!Number.isInteger(o.spriteHeight)) throw new Error("Sprite height must be an integer");
        if (!Number.isInteger(o.points)) throw new Error("Points must be an integer");
        if (!Number.isFinite(o.minOuterRadius)) throw new Error("Min outer radius must be a number");
        if (!Number.isFinite(o.maxOuterRadius)) throw new Error("Max outer radius must be a number");
        if (!Number.isFinite(o.innerRadiusRatio)) throw new Error("Inner radius ratio must be a number");
        if (o.stars < 1) throw new Error("Stars must be greater than 0");
        if (o.sprites < 1) throw new Error("Sprites must be greater than 0");
        if (o.spriteWidth < 1) throw new Error("Sprite width must be greater than 0");
        if (o.spriteHeight < 1) throw new Error("Sprite height must be greater than 0");
        if (o.minOuterRadius < 1) throw new Error("Min outer radius must be greater than 0");
        if (o.maxOuterRadius < 1) throw new Error("Max outer radius must be greater than 0");
        if (o.minOuterRadius > o.maxOuterRadius) throw new Error("Min outer radius must be less than or equal to max outer radius");
        if (o.innerRadiusRatio < 0 || o.innerRadiusRatio > 1) throw new Error("Inner radius ratio must be between 0 and 1");
        if (o.points < 3) throw new Error("Points must be greater than or equal to 3");

        this.options = o;
        this.mainCvs = cvs;
        this.mainCtx = ctx;
        this.rob = new ResizeObserver(this.resize);

        this.rob.observe(this.mainCvs);
        this.resize();
    }

    private resize = (): void => {
        const dpr = window.devicePixelRatio || 1;
        const bcr = this.mainCvs.getBoundingClientRect();
        const width = bcr.width;
        const height = bcr.height;
        const dprChanged = this.dpr !== dpr;
        const sizeChanged = this.width !== width || this.height !== height;

        if (!dprChanged && !sizeChanged) return;

        this.dpr = dpr;
        this.width = width;
        this.height = height;

        this.mainCvs.width = Math.round(width * dpr);
        this.mainCvs.height = Math.round(height * dpr);

        this.mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (dprChanged) {
            this.createSpriteMap();
        }
    };

    private clear = (): void => {
        this.mainCtx.clearRect(0, 0, this.width + 1, this.height + 1);
    };

    private drawStar = (options: StarOptions): void => {
        const ctx = options.ctx ?? this.mainCtx;
        const { centerX, centerY, outerRadius, innerRadius } = options;

        ctx.beginPath();

        for (let i = 0; i < this.options.points * 2; i++) {
            const angle = -Math.PI / 2 + (i * Math.PI) / this.options.points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
    };

    private createSpriteMap = (): void => {
        const cvs = document.createElement("canvas");
        const ctx = cvs.getContext("2d");

        if (!ctx) throw new Error("Failed to get sprite context");

        const o = this.options;
        const sprites: Sprite[] = [];

        cvs.width = Math.round(o.spriteWidth * o.sprites * this.dpr);
        cvs.height = Math.round(o.spriteHeight * this.dpr);

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.fillStyle = o.color;

        for (let i = 0; i < o.sprites; i++) {
            const t = o.sprites === 1 ? 0 : i / (o.sprites - 1);
            const centerX = i * o.spriteWidth + o.spriteWidth / 2;
            const centerY = o.spriteHeight / 2;
            const outerRadius = o.minOuterRadius + t * (o.maxOuterRadius - o.minOuterRadius);
            const innerRadius = outerRadius * o.innerRadiusRatio;

            this.drawStar({ ctx, centerX, centerY, outerRadius, innerRadius });

            sprites[i] = {
                sx: Math.round(i * o.spriteWidth * this.dpr),
                sy: 0,
                sw: Math.round(o.spriteWidth * this.dpr),
                sh: Math.round(o.spriteHeight * this.dpr),
            };
        }

        this.spriteCvs = cvs;
        this.sprites = sprites;
    };

    private drawSprite = (star: Star): void => {
        if (!this.spriteCvs) return;

        const { spriteIndex, x, y, width, height } = star;
        const s = this.sprites[spriteIndex];

        if (!s) return;

        this.mainCtx.drawImage(this.spriteCvs, s.sx, s.sy, s.sw, s.sh, x, y, width, height);
    };

    public destroy = (): void => {
        this.rob.disconnect();
    };
}
