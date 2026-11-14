import * as Audio from "expo-audio";
import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { createLocalMediaAdapter as createAdapter, getPhotoTransforms, type LocalMediaNative } from "./localMediaPreparation";
export * from "./localMediaPreparation";

function createExpoMediaNative(): LocalMediaNative {
  return {
    async isAvailable() {
      return true;
    },
    async requestPhotoPermission(source) {
      const permission = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      return permission.granted;
    },
    async selectPhoto(source) {
      const selection = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1 });
      const asset = selection.assets?.[0];
      if (selection.canceled || !asset) return { kind: "cancelled" };
      return { uri: asset.uri, width: asset.width, height: asset.height };
    },
    async compressPhoto(uri, maxEdge, quality, width, height, purpose) {
      const actions = getPhotoTransforms(width, height, maxEdge, purpose);
      const compressed = await ImageManipulator.manipulateAsync(uri, actions, { compress: quality, format: ImageManipulator.SaveFormat.JPEG });
      return { uri: compressed.uri, width: compressed.width, height: compressed.height };
    },
    async getFileSize(uri) {
      const file = new File(uri);
      return file.size ?? Number.POSITIVE_INFINITY;
    },
    async requestVoicePermission() {
      const permission = await Audio.requestRecordingPermissionsAsync();
      return permission.granted;
    },
    async deleteFile(uri) {
      const file = new File(uri);
      if (file.exists) file.delete();
    },
  };
}

export function createLocalMediaAdapter({ native = createExpoMediaNative() }: { native?: LocalMediaNative } = {}) {
  return createAdapter({ native });
}

export const localMediaAdapter = createLocalMediaAdapter();
