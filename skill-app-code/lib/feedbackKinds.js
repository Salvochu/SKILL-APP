// The four kinds of feedback a client can send, in the order offered.
export const FEEDBACK_KINDS = [
  { key: "bug", label: "Something's broken", short: "Bug" },
  { key: "video", label: "Missing or wrong video", short: "Video" },
  { key: "idea", label: "Idea for the app", short: "Idea" },
  { key: "other", label: "Something else", short: "Other" },
];

export const FEEDBACK_KIND_LABEL = Object.fromEntries(FEEDBACK_KINDS.map((k) => [k.key, k.short]));
