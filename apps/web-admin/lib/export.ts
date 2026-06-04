import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Common configuration for columns to export.
 */
export type ExportColumn = {
  header: string;
  key: string;
};

/**
 * Extracts values from an object using a dot-notation key or custom accessor.
 */
function getColumnValue(obj: any, key: string): string {
  if (!obj) return "";
  const value = key.split('.').reduce((o, i) => (o ? o[i] : null), obj);
  
  if (value === null || value === undefined) return "";
  
  // Format arrays (like playerTypes or divisions)
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  
  // Format dates
  if (value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return String(value);
    }
  }
  
  return String(value);
}

/**
 * Formats data into a flat array of objects based on columns.
 */
function formatData(data: any[], columns: ExportColumn[]) {
  return data.map(item => {
    const formattedItem: Record<string, string> = {};
    for (const col of columns) {
      formattedItem[col.header] = getColumnValue(item, col.key);
    }
    return formattedItem;
  });
}

/**
 * Exports data to a CSV file.
 *
 * @param data Array of objects to export
 * @param columns Definition of columns (headers and keys)
 * @param filename Name of the file to download (should end with .csv)
 */
export function exportToCsv(data: any[], columns: ExportColumn[], filename: string) {
  const formattedData = formatData(data, columns);
  const csv = Papa.unparse(formattedData);
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports data to a PDF file.
 *
 * @param data Array of objects to export
 * @param columns Definition of columns (headers and keys)
 * @param filename Name of the file to download (should end with .pdf)
 * @param title Optional title to print at the top of the PDF
 */
export function exportToPdf(data: any[], columns: ExportColumn[], filename: string, title: string = "Export") {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  const head = [columns.map(col => col.header)];
  const body = data.map(item => columns.map(col => getColumnValue(item, col.key)));
  
  autoTable(doc, {
    head,
    body,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
  });
  
  doc.save(filename);
}
