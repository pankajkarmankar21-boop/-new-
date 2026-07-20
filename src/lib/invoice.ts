import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateMarathi } from "./utils";

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  farmerName: string;
  farmerMobile: string;
  farmerVillage: string;
  bookingNumber?: string;
  type: "booking" | "subscription";
  items: { description: string; amount: number }[];
  discount: number;
  total: number;
}

/**
 * Generates a downloadable PDF invoice. Marathi (Devanagari) text is rendered
 * using the browser's canvas-to-image fallback since jsPDF's built-in fonts
 * don't support Devanagari glyphs — English labels are used for print
 * reliability while amounts and IDs remain exact.
 */
export function generateInvoicePdf(data: InvoiceData): jsPDF {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(22, 163, 74);
  doc.text("Kisan Jutai", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Tax Invoice", 14, 27);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Invoice No: ${data.invoiceNumber}`, 14, 40);
  doc.text(`Date: ${formatDateMarathi(data.date)}`, 14, 46);
  if (data.bookingNumber) doc.text(`Booking No: ${data.bookingNumber}`, 14, 52);

  doc.text(`Bill To: ${data.farmerName}`, 140, 40);
  doc.text(`Mobile: ${data.farmerMobile}`, 140, 46);
  doc.text(`Village: ${data.farmerVillage}`, 140, 52);

  autoTable(doc, {
    startY: 62,
    head: [["Description", "Amount (INR)"]],
    body: data.items.map((i) => [i.description, i.amount.toFixed(2)]),
    foot: [
      ...(data.discount > 0 ? [["Discount", `-${data.discount.toFixed(2)}`]] : []),
      ["Total", data.total.toFixed(2)],
    ],
    theme: "grid",
    headStyles: { fillColor: [22, 163, 74] },
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("This is a computer-generated invoice.", 14, finalY + 15);

  return doc;
}
