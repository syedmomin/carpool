import React from 'react';
import { View, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Generic art keyed by vehicle type — the same idea ride-hailing apps use
// for their vehicle-class pickers (a fixed image per class, not a real
// photo of each driver's actual vehicle). Bundled once as PNGs — not stored
// or downloaded per vehicle, so there's no per-vehicle storage cost.
export type VehicleTypeKey = 'CAR' | 'PREMIUM_CAR' | 'RICKSHAW' | 'VAN' | 'HIACE' | 'COASTER' | 'BUS';

const IMAGE_BY_TYPE: Record<VehicleTypeKey, any> = {
  CAR: require('../../assets/vehicles/car.png'),
  PREMIUM_CAR: require('../../assets/vehicles/premium-car.png'),
  RICKSHAW: require('../../assets/vehicles/rickshaw.png'),
  VAN: require('../../assets/vehicles/van.png'),
  HIACE: require('../../assets/vehicles/hiace.png'),
  COASTER: require('../../assets/vehicles/coaster.png'),
  BUS: require('../../assets/vehicles/bus.png'),
};

interface Props {
  type?: string;
  size?: number;
}

export const VehicleTypeImage: React.FC<Props> = ({ type, size = 80 }) => {
  const key = (IMAGE_BY_TYPE[type as VehicleTypeKey] ? type : 'CAR') as VehicleTypeKey;
  const isPremium = key === 'PREMIUM_CAR';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={IMAGE_BY_TYPE[key]} style={{ width: size, height: size }} resizeMode="contain" />
      {isPremium && (
        <View style={{
          position: 'absolute', top: 0, right: size * 0.06,
          width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13,
          backgroundColor: '#b8860b', alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: '#fff',
        }}>
          <MaterialCommunityIcons name="star" size={size * 0.15} color="#fff" />
        </View>
      )}
    </View>
  );
};
