export interface CardProps {
  shadow?: 'hard' | 'accent' | 'none';
  children?: React.ReactNode;
}
export function Card(props: CardProps): JSX.Element;
