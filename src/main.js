import { LOCALES, getMessage } from "./i18n/index.js";

const LANG_KEY = "csle-lang";
const PRODUCT_KEY = "csle-doc-product";
const THEME_KEY = "csle-theme";

const DEMO_CODES = {
  hk: {
    source: "程序异常，请检查网络",
    after: "const message = '程式異常，請檢查網絡';",
  },
  tw: {
    source: "程序异常，请检查网络",
    after: "const message = '程式異常，請檢查網路';",
  },
  cn: {
    source: "程式異常，請檢查網路",
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

function updateProductLabel(product) {
  const label = document.querySelector("[data-product-current]");
  const option = document.querySelector(`[data-product-option="${product}"]`);
  if (label && option) label.textContent = option.textContent;
}

function updateDemoLabel(demo, text) {
  const label = document.querySelector("[data-demo-current]");
  if (!label) return;
  label.textContent = text;
  label.dataset.i18n = `hero.demo.${demo}`;
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
  applyTheme(document.documentElement.dataset.theme || detectTheme());
  const picker = document.querySelector("[data-product-picker]");
  if (picker) updateProductLabel(picker.dataset.currentProduct || "vscode");
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
  const picker = document.querySelector("[data-demo-picker]");
  const toggle = document.querySelector("[data-demo-toggle]");
  const menu = document.querySelector(".demo-menu");
  const before = document.querySelector("[data-demo-before]");
  const after = document.querySelector("[data-demo-after]");
  if (!before || !after) return;

  const options = Array.from(document.querySelectorAll("[data-demo]"));
  const close = () => {
    if (!picker || !menu || !toggle) return;
    picker.classList.remove("is-open");
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  const selectDemo = (option) => {
    const code = DEMO_CODES[option.dataset.demo];
    if (!code) return;
    before.innerHTML = `const message = '<span class="demo-warning">${code.source}</span>';`;
    after.textContent = code.after;
    options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
    if (picker) picker.dataset.currentDemo = option.dataset.demo;
    updateDemoLabel(option.dataset.demo, option.textContent);
  };

  if (picker && toggle && menu) {
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = !menu.classList.contains("is-open");
      picker.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", (event) => {
      if (!picker.contains(event.target)) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    options.forEach((option) => {
      option.addEventListener("click", () => {
        selectDemo(option);
        close();
        toggle.focus();
      });
    });
  }

  const initial = options.find((option) => option.dataset.demo === picker?.dataset.currentDemo);
  if (initial) selectDemo(initial);
}

function initProductSwitch() {
  const picker = document.querySelector("[data-product-picker]");
  const toggle = document.querySelector("[data-product-toggle]");
  const menu = document.querySelector(".product-menu");
  const options = document.querySelectorAll("[data-product-option]");
  if (!picker) return;

  const close = () => {
    if (!picker || !menu || !toggle) return;
    picker.classList.remove("is-open");
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const setProduct = (product) => {
    options.forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.productOption === product));
    });
    if (picker) picker.dataset.currentProduct = product;
    updateProductLabel(product);
    document.querySelectorAll("[data-product]").forEach((element) => {
      element.hidden = element.dataset.product !== product;
    });
    window.sessionStorage.setItem(PRODUCT_KEY, product);

    const url = new URL(window.location.href);
    url.searchParams.set("p", product);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  if (picker && toggle && menu) {
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = !menu.classList.contains("is-open");
      picker.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", (event) => {
      if (!picker.contains(event.target)) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    options.forEach((option) => {
      option.addEventListener("click", () => {
        setProduct(option.dataset.productOption);
        close();
        toggle.focus();
      });
    });
  }

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
initDemo();
initProductSwitch();
initCopyButtons();
initScrollSpy();
