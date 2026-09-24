/**
 * Dev tool: /spec?size=7.5&popup=1
 * Engine-spec showcase — orthographic isometric low-poly scene with separate
 * world-space and screen-space UI (see docs/ENGINE_SPEC.md). Not linked from the game.
 */

import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import SpecHud from '../components/spec/SpecHud';
import SpecScene, { rig } from '../components/spec/SpecScene';

export default function SpecScreen() {
  const { size, popup, x, z } = useLocalSearchParams();
  useEffect(() => {
    if (size) rig.size = Number(size);
    if (x) rig.x = Number(x);
    if (z) rig.z = Number(z);
  }, [size, x, z]);
  return (
    <View style={styles.root}>
      <SpecScene />
      <SpecHud popup={popup === '1'} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#5bb8f0' },
});
