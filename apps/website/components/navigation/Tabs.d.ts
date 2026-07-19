export interface TabItem { value: string; label: string; }
export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange?: (value: string) => void;
}
export function Tabs(props: TabsProps): JSX.Element;
