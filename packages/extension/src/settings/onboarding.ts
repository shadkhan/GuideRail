// Onboarding state machine (spec 007 R1). Pure: the options page persists this
// state (config.onboarding) through the worker, so an abandoned run resumes at
// the right step. Steps: set PIN → child + pack → study hours → rules walkthrough.

export type OnboardingStep = "pin" | "child" | "hours" | "rules" | "done";

export const ONBOARDING_ORDER: readonly OnboardingStep[] = [
  "pin",
  "child",
  "hours",
  "rules",
  "done",
];

export interface OnboardingState {
  step: OnboardingStep;
  /** Steps finished so far (drives resume-from-abandon). */
  completed: OnboardingStep[];
}

export function initialOnboarding(): OnboardingState {
  return { step: "pin", completed: [] };
}

export function isComplete(state: OnboardingState): boolean {
  return state.step === "done";
}

/** Advance to the next step, marking the current one complete. No-op at "done". */
export function advance(state: OnboardingState): OnboardingState {
  const idx = ONBOARDING_ORDER.indexOf(state.step);
  if (idx < 0 || state.step === "done") return state;
  const next = ONBOARDING_ORDER[idx + 1] ?? "done";
  const completed = state.completed.includes(state.step)
    ? state.completed
    : [...state.completed, state.step];
  return { step: next, completed };
}

/** Step back one (never before the first step). */
export function back(state: OnboardingState): OnboardingState {
  const idx = ONBOARDING_ORDER.indexOf(state.step);
  if (idx <= 0) return state;
  return { ...state, step: ONBOARDING_ORDER[idx - 1]! };
}
