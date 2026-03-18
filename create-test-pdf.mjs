import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "fs";

const investors = [
  { name: "John Smith", amount: "$250,000", type: "Angel Investor" },
  { name: "Sarah Johnson", amount: "$500,000", type: "Venture Capital" },
  { name: "Acme Holdings Ltd", amount: "$1,200,000", type: "Institutional Investor" },
];

const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

for (const inv of investors) {
  const page = pdf.addPage([595, 842]); // A4
  page.drawText("INVESTOR AGREEMENT", { x: 180, y: 780, size: 18, font: bold, color: rgb(0.1, 0.1, 0.5) });
  page.drawLine({ start: { x: 50, y: 765 }, end: { x: 545, y: 765 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("Investor Name:", { x: 50, y: 720, size: 12, font: bold });
  page.drawText(inv.name, { x: 200, y: 720, size: 12, font });
  page.drawText("Investment Type:", { x: 50, y: 690, size: 12, font: bold });
  page.drawText(inv.type, { x: 200, y: 690, size: 12, font });
  page.drawText("Committed Amount:", { x: 50, y: 660, size: 12, font: bold });
  page.drawText(inv.amount, { x: 200, y: 660, size: 12, font });
  page.drawText("Date:", { x: 50, y: 630, size: 12, font: bold });
  page.drawText("March 18, 2026", { x: 200, y: 630, size: 12, font });
  page.drawText("This agreement confirms the commitment of the above-named investor", { x: 50, y: 580, size: 10, font, color: rgb(0.3,0.3,0.3) });
  page.drawText("to participate in the funding round under the agreed terms.", { x: 50, y: 565, size: 10, font, color: rgb(0.3,0.3,0.3) });
  page.drawText("Signature: _______________________", { x: 50, y: 400, size: 11, font });
  page.drawText(`${inv.name}`, { x: 50, y: 380, size: 10, font, color: rgb(0.4,0.4,0.4) });
}

const bytes = await pdf.save();
writeFileSync("C:/Users/User/Downloads/test-investors.pdf", bytes);
console.log("Created: C:/Users/User/Downloads/test-investors.pdf (3 pages, 3 investors)");
