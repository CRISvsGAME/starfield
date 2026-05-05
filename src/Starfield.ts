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
};

export class Starfield {
    private cvs: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dpr: number = window.devicePixelRatio || 1;
    private rob: ResizeObserver;
    private width: number = 0;
    private height: number = 0;
    private spriteMap: HTMLCanvasElement | null = null;

    constructor(cvs: HTMLCanvasElement) {
        const ctx = cvs.getContext("2d");

        if (!ctx) throw new Error("Failed to get canvas context");

        this.createSpriteMap();

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

        if (this.dpr === dpr && this.width === width && this.height === height) return;

        this.dpr = dpr;
        this.width = width;
        this.height = height;

        this.cvs.width = Math.round(width * dpr);
        this.cvs.height = Math.round(height * dpr);

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
        const { sprites = 1, spriteWidth = 100, spriteHeight = 100 } = options;
        const spriteMap = document.createElement("canvas");
        const ctx = spriteMap.getContext("2d");

        if (!ctx) throw new Error("Failed to get sprite context");

        spriteMap.width = sprites * spriteWidth;
        spriteMap.height = spriteHeight;

        for (let i = 0; i < sprites; i++) {
            const centerX = i * spriteWidth + spriteWidth / 2;
            const centerY = spriteHeight / 2;
            const outerRadius = spriteWidth / 2;
            const innerRadius = spriteWidth / 4;

            this.drawStar({ ctx, centerX, centerY, outerRadius, innerRadius });
        }

        this.spriteMap = spriteMap;
    };

    public destroy = (): void => {
        this.rob.disconnect();
    };
}
