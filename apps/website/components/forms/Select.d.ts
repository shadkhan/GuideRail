export interface SelectOption { value: string; label: string; }
export interface SelectProps {
  label?: string;
  options: (SelectOption | string)[];
  value?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}
export function Select(props: SelectProps): JSX.Element;
