// Tema claro/oscuro
const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}
});

// Menú móvil
const menuToggle = document.getElementById("menu-toggle");
const siteNav = document.getElementById("site-nav");

function setMenu(open) {
  siteNav.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}

menuToggle.addEventListener("click", () => setMenu(!siteNav.classList.contains("is-open")));
siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

// Cabecera: borde al hacer scroll
const header = document.getElementById("site-header");
const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

// Detalle de MultiÓpticas
const moDialog = document.getElementById("mo-dialog");
document.getElementById("mo-open").addEventListener("click", () => moDialog.showModal());
document.getElementById("mo-close").addEventListener("click", () => moDialog.close());
moDialog.addEventListener("click", (event) => {
  if (event.target === moDialog) moDialog.close();
});

// Línea de pipeline y hero con GSAP
const nodes = document.querySelectorAll(".node");
const navLinks = document.querySelectorAll(".site-nav a");

if (!window.gsap || !window.ScrollTrigger) {
  // Si el CDN falla, la página sigue siendo legible y completa.
  document.body.classList.add("no-gsap");
  root.style.scrollBehavior = "smooth";
} else {
  gsap.registerPlugin(ScrollTrigger);
  // Recalcula las posiciones de los triggers cuando terminan de cargar imágenes y fuentes.
  window.addEventListener("load", () => ScrollTrigger.refresh());
  const hasScramble = !!window.ScrambleTextPlugin;
  if (hasScramble) gsap.registerPlugin(ScrambleTextPlugin);

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Hero: el nombre se resuelve desde datos en bruto, y después aparece el resto.
    const lines = gsap.utils.toArray(".scramble");
    const intro = gsap.timeline({ delay: 0.2 });

    if (hasScramble) {
      lines.forEach((line, i) => {
        intro.to(
          line,
          {
            duration: 1.5,
            scrambleText: { text: line.dataset.text, chars: "01{}[]<>/=;_#", speed: 0.7, revealDelay: 0.15 },
          },
          i * 0.35
        );
      });
    }
    intro.from(".hero-in", { opacity: 0, y: 14, duration: 0.6, stagger: 0.12, ease: "power2.out" }, hasScramble ? 1.1 : 0);

    // Cuando el nombre ya está resuelto, cada letra responde a la cercanía del ratón
    // variando peso y ancho de la fuente variable.
    const heroName = document.querySelector(".hero-name");
    const hero = document.getElementById("home");
    let letters = [];
    let pointer = null;
    let frame = 0;

    const WGHT = [620, 800];
    const WDTH = [85, 100];
    const RADIUS = 200;

    function splitName() {
      lines.forEach((line) => {
        const text = line.dataset.text;
        line.textContent = "";
        for (const char of text) {
          const span = document.createElement("span");
          span.className = "ch";
          span.setAttribute("aria-hidden", "true");
          span.textContent = char;
          line.appendChild(span);
          letters.push(span);
        }
      });
    }

    function paintLetters() {
      frame = 0;
      letters.forEach((letter) => {
        let near = 0;
        if (pointer) {
          const r = letter.getBoundingClientRect();
          const dist = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
          near = Math.max(0, 1 - dist / RADIUS);
          near = near * near * (3 - 2 * near);
        }
        const wght = Math.round(WGHT[0] + (WGHT[1] - WGHT[0]) * near);
        const wdth = Math.round(WDTH[0] + (WDTH[1] - WDTH[0]) * near);
        letter.style.fontVariationSettings = '"wght" ' + wght + ', "wdth" ' + wdth;
      });
    }

    function onPointerMove(event) {
      if (event.pointerType !== "mouse" || !letters.length) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(paintLetters);
    }

    function onHeroLeave() {
      pointer = null;
      if (!frame) frame = requestAnimationFrame(paintLetters);
    }

    // La segunda línea termina su scramble a los ~1.85s: separamos las letras después.
    intro.add(splitName, hasScramble ? 2 : 0);
    hero.addEventListener("pointermove", onPointerMove);
    hero.addEventListener("pointerleave", onHeroLeave);

    // La línea se dibuja con el scroll; la cabeza queda a ~60% de la ventana.
    gsap.to("#rail-fill", {
      height: "100%",
      ease: "none",
      scrollTrigger: { trigger: "#page", start: "top 60%", end: "bottom 60%", scrub: 0.4 },
    });

    // Paquetes de datos: pulsos que recorren el tramo ya dibujado de la línea.
    const railFill = document.getElementById("rail-fill");
    for (let i = 0; i < 4; i++) {
      const packet = document.createElement("span");
      packet.className = "packet";
      railFill.appendChild(packet);
      gsap.fromTo(
        packet,
        { top: "0%", opacity: 0 },
        { top: "100%", keyframes: { opacity: [0, 1, 1, 0] }, duration: 5, ease: "none", repeat: -1, delay: i * 1.25 }
      );
    }

    // Cifras del perfil: cuentan hasta su valor al llegar a ellas.
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count);
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const counter = { value: 0 };
      el.textContent = prefix + "0" + suffix;
      gsap.to(counter, {
        value: target,
        duration: 1.4,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onUpdate: () => {
          el.textContent = prefix + Math.round(counter.value) + suffix;
        },
      });
    });

    // Ramales: de la línea sale una derivación hacia cada área.
    gsap.utils.toArray(".stage").forEach((stage) => {
      gsap.fromTo(
        stage,
        { "--branch": 0 },
        { "--branch": 1, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: stage, start: "top 65%", once: true } }
      );
    });

    // Transición entre secciones: el scroll viaja con inercia y la línea lo acompaña;
    // al llegar, el nodo de la sección da un pulso.
    if (window.ScrollToPlugin) {
      gsap.registerPlugin(ScrollToPlugin);

      document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
          const id = link.getAttribute("href").slice(1);
          const target = id ? document.getElementById(id) : null;
          if (!target) return;
          event.preventDefault();
          const distance = Math.abs(target.getBoundingClientRect().top);
          const stop = () => travel.kill();
          const travel = gsap.to(window, {
            scrollTo: { y: id === "home" ? 0 : target, offsetY: id === "home" ? 0 : header.offsetHeight + 8, autoKill: false },
            duration: Math.min(1.6, Math.max(0.7, distance / 1800)),
            ease: "power3.inOut",
            onComplete: () => {
              release();
              history.replaceState(null, "", "#" + id);
              const node = target.querySelector(".node");
              if (node) gsap.fromTo(node, { scale: 2.2 }, { scale: 1, duration: 0.7, ease: "back.out(2)" });
            },
            onInterrupt: () => release(),
          });
          // Si la persona toma el control del scroll, el viaje se cancela.
          const takeover = ["wheel", "touchstart", "keydown"];
          const release = () => takeover.forEach((name) => window.removeEventListener(name, stop));
          takeover.forEach((name) => window.addEventListener(name, stop, { passive: true }));
        });
      });
    }

    // Demos: la vista previa se inclina hacia el cursor, con perspectiva.
    document.querySelectorAll(".demo-frame").forEach((frame) => {
      const MAX = 6;
      const rotateX = gsap.quickTo(frame, "rotationX", { duration: 0.4, ease: "power3.out" });
      const rotateY = gsap.quickTo(frame, "rotationY", { duration: 0.4, ease: "power3.out" });
      gsap.set(frame, { transformPerspective: 900 });

      frame.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse") return;
        const r = frame.getBoundingClientRect();
        const x = (event.clientX - r.left) / r.width - 0.5;
        const y = (event.clientY - r.top) / r.height - 0.5;
        rotateY(x * MAX * 2);
        rotateX(-y * MAX * 2);
      });
      frame.addEventListener("pointerenter", () => gsap.to(frame, { scale: 1.02, duration: 0.4, ease: "power3.out" }));
      frame.addEventListener("pointerleave", () => {
        rotateX(0);
        rotateY(0);
        gsap.to(frame, { scale: 1, duration: 0.5, ease: "power3.out" });
      });
    });

    // Cada nodo se enciende cuando la línea lo alcanza.
    nodes.forEach((node) => {
      ScrollTrigger.create({
        trigger: node,
        start: "top 60%",
        onToggle: (self) => node.classList.toggle("is-on", self.isActive || self.progress === 1),
      });
    });
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    document.body.classList.add("no-gsap");
  });

  // Enlace activo en la navegación
  document.querySelectorAll(".section").forEach((section) => {
    const link = document.querySelector('.site-nav a[href="#' + section.id + '"]');
    if (!link) return;
    ScrollTrigger.create({
      trigger: section,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => {
        if (self.isActive) {
          navLinks.forEach((a) => a.removeAttribute("aria-current"));
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      },
    });
  });
}
