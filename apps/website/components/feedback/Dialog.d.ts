export interface DialogProps {
  open: boolean;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
}
export function Dialog(props: DialogProps): JSX.Element | null;
