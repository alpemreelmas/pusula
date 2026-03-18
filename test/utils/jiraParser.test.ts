import { parseJiraKeys } from "../../src/utils/jiraParser";

describe("parseJiraKeys", () => {
  it("extracts a single JIRA key", () => {
    expect(parseJiraKeys("ABC-123: fix login")).toEqual(["ABC-123"]);
  });

  it("extracts multiple JIRA keys", () => {
    expect(parseJiraKeys("ABC-123 and DEF-456 fix")).toEqual(["ABC-123", "DEF-456"]);
  });

  it("deduplicates repeated keys", () => {
    expect(parseJiraKeys("ABC-123 fix ABC-123 again")).toEqual(["ABC-123"]);
  });

  it("returns empty array when no key present", () => {
    expect(parseJiraKeys("fix login bug")).toEqual([]);
  });

  it("ignores lowercase patterns", () => {
    expect(parseJiraKeys("abc-123 fix")).toEqual([]);
  });

  it("handles key at end of string", () => {
    expect(parseJiraKeys("fix for PROJ-99")).toEqual(["PROJ-99"]);
  });
});
