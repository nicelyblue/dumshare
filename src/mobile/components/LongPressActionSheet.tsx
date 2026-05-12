export type ActionSheetOption = {
  key: string;
  label: string;
  destructive?: boolean;
};

type LongPressActionSheetProps = {
  visible: boolean;
  options: ActionSheetOption[];
};

export function LongPressActionSheet({ visible, options }: LongPressActionSheetProps): null {
  visible;
  options.length;
  return null;
}
