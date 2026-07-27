import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Starfield } from "../src/Starfield.js";
import { StarfieldState } from "../src/StarfieldState.js";
import { Cadence } from "@crisvsgame/cadence";
import { cadenceLifecycleSpies, cadencePrototypeLifecycleSpies, createDefaultStarfield, destroyStarfields, expectNoCadenceLifecycleCalls, trackStarfield } from "./utils/StarfieldTestContext.js";
import { AnimationFrameMock } from "./utils/AnimationFrameMock.js";
import type { CadenceLifecycleSpies } from "./utils/StarfieldTestContext.js";

afterEach(() => {
    destroyStarfields();
    vi.restoreAllMocks();
});

describe("external cadence", () => {
    describe("constructor", () => {
        it("does not manage the cadence lifecycle", () => {
            const { spies } = cadenceLifecycleSpies();

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

        it("transitions to stopped when cadence is destroyed", () => {
            const cadence = new Cadence();
            const starfield = trackStarfield(new Starfield(cadence));

            starfield.start();

            cadence.destroy();

            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });
    });

    describe("start", () => {
        it("does not manage the cadence lifecycle", () => {
            const { starfield, spies } = cadenceLifecycleSpies();

            starfield.start();

            expectNoCadenceLifecycleCalls(spies);
        });

        it("does not transition from stopped to running when cadence is destroyed", () => {
            const cadence = new Cadence();
            const starfield = trackStarfield(new Starfield(cadence));

            starfield.start();
            starfield.stop();

            cadence.destroy();

            expect(() => starfield.start()).toThrow();
            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("does not transition from paused to running when cadence is destroyed", () => {
            const cadence = new Cadence();
            const starfield = trackStarfield(new Starfield(cadence));

            starfield.start();
            starfield.pause();

            cadence.destroy();

            expect(() => starfield.start()).toThrow();
            expect(starfield.state).toBe(StarfieldState.PAUSED);
        });
    });

    describe("pause", () => {
        it("does not manage the cadence lifecycle", () => {
            const { starfield, spies } = cadenceLifecycleSpies();

            starfield.start();
            starfield.pause();

            expectNoCadenceLifecycleCalls(spies);
        });

        it("transitions to paused when cadence is destroyed", () => {
            const cadence = new Cadence();
            const starfield = trackStarfield(new Starfield(cadence));

            starfield.start();

            cadence.destroy();

            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.PAUSED);
        });
    });

    describe("destroy", () => {
        it("does not manage the cadence lifecycle", () => {
            const { starfield, spies } = cadenceLifecycleSpies();

            starfield.start();
            starfield.destroy();

            expectNoCadenceLifecycleCalls(spies);
        });

        it("transitions to destroyed when cadence is destroyed", () => {
            const cadence = new Cadence();
            const starfield = trackStarfield(new Starfield(cadence));

            starfield.start();

            cadence.destroy();

            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });
});

describe("default cadence", () => {
    const animationFrameMock = new AnimationFrameMock();
    let spies: CadenceLifecycleSpies;

    beforeAll(() => {
        animationFrameMock.install();
    });

    beforeEach(() => {
        animationFrameMock.reset();
        spies = cadencePrototypeLifecycleSpies();
    });

    afterAll(() => {
        animationFrameMock.uninstall();
    });

    describe("constructor", () => {
        it("does not manage the cadence lifecycle", () => {
            createDefaultStarfield();

            expectNoCadenceLifecycleCalls(spies);
        });
    });

    describe("stop", () => {
        it("pauses the cadence instance with the last subscriber", () => {
            const starfield1 = createDefaultStarfield();
            const starfield2 = createDefaultStarfield();

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
            const starfield1 = createDefaultStarfield();
            const starfield2 = createDefaultStarfield();

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
            const starfield = createDefaultStarfield();

            starfield.start();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).toHaveBeenCalledTimes(1);
            expect(spies.pauseSpy).not.toHaveBeenCalled();
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });

        it("does not start the cadence instance with subsequent subscribers", () => {
            const starfield1 = createDefaultStarfield();
            const starfield2 = createDefaultStarfield();

            starfield1.start();
            starfield2.start();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).toHaveBeenCalledTimes(1);
            expect(spies.pauseSpy).not.toHaveBeenCalled();
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });

        it("restarts the cadence after the last subscriber has stopped", () => {
            const starfield = createDefaultStarfield();

            starfield.start();
            starfield.stop();

            vi.clearAllMocks();

            starfield.start();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).toHaveBeenCalledTimes(1);
            expect(spies.pauseSpy).not.toHaveBeenCalled();
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });

        it("restarts the cadence after the last subscriber has paused", () => {
            const starfield = createDefaultStarfield();

            starfield.start();
            starfield.pause();

            vi.clearAllMocks();

            starfield.start();

            expect(spies.stopSpy).not.toHaveBeenCalled();
            expect(spies.startSpy).toHaveBeenCalledTimes(1);
            expect(spies.pauseSpy).not.toHaveBeenCalled();
            expect(spies.destroySpy).not.toHaveBeenCalled();
        });
    });

    describe("pause", () => {
        it("pauses the cadence instance with the last subscriber", () => {
            const starfield1 = createDefaultStarfield();
            const starfield2 = createDefaultStarfield();

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
            const starfield1 = createDefaultStarfield();
            const starfield2 = createDefaultStarfield();

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
            const starfield1 = createDefaultStarfield();
            const starfield2 = createDefaultStarfield();

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
            const starfield1 = createDefaultStarfield();
            const starfield2 = createDefaultStarfield();

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
