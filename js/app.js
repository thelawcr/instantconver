// Estado de la app, rueda de formatos, carga de archivos y botones.
const FM = ["PDF", "DOCX", "MD", "PNG", "JPG", "WEBP", "TXT", "HTML"];
const MAP = { png: ["PNG", "JPG", "WEBP", "PDF"], jpg: ["PNG", "JPG", "WEBP", "PDF"], webp: ["PNG", "JPG", "WEBP", "PDF"], md: ["PDF", "DOCX", "TXT", "HTML"], txt: ["PDF", "DOCX", "MD", "HTML"], docx: ["PDF", "MD", "TXT", "HTML"], pdf: ["DOCX", "MD", "TXT", "HTML"] };
const MIME = { PNG: "image/png", JPG: "image/jpeg", WEBP: "image/webp" };
let file = null, ext = "", target = null, out = null, outName = "";
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
function refresh() {
  const ok = MAP[ext] || [];
  document.querySelectorAll(".sl").forEach(g => {
    const f = g.dataset.f, sel = f === target;
    g.classList.toggle("off", !ok.includes(f) || f === ext.toUpperCase());
    g.classList.toggle("sel", sel); g.setAttribute("aria-disabled", g.classList.contains("off")); g.setAttribute("aria-pressed", sel);
    const [dx, dy] = sel ? pol(15, g._m) : [0, 0];
    g.style.transform = `translate(${dx}px,${dy}px) scale(${sel ? 1.04 : 1})`;
  });
  $("b").textContent = target || "___"; $("b").className = target ? "f" : "";
  $("go").disabled = !(file && target); $("go").hidden = !!out;
}
function pick(f) {
  const g = [...document.querySelectorAll(".sl")].find(x => x.dataset.f === f);
  if (g.classList.contains("off")) { say(file ? "Esa conversión llegará pronto." : "Primero sube un archivo."); return }
  target = f; out = null; $("dl").hidden = true; say(""); refresh();
}
function say(t) { $("msg").textContent = t }
function load(f) {
  file = f; ext = (f.name.split(".").pop() || "").toLowerCase(); if (ext === "jpeg") ext = "jpg";
  target = null; out = null; $("dl").hidden = true;
  const sz = f.size > 1e6 ? (f.size / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1e3)) + " KB";
  $("fn").textContent = f.name; $("ft").textContent = (ext.toUpperCase() || "?") + " · " + sz;
  $("ic").style.display = "none";
  $("a").textContent = ext.toUpperCase() || "___"; $("a").className = "f";
  say(MAP[ext] ? "Elige el formato de salida en la rueda." : ext === "doc" ? "Los .doc antiguos no se admiten: guárdalo como .docx desde Word." : "Este tipo de archivo todavía no es compatible.");
  refresh();
}
$("inp").onchange = e => e.target.files[0] && load(e.target.files[0]);
const d = $("drop");
["dragover", "dragenter"].forEach(n => d.addEventListener(n, e => { e.preventDefault(); d.classList.add("on") }));
["dragleave", "drop"].forEach(n => d.addEventListener(n, e => { e.preventDefault(); d.classList.remove("on") }));
d.addEventListener("drop", e => e.dataTransfer.files[0] && load(e.dataTransfer.files[0]));
function busy(b) { $("go").classList.toggle("busy", b); $("go").textContent = b ? "Convirtiendo…" : "Convertir"; $("bar").classList.toggle("on", b); document.querySelector(".wrap").classList.toggle("busy", b) }
$("go").onclick = async () => {
  try {
    busy(true); await new Promise(r => setTimeout(r, 600)); say("");
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
    outName = base + "." + t;
    $("dl").hidden = false; $("go").hidden = true; say("Listo: " + outName);
  } catch (e) { say(e && e.message && e.message.startsWith("PDF") ? e.message : "No se pudo convertir este archivo.") }
  busy(false);
};
$("dl").onclick = async () => {
  try {
    const dn = window.claude ? await claude.use("downloads") : null;
    if (dn) { await dn.save({ filename: outName, data: out }); return }
    const a = document.createElement("a"); a.href = URL.createObjectURL(out); a.download = outName; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch (e) { if (e && e.code !== "declined") say("No se pudo guardar el archivo.") }
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-d]"); if (b) { $(b.dataset.d).showModal(); return }
  const x = e.target.closest(".x"); if (x) { x.closest("dialog").close(); return }
  if (e.target.tagName === "DIALOG") e.target.close();
});
build();
