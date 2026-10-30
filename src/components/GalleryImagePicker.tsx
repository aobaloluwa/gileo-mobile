import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type GalleryImagePickerProps = {
  onImagesSelected: (base64Images: string[]) => void;
  triggerKey: number;
};

export function GalleryImagePicker({ onImagesSelected, triggerKey }: GalleryImagePickerProps) {
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    if (triggerKey > 0 && webviewRef.current) {
      webviewRef.current.postMessage('OPEN_PICKER');
    }
  }, [triggerKey]);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</head>
<body style="margin:0;padding:0;background:transparent;">
  <input type="file" id="fileInput" accept="image/*" multiple style="display:none;" />
  <script>
    const input = document.getElementById('fileInput');

    document.addEventListener('message', function(e) {
      if (e.data === 'OPEN_PICKER') {
        input.click();
      }
    });

    window.addEventListener('message', function(e) {
      if (e.data === 'OPEN_PICKER') {
        input.click();
      }
    });

    input.addEventListener('change', function() {
      const files = Array.from(input.files);
      if (!files.length) return;

      const promises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = function(evt) {
            resolve(evt.target.result);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(dataUris => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'IMAGES_SELECTED', images: dataUris }));
        }
        input.value = '';
      });
    });
  </script>
</body>
</html>
`;

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data?.type === 'IMAGES_SELECTED' && Array.isArray(data.images)) {
              onImagesSelected(data.images);
            }
          } catch {}
        }}
        style={{ width: 1, height: 1, opacity: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});
