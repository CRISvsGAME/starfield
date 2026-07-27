import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Starfield } from "../src/Starfield.js";
import { StarfieldState } from "../src/StarfieldState.js";
import { Cadence } from "@crisvsgame/cadence";
import { AnimationFrameMock } from "./utils/AnimationFrameMock.js";

type CadenceLifecycleSpies = {
    stopSpy: ReturnType<typeof vi.spyOn>;
    startSpy: ReturnType<typeof vi.spyOn>;
    pauseSpy: ReturnType<typeof vi.spyOn>;
    destroySpy: ReturnType<typeof vi.spyOn>;
};

type CadenceSubscriptionSpies = {
    subscribeSpy: ReturnType<typeof vi.spyOn>;
    unsubscribeSpy: ReturnType<typeof vi.spyOn>;
};

const animationFrameMock = new AnimationFrameMock();
const starfields: Starfield[] = [];

function createStarfield(): Starfield {
    const starfield = new Starfield();

    starfields.push(starfield);

    return starfield;
}

function cadenceSubscriptionSpies(): {
    starfield: Starfield;
    spies: CadenceSubscriptionSpies;
} {
    const cadence = new Cadence();

    const subscribeSpy = vi.spyOn(cadence, "subscribe");
    const unsubscribeSpy = vi.spyOn(cadence, "unsubscribe");

    const starfield = new Starfield(cadence);

    starfields.push(starfield);

    return { starfield, spies: { subscribeSpy, unsubscribeSpy } };
}

function cadenceLifecycleSpies(): {
    starfield: Starfield;
    spies: CadenceLifecycleSpies;
} {
    const cadence = new Cadence();

    const stopSpy = vi.spyOn(cadence, "stop");
    const startSpy = vi.spyOn(cadence, "start");
    const pauseSpy = vi.spyOn(cadence, "pause");
    const destroySpy = vi.spyOn(cadence, "destroy");

    const starfield = new Starfield(cadence);

    starfields.push(starfield);

    return { starfield, spies: { stopSpy, startSpy, pauseSpy, destroySpy } };
}

beforeAll(() => {
    animationFrameMock.install();
});

beforeEach(() => {
    animationFrameMock.reset();
});

afterEach(() => {
    for (const starfield of starfields) {
        starfield.destroy();
    }

    starfields.length = 0;

    vi.restoreAllMocks();
});

afterAll(() => {
    animationFrameMock.uninstall();
});

describe("state", () => {
    describe("constructor", () => {
        it("starts in the stopped state", () => {
            const starfield = createStarfield();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });
    });

    describe("stop", () => {
        it("transitions from running to stopped", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("transitions from paused to stopped", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.pause();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("is idempotent when already stopped", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.stop();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("does not transition from destroyed to stopped", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.destroy();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });

    describe("start", () => {
        it("transitions from stopped to running", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.stop();
            starfield.start();

            expect(starfield.state).toBe(StarfieldState.RUNNING);
        });

        it("transitions from paused to running", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.pause();
            starfield.start();

            expect(starfield.state).toBe(StarfieldState.RUNNING);
        });

        it("is idempotent when already running", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.start();

            expect(starfield.state).toBe(StarfieldState.RUNNING);
        });

        it("throws when starting a destroyed instance", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.destroy();

            expect(() => starfield.start()).toThrow();
            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });

    describe("pause", () => {
        it("transitions from running to paused", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.PAUSED);
        });

        it("does not transition from stopped to paused", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.stop();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("is idempotent when already paused", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.pause();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.PAUSED);
        });

        it("does not transition from destroyed to paused", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.destroy();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });

    describe("destroy", () => {
        it("transitions from stopped to destroyed", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.stop();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("transitions from running to destroyed", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("transitions from paused to destroyed", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.pause();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("is idempotent when already destroyed", () => {
            const starfield = createStarfield();

            starfield.start();
            starfield.destroy();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });
});

describe("cadence subscription", () => {
    describe("callback", () => {
        it("unsubscribes the subscribed callback when stopped", () => {
            const {
                starfield,
                spies: { subscribeSpy, unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            const callback = subscribeSpy.mock.calls[0]![0];

            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledWith(callback);
        });

        it("unsubscribes the subscribed callback when paused", () => {
            const {
                starfield,
                spies: { subscribeSpy, unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            const callback = subscribeSpy.mock.calls[0]![0];

            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledWith(callback);
        });

        it("unsubscribes the subscribed callback when destroyed", () => {
            const {
                starfield,
                spies: { subscribeSpy, unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            const callback = subscribeSpy.mock.calls[0]![0];

            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledWith(callback);
        });
    });

    describe("stop", () => {
        it("does not unsubscribe when stopped while already stopped", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.stop();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("unsubscribes when stopped while running", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not unsubscribe when stopped while paused", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.stop();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("does not unsubscribe when stopped while destroyed", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.stop();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("start", () => {
        it("subscribes when started while stopped", () => {
            const {
                starfield,
                spies: { subscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not subscribe when started while already running", () => {
            const {
                starfield,
                spies: { subscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);

            subscribeSpy.mockClear();

            starfield.start();

            expect(subscribeSpy).not.toHaveBeenCalled();
        });

        it("subscribes when started while paused", () => {
            const {
                starfield,
                spies: { subscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);

            subscribeSpy.mockClear();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not subscribe when started while destroyed", () => {
            const {
                starfield,
                spies: { subscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);

            subscribeSpy.mockClear();

            starfield.destroy();

            expect(() => starfield.start()).toThrow();
            expect(subscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("pause", () => {
        it("does not unsubscribe when paused while stopped", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.pause();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("unsubscribes when paused while running", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not unsubscribe when paused while already paused", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.pause();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("does not unsubscribe when paused while destroyed", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.pause();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("destroy", () => {
        it("does not unsubscribe when destroyed while stopped", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.destroy();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("unsubscribes when destroyed while running", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not unsubscribe when destroyed while paused", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.destroy();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("does not unsubscribe when destroyed while already destroyed", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.destroy();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });
});

describe("external cadence", () => {
    function expectNoCadenceLifecycleCalls(spies: CadenceLifecycleSpies): void {
        expect(spies.startSpy).not.toHaveBeenCalled();
        expect(spies.pauseSpy).not.toHaveBeenCalled();
        expect(spies.stopSpy).not.toHaveBeenCalled();
        expect(spies.destroySpy).not.toHaveBeenCalled();
    }

    describe("constructor", () => {
        it("does not manage the cadence lifecycle", () => {
            const { starfield, spies } = cadenceLifecycleSpies();

            expect(starfield).toBeInstanceOf(Starfield);

            expectNoCadenceLifecycleCalls(spies);
        });
    });

    describe("stop", () => {
        it("does not manage the cadence lifecycle", () => {
            const { starfield, spies } = cadenceLifecycleSpies();

            starfield.start();
            starfield.stop();

            expectNoCadenceLifecycleCalls(spies);
        });
    });

    describe("start", () => {
        it("does not manage the cadence lifecycle", () => {
            const { starfield, spies } = cadenceLifecycleSpies();

            starfield.start();

            expectNoCadenceLifecycleCalls(spies);
        });
    });

    describe("pause", () => {
        it("does not manage the cadence lifecycle", () => {
            const { starfield, spies } = cadenceLifecycleSpies();

            starfield.start();
            starfield.pause();

            expectNoCadenceLifecycleCalls(spies);
        });
    });

    describe("destroy", () => {
        it("does not manage the cadence lifecycle", () => {
            const { starfield, spies } = cadenceLifecycleSpies();

            starfield.start();
            starfield.destroy();

            expectNoCadenceLifecycleCalls(spies);
        });
    });
});

describe("default cadence", () => {
    function cadencePrototypeLifecycleSpies(): CadenceLifecycleSpies {
        const stopSpy = vi.spyOn(Cadence.prototype, "stop");
        const startSpy = vi.spyOn(Cadence.prototype, "start");
        const pauseSpy = vi.spyOn(Cadence.prototype, "pause");
        const destroySpy = vi.spyOn(Cadence.prototype, "destroy");

        return { stopSpy, startSpy, pauseSpy, destroySpy };
    }

    let spies: CadenceLifecycleSpies;

    beforeEach(() => {
        spies = cadencePrototypeLifecycleSpies();
    });

    describe("stop", () => {
        it("pauses the cadence instance with the last subscriber", () => {
            const starfield1 = createStarfield();
            const starfield2 = createStarfield();

            starfield1.start();
            starfield2.start();

            vi.clearAllMocks();

            starfield1.stop();
            starfield2.stop();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).not.toHaveBeenCalled();
            expect(spies.pauseSpy).toHaveBeenCalledTimes(1);
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });

        it("does not pause the cadence instance with remaining subscribers", () => {
            const starfield1 = createStarfield();
            const starfield2 = createStarfield();

            starfield1.start();
            starfield2.start();

            vi.clearAllMocks();

            starfield1.stop();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).not.toHaveBeenCalled();
            expect(spies.pauseSpy).not.toHaveBeenCalled();
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });
    });

    describe("start", () => {
        it("starts the cadence instance with the first subscriber", () => {
            const starfield = createStarfield();

            starfield.start();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).toHaveBeenCalledTimes(1);
            expect(spies.pauseSpy).not.toHaveBeenCalled();
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });

        it("does not start the cadence instance with subsequent subscribers", () => {
            const starfield1 = createStarfield();
            const starfield2 = createStarfield();

            starfield1.start();
            starfield2.start();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).toHaveBeenCalledTimes(1);
            expect(spies.pauseSpy).not.toHaveBeenCalled();
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });
    });

    describe("pause", () => {
        it("pauses the cadence instance with the last subscriber", () => {
            const starfield1 = createStarfield();
            const starfield2 = createStarfield();

            starfield1.start();
            starfield2.start();

            vi.clearAllMocks();

            starfield1.pause();
            starfield2.pause();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).not.toHaveBeenCalled();
            expect(spies.pauseSpy).toHaveBeenCalledTimes(1);
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });

        it("does not pause the cadence instance with remaining subscribers", () => {
            const starfield1 = createStarfield();
            const starfield2 = createStarfield();

            starfield1.start();
            starfield2.start();

            vi.clearAllMocks();

            starfield1.pause();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).not.toHaveBeenCalled();
            expect(spies.pauseSpy).not.toHaveBeenCalled();
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });
    });

    describe("destroy", () => {
        it("pauses the cadence instance with the last subscriber", () => {
            const starfield1 = createStarfield();
            const starfield2 = createStarfield();

            starfield1.start();
            starfield2.start();

            vi.clearAllMocks();

            starfield1.destroy();
            starfield2.destroy();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).not.toHaveBeenCalled();
            expect(spies.pauseSpy).toHaveBeenCalledTimes(1);
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });

        it("does not pause the cadence instance with remaining subscribers", () => {
            const starfield1 = createStarfield();
            const starfield2 = createStarfield();

            starfield1.start();
            starfield2.start();

            vi.clearAllMocks();

            starfield1.destroy();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).not.toHaveBeenCalled();
            expect(spies.pauseSpy).not.toHaveBeenCalled();
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });
    });
});
