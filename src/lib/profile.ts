import { VIDEO_CLIPS } from "@/config/videoRequirements";
import {
  BATS,
  HANDS,
  METRIC_SOURCES,
  METRICS,
  PLAYER_TYPES,
  POSITIONS,
  isPositionKey,
  parseJson,
  type MetricKey,
  type MetricMap,
  type MetricSource,
  type PositionKey,
  type SubmissionSnapshot,
  type VideoMap,
} from "./domain";

// Parsing and validation for the player profile form, plus the checks that
// decide whether a profile is complete enough to submit for evaluation.
// Players can save a partial profile; anything they *do* enter must be valid.

export type ProfileInput = {
  firstName: string;
  lastName: string;
  playerType: string;
  school: string;
  state: string;
  gradYear: number | null;
  heightInches: number | null;
  weightLbs: number | null;
  position: PositionKey | null;
  throws: string | null;
  bats: string | null;
  metrics: MetricMap;
  videos: VideoMap;
};

export type FieldErrors = Record<string, string>;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function optionalInt(raw: string, min: number, max: number, label: string, errors: FieldErrors, key: string) {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    errors[key] = `${label} must be a whole number between ${min} and ${max}.`;
    return null;
  }
  return n;
}

function oneOf<T extends { key: string }>(raw: string, options: readonly T[]) {
  return options.some((o) => o.key === raw) ? raw : null;
}

export function isValidVideoUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function gradYearRange(now = new Date()) {
  const y = now.getFullYear();
  return { min: y - 4, max: y + 6 };
}

export function parseProfileForm(fd: FormData): { data: ProfileInput; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  if (!firstName) errors.firstName = "First name is required.";
  if (!lastName) errors.lastName = "Last name is required.";

  const { min, max } = gradYearRange();
  const gradYear = optionalInt(str(fd, "gradYear"), min, max, "Graduation year", errors, "gradYear");

  const feet = optionalInt(str(fd, "heightFeet"), 4, 7, "Height (feet)", errors, "height");
  const inches = optionalInt(str(fd, "heightInches"), 0, 11, "Height (inches)", errors, "height");
  const heightInches = feet != null ? feet * 12 + (inches ?? 0) : null;

  const weightLbs = optionalInt(str(fd, "weightLbs"), 90, 350, "Weight", errors, "weightLbs");

  const positionRaw = str(fd, "position");
  const position = isPositionKey(positionRaw) ? positionRaw : null;

  const metrics: MetricMap = {};
  if (position) {
    for (const key of POSITIONS[position].metrics) {
      const def = METRICS[key];
      const rawValue = str(fd, `metric.${key}.value`);
      if (!rawValue) continue;
      const value = Number(rawValue);
      if (!Number.isFinite(value) || value < def.min || value > def.max) {
        errors[`metric.${key}`] = `${def.label} must be between ${def.min} and ${def.max} ${def.unit}.`;
        continue;
      }
      const source = (oneOf(str(fd, `metric.${key}.source`), METRIC_SOURCES) ?? "SELF") as MetricSource;
      const measuredOn = str(fd, `metric.${key}.measuredOn`);
      metrics[key] = {
        value,
        source,
        ...(/^\d{4}-\d{2}-\d{2}$/.test(measuredOn) ? { measuredOn } : {}),
      };
    }
  }

  const videos: VideoMap = {};
  if (position) {
    for (const clip of VIDEO_CLIPS[POSITIONS[position].group]) {
      const url = str(fd, `video.${clip.key}`);
      if (!url) continue;
      if (!isValidVideoUrl(url)) {
        errors[`video.${clip.key}`] = "Enter a full link starting with https://";
        continue;
      }
      videos[clip.key] = { url };
    }
  }

  return {
    data: {
      firstName,
      lastName,
      playerType: oneOf(str(fd, "playerType"), PLAYER_TYPES) ?? "HIGH_SCHOOL",
      school: str(fd, "school"),
      state: str(fd, "state").toUpperCase().slice(0, 2),
      gradYear,
      heightInches,
      weightLbs,
      position,
      throws: oneOf(str(fd, "throws"), HANDS),
      bats: oneOf(str(fd, "bats"), BATS),
      metrics,
      videos,
    },
    errors,
  };
}

// The stored profile row, with JSON columns still as strings.
export type StoredProfile = {
  firstName: string;
  lastName: string;
  playerType: string;
  school: string;
  state: string;
  gradYear: number | null;
  heightInches: number | null;
  weightLbs: number | null;
  position: string | null;
  throws: string | null;
  bats: string | null;
  metrics: string;
  videos: string;
};

// Everything still needed before the player can submit. Empty = ready.
export function missingForSubmission(p: StoredProfile): string[] {
  const missing: string[] = [];
  if (!p.school) missing.push("School");
  if (!p.gradYear) missing.push("Graduation year");
  if (!p.heightInches) missing.push("Height");
  if (!p.weightLbs) missing.push("Weight");
  if (!p.throws) missing.push("Throwing hand");
  if (!p.bats) missing.push("Batting side");
  if (!p.position || !isPositionKey(p.position)) {
    missing.push("Position");
    return missing;
  }
  const metrics = parseJson<MetricMap>(p.metrics, {});
  for (const key of POSITIONS[p.position].metrics as readonly MetricKey[]) {
    if (!metrics[key]) missing.push(METRICS[key].label);
  }
  const videos = parseJson<VideoMap>(p.videos, {});
  for (const clip of VIDEO_CLIPS[POSITIONS[p.position].group]) {
    if (clip.required && !videos[clip.key]) missing.push(`Video: ${clip.label}`);
  }
  return missing;
}

// Freeze the profile into the shape coaches evaluate. Only the metrics and
// videos for the current position are kept. Call only when
// missingForSubmission() is empty.
export function buildSnapshot(p: StoredProfile): SubmissionSnapshot {
  if (!p.position || !isPositionKey(p.position)) throw new Error("Profile has no position");
  const position = p.position;
  const allMetrics = parseJson<MetricMap>(p.metrics, {});
  const allVideos = parseJson<VideoMap>(p.videos, {});

  const metrics: MetricMap = {};
  for (const key of POSITIONS[position].metrics as readonly MetricKey[]) {
    if (allMetrics[key]) metrics[key] = allMetrics[key];
  }
  const videos: VideoMap = {};
  for (const clip of VIDEO_CLIPS[POSITIONS[position].group]) {
    if (allVideos[clip.key]) videos[clip.key] = allVideos[clip.key];
  }

  return {
    player: {
      firstName: p.firstName,
      lastName: p.lastName,
      playerType: p.playerType,
      school: p.school,
      state: p.state,
      gradYear: p.gradYear!,
      heightInches: p.heightInches!,
      weightLbs: p.weightLbs!,
      position,
      throws: p.throws!,
      bats: p.bats!,
    },
    metrics,
    videos,
  };
}
