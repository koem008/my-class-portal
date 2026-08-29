import { describe, expect, test } from "bun:test";
import { canConfirmVoiceDraft, inspectVoiceDraft } from "./special-education-voice-contract";

describe("documented external diagnosis voice safety", () => {
  test("blocks an undocumented diagnostic label", () => {
    const inspected = inspectVoiceDraft({
      transcript: "Dnes u něj ADHD výrazně ovlivnilo začátek práce.",
      proposedObservation: "Dnes u něj ADHD výrazně ovlivnilo začátek práce.",
      warnings: [],
      documentedDiagnosisCodes: [],
    });
    expect(canConfirmVoiceDraft(inspected)).toBe(false);
    expect(inspected.warnings.join(" ")).toContain("bez evidované externí dokumentace");
  });

  test("allows a documented label while keeping a non-blocking factual notice", () => {
    const inspected = inspectVoiceDraft({
      transcript: "U žáka s ADHD dnes pomohl rozdělený pracovní postup.",
      proposedObservation: "U žáka s ADHD dnes pomohl rozdělený pracovní postup.",
      warnings: [],
      documentedDiagnosisCodes: ["adhd"],
    });
    expect(canConfirmVoiceDraft(inspected)).toBe(true);
    expect(inspected.warnings).toHaveLength(0);
    expect(inspected.notices?.join(" ")).toContain("externí dokumentaci");
  });

  test("documenting ADHD does not whitelist another diagnosis", () => {
    const inspected = inspectVoiceDraft({
      transcript: "Dnes se projevila dyslexie při samostatném čtení.",
      proposedObservation: "Dnes se projevila dyslexie při samostatném čtení.",
      warnings: [],
      documentedDiagnosisCodes: ["adhd"],
    });
    expect(canConfirmVoiceDraft(inspected)).toBe(false);
  });
});
