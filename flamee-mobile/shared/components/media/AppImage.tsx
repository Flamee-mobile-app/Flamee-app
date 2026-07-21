import {
  Image,
  type ImageContentFit,
  type ImageProps,
} from 'expo-image';

import { resolvePhotoUri, type ImageVariant, type PhotoAsset } from '@/shared/types';

type AppImageSource = NonNullable<ImageProps['source']> | PhotoAsset;

export type AppImageProps = Omit<
  ImageProps,
  'cachePolicy' | 'contentFit' | 'placeholder' | 'source'
> & {
  source: AppImageSource;
  variant?: ImageVariant;
  contentFit?: ImageContentFit;
};

function isPhotoAsset(source: AppImageSource): source is PhotoAsset {
  return (
    typeof source === 'object' &&
    source !== null &&
    !Array.isArray(source) &&
    'uri' in source &&
    'thumbnailUri' in source
  );
}

/**
 * The only image primitive needed by application UI.
 * Static assets pass through unchanged; remotely hosted user media receives a
 * presentation-specific URL, optional BlurHash, and a durable cache policy.
 */
export function AppImage({
  source,
  variant = 'full',
  contentFit = 'cover',
  ...props
}: AppImageProps) {
  if (isPhotoAsset(source)) {
    return (
      <Image
        {...props}
        cachePolicy="memory-disk"
        contentFit={contentFit}
        placeholder={source.blurhash}
        placeholderContentFit={contentFit}
        source={{
          uri: resolvePhotoUri(source, variant),
          width: source.width,
          height: source.height,
        }}
      />
    );
  }

  return (
    <Image
      {...props}
      cachePolicy="memory-disk"
      contentFit={contentFit}
      source={source}
    />
  );
}
