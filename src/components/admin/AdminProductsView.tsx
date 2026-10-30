import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  NativeModules,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../../services/api';
import { formatKobo } from '../../theme/colors';

type AdminProduct = {
  id: string;
  title: string;
  category?: { id: string; name: string };
  priceKobo: number;
  stock: number;
  description: string;
  status: string;
  images?: string[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
};

const COLOR_PRESETS = [
  { name: 'Gileo Red', hex: '#F10505' },
  { name: 'Executive Wine', hex: '#3F0106' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Medical Teal', hex: '#059669' },
  { name: 'Classic Black', hex: '#0F172A' },
];

const SIZE_PRESETS = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

export function AdminProductsView() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [title, setTitle] = useState('');
  const [priceNaira, setPriceNaira] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');

  // Multi-Image, Colors & Sizes States
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [toastText, setToastText] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AdminProduct[]>('/shop/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setTitle('');
    setPriceNaira('');
    setStock('10');
    setDescription('');
    setImages([]);
    setNewImageUrl('');
    setSelectedColors([COLOR_PRESETS[0]]);
    setSelectedSizes(['S', 'M', 'L', 'XL']);
    setShowModal(true);
  };

  const handleOpenEdit = (p: AdminProduct) => {
    setEditingProduct(p);
    setTitle(p.title);
    setPriceNaira(String(Math.floor((p.priceKobo || 0) / 100)));
    setStock(String(p.stock || 0));
    setDescription(p.description || '');
    setImages(p.images || []);
    setSelectedColors(p.colors || [COLOR_PRESETS[0]]);
    setSelectedSizes(p.sizes || ['S', 'M', 'L', 'XL']);
    setShowModal(true);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
    setToastText('Photo link added');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePickPhotosFromPhone = async () => {
    try {
      const hasNativeDocPicker = Boolean(
        NativeModules.ExpoDocumentPicker || NativeModules.ExponentDocumentPicker,
      );

      if (!hasNativeDocPicker) {
        setToastText(
          'Photo picker native module is not linked in this Expo Go build. Please paste photo link below or build a preview APK.',
        );
        return;
      }

      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        multiple: true,
        copyToCacheDirectory: true,
      }).catch(async () => {
        return await DocumentPicker.getDocumentAsync({
          type: '*/*',
          multiple: true,
          copyToCacheDirectory: true,
        });
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUris = result.assets
          .filter((asset: any) => asset.uri)
          .map((asset: any) => asset.uri);

        if (selectedUris.length > 0) {
          setImages((prev) => [...prev, ...selectedUris]);
          setToastText(
            `${selectedUris.length} ${selectedUris.length === 1 ? 'photo' : 'photos'} added from phone gallery!`,
          );
        }
      }
    } catch (err: any) {
      setToastText(`Gallery status: ${err?.message || 'Photo library unavailable in this build'}`);
    }
  };

  const toggleColorSelect = (c: { name: string; hex: string }) => {
    if (selectedColors.some((sc) => sc.hex === c.hex)) {
      setSelectedColors((prev) => prev.filter((sc) => sc.hex !== c.hex));
    } else {
      setSelectedColors((prev) => [...prev, c]);
    }
  };

  const toggleSizeSelect = (sz: string) => {
    if (selectedSizes.includes(sz)) {
      setSelectedSizes((prev) => prev.filter((s) => s !== sz));
    } else {
      setSelectedSizes((prev) => [...prev, sz]);
    }
  };

  const handleSaveSubmit = async () => {
    if (!title.trim() || !priceNaira.trim()) return;
    setIsSaving(true);
    const priceKobo = Math.floor(parseFloat(priceNaira) * 100);
    const stockVal = parseInt(stock, 10) || 0;

    try {
      if (editingProduct) {
        await apiRequest<any>(`/shop/products/${editingProduct.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            priceKobo,
            stock: stockVal,
            description: description.trim(),
            images,
            colors: selectedColors,
            sizes: selectedSizes,
          }),
        });
        setToastText('Product updated!');
      } else {
        await apiRequest<any>('/shop/products', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            priceKobo,
            stock: stockVal,
            description: description.trim() || 'Premium Gileo product',
            status: 'PUBLISHED',
            images,
            colors: selectedColors,
            sizes: selectedSizes,
          }),
        });
        setToastText('Product created with images, colors & sizes!');
      }
      setShowModal(false);
      await loadProducts();
    } catch (err: any) {
      setToastText(err?.message || 'Could not save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest<any>(`/shop/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setToastText('Product deleted');
    } catch (err: any) {
      setToastText(err?.message || 'Could not delete product');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {toastText.length > 0 && (
        <View style={styles.toastBanner}>
          <Ionicons name="information-circle" size={16} color="#FFFFFF" />
          <Text style={styles.toastBannerText} numberOfLines={1}>{toastText}</Text>
          <Pressable onPress={() => setToastText('')} hitSlop={8}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      <View style={styles.topHeader}>
        <Text style={styles.headerSub}>Admin Catalog Controls</Text>
        <Text style={styles.headerTitle}>Marketplace Products</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />}
      >
        <Pressable style={styles.primaryAddBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.primaryAddBtnText}>Add New Product (Photos, Colors & Sizes)</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#F10505" />
            <Text style={styles.loadingText}>Loading products catalog...</Text>
          </View>
        ) : products.length === 0 ? (
          <Text style={styles.emptyText}>No products in catalog.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {products.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.productTitle}>{p.title}</Text>
                  <Text style={styles.productPrice}>{formatKobo(p.priceKobo)}</Text>
                </View>

                <Text style={styles.metaText}>Stock Units: {p.stock}</Text>
                {p.description && <Text style={styles.descText} numberOfLines={2}>{p.description}</Text>}

                {/* Display Color & Size Badges */}
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {p.sizes?.map((sz) => (
                    <View key={sz} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{sz}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.actionRow}>
                  <Pressable style={styles.editBtn} onPress={() => handleOpenEdit(p)}>
                    <Text style={styles.editBtnText}>Edit Details</Text>
                  </Pressable>

                  <Pressable style={styles.deleteBtn} onPress={() => handleDelete(p.id)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Product Modal */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowModal(false)} style={styles.circleCloseBtn}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalHeaderTitle}>
              {editingProduct ? 'Edit Marketplace Product' : 'Add New Product'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }}>
            <Text style={styles.fieldLabel}>Product Title *</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Gileo Executive Scrubs Set" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Price (₦ Naira) *</Text>
            <TextInput value={priceNaira} onChangeText={setPriceNaira} placeholder="28500" keyboardType="numeric" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Stock Units *</Text>
            <TextInput value={stock} onChangeText={setStock} placeholder="10" keyboardType="numeric" style={styles.modalInput} />

            {/* Product Pictures - Phone Gallery & Link Fallback */}
            <Text style={styles.fieldLabel}>Product Pictures</Text>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.directGalleryCard, pressed && styles.pressed]}
              onPress={handlePickPhotosFromPhone}
            >
              <View style={styles.galleryIconSquare}>
                <Ionicons name="camera" size={24} color="#F10505" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.galleryCardTitle}>Upload Photos from Gallery</Text>
                <Text style={styles.galleryCardSub}>Select multiple photos directly from your phone gallery</Text>
              </View>
              <Ionicons name="add-circle" size={22} color="#F10505" />
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TextInput
                value={newImageUrl}
                onChangeText={setNewImageUrl}
                placeholder="Or paste photo link / Cloudinary URL"
                style={[styles.modalInput, { flex: 1 }]}
              />
              <Pressable style={styles.addImageBtn} onPress={handleAddImage}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {images.length > 0 && (
              <View style={styles.galleryThumbsContainer}>
                <Text style={styles.thumbsCountText}>Selected Pictures ({images.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.thumbWrapper}>
                      <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
                      <Pressable style={styles.thumbRemoveBtn} onPress={() => handleRemoveImage(idx)}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Colors Selector */}
            <Text style={styles.fieldLabel}>Available Colors</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((c) => {
                const isSel = selectedColors.some((sc) => sc.hex === c.hex);
                return (
                  <Pressable
                    key={c.hex}
                    onPress={() => toggleColorSelect(c)}
                    style={[styles.colorPill, isSel && styles.colorPillActive]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: c.hex }]} />
                    <Text style={[styles.colorPillText, isSel && styles.colorPillTextActive]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Sizes Selector */}
            <Text style={styles.fieldLabel}>Available Sizes</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {SIZE_PRESETS.map((sz) => {
                const isSel = selectedSizes.includes(sz);
                return (
                  <Pressable
                    key={sz}
                    onPress={() => toggleSizeSelect(sz)}
                    style={[styles.sizePill, isSel && styles.sizePillActive]}
                  >
                    <Text style={[styles.sizePillText, isSel && styles.sizePillTextActive]}>{sz}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Enter product specifications, material, care guide..." multiline numberOfLines={3} style={[styles.modalInput, { height: 80 }]} />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable style={{ flex: 1, height: 48, borderRadius: 999, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }} onPress={() => setShowModal(false)}>
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>Cancel</Text>
              </Pressable>
              <Pressable style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: '#F10505', alignItems: 'center', justifyContent: 'center' }} disabled={isSaving} onPress={handleSaveSubmit}>
                <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>{isSaving ? 'Saving...' : 'Save Product'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3F0106',
    gap: 8,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 12,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
    gap: 14,
  },
  primaryAddBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  productPrice: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
  },
  metaText: {
    color: '#64748B',
    fontSize: 12,
  },
  descText: {
    color: '#334155',
    fontSize: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  tagText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  circleCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  fieldLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  directGalleryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 12,
  },
  galleryIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCardTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  galleryCardSub: {
    color: '#64748B',
    fontSize: 11,
  },
  galleryThumbsContainer: {
    gap: 6,
    marginTop: 4,
  },
  thumbsCountText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
  },
  addImageBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colorPillActive: {
    borderColor: '#F10505',
    backgroundColor: '#FDF2F2',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  colorPillText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  colorPillTextActive: {
    color: '#F10505',
    fontWeight: '800',
  },
  sizePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sizePillActive: {
    borderColor: '#F10505',
    backgroundColor: '#F10505',
  },
  sizePillText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  sizePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 30,
  },
  pressed: {
    opacity: 0.88,
  },
});
