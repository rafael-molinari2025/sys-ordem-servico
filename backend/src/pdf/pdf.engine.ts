import puppeteer, { Browser } from "puppeteer";

let browserPromise: Promise<Browser> | null = null;

/** Mantém um único Chromium "quente" no processo (evita o custo de ~1-2s de lançar o browser a cada PDF). */
function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  }
  return browserPromise;
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

/** Caminho do Chromium já baixado pelo puppeteer — reaproveitado pelo whatsapp-web.js para não baixar um segundo navegador. */
export function chromiumExecutablePath(): string {
  return puppeteer.executablePath();
}
