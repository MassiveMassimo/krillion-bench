import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { test } from "node:test";
import { createKrillionClient, KrillionApiError } from "../src/krillion/client.ts";

const today = {
  date: "2026-10-08",
  dayNumber: 85,
  resetsAt: "2026-10-09T04:00:00.000Z",
  prompts: Array.from({ length: 7 }, (_, index) => ({
    id: `p${index + 1}`,
    text: `Synthetic question ${index + 1}`,
  })),
};

const submission = {
  date: today.date,
  promptId: "p1",
  answer: "Calibration answer",
  previewCorrection: true,
  playerId: "test-player",
};

async function withServer(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
  run: (client: ReturnType<typeof createKrillionClient>) => Promise<void>,
  timeoutMs = 1_000,
) {
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(createKrillionClient({ baseUrl: `http://127.0.0.1:${address.port}`, timeoutMs }));
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("retrieves all seven question IDs and texts", async () => {
  await withServer(
    (request, response) => {
      assert.equal(request.url, "/api/today");
      response.end(JSON.stringify(today));
    },
    async (client) => {
      assert.deepEqual(await client.getToday(), today);
    },
  );
});

test("submits the exact daily request and preserves the native score", async () => {
  let received: unknown;
  await withServer(
    (request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => {
        received = JSON.parse(Buffer.concat(chunks).toString());
        response.end(
          JSON.stringify({ accepted: true, answer: "Canonical answer", tier: "rare", score: 60 }),
        );
      });
    },
    async (client) => {
      assert.deepEqual(await client.submit(submission), {
        kind: "accepted",
        answer: "Canonical answer",
        tier: "rare",
        score: 60,
      });
      assert.deepEqual(received, submission);
    },
  );
});

for (const [label, body, expected] of [
  [
    "correction",
    { accepted: false, correction: "Corrected spelling" },
    { kind: "correction", correction: "Corrected spelling" },
  ],
  ["rejection", { accepted: false }, { kind: "rejected" }],
]) {
  test(`keeps ${label} distinct from acceptance`, async () => {
    await withServer(
      (_request, response) => response.end(JSON.stringify(body)),
      async (client) => {
        assert.deepEqual(await client.submit(submission), expected);
      },
    );
  });
}

test("classifies a timeout after response headers as incomplete, not rejection", async () => {
  await withServer(
    (_request, response) => {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.flushHeaders();
    },
    async (client) => {
      await assert.rejects(
        client.submit(submission),
        (error) => error instanceof KrillionApiError && error.reason === "timeout",
      );
    },
    50,
  );
});

for (const status of [403, 429]) {
  test(`reports HTTP ${status} without retrying or awarding a miss`, async () => {
    let requests = 0;
    await withServer(
      (_request, response) => {
        requests += 1;
        response.writeHead(status);
        response.end(JSON.stringify({ error: "Denied" }));
      },
      async (client) => {
        await assert.rejects(
          client.submit(submission),
          (error) =>
            error instanceof KrillionApiError && error.reason === "http" && error.status === status,
        );
        assert.equal(requests, 1);
      },
    );
  });
}

for (const [label, body] of [
  ["unknown tier", { accepted: true, answer: "Example", tier: "unknown", score: 60 }],
  ["changed native score", { accepted: true, answer: "Example", tier: "rare", score: 99 }],
  ["missing verdict", { error: "Server failure" }],
]) {
  test(`rejects ${label} as a response contract failure`, async () => {
    await withServer(
      (_request, response) => response.end(JSON.stringify(body)),
      async (client) => {
        await assert.rejects(
          client.submit(submission),
          (error) => error instanceof KrillionApiError && error.reason === "contract",
        );
      },
    );
  });
}

test("reports malformed JSON as a response contract failure", async () => {
  await withServer(
    (_request, response) => response.end("{broken"),
    async (client) => {
      await assert.rejects(
        client.getToday(),
        (error) => error instanceof KrillionApiError && error.reason === "contract",
      );
    },
  );
});

test("rejects duplicate daily question IDs", async () => {
  const duplicate = { ...today, prompts: today.prompts.map((prompt) => ({ ...prompt, id: "p1" })) };
  await withServer(
    (_request, response) => response.end(JSON.stringify(duplicate)),
    async (client) => {
      await assert.rejects(
        client.getToday(),
        (error) => error instanceof KrillionApiError && error.reason === "contract",
      );
    },
  );
});

test("rejects missing daily questions", async () => {
  await withServer(
    (_request, response) =>
      response.end(JSON.stringify({ ...today, prompts: today.prompts.slice(1) })),
    async (client) => {
      await assert.rejects(
        client.getToday(),
        (error) => error instanceof KrillionApiError && error.reason === "contract",
      );
    },
  );
});

test("maps all native tiers when the optional score is absent", async () => {
  for (const [tier, score] of Object.entries({
    plankton: 10,
    tooclever: 15,
    schooler: 30,
    rare: 60,
    deepcut: 85,
    krillion: 100,
  })) {
    await withServer(
      (_request, response) => response.end(JSON.stringify({ accepted: true, tier })),
      async (client) => {
        assert.deepEqual(await client.submit(submission), {
          kind: "accepted",
          answer: submission.answer,
          tier,
          score,
        });
      },
    );
  }
});
