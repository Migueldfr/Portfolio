// 🎧 AUDIO Y PRELOADER
var audio = document.getElementById("audioPlayer"),
    loader = document.getElementById("preloader");

function hidePreloader() {
  if (loader.style.display === "none") return;
  loader.style.display = "none";
  document.querySelector(".hey").classList.add("popup");
}

window.addEventListener("load", hidePreloader);
// Red de seguridad: si algún recurso externo (icono, fuente, etc.) se queda
// colgado, "load" nunca dispara y la web se queda tapada por el preloader
// para siempre. Forzamos que se oculte igualmente pasados 4s.
setTimeout(hidePreloader, 4000);

// ⚙️ CONFIGURACIONES GENERALES
function settingtoggle() {
  document.getElementById("setting-container").classList.toggle("settingactivate");
  document.getElementById("visualmodetogglebuttoncontainer").classList.toggle("visualmodeshow");
  document.getElementById("soundtogglebuttoncontainer").classList.toggle("soundmodeshow");
}

function playpause() {
  if (document.getElementById("switchforsound").checked === false) {
    audio.pause();
  } else {
    audio.play();
  }
}

function visualmode() {
  document.body.classList.toggle("light-mode");
  document.querySelectorAll(".needtobeinvert").forEach(function (e) {
    e.classList.toggle("invertapplied");
  });
}

// 🍔 MENÚ MÓVIL
let mobileTogglemenu = document.getElementById("mobiletogglemenu");

function hamburgerMenu() {
  document.body.classList.toggle("stopscrolling");
  mobileTogglemenu.classList.toggle("show-toggle-menu");
  document.getElementById("burger-bar1").classList.toggle("hamburger-animation1");
  document.getElementById("burger-bar2").classList.toggle("hamburger-animation2");
  document.getElementById("burger-bar3").classList.toggle("hamburger-animation3");
}

function hidemenubyli() {
  document.body.classList.toggle("stopscrolling");
  mobileTogglemenu.classList.remove("show-toggle-menu");
  document.getElementById("burger-bar1").classList.remove("hamburger-animation1");
  document.getElementById("burger-bar2").classList.remove("hamburger-animation2");
  document.getElementById("burger-bar3").classList.remove("hamburger-animation3");
}

// 🧭 NAVEGACIÓN ENTRE SECCIONES (scroll activo)
const sections = document.querySelectorAll("section"),
  navLi = document.querySelectorAll(".navbar .navbar-tabs .navbar-tabs-ul li"),
  mobilenavLi = document.querySelectorAll(".mobiletogglemenu .mobile-navbar-tabs-ul li");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    if (pageYOffset >= sectionTop - 200) {
      current = section.getAttribute("id");
    }
  });

  mobilenavLi.forEach((li) => {
    li.classList.remove("activeThismobiletab");
    if (li.classList.contains(current)) li.classList.add("activeThismobiletab");
  });

  navLi.forEach((li) => {
    li.classList.remove("activeThistab");
    if (li.classList.contains(current)) li.classList.add("activeThistab");
  });
});

// 👁️ EFECTO DE “OJOS” EN FOOTER
let Pupils = document.getElementsByClassName("footer-pupil"),
  pupilsArr = Array.from(Pupils),
  pupilStartPoint = -10,
  pupilRangeX = 20,
  pupilRangeY = 15,
  mouseXStartPoint = 0,
  mouseXEndPoint = window.innerWidth,
  currentXPosition = 0,
  fracXValue = 0,
  mouseYEndPoint = window.innerHeight,
  currentYPosition = 0,
  fracYValue = 0,
  mouseXRange = mouseXEndPoint - mouseXStartPoint;

const mouseMove = (e) => {
  fracXValue = (currentXPosition = e.clientX - mouseXStartPoint) / mouseXRange;
  fracYValue = (currentYPosition = e.clientY) / mouseYEndPoint;
  let moveX = pupilStartPoint + fracXValue * pupilRangeX;
  let moveY = pupilStartPoint + fracYValue * pupilRangeY;
  pupilsArr.forEach((pupil) => {
    pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
};

const windowResize = () => {
  mouseXEndPoint = window.innerWidth;
  mouseYEndPoint = window.innerHeight;
  mouseXRange = mouseXEndPoint - mouseXStartPoint;
};

window.addEventListener("mousemove", mouseMove);
window.addEventListener("resize", windowResize);

// 🔙 BOTÓN “VOLVER ARRIBA”
let mybutton = document.getElementById("backtotopbutton");

function scrollFunction() {
  if (document.body.scrollTop > 400 || document.documentElement.scrollTop > 400) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

function scrolltoTopfunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

window.onscroll = function () {
  scrollFunction();
};

// 🚫 BLOQUEAR CLICK DERECHO EN IMÁGENES
document.addEventListener(
  "contextmenu",
  function (e) {
    if (e.target.nodeName === "IMG") e.preventDefault();
  },
  false
);

// 🧑‍💻 CRÉDITOS
console.log(
  "%c Designed and Developed by Vinod Jangid ",
  "background-image: linear-gradient(90deg,#8000ff,#6bc5f8); color: white;font-weight:900;font-size:1rem; padding:20px;"
);


// 🟢 NUEVO MODAL PROYECTO MULTIÓPTICAS
// =======================================================
const modal = document.getElementById("multiopticas-modal");

/**
 * Abre el modal de MultiÓpticas y previene el scroll del body.
 */
function openMultiopticasModal() {
  if (!modal) return; // Seguridad por si el modal no existe
  modal.classList.add("open");
  // Reutiliza la clase 'stopscrolling' que ya tienes para el menú móvil
  document.body.classList.add("stopscrolling"); 
}

/**
 * Cierra el modal de MultiÓpticas y restaura el scroll del body.
 */
function closeMultiopticasModal() {
  if (!modal) return;

  // Inicia el fade out
  modal.style.opacity = 0;

  // Espera a que termine la transición antes de quitar la clase
  setTimeout(() => {
    modal.classList.remove("open");
    modal.style.opacity = ""; // reset para la próxima apertura
    document.body.classList.remove("stopscrolling");
  }, 400); // coincide con la transición CSS
}


// Añade un listener al overlay del modal para cerrarlo si se hace clic fuera del contenido
if (modal) {
    modal.addEventListener("click", function(event) {
        // Cierra el modal solo si el clic es en el 'modal-overlay' (el fondo)
        // y no en 'modal-content' o sus hijos.
        if (event.target === modal) { 
            closeMultiopticasModal();
        }
    });
}

// =======================================================
// 🔹 Cierra el modal si el usuario hace scroll
// =======================================================
window.addEventListener("scroll", () => {
  if (modal && modal.classList.contains("open")) {
    closeMultiopticasModal();
  }
});

// =======================================================
// 🔹 Desplegable "Demo" (elegir entre las demos interactivas)
// =======================================================
// El navbar usa backdrop-filter y el menú móvil usa transform al abrirse;
// ambas propiedades convierten a ese ancestro en el "containing block" de
// cualquier descendiente position:fixed, así que el menú se posicionaba
// relativo a ese ancestro en vez del viewport aunque las coordenadas se
// calculasen bien. Por eso sacamos el menú al final del <body> mientras
// está abierto y lo devolvemos a su sitio al cerrarlo.
const demoDropdowns = Array.from(document.querySelectorAll(".demo-link")).map(function (li) {
  return {
    trigger: li.querySelector(".demo-dropdown-trigger"),
    menu: li.querySelector(".demo-dropdown-menu"),
    placeholder: document.createComment("demo-dropdown-menu-slot"),
  };
});

function closeDemoDropdowns() {
  demoDropdowns.forEach(function (entry) {
    if (!entry.menu || !entry.menu.classList.contains("demo-dropdown-open")) return;
    entry.menu.classList.remove("demo-dropdown-open");
    entry.menu.style.display = "";
    entry.trigger.setAttribute("aria-expanded", "false");
    if (entry.placeholder.parentNode) {
      entry.placeholder.parentNode.replaceChild(entry.menu, entry.placeholder);
    }
  });
}

function positionDemoDropdown(trigger, menu) {
  menu.style.display = "flex";
  const rect = trigger.getBoundingClientRect();
  const top = rect.bottom + 10;
  const left = Math.max(8, Math.min(rect.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 8));
  menu.style.top = top + "px";
  menu.style.left = left + "px";
}

demoDropdowns.forEach(function (entry) {
  if (!entry.trigger || !entry.menu) return;
  entry.trigger.addEventListener("click", function (event) {
    event.stopPropagation();
    const wasOpen = entry.menu.classList.contains("demo-dropdown-open");
    closeDemoDropdowns();
    if (!wasOpen) {
      entry.menu.replaceWith(entry.placeholder);
      document.body.appendChild(entry.menu);
      positionDemoDropdown(entry.trigger, entry.menu);
      entry.menu.classList.add("demo-dropdown-open");
      entry.trigger.setAttribute("aria-expanded", "true");
    }
  });
});

document.addEventListener("click", closeDemoDropdowns);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeDemoDropdowns();
});
