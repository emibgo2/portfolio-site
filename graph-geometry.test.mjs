import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createScatterLayout,
  projectScatterNode,
  getQualityProfile,
  getLoopedX
} from "./graph-geometry.mjs";

test("creates a stable scattered layout without forcing nodes onto a circle", () => {
  const nodes = createScatterLayout(8);

  assert.equal(nodes.length, 8);
  assert.deepEqual(nodes[0], {
    x: -4.15,
    y: 1.82,
    z: 0.42,
    layer: 0
  });
  assert.equal(nodes[4].x, 2.82);
  assert.equal(nodes[1].layer, 1);
  assert.equal(nodes[1].z, -0.2);
  assert.notEqual(Math.hypot(nodes[0].x, nodes[0].y), Math.hypot(nodes[1].x, nodes[1].y));
});

test("uses the full hero field instead of keeping logos in one side", () => {
  const nodes = createScatterLayout(14);
  const xs = nodes.map((node) => node.x);

  assert.ok(Math.min(...xs) <= -4);
  assert.ok(Math.max(...xs) >= 4);
});

test("projects a scattered node into finite screen coordinates with perspective", () => {
  const node = { x: -1.7, y: 1.22, z: 0.42, layer: 0 };
  const point = projectScatterNode(node, {
    width: 1200,
    height: 640,
    centerX: 360,
    centerY: 320,
    rotation: 0,
    tilt: 0.18
  });

  assert.ok(Number.isFinite(point.x));
  assert.ok(Number.isFinite(point.y));
  assert.ok(point.scale > 0);
  assert.ok(point.depth > 0 && point.depth < 1);
  assert.ok(point.x >= 0 && point.x <= 1200);
});

test("caps render quality for high-density screens and keeps mobile light", () => {
  assert.deepEqual(getQualityProfile(1440, 640, 3), {
    mobile: false,
    pixelRatio: 1.5,
    nodeCount: 16,
    curveSegments: 16,
    logoDepth: 5.8,
    logoScale: 0.7,
    layoutSpread: 1.24,
    haloOpacity: 0.24
  });
  assert.deepEqual(getQualityProfile(390, 760, 3), {
    mobile: true,
    pixelRatio: 1,
    nodeCount: 10,
    curveSegments: 10,
    logoDepth: 5.8,
    logoScale: 0.7,
    layoutSpread: 1.08,
    haloOpacity: 0.24
  });
});

test("keeps scattered logos visibly extruded and bright enough on dark backgrounds", () => {
  const profile = getQualityProfile(1440, 640, 2);

  assert.equal(profile.logoDepth, 5.8);
  assert.equal(profile.haloOpacity, 0.24);
});

test("moves logos from right to left and wraps them back into the right side", () => {
  const bounds = { left: -6.8, right: 6.8 };

  assert.ok(Math.abs(getLoopedX(1, 0, { speed: 0.2, ...bounds }) - 1) < 1e-9);
  assert.ok(Math.abs(getLoopedX(1, 1000, { speed: 0.2, ...bounds }) - 0.8) < 1e-9);
  assert.ok(Math.abs(getLoopedX(-6.7, 1000, { speed: 0.2, ...bounds }) - 6.7) < 1e-9);
  assert.ok(Math.abs(getLoopedX(2, 68000, { speed: 0.2, ...bounds }) - 2) < 1e-9);
});

test("reduces logo scale and increases scatter spacing for a cleaner field", () => {
  const profile = getQualityProfile(1440, 640, 2);

  assert.equal(profile.logoScale, 0.7);
  assert.equal(profile.layoutSpread, 1.24);
  assert.ok(profile.logoScale < 1);
  assert.ok(profile.layoutSpread > 1);
});

test("adds a dark content backdrop so moving logos do not reduce text contrast", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(css, /\.shell::before\{/);
  const backdrop = css.match(/\.shell::before\{[^}]*background:rgba\(10,11,12,([.\d]+)\)/);
  assert.ok(backdrop, "content has a dark backdrop");
  assert.ok(Number(backdrop[1]) >= .9, "backdrop blocks at least 90% of moving logo brightness");
});
