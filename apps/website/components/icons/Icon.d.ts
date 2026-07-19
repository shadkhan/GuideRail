export interface IconProps {
  /** Glyph name — subset of the Lucide icon set (MIT), copied as inline path data since no icon CDN/codebase was provided. */
  name?: 'check' | 'x' | 'chevron-down' | 'chevron-right' | 'info' | 'alert-triangle' | 'shield' | 'book-open' | 'clock' | 'lock';
  size?: number;
  color?: string;
  strokeWidth?: number;
}
export function Icon(props: IconProps): JSX.Element;
