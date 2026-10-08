import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSinkingLogo,
  stepSinkingLogo,
  roundedCardContact,
  type OceanBounds,
} from "../src/lib/ocean-physics.ts";
import { companyLogos } from "../src/lib/company-logos.ts";

const bounds: OceanBounds = {
  width: 1000,
  height: 800,
  cardLeft: 100,
  cardRight: 900,
  cardTop: 600,
  cardBottom: 1000,
  cardRadius: 24,
};
const random = () => 0.5;

test("contact normals point away from each card face", () => {
  for (const [x, y, normalX, normalY] of [
    [95, 700, -1, 0],
    [905, 700, 1, 0],
    [500, 595, 0, -1],
    [500, 1005, 0, 1],
  ]) {
    const contact = roundedCardContact(x, y, 8, bounds);
    assert.ok(contact);
    assert.equal(contact.normalX, normalX);
    assert.equal(contact.normalY, normalY);
  }
});

test("rounded corners leave empty space and give diagonal bounce normals", () => {
  assert.equal(roundedCardContact(100, 600, 8, bounds), null);
  const contact = roundedCardContact(104, 604, 8, bounds);
  assert.ok(contact);
  assert.ok(contact.normalX < -0.7 && contact.normalY < -0.7);
});

test("side contacts push a logo outwards without trapping its descent", () => {
  for (const side of ["left", "right"]) {
    const logo = createSinkingLogo(bounds, random, 700);
    logo.phase = side === "left" ? 0 : Math.PI;
    logo.originX = side === "left" ? 92.1 : 907.9;
    logo.x = logo.originX;
    assert.equal(stepSinkingLogo(logo, 1 / 60, bounds, random), true);
    assert.ok(side === "left" ? logo.drift < 0 : logo.drift > 0);
    assert.ok(logo.velocityY > 0);
    assert.equal(stepSinkingLogo(logo, 1 / 60, bounds, random), false);
  }
});

test("a logo bounces once and then sinks behind the card", () => {
  const logo = createSinkingLogo(bounds, random, 580);
  let hits = 0;
  let bounceY = 0;
  let highestY = Infinity;
  for (let frame = 0; frame < 60 * 12; frame++) {
    if (stepSinkingLogo(logo, 1 / 60, bounds, random)) {
      hits++;
      bounceY = logo.y;
      assert.ok(logo.velocityY < 0);
    }
    if (logo.collided) highestY = Math.min(highestY, logo.y);
  }
  assert.equal(hits, 1);
  assert.ok(highestY < bounceY - 10, "the logo visibly rises after collision");
  assert.ok(logo.y > bounds.cardTop + 100, "the card does not trap the logo");
});

test("logos outside the card do not bounce", () => {
  const logo = createSinkingLogo(bounds, random, 580);
  logo.originX = 50;
  for (let frame = 0; frame < 120; frame++) stepSinkingLogo(logo, 1 / 60, bounds, random);
  assert.equal(logo.collided, false);
  assert.ok(logo.y > bounds.cardTop);
});

test("long gaps do not cause a large simulation jump", () => {
  const logo = createSinkingLogo(bounds, random, 100);
  stepSinkingLogo(logo, 60, bounds, random);
  assert.ok(logo.y - 100 < 2);
});

test("logo selection stays broad and includes only the approved LLM developers", () => {
  const ids = new Set<string>(companyLogos.map((logo) => logo.id));
  assert.equal(ids.size, companyLogos.length);
  assert.ok(ids.size >= 20);
  for (const id of ["mistral", "deepseek", "apple"]) assert.ok(ids.has(id));
  for (const id of ["elevenlabs", "runway", "groq", "perplexity", "fireworks", "sambanova"]) {
    assert.equal(ids.has(id), false);
  }
});
