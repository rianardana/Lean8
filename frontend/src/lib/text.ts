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
