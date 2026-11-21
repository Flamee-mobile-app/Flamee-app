import { Image } from "react-native";

/** Uses the same native disk/network cache as the displayed Image component. */
export const prefetchRemoteImage = (uri: string) => Image.prefetch(uri);
