import { test, expect } from "bun:test";
import { workerLoginEmail } from "./staff-login-id";

test("ID-only workers use deterministic case-insensitive credentials", () => {
  expect(workerLoginEmail("  Worker-123  ")).toBe("worker-123@staff.mynus360.invalid");
});
test("worker IDs cannot be email addresses or unsafe characters", () => {
  expect(() => workerLoginEmail("owner@example.com")).toThrow();
  expect(() => workerLoginEmail("staff name")).toThrow();
});