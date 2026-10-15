import * as Highcharts from 'highcharts';

/**
 * Keep the Highcharts "Download ..." menu items working without the public
 * export server.
 *
 * Up to Highcharts 11.1 the exporting module downloaded a chart by submitting
 * a hidden <form> to https://export.highcharts.com/. A form POST is not
 * subject to CORS, so whatever came back simply downloaded. From 11.2 it uses
 * fetch() instead, and 11.4.8 arrived with the Angular 17 -> 21 upgrade.
 *
 * The plugin serves this UI over plain http (http://<host>:9440/z4d/). Chrome's
 * default referrer policy, strict-origin-when-cross-origin, sends no Referer at
 * all on an http -> https request, and the Cloudflare rules now in front of
 * export.highcharts.com reject a request that has none. The block page carries
 * no Access-Control-Allow-Origin, so the fetch fails as a CORS error and
 * nothing is downloaded. "Print chart" and "View in full screen" are purely
 * client-side, which is why only the four Download items broke.
 *
 * The offline-exporting module, registered alongside exporting in NetworkModule
 * and DashboardModule, renders PNG, JPEG and SVG from the live SVG through a
 * canvas, so no request leaves the browser. fallbackToExportServer: false stops
 * it quietly retrying the server on failure, which would also mean uploading
 * the user's device names and network topology to a third party.
 */
export function configureHighchartsExporting(): void {
  Highcharts.setOptions({
    exporting: {
      fallbackToExportServer: false
    }
  });

  void loadPdfLibraries();
}

/**
 * PDF is the one type offline-exporting cannot render by itself: it needs
 * jsPDF, plus svg2pdf.js for the jsPDF .svg() method it calls. Left alone the
 * module fetches both from https://code.highcharts.com/<version>/lib/ the first
 * time a PDF is asked for, which fails here for two reasons - that host answers
 * 403 to the same Referer-less request, and a plugin on a LAN may have no
 * internet at all.
 *
 * So load them from our own bundle instead. The dynamic import keeps the ~500 kB
 * out of the initial bundle: webpack emits a separate chunk, fetched from the
 * plugin in the background once the app has booted. Importing svg2pdf.js for its
 * side effect is what installs jsPDF.API.svg; Highcharts looks the class up as
 * window.jspdf.jsPDF, so it has to be published there under that exact name.
 */
async function loadPdfLibraries(): Promise<void> {
  const win = window as unknown as { jspdf?: { jsPDF: unknown } };
  if (win.jspdf) {
    return;
  }

  const { jsPDF } = await import('jspdf');
  await import('svg2pdf.js');
  win.jspdf = { jsPDF };
}
