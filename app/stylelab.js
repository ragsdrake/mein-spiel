/**
 * Dev tool: /stylelab?style=lowpoly|soft|toon|ink&zoom=1
 * Renders the style-study scene full screen (not linked from the game).
 */

import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import StyleLab from '../components/stylelab/StyleLab';

export default function StyleLabScreen() {
  const { style = 'toon', zoom = '1' } = useLocalSearchParams();
  return (
    <View style={styles.root}>
      <StyleLab style={style} zoom={Number(zoom) || 1} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2a1f48' },
});
