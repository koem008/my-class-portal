import { describe, expect, test } from "bun:test";
import { parseCompanionPayload } from "../src/lib/ai/companion-policy";

const lessonId = "11111111-1111-4111-8111-111111111111";

describe("companion proposal policy", () => {
  test("accepts explicit confirmed lesson substitution proposal shape", () => {
    const parsed = parseCompanionPayload({
      mode: "propose",
      reply: "Navrhuji zítřejší přírodovědu nahradit dokončením projektu.",
      proposal: {
        type: "substitute_lesson_activity",
        lessonId,
        expectedSubject: "Přírodověda",
        expectedDate: "2026-09-15",
        replacementTitle: "Dokončení třídního projektu",
        replacementSubject: "Projekt",
      },
    });

    expect(parsed.mode).toBe("propose");
    expect(parsed.requiresConfirmation).toBe(true);
    expect(parsed.proposal).toEqual({
      type: "substitute_lesson_activity",
      lessonId,
      expectedSubject: "Přírodověda",
      expectedDate: "2026-09-15",
      replacementTitle: "Dokončení třídního projektu",
      replacementSubject: "Projekt",
    });
  });

  test("rejects substitution proposal without exact date metadata", () => {
    expect(() =>
      parseCompanionPayload({
        mode: "propose",
        reply: "Navrhuji změnu.",
        proposal: {
          type: "substitute_lesson_activity",
          lessonId,
          expectedSubject: "Přírodověda",
          expectedDate: "zítra",
          replacementTitle: "Dokončení projektu",
          replacementSubject: "Projekt",
        },
      }),
    ).toThrow("Návrh náhrady hodiny není platný.");
  });

  test("conversation mode cannot smuggle a proposal", () => {
    expect(() =>
      parseCompanionPayload({
        mode: "conversation",
        reply: "Dobře.",
        proposal: {
          type: "substitute_lesson_activity",
          lessonId,
          expectedSubject: "Přírodověda",
          expectedDate: "2026-09-15",
          replacementTitle: "Dokončení projektu",
          replacementSubject: "Projekt",
        },
      }),
    ).toThrow("Konverzace nesmí spouštět akci.");
  });
});
