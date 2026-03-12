import React, { forwardRef, useImperativeHandle, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { RecaptchaVerifier as FirebaseRecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try { WebView = require('react-native-webview').default; } catch {}
}

interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  [key: string]: any;
}

export interface RecaptchaVerifier {
  type: string;
  verify: () => Promise<string>;
  /** On web, returns the raw Firebase RecaptchaVerifier to pass to verifyPhoneNumber */
  getFirebaseVerifier: () => any;
}

interface Props {
  firebaseConfig: FirebaseConfig;
}

const FirebaseRecaptchaVerifierModal = forwardRef<RecaptchaVerifier, Props>(
  ({ firebaseConfig }, ref) => {
    // ========== WEB ==========
    if (Platform.OS === 'web') {
      const verifierRef = useRef<FirebaseRecaptchaVerifier | null>(null);
      const containerRef = useRef<HTMLDivElement | null>(null);

      useEffect(() => {
        // Create a hidden div for reCAPTCHA
        const div = document.createElement('div');
        div.id = 'recaptcha-container-' + Date.now();
        div.style.position = 'fixed';
        div.style.bottom = '0';
        div.style.right = '0';
        div.style.zIndex = '9999';
        document.body.appendChild(div);
        containerRef.current = div;

        try {
          verifierRef.current = new FirebaseRecaptchaVerifier(auth, div, {
            size: 'invisible',
          });
          verifierRef.current.render();
        } catch (e) {
          console.warn('RecaptchaVerifier init error:', e);
        }

        return () => {
          verifierRef.current?.clear();
          div.remove();
        };
      }, []);

      useImperativeHandle(ref, () => ({
        type: 'recaptcha',
        verify: async () => {
          if (!verifierRef.current) throw new Error('reCAPTCHA not ready');
          return verifierRef.current.verify();
        },
        getFirebaseVerifier: () => verifierRef.current,
      }));

      return null;
    }

    // ========== NATIVE (Android/iOS) ==========
    const webViewRef = useRef<any>(null);
    const resolveRef = useRef<((token: string) => void) | null>(null);
    const rejectRef = useRef<((err: Error) => void) | null>(null);

    useImperativeHandle(ref, () => ({
      type: 'recaptcha',
      verify: () => {
        if (!WebView) {
          console.warn('WebView not available');
          return Promise.resolve('mock-token');
        }
        return new Promise<string>((resolve, reject) => {
          resolveRef.current = resolve;
          rejectRef.current = reject;
          webViewRef.current?.injectJavaScript('startVerify(); true;');
        });
      },
      getFirebaseVerifier: () => null,
    }));

    const handleMessage = useCallback((event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'token' && data.token) {
          resolveRef.current?.(data.token);
        } else if (data.type === 'error') {
          rejectRef.current?.(new Error(data.message || 'reCAPTCHA failed'));
        }
      } catch {}
    }, []);

    if (!WebView) return null;

    const html = `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body>
  <div id="recaptcha-container"></div>
  <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js"></script>
  <script>
    firebase.initializeApp(${JSON.stringify(firebaseConfig)});
    var verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: function(token) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'token', token: token }));
      },
      'expired-callback': function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'reCAPTCHA expired' }));
      }
    });
    verifier.render().then(function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    });
    function startVerify() {
      verifier.verify().catch(function(err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
      });
    }
  </script>
</body>
</html>`;

    return (
      <View style={styles.hidden} pointerEvents="none">
        <WebView
          ref={webViewRef}
          source={{ html }}
          onMessage={handleMessage}
          javaScriptEnabled
          style={styles.webview}
        />
      </View>
    );
  }
);

export default FirebaseRecaptchaVerifierModal;

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
  webview: { width: 1, height: 1 },
});
