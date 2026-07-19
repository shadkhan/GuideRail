export interface TagProps {
  active?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}
export function Tag(props: TagProps): JSX.Element;
