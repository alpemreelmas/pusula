import { stripBotSection, injectBotSection } from "../../src/utils/bodyEditor";
import { BotSections } from "../../src/types";

const EMPTY_SECTIONS: BotSections = {
  relatedPRs: [],
  dependsOn: null,
  hasEnvChange: false,
};

const PR_SUMMARY = {
  number: 12,
  title: "ABC-123: other fix",
  url: "https://github.com/owner/repo/pull/12",
  branch: "feature/abc-123",
  state: "open" as const,
  createdAt: "2024-01-01T00:00:00Z",
};

describe("stripBotSection", () => {
  it("returns empty string for null body", () => {
    expect(stripBotSection(null)).toBe("");
  });

  it("returns original body when no bot section", () => {
    expect(stripBotSection("some content")).toBe("some content");
  });

  it("removes bot section from body", () => {
    const body = "original\n\n<!-- pr-bot:start -->\n---\nstuff\n<!-- pr-bot:end -->";
    expect(stripBotSection(body)).toBe("original");
  });

  it("handles body that is only bot section", () => {
    const body = "<!-- pr-bot:start -->\n---\n<!-- pr-bot:end -->";
    expect(stripBotSection(body)).toBe("");
  });
});

describe("injectBotSection", () => {
  it("appends bot section to empty body", () => {
    const result = injectBotSection("", EMPTY_SECTIONS);
    expect(result).toContain("<!-- pr-bot:start -->");
    expect(result).toContain("<!-- pr-bot:end -->");
  });

  it("appends bot section after existing content", () => {
    const result = injectBotSection("my description", EMPTY_SECTIONS);
    expect(result.startsWith("my description")).toBe(true);
  });

  it("replaces existing bot section (idempotent)", () => {
    const first = injectBotSection("desc", EMPTY_SECTIONS);
    const second = injectBotSection(first, EMPTY_SECTIONS);
    const count = (second.match(/<!-- pr-bot:start -->/g) ?? []).length;
    expect(count).toBe(1);
  });

  it("renders related PRs in bot section", () => {
    const result = injectBotSection("", {
      ...EMPTY_SECTIONS,
      relatedPRs: [PR_SUMMARY],
    });
    expect(result).toContain("[#12](https://github.com/owner/repo/pull/12)");
    expect(result).toContain("OPEN");
  });

  it("renders depends-on in bot section", () => {
    const result = injectBotSection("", {
      ...EMPTY_SECTIONS,
      dependsOn: PR_SUMMARY,
    });
    expect(result).toContain("**Depends on**");
    expect(result).toContain("[#12]");
  });

  it("renders env-change warning", () => {
    const result = injectBotSection("", { ...EMPTY_SECTIONS, hasEnvChange: true });
    expect(result).toContain(".env.example");
  });
});
