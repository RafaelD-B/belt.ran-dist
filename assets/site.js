// belt.ran — site: tema, copiar, idioma e detecção do download. Textos por idioma em T.
(function () {
  const root = document.documentElement;
  const lang = root.lang && root.lang.toLowerCase().startsWith("pt") ? "pt" : "en";
  const T = {
    en: { detecting: "Detecting…", dlFor: "Download for ", dl: "Download", recommended: "Recommended for your system",
          copy: "Copy", copied: "Copied ✓", manual: "Select and copy", version: "Version ", latest: "Latest version" },
    pt: { detecting: "Detectando…", dlFor: "Baixar para ", dl: "Baixar", recommended: "Recomendado para o seu sistema",
          copy: "Copiar", copied: "Copiado ✓", manual: "Selecione e copie", version: "Versão ", latest: "Versão mais recente" },
  }[lang];

  // Idioma: inglês é o padrão; navegador em português vai para /pt/ na 1ª visita (a escolha fica salva).
  try {
    const saved = localStorage.getItem("beltran.site.lang");
    document.querySelectorAll("a[data-setlang]").forEach((a) =>
      a.addEventListener("click", () => { try { localStorage.setItem("beltran.site.lang", a.dataset.setlang); } catch (e) {} }));
    if (lang === "en" && !saved && /^pt/i.test(navigator.language || "") && !/[?&]lang=en/.test(location.search)) {
      location.replace(location.pathname.replace(/index\.html$/, "") + "pt/" + location.hash);
    }
  } catch (e) {}

  // Tema claro/escuro, memorizado. Padrão: claro.
  const btn = document.getElementById("themeBtn");
  const sync = () => (btn.textContent = root.getAttribute("data-theme") === "dark" ? "☀️" : "🌙");
  sync();
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("beltran.site.theme", next); } catch (e) {}
    sync();
  });

  // «Conferir o download»: abre o bloco ao seguir o link #verify (ou ao abrir a página nele).
  const verify = document.getElementById("verify");
  const openVerify = () => { if (verify) verify.open = true; };
  if (location.hash === "#verify") openVerify();
  document.querySelectorAll('a[href="#verify"]').forEach((a) => a.addEventListener("click", openVerify));

  // Botões «Copiar» dos comandos.
  document.querySelectorAll(".copy").forEach((b) => {
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = T.copied; }
      catch { b.textContent = T.manual; }
      setTimeout(() => (b.textContent = T.copy), 1600);
    });
  });

  const REPO = "RafaelD-B/belt.ran-dist";
  const RELEASES = `https://github.com/${REPO}/releases`;
  const PLATFORMS = {
    macos:   { label: "macOS (Apple Silicon)", ic: "🍎", name: "macOS",   match: (n) => /\.dmg$/i.test(n) },
    windows: { label: "Windows",               ic: "⊞",  name: "Windows", match: (n) => /-setup\.exe$/i.test(n) || /\.msi$/i.test(n) },
  };
  function detectOS() {
    const ua = navigator.userAgent;
    const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    if (/Mac/i.test(p) || /Mac OS X/i.test(ua)) return "macos";
    return "windows";
  }
  const stable = (os) => `${RELEASES}/latest/download/${os === "macos" ? "belt.ran-macos.dmg" : "belt.ran-windows-setup.exe"}`;
  function render(byOS, version) {
    const primary = detectOS();
    const p = PLATFORMS[primary];
    document.getElementById("pIc").textContent = p.ic;
    document.getElementById("pLabel").textContent = T.dlFor + p.name;
    document.getElementById("pSub").textContent = p.label;
    const pBtn = document.getElementById("pBtn");
    pBtn.href = byOS[primary] || stable(primary);
    pBtn.textContent = T.dl;
    const heroBtn = document.getElementById("heroDl");
    if (heroBtn) { heroBtn.href = byOS[primary] || stable(primary); heroBtn.textContent = T.dlFor + p.name; }

    const others = document.getElementById("others");
    others.innerHTML = "";
    Object.keys(PLATFORMS).filter((os) => os !== primary).forEach((os) => {
      const a = document.createElement("a");
      a.className = "btn secondary";
      a.href = byOS[os] || stable(os);
      a.textContent = T.dlFor + PLATFORMS[os].name;
      others.appendChild(a);
    });
    if (primary === "macos") {
      document.getElementById("macNote").style.display = "flex";
      document.getElementById("brewBox").style.display = "block";
    } else {
      document.getElementById("winNote").style.display = "flex";
    }
    if (version) document.getElementById("version").textContent = T.version + version;
    document.getElementById("changelog").href = version ? `${RELEASES}/tag/v${version}` : RELEASES;
  }
  window.render = render; // facilita pré-visualizar estados (QA)
  (async () => {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
      if (!r.ok) throw 0;
      const rel = await r.json();
      const byOS = {};
      for (const os of Object.keys(PLATFORMS)) {
        const hit = (rel.assets || []).find((a) => PLATFORMS[os].match(a.name));
        if (hit) byOS[os] = hit.browser_download_url;
      }
      render(byOS, (rel.tag_name || "").replace(/^v/, ""));
    } catch { render({}, null); }
  })();
})();
