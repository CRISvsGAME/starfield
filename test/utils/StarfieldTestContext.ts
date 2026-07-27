import { expect, vi } from "vitest";
import { Starfield } from "../../src/Starfield.js";
import { Cadence } from "@crisvsgame/cadence";

export type CadenceLifecycleSpies = {
    stopSpy: ReturnType<typeof vi.spyOn>;
    startSpy: ReturnType<typeof vi.spyOn>;
    pauseSpy: ReturnType<typeof vi.spyOn>;
    destroySpy: ReturnType<typeof vi.spyOn>;
};

type CadenceSubscriptionSpies = {
    subscribeSpy: ReturnType<typeof vi.spyOn>;
    unsubscribeSpy: ReturnType<typeof vi.spyOn>;
};

const starfields: Starfield[] = [];

export function trackStarfield(starfield: Starfield): Starfield {
    starfields.push(starfield);

    return starfield;
}

export function createDefaultStarfield(): Starfield {
    const starfield = new Starfield();

    trackStarfield(starfield);

    return starfield;
}

export function createExternalStarfield(): Starfield {
    const starfield = new Starfield(new Cadence());

    trackStarfield(starfield);

    return starfield;
}

export function destroyStarfields(): void {
    for (const starfield of starfields) {
        starfield.destroy();
    }

    starfields.length = 0;
}

export function cadenceLifecycleSpies(): {
    starfield: Starfield;
    spies: CadenceLifecycleSpies;
} {
    const cadence = new Cadence();

    const stopSpy = vi.spyOn(cadence, "stop");
    const startSpy = vi.spyOn(cadence, "start");
    const pauseSpy = vi.spyOn(cadence, "pause");
    const destroySpy = vi.spyOn(cadence, "destroy");

    const starfield = new Starfield(cadence);

    trackStarfield(starfield);

    return { starfield, spies: { stopSpy, startSpy, pauseSpy, destroySpy } };
}

export function cadenceSubscriptionSpies(): {
    starfield: Starfield;
    spies: CadenceSubscriptionSpies;
} {
    const cadence = new Cadence();

    const subscribeSpy = vi.spyOn(cadence, "subscribe");
    const unsubscribeSpy = vi.spyOn(cadence, "unsubscribe");

    const starfield = new Starfield(cadence);

    trackStarfield(starfield);

    return { starfield, spies: { subscribeSpy, unsubscribeSpy } };
}

export function cadencePrototypeLifecycleSpies(): CadenceLifecycleSpies {
    const stopSpy = vi.spyOn(Cadence.prototype, "stop");
    const startSpy = vi.spyOn(Cadence.prototype, "start");
    const pauseSpy = vi.spyOn(Cadence.prototype, "pause");
    const destroySpy = vi.spyOn(Cadence.prototype, "destroy");

    return { stopSpy, startSpy, pauseSpy, destroySpy };
}

export function expectNoCadenceLifecycleCalls(spies: CadenceLifecycleSpies): void {
    expect(spies.startSpy).not.toHaveBeenCalled();
    expect(spies.pauseSpy).not.toHaveBeenCalled();
    expect(spies.stopSpy).not.toHaveBeenCalled();
    expect(spies.destroySpy).not.toHaveBeenCalled();
}
