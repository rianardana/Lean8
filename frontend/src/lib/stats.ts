export type HabitFlags = {
  workout: boolean;
  ifCompleted: boolean;
  proteinCompleted: boolean;
  waterCompleted: boolean;
  sleepCompleted: boolean;
  noSnack: boolean;
};

export function countCompleted(log: HabitFlags): number {
  return [
    log.workout,
    log.ifCompleted,
    log.proteinCompleted,
    log.waterCompleted,
    log.sleepCompleted,
    log.noSnack,
  ].filter(Boolean).length;
}
