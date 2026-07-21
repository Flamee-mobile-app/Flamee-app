import { Modal, StyleSheet, View } from 'react-native';

import { TimelineOverview } from '@/features/timeline/components/TimelineOverview';
import { useCurrentDate } from '@/features/timeline/hooks/useCurrentDate';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';

import { CreateTimelineScreen } from './CreateTimelineScreen';
import { EditTimelineScreen } from './EditTimelineScreen';
import { TimelineFilterScreen } from './TimelineFilterScreen';

export function TimelineScreen() {
  const referenceDate = useCurrentDate();
  const timeline = useTimeline(referenceDate);
  const { state } = timeline;

  const handleCreateBack = () => {
    if (state.createStep === 1) {
      timeline.closeCreate();
      return;
    }

    timeline.previousCreateStep();
  };

  const handleClearAppliedFilter = () => {
    timeline.clearFilter();
    timeline.applyFilter();
  };

  return (
    <View style={styles.container}>
      <TimelineOverview
        timeline={timeline.visibleItems}
        onAdd={timeline.openCreate}
        onClearFilter={handleClearAppliedFilter}
        onOpenFilter={timeline.openFilter}
        onOpenTimeline={timeline.openEdit}
        referenceDate={referenceDate}
        summary={timeline.relationshipSummary}
      />

      <Modal
        animationType="slide"
        onRequestClose={timeline.closeFilter}
        presentationStyle="fullScreen"
        testID="timeline-filter-modal"
        visible={state.view === 'filter'}>
        <TimelineFilterScreen
          filter={state.stagedFilter}
          onApply={timeline.applyFilter}
          onChange={timeline.updateStagedFilter}
          onClear={timeline.clearFilter}
          onClose={timeline.closeFilter}
        />
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={handleCreateBack}
        presentationStyle="fullScreen"
        testID="create-timeline-modal"
        visible={state.view === 'create'}>
        <CreateTimelineScreen
          draft={state.createDraft}
          errors={state.validationErrors}
          onBack={handleCreateBack}
          onChangeDetails={timeline.updateCreateDetails}
          onChangeReminder={timeline.updateCreateReminder}
          onComplete={timeline.completeCreate}
          onNext={timeline.nextCreateStep}
          onSelectType={timeline.selectCreateType}
          reminder={state.createReminder}
          step={state.createStep}
        />
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={timeline.closeEdit}
        presentationStyle="fullScreen"
        testID="edit-timeline-modal"
        visible={state.view === 'edit'}>
        {state.editDraft ? (
          <EditTimelineScreen
            deleteConfirmationVisible={state.deleteConfirmationVisible}
            draft={state.editDraft}
            errors={state.validationErrors}
            onCancelDelete={timeline.cancelDelete}
            onChange={timeline.updateEditDraft}
            onClose={timeline.closeEdit}
            onConfirmDelete={timeline.confirmDelete}
            onRequestDelete={timeline.requestDelete}
            onSave={timeline.saveEdit}
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
