// Idiomas de lumimarcshows.com: es (original), ca, en, fr. Se elige arriba y se recuerda.
(function () {
  "use strict";
  var D = {
    ca: {
      bienvenida: "Benvingut/da", bienvenida_txt: "El teu compte de Lumimarc ja està creat. T'hem enviat un correu per confirmar la teva adreça.", lo_nuevo: "El més nou des de la teva última visita", ver_novedades: "Veure les novetats",
      nav_fuente: "La font", nav_videos: "Vídeos", nav_kit: "Kit", nav_novedades: "Novetats", descargar: "⬇ Descarregar",
      etiqueta: "NOU PROGRAMA DE FONTS", titulo: "La font nova",
      intro: "7 dolls d'aigua que ballen amb la música: pugen, baixen, s'inclinen i s'il·luminen de colors. I un programa gratuït per crear els teus propis espectacles.",
      btn_prog: "⬇ Descarregar el programa", btn_videos: "▶ Veure vídeos",
      fuente_titulo: "La font", fuente_texto: "Dissenyada i impresa en 3D per en Marc. Cada doll té la seva bomba amb alçada regulable, un servo que l'inclina i un anell de llums LED.",
      d1: "dolls d'aigua", d2: "alçada de cada doll (MOSFET)", d3: "inclinació amb servos", d4: "es connecta als llums de l'escenari",
      videos_titulo: "Vídeos virtuals", videos_texto: "Així es veuen alguns espectacles al simulador del programa. Cada cop està coreografiat a mà.",
      programa_texto: "El programa per crear espectacles d'aigua, llum i música. Gratuït.",
      li1: "Línia de temps amb blocs: alçades, rampes, inclinació i colors", li2: "Simulador 3D per veure el show sense aigua", li3: "Connexió amb Arduino (USB) i amb llums DMX", li4: "S'actualitza sol quan hi ha versió nova o shows nous",
      desc_win: "⬇ Descarregar per a Windows", desc_mac: "🍎 Descarregar per a Mac", ultima: "Última versió", version: "Versió",
      req1: "Windows 10/11 o Mac · necessita Chrome o Edge · la música la poses tu", req2: "Es descarrega un zip: descomprimeix-lo i obre l'instal·lador. En Mac, la primera vegada: clic dret sobre l'app → Obrir",
      prog_idioma: "El programa de moment és en castellà.",
      kit_titulo: "Construeix la teva font", kit_texto: "Tot el que necessites per fer-te la font Lumimarc: llista de materials, talls de fusta i de làmina, peces 3D (STL), esquema de l'electrònica i el programa d'Arduino. Amb guia en el teu idioma.",
      kit_btn: "🧰 Descarregar el kit (zip)", kit_req: "Peces per a impressora 3D (cama de 256 mm) · Arduino Mega",
      novedades_titulo: "Novetats", novedades_texto: "El més nou que hem fet.",
      zona_titulo: "🔐 Zona d'en Marc", zona_texto: "Només per al creador: entra amb el seu compte de Microsoft.", zona_btn: "Iniciar sessió",
      pie: "LUMIMARC · Fuente Musical DMX · fet per en Marc i Claude · Els vídeos i les fotos són de Lumimarc.", privacidad: "Privacitat",
      cerrar: "Tancar", iniciar: "Iniciar sessió", crear_cuenta: "Crear compte", tu_nombre: "El teu nom o sobrenom", correo: "Correu electrònic", contrasena: "Contrasenya (mín. 8)",
      acepto_html: 'Tinc 14 anys o més, o tinc permís dels meus pares, i accepto la <a href="privacidad.html" target="_blank">política de privacitat</a>.',
      entrar: "Entrar", ya_tengo: "Ja tinc compte: iniciar sessió", no_tengo: "No tens compte? Crea'n un", olvide: "He oblidat la contrasenya",
      pon_correo: "Escriu el teu correu a dalt i torna a prémer.", enviado: "T'hem enviat un correu per canviar-la.",
      e_email: "El correu no és vàlid.", e_usado: "Ja hi ha un compte amb aquest correu.", e_debil: "La contrasenya ha de tenir almenys 8 caràcters.", e_mal: "Correu o contrasenya incorrectes.",
      e_muchos: "Massa intents. Espera una mica.", e_otro: "Alguna cosa ha fallat. Torna-ho a provar.", e_nombre: "Escriu un nom (màx. 40 lletres).", e_acepta: "Marca la casella per continuar.",
      panel: "Panell d'en Marc", cambiar_nombre: "Canviar el meu nom", guardar: "Desar", salir: "Tancar sessió", borrar_cuenta: "Esborrar el meu compte",
      seguro: "Segur? S'esborrarà per sempre. Prem un altre cop.", reentra: "Per seguretat, tanca sessió, torna a entrar i esborra'l.",
      desc_marc: "Descarregar la meva versió (Zona d'en Marc a OneDrive)", info_marc: "La teva versió amb 📤 Publicar i 🌐 Editar web és al teu OneDrive privat. La música arriba sola amb OneDrive.",
      descargas: "Descàrregues", usuarios: "Persones inscrites", nadie: "Encara no hi ha ningú.", personas: "persones", nuevo_nombre: "Nom nou:", quitar: "Treure de la llista"
    },
    en: {
      bienvenida: "Welcome", bienvenida_txt: "Your Lumimarc account is ready. We have sent you an email to confirm your address.", lo_nuevo: "What's new since your last visit", ver_novedades: "See the news",
      nav_fuente: "The fountain", nav_videos: "Videos", nav_kit: "Kit", nav_novedades: "News", descargar: "⬇ Download",
      etiqueta: "NEW FOUNTAIN SOFTWARE", titulo: "The new fountain",
      intro: "7 water jets that dance to the music: they rise, fall, tilt and light up in colours. And a free program to create your own shows.",
      btn_prog: "⬇ Download the program", btn_videos: "▶ Watch videos",
      fuente_titulo: "The fountain", fuente_texto: "Designed and 3D-printed by Marc. Each jet has its own pump with adjustable height, a servo that tilts it and an LED light ring.",
      d1: "water jets", d2: "height of each jet (MOSFET)", d3: "tilt with servos", d4: "connects to stage lights",
      videos_titulo: "Virtual videos", videos_texto: "This is how some shows look in the program's simulator. Every hit is choreographed by hand.",
      programa_texto: "The program to create water, light and music shows. Free.",
      li1: "Block timeline: heights, ramps, tilt and colours", li2: "3D simulator to watch the show without water", li3: "Connects to Arduino (USB) and DMX lights", li4: "Updates itself when there is a new version or new shows",
      desc_win: "⬇ Download for Windows", desc_mac: "🍎 Download for Mac", ultima: "Latest version", version: "Version",
      req1: "Windows 10/11 or Mac · needs Chrome or Edge · you add your own music", req2: "You get a zip: unzip it and open the installer. On Mac, the first time: right-click the app → Open",
      prog_idioma: "The program is in Spanish for now.",
      kit_titulo: "Build your own fountain", kit_texto: "Everything you need to build the Lumimarc fountain: parts list, wood and liner cuts, 3D parts (STL), electronics wiring and the Arduino program. With a guide in your language.",
      kit_btn: "🧰 Download the kit (zip)", kit_req: "Parts for a 3D printer (256 mm bed) · Arduino Mega",
      novedades_titulo: "News", novedades_texto: "The latest things we have made.",
      zona_titulo: "🔐 Marc's area", zona_texto: "Only for the creator: sign in with his Microsoft account.", zona_btn: "Sign in",
      pie: "LUMIMARC · Fuente Musical DMX · made by Marc and Claude · Videos and photos by Lumimarc.", privacidad: "Privacy",
      cerrar: "Close", iniciar: "Sign in", crear_cuenta: "Create account", tu_nombre: "Your name or nickname", correo: "Email", contrasena: "Password (min. 8)",
      acepto_html: 'I am 14 or older, or I have my parents\' permission, and I accept the <a href="privacidad.html" target="_blank">privacy policy</a>.',
      entrar: "Sign in", ya_tengo: "I already have an account: sign in", no_tengo: "No account? Create one", olvide: "I forgot my password",
      pon_correo: "Type your email above and press again.", enviado: "We have sent you an email to change it.",
      e_email: "The email is not valid.", e_usado: "There is already an account with that email.", e_debil: "The password must be at least 8 characters.", e_mal: "Wrong email or password.",
      e_muchos: "Too many attempts. Wait a little.", e_otro: "Something went wrong. Try again.", e_nombre: "Type a name (max. 40 letters).", e_acepta: "Tick the box to continue.",
      panel: "Marc's panel", cambiar_nombre: "Change my name", guardar: "Save", salir: "Sign out", borrar_cuenta: "Delete my account",
      seguro: "Sure? It will be deleted forever. Press again.", reentra: "For security, sign out, sign in again and delete it.",
      desc_marc: "Download my version (Marc's area on OneDrive)", info_marc: "Your version with 📤 Publish and 🌐 Edit web is in your private OneDrive. Music arrives by itself through OneDrive.",
      descargas: "Downloads", usuarios: "Registered people", nadie: "Nobody yet.", personas: "people", nuevo_nombre: "New name:", quitar: "Remove from the list"
    },
    fr: {
      bienvenida: "Bienvenue", bienvenida_txt: "Ton compte Lumimarc est créé. Nous t'avons envoyé un e-mail pour confirmer ton adresse.", lo_nuevo: "Quoi de neuf depuis ta dernière visite", ver_novedades: "Voir les nouveautés",
      nav_fuente: "La fontaine", nav_videos: "Vidéos", nav_kit: "Kit", nav_novedades: "Nouveautés", descargar: "⬇ Télécharger",
      etiqueta: "NOUVEAU LOGICIEL DE FONTAINES", titulo: "La nouvelle fontaine",
      intro: "7 jets d'eau qui dansent sur la musique : ils montent, descendent, s'inclinent et s'illuminent de couleurs. Et un logiciel gratuit pour créer tes propres spectacles.",
      btn_prog: "⬇ Télécharger le logiciel", btn_videos: "▶ Voir les vidéos",
      fuente_titulo: "La fontaine", fuente_texto: "Conçue et imprimée en 3D par Marc. Chaque jet a sa pompe à hauteur réglable, un servo qui l'incline et un anneau de lumière LED.",
      d1: "jets d'eau", d2: "hauteur de chaque jet (MOSFET)", d3: "inclinaison avec servos", d4: "se connecte aux lumières de scène",
      videos_titulo: "Vidéos virtuelles", videos_texto: "Voici quelques spectacles dans le simulateur du logiciel. Chaque coup est chorégraphié à la main.",
      programa_texto: "Le logiciel pour créer des spectacles d'eau, de lumière et de musique. Gratuit.",
      li1: "Ligne de temps en blocs : hauteurs, rampes, inclinaison et couleurs", li2: "Simulateur 3D pour voir le spectacle sans eau", li3: "Connexion à Arduino (USB) et aux lumières DMX", li4: "Se met à jour tout seul quand il y a une nouvelle version ou de nouveaux spectacles",
      desc_win: "⬇ Télécharger pour Windows", desc_mac: "🍎 Télécharger pour Mac", ultima: "Dernière version", version: "Version",
      req1: "Windows 10/11 ou Mac · nécessite Chrome ou Edge · tu ajoutes ta propre musique", req2: "Tu reçois un zip : décompresse-le et ouvre l'installateur. Sur Mac, la première fois : clic droit sur l'app → Ouvrir",
      prog_idioma: "Le logiciel est en espagnol pour l'instant.",
      kit_titulo: "Construis ta fontaine", kit_texto: "Tout ce qu'il faut pour construire la fontaine Lumimarc : liste du matériel, découpes du bois et de la bâche, pièces 3D (STL), schéma électronique et programme Arduino. Avec un guide dans ta langue.",
      kit_btn: "🧰 Télécharger le kit (zip)", kit_req: "Pièces pour imprimante 3D (plateau 256 mm) · Arduino Mega",
      novedades_titulo: "Nouveautés", novedades_texto: "Nos dernières créations.",
      zona_titulo: "🔐 Espace de Marc", zona_texto: "Réservé au créateur : connexion avec son compte Microsoft.", zona_btn: "Se connecter",
      pie: "LUMIMARC · Fuente Musical DMX · fait par Marc et Claude · Vidéos et photos de Lumimarc.", privacidad: "Confidentialité",
      cerrar: "Fermer", iniciar: "Se connecter", crear_cuenta: "Créer un compte", tu_nombre: "Ton nom ou pseudo", correo: "E-mail", contrasena: "Mot de passe (min. 8)",
      acepto_html: 'J\'ai 14 ans ou plus, ou j\'ai la permission de mes parents, et j\'accepte la <a href="privacidad.html" target="_blank">politique de confidentialité</a>.',
      entrar: "Se connecter", ya_tengo: "J'ai déjà un compte : se connecter", no_tengo: "Pas de compte ? En créer un", olvide: "Mot de passe oublié",
      pon_correo: "Écris ton e-mail ci-dessus et appuie à nouveau.", enviado: "Nous t'avons envoyé un e-mail pour le changer.",
      e_email: "L'e-mail n'est pas valide.", e_usado: "Il existe déjà un compte avec cet e-mail.", e_debil: "Le mot de passe doit avoir au moins 8 caractères.", e_mal: "E-mail ou mot de passe incorrect.",
      e_muchos: "Trop d'essais. Attends un peu.", e_otro: "Un problème est survenu. Réessaie.", e_nombre: "Écris un nom (max. 40 lettres).", e_acepta: "Coche la case pour continuer.",
      panel: "Panneau de Marc", cambiar_nombre: "Changer mon nom", guardar: "Enregistrer", salir: "Se déconnecter", borrar_cuenta: "Supprimer mon compte",
      seguro: "Sûr ? Il sera supprimé pour toujours. Appuie encore.", reentra: "Par sécurité, déconnecte-toi, reconnecte-toi et supprime-le.",
      desc_marc: "Télécharger ma version (Espace de Marc sur OneDrive)", info_marc: "Ta version avec 📤 Publier et 🌐 Modifier le site est dans ton OneDrive privé. La musique arrive toute seule avec OneDrive.",
      descargas: "Téléchargements", usuarios: "Personnes inscrites", nadie: "Personne pour l'instant.", personas: "personnes", nuevo_nombre: "Nouveau nom :", quitar: "Retirer de la liste"
    }
  };
  var KIT = { es: "Kit Fuente Lumimarc (ES).zip", ca: "Kit Font Lumimarc (CA).zip", en: "Lumimarc Fountain Kit (EN).zip", fr: "Kit Fontaine Lumimarc (FR).zip" };
  var LANGS = [["es", "ES"], ["ca", "CA"], ["en", "EN"], ["fr", "FR"]];
  function elegido() {
    var q = new URLSearchParams(location.search).get("lang"); if (q && (q in D || q === "es")) return q;
    try { var s = localStorage.getItem("lumiLang"); if (s) return s } catch (e) {}
    var n = (navigator.language || "es").slice(0, 2); return (n in D) ? n : "es";
  }
  var lang = elegido();
  window.lumiLang = lang;
  window.lumiT = function (k, def) { return (D[lang] && D[lang][k] != null) ? D[lang][k] : def };
  document.documentElement.lang = lang;
  var originales = {};
  function aplicar() {
    document.querySelectorAll("[data-i18n]").forEach(function (e) {
      var k = e.getAttribute("data-i18n");
      if (!(k in originales)) originales[k] = e.textContent;
      e.textContent = lang === "es" ? originales[k] : window.lumiT(k, originales[k]);
    });
    var kit = document.getElementById("bajarkit"); if (kit) kit.href = "/descargas/kit/" + encodeURIComponent(KIT[lang] || KIT.es);
    var pi = document.getElementById("progidioma"); if (pi) pi.hidden = lang === "es";
    document.querySelectorAll(".idioma button").forEach(function (b) { b.classList.toggle("on", b.dataset.l === lang) });
  }
  window.lumiAplicarIdioma = aplicar;
  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.querySelector("nav .wrap"), box = document.createElement("div"); box.className = "idioma"; box.setAttribute("aria-label", "Idioma");
    LANGS.forEach(function (p) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = p[1]; b.dataset.l = p[0];
      b.onclick = function () { try { localStorage.setItem("lumiLang", p[0]) } catch (e) {} location.reload() };
      box.appendChild(b);
    });
    nav.insertBefore(box, nav.querySelector(".logo").nextSibling);
    aplicar();
  });
})();
