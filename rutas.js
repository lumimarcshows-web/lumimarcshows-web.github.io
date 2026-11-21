// Direcciones bonitas: lumimarcshows.com/Home, /Fuente, /Videos, /Descargar, /Kit, /Novedades
// Al abrir la web se va arriba de todo (/Home). Al pulsar un botón del menú, la dirección cambia a esa parte.
(function () {
  "use strict";
  var R = { Home: "home", Fuente: "fuente", Videos: "videos", Descargar: "descargar", Kit: "kit", Novedades: "noticias" };
  var porId = {}; Object.keys(R).forEach(function (k) { porId[R[k]] = k });
  function ruta() {
    var q = new URLSearchParams(location.search).get("r");             // viene de 404.html
    var p = (q || location.pathname.replace(/^\/+|\/+$/g, "")) || "Home";
    var k = Object.keys(R).filter(function (x) { return x.toLowerCase() === p.toLowerCase() })[0];
    return k || "Home";
  }
  function ir(k, suave) {
    var s = document.getElementById(R[k]); if (!s) return;
    if (k === "Home") window.scrollTo({ top: 0, behavior: suave ? "smooth" : "auto" });
    else s.scrollIntoView({ behavior: suave ? "smooth" : "auto" });
  }
  function poner(k, nuevo) {
    var url = "/" + k + location.hash.replace(/^#.*$/, "");
    var lang = new URLSearchParams(location.search).get("lang"); if (lang) url += "?lang=" + lang;
    if (location.pathname + location.search !== url) history[nuevo ? "pushState" : "replaceState"]({ k: k }, "", url);
  }
  document.addEventListener("DOMContentLoaded", function () {
    var k = ruta(); poner(k, false);
    setTimeout(function () { ir(k, false) }, k === "Home" ? 0 : 400);      // espera a que carguen fotos y textos
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-ir]"); if (!a) return;
      e.preventDefault(); var d = a.getAttribute("data-ir"); poner(d, true); ir(d, true);
    });
    window.addEventListener("popstate", function () { ir(ruta(), true) });
    // al ir bajando con el dedo o la rueda, la dirección se va cambiando sola
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting && porId[en.target.id]) poner(porId[en.target.id], false) });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(R).forEach(function (k) { var s = document.getElementById(R[k]); if (s) io.observe(s) });
    }
  });
})();
