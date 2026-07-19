export interface InputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export function Input(props: InputProps): JSX.Element;
