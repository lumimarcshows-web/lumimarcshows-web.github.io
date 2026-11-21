// Editar la web DESDE LA WEB (solo la cuenta de Marc): 👁 Público / ✏️ Editar.
// Lo que se guarda va a Firestore (web/contenido y fotos/*). Todo el mundo lo lee; solo el administrador lo escribe.
(function () {
  "use strict";
  if (!window.firebase || !firebase.apps.length) return;
  window.lumiEditor = true;
  var db = firebase.firestore(), auth = firebase.auth();
  var T = window.lumiT || function (k, d) { return d };
  var C = null, base = null, admin = false, editando = false, fotosNuevas = {};
  var IDS = ["fuente", "videos", "descargar", "kit", "noticias"];
  var main = document.querySelector("main");
  function el(t, cls, txt) { var e = document.createElement(t); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e }
  function clon(o) { return JSON.parse(JSON.stringify(o)) }

  // ---------- leer: contenido.json (base) + lo guardado en Firestore (manda) ----------
  function fotoSrc(src) {
    if (!src || src.indexOf("fs:") !== 0) return Promise.resolve(src);
    var id = src.slice(3); if (fotosNuevas[id]) return Promise.resolve(fotosNuevas[id]);
    return db.collection("fotos").doc(id).get().then(function (d) { return d.exists ? d.data().data : "" }).catch(function () { return "" });
  }
  function resolver(lista) { return Promise.all((lista || []).map(function (f) { return fotoSrc(f.src || f.foto).then(function (s) { var o = clon(f); o._src = s; return o }) })) }

  function pintar() {
    var c = C;
    // textos (en castellano; en otros idiomas manda la traducción)
    if (!window.lumiLang || window.lumiLang === "es") {
      var Tx = c.textos || {}; document.querySelectorAll("[data-ed]").forEach(function (e) { var k = e.getAttribute("data-ed"); if (Tx[k] != null) e.textContent = Tx[k] });
    } else { var Tl = c["textos_" + window.lumiLang] || {}; document.querySelectorAll("[data-ed]").forEach(function (e) { var k = e.getAttribute("data-ed"); if (Tl[k] != null) e.textContent = Tl[k] }) }
    // fotos de la galería
    resolver(c.fotos).then(function (fs) {
      var g = document.getElementById("galeria"); g.textContent = "";
      fs.forEach(function (f, i) {
        var fi = el("figure"), im = el("img"); im.src = f._src; im.alt = f.texto || ""; im.loading = "lazy"; fi.appendChild(im);
        var fc = el("figcaption", "", f.texto || ""); fi.appendChild(fc); fi.dataset.i = i; g.appendChild(fi);
      });
      if (editando) modoEditar(true);
    });
    // vídeos (de la web o de YouTube)
    var V = document.getElementById("vids"); V.textContent = "";
    (c.videos || []).forEach(function (v, i) {
      var d = el("div", "vid"); d.dataset.i = i;
      var yt = /(?:youtu\.be\/|v=|embed\/)([\w-]{11})/.exec(v.src || "");
      if (yt) { var fr = el("iframe"); fr.src = "https://www.youtube-nocookie.com/embed/" + yt[1]; fr.allow = "autoplay; encrypted-media; picture-in-picture"; fr.allowFullscreen = true; fr.style.cssText = "width:100%;height:100%;border:0"; d.appendChild(fr) }
      else {
        var vi = el("video"); vi.src = v.src; vi.preload = "metadata"; vi.playsInline = true; vi.loop = true; vi.muted = true;
        vi.setAttribute("disablepictureinpicture", ""); vi.setAttribute("controlslist", "nodownload noremoteplayback"); d.appendChild(vi);
        var b = el("button", "play", "▶"); b.type = "button"; b.setAttribute("aria-label", "Reproducir"); d.appendChild(b);
        (function (vi, b, d) { function tog() { if (vi.paused) { vi.play(); d.classList.add("on") } else { vi.pause(); d.classList.remove("on") } } b.onclick = tog; vi.onclick = tog })(vi, b, d);
      }
      d.appendChild(el("span", "tit", v.titulo || "")); V.appendChild(d);
    });
    // novedades
    resolver((c.noticias || []).map(function (n) { var o = clon(n); o.src = n.foto; return o })).then(function (ns) {
      var L = document.getElementById("lista"); L.textContent = "";
      ns.forEach(function (n, i) {
        var a = el("article", "noticia" + (n._src ? "" : " sin-foto")); a.dataset.i = i;
        if (n._src) { var im = el("img"); im.src = n._src; im.alt = n.titulo || ""; im.loading = "lazy"; a.appendChild(im) }
        var d = el("div"); d.appendChild(el("time", "", n.fecha || "")); d.appendChild(el("h3", "", n.titulo || ""));
        var p = el("p", "", n.texto || ""); p.style.cssText = "margin:0;white-space:pre-line"; d.appendChild(p); a.appendChild(d); L.appendChild(a);
      });
      if (editando) modoEditar(true);
    });
    // secciones nuevas (extra) y orden
    document.querySelectorAll("section.extra").forEach(function (s) { s.remove() });
    resolver(c.extra).then(function (xs) {
      document.querySelectorAll("section.extra").forEach(function (s) { s.remove() });
      xs.forEach(function (x) {
        var s = el("section", "extra"); s.id = x.id; var w = el("div", "wrap");
        w.appendChild(el("h2", "", x.titulo || "")); var p = el("p", "sub", x.texto || ""); p.style.whiteSpace = "pre-line"; w.appendChild(p);
        if (x._src) { var im = el("img"); im.src = x._src; im.alt = x.titulo || ""; im.style.cssText = "border-radius:16px;border:1px solid var(--line);max-height:480px;object-fit:cover;width:100%"; w.appendChild(im) }
        s.appendChild(w); main.appendChild(s);
      });
      var orden = (c.orden && c.orden.length ? c.orden : IDS).slice();
      IDS.concat(xs.map(function (x) { return x.id })).forEach(function (id) { if (orden.indexOf(id) < 0) orden.push(id) });
      orden.forEach(function (id) { var s = document.getElementById(id); if (s && s.tagName === "SECTION") main.appendChild(s) });
      if (editando) modoEditar(true);
    });
  }

  function cargar() {
    return fetch("/contenido.json", { cache: "no-store" }).then(function (r) { return r.json() }).catch(function () { return {} }).then(function (j) {
      base = j;
      return db.collection("web").doc("contenido").get().then(function (d) { return d.exists ? d.data() : null }).catch(function () { return null });
    }).then(function (fs) {
      C = clon(base || {});
      if (fs) ["textos", "fotos", "videos", "noticias", "extra", "orden"].forEach(function (k) { if (fs[k] != null) C[k] = fs[k] });
      if (C.textos && base.textos) C.textos = Object.assign({}, base.textos, C.textos);
      pintar();
    });
  }

  // ---------- barra de Marc: 👁 Público / ✏️ Editar / 💾 Guardar ----------
  var barra = el("div", "lm-barra"); barra.hidden = true;
  var bP = el("button", "on", "👁 " + T("publico", "Público")), bE = el("button", "", "✏️ " + T("editar", "Editar")), bG = el("button", "guardar", "💾 " + T("guardar", "Guardar"));
  [bP, bE, bG].forEach(function (b) { b.type = "button"; barra.appendChild(b) }); bG.hidden = true;
  var estado = el("div", "lm-estado"); document.body.appendChild(estado);
  document.body.appendChild(barra);
  function altoNav() { var n = document.querySelector("nav"); if (n) document.documentElement.style.setProperty("--navh", n.offsetHeight + "px") }
  altoNav(); window.addEventListener("resize", altoNav);
  bP.onclick = function () {
    if (editando && sinGuardar && !bP.dataset.ok) { bP.dataset.ok = 1; estado.textContent = T("sin_guardar", "Hay cambios sin guardar. Pulsa otra vez para salir sin guardar."); return }
    delete bP.dataset.ok; editando = false; sinGuardar = false; bP.classList.add("on"); bE.classList.remove("on"); bG.hidden = true; estado.textContent = ""; document.body.classList.remove("lm-editando"); cargar();
  };
  bE.onclick = function () { if (!admin) { barra.hidden = true; return } editando = true; bE.classList.add("on"); bP.classList.remove("on"); bG.hidden = false; document.body.classList.add("lm-editando"); estado.textContent = T("modo_editar", "Toca los textos para cambiarlos."); modoEditar(true) };
  var sinGuardar = false;
  function cambio() { sinGuardar = true; estado.textContent = "✏️ " + T("cambios", "Cambios sin guardar") }

  bG.onclick = function () {
    bG.disabled = true; estado.textContent = "⏳ " + T("guardando", "Guardando…");
    var fotos = Object.keys(fotosNuevas);
    Promise.all(fotos.map(function (id) { return db.collection("fotos").doc(id).set({ data: fotosNuevas[id] }) })).then(function () {
      var g = clon({ textos: C.textos || {}, fotos: C.fotos || [], videos: C.videos || [], noticias: C.noticias || [], extra: C.extra || [], orden: C.orden || [] });
      g.actualizado = firebase.firestore.FieldValue.serverTimestamp();
      return db.collection("web").doc("contenido").set(g);
    }).then(function () { fotosNuevas = {}; sinGuardar = false; bG.disabled = false; estado.textContent = "✅ " + T("guardado", "¡Guardado! Ya lo ve todo el mundo.") },
      function (e) { bG.disabled = false; estado.textContent = "⚠ " + (e && e.code === "permission-denied" ? T("sin_permiso", "Sin permiso") : T("e_otro", "Algo ha fallado.")) });
  };

  // ---------- modo editar ----------
  function boton(txt, f, cls) { var b = el("button", "lm-ed-b" + (cls ? " " + cls : ""), txt); b.type = "button"; b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); f() }; return b }
  function pedirFoto(cb) {
    var i = el("input"); i.type = "file"; i.accept = "image/*";
    i.onchange = function () {
      var f = i.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { var im = new Image(); im.onload = function () {
        var k = Math.min(1, 1100 / Math.max(im.width, im.height)), cv = document.createElement("canvas"); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); var q = .82, d = cv.toDataURL("image/jpeg", q);
        while (d.length > 900000 && q > .4) { q -= .1; d = cv.toDataURL("image/jpeg", q) }
        var id = "f" + Date.now(); fotosNuevas[id] = d; cb("fs:" + id);
      }; im.src = r.result };
      r.readAsDataURL(f);
    };
    i.click();
  }
  function limpiar() { document.querySelectorAll(".lm-ed").forEach(function (e) { e.remove() }); document.querySelectorAll("[contenteditable]").forEach(function (e) { e.removeAttribute("contenteditable") }) }
  function modoEditar(on) {
    limpiar(); if (!on || !editando) return;
    // textos tocables (solo en castellano, que es el idioma que se guarda)
    if (!window.lumiLang || window.lumiLang === "es") {
      document.querySelectorAll("[data-ed]").forEach(function (e) {
        e.setAttribute("contenteditable", "true");
        e.oninput = function () { C.textos = C.textos || {}; C.textos[e.getAttribute("data-ed")] = e.textContent.trim(); cambio() };
      });
    } else estado.textContent = T("solo_es", "Para cambiar los textos, pon la web en ES.");
    // secciones: subir / bajar
    var orden = (C.orden && C.orden.length ? C.orden : IDS).slice();
    (C.extra || []).forEach(function (x) { if (orden.indexOf(x.id) < 0) orden.push(x.id) });
    IDS.forEach(function (id) { if (orden.indexOf(id) < 0) orden.push(id) });
    orden.forEach(function (id, i) {
      var s = document.getElementById(id); if (!s) return;
      var h = el("div", "lm-ed lm-ed-sec");
      h.appendChild(boton("⬆", function () { if (i > 0) { orden.splice(i - 1, 0, orden.splice(i, 1)[0]); C.orden = orden; cambio(); pintar() } }));
      h.appendChild(boton("⬇", function () { if (i < orden.length - 1) { orden.splice(i + 1, 0, orden.splice(i, 1)[0]); C.orden = orden; cambio(); pintar() } }));
      var x = (C.extra || []).filter(function (e) { return e.id === id })[0];
      if (x) {
        h.appendChild(boton("✏️ " + T("cambiar", "Cambiar"), function () {
          var t = prompt(T("titulo_sec", "Título de la sección:"), x.titulo || ""); if (t == null) return;
          var tx = prompt(T("texto_sec", "Texto:"), x.texto || ""); if (tx == null) return; x.titulo = t; x.texto = tx; cambio(); pintar() }));
        h.appendChild(boton("🖼 " + T("foto", "Foto"), function () { pedirFoto(function (src) { x.foto = src; x.src = src; cambio(); pintar() }) }));
        h.appendChild(boton("🗑", function () { C.extra = C.extra.filter(function (e) { return e.id !== id }); C.orden = orden.filter(function (o) { return o !== id }); cambio(); pintar() }, "rojo"));
      }
      s.insertBefore(h, s.firstChild);
    });
    // añadir sección nueva
    var nueva = el("div", "lm-ed lm-ed-nueva wrap");
    nueva.appendChild(boton("➕ " + T("nueva_sec", "Añadir una sección nueva"), function () {
      var t = prompt(T("titulo_sec", "Título de la sección:"), ""); if (!t) return;
      var tx = prompt(T("texto_sec", "Texto:"), "") || "";
      var id = "x" + Date.now(); C.extra = (C.extra || []).concat([{ id: id, titulo: t, texto: tx }]);
      C.orden = orden.concat([id]); cambio(); pintar();
    }, "grande"));
    main.appendChild(nueva);
    // fotos
    var g = document.getElementById("galeria");
    g.querySelectorAll("figure").forEach(function (fi) {
      var i = +fi.dataset.i, f = C.fotos[i], h = el("div", "lm-ed lm-ed-mini");
      h.appendChild(boton("⬅", function () { if (i > 0) { C.fotos.splice(i - 1, 0, C.fotos.splice(i, 1)[0]); cambio(); pintar() } }));
      h.appendChild(boton("➡", function () { if (i < C.fotos.length - 1) { C.fotos.splice(i + 1, 0, C.fotos.splice(i, 1)[0]); cambio(); pintar() } }));
      h.appendChild(boton("✏️", function () { var t = prompt(T("pie", "Pie de foto:"), f.texto || ""); if (t != null) { f.texto = t; cambio(); pintar() } }));
      h.appendChild(boton("🗑", function () { C.fotos.splice(i, 1); cambio(); pintar() }, "rojo"));
      fi.style.position = "relative"; fi.appendChild(h);
    });
    var af = el("div", "lm-ed"); af.appendChild(boton("➕ " + T("anadir_foto", "Añadir foto"), function () { pedirFoto(function (src) { C.fotos = (C.fotos || []).concat([{ src: src, texto: "" }]); cambio(); pintar() }) }, "grande"));
    g.parentNode.insertBefore(af, g.nextSibling);
    // vídeos
    var V = document.getElementById("vids");
    V.querySelectorAll(".vid").forEach(function (d) {
      var i = +d.dataset.i, v = C.videos[i], h = el("div", "lm-ed lm-ed-mini");
      h.appendChild(boton("⬅", function () { if (i > 0) { C.videos.splice(i - 1, 0, C.videos.splice(i, 1)[0]); cambio(); pintar() } }));
      h.appendChild(boton("➡", function () { if (i < C.videos.length - 1) { C.videos.splice(i + 1, 0, C.videos.splice(i, 1)[0]); cambio(); pintar() } }));
      h.appendChild(boton("✏️", function () { var t = prompt(T("titulo_video", "Título del vídeo:"), v.titulo || ""); if (t != null) { v.titulo = t; cambio(); pintar() } }));
      h.appendChild(boton("🗑", function () { C.videos.splice(i, 1); cambio(); pintar() }, "rojo"));
      d.appendChild(h);
    });
    var av = el("div", "lm-ed"); av.appendChild(boton("➕ " + T("anadir_video", "Añadir vídeo (enlace de YouTube)"), function () {
      var u = prompt(T("enlace_yt", "Pega el enlace del vídeo de YouTube:"), ""); if (!u) return;
      if (!/(youtu\.be\/|youtube\.com\/)/.test(u)) { alert(T("solo_yt", "Tiene que ser un enlace de YouTube. Los vídeos grandes se suben desde la app (🌐 Editar web).")); return }
      var t = prompt(T("titulo_video", "Título del vídeo:"), "") || ""; C.videos = (C.videos || []).concat([{ src: u, titulo: t }]); cambio(); pintar();
    }, "grande"));
    V.parentNode.insertBefore(av, V.nextSibling);
    // novedades
    var L = document.getElementById("lista");
    L.querySelectorAll(".noticia").forEach(function (a) {
      var i = +a.dataset.i, n = C.noticias[i], h = el("div", "lm-ed lm-ed-mini");
      h.appendChild(boton("✏️", function () { var t = prompt(T("titulo_sec", "Título:"), n.titulo || ""); if (t == null) return; var tx = prompt(T("texto_sec", "Texto:"), n.texto || ""); if (tx == null) return; n.titulo = t; n.texto = tx; cambio(); pintar() }));
      h.appendChild(boton("🖼", function () { pedirFoto(function (src) { n.foto = src; cambio(); pintar() }) }));
      h.appendChild(boton("🗑", function () { C.noticias.splice(i, 1); cambio(); pintar() }, "rojo"));
      a.style.position = "relative"; a.appendChild(h);
    });
    var an = el("div", "lm-ed"); an.appendChild(boton("➕ " + T("anadir_novedad", "Añadir novedad"), function () {
      var t = prompt(T("titulo_sec", "Título:"), ""); if (!t) return; var tx = prompt(T("texto_sec", "Texto:"), "") || "";
      var hoy = new Date(); var f = ("0" + hoy.getDate()).slice(-2) + "/" + ("0" + (hoy.getMonth() + 1)).slice(-2) + "/" + hoy.getFullYear();
      C.noticias = [{ fecha: f, titulo: t, texto: tx }].concat(C.noticias || []); cambio(); pintar();
    }, "grande"));
    L.parentNode.insertBefore(an, L);
  }

  // ---------- quién es ----------
  auth.onAuthStateChanged(function (u) {
    if (!u) { admin = false; barra.hidden = true; if (editando) { editando = false; document.body.classList.remove("lm-editando"); limpiar() } return }
    db.collection("admins").doc(u.uid).get().then(function (s) { admin = s.exists; barra.hidden = !admin }, function () { barra.hidden = true });
  });
  window.addEventListener("beforeunload", function (e) { if (editando && sinGuardar) { e.preventDefault(); e.returnValue = "" } });
  cargar();
})();
