export const TIER_POINTS = {
  plankton: 10,
  tooclever: 15,
  schooler: 30,
  rare: 60,
  deepcut: 85,
  krillion: 100,
} as const;

export type Tier = keyof typeof TIER_POINTS;
export type Today = {
  date: string;
  dayNumber: number;
  resetsAt: string;
  prompts: { id: string; text: string }[];
};
export type Submission = {
  date: string;
  promptId: string;
  answer: string;
  previewCorrection: boolean;
  playerId: string;
};
export type Verdict =
  | { kind: "accepted"; answer: string; tier: Tier; score: number }
  | { kind: "correction"; correction: string }
  | { kind: "rejected" };

export class KrillionApiError extends Error {
  reason: "http" | "timeout" | "network" | "contract";
  status?: number;

  constructor(reason: KrillionApiError["reason"], message: string, status?: number) {
    super(message);
    this.name = "KrillionApiError";
    this.reason = reason;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireShape(condition: unknown, message: string): asserts condition {
  if (!condition) throw new KrillionApiError("contract", message);
}

function parseToday(value: unknown): Today {
  requireShape(isRecord(value), "Invalid daily response");
  requireShape(
    typeof value.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.date),
    "Invalid daily date",
  );
  requireShape(
    typeof value.dayNumber === "number" && Number.isInteger(value.dayNumber) && value.dayNumber > 0,
    "Invalid day number",
  );
  requireShape(
    typeof value.resetsAt === "string" && Number.isFinite(Date.parse(value.resetsAt)),
    "Invalid reset time",
  );
  requireShape(
    Array.isArray(value.prompts) && value.prompts.length === 7,
    "Expected seven daily questions",
  );
  const prompts = value.prompts.map((prompt) => {
    requireShape(
      isRecord(prompt) &&
        typeof prompt.id === "string" &&
        prompt.id.length > 0 &&
        typeof prompt.text === "string" &&
        prompt.text.trim().length > 0,
      "Invalid question",
    );
    return { id: prompt.id, text: prompt.text };
  });
  requireShape(new Set(prompts.map((prompt) => prompt.id)).size === 7, "Duplicate question IDs");
  return { date: value.date, dayNumber: value.dayNumber, resetsAt: value.resetsAt, prompts };
}

function parseVerdict(value: unknown, rawAnswer: string): Verdict {
  requireShape(
    isRecord(value) && typeof value.accepted === "boolean",
    "Invalid submission response",
  );
  if (value.correction !== undefined) {
    requireShape(
      typeof value.correction === "string" && value.correction.trim().length > 0,
      "Invalid correction",
    );
    return { kind: "correction", correction: value.correction };
  }
  if (!value.accepted) return { kind: "rejected" };
  requireShape(
    typeof value.tier === "string" && Object.hasOwn(TIER_POINTS, value.tier),
    "Unknown accepted tier",
  );
  const tier = value.tier as Tier;
  const score = value.score ?? TIER_POINTS[tier];
  const answer = value.answer ?? rawAnswer;
  requireShape(
    typeof score === "number" && score === TIER_POINTS[tier],
    "Native score contract changed",
  );
  requireShape(typeof answer === "string" && answer.trim().length > 0, "Invalid canonical answer");
  return { kind: "accepted", answer, tier, score };
}

export function createKrillionClient({ baseUrl = "https://krillion.io", timeoutMs = 10_000 } = {}) {
  async function request(path: string, init?: RequestInit): Promise<unknown> {
    try {
      const response = await fetch(new URL(path, baseUrl), {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok)
        throw new KrillionApiError("http", `Krillion HTTP ${response.status}`, response.status);
      return await response.json();
    } catch (error) {
      if (error instanceof KrillionApiError) throw error;
      if (error instanceof SyntaxError)
        throw new KrillionApiError("contract", "Krillion returned malformed JSON");
      if (error instanceof Error && error.name === "TimeoutError")
        throw new KrillionApiError("timeout", "Krillion request timed out");
      throw new KrillionApiError("network", "Krillion request failed");
    }
  }

  return {
    async getToday(): Promise<Today> {
      return parseToday(await request("/api/today"));
    },
    async submit(input: Submission): Promise<Verdict> {
      requireShape(
        /^\d{4}-\d{2}-\d{2}$/.test(input.date) &&
          input.promptId.trim().length > 0 &&
          input.playerId.trim().length > 0,
        "Invalid submission identifiers",
      );
      requireShape(
        input.answer.trim().length > 0 &&
          input.answer.length <= 256 &&
          typeof input.previewCorrection === "boolean",
        "Invalid answer submission",
      );
      const body = {
        date: input.date,
        promptId: input.promptId,
        answer: input.answer,
        previewCorrection: input.previewCorrection,
        playerId: input.playerId,
      };
      return parseVerdict(
        await request("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        input.answer,
      );
    },
  };
}
