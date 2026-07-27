import { afterEach, describe, expect, it } from "vitest";
import { StarfieldState } from "../src/StarfieldState.js";
import { createExternalStarfield, destroyStarfields } from "./utils/StarfieldTestContext.js";

afterEach(() => {
    destroyStarfields();
});

describe("starfield state", () => {
    describe("constructor", () => {
        it("starts in the stopped state", () => {
            const starfield = createExternalStarfield();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });
    });

    describe("stop", () => {
        it("transitions from running to stopped", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("transitions from paused to stopped", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.pause();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("is idempotent when already stopped", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.stop();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("does not transition from destroyed to stopped", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.destroy();
            starfield.stop();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });

    describe("start", () => {
        it("transitions from stopped to running", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.stop();
            starfield.start();

            expect(starfield.state).toBe(StarfieldState.RUNNING);
        });

        it("transitions from paused to running", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.pause();
            starfield.start();

            expect(starfield.state).toBe(StarfieldState.RUNNING);
        });

        it("is idempotent when already running", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.start();

            expect(starfield.state).toBe(StarfieldState.RUNNING);
        });

        it("throws when starting a destroyed instance", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.destroy();

            expect(() => starfield.start()).toThrow();
            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });

    describe("pause", () => {
        it("transitions from running to paused", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.PAUSED);
        });

        it("does not transition from stopped to paused", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.stop();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.STOPPED);
        });

        it("is idempotent when already paused", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.pause();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.PAUSED);
        });

        it("does not transition from destroyed to paused", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.destroy();
            starfield.pause();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });

    describe("destroy", () => {
        it("transitions from stopped to destroyed", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.stop();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("transitions from running to destroyed", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("transitions from paused to destroyed", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.pause();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });

        it("is idempotent when already destroyed", () => {
            const starfield = createExternalStarfield();

            starfield.start();
            starfield.destroy();
            starfield.destroy();

            expect(starfield.state).toBe(StarfieldState.DESTROYED);
        });
    });
});
