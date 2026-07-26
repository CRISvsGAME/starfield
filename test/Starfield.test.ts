import { describe, expect, it } from "vitest";
import { Starfield } from "../src/Starfield.js";
import { StarfieldState } from "../src/StarfieldState.js";

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
