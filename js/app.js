// Estado de la app, rueda de formatos, círculo central y carga de archivos.
const FM = ["PDF", "DOCX", "MD", "PNG", "JPG", "WEBP", "TXT", "HTML"];
const MAP = { png: ["PNG", "JPG", "WEBP", "PDF"], jpg: ["PNG", "JPG", "WEBP", "PDF"], webp: ["PNG", "JPG", "WEBP", "PDF"], md: ["PDF", "DOCX", "TXT", "HTML"], txt: ["PDF", "DOCX", "MD", "HTML"], docx: ["PDF", "MD", "TXT", "HTML"], pdf: ["DOCX", "MD", "TXT", "HTML"] };
const MIME = { PNG: "image/png", JPG: "image/jpeg", WEBP: "image/webp" };
const ICON = {
  up: "M12 16V4M7 9l5-5 5 5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  go: "M5 12h14M13 6l6 6-6 6",
  busy: "M12 3a9 9 0 1 0 9 9",
  dl: "M12 4v12M7 11l5 5 5-5M5 20h14"
};
let file = null, ext = "", info = "", target = null, out = null, outName = "", working = false;
const $ = id => document.getElementById(id), NS = "http://www.w3.org/2000/svg", RO = 183, RI = 115;
const pol = (r, d) => [r * Math.cos(d * Math.PI / 180), r * Math.sin(d * Math.PI / 180)];
function build() {
  const w = $("wheel");
  FM.forEach((f, i) => {
    const a0 = -90 + 45 * i + 4, a1 = -90 + 45 * (i + 1) - 4, m = -90 + 45 * i + 22.5;
    const [ox0, oy0] = pol(RO, a0), [ox1, oy1] = pol(RO, a1), [ix0, iy0] = pol(RI, a0), [ix1, iy1] = pol(RI, a1), [tx, ty] = pol((RO + RI) / 2, m);
    const g = document.createElementNS(NS, "g"); g.setAttribute("class", "sl"); g.dataset.f = f; g._m = m;
    g.innerHTML = `<path d="M${ox0} ${oy0}A${RO} ${RO} 0 0 1 ${ox1} ${oy1}L${ix1} ${iy1}A${RI} ${RI} 0 0 0 ${ix0} ${iy0}Z"/><text x="${tx}" y="${ty}">${f}</text>`;
    g.onclick = () => pick(f); g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.setAttribute("aria-label", "Convertir a " + f); g.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(f) } }; w.appendChild(g);
  });
  refresh();
}
// El círculo central muestra el paso actual: subir, elegir formato, convertir, esperar o descargar.
function hubState() {
  if (!file) return { icon: "up", title: "Subir archivo", sub: "o suéltalo aquí" };
  if (working) return { icon: "busy", title: "Convirtiendo…", sub: "a " + target };
  if (out) return { icon: "dl", title: "Descargar", sub: outName, cls: "done" };
  if (target) return { icon: "go", title: "Convertir", sub: "a " + target, cls: "ready" };
  return { icon: "file", title: file.name, sub: info };
}
function refresh() {
  const ok = MAP[ext] || [];
  document.querySelectorAll(".sl").forEach(g => {
    const f = g.dataset.f, sel = f === target;
    g.classList.toggle("off", !!file && (!ok.includes(f) || f === ext.toUpperCase()));
    g.classList.toggle("sel", sel); g.setAttribute("aria-disabled", g.classList.contains("off")); g.setAttribute("aria-pressed", sel);
    const [dx, dy] = sel ? pol(15, g._m) : [0, 0];
    g.style.transform = `translate(${dx}px,${dy}px) scale(${sel ? 1.04 : 1})`;
  });
  $("a").textContent = file ? ext.toUpperCase() || "___" : "___"; $("a").className = file ? "f" : "";
  $("b").textContent = target || "___"; $("b").className = target ? "f" : "";
  const h = hubState(), hub = $("hub");
  $("icp").setAttribute("d", ICON[h.icon]); $("fn").textContent = h.title; $("ft").textContent = h.sub;
  hub.classList.remove("nudge"); hub.classList.toggle("ready", h.cls === "ready"); hub.classList.toggle("done", h.cls === "done");
  hub.title = file ? file.name : ""; hub.setAttribute("aria-busy", working);
  $("wrap").classList.toggle("busy", working);
  $("reset").hidden = !file || working; $("reset").textContent = out ? "Convertir otro" : "Quitar archivo";
}
function nudge() {
  const hub = $("hub"); hub.classList.remove("nudge"); void hub.offsetWidth; hub.classList.add("nudge");
}
function pick(f) {
  if (working) return;
  if (!file) { say("Primero sube un archivo."); nudge(); return }
  const g = [...document.querySelectorAll(".sl")].find(x => x.dataset.f === f);
  if (g.classList.contains("off")) { say(f === ext.toUpperCase() ? "Tu archivo ya está en ese formato." : "Esa conversión llegará pronto."); return }
  target = f; out = null; say(""); refresh();
}
function say(t, kind = "") { $("msg").textContent = t; $("msg").className = "msg " + kind }
function load(f) {
  if (working) return;
  file = f; ext = (f.name.split(".").pop() || "").toLowerCase(); if (ext === "jpeg") ext = "jpg";
  target = null; out = null;
  const sz = f.size > 1e6 ? (f.size / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1e3)) + " KB";
  info = (ext.toUpperCase() || "?") + " · " + sz;
  if (MAP[ext]) say("Elige el formato de salida en la rueda.");
  else say(ext === "doc" ? "Los .doc antiguos no se admiten: guárdalo como .docx desde Word." : "Este tipo de archivo todavía no es compatible.", "err");
  refresh();
}
function reset() {
  if (working) return;
  file = null; ext = ""; info = ""; target = null; out = null; outName = ""; say(""); refresh();
}
async function convert() {
  working = true; say(""); refresh();
  try {
    await new Promise(r => setTimeout(r, 600));
    const base = file.name.replace(/\.[^.]+$/, ""), t = target.toLowerCase();
    if (target === "PDF" && ["png", "jpg", "webp"].includes(ext)) {
      out = await imgToPdf();
    } else if (MIME[target]) {
      const bmp = await createImageBitmap(file), c = document.createElement("canvas");
      c.width = bmp.width; c.height = bmp.height; const x = c.getContext("2d");
      if (target === "JPG") { x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height) }
      x.drawImage(bmp, 0, 0);
      out = await new Promise(r => c.toBlob(r, MIME[target], .92));
    } else {
      out = ext === "docx" && target === "PDF" ? await docxToPdf() : await fromHtml(await toHtml(), target);
    }
    if (!out) throw new Error("Sin resultado");
    outName = base + "." + t;
    say("Listo: " + outName, "ok");
  } catch (e) { out = null; say(e && e.message && e.message.startsWith("PDF") ? e.message : "No se pudo convertir este archivo.", "err") }
  working = false; refresh();
}
async function save() {
  try {
    const dn = window.claude ? await claude.use("downloads") : null;
    if (dn) { await dn.save({ filename: outName, data: out }); return }
    const a = document.createElement("a"); a.href = URL.createObjectURL(out); a.download = outName; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch (e) { if (e && e.code !== "declined") say("No se pudo guardar el archivo.", "err") }
}
$("hub").onclick = () => { if (working) return; if (out) save(); else if (target) convert(); else $("inp").click() };
$("hub").addEventListener("animationend", e => { if (e.animationName === "nu") $("hub").classList.remove("nudge") });
$("reset").onclick = reset;
$("inp").onchange = e => { const f = e.target.files[0]; e.target.value = ""; if (f) load(f) };
// Se puede soltar el archivo en cualquier parte, para que el navegador no lo abra y saque al usuario de la app.
let dragDepth = 0;
const hasFile = e => [...(e.dataTransfer ? e.dataTransfer.types : [])].includes("Files");
document.addEventListener("dragenter", e => { if (!hasFile(e)) return; e.preventDefault(); dragDepth++; document.body.classList.add("drag") });
document.addEventListener("dragover", e => { if (hasFile(e)) e.preventDefault() });
document.addEventListener("dragleave", e => { if (!hasFile(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) document.body.classList.remove("drag") });
document.addEventListener("drop", e => {
  if (!hasFile(e)) return;
  e.preventDefault(); dragDepth = 0; document.body.classList.remove("drag");
  if (e.dataTransfer.files[0]) load(e.dataTransfer.files[0]);
});
document.addEventListener("click", e => {
  const b = e.target.closest("[data-d]"); if (b) { $(b.dataset.d).showModal(); return }
  const x = e.target.closest(".x"); if (x) { x.closest("dialog").close(); return }
  if (e.target.tagName === "DIALOG") e.target.close();
});
build();
