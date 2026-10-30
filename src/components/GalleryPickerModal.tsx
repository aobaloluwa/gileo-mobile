import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

type GalleryPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onPhotosSelected: (dataUris: string[]) => void;
};

export function GalleryPickerModal({ visible, onClose, onPhotosSelected }: GalleryPickerModalProps) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 20px;
    }
    .upload-box {
      width: 100%;
      padding: 24px;
      border-radius: 24px;
      background-color: #FFFFFF;
      border: 2px dashed #FECDD3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      text-align: center;
      cursor: pointer;
    }
    .upload-btn {
      width: 100%;
      height: 52px;
      border-radius: 999px;
      background-color: #F10505;
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(241, 5, 5, 0.25);
    }
    .upload-btn:active { opacity: 0.88; transform: scale(0.98); }
    .info-title { font-size: 16px; font-weight: 800; color: #0F172A; }
    .info-sub { font-size: 12px; color: #64748B; }
    #fileInput { display: none; }
  </style>
</head>
<body>
  <div class="upload-box" onclick="document.getElementById('fileInput').click()">
    <div class="info-title">📷 Phone Photo Gallery</div>
    <div class="info-sub">Tap button below to select photos from your gallery</div>
    <button class="upload-btn">
      Choose Photos from Gallery
    </button>
  </div>
  <input type="file" id="fileInput" accept="image/*" multiple />

  <script>
    const input = document.getElementById('fileInput');
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
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PHOTOS_SELECTED', photos: dataUris }));
        }
      });
    });
  </script>
</body>
</html>
`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.circleBtn}>
            <Ionicons name="close" size={20} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Upload Photos from Gallery</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.subText}>
            Tap below to open your phone's native photo gallery and choose multiple pictures for this product.
          </Text>

          <WebView
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
                if (data?.type === 'PHOTOS_SELECTED' && Array.isArray(data.photos)) {
                  onPhotosSelected(data.photos);
                  onClose();
                }
              } catch {}
            }}
            style={styles.webview}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  body: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  subText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
