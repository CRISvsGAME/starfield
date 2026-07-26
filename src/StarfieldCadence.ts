import { Cadence } from "@crisvsgame/cadence";
import type { CadenceFrameCallback } from "@crisvsgame/cadence";

let defaultCadence: Cadence | null = null;

function acquireDefaultCadence(): Cadence {
    defaultCadence ??= new Cadence();

    return defaultCadence;
}

export class StarfieldCadence {
    #callback: CadenceFrameCallback;
    #cadence: Cadence;

    public constructor(callback: CadenceFrameCallback, cadence?: Cadence) {
        this.#callback = callback;
        this.#cadence = cadence ?? acquireDefaultCadence();
    }

    public subscribe(): void {
        this.#cadence.subscribe(this.#callback);
    }

    public unsubscribe(): void {
        this.#cadence.unsubscribe(this.#callback);
    }
}
