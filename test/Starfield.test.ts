import { describe, expect, it, vi } from "vitest";
import { Starfield } from "../src/Starfield.js";
import { StarfieldState } from "../src/StarfieldState.js";
import { Cadence } from "@crisvsgame/cadence";

describe("state", () => {
    describe("constructor", () => {
        it("starts in the stopped state", () => {
            const starfield = new Starfield();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });
    });

    describe("stop", () => {
        it("transitions from running to stopped", () => {
            const starfield = new Starfield();

            starfield.start();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("transitions from paused to stopped", () => {
            const starfield = new Starfield();

            starfield.start();
            starfield.pause();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("is idempotent when already stopped", () => {
            const starfield = new Starfield();

            starfield.stop();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });
    });

    describe("start", () => {
        it("transitions from stopped to running", () => {
            const starfield = new Starfield();

            starfield.start();

            expect(starfield.state).toBe(StarfieldState.RUNNING);
        });

        it("transitions from paused to running", () => {
            const starfield = new Starfield();

            starfield.start();
            starfield.pause();
            starfield.start();

            expect(starfield.state).toBe(StarfieldState.RUNNING);
        });

        it("is idempotent when already running", () => {
            const starfield = new Starfield();

            starfield.start();
            starfield.start();

            expect(starfield.state).toBe(StarfieldState.RUNNING);
        });
    });

    describe("pause", () => {
        it("transitions from running to paused", () => {
            const starfield = new Starfield();

            starfield.start();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.PAUSED);
        });

        it("does not transition from stopped to paused", () => {
            const starfield = new Starfield();

            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("is idempotent when already paused", () => {
            const starfield = new Starfield();

            starfield.start();
            starfield.pause();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.PAUSED);
        });
    });

    describe("destroy", () => {
        it("transitions from stopped to destroyed", () => {
            const starfield = new Starfield();

            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("transitions from running to destroyed", () => {
            const starfield = new Starfield();

            starfield.start();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("transitions from paused to destroyed", () => {
            const starfield = new Starfield();

            starfield.start();
            starfield.pause();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("is idempotent when already destroyed", () => {
            const starfield = new Starfield();

            starfield.destroy();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("throws when starting a destroyed instance", () => {
            const starfield = new Starfield();

            starfield.destroy();

            expect(() => starfield.start()).toThrow();
            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });
});

describe("cadence subscription", () => {
    function starfieldSpy(): { starfield: Starfield; subscribeSpy: ReturnType<typeof vi.spyOn>; unsubscribeSpy: ReturnType<typeof vi.spyOn> } {
        const cadence = new Cadence();
        const starfield = new Starfield(cadence);
        const subscribeSpy = vi.spyOn(cadence, "subscribe");
        const unsubscribeSpy = vi.spyOn(cadence, "unsubscribe");

        return { starfield, subscribeSpy, unsubscribeSpy };
    }

    describe("callback", () => {
        it("unsubscribes the subscribed callback when stopped", () => {
            const { starfield, subscribeSpy, unsubscribeSpy } = starfieldSpy();

            starfield.start();

            const callback = subscribeSpy.mock.calls[0]![0];

            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledWith(callback);
        });

        it("unsubscribes the subscribed callback when paused", () => {
            const { starfield, subscribeSpy, unsubscribeSpy } = starfieldSpy();

            starfield.start();

            const callback = subscribeSpy.mock.calls[0]![0];

            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledWith(callback);
        });

        it("unsubscribes the subscribed callback when destroyed", () => {
            const { starfield, subscribeSpy, unsubscribeSpy } = starfieldSpy();

            starfield.start();

            const callback = subscribeSpy.mock.calls[0]![0];

            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledWith(callback);
        });
    });

    describe("stop", () => {
        it("does not unsubscribe when stopped while already stopped", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.stop();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("unsubscribes when stopped while running", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.start();
            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not unsubscribe when stopped while paused", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.stop();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("does not unsubscribe when stopped while destroyed", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.destroy();
            starfield.stop();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("start", () => {
        it("subscribes when started while stopped", () => {
            const { starfield, subscribeSpy } = starfieldSpy();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not subscribe when started while already running", () => {
            const { starfield, subscribeSpy } = starfieldSpy();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);

            subscribeSpy.mockClear();

            starfield.start();

            expect(subscribeSpy).not.toHaveBeenCalled();
        });

        it("subscribes when started while paused", () => {
            const { starfield, subscribeSpy } = starfieldSpy();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);

            subscribeSpy.mockClear();

            starfield.pause();
            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not subscribe when started while destroyed", () => {
            const { starfield, subscribeSpy } = starfieldSpy();

            starfield.destroy();

            expect(() => starfield.start()).toThrow();
            expect(subscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("pause", () => {
        it("does not unsubscribe when paused while stopped", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.pause();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("unsubscribes when paused while running", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not unsubscribe when paused while already paused", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.pause();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("does not unsubscribe when paused while destroyed", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.destroy();
            starfield.pause();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("destroy", () => {
        it("does not unsubscribe when destroyed while stopped", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.destroy();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("unsubscribes when destroyed while running", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.start();
            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not unsubscribe when destroyed while paused", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.destroy();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("does not unsubscribe when destroyed while already destroyed", () => {
            const { starfield, unsubscribeSpy } = starfieldSpy();

            starfield.destroy();
            starfield.destroy();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });
});
