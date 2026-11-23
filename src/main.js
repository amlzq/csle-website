import { LOCALES, getMessage } from "./i18n/index.js";

const LANG_KEY = "csle-lang";
const PRODUCT_KEY = "csle-doc-product";
const THEME_KEY = "csle-theme";

const DEMO_GLYPHS = {
  cn: { program: "程序", error: "异常", please: "请", check: "检查", network: "网络" },
  hk: { program: "程式", error: "異常", please: "請", check: "檢查", network: "網絡" },
  tw: { program: "程式", error: "異常", please: "請", check: "檢查", network: "網路" },
  t: { program: "程式", error: "異常", please: "請", check: "檢查", network: "網路" },
};

function demoPhrase(glyph) {
  const words = DEMO_GLYPHS[glyph] || DEMO_GLYPHS.cn;
  return `${words.program}${words.error}，${words.please}${words.check}${words.network}`;
}

function detectLocale() {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (LOCALES.some((item) => item.code === fromUrl)) return fromUrl;

  const saved = window.localStorage.getItem(LANG_KEY);
  if (LOCALES.some((item) => item.code === saved)) return saved;

  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language || ""];
  for (const candidate of candidates) {
    const browser = candidate.toLowerCase();
    if (browser.startsWith("zh-hk") || browser.startsWith("zh-mo")) return "zh-HK";
    if (browser.startsWith("zh-tw") || browser.startsWith("zh-hant")) return "zh-TW";
    if (browser.startsWith("zh")) return "zh-CN";
    if (browser.startsWith("en")) return "en";
  }
  return "en";
}

let currentLocale = detectLocale();

function translateValue(locale, key) {
  const value = getMessage(locale, key);
  return value === undefined ? getMessage("en", key) : value;
}

const DROPDOWN_CHANGE = "dropdown:change";

function syncDropdownSelection(picker, value) {
  if (!picker) return null;
  const options = Array.from(picker.querySelectorAll("[data-dropdown-option]"));
  const selected = options.find((option) => option.dataset.dropdownOption === value) || null;
  options.forEach((option) => option.setAttribute("aria-selected", String(option === selected)));
  picker.dataset.currentValue = selected ? selected.dataset.dropdownOption : value;

  const current = picker.querySelector("[data-dropdown-current]");
  if (current && selected) {
    current.textContent = selected.textContent;
    if (selected.dataset.i18n) current.dataset.i18n = selected.dataset.i18n;
    else delete current.dataset.i18n;
  }
  return selected;
}

function initDropdowns() {
  const pickers = Array.from(document.querySelectorAll("[data-dropdown]"));
  if (!pickers.length) return;

  const closeAll = (except) => {
    pickers.forEach((picker) => {
      if (picker === except) return;
      picker.classList.remove("is-open");
      const menu = picker.querySelector("[data-dropdown-menu]");
      const toggle = picker.querySelector("[data-dropdown-toggle]");
      if (menu) menu.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  };

  pickers.forEach((picker) => {
    const toggle = picker.querySelector("[data-dropdown-toggle]");
    const menu = picker.querySelector("[data-dropdown-menu]");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = !menu.classList.contains("is-open");
      closeAll(picker);
      picker.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });

    menu.addEventListener("click", (event) => event.stopPropagation());
    menu.querySelectorAll("[data-dropdown-option]").forEach((option) => {
      option.addEventListener("click", () => {
        syncDropdownSelection(picker, option.dataset.dropdownOption);
        closeAll();
        toggle.focus();
        picker.dispatchEvent(new CustomEvent(DROPDOWN_CHANGE, {
          bubbles: true,
          detail: { value: option.dataset.dropdownOption, picker },
        }));
      });
    });
  });

  document.addEventListener("click", () => closeAll());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll();
  });
}

function detectTheme() {
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", String(theme === "dark"));
  });
  const label = document.querySelector("[data-theme-label]");
  if (label) label.textContent = translateValue(currentLocale, `theme.${theme}`);
}

function initTheme() {
  applyTheme(detectTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  });

  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (media) {
    const listener = (event) => {
      if (!window.localStorage.getItem(THEME_KEY)) applyTheme(event.matches ? "dark" : "light");
    };
    if (media.addEventListener) media.addEventListener("change", listener);
    else media.addListener(listener);
  }
}

function applyI18n(locale) {
  document.documentElement.lang = locale;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = translateValue(locale, element.dataset.i18n);
    if (value !== undefined) element.textContent = value;
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const value = translateValue(locale, element.dataset.i18nHtml);
    if (value !== undefined) element.innerHTML = value;
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    element.dataset.i18nAttr.split("|").forEach((rule) => {
      const [attr, key] = rule.split(":");
      const value = translateValue(locale, key);
      if (attr && value !== undefined) element.setAttribute(attr, value);
    });
  });

  syncDropdownSelection(document.querySelector("[data-lang-picker]"), locale);
}

function setLocale(locale) {
  if (!LOCALES.some((item) => item.code === locale)) return;
  currentLocale = locale;
  window.localStorage.setItem(LANG_KEY, locale);

  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

  applyI18n(locale);
  applyTheme(document.documentElement.dataset.theme || detectTheme());
  const productPicker = document.querySelector("[data-product-picker]");
  if (productPicker) {
    syncDropdownSelection(productPicker, productPicker.dataset.currentValue || "vscode");
  }
}

function initLanguageSwitcher() {
  const picker = document.querySelector("[data-lang-picker]");
  if (picker) {
    picker.addEventListener(DROPDOWN_CHANGE, (event) => setLocale(event.detail.value));
  }
  applyI18n(currentLocale);
}

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) close();
  });
}

function initDemo() {
  const sourcePicker = document.querySelector("[data-demo-source]");
  const targetPicker = document.querySelector("[data-demo-target]");
  const before = document.querySelector("[data-demo-before]");
  const after = document.querySelector("[data-demo-after]");
  if (!sourcePicker || !targetPicker || !before || !after) return;

  const params = new URLSearchParams(window.location.search);
  const readGlyph = (name, fallback) => {
    const value = params.get(name);
    return value && DEMO_GLYPHS[value] ? value : fallback;
  };
  const updateUrl = (source, target) => {
    const url = new URL(window.location.href);
    url.searchParams.set("source", source);
    url.searchParams.set("target", target);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  sourcePicker.dataset.currentValue = readGlyph("source", sourcePicker.dataset.currentValue || "cn");
  targetPicker.dataset.currentValue = readGlyph("target", targetPicker.dataset.currentValue || "hk");

  const renderDemo = () => {
    const source = sourcePicker.dataset.currentValue || "cn";
    const target = targetPicker.dataset.currentValue || "hk";
    syncDropdownSelection(sourcePicker, source);
    syncDropdownSelection(targetPicker, target);
    before.innerHTML = `const message = '<span class="demo-warning">${demoPhrase(source)}</span>';`;
    after.textContent = `const message = '${demoPhrase(target)}';`;
    updateUrl(source, target);
  };

  [sourcePicker, targetPicker].forEach((picker) => {
    picker.addEventListener(DROPDOWN_CHANGE, renderDemo);
  });
  renderDemo();
}

function initProductSwitch() {
  const picker = document.querySelector("[data-product-picker]");
  if (!picker) return;

  const setProduct = (product) => {
    if (product !== "intellij" && product !== "vscode") return;
    syncDropdownSelection(picker, product);
    document.querySelectorAll("[data-product]").forEach((element) => {
      element.hidden = element.dataset.product !== product;
    });
    window.sessionStorage.setItem(PRODUCT_KEY, product);

    const url = new URL(window.location.href);
    url.searchParams.set("p", product);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  picker.addEventListener(DROPDOWN_CHANGE, (event) => setProduct(event.detail.value));

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("p") || params.get("product");
  const saved = window.sessionStorage.getItem(PRODUCT_KEY);
  const initial = fromUrl === "intellij" || fromUrl === "vscode"
    ? fromUrl
    : saved === "intellij" ? "intellij" : "vscode";
  setProduct(initial);
}

function initCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.parentElement.querySelector("pre code");
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = translateValue(currentLocale, "common.copied");
        window.setTimeout(() => {
          button.textContent = translateValue(currentLocale, "common.copy");
        }, 1600);
      } catch {
        button.textContent = translateValue(currentLocale, "common.copy");
      }
    });
  });
}

function initScrollSpy() {
  const links = Array.from(document.querySelectorAll(".toc-link"));
  if (!links.length) return;

  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!sections.length) return;

  let queued = false;
  const update = () => {
    queued = false;
    const threshold = window.scrollY + 140;
    let active = sections[0];
    sections.forEach((section) => {
      if (section.offsetTop <= threshold) active = section;
    });
    const activeId = `#${active.id}`;
    links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === activeId));
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  links.forEach((link) => link.addEventListener("click", () => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      const id = `#${target.id}`;
      links.forEach((item) => item.classList.toggle("is-active", item.getAttribute("href") === id));
    }
  }));

  update();
}

initTheme();
initLanguageSwitcher();
initNavToggle();
initDropdowns();
initDemo();
initProductSwitch();
initCopyButtons();
initScrollSpy();
