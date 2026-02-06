export function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance (sRGB)
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? "#000" : "#fff";
}
