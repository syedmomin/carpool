import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from './theme';

// ─── Custom inline arrow: thin line + solid triangle tip ─────────────────────
const RouteArrow: React.FC<{ color?: string; lineWidth?: number }> = ({
  color = COLORS.gray,
  lineWidth = 22,
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{ width: lineWidth, height: 1.5, backgroundColor: color, opacity: 0.55 }} />
    <View style={{
      width: 0,
      height: 0,
      borderTopWidth: 4,
      borderBottomWidth: 4,
      borderLeftWidth: 6,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: color,
    }} />
  </View>
);

interface RouteTagProps {
  from: string;
  to: string;
  textStyle?: StyleProp<TextStyle>;
  arrowColor?: string;
  arrowLineWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export const RouteTag: React.FC<RouteTagProps> = ({
  from, to, textStyle, arrowColor = COLORS.gray, arrowLineWidth = 22, style,
}) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}>
    <Text style={textStyle} numberOfLines={1}>{from}</Text>
    <RouteArrow color={arrowColor} lineWidth={arrowLineWidth} />
    <Text style={textStyle} numberOfLines={1}>{to}</Text>
  </View>
);
