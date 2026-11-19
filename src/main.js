import "./styles.css";
import { LOCALES, getMessage } from "./i18n.js";

const LANG_KEY = "csle-lang";
const PRODUCT_KEY = "csle-doc-product";

const DEMO_CODES = {
  hk: {
    before: "const message = '程序异常，请检查网络';",
    after: "const message = '程式異常，請檢查網絡';",
  },
  tw: {
    before: "const message = '程序异常，请检查网络';",
    after: "const message = '程式異常，請檢查網路';",
  },
  cn: {
    before: "const message = '程式異常，請檢查網路';",
    after: "const message = '程序异常，请检查网络';",
  },
};

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

  document.querySelectorAll("[data-lang]").forEach((button) => {
    const active = button.dataset.lang === locale;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-checked", String(active));
  });

  const currentLabel = document.querySelector("[data-lang-current]");
  if (currentLabel) {
    const selected = LOCALES.find((item) => item.code === locale);
    currentLabel.textContent = selected ? selected.label : locale;
  }
}

function setLocale(locale) {
  if (!LOCALES.some((item) => item.code === locale)) return;
  currentLocale = locale;
  window.localStorage.setItem(LANG_KEY, locale);

  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

  applyI18n(locale);
}

function initLanguageSwitcher() {
  const picker = document.querySelector("[data-lang-picker]");
  const toggle = document.querySelector("[data-lang-toggle]");
  const popup = document.querySelector(".lang-popup");

  if (picker && toggle && popup) {
    const close = () => {
      popup.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = !popup.classList.contains("is-open");
      popup.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });

    popup.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", (event) => {
      if (!picker.contains(event.target)) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    popup.querySelectorAll("[data-lang]").forEach((button) => {
      button.addEventListener("click", () => {
        setLocale(button.dataset.lang);
        close();
        toggle.focus();
      });
    });
  } else {
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.addEventListener("click", () => setLocale(button.dataset.lang));
    });
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
  const before = document.querySelector("[data-demo-before]");
  const after = document.querySelector("[data-demo-after]");
  if (!before || !after) return;

  document.querySelectorAll("[data-demo]").forEach((button) => {
    button.addEventListener("click", () => {
      const code = DEMO_CODES[button.dataset.demo];
      if (!code) return;
      before.textContent = code.before;
      after.textContent = code.after;
      document.querySelectorAll("[data-demo]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
    });
  });
}

function initProductSwitch() {
  const buttons = document.querySelectorAll("[data-product-switch]");
  if (!buttons.length) return;

  const setProduct = (product) => {
    buttons.forEach((button) => {
      const active = button.dataset.productSwitch === product;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-product]").forEach((element) => {
      element.hidden = element.dataset.product !== product;
    });
    window.sessionStorage.setItem(PRODUCT_KEY, product);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => setProduct(button.dataset.productSwitch));
  });

  const saved = window.sessionStorage.getItem(PRODUCT_KEY);
  setProduct(saved === "intellij" ? "intellij" : "vscode");
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

initLanguageSwitcher();
initNavToggle();
initDemo();
initProductSwitch();
initCopyButtons();
initScrollSpy();
