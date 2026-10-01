import type { PositionGroup } from "@/lib/domain";

// Video script and rules shown to players before they record.
// PLACEHOLDER CONTENT: replace the rules and per-clip instructions with the
// official video script. Clip keys are stored on profiles, so rename a key
// only if you are fine with players re-entering that link.

export const GENERAL_VIDEO_RULES: string[] = [
  "Upload each clip to YouTube (unlisted is fine), Hudl, Vimeo or Google Drive and paste the share link.",
  "Film in landscape, with the camera steady (tripod or fence mount).",
  "Do not edit, slow down or speed up clips. One continuous take per clip.",
  "Velocity and timing proof must show the radar / TrackMan / Rapsodo / stopwatch readout in the same shot as the rep.",
  "Clips must be recorded within the last 6 months.",
];

export type VideoClip = {
  key: string;
  label: string;
  instructions: string;
  required: boolean;
  isProof?: boolean; // proof-of-metric clip (radar, TrackMan, Rapsodo, timer)
};

const hittingClips: VideoClip[] = [
  {
    key: "hitting",
    label: "Hitting – batting practice",
    instructions: "10 swings off front toss or BP, filmed from the open side (facing the hitter).",
    required: true,
  },
  {
    key: "exitVeloProof",
    label: "Exit velocity proof",
    instructions: "At least 3 swings with the exit velocity readout (TrackMan, HitTrax, Rapsodo or radar) visible.",
    required: true,
    isProof: true,
  },
  {
    key: "running",
    label: "60-yard dash",
    instructions: "Full 60-yard run filmed from the side with a visible timer, or from a timed event.",
    required: false,
    isProof: true,
  },
];

export const VIDEO_CLIPS: Record<PositionGroup, VideoClip[]> = {
  PITCHER: [
    {
      key: "velocityProof",
      label: "Velocity proof",
      instructions:
        "Live or bullpen pitches with the radar gun, TrackMan or Rapsodo readout visible for every pitch type (fastball, breaking ball, changeup).",
      required: true,
      isProof: true,
    },
    {
      key: "bullpenSide",
      label: "Bullpen – side view",
      instructions: "15 pitches filmed from the open (arm) side, full body in frame.",
      required: true,
    },
    {
      key: "bullpenBehind",
      label: "Bullpen – behind the mound",
      instructions: "15 pitches filmed from directly behind the mound, catcher visible.",
      required: true,
    },
  ],
  CATCHER: [
    {
      key: "throwdowns",
      label: "Throwdowns / pop time proof",
      instructions: "5 throws to 2nd base with a visible stopwatch or pop-time readout and the radar reading for throw velocity.",
      required: true,
      isProof: true,
    },
    {
      key: "receiving",
      label: "Receiving & blocking",
      instructions: "Receiving 10 pitches and blocking 5 balls in the dirt, filmed from behind the catcher.",
      required: true,
    },
    ...hittingClips,
  ],
  INFIELD: [
    {
      key: "defense",
      label: "Infield defense",
      instructions: "Ground balls to your glove side, backhand and straight on, with full throws across the infield.",
      required: true,
    },
    {
      key: "throwVeloProof",
      label: "Throwing velocity proof",
      instructions: "3 throws across the infield with the radar readout visible.",
      required: true,
      isProof: true,
    },
    ...hittingClips,
  ],
  OUTFIELD: [
    {
      key: "defense",
      label: "Outfield defense",
      instructions: "Fly balls and ground balls with throws to a base, filmed from the side.",
      required: true,
    },
    {
      key: "throwVeloProof",
      label: "Throwing velocity proof",
      instructions: "3 max-effort throws with the radar readout visible.",
      required: true,
      isProof: true,
    },
    ...hittingClips,
  ],
};
