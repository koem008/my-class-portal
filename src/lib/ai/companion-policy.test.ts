import { describe, expect, test } from "bun:test";
import {
  COMPANION_NAVIGATION_ITEMS,
  navigationPath,
  parseCompanionPayload,
} from "./companion-policy";

describe("general voice companion policy", () => {
  test("ordinary conversation only replies", () => {
    const result = parseCompanionPayload({
      mode: "conversation",
      reply: "Zítra máš čtyři hodiny.",
      sameDaySummary: "Ráno jsme řešily zítřejší plán.",
    });
    expect(result.requiresConfirmation).toBe(false);
    expect(result.navigation).toBeUndefined();
    expect(result.proposal).toBeUndefined();
    expect(result.sameDaySummary).toBe("Ráno jsme řešily zítřejší plán.");
  });
  test("schedule navigation is fixed and confirmation-free", () => {
    const result = parseCompanionPayload({
      mode: "navigate",
      reply: "Otevírám rozvrh.",
      navigation: { target: "schedule" },
    });
    expect(result.requiresConfirmation).toBe(false);
    expect(result.navigation?.target).toBe("schedule");
    expect(navigationPath("schedule")).toBe("/rozvrh");
  });
  test("classroom is a fixed shared navigation target", () => {
    const result = parseCompanionPayload({
      mode: "navigate",
      reply: "Otevírám třídu.",
      navigation: { target: "classroom" },
    });
    expect(result.requiresConfirmation).toBe(false);
    expect(result.navigation?.target).toBe("classroom");
    expect(navigationPath("classroom")).toBe("/trida");
    expect(COMPANION_NAVIGATION_ITEMS.some((item) => item.target === "classroom")).toBe(true);
  });
  test("pedagogical write remains proposal-only", () => {
    const result = parseCompanionPayload({
      mode: "propose",
      reply: "Připravila jsem návrh k potvrzení.",
      proposal: {
        type: "mark_lesson_completed",
        lessonId: "11111111-1111-4111-8111-111111111111",
        completedSummary: "Probráno.",
      },
      sameDaySummary: "Dopoledne se mluvilo o matematice.",
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.proposal?.type).toBe("mark_lesson_completed");
    expect(result.navigation).toBeUndefined();
  });
  test("ambiguous/out-of-scope cannot smuggle an action", () => {
    expect(() =>
      parseCompanionPayload({
        mode: "conversation",
        reply: "Můžeš to upřesnit?",
        navigation: { target: "schedule" },
      }),
    ).toThrow();
    const safe = parseCompanionPayload({
      mode: "conversation",
      reply: "Můžeš prosím upřesnit, co chceš?",
    });
    expect(safe.navigation).toBeUndefined();
    expect(safe.proposal).toBeUndefined();
  });
});
