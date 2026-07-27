import { Cadence } from "@crisvsgame/cadence";
import type { CadenceFrameCallback } from "@crisvsgame/cadence";

let defaultCadence: Cadence | null = null;
let defaultCadenceSubscribers: number = 0;

function acquireDefaultCadence(): Cadence {
    defaultCadence ??= new Cadence();

    return defaultCadence;
}

export class StarfieldCadence {
    #callback: CadenceFrameCallback;
    #cadence: Cadence;
    #usesDefaultCadence: boolean;

    public constructor(callback: CadenceFrameCallback, cadence?: Cadence) {
        this.#callback = callback;
        this.#cadence = cadence ?? acquireDefaultCadence();
        this.#usesDefaultCadence = cadence === undefined;
    }

    public subscribe(): void {
        const cadence = this.#cadence;

        cadence.subscribe(this.#callback);

        if (!this.#usesDefaultCadence) {
            return;
        }

        defaultCadenceSubscribers++;

        if (defaultCadenceSubscribers === 1) {
            cadence.start();
        }
    }

    public unsubscribe(): void {
        const cadence = this.#cadence;

        cadence.unsubscribe(this.#callback);

        if (!this.#usesDefaultCadence) {
            return;
        }

        defaultCadenceSubscribers--;

        if (defaultCadenceSubscribers === 0) {
            cadence.pause();
        }
    }
}
