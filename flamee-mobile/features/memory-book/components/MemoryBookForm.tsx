import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { getMemoryBookCover } from '@/features/memory-book/memoryBookAssets';
import type { MemoryBookDraft } from '@/features/memory-book/types';
import { AppImage } from '@/shared/components/media';
import { AppText } from '@/shared/components/ui/AppText';

const AVAILABLE_TAGS = [
  { name: 'Kỉ niệm', bg: '#FEEFEA', text: '#FF7E67' },
  { name: 'Yêu thương', bg: '#ECE6F8', text: '#7C5CFC' },
  { name: 'Hạnh phúc', bg: '#FFF6E5', text: '#F5A623' },
];

export function MemoryBookForm({
  draft,
  errors,
  submitLabel,
  isEditMode = false,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: Partial<MemoryBookDraft>;
  errors: Record<string, string>;
  submitLabel: string;
  isEditMode?: boolean;
  onChange: (patch: Partial<MemoryBookDraft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const currentTags = draft.tags || ['Kỉ niệm'];
  const currentPhotos = draft.photos || ['hero', 'together', 'trip'];
  const noteLength = (draft.note || '').length;

  const toggleTag = (tagName: string) => {
    const updated = currentTags.includes(tagName)
      ? currentTags.filter((t) => t !== tagName)
      : [...currentTags, tagName];
    onChange({ tags: updated });
  };

  const removePhoto = (index: number) => {
    const updated = [...currentPhotos];
    updated.splice(index, 1);
    onChange({ photos: updated });
  };

  const addSamplePhoto = () => {
    const pool = ['special', 'anniversary', 'holiday', 'movie', 'birthday'];
    const nextPhoto = pool[currentPhotos.length % pool.length];
    onChange({ photos: [...currentPhotos, nextPhoto] });
  };

  return (
    <View style={styles.container}>
      {/* Upload Zone or Photo Thumbnails Grid */}
      {!isEditMode && currentPhotos.length === 0 ? (
        <Pressable onPress={addSamplePhoto} style={styles.uploadDropzone}>
          <Ionicons color="#FF7E67" name="camera-outline" size={36} />
          <AppText style={styles.uploadTitle}>Thêm ảnh/ Video</AppText>
          <AppText style={styles.uploadSubtext}>
            Tối đa 10 ảnh hoặc 1 video
          </AppText>
        </Pressable>
      ) : (
        <ScrollView
          horizontal
          contentContainerStyle={styles.photosRow}
          showsHorizontalScrollIndicator={false}>
          {currentPhotos.map((photoKey, index) => (
            <View key={index} style={styles.photoThumbWrapper}>
              <AppImage
                contentFit="cover"
                source={getMemoryBookCover(photoKey)}
                style={styles.photoThumb}
              />
              <Pressable
                accessibilityLabel="Xóa ảnh"
                hitSlop={6}
                onPress={() => removePhoto(index)}
                style={styles.removeBadge}>
                <Ionicons color="#FFFFFF" name="close-circle" size={22} />
              </Pressable>
            </View>
          ))}
          <Pressable onPress={addSamplePhoto} style={styles.addPhotoCard}>
            <Ionicons color="#6E6E6E" name="add-circle-outline" size={24} />
            <AppText style={styles.addPhotoText}>Thêm ảnh</AppText>
          </Pressable>
        </ScrollView>
      )}

      {/* Form Fields */}

      {/* Field: Tên kỷ niệm */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <AppText style={styles.fieldLabel}>Tên kỷ niệm</AppText>
          <AppText style={styles.asterisk}>*</AppText>
        </View>
        <TextInput
          placeholder="Nhập tiêu đề"
          placeholderTextColor="#B0B0B0"
          style={[styles.input, errors.title ? styles.inputError : null]}
          value={draft.title || ''}
          onChangeText={(title) => onChange({ title })}
        />
        {errors.title ? (
          <AppText style={styles.errorText}>{errors.title}</AppText>
        ) : null}
      </View>

      {/* Field: Ngày diễn ra */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <AppText style={styles.fieldLabel}>Ngày diễn ra</AppText>
          <AppText style={styles.asterisk}>*</AppText>
        </View>
        <View
          style={[styles.inputRow, errors.occurredOn ? styles.inputError : null]}>
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#B0B0B0"
            style={styles.inputFlex}
            value={draft.occurredOn || ''}
            onChangeText={(occurredOn) => onChange({ occurredOn })}
          />
          <Ionicons color="#FF7E67" name="calendar-outline" size={20} />
        </View>
        {errors.occurredOn ? (
          <AppText style={styles.errorText}>{errors.occurredOn}</AppText>
        ) : null}
      </View>

      {/* Field: Địa điểm */}
      <View style={styles.fieldGroup}>
        <AppText style={styles.fieldLabel}>Địa điểm</AppText>
        <TextInput
          placeholder="Nhập địa điểm"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
          value={draft.location || ''}
          onChangeText={(location) => onChange({ location })}
        />
      </View>

      {/* Field: Mô tả kỷ niệm */}
      <View style={styles.fieldGroup}>
        <AppText style={styles.fieldLabel}>Mô tả kỷ niệm</AppText>
        <View style={styles.textAreaContainer}>
          <TextInput
            maxLength={200}
            multiline
            numberOfLines={4}
            placeholder="Viết gì đó về kỷ niệm này"
            placeholderTextColor="#B0B0B0"
            style={styles.textAreaInput}
            value={draft.note || ''}
            onChangeText={(note) => onChange({ note })}
          />
          <AppText style={styles.charCount}>{noteLength}/200</AppText>
        </View>
      </View>

      {/* Field: Tag cảm xúc */}
      <View style={styles.fieldGroup}>
        <AppText style={styles.fieldLabel}>Tag cảm xúc</AppText>
        <View style={styles.tagsContainer}>
          {AVAILABLE_TAGS.map((tag) => {
            const isSelected = currentTags.includes(tag.name);
            return (
              <Pressable
                key={tag.name}
                onPress={() => toggleTag(tag.name)}
                style={[
                  styles.tagPill,
                  { backgroundColor: tag.bg },
                  isSelected && styles.tagPillSelected,
                ]}>
                <AppText style={[styles.tagText, { color: tag.text }]}>
                  {tag.name}
                </AppText>
              </Pressable>
            );
          })}
          <Pressable onPress={addSamplePhoto} style={styles.addTagPill}>
            <Ionicons color="#666666" name="add" size={18} />
          </Pressable>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsGroup}>
        <Pressable onPress={onSubmit} style={styles.submitBtn}>
          <AppText style={styles.submitBtnText}>{submitLabel}</AppText>
        </Pressable>
        {onCancel ? (
          <Pressable onPress={onCancel} style={styles.cancelBtn}>
            <AppText style={styles.cancelBtnText}>Hủy</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  uploadDropzone: {
    alignItems: 'center',
    backgroundColor: '#FFF9F6',
    borderColor: '#FFB8AA',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 28,
  },
  uploadTitle: {
    color: '#FF7E67',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadSubtext: {
    color: '#8A8A8A',
    fontSize: 13,
  },
  photosRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  photoThumbWrapper: {
    borderRadius: 16,
    height: 76,
    position: 'relative',
    width: 76,
  },
  photoThumb: {
    borderRadius: 16,
    height: '100%',
    width: '100%',
  },
  removeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    position: 'absolute',
    right: 2,
    top: 2,
  },
  addPhotoCard: {
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    borderRadius: 16,
    gap: 4,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  addPhotoText: {
    color: '#6E6E6E',
    fontSize: 11,
    fontWeight: '500',
  },
  fieldGroup: {
    gap: 8,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  fieldLabel: {
    color: '#2B2B2B',
    fontSize: 15,
    fontWeight: '600',
  },
  asterisk: {
    color: '#E65C5C',
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFDFB',
    borderColor: '#FFD4CB',
    borderRadius: 20,
    borderWidth: 1.5,
    color: '#2B2B2B',
    fontSize: 15,
    height: 48,
    paddingHorizontal: 16,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: '#FFFDFB',
    borderColor: '#FFD4CB',
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 16,
  },
  inputFlex: {
    color: '#2B2B2B',
    flex: 1,
    fontSize: 15,
  },
  inputError: {
    borderColor: '#E65C5C',
  },
  errorText: {
    color: '#E65C5C',
    fontSize: 12,
    marginTop: 2,
  },
  textAreaContainer: {
    backgroundColor: '#FFFDFB',
    borderColor: '#FFD4CB',
    borderRadius: 20,
    borderWidth: 1.5,
    minHeight: 110,
    padding: 14,
    position: 'relative',
  },
  textAreaInput: {
    color: '#2B2B2B',
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  tagPill: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagPillSelected: {
    borderWidth: 1.5,
    borderColor: '#FF7E67',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addTagPill: {
    alignItems: 'center',
    borderColor: '#D0D0D0',
    borderRadius: 20,
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionsGroup: {
    gap: 10,
    marginTop: 10,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: '#FF7E67',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    shadowColor: '#FF7E67',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#7D7D7D',
    fontSize: 15,
    fontWeight: '600',
  },
});

