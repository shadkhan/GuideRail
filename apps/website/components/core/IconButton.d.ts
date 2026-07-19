export interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  onClick?: () => void;
}
export function IconButton(props: IconButtonProps): JSX.Element;
