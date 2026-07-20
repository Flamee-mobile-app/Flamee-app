import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { flameeTheme } from '@/constants/flameeTheme';
import { MemoryDetailsForm } from '@/features/memories/components/MemoryDetailsForm';
import { getMemoryArtwork } from '@/features/memories/constants';
import {
  getMemoryContentWidth,
  MEMORY_LAYOUT,
} from '@/features/memories/memoryLayout';
import type { MemoryDraft } from '@/features/memories/types';

export type EditMemoryScreenProps = {
  draft: MemoryDraft;
  errors: Record<string, string>;
  deleteConfirmationVisible: boolean;
  onChange: (patch: Partial<MemoryDraft>) => void;
  onSave: () => void;
  onClose: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export function EditMemoryScreen({
  draft,
  errors,
  deleteConfirmationVisible,
  onChange,
  onSave,
  onClose,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: EditMemoryScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = getMemoryContentWidth(width);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}>
        <View style={[styles.header, { width: contentWidth }]}>
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
            Chỉnh sửa cột mốc
          </AppText>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { width: contentWidth }]}>
            <LinearGradient
              colors={['#ECEBEA', flameeTheme.colors.brandLight]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.cover}>
              <Image
                contentFit="contain"
                source={getMemoryArtwork(draft.coverAssetKey, draft.type)}
                style={styles.coverImage}
              />
            </LinearGradient>

            <MemoryDetailsForm
              draft={draft}
              errors={errors}
              includeNote
              onChange={onChange}
            />

            <View style={styles.actions}>
              <Button onPress={onSave} title="Lưu thay đổi" />
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
    </SafeAreaView>
  );
}

function DeleteConfirmation({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View
      accessibilityLabel="Xác nhận xóa cột mốc"
      accessibilityRole="alert"
      style={styles.confirmationOverlay}>
      <Pressable
        accessibilityLabel="Đóng xác nhận xóa"
        accessibilityRole="button"
        onPress={onCancel}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.confirmationCard}>
        <AppText align="center" variant="sectionTitle">
          Xóa cột mốc này?
        </AppText>
        <AppText
          align="center"
          color={flameeTheme.colors.text.secondary}
          variant="bodySmall">
          Thao tác này chỉ xóa dữ liệu mock trong phiên hiện tại.
        </AppText>
        <View style={styles.confirmationActions}>
          <View style={styles.confirmationAction}>
            <Button onPress={onCancel} title="Hủy xóa" variant="secondary" />
          </View>
          <View style={styles.confirmationAction}>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={styles.confirmDeleteButton}>
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
    </View>
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
    marginHorizontal: MEMORY_LAYOUT.horizontalPadding,
    maxWidth: MEMORY_LAYOUT.maxContentWidth,
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
    paddingHorizontal: MEMORY_LAYOUT.horizontalPadding,
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
  deleteButton: {
    alignItems: 'center',
    borderColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.xl,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: MEMORY_LAYOUT.actionMinHeight,
  },
  header: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    minHeight: 64,
  },
  headerSide: {
    justifyContent: 'center',
    minHeight: MEMORY_LAYOUT.actionMinHeight,
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
