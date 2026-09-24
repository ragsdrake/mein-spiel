import { Text } from 'react-native';
import { text } from './theme';

export default function Txt({ size = 16, color, style, ...rest }) {
  return <Text style={[text.base, { fontSize: size }, color && { color }, style]} {...rest} />;
}
