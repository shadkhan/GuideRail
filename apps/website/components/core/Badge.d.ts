export interface BadgeProps {
  tone?: 'neutral' | 'success' | 'accent';
  children?: React.ReactNode;
}
export function Badge(props: BadgeProps): JSX.Element;
