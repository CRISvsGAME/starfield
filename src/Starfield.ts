export class Starfield {
    private cvs: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(cvs: HTMLCanvasElement) {
        this.cvs = cvs;
        this.ctx = cvs.getContext("2d")!;

        if (!this.ctx) {
            throw new Error("Failed to get 2D context");
        }
    }
}
