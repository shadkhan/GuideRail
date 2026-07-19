export interface ToastProps {
  tone?: 'success' | 'info';
  children?: React.ReactNode;
}
export function Toast(props: ToastProps): JSX.Element;
