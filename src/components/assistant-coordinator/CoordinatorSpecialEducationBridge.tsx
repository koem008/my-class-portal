import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AssistantAssignment } from "@/lib/assistant-coordinator-data";
import {
  loadCoordinatorSpecialEducationLinks,
  type CoordinatorSpecialEducationLink,
} from "@/lib/assistant-coordinator-special-education";

export function CoordinatorSpecialEducationBridge({
  schoolId,
  assignments,
}: {
  schoolId: string;
  assignments: AssistantAssignment[];
}) {
  const [authorized, setAuthorized] = useState(false);
  const [links, setLinks] = useState<CoordinatorSpecialEducationLink[]>([]);
  const [failed, setFailed] = useState(false);

  const aliasAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.student_alias_id && assignment.alias),
    [assignments],
  );

  useEffect(() => {
    let active = true;
    setFailed(false);

    void loadCoordinatorSpecialEducationLinks(
      schoolId,
      aliasAssignments
        .map((assignment) => assignment.student_alias_id)
        .filter((id): id is string => Boolean(id)),
    )
      .then((result) => {
        if (!active) return;
        setAuthorized(result.authorized);
        setLinks(result.links);
      })
      .catch(() => {
        if (!active) return;
        setAuthorized(false);
        setLinks([]);
        setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [schoolId, aliasAssignments]);

  const rows = useMemo(() => {
    const linkMap = new Map(links.map((link) => [link.studentAliasId, link]));
    return aliasAssignments
      .map((assignment) => {
        const link = assignment.student_alias_id
          ? linkMap.get(assignment.student_alias_id)
          : undefined;
        if (!link) return null;
        return { assignment, link };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [aliasAssignments, links]);

  if (!authorized && !failed) return null;

  if (failed) {
    return (
      <section className="rounded-[28px] border border-[#eadfda] bg-[#fffaf7] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-[#9a6d64]" />
          <div>
            <h2 className="text-sm font-black text-[#453a38]">Návaznost na speciální pedagogiku</h2>
            <p className="mt-1 text-xs leading-5 text-[#806f6b]">
              Oprávnění a návaznost se teď nepodařilo bezpečně ověřit. Žádná data případu nebyla
              načtena.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!rows.length) return null;

  return (
    <section className="rounded-[30px] border border-[#e4dfef] bg-[linear-gradient(135deg,#faf8ff_0%,#fffdf9_100%)] p-5 shadow-[0_18px_48px_rgba(86,72,112,.07)] md:p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eee8f8] text-[#69598d]">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-[.14em] text-[#8877a7]">
            Vědomý přechod mezi rolemi
          </div>
          <h2 className="mt-1 text-lg font-black tracking-[-.02em] text-[#302d3a]">
            Návaznost na speciální pedagogiku
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#777181]">
            Tady se ukazuje pouze existence oprávněného případu pro stejný pseudonym. Obsah případu
            se do koordinace nepřenáší.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map(({ assignment, link }) => (
          <div
            key={`${assignment.id}:${link.caseId}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ebe6f2] bg-white/80 px-4 py-3"
          >
            <div>
              <div className="text-sm font-black text-[#373343]">
                {assignment.alias} · {assignment.className}
              </div>
              <div className="mt-0.5 text-xs text-[#817b87]">
                AP: {assignment.assistantName} · případ{" "}
                {link.status === "active" ? "aktivní" : "sledovaný"}
              </div>
            </div>
            <Link
              to="/specialni-pedagogika/$caseId"
              params={{ caseId: link.caseId }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#68598b] px-3 py-2 text-xs font-black text-white shadow-[0_8px_20px_rgba(104,89,139,.16)] transition hover:-translate-y-0.5"
            >
              Otevřít případ
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
