export interface LpxColorOption {
  name: string;
  paletteIndex: number;
  colorHex: string;
  colorDimHex: string;
}

export const LPX_PALETTE_PRESETS: LpxColorOption[] = [
  { name: 'Red', paletteIndex: 5, colorHex: '#ff3344', colorDimHex: '#3a1117' },
  { name: 'Amber', paletteIndex: 9, colorHex: '#ff9100', colorDimHex: '#3a2307' },
  { name: 'Orange', paletteIndex: 60, colorHex: '#ff5722', colorDimHex: '#3d1a10' },
  { name: 'Yellow', paletteIndex: 13, colorHex: '#ffd000', colorDimHex: '#383009' },
  { name: 'Lime', paletteIndex: 17, colorHex: '#76ff03', colorDimHex: '#1e3806' },
  { name: 'Green', paletteIndex: 21, colorHex: '#00e676', colorDimHex: '#09361e' },
  { name: 'Mint', paletteIndex: 29, colorHex: '#00bfa5', colorDimHex: '#062e28' },
  { name: 'Cyan', paletteIndex: 37, colorHex: '#00e5ff', colorDimHex: '#073238' },
  { name: 'Sky', paletteIndex: 41, colorHex: '#40c4ff', colorDimHex: '#0e2a36' },
  { name: 'Blue', paletteIndex: 45, colorHex: '#2979ff', colorDimHex: '#0c1f44' },
  { name: 'Purple', paletteIndex: 49, colorHex: '#7c4dff', colorDimHex: '#1f1440' },
  { name: 'Magenta', paletteIndex: 53, colorHex: '#d500f9', colorDimHex: '#350a3d' },
  { name: 'Pink', paletteIndex: 57, colorHex: '#ff4081', colorDimHex: '#3e1020' },
  { name: 'White', paletteIndex: 3, colorHex: '#f5f5f5', colorDimHex: '#2a2a2a' },
];
