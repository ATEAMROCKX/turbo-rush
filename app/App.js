import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import gameHtml from './game/gameHtml';

SplashScreen.preventAutoHideAsync().catch(() => {});

const SAVE_KEY = 'turboGarage'; // must never change, or players lose their coins and cars
const BG = '#12101f';

// Download new game versions in the background; they start the next time the app opens.
async function fetchUpdateQuietly() {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const r = await Updates.checkForUpdateAsync();
    if (r.isAvailable) await Updates.fetchUpdateAsync();
  } catch (e) {}
}

function Game() {
  const insets = useSafeAreaInsets();
  const web = useRef(null);
  const [save, setSave] = useState(undefined); // undefined while loading

  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY).then(v => setSave(v || null)).catch(() => setSave(null));
    fetchUpdateQuietly();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') {
        web.current?.injectJavaScript('window.turboResume && window.turboResume(); true;');
        fetchUpdateQuietly();
      } else {
        web.current?.injectJavaScript('window.turboPause && window.turboPause(); true;');
      }
    });
    return () => sub.remove();
  }, []);

  const onMessage = useCallback(e => {
    let m;
    try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (m.t === 'save' && typeof m.d === 'string') AsyncStorage.setItem(SAVE_KEY, m.d).catch(() => {});
    if (m.t === 'haptic') {
      if (m.k === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      else Haptics.impactAsync(m.k === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  }, []);

  if (save === undefined) return <View style={styles.root} />;

  const boot = `window.__TR_APP = true; window.__TR_SAVE = ${save ? `JSON.parse(${JSON.stringify(save)})` : 'null'}; true;`;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <StatusBar style="light" />
      <WebView
        ref={web}
        style={styles.web}
        source={{ html: gameHtml, baseUrl: 'https://localhost/' }}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={boot}
        onMessage={onMessage}
        onLoadEnd={() => SplashScreen.hideAsync().catch(() => {})}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowsLinkPreview={false}
        allowsBackForwardNavigationGestures={false}
        dataDetectorTypes="none"
        textZoom={100}
        setSupportMultipleWindows={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        onContentProcessDidTerminate={() => web.current?.reload()}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  web: { flex: 1, backgroundColor: BG },
});
