// Injectable time source: production uses the system clock, tests pass a fixed one.
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
