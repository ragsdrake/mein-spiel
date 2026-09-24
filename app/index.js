/**
 * app/index.js — the Spukhotel game screen.
 * 3D hotel in the back, HUD on top. Dragging pans the camera, pinching zooms;
 * short taps fall through to the 3D scene (ghosts, slime, padlocks).
 */

import { useEffect, useMemo, useRef } from 'react';
import { AppState, PanResponder, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomBar from '../components/hud/BottomBar';
import BuildSheet from '../components/hud/BuildSheet';
import {
  HotelTransition, NightSummaryToast, OfflinePopup, StarUpPopup, TutorialHint,
} from '../components/hud/Popups';
import TopBar from '../components/hud/TopBar';
import HotelScene from '../components/scene/HotelScene';
import { panBy, zoomBy } from '../game/camera';
import useHotel from '../game/store';

const touchDistance = (touches) =>
  Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);

function useCameraGestures(width) {
  const last = useRef({ dx: 0, dy: 0, pinch: 0 });
  const widthRef = useRef(width);
  widthRef.current = width;

  return useMemo(() => PanResponder.create({
    // only claim the gesture once the finger actually moves — taps reach the 3D scene
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 8,
    onPanResponderGrant: () => { last.current = { dx: 0, dy: 0, pinch: 0 }; },
    onPanResponderMove: (e, g) => {
      const touches = e.nativeEvent.touches;
      if (touches && touches.length >= 2) {
        const d = touchDistance(touches);
        if (last.current.pinch) zoomBy(d / last.current.pinch);
        last.current.pinch = d;
        return;
      }
      last.current.pinch = 0;
      panBy(g.dx - last.current.dx, g.dy - last.current.dy, widthRef.current);
      last.current.dx = g.dx;
      last.current.dy = g.dy;
    },
    onPanResponderTerminationRequest: () => true,
  }), []);
}

/** Save "last seen" regularly and compute offline earnings on launch / resume. */
function useSessionTracking() {
  useEffect(() => {
    const onHydrated = () => {
      useHotel.getState().computeOffline();
      useHotel.getState().touch();
    };
    if (useHotel.persist.hasHydrated()) onHydrated();
    const unsubHydrate = useHotel.persist.onFinishHydration(onHydrated);

    const beat = setInterval(() => useHotel.getState().touch(), 5000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        useHotel.getState().computeOffline();
      }
      useHotel.getState().touch();
    });
    return () => {
      unsubHydrate();
      clearInterval(beat);
      sub.remove();
    };
  }, []);
}

export default function GameScreen() {
  const { width } = useWindowDimensions();
  const pan = useCameraGestures(width);
  useSessionTracking();

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    // mouse wheel zoom for the browser build
    const onWheel = (e) => zoomBy(e.deltaY > 0 ? 0.92 : 1.08);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
        <HotelScene />
      </View>

      <SafeAreaView style={styles.hud} edges={['top', 'bottom']} pointerEvents="box-none">
        <TopBar />
        <View style={styles.flex} pointerEvents="none" />
        <BottomBar />
      </SafeAreaView>

      <TutorialHint />
      <NightSummaryToast />
      <BuildSheet />
      <HotelTransition />
      <StarUpPopup />
      <OfflinePopup />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0c0818' },
  hud:  { ...StyleSheet.absoluteFillObject, paddingTop: 6 },
  flex: { flex: 1 },
});
