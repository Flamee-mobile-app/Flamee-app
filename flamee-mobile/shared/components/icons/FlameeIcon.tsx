import { StyleSheet, View } from 'react-native';

import {
  AiIcon,
  HomeActiveIcon,
  HomeIcon,
  HomeInactiveIcon,
  LogoIcon,
  MissionsStarOneIcon,
  MissionsStarTwoIcon,
  MoodIcon,
  ProfileBodyIcon,
  ProfileHeadIcon,
  TimelineIcon,
} from './generated';
import type { FlameeIconName } from './iconNames';

export type FlameeIconProps = {
  name: FlameeIconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
};

export function FlameeIcon({
  name,
  size = 24,
  color = '#FF7158',
  accessibilityLabel,
}: FlameeIconProps) {
  const accessibilityProps = {
    accessible: Boolean(accessibilityLabel),
    accessibilityLabel,
    accessibilityRole: 'image' as const,
  };

  if (name === 'logo') {
    return (
      <LogoIcon
        {...accessibilityProps}
        color={color}
        height={size}
        testID="flamee-icon-logo"
        width={size}
      />
    );
  }

  if (name === 'home') {
    return (
      <HomeIcon
        {...accessibilityProps}
        color={color}
        height={size}
        testID="flamee-icon-home"
        width={size}
      />
    );
  }

  if (name === 'homeActive') {
    return (
      <HomeActiveIcon
        {...accessibilityProps}
        color={color}
        height={size}
        testID="flamee-icon-home-active"
        width={size}
      />
    );
  }

  if (name === 'homeInactive') {
    return (
      <HomeInactiveIcon
        {...accessibilityProps}
        color={color}
        height={size}
        testID="flamee-icon-home-inactive"
        width={size}
      />
    );
  }

  if (name === 'timeline') {
    return (
      <TimelineIcon
        {...accessibilityProps}
        color={color}
        height={size}
        testID="flamee-icon-timeline"
        width={size}
      />
    );
  }

  if (name === 'missions') {
    return (
      <View
        {...accessibilityProps}
        style={[styles.composite, { height: size, width: size }]}
        testID="flamee-icon-missions">
        <MissionsStarOneIcon
          color={color}
          height={size * 0.76}
          style={[styles.missionStarOne, { left: size * 0.1, top: size * 0.15 }]}
          width={size * 0.76}
        />
        <MissionsStarTwoIcon
          color={color}
          height={size * 0.3}
          style={[styles.missionStarTwo, { left: size * 0.59, top: size * 0.12 }]}
          width={size * 0.3}
        />
      </View>
    );
  }

  if (name === 'mood') {
    return (
      <MoodIcon
        {...accessibilityProps}
        color={color}
        height={size}
        testID="flamee-icon-mood"
        width={size}
      />
    );
  }

  if (name === 'ai') {
    return (
      <AiIcon
        {...accessibilityProps}
        color={color}
        height={size}
        testID="flamee-icon-ai"
        width={size}
      />
    );
  }

  return (
    <View
      {...accessibilityProps}
      style={[styles.composite, { height: size, width: size }]}
      testID="flamee-icon-profile">
      <ProfileHeadIcon
        color={color}
        height={size * 0.4}
        style={[styles.profileHead, { left: size * 0.3, top: size * 0.1 }]}
        width={size * 0.4}
      />
      <ProfileBodyIcon
        color={color}
        height={size * 0.27}
        style={[styles.profileBody, { left: size * 0.18, top: size * 0.58 }]}
        width={size * 0.64}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  composite: { position: 'relative' },
  missionStarOne: { position: 'absolute' },
  missionStarTwo: { position: 'absolute' },
  profileBody: { position: 'absolute' },
  profileHead: { position: 'absolute' },
});
