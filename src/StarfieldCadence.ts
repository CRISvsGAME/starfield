import { Cadence } from "@crisvsgame/cadence";

let defaultCadence: Cadence | null = null;

function acquireDefaultCadence(): Cadence {
    defaultCadence ??= new Cadence();

    return defaultCadence;
}

export class StarfieldCadence {
    #cadence: Cadence;

    public constructor(cadence?: Cadence) {
        this.#cadence = cadence ?? acquireDefaultCadence();
    }
}
