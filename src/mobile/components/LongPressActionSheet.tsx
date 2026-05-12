import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type ActionSheetOption = {
  key: string;
  label: string;
  destructive?: boolean;
};

type LongPressActionSheetProps = {
  visible: boolean;
  options: ActionSheetOption[];
  title?: string;
  onSelect: (key: string) => void;
  onClose: () => void;
};

export function LongPressActionSheet({ visible, options, title, onSelect, onClose }: LongPressActionSheetProps): JSX.Element {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {options.map((option) => (
            <Pressable
              key={option.key}
              style={styles.row}
              accessibilityRole="button"
              onPress={() => {
                onSelect(option.key);
                onClose();
              }}
            >
              <Text style={[styles.label, option.destructive ? styles.destructiveLabel : null]}>{option.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.cancelRow} accessibilityRole="button" onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 2,
  },
  title: {
    fontSize: 13,
    color: 'slategray',
    marginBottom: 8,
  },
  row: {
    paddingVertical: 14,
  },
  label: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveLabel: {
    color: 'firebrick',
  },
  cancelRow: {
    marginTop: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'lightgray',
  },
  cancelLabel: {
    color: 'dimgrey',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});
