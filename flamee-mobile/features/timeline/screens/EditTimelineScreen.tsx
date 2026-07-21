import { useRef } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AccessibilityInfo,
  findNodeHandle,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { useAppSafeArea } from '@/shared/hooks';
import { TimelineDetailsForm } from '@/features/timeline/components/TimelineDetailsForm';
import { getTimelineArtwork } from '@/features/timeline/timelineAssets';
import {
  getTimelineContentWidth,
  TIMELINE_LAYOUT,
} from '@/features/timeline/timelineLayout';
import type { TimelineDraft } from '@/features/timeline/types';

const EDIT_COVER_KEYS = [
  'together',
  'birthday',
  'anniversary',
  'special',
  'holiday',
  'custom',
  'movie',
  'trip',
] as const;

export type EditTimelineScreenProps = {
  draft: TimelineDraft;
  errors: Record<string, string>;
  deleteConfirmationVisible: boolean;
  onChange: (patch: Partial<TimelineDraft>) => void;
  onSave: () => void;
  onClose: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export function EditTimelineScreen({
  draft,
  errors,
  deleteConfirmationVisible,
  onChange,
  onSave,
  onClose,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: EditTimelineScreenProps) {
  const { width } = useWindowDimensions();
  const safeArea = useAppSafeArea();
  const contentWidth = getTimelineContentWidth(width);

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        accessibilityElementsHidden={deleteConfirmationVisible}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        importantForAccessibility={
          deleteConfirmationVisible ? 'no-hide-descendants' : 'auto'
        }
        style={styles.keyboard}
        testID="edit-timeline-content">
        <View style={[styles.header, { width: contentWidth, paddingTop: safeArea.top }]}>
          <Pressable
            accessibilityLabel="Đóng chỉnh sửa"
            accessibilityRole="button"
            hitSlop={6}
            onPress={onClose}
            style={styles.headerSide}>
            <AppText
              color={flameeTheme.colors.brand}
              style={styles.closeGlyph}>
              ‹
            </AppText>
          </Pressable>
          <AppText
            align="center"
            color={flameeTheme.colors.brand}
            style={styles.heading}
            variant="heading">
            Chỉnh sửa kỉ niệm
          </AppText>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: safeArea.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { width: contentWidth }]}>
            <Pressable
              accessibilityLabel="Đổi ảnh đại diện"
              accessibilityRole="button"
              onPress={() =>
                onChange({
                  coverAssetKey: getNextCoverAssetKey(
                    draft.coverAssetKey,
                    draft.type,
                  ),
                })
              }>
              <LinearGradient
                colors={['#ECEBEA', flameeTheme.colors.brandLight]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.cover}>
                <Image
                  contentFit="contain"
                  source={getTimelineArtwork(draft.coverAssetKey, draft.type)}
                  style={styles.coverImage}
                />
                <View style={styles.coverHint}>
                  <AppText
                    color={flameeTheme.colors.brand}
                    variant="caption">
                    Chạm để đổi ảnh
                  </AppText>
                </View>
              </LinearGradient>
            </Pressable>

            <TimelineDetailsForm
              draft={draft}
              errors={errors}
              includeNote
              onChange={onChange}
            />

            <View style={styles.actions}>
              <Button onPress={onSave} title="Sửa" />
              <Pressable
                accessibilityRole="button"
                onPress={onRequestDelete}
                style={styles.deleteButton}>
                <AppText
                  align="center"
                  color={flameeTheme.colors.brand}
                  variant="bodySmall">
                  Xóa cột mốc
                </AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {deleteConfirmationVisible ? (
        <DeleteConfirmation
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      ) : null}
    </View>
  );
}

function getNextCoverAssetKey(
  currentKey: string | undefined,
  fallbackType: TimelineDraft['type'],
) {
  const normalizedKey = EDIT_COVER_KEYS.includes(
    currentKey as (typeof EDIT_COVER_KEYS)[number],
  )
    ? currentKey
    : fallbackType;
  const currentIndex = EDIT_COVER_KEYS.indexOf(
    normalizedKey as (typeof EDIT_COVER_KEYS)[number],
  );

  return EDIT_COVER_KEYS[(currentIndex + 1) % EDIT_COVER_KEYS.length];
}

function DeleteConfirmation({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelButtonRef = useRef<View>(null);

  const focusCancelButton = () => {
    const reactTag = findNodeHandle(cancelButtonRef.current);

    if (reactTag !== null) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      onShow={focusCancelButton}
      transparent
      visible>
      <View
        accessibilityViewIsModal
        importantForAccessibility="yes"
        style={styles.confirmationOverlay}
        testID="delete-confirmation-dialog">
        <Pressable
          accessibilityLabel="Đóng xác nhận xóa"
          accessibilityRole="button"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.confirmationCard}>
          <AppText
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            align="center"
            variant="sectionTitle">
            Xóa cột mốc này?
          </AppText>
          <AppText
            align="center"
            color={flameeTheme.colors.text.secondary}
            variant="bodySmall">
            Thao tác này chỉ xóa dữ liệu mock trong phiên hiện tại.
          </AppText>
          <View style={styles.confirmationActions}>
            <Pressable
              ref={cancelButtonRef}
              accessibilityRole="button"
              onPress={onCancel}
              style={[styles.confirmationAction, styles.cancelDeleteButton]}>
              <AppText
                align="center"
                color={flameeTheme.colors.brand}
                variant="bodySmall">
                Hủy xóa
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[styles.confirmationAction, styles.confirmDeleteButton]}>
              <AppText
                align="center"
                color={flameeTheme.colors.text.inverse}
                variant="bodySmall">
                Xác nhận xóa
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: flameeTheme.spacing[4],
  },
  closeGlyph: {
    fontSize: 34,
    lineHeight: 36,
  },
  cancelDeleteButton: {
    alignItems: 'center',
    borderColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.xl,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: flameeTheme.spacing[3],
  },
  confirmDeleteButton: {
    alignItems: 'center',
    backgroundColor: flameeTheme.colors.accentRed,
    borderRadius: flameeTheme.radii.xl,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: flameeTheme.spacing[3],
  },
  confirmationAction: {
    flex: 1,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: flameeTheme.spacing[3],
  },
  confirmationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: flameeTheme.radii.xxl,
    elevation: 8,
    gap: flameeTheme.spacing[4],
    marginHorizontal: TIMELINE_LAYOUT.horizontalPadding,
    maxWidth: TIMELINE_LAYOUT.maxContentWidth,
    padding: flameeTheme.spacing[6],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    width: '100%',
  },
  confirmationOverlay: {
    alignItems: 'center',
    backgroundColor: flameeTheme.colors.overlay,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: TIMELINE_LAYOUT.horizontalPadding,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  content: {
    gap: flameeTheme.spacing[8],
  },
  cover: {
    alignItems: 'center',
    aspectRatio: 354 / 132,
    borderRadius: flameeTheme.radii.xxl,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    height: 100,
    width: 100,
  },
  coverHint: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: flameeTheme.radii.full,
    bottom: flameeTheme.spacing[3],
    paddingHorizontal: flameeTheme.spacing[3],
    paddingVertical: flameeTheme.spacing[1],
    position: 'absolute',
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.xl,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: TIMELINE_LAYOUT.actionMinHeight,
  },
  header: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    minHeight: 64,
  },
  headerSide: {
    justifyContent: 'center',
    minHeight: TIMELINE_LAYOUT.actionMinHeight,
    width: 44,
  },
  heading: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
  },
  keyboard: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: '#FFFDFB',
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: flameeTheme.spacing[8],
    paddingTop: flameeTheme.spacing[3],
  },
});
