import assert from "node:assert/strict";
import { test } from "node:test";
import { createPilotBudget, usdToNanos } from "../src/evaluation/budget.ts";

test("rounds tiny USD charges up and accepts catalog decimals and numeric exponents", () => {
  assert.equal(usdToNanos("0.00000025"), 250n);
  assert.equal(usdToNanos(4e-7), 400n);
  assert.equal(usdToNanos("0.0000000001"), 1n);
  assert.equal(usdToNanos("1.0000000001"), 1_000_000_001n);
  for (const amount of [NaN, Infinity, -1, "-0.1", "", "1e1000"])
    assert.throws(() => usdToNanos(amount));
});

test("shares the US$10 cap, blocks overlapping calls, and reconciles only once", () => {
  const budget = createPilotBudget();
  budget.reserve(6_000_000_000n);
  assert.throws(() => budget.reserve(1n), /stopped/);
  budget.reconcile(4_000_000_000n);
  assert.throws(() => budget.reconcile(1n), /reconciliation/);
  assert.throws(() => budget.reserve(6_000_000_001n), /exhausted/);
  budget.reserve(6_000_000_000n);
  budget.reconcile(6_000_000_000n);
  assert.throws(() => budget.reserve(1n), /exhausted/);
  assert.equal(budget.snapshot().spentNanos, "10000000000");
});

test("retains unknown reservations and stops restored or halted pilots", () => {
  const budget = createPilotBudget();
  budget.reserve(100n);
  const restored = createPilotBudget(JSON.parse(JSON.stringify(budget.snapshot())));
  assert.equal(restored.snapshot().reservedNanos, "100");
  assert.throws(() => restored.reserve(1n), /stopped/);
  restored.reconcile(80n);
  assert.throws(() => restored.reserve(1n), /stopped/);
  budget.halt();
  assert.throws(() => budget.reserve(1n), /stopped/);
});

test("records an over-reservation charge before stopping and cannot raise the cap", () => {
  const budget = createPilotBudget();
  budget.reserve(10n);
  assert.throws(() => budget.reconcile(11n), /exceeded/);
  assert.equal(budget.snapshot().spentNanos, "11");
  assert.throws(() => budget.reserve(1n), /stopped/);
  assert.throws(() => createPilotBudget({ ...budget.snapshot(), capNanos: "10000000001" }));
  assert.throws(() => createPilotBudget({ ...budget.snapshot(), spentNanos: "0.1" }));
  assert.throws(() => createPilotBudget({ ...budget.snapshot(), reservedNanos: "-1" }));
});
