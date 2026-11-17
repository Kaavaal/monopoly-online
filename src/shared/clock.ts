/** The current time. Handed to `buildApp` so tests can pass one they control. */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
