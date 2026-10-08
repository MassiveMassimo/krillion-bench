import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

for (const args of [
  [],
  ["submit"],
  ["today", "unexpected"],
  ["submit", "2026-10-08", "p1", "answer", "player", "--unknown"],
]) {
  test(`rejects invalid CLI arguments ${JSON.stringify(args)} without a submission`, () => {
    const result = spawnSync(process.execPath, ["scripts/krillion.ts", ...args], {
      encoding: "utf8",
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage:/);
    assert.equal(result.stdout, "");
  });
}
