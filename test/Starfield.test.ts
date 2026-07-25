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
});
