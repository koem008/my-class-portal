import type { AssistantSettings, TeacherMemory } from "@/lib/assistant-memory-data";

export type PersonalDailyCommitment = {
  id: string;
  label: string;
  startsAt: string;
  endsAt?: string;
};

export type PersonalDailyContext = {
  enabled: boolean;
  salutation?: string;
  commitments: PersonalDailyCommitment[];
  importantDates: string[];
  preferences: string[];
};

/**
 * Converts a Czech preferred first-name salutation to a natural vocative.
 * The stored preference stays untouched; only direct address is inflected.
 * Common indeclinable/foreign names can be entered already in vocative form.
 */
export function czechVocative(name: string): string {
  const value = name.trim();
  if (!value) return value;

  // If the user explicitly stored a vocative-looking form, do not inflect it again.
  if (/[oůie]$/iu.test(value) && !/[aá]$/iu.test(value)) return value;

  // Czech feminine first names ending in -a/-á: Káťa → Káťo, Katka → Katko,
  // Petra → Petro, Jana → Jano. This is the dominant pattern used in direct address.
  if (/[aá]$/iu.test(value)) return `${value.slice(0, -1)}o`;

  // Frequent masculine patterns. Keep this deliberately conservative; an explicitly
  // configured preferred salutation always wins over guessing an uncommon name.
  if (/ek$/iu.test(value)) return `${value.slice(0, -2)}ku`; // Marek → Marku
  if (/el$/iu.test(value)) return `${value.slice(0, -2)}le`; // Pavel → Pavle
  if (/r$/iu.test(value)) return `${value}e`; // Petr → Petře is irregular, handled below

  const irregular: Record<string, string> = {
    petr: "Petře",
    jan: "Jane",
    tomáš: "Tomáši",
    lukáš: "Lukáši",
    michal: "Michale",
    martin: "Martine",
    david: "Davide",
    ondřej: "Ondřeji",
    jiří: "Jiří",
  };
  return irregular[value.toLocaleLowerCase("cs-CZ")] ?? value;
}

export function buildPersonalDailyContext(
  settings: AssistantSettings | null,
  memories: TeacherMemory[],
  isoDate: string,
): PersonalDailyContext {
  if (!settings?.memory_enabled) {
    return { enabled: false, commitments: [], importantDates: [], preferences: [] };
  }

  const date = new Date(`${isoDate}T12:00:00`);
  const isoWeekday = date.getDay() === 0 ? 7 : date.getDay();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const active = memories.filter((memory) => memory.is_active);
  const commitments = active
    .filter(
      (memory) =>
        memory.kind === "recurring_commitment" &&
        memory.recurring_weekday === isoWeekday &&
        Boolean(memory.recurring_starts_at),
    )
    .map((memory) => ({
      id: memory.id,
      label: memory.content,
      startsAt: memory.recurring_starts_at!.slice(0, 5),
      endsAt: memory.recurring_ends_at?.slice(0, 5) || undefined,
    }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const importantDates = active
    .filter(
      (memory) =>
        memory.kind === "important_date" &&
        memory.date_day === day &&
        memory.date_month === month &&
        (memory.date_year == null || memory.date_year === year),
    )
    .map((memory) => memory.content);

  const preferences = active
    .filter(
      (memory) =>
        memory.kind === "communication_preference" || memory.kind === "planning_preference",
    )
    .map((memory) => memory.content)
    .slice(0, 12);

  const preferredSalutation = settings.preferred_salutation?.trim();
  return {
    enabled: true,
    salutation: preferredSalutation ? czechVocative(preferredSalutation) : undefined,
    commitments,
    importantDates,
    preferences,
  };
}

export function personalContextLines(context: PersonalDailyContext): string[] {
  if (!context.enabled) return [];
  const lines = [...context.preferences];
  for (const commitment of context.commitments)
    lines.push(
      `Dnes ${commitment.startsAt}${commitment.endsAt ? `–${commitment.endsAt}` : ""}: ${commitment.label}`,
    );
  for (const item of context.importantDates) lines.push(`Dnes je důležité datum: ${item}`);
  return lines;
}
