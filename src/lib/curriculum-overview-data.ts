import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { loadAccessibleClasses, type AccessibleClass } from "@/lib/schedule-data";

const db = supabase as unknown as SupabaseClient;

type VersionRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type SubjectRow = {
  id: string;
  curriculum_version_id: string;
  code: string | null;
  name: string;
  sort_order: number;
};

type TopicRow = {
  id: string;
  curriculum_version_id: string;
  subject_id: string;
  code: string | null;
  name: string;
  description: string | null;
  grade_from: number | null;
  grade_to: number | null;
  sort_order: number;
};

type OutcomeRow = {
  id: string;
  curriculum_version_id: string;
  subject_id: string;
  topic_id: string | null;
  official_code: string | null;
  title: string;
  description: string | null;
  target_grade: number | null;
  period_label: string | null;
  minimum_level: string | null;
  sort_order: number;
};

export type CurriculumOverviewOutcome = {
  id: string;
  officialCode: string | null;
  title: string;
  description: string | null;
  targetGrade: number | null;
  periodLabel: string | null;
  minimumLevel: string | null;
};

export type CurriculumOverviewTopic = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  outcomes: CurriculumOverviewOutcome[];
};

export type CurriculumOverviewSubject = {
  id: string;
  code: string | null;
  name: string;
  topics: CurriculumOverviewTopic[];
  ungroupedOutcomes: CurriculumOverviewOutcome[];
};

export type CurriculumOverviewVersion = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  subjects: CurriculumOverviewSubject[];
};

export type CurriculumOverview = {
  selectedClass: AccessibleClass | null;
  versions: CurriculumOverviewVersion[];
};

function topicMatchesGrade(topic: TopicRow, grade: number) {
  if (topic.grade_from !== null && grade < topic.grade_from) return false;
  if (topic.grade_to !== null && grade > topic.grade_to) return false;
  return true;
}

function outcomeMatchesGrade(outcome: OutcomeRow, grade: number) {
  return outcome.target_grade === null || outcome.target_grade === grade;
}

function mapOutcome(outcome: OutcomeRow): CurriculumOverviewOutcome {
  return {
    id: outcome.id,
    officialCode: outcome.official_code,
    title: outcome.title,
    description: outcome.description,
    targetGrade: outcome.target_grade,
    periodLabel: outcome.period_label,
    minimumLevel: outcome.minimum_level,
  };
}

export async function loadCurriculumOverview(): Promise<CurriculumOverview> {
  const classes = await loadAccessibleClasses();
  const selectedClass = classes.find((item) => item.grade === 5) ?? classes[0] ?? null;
  if (!selectedClass) return { selectedClass: null, versions: [] };

  const grade = selectedClass.grade;
  const [versionsResult, subjectsResult] = await Promise.all([
    db
      .from("curriculum_versions")
      .select("id,code,name,description")
      .eq("status", "published")
      .order("name"),
    db
      .from("curriculum_subjects")
      .select("id,curriculum_version_id,code,name,sort_order")
      .lte("grade_from", grade)
      .gte("grade_to", grade)
      .order("sort_order")
      .order("name"),
  ]);
  if (versionsResult.error) throw versionsResult.error;
  if (subjectsResult.error) throw subjectsResult.error;

  const versions = (versionsResult.data ?? []) as VersionRow[];
  const subjects = (subjectsResult.data ?? []) as SubjectRow[];
  const subjectIds = subjects.map((subject) => subject.id);

  if (subjectIds.length === 0) {
    return {
      selectedClass,
      versions: versions.map((version) => ({ ...version, subjects: [] })),
    };
  }

  const [topicsResult, outcomesResult] = await Promise.all([
    db
      .from("curriculum_topics")
      .select(
        "id,curriculum_version_id,subject_id,code,name,description,grade_from,grade_to,sort_order",
      )
      .in("subject_id", subjectIds)
      .order("sort_order")
      .order("name")
      .limit(1000),
    db
      .from("curriculum_outcomes")
      .select(
        "id,curriculum_version_id,subject_id,topic_id,official_code,title,description,target_grade,period_label,minimum_level,sort_order",
      )
      .in("subject_id", subjectIds)
      .order("sort_order")
      .order("official_code")
      .limit(1500),
  ]);
  if (topicsResult.error) throw topicsResult.error;
  if (outcomesResult.error) throw outcomesResult.error;

  const topics = ((topicsResult.data ?? []) as TopicRow[]).filter((topic) =>
    topicMatchesGrade(topic, grade),
  );
  const outcomes = ((outcomesResult.data ?? []) as OutcomeRow[]).filter((outcome) =>
    outcomeMatchesGrade(outcome, grade),
  );

  return {
    selectedClass,
    versions: versions.map((version) => ({
      id: version.id,
      code: version.code,
      name: version.name,
      description: version.description,
      subjects: subjects
        .filter((subject) => subject.curriculum_version_id === version.id)
        .map((subject) => {
          const subjectTopics = topics.filter((topic) => topic.subject_id === subject.id);
          return {
            id: subject.id,
            code: subject.code,
            name: subject.name,
            topics: subjectTopics.map((topic) => ({
              id: topic.id,
              code: topic.code,
              name: topic.name,
              description: topic.description,
              outcomes: outcomes
                .filter((outcome) => outcome.topic_id === topic.id)
                .map(mapOutcome),
            })),
            ungroupedOutcomes: outcomes
              .filter((outcome) => outcome.subject_id === subject.id && outcome.topic_id === null)
              .map(mapOutcome),
          };
        }),
    })),
  };
}
