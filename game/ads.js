/**
 * game/ads.js
 * Single entry point for rewarded video ads. Today this shows a local
 * placeholder (components/hud/AdOverlay.js) so every reward flow can be
 * built and tested in Expo Go / the browser.
 *
 * To go live, replace the body of `showRewardedAd` with the AdMob call
 * (react-native-google-mobile-ads, needs an EAS development build) and
 * resolve `true` only in the EARNED_REWARD callback.
 */
import useUi from './ui';

export const AD_PLACEMENTS = {
  boost:   'Einnahmen ×2',
  offline: 'Offline-Einnahmen ×2',
  chest:   'Gratis-Truhe',
};

/** Resolves true when the player watched the ad to the end. */
export function showRewardedAd(placement) {
  return new Promise((resolve) => {
    useUi.setState({ ad: { placement, resolve } });
  });
}

/** Called by the overlay when the placeholder "video" ends or is closed. */
export function finishAd(rewarded) {
  const ad = useUi.getState().ad;
  useUi.setState({ ad: null });
  ad?.resolve(rewarded);
}
