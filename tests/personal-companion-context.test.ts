import { describe, expect, test } from "bun:test";
import {
  buildPersonalDailyContext,
  personalContextLines,
} from "../src/lib/personal-companion-context";
import type { AssistantSettings, TeacherMemory } from "../src/lib/assistant-memory-data";

const settings: AssistantSettings = {
  user_id: "11111111-1111-4111-8111-111111111111",
  assistant_name: "Mia",
  tone: "friendly",
  memory_enabled: true,
  morning_briefing_enabled: true,
  afternoon_reflection_enabled: true,
  custom_style: null,
  preferred_salutation: "Káťo",
};

const memories: TeacherMemory[] = [
  {
    id: "1",
    kind: "recurring_commitment",
    content: "kluci kroužky",
    is_active: true,
    created_at: "2026-08-01T10:00:00Z",
    date_day: null,
    date_month: null,
    date_year: null,
    recurring_weekday: 1,
    recurring_starts_at: "16:00:00",
    recurring_ends_at: "17:30:00",
  },
  {
    id: "2",
    kind: "recurring_commitment",
    content: "jiný den",
    is_active: true,
    created_at: "2026-08-01T10:00:00Z",
    date_day: null,
    date_month: null,
    date_year: null,
    recurring_weekday: 2,
    recurring_starts_at: "18:00:00",
    recurring_ends_at: null,
  },
  {
    id: "3",
    kind: "important_date",
    content: "výročí",
    is_active: true,
    created_at: "2026-08-01T10:00:00Z",
    date_day: 31,
    date_month: 8,
    date_year: 2026,
    recurring_weekday: null,
    recurring_starts_at: null,
    recurring_ends_at: null,
  },
  {
    id: "4",
    kind: "communication_preference",
    content: "stručně a věcně",
    is_active: true,
    created_at: "2026-08-01T10:00:00Z",
    date_day: null,
    date_month: null,
    date_year: null,
    recurring_weekday: null,
    recurring_starts_at: null,
    recurring_ends_at: null,
  },
  {
    id: "5",
    kind: "personal_note",
    content: "nemá se automaticky posílat do denního kontextu",
    is_active: true,
    created_at: "2026-08-01T10:00:00Z",
    date_day: null,
    date_month: null,
    date_year: null,
    recurring_weekday: null,
    recurring_starts_at: null,
    recurring_ends_at: null,
  },
];

describe("personal daily context", () => {
  test("uses only today's structured opt-in context", () => {
    const context = buildPersonalDailyContext(settings, memories, "2026-08-31");
    expect(context.enabled).toBe(true);
    expect(context.salutation).toBe("Káťo");
    expect(context.commitments).toEqual([
      { id: "1", label: "kluci kroužky", startsAt: "16:00", endsAt: "17:30" },
    ]);
    expect(context.importantDates).toEqual(["výročí"]);
    expect(context.preferences).toEqual(["stručně a věcně"]);
    expect(personalContextLines(context)).not.toContain(
      "nemá se automaticky posílat do denního kontextu",
    );
  });

  test("fails closed when personal memory is disabled", () => {
    const context = buildPersonalDailyContext(
      { ...settings, memory_enabled: false },
      memories,
      "2026-08-31",
    );
    expect(context).toEqual({
      enabled: false,
      commitments: [],
      importantDates: [],
      preferences: [],
    });
  });
});
