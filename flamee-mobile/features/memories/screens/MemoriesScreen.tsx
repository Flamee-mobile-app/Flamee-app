import { useRef } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { MemoriesOverview } from '@/features/memories/components/MemoriesOverview';
import { useMemories } from '@/features/memories/hooks/useMemories';

import { CreateMemoryScreen } from './CreateMemoryScreen';
import { EditMemoryScreen } from './EditMemoryScreen';
import { MemoryFilterScreen } from './MemoryFilterScreen';

export function MemoriesScreen() {
  const referenceDate = useRef(new Date()).current;
  const memories = useMemories(referenceDate);
  const { state } = memories;

  const handleCreateBack = () => {
    if (state.createStep === 1) {
      memories.closeCreate();
      return;
    }

    memories.previousCreateStep();
  };

  const handleClearAppliedFilter = () => {
    memories.clearFilter();
    memories.applyFilter();
  };

  return (
    <View style={styles.container}>
      <MemoriesOverview
        memories={memories.visibleItems}
        onAdd={memories.openCreate}
        onClearFilter={handleClearAppliedFilter}
        onOpenFilter={memories.openFilter}
        onOpenMemory={memories.openEdit}
        referenceDate={referenceDate}
        summary={memories.relationshipSummary}
      />

      <Modal
        animationType="slide"
        onRequestClose={memories.closeFilter}
        presentationStyle="fullScreen"
        testID="memory-filter-modal"
        visible={state.view === 'filter'}>
        <MemoryFilterScreen
          filter={state.stagedFilter}
          onApply={memories.applyFilter}
          onChange={memories.updateStagedFilter}
          onClear={memories.clearFilter}
          onClose={memories.closeFilter}
        />
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={handleCreateBack}
        presentationStyle="fullScreen"
        testID="create-memory-modal"
        visible={state.view === 'create'}>
        <CreateMemoryScreen
          draft={state.createDraft}
          errors={state.validationErrors}
          onBack={handleCreateBack}
          onChangeDetails={memories.updateCreateDetails}
          onChangeReminder={memories.updateCreateReminder}
          onComplete={memories.completeCreate}
          onNext={memories.nextCreateStep}
          onSelectType={memories.selectCreateType}
          reminder={state.createReminder}
          step={state.createStep}
        />
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={memories.closeEdit}
        presentationStyle="fullScreen"
        testID="edit-memory-modal"
        visible={state.view === 'edit'}>
        {state.editDraft ? (
          <EditMemoryScreen
            deleteConfirmationVisible={state.deleteConfirmationVisible}
            draft={state.editDraft}
            errors={state.validationErrors}
            onCancelDelete={memories.cancelDelete}
            onChange={memories.updateEditDraft}
            onClose={memories.closeEdit}
            onConfirmDelete={memories.confirmDelete}
            onRequestDelete={memories.requestDelete}
            onSave={memories.saveEdit}
          />
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
