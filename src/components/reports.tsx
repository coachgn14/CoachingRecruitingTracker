import { IMPROVEMENTS } from "@/config/improvements";
import { VIDEO_CLIPS } from "@/config/videoRequirements";
import type { Consensus } from "@/lib/consensus";
import {
  BATS,
  HANDS,
  METRICS,
  PLAYER_TYPES,
  POSITIONS,
  divisionLabel,
  formatHeight,
  levelLabel,
  sourceLabel,
  type MetricKey,
  type PositionKey,
  type SubmissionSnapshot,
} from "@/lib/domain";
import { Badge, Card, DefinitionList } from "./ui";

const label = (list: readonly { key: string; label: string }[], key: string) => list.find((i) => i.key === key)?.label ?? key;

export function improvementLabel(position: PositionKey, key: string) {
  return IMPROVEMENTS[POSITIONS[position].group].find((i) => i.key === key)?.label ?? key;
}

export function PlayerSnapshotView({ snapshot, showName = true }: { snapshot: SubmissionSnapshot; showName?: boolean }) {
  const { player, metrics, videos } = snapshot;
  const pos = POSITIONS[player.position];
  return (
    <div className="space-y-6">
      <Card title={showName ? `${player.firstName} ${player.lastName}` : "Player"}>
        <DefinitionList
          items={[
            ["Position", pos.label],
            ["Graduation year", player.gradYear],
            ["Player type", label(PLAYER_TYPES, player.playerType)],
            ["School", `${player.school}${player.state ? `, ${player.state}` : ""}`],
            ["Height", formatHeight(player.heightInches)],
            ["Weight", `${player.weightLbs} lbs`],
            ["Throws", label(HANDS, player.throws)],
            ["Bats", label(BATS, player.bats)],
          ]}
        />
      </Card>

      <Card title="Metrics">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-2 font-medium">Metric</th>
              <th className="pb-2 font-medium">Value</th>
              <th className="pb-2 font-medium">Source</th>
              <th className="pb-2 font-medium">Measured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(pos.metrics as readonly MetricKey[]).map((key) => {
              const m = metrics[key];
              return (
                <tr key={key}>
                  <td className="py-2">{METRICS[key].label}</td>
                  <td className="py-2 font-semibold">{m ? `${m.value} ${METRICS[key].unit}` : "—"}</td>
                  <td className="py-2">{sourceLabel(m?.source)}</td>
                  <td className="py-2">{m?.measuredOn ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title="Video">
        <ul className="space-y-2 text-sm">
          {VIDEO_CLIPS[pos.group].map((clip) => (
            <li key={clip.key} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{clip.label}</span>
              {clip.isProof && <Badge tone="amber">Proof</Badge>}
              {videos[clip.key] ? (
                <a href={videos[clip.key].url} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-800 underline">
                  Watch
                </a>
              ) : (
                <span className="text-slate-400">Not provided</span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export type EvaluationDisplay = {
  coachDivision: string;
  metricGrades: Record<string, string>;
  currentLevel: string | null;
  targetLevel: string | null;
  improvements: string[];
  improvementNotes: string;
  overallFeedback: string;
};

function LevelPair({ current, target }: { current: string | null; target: string | null }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-md bg-emerald-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Current fit</div>
        <div className="mt-1 text-xl font-bold text-emerald-950">{levelLabel(current)}</div>
      </div>
      <div className="rounded-md bg-sky-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-sky-800">Could reach with improvement</div>
        <div className="mt-1 text-xl font-bold text-sky-950">{levelLabel(target)}</div>
      </div>
    </div>
  );
}

function MetricGradesTable({
  position,
  snapshot,
  grades,
}: {
  position: PositionKey;
  snapshot: SubmissionSnapshot;
  grades: Record<string, string | null>;
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-slate-500">
        <tr>
          <th className="pb-2 font-medium">Metric</th>
          <th className="pb-2 font-medium">Your number</th>
          <th className="pb-2 font-medium">Plays at</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {(POSITIONS[position].metrics as readonly MetricKey[]).map((key) => (
          <tr key={key}>
            <td className="py-2">{METRICS[key].label}</td>
            <td className="py-2">{snapshot.metrics[key] ? `${snapshot.metrics[key]!.value} ${METRICS[key].unit}` : "—"}</td>
            <td className="py-2 font-semibold">{levelLabel(grades[key])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// One coach's evaluation as the player sees it: division only, never identity.
export function EvaluationView({ evaluation, snapshot }: { evaluation: EvaluationDisplay; snapshot: SubmissionSnapshot }) {
  const position = snapshot.player.position;
  return (
    <Card title={`${divisionLabel(evaluation.coachDivision)} coach`}>
      <div className="space-y-5">
        <LevelPair current={evaluation.currentLevel} target={evaluation.targetLevel} />
        <MetricGradesTable position={position} snapshot={snapshot} grades={evaluation.metricGrades} />
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">What to improve</h3>
          {evaluation.improvements.length > 0 && (
            <ul className="mb-2 list-disc space-y-1 pl-5 text-sm">
              {evaluation.improvements.map((k) => (
                <li key={k}>{improvementLabel(position, k)}</li>
              ))}
            </ul>
          )}
          {evaluation.improvementNotes && <p className="whitespace-pre-line text-sm text-slate-700">{evaluation.improvementNotes}</p>}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Overall feedback</h3>
          <p className="whitespace-pre-line text-sm text-slate-700">{evaluation.overallFeedback}</p>
        </div>
      </div>
    </Card>
  );
}

export function ConsensusView({
  consensus,
  snapshot,
  evaluatorCount,
}: {
  consensus: Consensus;
  snapshot: SubmissionSnapshot;
  evaluatorCount: number;
}) {
  const position = snapshot.player.position;
  return (
    <Card title="Consensus">
      <div className="space-y-5">
        <p className="text-sm text-slate-600">
          The consensus is the middle opinion of your {evaluatorCount} coaches for each item. When two coaches agree, that is the
          consensus.
        </p>
        <LevelPair current={consensus.currentLevel} target={consensus.targetLevel} />
        <MetricGradesTable position={position} snapshot={snapshot} grades={consensus.metricGrades} />
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Most common areas to improve</h3>
          <ul className="space-y-1 text-sm">
            {consensus.improvements.map((i) => (
              <li key={i.key} className="flex items-center gap-2">
                <Badge tone={i.count === evaluatorCount ? "red" : i.count > 1 ? "amber" : "slate"}>
                  {i.count} of {evaluatorCount}
                </Badge>
                {improvementLabel(position, i.key)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
