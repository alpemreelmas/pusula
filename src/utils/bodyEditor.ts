import { BotSections } from "../types";
import { renderBotSection } from "./formatter";

const START = "<!-- pr-bot:start -->";
const END = "<!-- pr-bot:end -->";
const BOT_SECTION_REGEX = /<!-- pr-bot:start -->[\s\S]*?<!-- pr-bot:end -->/;

export function stripBotSection(body: string | null): string {
  if (!body) return "";
  return body.replace(BOT_SECTION_REGEX, "").trimEnd();
}

export function injectBotSection(body: string, sections: BotSections): string {
  const clean = stripBotSection(body);
  const rendered = renderBotSection(sections);
  const separator = clean.length > 0 ? "\n\n" : "";
  return `${clean}${separator}${START}\n${rendered}\n${END}`;
}
