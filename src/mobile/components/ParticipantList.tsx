import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { createParticipantActionsController } from '../controllers/participantActionsController';
import { useTheme } from '../theme/useTheme';
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
   const { colors } = useTheme();
   const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

   const dynamicStyles = useMemo(
     () => StyleSheet.create({
       list: {
         gap: 8,
       },
       item: {
         paddingHorizontal: 12,
         paddingVertical: 10,
         borderRadius: 8,
         borderWidth: 1,
         borderColor: colors.border,
         backgroundColor: colors.card,
       },
       itemText: {
         color: colors.textPrimary,
       },
       empty: {
         color: colors.textMuted,
         paddingVertical: 8,
       },
     }),
     [colors],
   );

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
     return <Text style={dynamicStyles.empty}>No participants added yet.</Text>;
   }

   return (
     <>
       <View style={dynamicStyles.list}>
         {participants.map((participant, index) => (
           <Pressable
             key={`${participant}-${index}`}
             onLongPress={() => setSelectedParticipantId(participant)}
             style={dynamicStyles.item}
             accessibilityRole="button"
           >
             <Text style={dynamicStyles.itemText}>{participant}</Text>
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
 
 const styles = StyleSheet.create({});
