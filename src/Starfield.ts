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

    public destroy = (): void => {
        this.rob.disconnect();
    };
}
