# File Converter by InstantKarma

Conversor de documentos e imágenes que funciona por completo en el navegador: los archivos nunca se suben a un servidor. Está publicado en Vercel como sitio estático, sin proceso de compilación.

## Estructura

```
index.html          Página, textos de ayuda y textos legales
css/styles.css      Estilos
js/app.js           Estado, rueda de formatos, carga de archivos y botones
js/converters.js    Lógica de conversión
vendor/             Librerías de terceros (no editar)
docs/               Material que no se publica en el sitio
```

`converters.js` debe cargarse antes que `app.js`. Comparten variables globales, por eso `index.html` los incluye como scripts normales y no como módulos.

## Probar en local

Sirve la carpeta con cualquier servidor estático, por ejemplo:

```bash
npx serve .
```

## Librerías incluidas

| Librería | Versión | Licencia | Uso |
|---|---|---|---|
| mammoth | 1.6.0 | BSD-2-Clause | Leer DOCX |
| docx-preview | 0.3.3 | Apache-2.0 | Renderizar DOCX para pasarlo a PDF |
| pdf.js | 3.11.174 | Apache-2.0 | Leer PDF |
| jsPDF | 2.5.1 | MIT | Generar PDF |
| html2canvas | 1.4.1 | MIT | Capturar páginas para el PDF |
| JSZip | 3.10.1 | MIT o GPL-3.0 | Generar DOCX |
