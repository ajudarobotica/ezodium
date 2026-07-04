/* scripts.js â€” Ajuda RobÃ³tica Landing Page
   InteraÃ§Ãµes: scroll suave com offset, destaque de seÃ§Ã£o ativa no menu,
   animaÃ§Ãµes on-scroll, header com estado "scrolled", parallax leve no hero,
   menu mobile (se existir no HTML).
*/
(() => {
  "use strict";

  // ==========================
  // Helpers
  // ==========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const getHeaderOffset = () => {
    const header = $("header");
    if (!header) return 0;
    const styles = window.getComputedStyle(header);
    const isSticky = styles.position === "sticky" || styles.position === "fixed";
    return isSticky ? header.getBoundingClientRect().height : 0;
  };

  const smoothScrollTo = (targetEl) => {
    if (!targetEl) return;

    const offset = getHeaderOffset();
    const top =
      targetEl.getBoundingClientRect().top + window.pageYOffset - offset - 12; // 12px breathing space

    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  // ==========================
  // 1) Smooth scrolling for anchor links
  // ==========================
  const bindSmoothAnchors = () => {
    const anchorLinks = $$('a[href^="#"]:not([href="#"])');

    anchorLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const hash = link.getAttribute("href");
        const target = $(hash);

        // Only handle if target exists on page
        if (!target) return;

        e.preventDefault();

        // Close mobile menu if open
        closeMobileMenu();

        smoothScrollTo(target);

        // Keep URL updated without jump
        history.pushState(null, "", hash);
      });
    });

    // If page loads with a hash, scroll with correct offset
    window.addEventListener("load", () => {
      const hash = window.location.hash;
      if (!hash) return;
      const target = $(hash);
      if (!target) return;

      // small delay to ensure layout is ready
      setTimeout(() => smoothScrollTo(target), 60);
    });
  };

  // ==========================
  // 2) Header state on scroll
  // ==========================
  const bindHeaderScrolledState = () => {
    const header = $("header");
    if (!header) return;

    const onScroll = () => {
      const y = window.scrollY || 0;
      header.classList.toggle("scrolled", y > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  };

  // ==========================
  // 3) Reveal-on-scroll animations
  //    Use any of:
  //    - class ".reveal"
  //    - attribute [data-reveal]
  // ==========================
  const bindRevealOnScroll = () => {
    if (prefersReducedMotion()) {
      // In reduced motion, just show everything immediately
      $$(".reveal, [data-reveal]").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const targets = $$(".reveal, [data-reveal]");
    if (!targets.length) return;

    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    targets.forEach((el) => obs.observe(el));
  };

  // ==========================
  // 4) Active section highlight in nav
  //    Expects nav links like: <a href="#jornada">Jornada</a>
  // ==========================
  const bindActiveSectionSpy = () => {
    const nav = $("header nav");
    if (!nav) return;

    const links = $$("a.nav__link[href^='#']:not([href='#'])", nav);
    if (!links.length) return;

    // Map section id -> nav link, ignoring links that do not point to a real section.
    const linkById = new Map();
    links.forEach((link) => {
      const hash = link.getAttribute("href");
      if (!hash) return;

      const id = hash.replace("#", "");
      const section = document.getElementById(id);

      if (section) {
        linkById.set(id, link);
      }
    });

    const sections = Array.from(linkById.keys())
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) return;

    const setActive = (id) => {
      links.forEach((link) => link.classList.remove("is-active"));

      const activeLink = linkById.get(id);
      if (activeLink) {
        activeLink.classList.add("is-active");
      }
    };

    const getCurrentSection = () => {
      const headerOffset = getHeaderOffset();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;

      // Linha de leitura: fica abaixo do header e evita troca precoce em seções altas.
      const markerY = window.scrollY + headerOffset + Math.min(viewportH * 0.35, 260);

      let current = sections[0];

      for (const section of sections) {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;

        if (markerY >= top && markerY < bottom) {
          return section;
        }

        if (top <= markerY) {
          current = section;
        }
      }

      return current;
    };

    let ticking = false;

    const updateActive = () => {
      const current = getCurrentSection();
      if (current) setActive(current.id);
    };

    const requestUpdate = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        updateActive();
        ticking = false;
      });
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    window.addEventListener("load", requestUpdate);

    links.forEach((link) => {
      link.addEventListener("click", () => {
        const id = link.getAttribute("href")?.replace("#", "");
        if (id && linkById.has(id)) setActive(id);
      });
    });

    updateActive();
  };

  // ==========================
  // 5) Hero parallax (leve e elegante)
  //    Expect: element with [data-parallax="hero"]
  // ==========================
  const bindHeroParallax = () => {
    if (prefersReducedMotion()) return;

    const hero = $('[data-parallax="hero"]');
    if (!hero) return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const y = window.scrollY || 0;

        // small transform (max 18px)
        const translate = clamp(y * 0.04, 0, 18);
        hero.style.transform = `translate3d(0, ${translate}px, 0)`;

        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };


  // ==========================
  // 5.1) Trajetória parallax timeline
  // ==========================
  const bindTrajectoryParallax = () => {
    const timeline = $('[data-trajectory-parallax]');
    if (!timeline || prefersReducedMotion()) return;

    const stops = $$('.trajectory-stop', timeline);
    if (!stops.length) return;

    let ticking = false;

    const update = () => {
      const rect = timeline.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + viewportH;
      const visible = viewportH - rect.top;
      const progress = clamp(visible / total, 0, 1);
      timeline.style.setProperty('--timeline-progress', `${Math.round(progress * 100)}%`);
      timeline.closest('.trajectory-section')?.style.setProperty('--parallax-y', `${Math.round(progress * 90)}px`);

      let current = stops[0];
      let bestDistance = Number.POSITIVE_INFINITY;
      const focusLine = viewportH * 0.48;

      stops.forEach((stop) => {
        const stopRect = stop.getBoundingClientRect();
        const center = stopRect.top + stopRect.height / 2;
        const distance = Math.abs(center - focusLine);
        if (distance < bestDistance) {
          bestDistance = distance;
          current = stop;
        }

        const speed = Number.parseFloat(stop.dataset.speed || '0.08');
        const local = clamp((focusLine - center) / viewportH, -1, 1);
        stop.style.setProperty('--card-y', `${Math.round(local * speed * -90)}px`);
        stop.style.setProperty('--node-y', `${Math.round(local * speed * 46)}px`);
      });

      stops.forEach((stop) => stop.classList.toggle('is-current', stop === current));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  };

  // ==========================
  // 6) Mobile menu (optional)
  //    If your HTML includes:
  //    - button.menu-toggle
  //    - nav .nav-links (or ul.nav-links)
  // ==========================
  let mobileMenuOpen = false;

  const openMobileMenu = () => {
    const toggle = $(".nav__toggle");
    const links = $(".nav__list");
    if (!toggle || !links) return;

    mobileMenuOpen = true;
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    links.classList.add("is-open");

    // Focus first link for accessibility
    const first = $('a[href^="#"]', links);
    if (first) first.focus({ preventScroll: true });
  };

  const closeMobileMenu = () => {
    const toggle = $(".nav__toggle");
    const links = $(".nav__list");
    if (!toggle || !links) return;

    mobileMenuOpen = false;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    links.classList.remove("is-open");
  };

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) closeMobileMenu();
    else openMobileMenu();
  };

  const bindMobileMenu = () => {
    const toggle = $(".nav__toggle");
    const links = $(".nav__list");
    if (!toggle || !links) return;

    // Setup ARIA
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", links.id || "nav-list");

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      toggleMobileMenu();
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileMenuOpen) return;
      const within = e.target.closest(".nav__list, .nav__toggle");
      if (!within) closeMobileMenu();
    });

    // Close on ESC
    document.addEventListener("keydown", (e) => {
      if (!mobileMenuOpen) return;
      if (e.key === "Escape") closeMobileMenu();
    });

    // Close when resizing to desktop
    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth >= 992 && mobileMenuOpen) closeMobileMenu();
      },
      { passive: true }
    );
  };


  // ==========================
  // 6.1) Jornada do Apoiador accordion
  // ==========================
  const bindSupportJourneyAccordion = () => {
    const accordion = $('[data-support-journey-accordion]');
    if (!accordion) return;

    const journey = accordion.closest('.support-journey');
    const items = $$('.support-journey__item', accordion);
    const routeSteps = journey ? $$('.support-journey__route-step', journey) : [];

    if (!items.length) return;

    const setActiveStep = (activeIndex) => {
      routeSteps.forEach((step, index) => {
        const isActive = index === activeIndex;
        step.classList.toggle('is-active', isActive);
        step.setAttribute('aria-pressed', isActive ? 'true' : 'false');

        // No mobile, o dock de etapas já cabe na largura da seção.
        // Evita scrollIntoView horizontal, que em alguns navegadores desloca a página para a esquerda.
      });
    };

    const openJourneyItem = (index, shouldScroll = false) => {
      const targetItem = items[index];
      if (!targetItem) return;

      items.forEach((item, itemIndex) => {
        if (itemIndex !== index) item.removeAttribute('open');
      });

      targetItem.setAttribute('open', '');
      setActiveStep(index);

      if (shouldScroll && window.innerWidth <= 900) {
        targetItem.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });

        // Garante que nenhum alinhamento horizontal acidental permaneça no viewport.
        if (window.scrollX !== 0) {
          window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' });
        }
      }
    };

    routeSteps.forEach((step, index) => {
      step.setAttribute('aria-pressed', step.classList.contains('is-active') ? 'true' : 'false');
      step.addEventListener('click', () => openJourneyItem(index, true));
    });

    items.forEach((item, index) => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          items.forEach((otherItem) => {
            if (otherItem !== item) otherItem.removeAttribute('open');
          });
          setActiveStep(index);
          return;
        }

        const openIndex = items.findIndex((currentItem) => currentItem.open);
        setActiveStep(openIndex >= 0 ? openIndex : -1);
      });
    });

    const initialIndex = items.findIndex((item) => item.open);
    setActiveStep(initialIndex >= 0 ? initialIndex : -1);
  };

  // ==========================
  // 7) Button micro-interaction (optional)
  //    Add class "btn" to buttons/links
  // ==========================
  const bindButtonMagneticHover = () => {
    if (prefersReducedMotion()) return;

    const buttons = $$(".btn");
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // subtle movement
        const tx = clamp(x * 0.06, -10, 10);
        const ty = clamp(y * 0.06, -10, 10);
        btn.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  };



  // ==========================
  // 8) Depoimentos — Player interno
  // ==========================
  const bindTestimonialVideoModal = () => {
    const modal = $("#testimonial-video-modal");
    const frame = $("#testimonial-video-frame");
    const title = $("#testimonial-video-title");
    const triggers = $$("[data-video-id]");

    if (!modal || !frame || !title || !triggers.length) return;

    const closeButtons = $$('[data-video-modal-close]', modal);
    const closeButton = $(".video-modal__close", modal);
    let lastFocusedTrigger = null;

    const openModal = (trigger) => {
      const videoId = trigger.dataset.videoId;
      if (!videoId) return;

      lastFocusedTrigger = trigger;
      title.textContent = trigger.dataset.videoTitle || "Depoimento EZodium";
      frame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1`;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("video-modal-open");

      window.setTimeout(() => closeButton?.focus({ preventScroll: true }), 80);
    };

    const closeModal = () => {
      if (!modal.classList.contains("is-open")) return;

      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("video-modal-open");
      frame.src = "";

      if (lastFocusedTrigger) {
        lastFocusedTrigger.focus({ preventScroll: true });
      }
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openModal(trigger);
      });
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  };


  // ==========================
  // 9) Meta Pixel — WhatsApp click tracking
  // ==========================
  const bindMetaPixelWhatsAppTracking = () => {
    const whatsappLinks = $$('a[href*="wa.me/"], a[href*="api.whatsapp.com/"]');
    if (!whatsappLinks.length) return;

    whatsappLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (typeof window.fbq !== "function") return;

        window.fbq("track", "Lead", {
          content_name: "Clique WhatsApp - Apoiar EZodium",
          content_category: "Apoio / Patrocínio",
          lead_source: "landing_page_ezodium",
        });

        window.fbq("trackCustom", "WhatsAppClick", {
          content_name: "Clique WhatsApp - Apoiar EZodium",
          content_category: "Apoio / Patrocínio",
          lead_source: "landing_page_ezodium",
        });
      });
    });
  };

  // ==========================
  // Init
  // ==========================
  const init = () => {
    bindSmoothAnchors();
    bindHeaderScrolledState();
    bindRevealOnScroll();
    bindActiveSectionSpy();
    bindHeroParallax();
    bindTrajectoryParallax();
    bindMobileMenu();
    bindSupportJourneyAccordion();
    bindButtonMagneticHover();
    bindTestimonialVideoModal();
    bindMetaPixelWhatsAppTracking();
  };

  document.addEventListener("DOMContentLoaded", init);
})();