import { describe, expect, test } from "bun:test";
import {
  classifySpecializedCreationRequest,
  navigationPath,
  parseCompanionPayload,
} from "../src/lib/ai/companion-policy";

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

describe("specialized creation routing", () => {
  test("routes Czech art creation requests to Creative Studio before AI", () => {
    const result = classifySpecializedCreationRequest(
      "Na páteční výtvarnou výchovu mi vymysli téma, konec prázdnin, omalovánky",
    );
    expect(result?.mode).toBe("navigate");
    expect(result?.navigation?.target).toBe("art_studio");
    expect(navigationPath("art_studio")).toBe("/vytvarna-vychova");
  });

  test("routes worksheet creation to Material Studio", () => {
    const result = classifySpecializedCreationRequest(
      "Vytvoř mi pracovní list na vyjmenovaná slova",
    );
    expect(result?.mode).toBe("navigate");
    expect(result?.navigation?.target).toBe("materials");
  });

  test("does not hijack material lookup questions", () => {
    expect(classifySpecializedCreationRequest("Mám už pracovní list na pátek?")).toBeNull();
  });

  test("accepts Claude-style null unused action fields", () => {
    expect(
      parseCompanionPayload({
        mode: "conversation",
        reply: "Rozumím. Co přesně potřebuješ vědět?",
        navigation: null,
        proposal: null,
        sameDaySummary: null,
      }).mode,
    ).toBe("conversation");
  });
});
