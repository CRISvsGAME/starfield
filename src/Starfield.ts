export class Starfield {
    private cvs: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dpr: number = window.devicePixelRatio || 1;
    private rob: ResizeObserver;
    private width: number = 0;
    private height: number = 0;

    constructor(cvs: HTMLCanvasElement) {
        const ctx = cvs.getContext("2d");

        if (!ctx) throw new Error("Failed to get 2D context");

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

    private drawStar = (): void => {
        const ctx = this.ctx;
        const centerX = 100;
        const centerY = 100;
        const outerRadius = 50;
        const innerRadius = 25;
        const points = 5;

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

    public destroy = (): void => {
        this.rob.disconnect();
    };
}
