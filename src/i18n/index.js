import zhCN from "./zh-CN.js";
import zhHK from "./zh-HK.js";
import zhTW from "./zh-TW.js";
import en from "./en.js";

export const LOCALES = [
  { code: "zh-CN", label: "简体中文", short: "简体" },
  { code: "zh-HK", label: "中文（香港）", short: "香港" },
  { code: "zh-TW", label: "中文（台灣）", short: "台灣" },
  { code: "en", label: "English", short: "EN" },
];

export const MESSAGES = {
  "zh-CN": zhCN,
  "zh-HK": zhHK,
  "zh-TW": zhTW,
  en,
};

export function getMessage(locale, path) {
  const table = MESSAGES[locale] || MESSAGES.en;
  return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), table);
}
