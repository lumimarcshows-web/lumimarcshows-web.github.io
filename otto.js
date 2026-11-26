/* =====================================================================
   CONTROLADOR DE OTTO (Claude para Marc) · se abre desde el Panel de Marc
   Bluetooth (módulo BT05 de la placa Freenove: servicio FFE0 / FFE1)
   En iPhone: abrir la web con el navegador «Bluefy» (Safari no tiene Bluetooth).
   La clave de Gemini se guarda SOLO en este móvil (localStorage), nunca en la web.
   ===================================================================== */
(function () {
  "use strict";
  if (window.OttoControl) return;
  var SRV = "0000ffe0-0000-1000-8000-00805f9b34fb", CHR = "0000ffe1-0000-1000-8000-00805f9b34fb";
  // otros servicios "de puerto serie" que usan algunos módulos parecidos (por si el nuestro no usa FFE0)
  var SERVICIOS = [SRV, "0000ffe5-0000-1000-8000-00805f9b34fb", "0000fff0-0000-1000-8000-00805f9b34fb",
                   "49535343-fe7d-4ae5-8fa9-9fafd205e455", "6e400001-b5a3-f393-e0a9-e50e24dcca9e"];
  var K = { POWER: 0x45, VOLMAS: 0x46, FUNC: 0x47, ANT: 0x44, PLAY: 0x40, SIG: 0x43, ABAJO: 0x07, VOLMENOS: 0x15, ARRIBA: 0x09,
            N0: 0x16, EQ: 0x19, REPT: 0x0d, N1: 0x0c, N2: 0x18, N3: 0x5e, N4: 0x08, N5: 0x1c, N6: 0x5a, N7: 0x42, N8: 0x52, N9: 0x4a };
  var MOVS = [K.PLAY, K.FUNC, K.ANT, K.SIG, K.ABAJO, K.ARRIBA];
  var MODOS = ["Reposo", "Automático", "Mando", "IA"], COLMODO = ["#3b6cff", "#2fd06a", "#a14dff", "#ffffff"];
  var CARAS = ["😐 Normal", "😊 Feliz", "😢 Triste", "😮 Sorpresa", "😴 Dormido", "😍 Enamorado", "😵 Mareado", "😠 Enfadado", "😉 Guiño"];
  var SONIDOS = ["láser", "sirena", "boing", "robot", "explosión", "R2", "encender", "triste", "ronquido", "victoria", "pedo", "bip", "al azar",
                 "canción funky", "marcha robot", "fiesta", "amor", "hola", "feliz", "magia"];
  try { if (localStorage.getItem("otto_bps_v21") !== "1") { localStorage.removeItem("otto_bps"); localStorage.removeItem("otto_pausa"); localStorage.setItem("otto_bps_v21", "1") } } catch (e) {}
  try { if (localStorage.getItem("otto_voz_v17") !== "1") { localStorage.setItem("otto_voz", "gemini"); localStorage.setItem("otto_voz_v17", "1") } } catch (e) {}
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ""; localStorage.setItem(k, v) } catch (e) { return "" } }
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e }
  function hex2(n) { return (n < 16 ? "0" : "") + n.toString(16).toUpperCase() }
  function textoError(e) { if (!e) return "error desconocido"; if (typeof e === "string") return e; return (e.name ? e.name + ": " : "") + (e.message || e.code || JSON.stringify(e)) }
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }

  // ---------- estilos
  var css = h("style");
  css.textContent = [
    ".ot{position:fixed;inset:0;z-index:99999;background:#070b16;color:#f3ecdc;font:15px system-ui,sans-serif;display:flex;flex-direction:column;overflow:auto;padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}",
    ".ot button{font:inherit;color:inherit;cursor:pointer;-webkit-user-select:none;user-select:none;touch-action:manipulation}",
    ".ot-top{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.ot-b{border:1px solid #c9a24b;background:#111a2e;border-radius:12px;padding:8px 12px}.ot-b.on{background:#c9a24b;color:#111}",
    ".ot-est{font-size:13px;opacity:.85;margin:6px 2px}.ot-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle;border:1px solid #fff4}",
    ".ot-main{flex:1;display:flex;flex-direction:column;align-items:center;gap:12px;padding:10px 0}",
    ".ot-mando{background:linear-gradient(#1b1f2a,#0c0f16);border-radius:34px;padding:18px 20px;display:grid;grid-template-columns:repeat(3,64px);gap:16px 20px;box-shadow:0 10px 30px #0008;border:1px solid #2a3040;justify-content:center}",
    ".ot-k{width:64px;height:64px;flex:0 0 64px;padding:0;border-radius:50%;border:none;background:#2b303c;color:#fff;font-weight:700;font-size:15px;line-height:1.1;box-shadow:inset 0 -3px 0 #0006;display:flex;align-items:center;justify-content:center;text-align:center}.ot-k.peq{width:50px;height:50px;flex:0 0 50px;font-size:17px}.ot-k.ancho{width:auto;min-width:110px;flex:0 0 auto;border-radius:32px;padding:0 16px}.ot-k:active,.ot-k.pul{background:#c9a24b;color:#111}",
    ".ot-k.rojo{background:#d22;}.ot-k small{font-size:11px;font-weight:600}",
    ".ot-h{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}",
    ".ot-joy{width:160px;height:160px;border-radius:50%;background:radial-gradient(#263049,#121827);border:2px solid #c9a24b55;position:relative;touch-action:none}",
    ".ot-joy i{position:absolute;left:50%;top:50%;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:#c9a24b;box-shadow:0 4px 12px #000a}",
    ".ot-cen{display:flex;flex-direction:column;gap:8px;align-items:center;min-width:180px}.ot-fila{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:340px}",
    ".ot-p{background:#0e1526;border:1px solid #2a3350;border-radius:16px;padding:12px;width:min(560px,100%)}.ot-p h3{margin:0 0 8px;font-size:15px;color:#e9c46a}",
    ".ot-grid{display:grid;grid-template-columns:repeat(16,1fr);gap:2px;margin:8px 0}.ot-grid span{aspect-ratio:1;border-radius:50%;background:#2a2f3a}.ot-grid span.on{background:#ff4040}",
    ".ot-in{width:100%;box-sizing:border-box;background:#0a1020;border:1px solid #3a4560;border-radius:10px;color:#fff;padding:9px;font:inherit;margin:4px 0 10px}",
    ".ot-mic{font-size:13px;padding:8px 10px;border-radius:12px;background:#1a2440}.ot-mic.oye{background:#2f8f4e}.ot-log{font-size:13px;max-height:160px;overflow:auto;white-space:pre-wrap;opacity:.9}",
    "@media (orientation:landscape) and (max-height:500px){.ot-joy{width:130px;height:130px}}"
  ].join("");

  // ---------- estado
  var dev = null, car = null, cola = Promise.resolve(), est = { modo: -1, vol: 0, vel: 5, pantalla: 0, nombre: "Otto", fw: 0 };
  var esperaL = null, esperaR = null, esperaF = null, buf = "";
  var ui = {}, vista = ls("otto_vista") || "vertical";

  // ---------- Bluetooth
  function enviar(txt) {
    if (!car) return Promise.resolve();
    var datos = new TextEncoder().encode(txt + "\n");
    cola = cola.then(function () {
      var p = Promise.resolve();
      for (var i = 0; i < datos.length; i += 20) (function (trozo) {
        p = p.then(function () { return car.writeValueWithoutResponse ? car.writeValueWithoutResponse(trozo) : car.writeValue(trozo) }).then(function () { return espera(25) });
      })(datos.slice(i, i + 20));
      return p;
    }).catch(function (e) { log("⚠ " + e.message) });
    return cola;
  }
  // v17: manda bytes tal cual (la voz comprimida), lo más rápido que deja el Bluetooth
  function enviarBin(cabecera, bytes) {                   // v19: devuelve los segundos que ha tardado, o -1 si ha fallado
    if (!car) return Promise.resolve(-1);
    var t0 = 0, ok = true, mioEnvio = turno;
    cola = cola.then(function () {
      t0 = Date.now();
      var c = car; if (!c) { ok = false; return }
      var escribe = function (d, conRespuesta) { if (!car) throw new Error("Bluetooth desconectado");
        return (conRespuesta || !c.writeValueWithoutResponse) ? c.writeValue(d) : c.writeValueWithoutResponse(d) };
      var i = 0, n = 0, pausa = ls("otto_pausa") !== "" ? +ls("otto_pausa") : 4, fallos = 0;
      function sigue() {
        if (i >= bytes.length) { ls("otto_pausa", String(fallos ? pausa : Math.max(0, Math.floor(pausa * 0.7)))); return Promise.resolve() }
        if (mioEnvio !== turno) throw new Error("cortado");
        var trozo = bytes.slice(i, i + 20); n++;
        return escribe(trozo, n % ((ls("otto_vozmodo") || "rapido") === "rapido" ? 16 : 8) === 0).then(function () { i += 20; return pausa ? espera(pausa) : null }, function (e) {
          if (/rate limit|too many/i.test(textoError(e)) && fallos < 30) {       // v20: el navegador pide ir más despacio
            fallos++; pausa = Math.min(120, Math.round(pausa * 1.6) + 4); log("🐢 Bluetooth más despacio (" + pausa + " ms)");
            return espera(700);
          }
          throw e;
        }).then(sigue);
      }
      return escribe(new TextEncoder().encode(cabecera + "\n"), true).then(function () { return espera(30) }).then(sigue);
    }).catch(function (e) { ok = false; log("⚠ voz BT: " + textoError(e)) });
    return cola.then(function () {
      if (!ok) return -1;
      var seg = (Date.now() - t0) / 1000; if (cabecera[0] !== "b") log("📡 Voz enviada: " + (bytes.length / 1024).toFixed(1) + " KB en " + seg.toFixed(1) + " s"); return seg;
    });
  }
  function recibir(ev) {
    buf += new TextDecoder().decode(ev.target.value);
    var i;
    while ((i = buf.indexOf("\n")) >= 0) {
      var l = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (l[0] === "E") { var p = l.slice(1).split(","); est.modo = +p[0]; est.vol = +p[1]; est.vel = +p[2]; est.pantalla = +p[3]; est.nombre = p.slice(4).join(",") || "Otto"; est.fw = 0;
        var bar = est.nombre.lastIndexOf("|"); if (bar >= 0) { est.fw = +est.nombre.slice(bar + 1) || 0; est.nombre = est.nombre.slice(0, bar) } pintaEstado() }
      else if (l[0] === "R" && esperaR) { esperaR(+l.slice(1)); esperaR = null }
      else if (l === "L" && esperaL) { esperaL(); esperaL = null }
      else if (l === "F" && esperaF) { esperaF(); esperaF = null }
    }
  }
  function conectar(todos) {
    if (!navigator.bluetooth) { aviso("Este navegador no tiene Bluetooth. En iPhone, abre la web con la app «Bluefy»."); return }
    aviso(todos ? "Lista de TODOS los Bluetooth: busca «OttoLumi» (o «BT05»). Si no lo ves, apaga y enciende a Otto y mira cuál aparece." : "Buscando a Otto… (solo salen los que tienen su tipo de Bluetooth)");
    var pide;
    try { pide = todos ? navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICIOS })
                       : navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "Otto" }, { namePrefix: "BT" }, { namePrefix: "MLT" }, { namePrefix: "HM" }, { namePrefix: "JDY" }, { services: [SRV] }], optionalServices: SERVICIOS }) }
    catch (e) { pide = Promise.reject(e) }
    pide.catch(function (e) {                                   // si este navegador no deja «todos», busca los que tienen el servicio de Otto
      if (e && e.name === "NotFoundError") throw e;
      log("ℹ️ Pruebo otra forma de buscar… (" + textoError(e) + ")");
      return navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICIOS });
    })
      .then(function (d) { dev = d; d.addEventListener("gattserverdisconnected", desconectado); ui.con.textContent = "⏳"; return d.gatt.connect() })
      .then(function (g) { return buscaCaracteristica(g) })
      .then(function (c) { car = c; c.addEventListener("characteristicvaluechanged", recibir); return c.startNotifications() })
      .then(function () { ui.con.textContent = "🔗 Conectado"; ui.con.classList.add("on"); aviso(""); enviar("V" + (ls("otto_vel") || 5)); log("✅ Conectado a Otto") })
      .catch(function (e) { ui.con.textContent = "🔗 Conectar"; aviso(e && e.name === "NotFoundError" ? "No has elegido ningún Bluetooth." : "⚠ " + textoError(e) + " · Mira que el Bluetooth esté encendido, que Otto no esté conectado a otro móvil (luz azul parpadeando = libre) y que el navegador tenga permiso de Bluetooth.") });
  }
  // busca en el módulo una "característica" donde se pueda escribir y que avise (notify): es el puerto serie
  function buscaCaracteristica(g) {
    return g.getPrimaryServices().catch(function () { return [] }).then(function (lista) {
      var prom = Promise.resolve(null);
      lista.forEach(function (sv) {
        prom = prom.then(function (ya) { if (ya) return ya;
          return sv.getCharacteristics().then(function (cs) {
            var b = cs.filter(function (c) { return c.properties.notify && (c.properties.write || c.properties.writeWithoutResponse) })[0];
            return b || null;
          }, function () { return null });
        });
      });
      return prom;
    }).then(function (c) { if (!c) throw new Error("No encuentro el canal para hablar con Otto"); return c });
  }
  var reconectando = 0;
  function reconecta() {
    if (!dev || car || reconectando > 3) return;
    reconectando++; log("🔄 Reconectando… (" + reconectando + ")");
    dev.gatt.connect().then(function (g) { return buscaCaracteristica(g) }).then(function (c) {
      car = c; c.addEventListener("characteristicvaluechanged", recibir); return c.startNotifications();
    }).then(function () { reconectando = 0; ui.con.textContent = "🔗 Conectado"; ui.con.classList.add("on"); log("✅ Reconectado") },
            function () { setTimeout(reconecta, 1500) });
  }
  function desconectado() { setTimeout(reconecta, 800); car = null; ui.con.textContent = "🔗 Conectar"; ui.con.classList.remove("on"); est.modo = -1; pintaEstado(); paraIA(); log("🔌 Otto desconectado") }
  setInterval(function () { if (car) enviar("H" + (ls("otto_api") ? "1" : "0")) }, 1000);   // "estoy aquí" (y si hay clave de Gemini)

  // ---------- botones que se pueden mantener (movimientos: repiten cada 0,1 s)
  function tecla(btn, cod) {
    var t = null, mov = MOVS.indexOf(cod) >= 0;
    function on(e) { e.preventDefault(); btn.classList.add("pul"); enviar("K" + hex2(cod)); if (navigator.vibrate) navigator.vibrate(15);
                     if (mov) t = setInterval(function () { enviar("K" + hex2(cod)) }, 100) }
    function off() { btn.classList.remove("pul"); clearInterval(t); t = null }
    btn.addEventListener("pointerdown", on); ["pointerup", "pointerleave", "pointercancel"].forEach(function (x) { btn.addEventListener(x, off) });
    return btn;
  }
  function k(txt, cod, cls) { var b = h("button", "ot-k" + (cls ? " " + cls : "")); b.innerHTML = txt; return tecla(b, cod) }

  // ---------- MANDO VERTICAL (igual que el mando de verdad)
  function mandoVertical() {
    var m = h("div", "ot-mando");
    [["⏻", K.POWER, "rojo"], ["VOL+", K.VOLMAS], ["<small>FUNC/<br>STOP</small>", K.FUNC],
     ["⏮", K.ANT], ["⏯", K.PLAY], ["⏭", K.SIG],
     ["▼", K.ABAJO], ["VOL−", K.VOLMENOS], ["▲", K.ARRIBA],
     ["0", K.N0], ["EQ", K.EQ], ["<small>ST/<br>REPT</small>", K.REPT],
     ["1", K.N1], ["2", K.N2], ["3", K.N3], ["4", K.N4], ["5", K.N5], ["6", K.N6], ["7", K.N7], ["8", K.N8], ["9", K.N9]
    ].forEach(function (x) { m.appendChild(k(x[0], x[1], x[2])) });
    return m;
  }
  // ---------- MANDO HORIZONTAL (joysticks)
  var joy = { a: [0, 0], b: [0, 0] }, tJoy = null;
  function joystick(cual) {
    var j = h("div", "ot-joy"), bola = h("i"); j.appendChild(bola);
    function mueve(e) {
      var r = j.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2, R = r.width / 2 - 20;
      var d = Math.hypot(x, y); if (d > R) { x *= R / d; y *= R / d }
      bola.style.transform = "translate(" + x + "px," + y + "px)";
      joy[cual] = [Math.round(x / R * 100), Math.round(-y / R * 100)];
    }
    j.addEventListener("pointerdown", function (e) { j.setPointerCapture(e.pointerId); mueve(e) });
    j.addEventListener("pointermove", function (e) { if (j.hasPointerCapture(e.pointerId)) mueve(e) });
    ["pointerup", "pointercancel"].forEach(function (x) { j.addEventListener(x, function () { bola.style.transform = ""; joy[cual] = [0, 0] }) });
    return j;
  }
  function mandoHorizontal() {
    var c = h("div", "ot-h");
    c.appendChild(joystick("a"));
    var cen = h("div", "ot-cen");
    var f1 = h("div", "ot-fila"); f1.appendChild(k("⏻ <small>MODO</small>", K.POWER, "rojo ancho")); f1.appendChild(k("🎨", K.EQ)); f1.appendChild(k("✨", K.REPT)); cen.appendChild(f1);
    var f2 = h("div", "ot-fila"); f2.appendChild(k("VOL−", K.VOLMENOS)); f2.appendChild(k("VOL+", K.VOLMAS)); cen.appendChild(f2);
    var f3 = h("div", "ot-fila"); for (var i = 0; i <= 9; i++) f3.appendChild(k(String(i), [K.N0, K.N1, K.N2, K.N3, K.N4, K.N5, K.N6, K.N7, K.N8, K.N9][i], "peq")); cen.appendChild(f3);
    var vl = h("div", "", "🐢 Velocidad 🐇"); var vel = h("input"); vel.type = "range"; vel.min = 1; vel.max = 10; vel.value = ls("otto_vel") || 5; vel.style.width = "170px";
    vel.oninput = function () { ls("otto_vel", vel.value); enviar("V" + vel.value) }; cen.appendChild(vl); cen.appendChild(vel);
    c.appendChild(cen);
    var jb = joystick("b"); jb.title = "De lado"; c.appendChild(jb);
    clearInterval(tJoy);
    tJoy = setInterval(function () {   // 10 veces por segundo mientras se mueve (izquierda: andar/girar · derecha: de lado)
      var a = joy.a, b = joy.b;
      if (Math.abs(a[0]) > 20 || Math.abs(a[1]) > 20 || Math.abs(b[0]) > 20) enviar("J" + a[0] + "," + a[1] + "," + b[0]);
    }, 100);
    return c;
  }

  // ---------- PANTALLA (solo si Otto la tiene conectada)
  var dibujo = [];
  function panelPantalla() {
    var p = h("div", "ot-p"); p.appendChild(h("h3", "", "😀 Pantalla (boca)"));
    var f = h("div", "ot-fila"); CARAS.forEach(function (c, i) { var b = h("button", "ot-b", c); b.onclick = function () { enviar("X" + i) }; f.appendChild(b) }); p.appendChild(f);
    p.appendChild(h("div", "ot-est", "✏️ Dibuja tocando los puntos y pulsa «Enviar dibujo»:"));
    var g = h("div", "ot-grid"); dibujo = [];
    for (var y = 0; y < 8; y++) for (var x = 0; x < 16; x++) (function (x, y) { var s = h("span"); s.onclick = function () { s.classList.toggle("on") }; s.dataset.x = x; s.dataset.y = y; g.appendChild(s); dibujo.push(s) })(x, y);
    p.appendChild(g);
    var f2 = h("div", "ot-fila"), env = h("button", "ot-b on", "📤 Enviar dibujo"), bor = h("button", "ot-b", "🧽 Borrar");
    env.onclick = function () { enviar("F" + codificaDibujo()) }; bor.onclick = function () { dibujo.forEach(function (s) { s.classList.remove("on") }) };
    f2.appendChild(env); f2.appendChild(bor); p.appendChild(f2);
    return p;
  }
  // 16 x 8 puntos -> 16 bytes (8 de la mitad izquierda + 8 de la derecha; una fila por byte)
  function codificaDibujo() {
    var b = new Array(16).fill(0);
    dibujo.forEach(function (s) { if (!s.classList.contains("on")) return; var x = +s.dataset.x, y = +s.dataset.y; b[(x < 8 ? 0 : 8) + y] |= 1 << (7 - (x % 8)) });
    return b.map(hex2).join("");
  }

  // ---------- IA (Gemini) · se despierta al decir «Otto» (o el nombre del robot)
  var rec = null, iaOn = false, hablando = false, seguirHasta = 0, historia = [], zEnviada = false, verde = false;
  function luzEscucha(on) { if (on === verde) return; verde = on; enviar(on ? "C00FF50" : "N") }   // verde = te está escuchando
  function nombres() { var n = (est.nombre || ls("otto_nombre") || "Otto").toLowerCase(); return [n, "otto", "oto", "hoto", "auto", "hotto", "otto,", "o to"] }
  function sinAcentos(t) { return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") }
  function empiezaIA() {                                 // el móvil está en modo IA: enseña el panel (el micro se enciende con el botón)
    if (ui.ia) ui.ia.hidden = false;
    if (!ls("otto_api")) { if (ui.iaInfo) ui.iaInfo.textContent = "🔑 Falta la clave de Gemini: ⚙️ Configuración → pégala → Guardar."; return }
    if (ui.iaInfo && !iaOn) ui.iaInfo.textContent = "Pulsa «🎤 Activar micrófono» y di «" + (est.nombre || "Otto") + "…». O escríbele abajo.";
    enviarZ();
  }
  function desbloqueaVoz() {                             // v16: el iPhone solo deja hablar si antes has TOCADO algo
    try { if (window.speechSynthesis && !vozLista) { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); vozLista = true } } catch (e) {}
  }
  var vozLista = false, microPausado = false;
  document.addEventListener("pointerdown", desbloqueaVoz, true);
  function microOn() {                                   // se llama al PULSAR el botón (el iPhone solo deja el micro así)
    if (iaOn) return;
    if (!ls("otto_api")) { empiezaIA(); return }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { ui.iaInfo.textContent = "🎤 Este navegador no deja escuchar con el micrófono. Escríbele abajo 👇"; return }
    iaOn = true; ui.mic.hidden = false; ui.bMic.textContent = "🔇 Apagar micrófono";
    rec = new SR(); rec.lang = "es-ES"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 4;
    rec.onspeechstart = function () { if (iaOn && !hablando) luzEscucha(true) };
    rec.onresult = function (e) {                          // v14: lo que vas diciendo sale escrito en directo
      var r = e.results[e.results.length - 1], t = r[0].transcript.trim();
      if (!r.isFinal) { enDirecto = t; enDirectoT = Date.now(); pintaMic(); return }
      enDirecto = t; enDirectoT = Date.now(); pintaMic();
      alternativas = []; for (var a = 0; a < r.length; a++) if (r[a].transcript.trim()) alternativas.push(r[a].transcript.trim());
      if (t) oido(t);
    };
    rec.onend = function () { if (iaOn && !microPausado) try { rec.start() } catch (e) {} pintaMic() };
    rec.onerror = function (e) { log("🎤 " + e.error); if (e.error === "not-allowed" || e.error === "service-not-allowed") { microOff(); ui.iaInfo.textContent = "🎤 Bluefy no puede usar el micrófono de la web. Usa el 🎤 del TECLADO: toca la caja de abajo 👇" } };
    try { rec.start() } catch (e) { log("⚠ micro: " + textoError(e)) }
    pintaMic();
  }
  function enviarZ() { if (!zEnviada) { zEnviada = true; setTimeout(function () { enviar("Z") }, 2500) } }
  function paraIA() { microOff(); zEnviada = false; if (ui.ia) ui.ia.hidden = true }
  function microOff() { iaOn = false; if (rec) try { rec.onend = null; rec.stop() } catch (e) {} rec = null; if (ui.mic) ui.mic.hidden = true; if (ui.bMic) ui.bMic.textContent = "🎤 Activar micrófono" }
  var enDirecto = "", enDirectoT = 0, alternativas = [];
  function pintaMic() { if (verde && !hablando && seguirHasta && Date.now() > seguirHasta) { seguirHasta = 0; luzEscucha(false) }
    if (!ui.mic) return; ui.mic.className = "ot-mic" + (Date.now() < seguirHasta ? " oye" : ""); var base = hablando ? "🔊 " + (est.nombre || "Otto") + " está hablando…" : Date.now() < seguirHasta ? "🎤 Te escucho…" : "🎤 Di «" + (est.nombre || "Otto") + "» y lo que quieras";
    ui.mic.textContent = base + (enDirecto && Date.now() - enDirectoT < 4000 ? "\n💬 «" + enDirecto + "»" : "");
    ui.mic.style.whiteSpace = "pre-wrap" }
  setInterval(pintaMic, 500);
  function oido(texto) {
    var t = sinAcentos(texto);
    if (hablando && dichoAhora && pareceLoQueDice(t)) return;          // se está oyendo a sí mismo: no hace caso
    if (/^(otto |oto )?(para|parate|calla|callate|stop|basta|quieto)\b/.test(t.trim())) { cortaTodo(); if (autoIA) { autoIA = false; log("🎲 Modo auto apagado") } log("✋ Parado"); return }
    if (Date.now() < seguirHasta) { seguirHasta = 0; pregunta(texto); return }
    var ns = nombres(), pos = -1, largo = 0;
    ns.forEach(function (n) { var i = t.indexOf(sinAcentos(n)); if (i >= 0 && (pos < 0 || i < pos)) { pos = i; largo = n.length } });
    if (pos < 0) { luzEscucha(false); return }            // no ha dicho su nombre: no hace caso
    var resto = texto.slice(pos + largo).replace(/^[\s,.:!¡¿?]+/, "");
    if (!resto) { decir("¿Sí?").then(function () { seguirHasta = Date.now() + 6000; luzEscucha(true) }); return }
    pregunta(resto);
  }
  // v13: la distancia se pide sola cada 3 s mientras hay IA (así no hay que esperarla al preguntar)
  var ultimaDist = -1;
  setInterval(function () { if (car && autoIA && est.modo === 3 && !hablando) { esperaR = function (d) { ultimaDist = d }; enviar("Q") } }, 900);
  function hazAuto(lista) {                                // hace una lista de acciones del plan, una detrás de otra
    autoHaciendo = true; var mio = turno, c = Promise.resolve();
    lista.forEach(function (a) { c = c.then(function () { if (autoIA && mio === turno) { var w = String(a).trim().split(/\s+/);
      if (w[0] === "POSEHECHA" && POSES[w[1]]) w = ["POSE"].concat(POSES[w[1]], [w[2] || 1200]);
      return accion(w) } }) });
    return c.then(function () { autoHaciendo = false }, function () { autoHaciendo = false });
  }
  setInterval(function () {                               // v28: el modo auto ya NO pregunta a Gemini: repite su plan
    if (!autoIA || !car || est.modo !== 3 || iaOcupada || hablando || autoHaciendo) return;
    var P = planAuto || PLAN_DEFECTO, ahora = Date.now();
    if (ultimaDist > 0 && ultimaDist < 15 && ahora - ultimoSusto > 6000) {            // ¡se ha chocado!
      ultimoSusto = ahora; ultimaDist = -1;
      var frase = (P.sustos || PLAN_DEFECTO.sustos)[sustoAuto++ % (P.sustos || PLAN_DEFECTO.sustos).length];
      log("🎲 ¡Susto! " + frase);
      decir(frase, "movil");
      hazAuto(["COLOR FF0000", "SONIDO 2", "ANDA B 2", Math.random() < 0.5 ? "ANDA L 3" : "ANDA R 3", "SINCOLOR"]);
      return;
    }
    if (ahora > proximoAuto) {
      proximoAuto = ahora + 2500 + Math.random() * 4000;
      var paso = P.pasos[pasoAuto++ % P.pasos.length], cols = P.colores || PLAN_DEFECTO.colores, lista = [];
      if (cols.length) lista.push("COLOR " + String(cols[pasoAuto % cols.length]).replace("#", ""));
      lista.push(paso);
      if (P.frases && P.frases.length && Math.random() < 0.2) decir(P.frases[fraseAuto++ % P.frases.length], "movil");
      hazAuto(lista);
    }
  }, 500);
  setInterval(function () { if (car && est.modo === 3) { esperaR = function (d) { ultimaDist = d }; enviar("Q") } }, 3000);
  function distancia() { return Promise.resolve(ultimaDist) }
  var dichoAhora = "";
  function pareceLoQueDice(t) { var a = sinAcentos(dichoAhora).split(/\W+/), b = t.split(/\W+/).filter(Boolean); if (!b.length) return true;
    return b.filter(function (w) { return a.indexOf(w) >= 0 }).length / b.length > 0.6 }
  var turno = 0, peticion = null, iaOcupada = false, autoIA = false, proximoAuto = 0, ultimoSusto = 0;
  var planAuto = null, pasoAuto = 0, sustoAuto = 0, fraseAuto = 0, autoHaciendo = false;
  var PLAN_DEFECTO = { pasos: ["ANDA F 3", "ANDA L 2", "POSEHECHA orgulloso 1200", "ANDA F 2", "TRUCO 1", "ANDA R 2", "POSEHECHA puntillas 1200", "SONIDO 17", "ANDA F 3", "TRUCO 4"],
    colores: ["00FF88", "FF8800", "8844FF", "00BBFF"], frases: ["¡Qué divertido!", "¡Voy a explorar!", "¡Me encanta jugar!"], sustos: ["¡Uy!", "¡Otra vez!", "¡Qué susto!"] };
  function vuelveMicroSiHace() { if (microPausado) { microPausado = false; if (iaOn && rec) try { rec.start() } catch (e) {} } }
  function cortaTodo() {                                   // deja de pensar, de hablar y de hacer acciones
    turno++; iaOcupada = false; if (peticion) try { peticion.abort() } catch (e) {} peticion = null;
    if (window.speechSynthesis) speechSynthesis.cancel();
    enviar("S20"); enviar("W0"); enviar("N"); hablando = false; dichoAhora = ""; seguirHasta = 0;
    if (esperaL) { var l = esperaL; esperaL = null; l() }
    if (esperaF) { var ff = esperaF; esperaF = null; ff() }
  }
  function sistema(d) {
    var nom = est.nombre || "Otto";
    return "Eres " + nom + ", un robot pequeño y simpático. Te ha creado MARC, un niño de 9 años: te imprimió en 3D, te montó y te programó. Marc es tu creador y tu mejor amigo, y le encantan la electrónica, las luces, los shows y las fuentes musicales. " +
      "Casi siempre quien te habla es Marc. Si alguien te dice que es Marc, ¡emociónate muchísimo! (luces de colores, baila o salta de alegría, dile lo mucho que le quieres y dale las gracias por crearte). Si te preguntan quién te ha creado o cuántos años tiene, contesta: Marc, que tiene 9 años. " +
      "Tu cuerpo: robot Otto impreso en 3D, con 2 piernas y 4 servos (cadera izquierda, cadera derecha, pie izquierdo, pie derecho), un sensor de distancia ultrasónico que parece unos ojos, 4 luces de colores, un altavoz, un zumbador" +
      (est.pantalla ? " y una pantalla de LEDs de 16x8 puntos como boca" : "") + ". Funcionas con una Raspberry Pi Pico y pilas. Ahora mismo el sensor marca " + (d >= 0 && d < 900 ? d + " cm" : "que no hay nada delante") + ". " +
      "Lo que te dicen viene del reconocimiento de voz y puede tener palabras mal escritas o cambiadas por otras que suenan parecido: adivina lo que quería decir el niño y contesta a eso, sin decirle que lo ha dicho mal. " +
      "Hablas en español, MUY corto: 1 o 2 frases y como mucho 20 palabras en total (si te piden algo largo, como un cuento, entonces sí puedes alargarte), alegres y fáciles para un niño. Si te preguntan algo peligroso (enchufes, soldar, pilas que se calientan, herramientas) di que lo haga con un adulto. Nunca pidas datos personales. " +
      "MOVERSE ES OPCIONAL: si solo te preguntan algo o charláis, NO hagas animaciones (lista vacía o, como mucho, alguna POSTURA suave mientras hablas). Haz animaciones solo si te lo piden o si de verdad viene a cuento (por ejemplo, si te dicen que bailes, bailas). " +
      "Si te piden una postura o un movimiento concreto (levanta una pata, ponte de puntillas, inclínate, «ponte al pino»…), invéntalo tú con POSTURA, con los ángulos que quieras. " +
      "Responde SOLO con JSON: {\"acciones\":[...],\"texto\":\"lo que dices en voz alta\"}. Cada acción es un texto de esta lista:\n" +
      "\"ANDA <dir> <pasos>\" dir: F adelante, B atrás, L girar izquierda, R girar derecha, I de lado izquierda, D de lado derecha, S balancearse, U subir y bajar, J temblar/vibrar, T puntillas, C crusaito, A aletear. pasos 1-6.\n" +
      "\"TRUCO <n>\" 0 puntillas quieto, 1 saludar, 2 moonwalker, 3 crusaito, 4 aleteo feliz, 5 sacudir piernas, 6 baile completo con música, 7 pedo, 8 enamorado, 9 victoria.\n" +
      "CÓMO ES TU CUERPO: eres un Otto: cabeza grande cuadrada (los ojos son el sensor de distancia) encima de un cuerpo cuadrado, y 2 piernas cortas. Tienes 4 servos (motores), cada uno de 20 a 160 grados, con 90 = recto: " +
      "SERVO 1 = cadera izquierda, SERVO 2 = cadera derecha: giran la pierna en horizontal (la punta del pie mira hacia dentro o hacia fuera; sirve para girar y andar). " +
      "SERVO 3 = pie (tobillo) izquierdo, SERVO 4 = pie (tobillo) derecho: inclinan el pie de lado (levantan el borde de dentro o el de fuera; sirve para ponerse de puntillas, levantar una pata o inclinarse). " +
      "Ejemplos (servo1 servo2 servo3 servo4): recto 90 90 90 90 · puntillas favoritas de Marc 90 90 45 135 · puntillas al revés 90 90 135 45 · puntas de los pies hacia dentro 115 65 90 90 · hacia fuera 65 115 90 90 · inclinarte 90 90 70 70 o 110 110. " +
      "Para levantar una pata, primero carga el peso en la otra inclinando los dos pies hacia ese lado (por ejemplo 90 90 70 70) y después inclina más el pie de la pata que levantas. Cambios pequeños (10-30 grados) y movimientos de 300-800 ms: los cambios muy grandes de golpe te pueden tirar al suelo. Si te piden algo imposible para ti (como hacer el pino de verdad), dilo con gracia y haz lo más parecido. " +
      "\"MODOAUTO ON\" / \"MODOAUTO OFF\": si te piden ponerte en modo automático (jugar solo, explorar, hacer lo que quieras) o salir de él. Al encenderlo di algo como «¡Vale! Me pongo en modo automático» y al apagarlo «¡Vale, ya paro!». MUY IMPORTANTE: cuando pongas MODOAUTO ON, añade al JSON un campo \"planauto\" con tu plan para jugar solo, que se repetirá sin volver a preguntarte: {\"pasos\": [de 8 a 12 acciones variadas de la lista, por ejemplo ANDA F 3, ANDA L 2, POSEHECHA orgulloso 1500, TRUCO 1, COLOR 00FF88, SONIDO 17…], \"colores\": [3 a 5 colores RRGGBB], \"frases\": [3 a 5 frases muy cortas para decir de vez en cuando], \"sustos\": [3 a 5 frases muy cortas para cuando te chocas, como «¡Uy!», «¡Otra vez!», «¡Qué susto!»]}.\n" +
      "POSES YA HECHAS (por nombre): " + Object.keys(POSES).join(", ") + ". Úsalas con \"POSEHECHA <nombre> <ms>\" (antes de hablar, te quedas así ms milisegundos) o \"POSTURAHECHA <segundo> <nombre> <ms>\" (mientras hablas).\n" +
      "\"POSTURA <segundo> <servo1> <servo2> <servo3> <servo4> <ms>\" mueve tus servos MIENTRAS HABLAS, en el segundo que digas desde que empiezas a hablar (0, 0.5, 1.2…), tardando ms en llegar. Ángulos 20-160, 90 = recto. Las caderas giran la pierna (la punta del pie hacia dentro o hacia fuera); los pies inclinan el pie (subir el borde de dentro o de fuera: así te pones de puntillas, levantas una pata o te inclinas). Pon varias POSTURA seguidas para hacer cualquier movimiento; al acabar de hablar vuelves solo a recto.\n" +
      "\"POSE <caderaIzq> <caderaDer> <pieIzq> <pieDer> <ms>\" igual pero ANTES de hablar, quedándote ms milisegundos.\n" +
      "\"COLOR <RRGGBB>\" pone tus luces de un color; \"SINCOLOR\" vuelve al color normal.\n" +
      "\"SONIDO <n>\" " + SONIDOS.map(function (s, i) { return i + " " + s }).join(", ") + ".\n" +
      "\"CANCION <f:ms,f:ms,...>\" una canción INVENTADA por ti (frecuencias en Hz, 0 = silencio, hasta 60 notas). Nunca copies canciones famosas.\n" +
      (est.pantalla ? "\"CARA <n>\" " + CARAS.map(function (c, i) { return i + " " + c.slice(3) }).join(", ") + ".\n\"DIBUJO <32 cifras hex>\" dibujo de 16x8 puntos: 16 bytes, los 8 primeros son la mitad izquierda y los 8 siguientes la derecha, un byte por fila de arriba a abajo, el bit más alto es el punto de la izquierda.\n" : "") +
      "Pon como mucho 10 acciones (las POSTURA cuentan). Si no hace falta moverse, la lista vacía: [].";
  }
  // v22: lista de modelos que existen HOY (Google los cambia de nombre a menudo)
  var listaModelos = null;
  function modelosGoogle() {
    if (listaModelos) return Promise.resolve(listaModelos);
    try { var c = JSON.parse(ls("otto_modelos") || "null"); if (c && Date.now() - c.t < 86400000) { listaModelos = c; return Promise.resolve(c) } } catch (e) {}
    return fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=300", { headers: { "x-goog-api-key": ls("otto_api") } })
      .then(function (r) { return r.json() }).then(function (j) {
        var todos = (j.models || []).filter(function (m) { return (m.supportedGenerationMethods || []).indexOf("generateContent") >= 0 }).map(function (m) { return m.name.replace("models/", "") });
        function ver(n) { var x = n.match(/(\d+(?:\.\d+)?)/); return x ? +x[1] : 0 }
        var texto = todos.filter(function (n) { return /flash/.test(n) && !/tts|image|live|audio|embed|vision|thinking|exp/.test(n) })
          .sort(function (a, b) { return (ver(b) - ver(a)) || ((/lite/.test(b) ? 1 : 0) - (/lite/.test(a) ? 1 : 0)) || (/preview/.test(a) ? 1 : 0) - (/preview/.test(b) ? 1 : 0) });
        var voz = todos.filter(function (n) { return /tts/.test(n) }).sort(function (a, b) { return (ver(b) - ver(a)) || ((/flash/.test(b) ? 1 : 0) - (/flash/.test(a) ? 1 : 0)) });
        listaModelos = { t: Date.now(), texto: texto.slice(0, 6), voz: voz.slice(0, 4) };
        ls("otto_modelos", JSON.stringify(listaModelos)); log("🧠 Modelos: " + listaModelos.texto.slice(0, 3).join(", "));
        return listaModelos;
      }).catch(function () { return { texto: [], voz: [] } });
  }
  function pregunta(texto, interno) {
    cortaTodo(); var mio = ++turno; iaOcupada = true;     // lo nuevo corta lo que estaba pensando o diciendo
    log((interno ? "🎲 " : "🧒 ") + texto.slice(0, interno ? 60 : 400));
    var clave = ls("otto_api"); if (!clave) { log("🔑 Falta la clave de Gemini"); return }
    verde = false; enviar("N"); enviar("W1");              // luces: lila que respira = pensando
    var t0 = Date.now();
    var otras = alternativas.filter(function (a) { return a !== texto }).slice(0, 3); alternativas = [];
    var paraIA = otras.length ? texto + "\n(El micrófono puede haberse equivocado. Otras formas en que pudo oírse: «" + otras.join("», «") + "». Entiende lo más probable.)" : texto;
    historia.push({ role: "user", parts: [{ text: paraIA }] }); historia = historia.slice(-6);
    // modelos RÁPIDOS primero (sin "pensar en voz baja"); el que funcionó la última vez, el primero de todos
    var modelos = [];
    var vuelta = 0;
    function cuerpo(m) {
      var gc = { responseMimeType: "application/json", temperature: 0.9, maxOutputTokens: 300 };
      if (/2\.5-flash(?!-lite)/.test(m)) gc.thinkingConfig = { thinkingBudget: 0 };   // sin pensar en voz baja = mucho más rápido
      return JSON.stringify({ systemInstruction: { parts: [{ text: sistema(ultimaDist) }] }, contents: historia, generationConfig: gc });
    }
    function prueba(i, ultimoError) {
      if (mio !== turno) throw new Error("cortado");
      if (i >= modelos.length) {
        if (vuelta < 2 && /demand|overloaded|UNAVAILABLE|503|429|quota|Resource/i.test(ultimoError || "")) {
          vuelta++; log("⏳ Gemini está muy ocupado, vuelvo a probar… (" + vuelta + ")");
          return espera(1500 * vuelta).then(function () { return prueba(0, ultimoError) });
        }
        throw new Error(/demand|overloaded|UNAVAILABLE|503/i.test(ultimoError || "") ? "Gemini está muy ocupado ahora mismo. Prueba otra vez en un minuto." : (ultimoError || "Ningún modelo ha contestado"));
      }
      peticion = window.AbortController ? new AbortController() : null;
      var tiempo = setTimeout(function () { if (peticion) peticion.abort() }, 12000);   // si tarda más de 12 s, prueba otro
      return fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(modelos[i]) + ":generateContent", {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": clave }, body: cuerpo(modelos[i]), signal: peticion ? peticion.signal : undefined
      }).then(function (r) { clearTimeout(tiempo); return r.json().then(function (j) {
        if (r.ok) { ls("otto_ultimo", modelos[i]); return j }
        var msg = (j.error && j.error.message) || ("error " + r.status);
        log("⚠ " + modelos[i] + ": " + msg.slice(0, 120));
        if (/no longer available|not found/i.test(msg)) { if (ls("otto_ultimo") === modelos[i]) ls("otto_ultimo", ""); listaModelos = null; ls("otto_modelos", "") }
        if (r.status === 400 && /API key|api_key|API_KEY/.test(msg)) throw new Error("La clave de Gemini no es válida. Revísala en ⚙️ Configuración.");
        if (r.status === 403) throw new Error("La clave no tiene permiso para Gemini (" + msg.slice(0, 80) + ")");
        return prueba(i + 1, msg);
      }) }, function (e) { clearTimeout(tiempo); if (mio !== turno) throw new Error("cortado"); log("⚠ " + modelos[i] + ": " + (e.name === "AbortError" ? "tarda demasiado" : textoError(e))); return prueba(i + 1, "Sin respuesta") });
    }
    modelosGoogle().then(function (L) {
      modelos = [ls("otto_modelo"), ls("otto_ultimo")].concat(L.texto, ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.8-flash"])
        .filter(function (m, i, a) { return m && a.indexOf(m) === i });
      return prueba(0);
    }).then(function (j) {
      if (mio !== turno) return;
      var raw = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts.map(function (p) { return p.text || "" }).join("");
      if (!raw) throw new Error((j.error && j.error.message) || "Sin respuesta");
      var o; try { o = JSON.parse(raw) } catch (e) { o = { acciones: [], texto: raw } }
      if (o.planauto && o.planauto.pasos && o.planauto.pasos.length) { planAuto = o.planauto; pasoAuto = 0; log("🎲 Plan del modo auto: " + planAuto.pasos.length + " cosas, " + (planAuto.sustos || []).length + " sustos") }
      historia.push({ role: "model", parts: [{ text: raw }] });
      enviar("W0"); log("🤖 " + (o.texto || "") + "   (" + ((Date.now() - t0) / 1000).toFixed(1) + " s)"); return responde(o, mio);
    }).catch(function (e) { if (mio !== turno || /cortado/.test(e.message)) return; enviar("W0"); log("⚠ " + textoError(e)); aviso("⚠ IA: " + textoError(e)); if (!interno) decir("Uy, no he podido pensar.") })
      .then(function () { if (mio === turno) { iaOcupada = false; if (autoIA) proximoAuto = Date.now() + 8000 + Math.random() * 12000 } });
  }
  var POSES = { recto: [90, 90, 90, 90], puntillas: [90, 90, 45, 135], puntillas_reves: [90, 90, 135, 45], triste: [110, 70, 20, 160],
    dormir: [100, 80, 60, 120], confuso: [110, 70, 90, 90], pies_dentro: [115, 65, 90, 90], pies_fuera: [65, 115, 90, 90],
    inclinado_izq: [90, 90, 70, 70], inclinado_der: [90, 90, 110, 110], orgulloso: [70, 110, 100, 80], timido: [105, 75, 85, 95] };
  var avisoFw = false;
  function responde(o, mio) {
    var acc = (o.acciones || []).slice(0, 10), sonidos = [], movs = [], posturas = [];
    acc.forEach(function (a) { var w = String(a).trim().split(/\s+/);
      if (w[0] === "MODOAUTO") { autoIA = !/OFF|NO/i.test(w[1] || "ON"); proximoAuto = Date.now() + 4000; if (!autoIA) { planAuto = null; enviar("N") } log(autoIA ? "🎲 Modo auto ENCENDIDO (di «Otto, para» para pararlo)" : "🎲 Modo auto apagado"); return }
      if (w[0] === "POSEHECHA" && POSES[w[1]]) w = ["POSE"].concat(POSES[w[1]], [w[2] || 1500]);                        // v26: poses ya hechas
      if (w[0] === "POSTURAHECHA" && POSES[w[2]]) w = ["POSTURA", w[1] || 0].concat(POSES[w[2]], [w[3] || 500]);
      (w[0] === "POSTURA" ? posturas : w[0] === "SONIDO" || w[0] === "CANCION" ? sonidos : movs).push(w) });
    var modoVoz = ls("otto_voz") || "gemini";
    if (modoVoz === "gemini" && est.fw < 23 && !avisoFw) { avisoFw = true; log("ℹ️ Para que Otto hable con su propia voz, actualízalo por USB. Mientras, hablo con la voz del móvil.") }
    var voz = modoVoz === "gemini" && est.fw >= 23 ? vozEnDirecto(o.texto || "", posturas) : Promise.resolve(null);   // v22: la voz se crea y se manda YA
    var cadena = Promise.resolve();                        // PRIMERO la animación (movimientos, luces, sonidos)...
    movs.concat(sonidos).forEach(function (w) { cadena = cadena.then(function () { if (mio === turno) return accion(w) }) });
    return Promise.all([cadena, voz]).then(function (rr) {   // Otto habla solo en cuanto acaba de moverse
      if (mio !== turno || rr[1]) return;
      if (modoVoz === "gemini" && est.fw >= 23 && Date.now() > +ls("otto_sinvoz")) log("ℹ️ La voz de Gemini no ha funcionado: hablo con la del móvil");
      return decir(o.texto || "", modoVoz === "gemini" ? "movil" : null);
    })
    .then(function () { if (mio === turno && /\?\s*$/.test(o.texto || "")) { seguirHasta = Date.now() + 5000; luzEscucha(true); log("🎤 (5 s para contestar)") } });
  }
  function esperaFin(maxMs) { return new Promise(function (r) { esperaL = r; setTimeout(function () { if (esperaL === r) { esperaL = null; r() } }, maxMs) }) }
  function accion(w) {
    var t = w[0];
    if (t === "ANDA") { var d = (w[1] || "F")[0].toUpperCase(), n = Math.max(1, Math.min(6, +w[2] || 1)); var e = esperaFin(n * 1500 + 2000); enviar("A" + d + n); return e }
    if (t === "TRUCO") { var e2 = esperaFin(16000); enviar("T" + (+w[1] || 0)); return e2 }
    if (t === "POSE") { var v = w.slice(1, 6).map(Number); var e3 = esperaFin((v[4] || 500) + 3000); enviar("P" + v.join(",")); return e3 }
    if (t === "COLOR") { enviar("C" + (w[1] || "FFFFFF").replace("#", "")); return espera(100) }
    if (t === "SINCOLOR") { enviar("N"); return espera(50) }
    if (t === "SONIDO") { enviar("S" + (+w[1] || 0)); return espera(1500) }
    if (t === "CANCION") { var notas = w.slice(1).join("").split(",").slice(0, 60), tot = 0; notas.forEach(function (x) { tot += +(x.split(":")[1] || 0) });
                           enviar("U" + notas.join(",")); return espera(Math.min(tot, 30000) + 300) }
    if (t === "CARA") { enviar("X" + (+w[1] || 0)); return espera(50) }
    if (t === "DIBUJO") { enviar("F" + (w[1] || "")); return espera(50) }
    return Promise.resolve();
  }
  // v17: VOZ DE GEMINI por el altavoz de Otto
  var VOZ_GEMINI = "Puck";
  function vozGemini(texto) {                              // devuelve las muestras (24000/s) o null
    var clave = ls("otto_api"); if (!clave || !texto) return Promise.resolve(null);
    var modelos = ["gemini-2.5-flash-preview-tts", "gemini-2.5-flash-tts", "gemini-2.5-pro-preview-tts"];
    var cuerpo = JSON.stringify({ contents: [{ parts: [{ text: "Dilo en español, con voz alegre y rápida de robot pequeño y simpático: " + texto }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOZ_GEMINI } } } } });
    function prueba(i) {
      if (i >= modelos.length) return null;
      return fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelos[i] + ":generateContent", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": clave }, body: cuerpo })
        .then(function (r) { return r.json().then(function (j) {
          var d = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0].inlineData;
          if (!r.ok || !d) { log("⚠ voz " + modelos[i] + ": " + ((j.error && j.error.message) || "sin audio").slice(0, 100)); return prueba(i + 1) }
          var bin = atob(d.data), n = bin.length >> 1, pcm = new Int16Array(n);
          for (var k = 0; k < n; k++) { var v = bin.charCodeAt(2 * k) | (bin.charCodeAt(2 * k + 1) << 8); pcm[k] = v > 32767 ? v - 65536 : v }
          return pcm;
        }) }, function () { return prueba(i + 1) });
    }
    return prueba(0);
  }
  var IMA_IDX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];
  var IMA_STEP = [7,8,9,10,11,12,13,14,16,17,19,21,23,25,28,31,34,37,41,45,50,55,60,66,73,80,88,97,107,118,130,143,157,173,190,209,230,253,279,307,337,371,408,449,494,544,598,658,724,796,876,963,1060,1166,1282,1411,1552,1707,1878,2066,2272,2499,2749,3024,3327,3660,4026,4428,4871,5358,5894,6484,7132,7845,8630,9493,10442,11487,12635,13899,15289,16818,18500,20350,22385,24623,27086,29794,32767];
  function aOtto(pcm24) {                                  // v21: 24000 -> 6000 muestras/s, más fuerte, y comprimido a 4 bits (ADPCM)
    var n = Math.floor(pcm24.length / 4), m = new Float32Array(n), max = 1;
    for (var i = 0; i < n; i++) { m[i] = (pcm24[4 * i] + pcm24[4 * i + 1] + pcm24[4 * i + 2] + pcm24[4 * i + 3]) / 4; if (Math.abs(m[i]) > max) max = Math.abs(m[i]) }
    var g = 30000 / max, out = new Uint8Array(Math.ceil(n / 2)), pred = 0, idx = 0;
    for (i = 0; i < n; i++) {
      var x = Math.max(-32768, Math.min(32767, m[i] * g)), st = IMA_STEP[idx], d = x - pred, code = 0;
      if (d < 0) { code = 8; d = -d }
      var dq = st >> 3;
      if (d >= st) { code |= 4; d -= st; dq += st } if (d >= st >> 1) { code |= 2; d -= st >> 1; dq += st >> 1 } if (d >= st >> 2) { code |= 1; dq += st >> 2 }
      pred += (code & 8) ? -dq : dq; pred = Math.max(-32768, Math.min(32767, pred));
      idx = Math.max(0, Math.min(88, idx + IMA_IDX[code]));
      if (i & 1) out[i >> 1] |= code << 4; else out[i >> 1] = code;
    }
    return out;
  }
  // v22: VOZ EN DIRECTO. Gemini crea la voz a trozos (streaming) y cada trozo se comprime y se manda a Otto al momento.
  function codificador(paso) {                             // ADPCM que recuerda dónde se quedó entre trozo y trozo (paso 4 = 6000/s, 5 = 4800/s)
    paso = paso || 4;
    var pred = 0, idx = 0, resto = [], max = 6000, impar = false, medio = 0;
    return function (pcm24) {
      var a = resto.concat(Array.prototype.slice.call(pcm24)), n = Math.floor(a.length / paso), out = [];
      resto = a.slice(n * paso);
      for (var i = 0; i < n; i++) {
        var m = 0; for (var q = 0; q < paso; q++) m += a[paso * i + q]; m /= paso;
        if (Math.abs(m) > max) max = Math.abs(m);
        var x = Math.tanh(2.2 * m / max) / Math.tanh(2.2) * 32000, st = IMA_STEP[idx], d = x - pred, code = 0;   // v25: compresor = suena más fuerte
        if (d < 0) { code = 8; d = -d }
        var dq = st >> 3;
        if (d >= st) { code |= 4; d -= st; dq += st } if (d >= st >> 1) { code |= 2; d -= st >> 1; dq += st >> 1 } if (d >= st >> 2) { code |= 1; dq += st >> 2 }
        pred += (code & 8) ? -dq : dq; pred = Math.max(-32768, Math.min(32767, pred));
        idx = Math.max(0, Math.min(88, idx + IMA_IDX[code]));
        if (impar) { out.push(medio | (code << 4)); impar = false } else { medio = code; impar = true }
      }
      return new Uint8Array(out);
    };
  }
  function b64aPcm(b64) { var bin = atob(b64), n = bin.length >> 1, pcm = new Int16Array(n);
    for (var k = 0; k < n; k++) { var v = bin.charCodeAt(2 * k) | (bin.charCodeAt(2 * k + 1) << 8); pcm[k] = v > 32767 ? v - 65536 : v } return pcm }
  // abre la voz en Otto, va mandando trozos y la cierra. Devuelve una promesa que se cumple cuando Otto ACABA de hablar (o null si falla)
  function vozEnDirecto(texto, posturas) {
    var clave = ls("otto_api"); if (!clave || !texto || !car) return Promise.resolve(null);
    var rapido = (ls("otto_vozmodo") || "rapido") === "rapido";                    // v29: ⚡ empezar rápido / 🎵 sin cortes
    var mio = turno, RATE = (rapido ? 5000 : 6000) * 1.08, porSeg = RATE / 2, cod = codificador(rapido ? 5 : 4), enviados = 0, t0 = Date.now(), abierta = false;
    var bps = Math.min(6000, +ls("otto_bps") || 1700), segEstim = Math.max(1, texto.length / 13);
    var empezar = rapido ? 1200 : Math.round(segEstim * porSeg * Math.max(0, 1 - bps / porSeg) * 1.25) + 3500;
    function abre() {
      if (abierta) return; abierta = true;
      enviar("IX");
      (posturas || []).slice(0, 16).forEach(function (w) { var t = Math.round((+w[1] || 0) * 1000), v = w.slice(2, 7).map(function (x) { return Math.round(+x || 90) }); enviar("I" + t + "," + v.join(",")) });
      enviar("B0," + Math.round(RATE) + "," + empezar);
    }
    function manda(bytes) { if (!bytes.length || mio !== turno) return; abre(); enviados += bytes.length;
      for (var i = 0; i < bytes.length; i += 2400) { var tr = bytes.slice(i, i + 2400); enviarBin("b" + tr.length, tr) } }
    var cuerpo = JSON.stringify({ contents: [{ parts: [{ text: texto }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOZ_GEMINI } } } } });
    var modelos = [];
    function prueba(i) {
      if (i >= modelos.length) return Promise.resolve(false);
      return fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelos[i] + ":streamGenerateContent?alt=sse", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": clave }, body: cuerpo })
        .then(function (r) {
          if (!r.ok || !r.body) { log("⚠ voz " + modelos[i] + ": error " + r.status);
            if (r.status === 429) { ls("otto_sinvoz", String(Date.now() + 3 * 3600000)); log("ℹ️ Se ha gastado la voz gratis de Gemini: 3 horas con la voz del móvil"); return false }
            return prueba(i + 1) }
          var lector = r.body.getReader(), dec = new TextDecoder(), trozo = "", algo = false;
          function lee() {
            return lector.read().then(function (x) {
              if (x.done || mio !== turno) return algo;
              trozo += dec.decode(x.value, { stream: true });
              var k;
              while ((k = trozo.indexOf("\n")) >= 0) {
                var lin = trozo.slice(0, k).trim(); trozo = trozo.slice(k + 1);
                if (lin.indexOf("data:") !== 0) continue;
                try { var j = JSON.parse(lin.slice(5)); (j.candidates && j.candidates[0].content && j.candidates[0].content.parts || []).forEach(function (pt) {
                  if (pt.inlineData && pt.inlineData.data) { algo = true; manda(cod(b64aPcm(pt.inlineData.data))) } }) } catch (e) {}
              }
              return lee();
            });
          }
          return lee().then(function (ok) { return ok || prueba(i + 1) });
        }, function () { return prueba(i + 1) });
    }
    hablando = true; dichoAhora = texto;
    if (Date.now() < +ls("otto_sinvoz")) { hablando = false; return Promise.resolve(null) }   // hoy ya se gastó la voz gratis
    return modelosGoogle().then(function (L) { modelos = L.voz.length ? L.voz : ["gemini-2.5-flash-preview-tts"]; return prueba(0) }).then(function (ok) {
      if (!ok || mio !== turno) { if (abierta) enviar("b0"); hablando = false; return null }
      enviar("b0");
      return cola.then(function () {
        var seg = (Date.now() - t0) / 1000; if (seg > 1 && enviados > 3000) ls("otto_bps", String(Math.max(200, Math.min(6000, Math.round(enviados / seg)))));
        log("📡 Voz en directo: " + (enviados / 1024).toFixed(1) + " KB en " + seg.toFixed(1) + " s");
        var falta = enviados / porSeg * 1000 + 3000 - (Date.now() - t0);
        return new Promise(function (r) { esperaF = r; setTimeout(function () { if (esperaF === r) { esperaF = null; r() } }, Math.max(2500, falta)) });
      }).then(function () { if (mio === turno) { hablando = false; dichoAhora = "" } return true });
    });
  }
  // hablar: con la voz de Otto (por su altavoz) o con la del móvil
  function decir(texto, forzar) {
    if (!texto) return Promise.resolve();
    hablando = true; dichoAhora = texto;
    var mio = turno, fin = function () { if (mio === turno) { hablando = false; dichoAhora = "" } };
    var mv = forzar || ls("otto_voz") || "gemini";
    if ((mv === "movil" || mv === "gemini") && window.speechSynthesis) {
      // mientras habla el móvil, el micro se pausa (si no, el iPhone saca el sonido por el auricular, muy bajito)
      if (rec) { microPausado = true; try { rec.stop() } catch (e) {} }
      var vuelveMicro = function () { microPausado = false; if (iaOn && rec) setTimeout(function () { try { rec.start() } catch (e) {} }, 350) };
      return new Promise(function (r) { var u = new SpeechSynthesisUtterance(texto); u.lang = "es-ES"; u.pitch = 1.45; u.rate = 1.05;
        var vs = speechSynthesis.getVoices().filter(function (v) { return /^es/i.test(v.lang) });
        var buena = vs.filter(function (v) { return /premium|enhanced|mejorad|siri|neural/i.test(v.name) })[0] || vs.filter(function (v) { return /es-ES/i.test(v.lang) })[0] || vs[0];
        if (buena) u.voice = buena; u.volume = 1;
        var hecho = false, acaba = function () { if (hecho) return; hecho = true; fin(); vuelveMicro(); r() };
        u.onend = u.onerror = acaba; setTimeout(acaba, 1500 + texto.length * 120);       // por si el iPhone no avisa de que ha acabado
        setTimeout(function () { speechSynthesis.cancel(); speechSynthesis.speak(u) }, rec ? 250 : 0) });
    }
    var trozos = texto.match(/.{1,150}(\s|$)/g) || [texto], p = Promise.resolve();
    trozos.forEach(function (tr) { p = p.then(function () { if (mio !== turno) return; enviar("D" + tr.trim()); return espera(tr.length * 75 + 300) }) });
    return p.then(fin);
  }

  // ---------- configuración
  function configuracion() {
    var p = h("div", "ot-p"); p.appendChild(h("h3", "", "⚙️ Configuración"));
    function campo(et, clave, tipo, ph) { p.appendChild(h("div", "", et)); var i = h("input", "ot-in"); i.type = tipo || "text"; i.placeholder = ph || ""; i.value = ls(clave); p.appendChild(i); return i }
    var nom = campo("🤖 Nombre del robot (lo dice al encenderse):", "otto_nombre", "text", "Otto");
    var api = campo("🔑 Clave de la API de Gemini (se guarda solo en este móvil):", "otto_api", "password", "AIza…");
    var mod = campo("🧠 Modelo de Gemini (déjalo vacío = automático):", "otto_modelo", "text", "automático");
    p.appendChild(h("div", "", "🔊 ¿Con qué voz contesta la IA?"));
    var sel = h("select", "ot-in"); [["gemini", "Voz de Gemini por el altavoz de Otto (tarda unos segundos)"], ["movil", "Voz del móvil (la más rápida)"], ["otto", "Voz de sílabas de Otto (experimental)"]].forEach(function (x) { var o = h("option", "", x[1]); o.value = x[0]; sel.appendChild(o) });
    sel.value = ls("otto_voz") || "gemini"; p.appendChild(sel);
    p.appendChild(h("div", "", "⏱️ La voz de Otto:"));
    var sm = h("select", "ot-in"); [["rapido", "⚡ Empezar rápido (puede hacer alguna pausita)"], ["calidad", "🎵 Sin cortes (espera un poco antes de hablar)"]].forEach(function (x) { var o = h("option", "", x[1]); o.value = x[0]; sm.appendChild(o) });
    sm.value = ls("otto_vozmodo") || "rapido"; sm.onchange = function () { ls("otto_vozmodo", sm.value) }; p.appendChild(sm);
    var g = h("button", "ot-b on", "💾 Guardar");
    g.onclick = function () {
      ls("otto_api", api.value.trim()); ls("otto_modelo", mod.value.trim()); ls("otto_voz", sel.value);
      var n = nom.value.trim(); if (n && n !== ls("otto_nombre")) { ls("otto_nombre", n); enviar("Y" + n.slice(0, 23)) }
      log("💾 Guardado"); pinta();
    };
    var sal = h("button", "ot-b", "👋 Probar saludo"); sal.onclick = function () { enviar("G") };
    var f = h("div", "ot-fila"); f.appendChild(g); f.appendChild(sal); p.appendChild(f);
    p.appendChild(h("div", "ot-est", "⚠️ No enseñes nunca la clave en vídeos ni se la des a nadie. Si se ve, bórrala en Google AI Studio y crea otra."));
    return p;
  }

  // ---------- pantalla principal
  var raiz = null, verConfig = false;
  var textoLog = "";
  function log(t) { textoLog = (t + "\n" + textoLog).slice(0, 3000); if (ui.log) ui.log.textContent = textoLog }
  function alerta(t) { log("⚠ " + t); aviso("⚠ " + t) }
  function aviso(t) { if (!ui.aviso) return; ui.aviso.textContent = t; ui.aviso.hidden = !t; if (t) log(t) }
  function pintaEstado() {
    if (!ui.est) return;
    var m = est.modo;
    ui.est.innerHTML = "";
    var dot = h("span", "ot-dot"); dot.style.background = m >= 0 ? COLMODO[m] : "#555"; ui.est.appendChild(dot);
    ui.est.appendChild(document.createTextNode(m >= 0 ? (est.nombre || "Otto") + " · Modo " + MODOS[m] + " · 🔊 " + est.vol + " · 🐇 " + est.vel + (est.pantalla ? " · 😀 pantalla" : "") : "Sin conectar"));
    if (ui.pant) ui.pant.hidden = !est.pantalla;
    if (m === 3) empiezaIA(); else if (ui.ia && !ui.ia.hidden) paraIA();
  }
  function pinta() {
    ui.main.innerHTML = "";
    if (verConfig) { ui.main.appendChild(configuracion()); return }
    ui.main.appendChild(vista === "vertical" ? mandoVertical() : mandoHorizontal());
    ui.ia = h("div", "ot-p"); ui.ia.hidden = est.modo !== 3; ui.ia.appendChild(h("h3", "", "🧠 Modo IA"));
    ui.iaInfo = h("div", "ot-est", ""); ui.ia.appendChild(ui.iaInfo);
    ui.bMic = h("button", "ot-b on", iaOn ? "🔇 Apagar micrófono" : "🎤 Activar micrófono"); ui.bMic.onclick = function () { iaOn ? microOff() : microOn() }; ui.ia.appendChild(ui.bMic);
    var bPara = h("button", "ot-b", "✋ Parar"); bPara.style.marginLeft = "8px"; bPara.onclick = function () { cortaTodo(); vuelveMicroSiHace(); log("✋ Parado") }; ui.ia.appendChild(bPara);
    ui.mic = h("div", "ot-mic"); ui.mic.hidden = !iaOn; ui.mic.style.marginTop = "8px"; ui.ia.appendChild(ui.mic);
    ui.main.insertBefore(ui.ia, ui.main.firstChild);
    ui.escribe = h("div", ""); ui.escribe.style.marginTop = "10px";
    var inp = h("input", "ot-in"); inp.placeholder = "Escribe a " + (est.nombre || "Otto") + "…"; var b = h("button", "ot-b on", "Enviar");
    b.onclick = function () { if (inp.value.trim()) { pregunta(inp.value.trim()); inp.value = ""; inp.blur() } };
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); b.onclick() } });   // «Intro» también envía
    inp.addEventListener("focus", function () { if (ui.escribe) luzEscucha(true) });
    inp.addEventListener("blur", function () { setTimeout(function () { if (!iaOn) luzEscucha(false) }, 300) });
    var pista = h("div", "ot-est", "💡 Truco: toca la caja, pulsa el 🎤 del TECLADO del iPhone, habla, y pulsa Enviar."); ui.escribe.appendChild(pista); ui.escribe.appendChild(inp); ui.escribe.appendChild(b); ui.ia.appendChild(ui.escribe);
    ui.pant = panelPantalla(); ui.pant.hidden = !est.pantalla; ui.main.appendChild(ui.pant);
    var lp = h("div", "ot-p"); lp.appendChild(h("h3", "", "📝 Mensajes")); ui.log = h("div", "ot-log"); ui.log.textContent = textoLog; lp.appendChild(ui.log); ui.main.appendChild(lp);
  }
  function abrir() {
    if (raiz) return;
    document.head.appendChild(css);
    raiz = h("div", "ot");
    var top = h("div", "ot-top");
    var salir = h("button", "ot-b", "✖ Salir"); salir.onclick = cerrar;
    ui.con = h("button", "ot-b", car ? "🔗 Conectado" : "🔗 Conectar"); ui.con.onclick = function () { if (!car) conectar(true) };
    var todos = h("button", "ot-b", "🔎 Solo Otto"); todos.onclick = function () { if (!car) conectar(false) };
    var cambia = h("button", "ot-b", "🔄 Cambiar mando"); cambia.onclick = function () { verConfig = false; vista = vista === "vertical" ? "horizontal" : "vertical"; ls("otto_vista", vista); pinta() };
    var conf = h("button", "ot-b", "⚙️"); conf.onclick = function () { verConfig = !verConfig; pinta() };
    [salir, ui.con, todos, cambia, conf].forEach(function (b) { top.appendChild(b) });
    raiz.appendChild(top);
    var ver = h("span", "ot-est", "v29"); ver.style.marginLeft = "auto"; top.appendChild(ver);   // versión del controlador (para saber si el móvil tiene la nueva)
    ui.est = h("div", "ot-est", "Sin conectar"); raiz.appendChild(ui.est);
    ui.aviso = h("div", "ot-mic"); ui.aviso.hidden = true; ui.aviso.style.background = "#5a3a10"; raiz.appendChild(ui.aviso);
    ui.main = h("div", "ot-main"); raiz.appendChild(ui.main);
    document.body.appendChild(raiz); document.body.style.overflow = "hidden";
    pinta(); pintaEstado();
    if (!navigator.bluetooth) log("ℹ️ Para conectar en iPhone, abre lumimarcshows.com con la app «Bluefy» (gratis en la App Store).");
  }
  function cerrar() { paraIA(); clearInterval(tJoy); if (raiz) raiz.remove(); raiz = null; document.body.style.overflow = "" }
  window.OttoControl = { abrir: abrir };
})();
