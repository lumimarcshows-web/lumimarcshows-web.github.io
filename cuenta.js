// Cuentas de lumimarcshows.com (Firebase Authentication + Firestore). Las contraseñas las guarda Google, nunca esta web.
(function () {
  "use strict";
  var cfg = {
    apiKey: "AIzaSyBBz-A2LmBdAB7rJsnkmiB_dcxR7c1FJeI",
    authDomain: "lumimarcshows-a978c.firebaseapp.com",
    projectId: "lumimarcshows-a978c",
    storageBucket: "lumimarcshows-a978c.firebasestorage.app",
    messagingSenderId: "188689194543",
    appId: "1:188689194543:web:d55a2358a56d8d8288b0da"
  };
  var ZONA_MARC = "https://onedrive.live.com/";            // carpeta privada «Zona de Marc» (entra con su cuenta de Microsoft)
  if (!window.firebase) return;
  firebase.initializeApp(cfg);
  var auth = firebase.auth(), db = firebase.firestore();
  auth.languageCode = (document.documentElement.lang || "es");
  var T = window.lumiT || function (k, d) { return d };   // textos traducidos (idiomas.js)

  function el(t, cls, txt) { var e = document.createElement(t); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e }
  function modal(titulo) {
    var f = el("div", "lm-fondo"), c = el("div", "lm-caja"), x = el("button", "lm-x", "✕");
    x.type = "button"; x.setAttribute("aria-label", T("cerrar", "Cerrar")); x.onclick = function () { f.remove() };
    c.appendChild(x); c.appendChild(el("h3", "lm-tit", titulo)); f.appendChild(c);
    f.addEventListener("click", function (e) { if (e.target === f) f.remove() });
    document.body.appendChild(f); return { fondo: f, caja: c };
  }
  function campo(c, tipo, ph, auto) { var i = el("input", "lm-in"); i.type = tipo; i.placeholder = ph; if (auto) i.autocomplete = auto; c.appendChild(i); return i }
  function aviso(c) { var a = el("div", "lm-aviso"); c.appendChild(a); return a }
  function err(e) {
    var m = { "auth/invalid-email": T("e_email", "El correo no es válido."), "auth/email-already-in-use": T("e_usado", "Ya hay una cuenta con ese correo."),
      "auth/weak-password": T("e_debil", "La contraseña debe tener al menos 8 caracteres."), "auth/invalid-credential": T("e_mal", "Correo o contraseña incorrectos."),
      "auth/too-many-requests": T("e_muchos", "Demasiados intentos. Espera un poco.") };
    return m[e && e.code] || T("e_otro", "Algo ha fallado. Prueba otra vez.");
  }

  // ---------- entrar / crear cuenta ----------
  function abrirLogin(crear) {
    var m = modal(crear ? T("crear_cuenta", "Crear cuenta") : T("iniciar", "Iniciar sesión")), c = m.caja;
    var nombre = crear ? campo(c, "text", T("tu_nombre", "Tu nombre o apodo"), "nickname") : null;
    var email = campo(c, "email", T("correo", "Correo electrónico"), "email");
    var pass = campo(c, "password", T("contrasena", "Contraseña (mín. 8)"), crear ? "new-password" : "current-password");
    var ok18 = null;
    if (crear) {
      var l = el("label", "lm-check"); ok18 = el("input"); ok18.type = "checkbox"; l.appendChild(ok18);
      var s = el("span"); s.innerHTML = T("acepto_html", 'Tengo 14 años o más, o tengo permiso de mis padres, y acepto la <a href="privacidad.html" target="_blank">política de privacidad</a>.');
      l.appendChild(s); c.appendChild(l);
    }
    var a = aviso(c);
    var b = el("button", "btn oro lm-ancho", crear ? T("crear_cuenta", "Crear cuenta") : T("entrar", "Entrar")); b.type = "button"; c.appendChild(b);
    var otro = el("button", "lm-link", crear ? T("ya_tengo", "Ya tengo cuenta: iniciar sesión") : T("no_tengo", "¿No tienes cuenta? Crear una"));
    otro.type = "button"; otro.onclick = function () { m.fondo.remove(); abrirLogin(!crear) }; c.appendChild(otro);
    if (!crear) {
      var olv = el("button", "lm-link", T("olvide", "He olvidado la contraseña")); olv.type = "button"; c.appendChild(olv);
      olv.onclick = function () {
        if (!email.value.trim()) { a.textContent = T("pon_correo", "Escribe tu correo arriba y vuelve a pulsar."); return }
        auth.sendPasswordResetEmail(email.value.trim()).then(function () { a.textContent = T("enviado", "Te hemos enviado un correo para cambiarla.") }, function (e) { a.textContent = err(e) });
      };
    }
    b.onclick = function () {
      a.textContent = "";
      if (crear) {
        var n = nombre.value.trim();
        if (!n || n.length > 40) { a.textContent = T("e_nombre", "Escribe un nombre (máx. 40 letras)."); return }
        if (pass.value.length < 8) { a.textContent = T("e_debil", "La contraseña debe tener al menos 8 caracteres."); return }
        if (!ok18.checked) { a.textContent = T("e_acepta", "Marca la casilla para continuar."); return }
        b.disabled = true;
        auth.createUserWithEmailAndPassword(email.value.trim(), pass.value).then(function (r) {
          return r.user.updateProfile({ displayName: n }).then(function () {
            return db.collection("usuarios").doc(r.user.uid).set({ nombre: n, email: r.user.email, creado: firebase.firestore.FieldValue.serverTimestamp(), idioma: document.documentElement.lang || "es" });
          }).then(function () { try { r.user.sendEmailVerification() } catch (e) {} });
        }).then(function () { m.fondo.remove(); pintar(auth.currentUser, false) }, function (e) { b.disabled = false; a.textContent = err(e) });
      } else {
        b.disabled = true;
        auth.signInWithEmailAndPassword(email.value.trim(), pass.value).then(function () { m.fondo.remove() }, function (e) { b.disabled = false; a.textContent = err(e) });
      }
    };
    setTimeout(function () { (nombre || email).focus() }, 50);
  }

  // ---------- mi cuenta ----------
  function miCuenta(u, admin) {
    var m = modal("👤 " + (u.displayName || u.email)), c = m.caja;
    c.appendChild(el("div", "lm-sub", u.email));
    if (admin) {
      var p = el("button", "btn oro lm-ancho", "🔐 " + T("panel", "Panel de Marc")); p.type = "button";
      p.onclick = function () { m.fondo.remove(); panel() }; c.appendChild(p);
    }
    c.appendChild(el("div", "lm-et", T("cambiar_nombre", "Cambiar mi nombre")));
    var n = campo(c, "text", T("tu_nombre", "Tu nombre o apodo")); n.value = u.displayName || "";
    var a = aviso(c);
    var g = el("button", "btn vidrio lm-ancho", T("guardar", "Guardar")); g.type = "button"; c.appendChild(g);
    g.onclick = function () {
      var v = n.value.trim(); if (!v || v.length > 40) { a.textContent = T("e_nombre", "Escribe un nombre (máx. 40 letras)."); return }
      u.updateProfile({ displayName: v }).then(function () { return db.collection("usuarios").doc(u.uid).update({ nombre: v }) })
        .then(function () { a.textContent = "✅"; pintar(u, admin) }, function (e) { a.textContent = err(e) });
    };
    var s = el("button", "btn vidrio lm-ancho", T("salir", "Cerrar sesión")); s.type = "button"; c.appendChild(s);
    s.onclick = function () { auth.signOut(); m.fondo.remove() };
    var b = el("button", "lm-link lm-rojo", T("borrar_cuenta", "Borrar mi cuenta")); b.type = "button"; c.appendChild(b);
    b.onclick = function () {
      if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = T("seguro", "¿Seguro? Se borrará para siempre. Pulsa otra vez."); return }
      db.collection("usuarios").doc(u.uid).delete().catch(function () {}).then(function () { return u.delete() })
        .then(function () { m.fondo.remove() }, function (e) { a.textContent = e && e.code === "auth/requires-recent-login" ? T("reentra", "Por seguridad, cierra sesión, vuelve a entrar y bórrala.") : err(e) });
    };
  }

  // ---------- panel de Marc (administrador) ----------
  function panel() {
    var m = modal("🔐 " + T("panel", "Panel de Marc")), c = m.caja; c.classList.add("lm-grande");
    var zona = el("a", "btn oro lm-ancho", "⬇ " + T("desc_marc", "Descargar mi versión (Zona de Marc en OneDrive)"));
    zona.href = ZONA_MARC; zona.target = "_blank"; zona.rel = "noopener"; c.appendChild(zona);
    c.appendChild(el("div", "lm-sub", T("info_marc", "Tu versión con 📤 Publicar y 🌐 Editar web está en tu OneDrive privado. La música llega sola con OneDrive.")));
    c.appendChild(el("div", "lm-et", "📊 " + T("descargas", "Descargas")));
    var d = el("div", "lm-cifras", "…"); c.appendChild(d);
    var tipos = ["windows", "mac", "kit"], res = {};
    Promise.all(tipos.map(function (t) {
      return db.collection("descargas").where("tipo", "==", t).count().get().then(function (s) { res[t] = s.data().count });
    })).then(function () {
      d.textContent = ""; tipos.forEach(function (t) { var b = el("div", "dato"); b.appendChild(el("b", "", String(res[t]))); b.appendChild(document.createTextNode(t === "kit" ? "Kit" : t === "mac" ? "Mac" : "Windows")); d.appendChild(b) });
    }, function () { d.textContent = T("e_otro", "Algo ha fallado.") });
    c.appendChild(el("div", "lm-et", "👥 " + T("usuarios", "Personas inscritas")));
    var L = el("div", "lm-lista", "…"); c.appendChild(L);
    db.collection("usuarios").orderBy("creado", "desc").limit(500).get().then(function (q) {
      L.textContent = ""; if (q.empty) L.textContent = T("nadie", "Todavía no hay nadie.");
      var tot = el("div", "lm-sub", q.size + " " + T("personas", "personas")); L.appendChild(tot);
      q.forEach(function (doc) {
        var u = doc.data(), f = el("div", "lm-fila");
        var fecha = u.creado && u.creado.toDate ? u.creado.toDate().toLocaleDateString() : "";
        f.appendChild(el("span", "lm-n", u.nombre || "?")); f.appendChild(el("span", "lm-e", u.email || "")); f.appendChild(el("span", "lm-f", fecha));
        var ed = el("button", "lm-mini", "✏️"); ed.type = "button"; ed.title = T("cambiar_nombre", "Cambiar nombre");
        ed.onclick = function () { var v = prompt(T("nuevo_nombre", "Nuevo nombre:"), u.nombre || ""); if (v && v.trim()) doc.ref.update({ nombre: v.trim().slice(0, 40) }).then(function () { panel(); m.fondo.remove() }) };
        var x = el("button", "lm-mini lm-rojo", "🗑"); x.type = "button"; x.title = T("quitar", "Quitar de la lista");
        x.onclick = function () { if (!x.dataset.ok) { x.dataset.ok = 1; x.textContent = "¿?"; return } doc.ref.delete().then(function () { f.remove() }) };
        f.appendChild(ed); f.appendChild(x); L.appendChild(f);
      });
    }, function () { L.textContent = T("e_otro", "Algo ha fallado.") });
  }

  // ---------- botón de arriba ----------
  var hueco = document.getElementById("cuenta");
  function pintar(u, admin) {
    hueco.textContent = "";
    if (!u) {
      var b = el("button", "btn vidrio peq", "👤 " + T("iniciar", "Iniciar sesión")); b.type = "button"; b.onclick = function () { abrirLogin(false) }; hueco.appendChild(b);
    } else {
      var n = el("button", "btn vidrio peq", (admin ? "🔐 " : "👤 ") + (u.displayName || u.email.split("@")[0])); n.type = "button";
      n.onclick = function () { miCuenta(u, admin) }; hueco.appendChild(n);
    }
  }
  auth.onAuthStateChanged(function (u) {
    if (!u) { pintar(null); return }
    db.collection("admins").doc(u.uid).get().then(function (s) { pintar(u, s.exists) }, function () { pintar(u, false) });
  });

  // ---------- contar descargas (anónimo: solo el tipo, la fecha y el idioma) ----------
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-descarga]"); if (!a) return;
    db.collection("descargas").add({ tipo: a.getAttribute("data-descarga"), fecha: firebase.firestore.FieldValue.serverTimestamp(), idioma: document.documentElement.lang || "es" }).catch(function () {});
  });
})();
