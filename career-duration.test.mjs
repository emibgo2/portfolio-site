import test from "node:test";
import assert from "node:assert/strict";
import { formatCareerDuration } from "./career-duration.mjs";

test("입사월 기준으로 경력을 계산한다", () => {
  assert.equal(formatCareerDuration("2023-02", new Date("2026-10-19T00:00:00+09:00")), "3년 8개월");
  assert.equal(formatCareerDuration("2023-02", new Date("2027-02-01T00:00:00+09:00")), "4년");
  assert.equal(formatCareerDuration("2023-02", new Date("2023-02-01T00:00:00+09:00")), "0개월");
});

test("한국 시간의 월 경계에서 갱신한다", () => {
  assert.equal(formatCareerDuration("2023-02", new Date("2026-10-31T14:59:59Z")), "3년 8개월");
  assert.equal(formatCareerDuration("2023-02", new Date("2026-10-31T15:00:00Z")), "3년 9개월");
});
