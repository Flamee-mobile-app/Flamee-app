import { Image } from 'expo-image';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import { flameeTheme } from '@/constants/flameeTheme';
import { MemoryActionBar } from '@/features/memories/components/MemoryActionBar';
import { MemoryChip } from '@/features/memories/components/MemoryChip';
import { MemoryDetailsForm } from '@/features/memories/components/MemoryDetailsForm';
import { MemoryStepIndicator } from '@/features/memories/components/MemoryStepIndicator';
import { MemoryTypeCard } from '@/features/memories/components/MemoryTypeCard';
import {
  getMemoryArtwork,
  MEMORY_TYPE_OPTIONS,
  REMINDER_LEAD_LABELS,
  REMINDER_RECIPIENT_LABELS,
} from '@/features/memories/constants';
import {
  getMemoryContentWidth,
  getMemoryGridItemWidth,
  MEMORY_LAYOUT,
} from '@/features/memories/memoryLayout';
import type {
  MemoryReminderValues,
} from '@/features/memories/schemas/memorySchema';
import type {
  CreateMemoryStep,
  MemoryDraft,
  MemoryType,
  ReminderLeadDays,
  ReminderRecipient,
} from '@/features/memories/types';

const LEAD_DAY_OPTIONS: readonly ReminderLeadDays[] = [1, 3, 7];
const RECIPIENT_OPTIONS: readonly ReminderRecipient[] = ['couple', 'self'];
const DEFAULT_ENABLED_REMINDER: MemoryReminderValues = {
  enabled: true,
  leadDays: 3,
  time: '09:00',
  recipient: 'couple',
};

export type CreateMemoryScreenProps = {
  step: CreateMemoryStep;
  draft: Partial<MemoryDraft>;
  reminder: MemoryReminderValues;
  errors: Record<string, string>;
  onSelectType: (type: MemoryType) => void;
  onChangeDetails: (patch: Partial<MemoryDraft>) => void;
  onChangeReminder: (reminder: MemoryReminderValues) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
};

export function CreateMemoryScreen({
  step,
  draft,
  reminder,
  errors,
  onSelectType,
  onChangeDetails,
  onChangeReminder,
  onNext,
  onBack,
  onComplete,
}: CreateMemoryScreenProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = getMemoryContentWidth(width);
  const typeCardWidth = getMemoryGridItemWidth(contentWidth);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}>
        <View style={[styles.header, { width: contentWidth }]}>
          <AppText
            align="center"
            color={flameeTheme.colors.brand}
            style={styles.heading}
            variant="heading">
            Thêm cột mốc
          </AppText>
          <MemoryStepIndicator currentStep={step} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { width: contentWidth }]}>
            {step === 1 ? (
              <TypeStep
                cardWidth={typeCardWidth}
                draft={draft}
                error={errors.type}
                onSelectType={onSelectType}
              />
            ) : null}
            {step === 2 ? (
              <DetailsStep
                draft={draft}
                errors={errors}
                onChange={onChangeDetails}
              />
            ) : null}
            {step === 3 ? (
              <ReminderStep
                errors={errors}
                onChange={onChangeReminder}
                reminder={reminder}
              />
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(
                insets.bottom + flameeTheme.spacing[3],
                flameeTheme.spacing[4],
              ),
              width: contentWidth,
            },
          ]}>
          <MemoryActionBar
            backLabel={step === 1 ? 'Hủy' : 'Quay lại'}
            onBack={onBack}
            onPrimary={step === 3 ? onComplete : onNext}
            primaryLabel={step === 3 ? 'Hoàn tất' : 'Tiếp tục'}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TypeStep({
  draft,
  cardWidth,
  error,
  onSelectType,
}: {
  draft: Partial<MemoryDraft>;
  cardWidth: number;
  error?: string;
  onSelectType: (type: MemoryType) => void;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.intro}>
        <AppText style={styles.stepTitle} variant="subtitle">
          Chọn loại cột mốc
        </AppText>
        <AppText color={flameeTheme.colors.text.secondary} variant="caption">
          Hãy chọn loại cột mốc bạn muốn tạo
        </AppText>
      </View>
      <View style={styles.typeGrid}>
        {MEMORY_TYPE_OPTIONS.map((option) => (
          <MemoryTypeCard
            key={option.value}
            asset={option.asset}
            description={option.description}
            label={option.label}
            onPress={() => onSelectType(option.value)}
            selected={draft.type === option.value}
            width={cardWidth}
          />
        ))}
      </View>
      {error ? (
        <AppText
          align="center"
          color={flameeTheme.colors.accentRed}
          variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function DetailsStep({
  draft,
  errors,
  onChange,
}: {
  draft: Partial<MemoryDraft>;
  errors: Record<string, string>;
  onChange: (patch: Partial<MemoryDraft>) => void;
}) {
  const mockAssetKey = draft.type ?? 'together';

  return (
    <View style={styles.step}>
      <MemoryDetailsForm
        draft={draft}
        errors={errors}
        onChange={onChange}
      />
      <View style={styles.photoField}>
        <AppText variant="bodySmall">Ảnh đại diện</AppText>
        <Pressable
          accessibilityLabel={
            draft.coverAssetKey ? 'Đổi ảnh đại diện' : 'Thêm ảnh đại diện'
          }
          accessibilityRole="button"
          onPress={() => onChange({ coverAssetKey: mockAssetKey })}
          style={styles.photoSelector}>
          {draft.coverAssetKey ? (
            <>
              <Image
                contentFit="contain"
                source={getMemoryArtwork(draft.coverAssetKey, mockAssetKey)}
                style={styles.photoPreview}
              />
              <AppText color={flameeTheme.colors.brand} variant="bodySmall">
                Đổi ảnh
              </AppText>
            </>
          ) : (
            <>
              <View style={styles.cameraGlyph}>
                <View style={styles.cameraLens} />
              </View>
              <AppText color={flameeTheme.colors.brand} variant="bodySmall">
                Thêm ảnh
              </AppText>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function ReminderStep({
  reminder,
  errors,
  onChange,
}: {
  reminder: MemoryReminderValues;
  errors: Record<string, string>;
  onChange: (reminder: MemoryReminderValues) => void;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.reminderHeader}>
        <View style={styles.reminderCopy}>
          <AppText style={styles.stepTitle} variant="subtitle">
            Nhắc nhở
          </AppText>
          <AppText
            color={flameeTheme.colors.text.secondary}
            variant="caption">
            Flamee sẽ nhắc hai bạn trước cột mốc.
          </AppText>
        </View>
        <Switch
          accessibilityLabel="Bật nhắc nhở"
          onValueChange={(enabled) =>
            onChange(enabled ? DEFAULT_ENABLED_REMINDER : { enabled: false })
          }
          thumbColor="#FFFFFF"
          trackColor={{
            false: flameeTheme.colors.softCream,
            true: flameeTheme.colors.brand,
          }}
          value={reminder.enabled}
        />
      </View>

      {reminder.enabled ? (
        <>
          <ReminderGroup label="Nhắc trước">
            <View style={styles.chips}>
              {LEAD_DAY_OPTIONS.map((leadDays) => (
                <MemoryChip
                  key={leadDays}
                  label={REMINDER_LEAD_LABELS[leadDays]}
                  onPress={() => onChange({ ...reminder, leadDays })}
                  selected={reminder.leadDays === leadDays}
                />
              ))}
            </View>
          </ReminderGroup>
          <TextField
            accessibilityLabel="Thời gian nhắc"
            autoCapitalize="none"
            error={errors.time}
            label="Thời gian nhắc"
            onChangeText={(time) => onChange({ ...reminder, time })}
            placeholder="HH:mm"
            style={styles.timeInput}
            value={reminder.time}
          />
          <ReminderGroup label="Gửi nhắc nhở cho">
            <View style={styles.chips}>
              {RECIPIENT_OPTIONS.map((recipient) => (
                <MemoryChip
                  key={recipient}
                  label={REMINDER_RECIPIENT_LABELS[recipient]}
                  onPress={() => onChange({ ...reminder, recipient })}
                  selected={reminder.recipient === recipient}
                />
              ))}
            </View>
          </ReminderGroup>
        </>
      ) : (
        <View style={styles.reminderDisabled}>
          <AppText
            align="center"
            color={flameeTheme.colors.text.secondary}
            variant="bodySmall">
            Bạn có thể hoàn tất ngay và bật nhắc nhở sau.
          </AppText>
        </View>
      )}
    </View>
  );
}

function ReminderGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.reminderGroup}>
      <AppText variant="bodySmall">{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cameraGlyph: {
    alignItems: 'center',
    borderColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.sm,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 28,
  },
  cameraLens: {
    borderColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.full,
    borderWidth: 2,
    height: 10,
    width: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: flameeTheme.spacing[2],
  },
  content: {
    flexGrow: 1,
  },
  footer: {
    alignSelf: 'center',
    paddingTop: flameeTheme.spacing[3],
  },
  header: {
    alignSelf: 'center',
    gap: flameeTheme.spacing[5],
    paddingBottom: flameeTheme.spacing[4],
    paddingTop: flameeTheme.spacing[2],
  },
  heading: {
    fontSize: 30,
    lineHeight: 36,
  },
  intro: {
    gap: flameeTheme.spacing[1],
  },
  keyboard: {
    flex: 1,
  },
  photoField: {
    gap: flameeTheme.spacing[2],
  },
  photoPreview: {
    height: 64,
    width: 64,
  },
  photoSelector: {
    alignItems: 'center',
    backgroundColor: '#FFF9F4',
    borderColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: flameeTheme.spacing[2],
    justifyContent: 'center',
    minHeight: 132,
  },
  reminderCopy: {
    flex: 1,
    gap: flameeTheme.spacing[1],
  },
  reminderDisabled: {
    backgroundColor: flameeTheme.colors.brandLight,
    borderRadius: flameeTheme.radii.lg,
    padding: flameeTheme.spacing[6],
  },
  reminderGroup: {
    gap: flameeTheme.spacing[2],
  },
  reminderHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: flameeTheme.spacing[4],
  },
  safeArea: {
    backgroundColor: '#FFFDFB',
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: flameeTheme.spacing[6],
  },
  step: {
    gap: flameeTheme.spacing[6],
  },
  stepTitle: {
    fontWeight: '700',
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    minHeight: MEMORY_LAYOUT.inputMinHeight,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MEMORY_LAYOUT.gridGap,
  },
});
