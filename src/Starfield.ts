type StarOptions = {
    ctx?: CanvasRenderingContext2D;
    centerX?: number;
    centerY?: number;
    outerRadius?: number;
    innerRadius?: number;
    points?: number;
};

type SpriteMapOptions = {
    sprites?: number;
    spriteWidth?: number;
    spriteHeight?: number;
    minOuterRadius?: number;
    maxOuterRadius?: number;
    innerRadiusRatio?: number;
};

type SpriteRect = {
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
    speed: number;
};

export class Starfield {
    private cvs: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dpr: number = 0;
    private rob: ResizeObserver;
    private width: number = 0;
    private height: number = 0;
    private spriteMap: HTMLCanvasElement | null = null;
    private spriteRects: SpriteRect[] = [];
    private stars: Star[] = [];

    constructor(cvs: HTMLCanvasElement) {
        const ctx = cvs.getContext("2d");

        if (!ctx) throw new Error("Failed to get canvas context");

        this.cvs = cvs;
        this.ctx = ctx;
        this.rob = new ResizeObserver(this.resize);

        this.rob.observe(this.cvs);
        this.resize();
    }

    private resize = (): void => {
        const dpr = window.devicePixelRatio || 1;
        const bcr = this.cvs.getBoundingClientRect();
        const width = bcr.width;
        const height = bcr.height;
        const dprChanged = this.dpr !== dpr;
        const sizeChanged = this.width !== width || this.height !== height;

        if (!dprChanged && !sizeChanged) return;

        this.dpr = dpr;
        this.width = width;
        this.height = height;

        this.cvs.width = Math.round(width * dpr);
        this.cvs.height = Math.round(height * dpr);

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (dprChanged) {
            this.createSpriteMap();
        }
    };

    private clear = (): void => {
        this.ctx.clearRect(0, 0, this.width + 1, this.height + 1);
    };

    private drawStar = (options: StarOptions = {}): void => {
        const { ctx = this.ctx, centerX = 50, centerY = 50, outerRadius = 50, innerRadius = 25, points = 5 } = options;

        ctx.beginPath();

        for (let i = 0; i < points * 2; i++) {
            const angle = -Math.PI / 2 + (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
    };

    private createSpriteMap = (options: SpriteMapOptions = {}): void => {
        const { sprites = 8, spriteWidth = 32, spriteHeight = 32, minOuterRadius = 4, maxOuterRadius = 8, innerRadiusRatio = 0.5 } = options;
        const spriteMap = document.createElement("canvas");
        const ctx = spriteMap.getContext("2d");

        if (!ctx) throw new Error("Failed to get sprite context");

        spriteMap.width = Math.round(sprites * spriteWidth * this.dpr);
        spriteMap.height = Math.round(spriteHeight * this.dpr);

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        this.spriteRects = [];

        for (let i = 0; i < sprites; i++) {
            const t = sprites === 1 ? 0 : i / (sprites - 1);
            const centerX = i * spriteWidth + spriteWidth / 2;
            const centerY = spriteHeight / 2;
            const outerRadius = minOuterRadius + t * (maxOuterRadius - minOuterRadius);
            const innerRadius = outerRadius * innerRadiusRatio;

            this.drawStar({ ctx, centerX, centerY, outerRadius, innerRadius });

            this.spriteRects[i] = {
                sx: Math.round(i * spriteWidth * this.dpr),
                sy: 0,
                sw: Math.round(spriteWidth * this.dpr),
                sh: Math.round(spriteHeight * this.dpr),
            };
        }

        this.spriteMap = spriteMap;
    };

    private drawSprite = (star: Star): void => {
        if (!this.spriteMap) return;

        const { spriteIndex, x, y, width, height } = star;
        const spriteRect = this.spriteRects[spriteIndex];

        if (!spriteRect) return;

        this.ctx.drawImage(this.spriteMap, spriteRect.sx, spriteRect.sy, spriteRect.sw, spriteRect.sh, x, y, width, height);
    };

    public destroy = (): void => {
        this.rob.disconnect();
    };
}
