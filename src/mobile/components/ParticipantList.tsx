import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { createParticipantActionsController } from '../controllers/participantActionsController';
import { LongPressActionSheet, type ActionSheetOption } from './LongPressActionSheet';

type ParticipantListProps = {
  participants: string[];
};

const controller = createParticipantActionsController({
  renameParticipant: async () => undefined,
  removeParticipant: async () => undefined,
});

export function getParticipantLongPressOptions(participantId: string): ActionSheetOption[] {
  return controller.getActions(participantId).map((action) => ({
    key: action,
    label: action === 'edit' ? 'Edit participant' : 'Delete participant',
    destructive: action === 'delete',
  }));
}

export function ParticipantList({ participants }: ParticipantListProps): JSX.Element {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  const options = selectedParticipantId ? getParticipantLongPressOptions(selectedParticipantId) : [];

  async function onSelectAction(action: string): Promise<void> {
    if (!selectedParticipantId) {
      return;
    }

    if (action === 'edit') {
      await controller.runAction('edit', selectedParticipantId, selectedParticipantId);
      Alert.alert('Edit participant', 'Rename wiring is ready; text-entry UI will be added in a follow-up step.');
      return;
    }

    await controller.runAction('delete', selectedParticipantId);
    Alert.alert('Delete participant', 'Delete wiring is ready; list mutation UI will be added in a follow-up step.');
  }

  if (participants.length === 0) {
    return <Text style={styles.empty}>No participants added yet.</Text>;
  }

  return (
    <>
      <View style={styles.list}>
        {participants.map((participant, index) => (
          <Pressable
            key={`${participant}-${index}`}
            onLongPress={() => setSelectedParticipantId(participant)}
            style={styles.item}
            accessibilityRole="button"
          >
            <Text style={styles.itemText}>{participant}</Text>
          </Pressable>
        ))}
      </View>
      <LongPressActionSheet
        visible={selectedParticipantId !== null}
        title={selectedParticipantId ? `Participant: ${selectedParticipantId}` : undefined}
        options={options}
        onSelect={(key) => {
          void onSelectAction(key);
        }}
        onClose={() => setSelectedParticipantId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'lightgray',
    backgroundColor: 'white',
  },
  itemText: {
    color: 'black',
  },
  empty: {
    color: 'dimgray',
    paddingVertical: 8,
  },
});
