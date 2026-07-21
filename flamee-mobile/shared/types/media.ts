export type ImageVariant = 'thumbnail' | 'full';

/** A remotely hosted user photo, with a smaller representation for list surfaces. */
export type PhotoAsset = {
  uri: string;
  thumbnailUri: string;
  width: number;
  height: number;
  blurhash?: string;
};

export function resolvePhotoUri(photo: PhotoAsset, variant: ImageVariant): string {
  return variant === 'thumbnail' ? photo.thumbnailUri : photo.uri;
}
