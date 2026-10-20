// Buang markdown (bold/italic/code/heading) dari balasan AI biar tampil teks polos.
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold**
    .replace(/\*(.+?)\*/g, "$1")        // *italic*
    .replace(/`([^`]+)`/g, "$1")        // `code`
    .replace(/^#{1,6}\s*/gm, "")        // # heading
    .replace(/^\s*[-*+]\s+/gm, "• ")    // - bullet
    .trim();
}

// Buang emoji dari teks AI (rekap, motivasi, dll).
export function stripEmoji(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
