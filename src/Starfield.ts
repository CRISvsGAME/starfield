export class Starfield {
    private cvs: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dpr: number = window.devicePixelRatio || 1;

    constructor(cvs: HTMLCanvasElement) {
        const ctx = cvs.getContext("2d");

        if (!ctx) throw new Error("Failed to get 2D context");

        this.cvs = cvs;
        this.ctx = ctx;

        this.resize();

        window.addEventListener("resize", this.resize);
    }

    private resize = (): void => {
        const dpr = window.devicePixelRatio || 1;
        const bcr = this.cvs.getBoundingClientRect();

        this.dpr = dpr;
        this.cvs.width = bcr.width * dpr;
        this.cvs.height = bcr.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    public destroy = (): void => {
        window.removeEventListener("resize", this.resize);
    };
}
