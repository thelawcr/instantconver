// Conversión de documentos e imágenes. Usa `file` y `ext`, definidos en app.js.
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inl(s) { return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>') }
function mdToHtml(md) {
  const o = []; let list = null, para = [], code = null;
  const fp = () => { if (para.length) { o.push("<p>" + inl(para.join(" ")) + "</p>"); para = [] } };
  const fl = () => { if (list) { o.push("</" + list + ">"); list = null } };
  for (const l of md.replace(/\r/g, "").split("\n")) {
    if (code !== null) { if (l.startsWith("```")) { o.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>"); code = null } else code.push(l); continue }
    if (l.startsWith("```")) { fp(); fl(); code = []; continue }
    let m;
    if (m = l.match(/^(#{1,6})\s+(.*)/)) { fp(); fl(); o.push(`<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`) }
    else if (m = l.match(/^\s*([-*+]|\d+\.)\s+(.*)/)) { fp(); const t = /\d/.test(m[1]) ? "ol" : "ul"; if (list !== t) { fl(); o.push("<" + t + ">"); list = t } o.push("<li>" + inl(m[2]) + "</li>") }
    else if (!l.trim()) { fp(); fl() }
    else { fl(); para.push(l.trim()) }
  }
  fp(); fl(); return o.join("\n")
}
async function toHtml() {
  if (ext === "pdf") return pdfToHtml();
  if (ext === "docx") return (await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })).value;
  const t = await file.text();
  return ext === "md" ? mdToHtml(t) : t.split(/\n{2,}/).map(p => "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>").join("\n");
}
function htmlToMd(root) {
  const w = n => {
    if (n.nodeType === 3) return n.textContent.replace(/\s+/g, " ");
    if (n.nodeType !== 1) return "";
    const c = () => [...n.childNodes].map(w).join(""), t = n.tagName.toLowerCase();
    if (/^h[1-6]$/.test(t)) return "\n\n" + "#".repeat(+t[1]) + " " + c().trim() + "\n\n";
    if (t === "p") return "\n\n" + c().trim() + "\n\n";
    if (t === "strong" || t === "b") return "**" + c().trim() + "**";
    if (t === "em" || t === "i") return "*" + c().trim() + "*";
    if (t === "a") return "[" + c() + "](" + n.getAttribute("href") + ")";
    if (t === "br") return "  \n";
    if (t === "code") return "`" + c() + "`";
    if (t === "ul" || t === "ol") return "\n\n" + [...n.children].map((li, i) => (t === "ol" ? (i + 1) + ". " : "- ") + w(li).trim()).join("\n") + "\n\n";
    if (t === "table") return "\n\n" + [...n.querySelectorAll("tr")].map(r => [...r.cells].map(x => x.textContent.trim()).join(" | ")).join("\n") + "\n\n";
    return c()
  };
  return w(root).replace(/\n{3,}/g, "\n\n").trim() + "\n"
}
const need = u => new Promise((r, j) => { if (document.querySelector('script[src="' + u + '"]')) return r(); const s = document.createElement("script"); s.src = u; s.onload = r; s.onerror = () => j(new Error("PDF: no se pudo cargar el lector.")); document.head.appendChild(s) });
async function pdfToHtml() {
  const B = "vendor/pdfjs/";
  await need(B + "pdf.min.js");
  pdfjsLib.GlobalWorkerOptions.workerSrc = B + "pdf.worker.min.js";
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise, L = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const tc = await (await pdf.getPage(p)).getTextContent(), P = [];
    // El PDF puede guardar el texto en otro orden (p. ej. las negritas al final). Cada fragmento se une a
    // su línea por posición; el límite horizontal evita mezclar columnas que comparten altura.
    for (const it of tc.items) {
      if (!it.str) continue;
      const x = it.transform[4], y = it.transform[5], e = x + it.width, h = Math.abs(it.transform[3]) || it.height;
      const l = P.find(l => Math.abs(y - l.y) < h * .5 && x <= l.e + h * 2 && e >= l.x - h * 2);
      if (l) { l.f.push({ s: it.str, x, e }); l.x = Math.min(l.x, x); l.e = Math.max(l.e, e) }
      else P.push({ y, h, p, x, e, f: [{ s: it.str, x, e }] });
    }
    for (const l of P) {
      let t = "", end = -Infinity;
      for (const f of l.f.sort((a, b) => a.x - b.x)) {
        if (!f.s.trim()) continue; // Los espacios se deducen de la distancia entre fragmentos.
        if (t && f.x - end > l.h * .1 && !/\s$/.test(t) && !/^\s/.test(f.s)) t += " ";
        t += f.s; end = Math.max(end, f.e);
      }
      L.push({ t, y: l.y, h: l.h, p });
    }
  }
  if (!L.some(l => l.t.trim())) throw new Error("PDF: no tiene texto (¿está escaneado?).");
  const hs = L.map(l => Math.round(l.h)).sort((a, b) => a - b), med = hs[hs.length >> 1] || 10, o = []; let pa = [];
  const fp = () => { if (pa.length) { o.push("<p>" + esc(pa.join(" ")) + "</p>"); pa = [] } };
  L.forEach((l, i) => {
    const t = l.t.replace(/\s+/g, " ").trim(), pv = L[i - 1];
    if (!t) { fp(); return }
    if (l.h > med * 1.25 && t.length < 100) { fp(); o.push("<h2>" + esc(t) + "</h2>"); return }
    if (/^[•◦▪‣]/.test(t) || pv && pv.p === l.p && pv.y - l.y > l.h * 1.9) fp();
    pa.push(t);
  });
  fp(); return o.join("\n");
}
async function toDocx(root) {
  const X = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const runs = (n, st) => {
    if (n.nodeType === 3) { const x = n.textContent.replace(/\s+/g, " "); return x ? [[x, st]] : [] }
    if (n.nodeType !== 1) return [];
    const t = n.tagName.toLowerCase(), s = { ...st };
    if (t === "strong" || t === "b") s.b = 1;
    if (t === "em" || t === "i") s.i = 1;
    if (t === "code") s.c = 1;
    if (t === "br") return [["\n", s]];
    return [...n.childNodes].flatMap(c => runs(c, s));
  };
  const rx = (r, sz) => r.map(([x, s]) => x === "\n" ? '<w:r><w:br/></w:r>' : '<w:r><w:rPr>' + (s.c ? '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>' : "") + (s.b ? "<w:b/>" : "") + (s.i ? "<w:i/>" : "") + (sz ? '<w:sz w:val="' + sz + '"/>' : "") + '</w:rPr><w:t xml:space="preserve">' + X(x) + '</w:t></w:r>').join("");
  const para = (n, b = {}, pre = "", ind = 0) => '<w:p><w:pPr><w:spacing w:after="160"/>' + (ind ? '<w:ind w:left="' + ind + '"/>' : "") + '</w:pPr>' + (pre ? '<w:r><w:t xml:space="preserve">' + pre + '</w:t></w:r>' : "") + rx(runs(n, b), b.sz) + '</w:p>';
  const out = [];
  const walk = n => {
    for (const c of n.childNodes) {
      if (c.nodeType === 3) { if (c.textContent.trim()) out.push(para(c)); continue }
      if (c.nodeType !== 1) continue;
      const t = c.tagName.toLowerCase();
      if (/^h[1-6]$/.test(t)) out.push(para(c, { b: 1, sz: [40, 34, 30, 26, 24, 22][t[1] - 1] }));
      else if (t === "ul" || t === "ol") [...c.children].forEach((li, i) => out.push(para(li, {}, t === "ol" ? (i + 1) + ". " : "• ", 720)));
      else if (t === "pre") out.push(para(c, { c: 1 }));
      else if (t === "table") c.querySelectorAll("tr").forEach(r => out.push('<w:p><w:r><w:t xml:space="preserve">' + X([...r.cells].map(x => x.textContent.trim()).join("   |   ")) + '</w:t></w:r></w:p>'));
      else if (t === "p" || t === "li") out.push(para(c));
      else if (c.children.length) walk(c);
      else if (c.textContent.trim()) out.push(para(c));
    }
  };
  walk(root);
  const H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', z = new JSZip();
  z.file("[Content_Types].xml", H + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file("_rels/.rels", H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file("word/document.xml", H + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + out.join("") + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>');
  return z.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
async function imgToPdf() {
  const bmp = await createImageBitmap(file), c = document.createElement("canvas");
  c.width = bmp.width; c.height = bmp.height; const x = c.getContext("2d"), png = ext === "png";
  if (!png) { x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height) }
  x.drawImage(bmp, 0, 0);
  const pdf = new jspdf.jsPDF({ unit: "pt", format: "a4", orientation: bmp.width > bmp.height ? "l" : "p" });
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight(), m = 24;
  const s = Math.min((W - 2 * m) / bmp.width, (H - 2 * m) / bmp.height, 1), w = bmp.width * s, h = bmp.height * s;
  pdf.addImage(c.toDataURL(png ? "image/png" : "image/jpeg", .95), png ? "PNG" : "JPEG", (W - w) / 2, (H - h) / 2, w, h);
  return pdf.output("blob");
}
async function docxToPdf() {
  await need("vendor/docx-preview.min.js");
  const host = document.createElement("div"); host.id = "dxh";
  host.style.cssText = "position:fixed;left:-20000px;top:0;background:#fff";
  document.body.appendChild(host);
  const px = v => /pt$/.test(v) ? parseFloat(v) * 4 / 3 : parseFloat(v);
  try {
    await docx.renderAsync(await file.arrayBuffer(), host, null, { className: "docx", inWrapper: false, breakPages: true, ignoreLastRenderedPageBreak: false, renderHeaders: true, renderFooters: true, renderFootnotes: true, useBase64URL: true, experimental: true });
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const pages = [...host.querySelectorAll("section.docx")];
    if (!pages.length) throw new Error("PDF: no se pudo leer el documento.");
    let pdf = null;
    for (const pg of pages) {
      const w = pg.offsetWidth, h = pg.offsetHeight, ph = px(pg.style.minHeight) || h, n = Math.max(1, Math.round(h / ph));
      const cv = await html2canvas(pg, { scale: 2, backgroundColor: "#fff", useCORS: true, logging: false, onclone: d => { const x = d.getElementById("dxh"); if (x) { x.style.left = "0"; x.style.top = "0" } } });
      for (let k = 0; k < n; k++) {
        const c2 = document.createElement("canvas"); c2.width = cv.width; c2.height = Math.round(ph * 2);
        const g = c2.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c2.width, c2.height); g.drawImage(cv, 0, -k * ph * 2);
        const wp = w * .75, hp = ph * .75, o = wp > hp ? "l" : "p";
        if (!pdf) pdf = new jspdf.jsPDF({ unit: "pt", format: [wp, hp], orientation: o }); else pdf.addPage([wp, hp], o);
        pdf.addImage(c2.toDataURL("image/jpeg", .92), "JPEG", 0, 0, wp, hp);
      }
    }
    return pdf.output("blob");
  } finally { host.remove() }
}
async function fromHtml(html, t) {
  const box = document.createElement("div"); box.innerHTML = html;
  if (t === "HTML") return new Blob([`<!DOCTYPE html><meta charset="utf-8"><body style="font:16px/1.6 -apple-system,system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px">${html}<\/body>`], { type: "text/html" });
  if (t === "MD") return new Blob([htmlToMd(box)], { type: "text/markdown" });
  if (t === "DOCX") return toDocx(box);
  const fnt = "width:535px;font:11px/1.6 Arial,Helvetica,sans-serif;font-kerning:none;letter-spacing:normal;color:#000;background:#fff";
  if (t === "TXT") { box.style.cssText = "position:fixed;left:-9999px;top:0;" + fnt; document.body.appendChild(box); const s = box.innerText.trim() + "\n"; box.remove(); return new Blob([s], { type: "text/plain" }) }
  box.style.cssText = fnt;
  box.insertAdjacentHTML("afterbegin", "<style>h1{font-size:1.7em;margin:.6em 0 .3em}h2{font-size:1.4em;margin:.6em 0 .3em}h3{font-size:1.2em}h4,h5,h6{font-size:1em}p{margin:.4em 0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:3px 6px;vertical-align:top}img{max-width:100%}</style>");
  try {
    const doc = new jspdf.jsPDF({ unit: "pt", format: "a4" });
    await new Promise(r => doc.html(box, { x: 0, y: 0, margin: [30, 30, 30, 30], autoPaging: "text", width: 535, windowWidth: 535, callback: r }));
    return doc.output("blob");
  } finally { box.remove() }
}
