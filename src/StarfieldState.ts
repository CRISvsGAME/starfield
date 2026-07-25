export const StarfieldState = {
    STOPPED: 0,
    RUNNING: 1,
    PAUSED: 2,
    DESTROYED: 3,
} as const;

export type StarfieldState = (typeof StarfieldState)[keyof typeof StarfieldState];
