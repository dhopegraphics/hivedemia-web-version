import * as FileSystem from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';

export async function getPdfPageCount(uri) {
  try {
    // Read the PDF file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Convert base64 to Uint8Array
    const pdfBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    // Load PDF and get page count
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
  } catch (err) {
    console.error('Failed to get PDF page count:', err);
    return "Unknown";
  }
}