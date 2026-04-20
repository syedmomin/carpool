import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) => {
  const [layoutWidth, setLayoutWidth] = React.useState(0);
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-layoutWidth || 200, layoutWidth || 200],
  });

  return (
    <View 
      onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
      style={[{ width, height, borderRadius, backgroundColor: '#f1f5f9', overflow: 'hidden' }, style]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const CardSkeleton = () => (
  <View style={cardStyles.container}>
    <View style={cardStyles.header}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={cardStyles.headerText}>
        <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
    <Skeleton width="100%" height={100} borderRadius={12} style={{ marginBottom: 12 }} />
    <View style={cardStyles.footer}>
      <Skeleton width="30%" height={12} />
      <Skeleton width="20%" height={24} borderRadius={12} />
    </View>
  </View>
);

export const RideCardSkeleton = () => (
  <View style={cardStyles.container}>
    <View style={cardStyles.header}>
      <Skeleton width={44} height={44} borderRadius={12} />
      <View style={cardStyles.headerText}>
        <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Skeleton width={60} height={10} />
          <Skeleton width={40} height={10} />
        </View>
      </View>
      <Skeleton width={60} height={20} borderRadius={10} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="90%" height={12} />
        <Skeleton width="80%" height={12} />
      </View>
      <Skeleton width={70} height={30} borderRadius={8} />
    </View>
    <Skeleton width="100%" height={1} style={{ backgroundColor: '#f1f5f9', marginBottom: 12 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Skeleton width={100} height={12} />
      <Skeleton width={80} height={14} />
    </View>
  </View>
);

export const BookingCardSkeleton = () => (
  <View style={cardStyles.container}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
      <View style={{ gap: 8, flex: 1 }}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={70} height={22} borderRadius={11} />
    </View>
    <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Skeleton width="30%" height={10} />
        <Skeleton width="30%" height={10} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width="50%" height={14} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View>
        <Skeleton width={60} height={10} style={{ marginBottom: 4 }} />
        <Skeleton width={100} height={24} />
      </View>
      <Skeleton width={120} height={36} borderRadius={10} />
    </View>
  </View>
);

export const RequestCardSkeleton = () => (
  <View style={cardStyles.container}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="85%" height={18} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton width={60} height={10} />
          <Skeleton width={60} height={10} />
          <Skeleton width={40} height={10} />
        </View>
      </View>
      <Skeleton width={55} height={22} borderRadius={11} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <Skeleton width={30} height={30} borderRadius={15} />
      <Skeleton width={100} height={14} />
    </View>
    <Skeleton width="100%" height={40} borderRadius={10} />
  </View>
);

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
