import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  createAssistantCoordinatorMeeting,
  deleteAssistantCoordinatorMeeting,
  type AssistantCoordinatorMeeting,
} from "@/lib/assistant-coordinator-meetings";

function localIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function meetingLabel(value: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CoordinatorMeetingsCard({
  schoolId,
  meetings,
  onChanged,
}: {
  schoolId: string;
  meetings: AssistantCoordinatorMeeting[];
  onChanged: () => Promise<void>;
}) {
  const [date, setDate] = useState(localIsoDate());
  const [startsAt, setStartsAt] = useState("14:00");
  const [endsAt, setEndsAt] = useState("14:30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const upcoming = useMemo(
    () =>
      meetings.filter((meeting) => new Date(meeting.ends_at).getTime() >= Date.now()).slice(0, 5),
    [meetings],
  );

  async function addMeeting() {
    setSaving(true);
    setError("");
    try {
      await createAssistantCoordinatorMeeting({ schoolId, date, startsAt, endsAt });
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Poradu se nepodařilo naplánovat.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMeeting(eventId: string) {
    setSaving(true);
    setError("");
    try {
      await deleteAssistantCoordinatorMeeting(schoolId, eventId);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Poradu se nepodařilo odstranit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-[30px] border border-[#dfe8e4] bg-[linear-gradient(135deg,#f7fbf9_0%,#fffdf8_100%)] p-5 shadow-[0_16px_50px_rgba(65,75,70,.05)] md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4f1ec] text-[#55796d]">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#789188]">
              Jeden kalendář pro všechny role
            </div>
            <h2 className="mt-1 text-lg font-black">Porady AP</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-[#7b8883]">
              Porada se uloží jako tvoje soukromá událost „Porada AP“. Bez poznámek, jmen dětí nebo
              citlivého obsahu.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-[#f0d7d1] bg-[#fff5f2] px-4 py-3 text-sm text-[#925a52]">
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[24px] bg-white/80 p-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <label className="text-xs font-bold text-[#687872]">
              Datum
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-[#d8e1dd] bg-white px-3 text-sm outline-none focus:border-[#7aa096]"
              />
            </label>
            <label className="text-xs font-bold text-[#687872]">
              Od
              <input
                type="time"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-[#d8e1dd] bg-white px-3 text-sm outline-none focus:border-[#7aa096]"
              />
            </label>
            <label className="text-xs font-bold text-[#687872]">
              Do
              <input
                type="time"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-[#d8e1dd] bg-white px-3 text-sm outline-none focus:border-[#7aa096]"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={saving || !date || !startsAt || !endsAt}
            onClick={() => void addMeeting()}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#55796d] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(85,121,109,.18)] transition hover:-translate-y-0.5 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Naplánovat poradu
          </button>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-[#8c9994]">
            Nejbližší porady
          </div>
          {upcoming.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#dce4e0] bg-white/55 px-5 py-7 text-center">
              <CalendarClock className="mx-auto h-6 w-6 text-[#86a097]" />
              <p className="mt-2 text-sm font-black">Žádná porada zatím není naplánovaná.</p>
              <p className="mt-1 text-xs text-[#8a9591]">
                Až ji přidáš, objeví se i v hlavním kalendáři.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#e0e8e4] bg-white/80 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-black">Porada AP</div>
                    <div className="mt-0.5 text-xs font-bold text-[#71817b]">
                      {meetingLabel(meeting.starts_at)}
                      {`–${new Intl.DateTimeFormat("cs-CZ", { timeZone: "Europe/Prague", hour: "2-digit", minute: "2-digit" }).format(new Date(meeting.ends_at))}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void removeMeeting(meeting.id)}
                    className="rounded-xl p-2 text-[#94756d] transition hover:bg-[#fff0ec] disabled:opacity-40"
                    aria-label="Odstranit poradu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
