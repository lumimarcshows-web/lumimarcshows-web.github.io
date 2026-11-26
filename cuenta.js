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
  var ZONA_MARC = "https://onedrive.live.com/";
  var EJS = { key: "bZ4YcICQyd1tgftt2", servicio: "service_lumimarc", plantilla: "template_lumimarc" };   // no son secretos
  // reCAPTCHA de Google (claves PÚBLICAS de sitio web; las secretas nunca van en la web)
  var RC_CASILLA = "6LdL2SwuAAAAAIDaSzC0HuTPm4dGmPXeeDR9zffv";      // casilla «No soy un robot» (después del chorro y en los correos)
  var RC_APPCHECK = "6Lce2iwuAAAAAGUD1GYzKwGaD5behbfCEmWKFEO9";     // invisible: Firebase App Check
  if (window.emailjs) emailjs.init({ publicKey: EJS.key });
  var BAJA = { es: "Recibes este correo porque te apuntaste a las novedades de lumimarcshows.com. Para dejar de recibirlas, entra en «Mi cuenta» y desmarca la casilla.",
    ca: "Reps aquest correu perquè et vas apuntar a les novetats de lumimarcshows.com. Per deixar de rebre-les, entra a «El meu compte» i desmarca la casella.",
    en: "You get this email because you signed up for lumimarcshows.com news. To stop, go to «My account» and untick the box.",
    fr: "Tu reçois cet e-mail car tu t'es inscrit aux nouveautés de lumimarcshows.com. Pour arrêter, va dans « Mon compte » et décoche la case." };
  // tok = respuesta de la casilla de Google: EmailJS la comprueba, así nadie puede mandar correos «de Lumimarc» sin pasarla
  function correo(para, asunto, titulo, texto, boton, ruta, pie, tok, bcc) {
    if (!window.emailjs) return Promise.reject(new Error("sin emailjs"));
    return emailjs.send(EJS.servicio, EJS.plantilla, { to_email: para, bcc: bcc || "", asunto: asunto, titulo: titulo, texto: texto, boton: boton, ruta: ruta || "/Home", pie: pie || "", "g-recaptcha-response": tok || "" });
  }
  // ---------- casilla «No soy un robot» de Google ----------
  var rcCola = null;
  function cargarRC(fn) {
    if (window.grecaptcha && grecaptcha.render) return grecaptcha.ready(fn);
    if (rcCola) { rcCola.push(fn); return } rcCola = [fn];
    window.lmRcListo = function () { var c = rcCola; rcCola = null; c.forEach(function (f) { f() }) };
    var sc = document.createElement("script"); sc.async = true;
    sc.src = "https://www.google.com/recaptcha/api.js?onload=lmRcListo&render=explicit&hl=" + (document.documentElement.lang || "es");
    document.head.appendChild(sc);
  }
  function casillaGoogle(c) {
    var d = el("div", "lm-rc"), tok = "", id = null; c.appendChild(d);
    cargarRC(function () { id = grecaptcha.render(d, { sitekey: RC_CASILLA, theme: "dark",
      callback: function (t) { tok = t }, "expired-callback": function () { tok = "" }, "error-callback": function () { tok = "" } }) });
    return { tok: function () { return tok }, reset: function () { tok = ""; if (id !== null) try { grecaptcha.reset(id) } catch (e) {} } };
  }            // carpeta privada «Zona de Marc» (entra con su cuenta de Microsoft)
  if (!window.firebase) return;
  firebase.initializeApp(cfg);
  // App Check: Google comprueba en secreto que quien habla con Firebase es esta web de verdad (y no un robot con un programa)
  try { if (firebase.appCheck) firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(RC_APPCHECK), true) } catch (e) {}
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
  // ---------- prueba "no soy un robot": tocar el chorro del color que se pide ----------
  var intentos = { n: 0, t: 0 };
  var COLORES = [["rojo", "#ff4d5e", "red", "vermell", "rouge"], ["azul", "#3fa0ff", "blue", "blau", "bleu"], ["verde", "#3fd07a", "green", "verd", "vert"], ["amarillo", "#ffd23f", "yellow", "groc", "jaune"], ["morado", "#b56bff", "purple", "lila", "violet"]];
  function pruebaRobot(c) {
    var caja = el("div", "lm-robot"), lg = document.documentElement.lang || "es", ix = { es: 0, en: 2, ca: 3, fr: 4 }[lg] || 0;
    var lista = COLORES.slice().sort(function () { return Math.random() - .5 }).slice(0, 4), bueno = lista[Math.floor(Math.random() * 4)], hecho = false;
    var txt = el("div", "lm-robot-t", "🤖 " + T("no_robot", "¿Eres una persona? Toca el chorro de color") + " "); var nb = el("b", "", bueno[ix]); nb.style.color = bueno[1]; txt.appendChild(nb); caja.appendChild(txt);
    var fila = el("div", "lm-robot-f");
    lista.forEach(function (col) {
      var bt = el("button", "lm-chorro"); bt.type = "button"; bt.style.setProperty("--c", col[1]); bt.setAttribute("aria-label", col[ix]);
      bt.onclick = function () {
        if (col === bueno) { if (!hecho) g = casillaGoogle(caja); hecho = true; caja.classList.add("ok"); txt.textContent = "✅ " + T("eres_persona", "¡Perfecto! Ahora marca la casilla de Google.") }
        else { hecho = false; caja.classList.add("mal"); setTimeout(function () { caja.classList.remove("mal") }, 500) }
      };
      fila.appendChild(bt);
    });
    caja.appendChild(fila); c.appendChild(caja);
    var g = null;   // la casilla de Google sale DESPUÉS de tocar el chorro bueno
    return { ok: function () { return hecho }, google: function () { return g ? g.tok() : "" }, reset: function () { if (g) g.reset() } };
  }
  function abrirLogin(crear, avisoTxt) {
    var m = modal(crear ? T("crear_cuenta", "Crear cuenta") : T("iniciar", "Iniciar sesión"));
    if (avisoTxt) { var av = el("div", "lm-aviso-desc", "🔒 " + avisoTxt); m.caja.appendChild(av) }
    var c = el("form", "lm-form"); c.method = "post"; c.action = "#"; c.autocomplete = "on"; m.caja.appendChild(c);
    var nombre = crear ? campo(c, "text", T("tu_nombre", "Tu nombre o apodo"), "nickname") : null;
    var email = campo(c, "email", T("correo", "Correo electrónico"), "username"); email.name = "email"; email.id = "lm-email";
    var pass = campo(c, "password", T("contrasena", "Contraseña (mín. 8)"), crear ? "new-password" : "current-password"); pass.name = "password"; pass.id = "lm-pass"; pass.minLength = 8;
    if (nombre) { nombre.name = "name"; nombre.id = "lm-nombre" }
    var ok18 = null;
    if (crear) {
      var l = el("label", "lm-check"); ok18 = el("input"); ok18.type = "checkbox"; l.appendChild(ok18);
      var s = el("span"); s.innerHTML = T("acepto_html", 'Tengo 14 años o más, o tengo permiso de mis padres, y acepto la <a href="privacidad.html" target="_blank">política de privacidad</a>.');
      l.appendChild(s); c.appendChild(l);
      var l2 = el("label", "lm-check"); var avisos = el("input"); avisos.type = "checkbox"; avisos.id = "lm-avisos"; l2.appendChild(avisos);
      l2.appendChild(el("span", "", T("quiero_avisos", "Quiero recibir las novedades de Lumimarc por correo (puedes quitarlo cuando quieras)."))); c.appendChild(l2);
    }
    var trampa = el("input"); trampa.type = "text"; trampa.name = "web_site"; trampa.tabIndex = -1; trampa.autocomplete = "off";
    trampa.setAttribute("aria-hidden", "true"); trampa.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0"; c.appendChild(trampa);
    var abierto = Date.now();
    var robot = pruebaRobot(c);
    var a = aviso(c);
    var b = el("button", "btn oro lm-ancho", crear ? T("crear_cuenta", "Crear cuenta") : T("entrar", "Entrar")); b.type = "submit"; c.appendChild(b);
    c.addEventListener("submit", function (e) { e.preventDefault(); b.onclick() });
    var otro = el("button", "lm-link", crear ? T("ya_tengo", "Ya tengo cuenta: iniciar sesión") : T("no_tengo", "¿No tienes cuenta? Crear una"));
    otro.type = "button"; otro.onclick = function () { m.fondo.remove(); abrirLogin(!crear, avisoTxt) }; c.appendChild(otro);
    if (!crear) {
      var olv = el("button", "lm-link", T("olvide", "He olvidado la contraseña")); olv.type = "button"; c.appendChild(olv);
      olv.onclick = function () {
        if (!email.value.trim()) { a.textContent = T("pon_correo", "Escribe tu correo arriba y vuelve a pulsar."); return }
        if (esRobot()) return;
        auth.sendPasswordResetEmail(email.value.trim()).then(function () { a.textContent = T("enviado", "Te hemos enviado un correo para cambiarla.") }, function (e) { a.textContent = err(e) });
      };
    }
    function esRobot() {
      if (trampa.value) return true;                                    // ha rellenado la trampa invisible
      if (Date.now() - abierto < 2500) { a.textContent = T("muy_rapido", "Demasiado rápido 🤖. Espera un momento y vuelve a pulsar."); return true }
      if (!robot.ok()) { a.textContent = T("e_robot", "Haz la prueba: toca el chorro que se te pide."); return true }
      if (!robot.google()) { a.textContent = T("e_google", "Ahora marca la casilla «No soy un robot» de Google."); return true }
      if (intentos.n >= 5 && Date.now() - intentos.t < 60000) { a.textContent = T("e_espera", "Demasiados intentos. Espera 1 minuto."); return true }
      return false;
    }
    b.onclick = function () {
      a.textContent = "";
      if (esRobot()) return;
      intentos.n = (Date.now() - intentos.t > 60000) ? 1 : intentos.n + 1; intentos.t = Date.now();
      if (crear) {
        var n = nombre.value.trim();
        if (!n || n.length > 40) { a.textContent = T("e_nombre", "Escribe un nombre (máx. 40 letras)."); return }
        if (pass.value.length < 8) { a.textContent = T("e_debil", "La contraseña debe tener al menos 8 caracteres."); return }
        if (!ok18.checked) { a.textContent = T("e_acepta", "Marca la casilla para continuar."); return }
        b.disabled = true; recienCreada = true; var tokBien = robot.google();
        auth.createUserWithEmailAndPassword(email.value.trim(), pass.value).then(function (r) {
          return r.user.updateProfile({ displayName: n }).then(function () {
            return db.collection("usuarios").doc(r.user.uid).set({ nombre: n, email: r.user.email, creado: firebase.firestore.FieldValue.serverTimestamp(), idioma: document.documentElement.lang || "es", avisos: !!document.getElementById("lm-avisos").checked });
          }).then(function () {
            try { r.user.sendEmailVerification() } catch (e) {}
            // correo de bienvenida (en su idioma)
            correo(r.user.email, T("m_bien_asunto", "¡Bienvenido/a a Lumimarc Shows! 🎉"), T("bienvenida", "¡Bienvenido/a") + ", " + n + "!",
              T("m_bien_texto", "Tu cuenta de Lumimarc ya está creada.\n\nAhora puedes descargar el programa Fuente Musical DMX, el kit para construir tu fuente y ver los vídeos de los espectáculos.\n\nTambién te hemos enviado otro correo para confirmar tu dirección: ábrelo y pulsa el enlace."),
              T("m_bien_boton", "Ir a Lumimarc"), "/Home", "lumimarcshows.com", tokBien).catch(function () {});
          });
        }).then(function () { m.fondo.remove(); pintar(auth.currentUser, false) }, function (e) { b.disabled = false; robot.reset(); a.textContent = err(e) });
      } else {
        b.disabled = true;
        auth.signInWithEmailAndPassword(email.value.trim(), pass.value).then(function () { m.fondo.remove() }, function (e) { b.disabled = false; robot.reset(); a.textContent = err(e) });
      }
    };
    setTimeout(function () { (nombre || email).focus() }, 50);
  }

  // ---------- mi cuenta ----------
  function miCuenta(u, admin) {
    var m = modal("👤 " + (u.displayName || u.email)), c = m.caja;
    c.appendChild(el("div", "lm-sub", u.email + "  " + (u.emailVerified ? "✅ " + T("verificado", "verificado") : "⚠️ " + T("no_verificado", "sin verificar"))));
    var la = el("label", "lm-check"), ca = el("input"); ca.type = "checkbox"; la.appendChild(ca);
    la.appendChild(el("span", "", T("quiero_avisos", "Quiero recibir las novedades de Lumimarc por correo (puedes quitarlo cuando quieras).")));
    c.appendChild(la);
    db.collection("usuarios").doc(u.uid).get().then(function (s) { ca.checked = !!(s.exists && s.data().avisos) });
    ca.onchange = function () { db.collection("usuarios").doc(u.uid).update({ avisos: ca.checked }).catch(function () { ca.checked = !ca.checked }) };
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

  // descarga CIFRADA: la clave está en Firestore (privado/<doc>) y solo la puede leer quien tiene permiso
  function bajarCifrado(doc, url, nombre) {
    return db.collection("privado").doc(doc).get().then(function (d) {
      if (!d.exists || !d.data().clave) throw new Error("sin clave");
      var bin = atob(d.data().clave), k = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) k[i] = bin.charCodeAt(i);
      return Promise.all([crypto.subtle.importKey("raw", k, "AES-GCM", false, ["decrypt"]),
        fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.arrayBuffer() })]);
    }).then(function (r) {
      var buf = new Uint8Array(r[1]);
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, r[0], buf.slice(12));
    }).then(function (zip) {
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
      a.download = nombre; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 10000);
    });
  }
  function bajarMarc(tipo, b, txt) {
    b.disabled = true; b.textContent = "⏳ " + T("preparando", "Preparando…");
    bajarCifrado("zona", "/descargas/privado/" + tipo + ".bin", "Fuente Musical DMX (Marc) para " + (tipo === "mac" ? "Mac" : "Windows") + ".zip").then(function () {
      b.disabled = false; b.textContent = "✅ " + T("descargado", "Descargado");
      setTimeout(function () { b.textContent = txt }, 4000);
    }).catch(function (e) {
      b.disabled = false; b.textContent = "⚠ " + (e && e.code === "permission-denied" ? T("sin_permiso", "Sin permiso") : T("e_otro", "Algo ha fallado."));
      setTimeout(function () { b.textContent = txt }, 4000);
    });
  }
  // descargas PÚBLICAS: en la web están cifradas (archivo.zip.bin); con el enlace directo y sin cuenta no sirven para nada
  function bajarPublica(a) {
    var url = a.href.split("#")[0].split("?")[0], nombre = decodeURIComponent(url.split("/").pop());
    var txt = a.textContent; a.textContent = "⏳ " + T("preparando", "Preparando…"); a.style.pointerEvents = "none";
    bajarCifrado("publica", url + ".bin", nombre).then(function () {
      a.textContent = "✅ " + T("descargado", "Descargado");
    }, function (e) {
      a.textContent = "⚠ " + (e && e.code === "permission-denied" ? T("sin_permiso", "Sin permiso") : T("e_otro", "Algo ha fallado."));
    }).then(function () { a.style.pointerEvents = ""; setTimeout(function () { a.textContent = txt }, 4000) });
  }
  // ---------- panel de Marc (administrador) ----------
  function panel() {
    var m = modal("🔐 " + T("panel", "Panel de Marc")), c = m.caja; c.classList.add("lm-grande");
    var zona = el("a", "btn oro lm-ancho", "⬇ " + T("desc_marc", "Descargar mi versión (Zona de Marc en OneDrive)"));
    zona.href = ZONA_MARC; zona.target = "_blank"; zona.rel = "noopener"; c.appendChild(zona);
    // 🤖 controlador de Otto (solo aquí, en el Panel de Marc)
    var otto = el("button", "btn oro lm-ancho", "🤖 " + T("otto", "Abrir el controlador de Otto")); otto.type = "button";
    otto.onclick = function () {
      function va() { m.fondo.remove(); window.OttoControl.abrir() }
      if (window.OttoControl) return va();
      var sc = document.createElement("script"); sc.src = "/otto.js?v=20261126h"; sc.onload = va; document.head.appendChild(sc);
    };
    c.appendChild(otto);
    c.appendChild(el("div", "lm-sub", T("info_marc", "Tu versión con 📤 Publicar y 🌐 Editar web está en tu OneDrive privado. La música llega sola con OneDrive.")));
    // descargas de la versión de Marc (cifradas en la web; la clave solo la puede leer el administrador en Firestore)
    var cd = el("div", "lm-marc-desc");
    cd.appendChild(el("div", "lm-et", "💻 " + T("prog_marc", "Descargar mi programa (con 📤 Publicar y 🌐 Editar web)")));
    var ver = el("div", "lm-sub", ""); cd.appendChild(ver);
    fetch("/contenido.json", { cache: "no-store" }).then(function (r) { return r.json() }).then(function (j) {
      if (j.version) ver.textContent = T("misma_version", "Versión") + " " + j.version + " · " + T("sincro", "la misma que la pública, se actualiza sola al publicar");
    }).catch(function () {});
    var fila = el("div", "lm-marc-bots");
    [["windows", "⬇ " + T("desc_win", "Descargar para Windows"), "btn oro"], ["mac", "🍎 " + T("desc_mac", "Descargar para Mac"), "btn vidrio"]].forEach(function (x) {
      var b = el("button", x[2], x[1]); b.type = "button"; b.onclick = function () { bajarMarc(x[0], b, x[1]) }; fila.appendChild(b);
    });
    cd.appendChild(fila);
    cd.appendChild(el("div", "lm-sub", T("nota_marc", "Sin música (llega sola con OneDrive). En Windows, para publicar desde otro ordenador: abre «Preparar publicar.bat» en la carpeta del programa. En Mac todavía no se puede publicar.")));
    c.appendChild(cd);
    c.appendChild(el("div", "lm-et", "📊 " + T("descargas", "Descargas")));
    var d = el("div", "lm-cifras", "…"); c.appendChild(d);
    var tipos = ["windows", "mac", "kit"], res = {};
    Promise.all(tipos.map(function (t) {
      return db.collection("descargas").where("tipo", "==", t).count().get().then(function (s) { res[t] = s.data().count });
    })).then(function () {
      d.textContent = ""; tipos.forEach(function (t) { var b = el("div", "dato"); b.appendChild(el("b", "", String(res[t]))); b.appendChild(document.createTextNode(t === "kit" ? "Kit" : t === "mac" ? "Mac" : "Windows")); d.appendChild(b) });
    }, function () { d.textContent = T("e_otro", "Algo ha fallado.") });
    c.appendChild(el("div", "lm-et", "📣 " + T("enviar_correo", "Enviar un correo a los suscritos")));
    var eA = campo(c, "text", T("m_asunto", "Asunto (por ejemplo: ¡Show nuevo en Lumimarc!)"));
    var eT = campo(c, "text", T("m_titulo", "Título grande del correo"));
    var eX = el("textarea", "lm-in"); eX.placeholder = T("m_texto", "Escribe el mensaje…"); eX.style.height = "90px"; c.appendChild(eX);
    var eB = campo(c, "text", T("m_boton", "Texto del botón (por ejemplo: Ver la novedad)")); eB.value = T("ver_novedades", "Ver las novedades");
    var ult = el("button", "lm-link", "↺ " + T("usar_ultima", "Rellenar con la última novedad de la web")); ult.type = "button"; c.appendChild(ult);
    ult.onclick = function () { fetch("/contenido.json", { cache: "no-store" }).then(function (r) { return r.json() }).then(function (cc) { var n = (cc.noticias || [])[0]; if (!n) return;
      eA.value = "Lumimarc: " + n.titulo; eT.value = n.titulo; eX.value = n.texto || "" }) };
    var fila = el("div", "fila"), prueba = el("button", "btn vidrio peq", "🧪 " + T("prueba", "Enviarme una prueba")), todos = el("button", "btn oro peq", "📣 " + T("enviar_todos", "Enviar a todos los suscritos"));
    prueba.type = todos.type = "button"; fila.appendChild(prueba); fila.appendChild(todos); c.appendChild(fila);
    var gN = casillaGoogle(c);
    var eS = aviso(c);
    function datosOk() { if (!eA.value.trim() || !eT.value.trim() || !eX.value.trim()) { eS.textContent = T("m_falta", "Rellena el asunto, el título y el mensaje."); return false }
      if (!gN.tok()) { eS.textContent = T("e_google", "Ahora marca la casilla «No soy un robot» de Google."); return false } return true }
    prueba.onclick = function () { if (!datosOk()) return; eS.textContent = "⏳";
      correo(auth.currentUser.email, eA.value.trim(), eT.value.trim(), eX.value.trim(), eB.value.trim(), "/Novedades", BAJA[document.documentElement.lang] || BAJA.es, gN.tok())
        .then(function () { eS.textContent = "✅ " + T("m_prueba_ok", "Prueba enviada a tu correo.") }, function () { eS.textContent = T("e_otro", "Algo ha fallado.") }).then(gN.reset) };
    todos.onclick = function () { if (!datosOk()) return;
      if (!todos.dataset.ok) { todos.dataset.ok = 1; todos.textContent = T("seguro_enviar", "¿Seguro? Pulsa otra vez para enviar"); return }
      todos.disabled = true; eS.textContent = "⏳";
      db.collection("usuarios").where("avisos", "==", true).get().then(function (q) {
        var lista = []; q.forEach(function (d) { var x = d.data(); if (x.email) lista.push(x.email) });
        function fin(t) { eS.textContent = t; todos.disabled = false; delete todos.dataset.ok; todos.textContent = "📣 " + T("enviar_todos", "Enviar a todos los suscritos"); gN.reset() }
        if (!lista.length) { fin(T("nadie", "Todavía no hay nadie.")); return }
        // UN solo correo: a ti, y a los suscritos en copia oculta (nadie ve los correos de los demás)
        var pie = [BAJA.es, BAJA.ca, BAJA.en, BAJA.fr].join("\n\n");
        correo(auth.currentUser.email, eA.value.trim(), eT.value.trim(), eX.value.trim(), eB.value.trim(), "/Novedades", pie, gN.tok(), lista.join(","))
          .then(function () { fin("✅ " + lista.length + " " + T("m_enviados", "correos enviados")) }, function () { fin(T("e_otro", "Algo ha fallado.")) });
      }, function () { eS.textContent = T("e_otro", "Algo ha fallado."); todos.disabled = false });
    };
    c.appendChild(el("div", "lm-sub", T("m_limite", "Límite gratis: 200 correos al mes. Solo se envía a quien marcó la casilla de novedades.")));
    c.appendChild(el("div", "lm-et", "👥 " + T("usuarios", "Personas inscritas")));
    var L = el("div", "lm-lista", "…"); c.appendChild(L);
    db.collection("usuarios").orderBy("creado", "desc").limit(500).get().then(function (q) {
      L.textContent = ""; if (q.empty) L.textContent = T("nadie", "Todavía no hay nadie.");
      var tot = el("div", "lm-sub", q.size + " " + T("personas", "personas")); L.appendChild(tot);
      q.forEach(function (doc) {
        var u = doc.data(), f = el("div", "lm-fila");
        var fecha = u.creado && u.creado.toDate ? u.creado.toDate().toLocaleDateString() : "";
        f.appendChild(el("span", "lm-n", (u.avisos ? "📧 " : "") + (u.nombre || "?"))); f.appendChild(el("span", "lm-e", u.email || "")); f.appendChild(el("span", "lm-f", fecha));
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
  // ---------- bienvenida y «lo nuevo desde tu última visita» (se guarda en este navegador) ----------
  var recienCreada = false;
  function fechaNum(f) { var m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(f || ""); return m ? +m[3] * 10000 + +m[2] * 100 + +m[1] : 0 }
  function hoyNum() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() }
  function saludo(u, nueva) {
    var clave = "lumiVisto_" + u.uid, visto = 0; try { visto = +localStorage.getItem(clave) || 0 } catch (e) {}
    var nombre = u.displayName || u.email.split("@")[0];
    fetch("/contenido.json", { cache: "no-store" }).then(function (r) { return r.json() }).then(function (c) {
      var nuevas = (c.noticias || []).filter(function (n) { return fechaNum(n.fecha) > visto });
      if (nueva) {
        var m = modal("🎉 " + T("bienvenida", "¡Bienvenido/a") + ", " + nombre + "!");
        m.caja.appendChild(el("p", "lm-sub", T("bienvenida_txt", "Tu cuenta de Lumimarc ya está creada. Te hemos enviado un correo para confirmar tu dirección.")));
      } else if (visto && nuevas.length) {
        var m2 = modal("🆕 " + T("lo_nuevo", "Lo nuevo desde tu última visita"));
        nuevas.slice(0, 5).forEach(function (n) {
          var f = el("div", "lm-fila"); f.style.gridTemplateColumns = "auto 1fr";
          f.appendChild(el("span", "lm-f", n.fecha || "")); f.appendChild(el("span", "", n.titulo || "")); m2.caja.appendChild(f);
        });
        var ver = el("a", "btn oro lm-ancho", T("ver_novedades", "Ver las novedades")); ver.href = "/Novedades"; ver.setAttribute("data-ir", "Novedades");
        ver.addEventListener("click", function () { m2.fondo.remove() }); m2.caja.appendChild(ver);
      }
      try { localStorage.setItem(clave, String(hoyNum())) } catch (e) {}
    }).catch(function () {});
  }
  var yaSaludado = false;
  function avisoVerificar(u) {
    if (document.getElementById("lm-verif")) return;
    var b = el("div", "lm-verif"); b.id = "lm-verif";
    b.appendChild(el("span", "", "📧 " + T("sin_verificar", "Confirma tu correo: abre el mensaje que te enviamos y pulsa el enlace.")));
    var r = el("button", "lm-link", T("reenviar", "Reenviar")); r.type = "button";
    r.onclick = function () { u.sendEmailVerification().then(function () { r.textContent = "✅ " + T("reenviado", "Enviado") }, function (e) { r.textContent = err(e) }) };
    var ya = el("button", "lm-link", T("ya_verifique", "Ya lo he hecho")); ya.type = "button";
    ya.onclick = function () { u.reload().then(function () { if (auth.currentUser.emailVerified) b.remove(); else ya.textContent = T("todavia_no", "Todavía no aparece verificado") }) };
    var x = el("button", "lm-link", "✕"); x.type = "button"; x.onclick = function () { b.remove() };
    b.appendChild(r); b.appendChild(ya); b.appendChild(x); document.body.appendChild(b);
  }
  auth.onAuthStateChanged(function (u) {
    if (!u) { pintar(null); yaSaludado = false; return }
    if (pendiente) { var pd = pendiente; pendiente = null; setTimeout(function () { contar(pd.tipo); bajarPublica(pd.a) }, 600) }
    db.collection("admins").doc(u.uid).get().then(function (s) { pintar(u, s.exists) }, function () { pintar(u, false) });
    if (!u.emailVerified && !recienCreada) avisoVerificar(u);
    if (!yaSaludado) { yaSaludado = true; var nueva = recienCreada; recienCreada = false; setTimeout(function () { saludo(auth.currentUser || u, nueva) }, nueva ? 1500 : 800) }
  });

  // ---------- descargas: solo con la sesión iniciada; se cuentan de forma anónima (tipo, fecha, idioma) ----------
  var pendiente = null;
  function contar(tipo) { db.collection("descargas").add({ tipo: tipo, fecha: firebase.firestore.FieldValue.serverTimestamp(), idioma: document.documentElement.lang || "es" }).catch(function () {}) }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-descarga]"); if (!a) return;
    if (!auth.currentUser) {
      e.preventDefault();
      pendiente = { a: a, tipo: a.getAttribute("data-descarga") };   // al entrar, se descarga solo
      document.querySelectorAll(".lm-fondo").forEach(function (f) { f.remove() });
      abrirLogin(false, T("login_descargar", "Para descargar, inicia sesión. Si no tienes cuenta, créala gratis abajo."));
      return;
    }
    e.preventDefault();
    contar(a.getAttribute("data-descarga"));
    bajarPublica(a);
  });
})();
