export type DelightKind = "prep_ready" | "day_done" | "quiet_win" | "weekly_close";

export type DelightDetail = {
  kind: DelightKind;
  message?: string;
};

export const DELIGHT_EVENT = "moje-trida:delight";

export function triggerDelight(detail: DelightDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<DelightDetail>(DELIGHT_EVENT, { detail }));
}

export function getDailyAmbientDelight(now = new Date()): DelightDetail | null {
  const day = now.getDay();
  const hour = now.getHours();

  if (day === 1 && hour >= 6 && hour < 10) {
    return { kind: "quiet_win", message: "Kafe máme? Tak můžeme. ☕" };
  }
  if (day === 5 && hour >= 13 && hour < 19) {
    return { kind: "weekly_close", message: "A je to. Další týden v kapse. ☕" };
  }
  if (hour >= 19 && hour < 22) {
    return { kind: "day_done", message: "Na dnešek stačí. Zbytek může počkat." };
  }
  return null;
}

export function delightStorageKey(detail: DelightDetail, now = new Date()) {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `moje-trida:delight:${date}:${detail.kind}`;
}
