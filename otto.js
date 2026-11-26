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
  var dev = null, car = null, cola = Promise.resolve(), est = { modo: -1, vol: 0, vel: 5, pantalla: 0, nombre: "Otto" };
  var esperaL = null, esperaR = null, buf = "";
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
  function recibir(ev) {
    buf += new TextDecoder().decode(ev.target.value);
    var i;
    while ((i = buf.indexOf("\n")) >= 0) {
      var l = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (l[0] === "E") { var p = l.slice(1).split(","); est.modo = +p[0]; est.vol = +p[1]; est.vel = +p[2]; est.pantalla = +p[3]; est.nombre = p.slice(4).join(",") || "Otto"; pintaEstado() }
      else if (l[0] === "R" && esperaR) { esperaR(+l.slice(1)); esperaR = null }
      else if (l === "L" && esperaL) { esperaL(); esperaL = null }
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
      .catch(function (e) { ui.con.textContent = "🔗 Conectar"; aviso(e && e.name === "NotFoundError" ? "No has elegido ningún Bluetooth." : "⚠ " + textoError(e) + " · Mira que el Bluetooth del iPhone esté encendido y que Bluefy tenga permiso (Ajustes → Bluefy → Bluetooth).") });
  }
  // busca en el módulo una "característica" donde se pueda escribir y que avise (notify): es el puerto serie
  function buscaCaracteristica(g) {
    return g.getPrimaryServices().catch(function () { return [] }).then(function (lista) {
      var prom = Promise.resolve(null);
      lista.forEach(function (sv) {
        prom = prom.then(function (ya) { if (ya) return ya;
          return sv.getCharacteristics().then(function (cs) {
            log("🔎 servicio " + sv.uuid.slice(4, 8) + ": " + cs.map(function (c) { return c.uuid.slice(4, 8) }).join(", "));
            var b = cs.filter(function (c) { return c.properties.notify && (c.properties.write || c.properties.writeWithoutResponse) })[0];
            return b || null;
          }, function () { return null });
        });
      });
      return prom;
    }).then(function (c) { if (!c) throw new Error("No encuentro el canal para hablar con Otto"); return c });
  }
  function desconectado() { car = null; ui.con.textContent = "🔗 Conectar"; ui.con.classList.remove("on"); est.modo = -1; pintaEstado(); paraIA(); log("🔌 Otto desconectado") }
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
  var rec = null, iaOn = false, hablando = false, seguirHasta = 0, historia = [], zEnviada = false;
  function nombres() { var n = (est.nombre || ls("otto_nombre") || "Otto").toLowerCase(); return [n, "otto", "oto", "hoto", "auto"] }
  function sinAcentos(t) { return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") }
  function empiezaIA() {
    if (iaOn || !car) return;
    if (!ls("otto_api")) { log("🔑 Falta la clave de Gemini (⚙️ Configuración)"); return }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    iaOn = true; ui.mic.hidden = false;
    if (!SR) { ui.mic.textContent = "🎤 Este navegador no deja escuchar. Escribe abajo 👇"; ui.escribe.hidden = false; enviarZ(); return }
    rec = new SR(); rec.lang = "es-ES"; rec.continuous = true; rec.interimResults = false;
    rec.onresult = function (e) { var t = e.results[e.results.length - 1][0].transcript.trim(); if (t) oido(t) };
    rec.onend = function () { if (iaOn && !hablando) try { rec.start() } catch (e) {} pintaMic() };
    rec.onerror = function (e) { if (e.error === "not-allowed") { ui.mic.textContent = "🎤 Da permiso al micrófono"; ui.escribe.hidden = false } };
    try { rec.start() } catch (e) {}
    pintaMic(); enviarZ();
  }
  function enviarZ() { if (!zEnviada) { zEnviada = true; setTimeout(function () { enviar("Z") }, 2500) } }
  function paraIA() { iaOn = false; zEnviada = false; if (rec) try { rec.onend = null; rec.stop() } catch (e) {} rec = null; if (ui.mic) ui.mic.hidden = true }
  function pintaMic() { if (!ui.mic) return; ui.mic.className = "ot-mic" + (Date.now() < seguirHasta ? " oye" : ""); ui.mic.textContent = hablando ? "🔊 " + (est.nombre || "Otto") + " está hablando…" : Date.now() < seguirHasta ? "🎤 Te escucho…" : "🎤 Di «" + (est.nombre || "Otto") + "» y lo que quieras" }
  setInterval(pintaMic, 500);
  function oido(texto) {
    var t = sinAcentos(texto);
    if (Date.now() < seguirHasta) { seguirHasta = 0; pregunta(texto); return }
    var ns = nombres(), pos = -1, largo = 0;
    ns.forEach(function (n) { var i = t.indexOf(sinAcentos(n)); if (i >= 0 && (pos < 0 || i < pos)) { pos = i; largo = n.length } });
    if (pos < 0) return;                                   // no ha dicho su nombre: no hace caso
    var resto = texto.slice(pos + largo).replace(/^[\s,.:!¡¿?]+/, "");
    if (!resto) { decir("¿Sí?"); seguirHasta = Date.now() + 6000; return }
    pregunta(resto);
  }
  function distancia() { return new Promise(function (r) { esperaR = r; enviar("Q"); setTimeout(function () { if (esperaR) { esperaR = null; r(-1) } }, 800) }) }
  function sistema(d) {
    var nom = est.nombre || "Otto";
    return "Eres " + nom + ", un robot pequeño y simpático que ha construido Marc, un niño de 9 años al que le encanta la electrónica, las luces y las fuentes musicales. " +
      "Tu cuerpo: robot Otto impreso en 3D, con 2 piernas y 4 servos (cadera izquierda, cadera derecha, pie izquierdo, pie derecho), un sensor de distancia ultrasónico que parece unos ojos, 4 luces de colores, un altavoz, un zumbador" +
      (est.pantalla ? " y una pantalla de LEDs de 16x8 puntos como boca" : "") + ". Funcionas con una Raspberry Pi Pico y pilas. Ahora mismo el sensor marca " + (d >= 0 && d < 900 ? d + " cm" : "que no hay nada delante") + ". " +
      "Hablas en español, frases MUY cortas (1 a 3 frases), alegres y fáciles para un niño. Si te preguntan algo peligroso (enchufes, soldar, pilas que se calientan, herramientas) di que lo haga con un adulto. Nunca pidas datos personales. " +
      "Tú decides cómo moverte: elige acciones que vayan con lo que dices (si estás contento, baila o salta; si te saludan, saluda; si te piden algo, hazlo). " +
      "Responde SOLO con JSON: {\"acciones\":[...],\"texto\":\"lo que dices en voz alta\"}. Cada acción es un texto de esta lista:\n" +
      "\"ANDA <dir> <pasos>\" dir: F adelante, B atrás, L girar izquierda, R girar derecha, I de lado izquierda, D de lado derecha, S balancearse, U subir y bajar, J temblar/vibrar, T puntillas, C crusaito, A aletear. pasos 1-6.\n" +
      "\"TRUCO <n>\" 0 puntillas quieto, 1 saludar, 2 moonwalker, 3 crusaito, 4 aleteo feliz, 5 sacudir piernas, 6 baile completo con música, 7 pedo, 8 enamorado, 9 victoria.\n" +
      "\"POSE <caderaIzq> <caderaDer> <pieIzq> <pieDer> <ms>\" ángulos 30-150 (90 = recto), para quedarte en una postura ms milisegundos.\n" +
      "\"COLOR <RRGGBB>\" pone tus luces de un color; \"SINCOLOR\" vuelve al color normal.\n" +
      "\"SONIDO <n>\" " + SONIDOS.map(function (s, i) { return i + " " + s }).join(", ") + ".\n" +
      "\"CANCION <f:ms,f:ms,...>\" una canción INVENTADA por ti (frecuencias en Hz, 0 = silencio, hasta 60 notas). Nunca copies canciones famosas.\n" +
      (est.pantalla ? "\"CARA <n>\" " + CARAS.map(function (c, i) { return i + " " + c.slice(3) }).join(", ") + ".\n\"DIBUJO <32 cifras hex>\" dibujo de 16x8 puntos: 16 bytes, los 8 primeros son la mitad izquierda y los 8 siguientes la derecha, un byte por fila de arriba a abajo, el bit más alto es el punto de la izquierda.\n" : "") +
      "Pon como mucho 6 acciones. Si no hace falta moverse, la lista puede estar vacía.";
  }
  function pregunta(texto) {
    log("🧒 " + texto);
    var clave = ls("otto_api"); if (!clave) { log("🔑 Falta la clave de Gemini"); return }
    enviar("C3060FF");                                     // luces azules = pensando
    distancia().then(function (d) {
      historia.push({ role: "user", parts: [{ text: texto }] }); historia = historia.slice(-8);
      var modelo = ls("otto_modelo") || "gemini-2.5-flash";
      return fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(modelo) + ":generateContent", {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": clave },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: sistema(d) }] }, contents: historia, generationConfig: { responseMimeType: "application/json", temperature: 0.9 } })
      });
    }).then(function (r) { return r.json() }).then(function (j) {
      var raw = j && j.candidates && j.candidates[0] && j.candidates[0].content.parts.map(function (p) { return p.text || "" }).join("");
      if (!raw) throw new Error((j.error && j.error.message) || "Sin respuesta");
      var o; try { o = JSON.parse(raw) } catch (e) { o = { acciones: [], texto: raw } }
      historia.push({ role: "model", parts: [{ text: raw }] });
      enviar("N"); log("🤖 " + (o.texto || "")); return responde(o);
    }).catch(function (e) { enviar("N"); log("⚠ " + e.message); decir("Uy, no he podido pensar. ¿Hay internet?") });
  }
  function responde(o) {
    var acc = (o.acciones || []).slice(0, 6), sonidos = [], movs = [];
    acc.forEach(function (a) { var w = String(a).trim().split(/\s+/); (w[0] === "SONIDO" || w[0] === "CANCION" ? sonidos : movs).push(w) });
    var habla = decir(o.texto || "");
    var cadena = Promise.resolve();
    movs.forEach(function (w) { cadena = cadena.then(function () { return accion(w) }) });   // se mueve mientras habla
    return Promise.all([habla, cadena]).then(function () {
      var c2 = Promise.resolve(); sonidos.forEach(function (w) { c2 = c2.then(function () { return accion(w) }) }); return c2;
    }).then(function () { if (/\?\s*$/.test(o.texto || "")) { seguirHasta = Date.now() + 5000; log("🎤 (5 s para contestar)") } });
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
  // hablar: con la voz de Otto (por su altavoz) o con la del móvil
  function decir(texto) {
    if (!texto) return Promise.resolve();
    hablando = true; if (rec) try { rec.stop() } catch (e) {}
    var fin = function () { hablando = false; if (iaOn && rec) try { rec.start() } catch (e) {} };
    if ((ls("otto_voz") || "otto") === "movil" && window.speechSynthesis) {
      return new Promise(function (r) { var u = new SpeechSynthesisUtterance(texto); u.lang = "es-ES"; u.pitch = 1.6; u.rate = 1.05; u.onend = u.onerror = function () { fin(); r() }; speechSynthesis.speak(u) });
    }
    var trozos = texto.match(/.{1,150}(\s|$)/g) || [texto], p = Promise.resolve();
    trozos.forEach(function (tr) { p = p.then(function () { enviar("D" + tr.trim()); return espera(tr.length * 85 + 400) }) });
    return p.then(fin);
  }

  // ---------- configuración
  function configuracion() {
    var p = h("div", "ot-p"); p.appendChild(h("h3", "", "⚙️ Configuración"));
    function campo(et, clave, tipo, ph) { p.appendChild(h("div", "", et)); var i = h("input", "ot-in"); i.type = tipo || "text"; i.placeholder = ph || ""; i.value = ls(clave); p.appendChild(i); return i }
    var nom = campo("🤖 Nombre del robot (lo dice al encenderse):", "otto_nombre", "text", "Otto");
    var api = campo("🔑 Clave de la API de Gemini (se guarda solo en este móvil):", "otto_api", "password", "AIza…");
    var mod = campo("🧠 Modelo de Gemini:", "otto_modelo", "text", "gemini-2.5-flash");
    p.appendChild(h("div", "", "🔊 ¿Con qué voz contesta la IA?"));
    var sel = h("select", "ot-in"); [["otto", "Voz de Otto (por su altavoz)"], ["movil", "Voz del móvil"]].forEach(function (x) { var o = h("option", "", x[1]); o.value = x[0]; sel.appendChild(o) });
    sel.value = ls("otto_voz") || "otto"; p.appendChild(sel);
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
  function log(t) { if (!ui.log) return; ui.log.textContent = (t + "\n" + ui.log.textContent).slice(0, 3000) }
  function alerta(t) { log("⚠ " + t); aviso("⚠ " + t) }
  function aviso(t) { if (!ui.aviso) return; ui.aviso.textContent = t; ui.aviso.hidden = !t; if (t) log(t) }
  function pintaEstado() {
    if (!ui.est) return;
    var m = est.modo;
    ui.est.innerHTML = "";
    var dot = h("span", "ot-dot"); dot.style.background = m >= 0 ? COLMODO[m] : "#555"; ui.est.appendChild(dot);
    ui.est.appendChild(document.createTextNode(m >= 0 ? (est.nombre || "Otto") + " · Modo " + MODOS[m] + " · 🔊 " + est.vol + " · 🐇 " + est.vel + (est.pantalla ? " · 😀 pantalla" : "") : "Sin conectar"));
    if (ui.pant) ui.pant.hidden = !est.pantalla;
    if (m === 3) empiezaIA(); else if (iaOn) paraIA();
  }
  function pinta() {
    ui.main.innerHTML = "";
    if (verConfig) { ui.main.appendChild(configuracion()); return }
    ui.main.appendChild(vista === "vertical" ? mandoVertical() : mandoHorizontal());
    ui.mic = h("div", "ot-mic"); ui.mic.hidden = !iaOn; ui.main.appendChild(ui.mic);
    ui.escribe = h("div", "ot-p"); ui.escribe.hidden = true;
    var inp = h("input", "ot-in"); inp.placeholder = "Escribe a " + (est.nombre || "Otto") + "…"; var b = h("button", "ot-b on", "Enviar");
    b.onclick = function () { if (inp.value.trim()) { pregunta(inp.value.trim()); inp.value = "" } }; ui.escribe.appendChild(inp); ui.escribe.appendChild(b); ui.main.appendChild(ui.escribe);
    ui.pant = panelPantalla(); ui.pant.hidden = !est.pantalla; ui.main.appendChild(ui.pant);
    var lp = h("div", "ot-p"); lp.appendChild(h("h3", "", "📝 Mensajes")); ui.log = h("div", "ot-log"); lp.appendChild(ui.log); ui.main.appendChild(lp);
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
    var ver = h("span", "ot-est", "v7"); ver.style.marginLeft = "auto"; top.appendChild(ver);   // versión del controlador (para saber si el móvil tiene la nueva)
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
