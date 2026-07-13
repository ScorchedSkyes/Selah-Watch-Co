(() => {
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const yearEl = document.querySelector("[data-year]");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (menuToggle && mobileNav) {
    const setMenuOpen = (open) => {
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileNav.hidden = !open;
      header?.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      setMenuOpen(open);
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 860px)").matches) {
        setMenuOpen(false);
      }
    });
  }

  const watches = [...document.querySelectorAll(".watch-piece")];
  const sections = [
    ...document.querySelectorAll(
      ".section-intro, .craft-copy, .story-inner, .contact-inner, .sell-inner"
    ),
  ];

  sections.forEach((el) => el.classList.add("reveal"));

  const observe = (elements) => {
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
  };

  watches.forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.12}s`;
  });

  observe([...watches, ...sections]);

  const wireForm = (formSel, statusSel, thankYou) => {
    const form = document.querySelector(formSel);
    const status = document.querySelector(statusSel);
    if (!form || !status) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      status.hidden = false;
      status.textContent = thankYou(name);
      form.reset();
    });
  };

  wireForm(
    "[data-inquire-form]",
    "[data-form-status]",
    (name) =>
      name
        ? `Thank you, ${name}. We'll help you find the right watch.`
        : "Thank you. We'll be in touch soon."
  );

  wireForm(
    "[data-sell-form]",
    "[data-sell-status]",
    (name) =>
      name
        ? `Thank you, ${name}. We'll review your watch and follow up with an offer.`
        : "Thank you. We'll review your watch and follow up soon."
  );
})();
