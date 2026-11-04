import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminProductsSkeleton } from './AdminProductsSkeleton';
import { apiRequest, uploadImageApi } from '../../services/api';
import { formatKobo } from '../../theme/colors';

type AdminProduct = {
  id: string;
  title: string;
  slug?: string;
  category?: { id: string; name: string };
  categoryId?: string;
  priceKobo: number;
  stock: number;
  description: string;
  status: string;
  images?: string[] | { urls?: string[]; colors?: any[]; sizes?: string[] } | any;
  colors?: { name: string; hex: string }[];
  sizes?: string[];
};

type FilterStage = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PUBLISHED' | 'DRAFT';

const STAGE_FILTERS: { key: FilterStage; label: string }[] = [
  { key: 'ALL', label: 'All Catalog' },
  { key: 'IN_STOCK', label: 'In Stock' },
  { key: 'LOW_STOCK', label: 'Low Stock (≤5)' },
  { key: 'OUT_OF_STOCK', label: 'Out of Stock' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'DRAFT', label: 'Drafts' },
];

const COLOR_PRESETS = [
  { name: 'Gileo Red', hex: '#F10505' },
  { name: 'Executive Wine', hex: '#3F0106' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Medical Teal', hex: '#059669' },
  { name: 'Classic Black', hex: '#0F172A' },
  { name: 'Royal Purple', hex: '#6D28D9' },
  { name: 'Charcoal Grey', hex: '#475569' },
];

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

function extractProductMedia(p: AdminProduct) {
  let urls: string[] = [];
  let colors: { name: string; hex: string }[] = p.colors || [];
  let sizes: string[] = p.sizes || [];

  if (Array.isArray(p.images)) {
    urls = p.images.filter((img) => typeof img === 'string' && img.trim().length > 0);
  } else if (p.images && typeof p.images === 'object') {
    const obj = p.images as any;
    if (Array.isArray(obj.urls)) {
      urls = obj.urls.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    }
    if (Array.isArray(obj.colors) && obj.colors.length > 0) {
      colors = obj.colors;
    }
    if (Array.isArray(obj.sizes) && obj.sizes.length > 0) {
      sizes = obj.sizes;
    }
  }

  return { urls, colors, sizes };
}

function extractProductCategory(p: any): string {
  if (p.category) {
    if (typeof p.category === 'string' && p.category.trim().length > 0) {
      return p.category.trim();
    }
    if (typeof p.category === 'object' && typeof p.category.name === 'string' && p.category.name.trim().length > 0) {
      return p.category.name.trim();
    }
  }
  if (typeof p.categoryName === 'string' && p.categoryName.trim().length > 0) {
    return p.categoryName.trim();
  }
  if (p.images && typeof p.images === 'object' && typeof p.images.category === 'string' && p.images.category.trim().length > 0) {
    return p.images.category.trim();
  }
  if (typeof p.images === 'string') {
    try {
      const parsed = JSON.parse(p.images);
      if (parsed && typeof parsed === 'object' && typeof parsed.category === 'string' && parsed.category.trim().length > 0) {
        return parsed.category.trim();
      }
    } catch {}
  }
  return '';
}

export function AdminProductsView() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterStage>('ALL');

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState('Gileo Products');
  const [priceNaira, setPriceNaira] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  // Multi-Image, Colors & Sizes
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Custom Color Input State
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#F10505');
  const [showAddColorInput, setShowAddColorInput] = useState(false);

  // Operation States
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    setCategoryName('');
    setPriceNaira('');
    setStock('10');
    setDescription('');
    setStatus('PUBLISHED');
    setImages([]);
    setNewImageUrl('');
    setSelectedColors([COLOR_PRESETS[0], COLOR_PRESETS[2]]);
    setSelectedSizes(['S', 'M', 'L', 'XL']);
    setShowAddColorInput(false);
    setShowModal(true);
  };

  const handleOpenEdit = (p: AdminProduct) => {
    const { urls, colors, sizes } = extractProductMedia(p);
    setEditingProduct(p);
    setTitle(p.title);
    setCategoryName(extractProductCategory(p));
    setPriceNaira(String(Math.floor((p.priceKobo || 0) / 100)));
    setStock(String(p.stock || 0));
    setDescription(p.description || '');
    setStatus(p.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
    setImages(urls);
    setNewImageUrl('');
    setSelectedColors(colors.length > 0 ? colors : [COLOR_PRESETS[0]]);
    setSelectedSizes(sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL']);
    setShowAddColorInput(false);
    setShowModal(true);
  };

  const handleDuplicate = (p: AdminProduct) => {
    const { urls, colors, sizes } = extractProductMedia(p);
    setEditingProduct(null);
    setTitle(`${p.title} (Copy)`);
    setCategoryName(extractProductCategory(p));
    setPriceNaira(String(Math.floor((p.priceKobo || 0) / 100)));
    setStock(String(p.stock || 0));
    setDescription(p.description || '');
    setStatus('PUBLISHED');
    setImages(urls);
    setNewImageUrl('');
    setSelectedColors(colors);
    setSelectedSizes(sizes);
    setShowAddColorInput(false);
    setShowModal(true);
    showToast('Product duplicated into editor!');
  };

  const showToast = (text: string) => {
    setToastText(text);
    setTimeout(() => {
      setToastText((prev) => (prev === text ? '' : prev));
    }, 4500);
  };

  // Device Image Picker (Gallery)
  const handlePickPhotosFromGallery = async () => {
    try {
      const permRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permRes.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access to upload product pictures.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingImage(true);
        showToast(`Uploading ${result.assets.length} image(s)...`);

        const uploadedUrls: string[] = [];
        for (const asset of result.assets) {
          const mime = asset.mimeType || 'image/jpeg';
          const base64Url = asset.base64 ? `data:${mime};base64,${asset.base64}` : null;

          try {
            const uploaded = await uploadImageApi(asset.uri);
            if (uploaded?.url && !uploaded.url.startsWith('file://') && !uploaded.url.startsWith('content://')) {
              uploadedUrls.push(uploaded.url);
            } else if (base64Url) {
              uploadedUrls.push(base64Url);
            }
          } catch (err: any) {
            if (base64Url) {
              uploadedUrls.push(base64Url);
            }
          }
        }

        if (uploadedUrls.length > 0) {
          setImages((prev) => [...prev, ...uploadedUrls]);
          showToast(
            `${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'photo' : 'photos'} added successfully!`,
          );
        } else {
          showToast('Could not process image files. Please try another image.');
        }
      }
    } catch (err: any) {
      showToast(`Gallery error: ${err?.message || 'Could not pick photos'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Device Camera Photo Capture
  const handleTakeCameraPhoto = async () => {
    try {
      const permRes = await ImagePicker.requestCameraPermissionsAsync();
      if (!permRes.granted) {
        Alert.alert('Permission Required', 'Please allow camera access to take product photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        const base64Url = asset.base64 ? `data:${mime};base64,${asset.base64}` : null;

        setIsUploadingImage(true);
        showToast('Uploading camera photo...');

        try {
          const uploaded = await uploadImageApi(asset.uri);
          const finalUrl = (uploaded?.url && !uploaded.url.startsWith('file://') && !uploaded.url.startsWith('content://'))
            ? uploaded.url
            : (base64Url || asset.uri);

          setImages((prev) => [...prev, finalUrl]);
          showToast('Camera photo uploaded!');
        } catch {
          if (base64Url) {
            setImages((prev) => [...prev, base64Url]);
            showToast('Photo added to product draft');
          } else {
            showToast('Could not process camera image.');
          }
        }
      }
    } catch (err: any) {
      showToast(`Camera error: ${err?.message || 'Could not capture photo'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddImageLink = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
    showToast('Photo URL added');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleColorSelect = (c: { name: string; hex: string }) => {
    if (selectedColors.some((sc) => sc.hex.toLowerCase() === c.hex.toLowerCase())) {
      setSelectedColors((prev) =>
        prev.filter((sc) => sc.hex.toLowerCase() !== c.hex.toLowerCase()),
      );
    } else {
      setSelectedColors((prev) => [...prev, c]);
    }
  };

  const handleAddCustomColor = () => {
    if (!customColorName.trim()) return;
    const newColor = {
      name: customColorName.trim(),
      hex: customColorHex.trim() || '#F10505',
    };
    setSelectedColors((prev) => [...prev, newColor]);
    setCustomColorName('');
    setShowAddColorInput(false);
    showToast(`Added color: ${newColor.name}`);
  };

  const toggleSizeSelect = (sz: string) => {
    if (selectedSizes.includes(sz)) {
      setSelectedSizes((prev) => prev.filter((s) => s !== sz));
    } else {
      setSelectedSizes((prev) => [...prev, sz]);
    }
  };

  const handleAdjustStock = (delta: number) => {
    const currentVal = parseInt(stock, 10) || 0;
    const newVal = Math.max(0, currentVal + delta);
    setStock(String(newVal));
  };

  const handleSaveSubmit = async () => {
    if (!title.trim()) {
      showToast('Please enter a product title.');
      return;
    }
    if (!priceNaira.trim() || isNaN(parseFloat(priceNaira))) {
      showToast('Please enter a valid price in Naira.');
      return;
    }

    setIsSaving(true);
    const priceKobo = Math.round(parseFloat(priceNaira) * 100);
    const stockVal = parseInt(stock, 10) || 0;
    const catName = categoryName.trim() || 'Gileo Products';
    const imagesList = Array.isArray(images) ? images : [];

    try {
      if (editingProduct) {
        await apiRequest<any>(`/shop/products/${editingProduct.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            category: catName,
            priceKobo,
            stock: stockVal,
            description: description.trim(),
            status,
            images: imagesList,
            colors: selectedColors,
            sizes: selectedSizes,
          }),
        });
        showToast('Product updated successfully!');
      } else {
        await apiRequest<any>('/shop/products', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            category: catName,
            priceKobo,
            stock: stockVal,
            description: description.trim() || 'Premium Gileo medical product',
            status,
            images: imagesList,
            colors: selectedColors,
            sizes: selectedSizes,
          }),
        });
        showToast('Product published to catalog!');
      }
      setShowModal(false);
      await loadProducts();
    } catch (err: any) {
      showToast(err?.message || 'Could not save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, titleName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${titleName}" from the catalog? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Product',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await apiRequest<any>(`/shop/products/${id}`, { method: 'DELETE' });
              setProducts((prev) => prev.filter((p) => p.id !== id));
              showToast('Product removed from catalog');
            } catch (err: any) {
              showToast(err?.message || 'Could not delete product');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  // Metrics calculation
  const totalProductsCount = products.length;
  const inStockCount = products.filter((p) => (p.stock || 0) > 0).length;
  const lowStockCount = products.filter((p) => (p.stock || 0) <= 5).length;
  const totalInventoryKobo = products.reduce(
    (acc, p) => acc + (p.priceKobo || 0) * (p.stock || 0),
    0,
  );

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    const { colors, sizes } = extractProductMedia(p);

    const matchesQuery =
      !query ||
      p.title?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.category?.name?.toLowerCase().includes(query) ||
      colors.some((c) => c.name.toLowerCase().includes(query)) ||
      sizes.some((s) => s.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    if (selectedFilter === 'IN_STOCK') return (p.stock || 0) > 0;
    if (selectedFilter === 'LOW_STOCK') return (p.stock || 0) > 0 && (p.stock || 0) <= 5;
    if (selectedFilter === 'OUT_OF_STOCK') return (p.stock || 0) === 0;
    if (selectedFilter === 'PUBLISHED') return p.status === 'PUBLISHED';
    if (selectedFilter === 'DRAFT') return p.status !== 'PUBLISHED';

    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Notification Toast */}
      {toastText.length > 0 && (
        <View style={styles.toastBanner}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          <Text style={styles.toastBannerText} numberOfLines={1}>
            {toastText}
          </Text>
          <Pressable onPress={() => setToastText('')} hitSlop={8}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {/* Screen Header - Fully Responsive */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderTitleBox}>
          <Text style={styles.headerSub} numberOfLines={1}>
            Inventory & Catalog Control
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Marketplace Products
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.headerAddBtn, pressed && styles.pressed]}
          onPress={handleOpenAdd}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.headerAddBtnText} numberOfLines={1}>
            Add Product
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Overview Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#FDF2F2' }]}>
              <Ionicons name="cube" size={16} color="#F10505" />
            </View>
            <View style={styles.metricCardTextContent}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {totalProductsCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Total Items
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
            <View style={styles.metricCardTextContent}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {inStockCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                In Stock
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="alert-circle" size={16} color="#F59E0B" />
            </View>
            <View style={styles.metricCardTextContent}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {lowStockCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Low / Out
              </Text>
            </View>
          </View>
        </View>

        {/* Inventory Value Banner */}
        <View style={styles.valueBanner}>
          <View style={styles.valueBannerLeft}>
            <Ionicons name="wallet-outline" size={18} color="#3F0106" />
            <Text style={styles.valueBannerTitle} numberOfLines={1}>
              Estimated Inventory Value
            </Text>
          </View>
          <Text style={styles.valueBannerAmount} numberOfLines={1}>
            {formatKobo(totalInventoryKobo)}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search catalog by name, color, size..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* Horizontal Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {STAGE_FILTERS.map((stg) => {
            const isActive = selectedFilter === stg.key;
            return (
              <Pressable
                key={stg.key}
                onPress={() => setSelectedFilter(stg.key)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {stg.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Content Area: Skeleton vs Product List */}
        {loading ? (
          <AdminProductsSkeleton />
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="bag-remove-outline" size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No products matched "${searchQuery}"`
                : 'Your catalog is currently empty. Add your first product below!'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.emptyAddBtn, pressed && styles.pressed]}
              onPress={handleOpenAdd}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>Add New Product</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.productsList}>
            {filteredProducts.map((p) => {
              const { urls, colors, sizes } = extractProductMedia(p);
              const mainImage = urls[0];
              const isLowStock = p.stock > 0 && p.stock <= 5;
              const isOutOfStock = p.stock === 0;

              return (
                <View key={p.id} style={styles.productCard}>
                  {/* Card Main Row */}
                  <View style={styles.cardMainRow}>
                    {/* Thumbnail Image Container */}
                    <View style={styles.imageBox}>
                      {mainImage ? (
                        <Image
                          source={{ uri: mainImage }}
                          style={styles.cardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Ionicons name="shirt" size={26} color="#CBD5E1" />
                        </View>
                      )}
                      {urls.length > 1 && (
                        <View style={styles.photosBadge}>
                          <Ionicons name="camera" size={10} color="#FFFFFF" />
                          <Text style={styles.photosBadgeText}>{urls.length}</Text>
                        </View>
                      )}
                    </View>

                    {/* Product Basic Info */}
                    <View style={styles.cardInfo}>
                      <View style={styles.titlePriceRow}>
                        <Text style={styles.productTitle} numberOfLines={2}>
                          {p.title}
                        </Text>
                        <Text style={styles.productPrice} numberOfLines={1}>
                          {formatKobo(p.priceKobo)}
                        </Text>
                      </View>

                      {p.description ? (
                        <Text style={styles.descText} numberOfLines={2}>
                          {p.description}
                        </Text>
                      ) : null}

                      {/* Stock & Status Badges Row */}
                      <View style={styles.badgesRow}>
                        <View
                          style={[
                            styles.stockChip,
                            isOutOfStock
                              ? styles.stockChipOut
                              : isLowStock
                                ? styles.stockChipLow
                                : styles.stockChipIn,
                          ]}
                        >
                          <View
                            style={[
                              styles.stockDot,
                              {
                                backgroundColor: isOutOfStock
                                  ? '#EF4444'
                                  : isLowStock
                                    ? '#F59E0B'
                                    : '#10B981',
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.stockChipText,
                              {
                                color: isOutOfStock
                                  ? '#EF4444'
                                  : isLowStock
                                    ? '#D97706'
                                    : '#059669',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {isOutOfStock
                              ? 'Out of Stock'
                              : isLowStock
                                ? `Low Stock (${p.stock})`
                                : `Stock: ${p.stock}`}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusTag,
                            p.status === 'PUBLISHED'
                              ? styles.statusTagPublished
                              : styles.statusTagDraft,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusTagText,
                              p.status === 'PUBLISHED'
                                ? styles.statusTagTextPublished
                                : styles.statusTagTextDraft,
                            ]}
                            numberOfLines={1}
                          >
                            {p.status || 'PUBLISHED'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Options Specs Row (Colors & Sizes) */}
                  {(colors.length > 0 || sizes.length > 0) && (
                    <View style={styles.optionsSection}>
                      {colors.length > 0 && (
                        <View style={styles.optionsGroup}>
                          <Text style={styles.optionsLabel}>Colors:</Text>
                          <View style={styles.colorsDotsRow}>
                            {colors.map((c, idx) => (
                              <View
                                key={idx}
                                style={[styles.miniColorSwatch, { backgroundColor: c.hex }]}
                              />
                            ))}
                          </View>
                        </View>
                      )}

                      {sizes.length > 0 && (
                        <View style={styles.optionsGroup}>
                          <Text style={styles.optionsLabel}>Sizes:</Text>
                          <View style={styles.sizesRow}>
                            {sizes.map((sz, idx) => (
                              <View key={idx} style={styles.miniSizePill}>
                                <Text style={styles.miniSizeText}>{sz}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Card Actions Row */}
                  <View style={styles.cardActionsRow}>
                    <Pressable
                      style={({ pressed }) => [styles.actionBtnEdit, pressed && styles.pressed]}
                      onPress={() => handleOpenEdit(p)}
                    >
                      <Ionicons name="create-outline" size={14} color="#0F172A" />
                      <Text style={styles.actionBtnEditText} numberOfLines={1}>
                        Edit Details
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.actionBtnDuplicate, pressed && styles.pressed]}
                      onPress={() => handleDuplicate(p)}
                    >
                      <Ionicons name="copy-outline" size={14} color="#3F0106" />
                      <Text style={styles.actionBtnDuplicateText} numberOfLines={1}>
                        Duplicate
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.actionBtnDelete, pressed && styles.pressed]}
                      disabled={deletingId === p.id}
                      onPress={() => handleDelete(p.id, p.title)}
                    >
                      {deletingId === p.id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          <Text style={styles.actionBtnDeleteText} numberOfLines={1}>
                            Delete
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Product Slide-Up Modal - Fully Compatible with iPhone Safe Areas */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          {/* Modal Top Nav Header */}
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 12 }]}>
            <Pressable onPress={() => setShowModal(false)} style={styles.modalCloseCircle} hitSlop={12}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {editingProduct ? 'Edit Marketplace Product' : 'Add New Product'}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.modalScrollContent,
              { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 20, 40) : 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Product Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Gileo Executive Flex Scrubs Set"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* Category Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Product Category *</Text>
              <TextInput
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="e.g. Gileo Scrubs, Equipment, Accessories, Diagnostics"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginTop: 8 }}
              >
                {['Gileo Scrubs', 'Equipment', 'Accessories', 'Diagnostics', 'Medical Apparel', 'Surgical Tools'].map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategoryName(cat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: categoryName === cat ? '#F10505' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: categoryName === cat ? '#F10505' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: categoryName === cat ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Price & Stock Row */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.inputGroup, { flex: 1, minWidth: 0 }]}>
                <Text style={styles.fieldLabel}>Price (₦ Naira) *</Text>
                <View style={styles.currencyInputBox}>
                  <Text style={styles.currencySymbol}>₦</Text>
                  <TextInput
                    value={priceNaira}
                    onChangeText={setPriceNaira}
                    placeholder="28500"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    style={styles.currencyInput}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, minWidth: 0 }]}>
                <Text style={styles.fieldLabel}>Stock Units *</Text>
                <View style={styles.stepperContainer}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => handleAdjustStock(-1)}
                  >
                    <Ionicons name="remove" size={16} color="#0F172A" />
                  </Pressable>
                  <TextInput
                    value={stock}
                    onChangeText={setStock}
                    placeholder="10"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    style={styles.stepperInput}
                  />
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => handleAdjustStock(1)}
                  >
                    <Ionicons name="add" size={16} color="#0F172A" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Status Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Catalog Visibility</Text>
              <View style={styles.statusToggleRow}>
                <Pressable
                  style={[
                    styles.statusToggleOption,
                    status === 'PUBLISHED' && styles.statusToggleOptionActive,
                  ]}
                  onPress={() => setStatus('PUBLISHED')}
                >
                  <Ionicons
                    name="eye"
                    size={16}
                    color={status === 'PUBLISHED' ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.statusToggleText,
                      status === 'PUBLISHED' && styles.statusToggleTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    Published
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.statusToggleOption,
                    status === 'DRAFT' && styles.statusToggleOptionActiveDraft,
                  ]}
                  onPress={() => setStatus('DRAFT')}
                >
                  <Ionicons
                    name="eye-off"
                    size={16}
                    color={status === 'DRAFT' ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.statusToggleText,
                      status === 'DRAFT' && styles.statusToggleTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    Draft Only
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Product Pictures Upload Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Product Pictures</Text>
              <Text style={styles.fieldSubLabel}>
                Upload images directly from your phone gallery, camera, or paste image links.
              </Text>

              {/* Upload Action Cards */}
              <View style={styles.uploadCardsRow}>
                <Pressable
                  style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}
                  disabled={isUploadingImage}
                  onPress={handlePickPhotosFromGallery}
                >
                  <View style={[styles.uploadCardIcon, { backgroundColor: '#FDF2F2' }]}>
                    <Ionicons name="images" size={20} color="#F10505" />
                  </View>
                  <Text style={styles.uploadCardTitle} numberOfLines={1}>
                    Device Gallery
                  </Text>
                  <Text style={styles.uploadCardSub} numberOfLines={1}>
                    Pick multiple photos
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}
                  disabled={isUploadingImage}
                  onPress={handleTakeCameraPhoto}
                >
                  <View style={[styles.uploadCardIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="camera" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.uploadCardTitle} numberOfLines={1}>
                    Take Photo
                  </Text>
                  <Text style={styles.uploadCardSub} numberOfLines={1}>
                    Camera capture
                  </Text>
                </Pressable>
              </View>

              {/* Paste URL Input */}
              <View style={styles.urlInputRow}>
                <TextInput
                  value={newImageUrl}
                  onChangeText={setNewImageUrl}
                  placeholder="Or paste photo link / Cloudinary URL"
                  placeholderTextColor="#94A3B8"
                  style={styles.urlInput}
                />
                <Pressable style={styles.urlAddBtn} onPress={handleAddImageLink}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Loading Indicator */}
              {isUploadingImage && (
                <View style={styles.uploadingBox}>
                  <ActivityIndicator size="small" color="#F10505" />
                  <Text style={styles.uploadingText}>Uploading images to server...</Text>
                </View>
              )}

              {/* Selected Images Grid */}
              {images.length > 0 && (
                <View style={styles.thumbsContainer}>
                  <Text style={styles.thumbsCountText}>Selected Pictures ({images.length})</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
                  >
                    {images.map((img, idx) => (
                      <View key={idx} style={styles.thumbWrapper}>
                        <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
                        {idx === 0 && (
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryBadgeText}>MAIN</Text>
                          </View>
                        )}
                        <Pressable
                          style={styles.thumbRemoveBtn}
                          onPress={() => handleRemoveImage(idx)}
                          hitSlop={8}
                        >
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Colors Selector */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.fieldLabel}>Available Colors</Text>
                <Pressable onPress={() => setShowAddColorInput(!showAddColorInput)}>
                  <Text style={styles.addColorLink}>
                    {showAddColorInput ? 'Cancel' : '+ Custom Color'}
                  </Text>
                </Pressable>
              </View>

              {/* Custom Color Adder Box */}
              {showAddColorInput && (
                <View style={styles.customColorBox}>
                  <TextInput
                    value={customColorName}
                    onChangeText={setCustomColorName}
                    placeholder="Color Name (e.g. Olive Green)"
                    placeholderTextColor="#94A3B8"
                    style={[styles.textInput, { flex: 1, height: 42 }]}
                  />
                  <TextInput
                    value={customColorHex}
                    onChangeText={setCustomColorHex}
                    placeholder="#10B981"
                    placeholderTextColor="#94A3B8"
                    style={[styles.textInput, { width: 84, height: 42 }]}
                  />
                  <Pressable style={styles.customColorAddBtn} onPress={handleAddCustomColor}>
                    <Text style={styles.customColorAddBtnText}>Add</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.pillsWrap}>
                {COLOR_PRESETS.map((c) => {
                  const isSel = selectedColors.some(
                    (sc) => sc.hex.toLowerCase() === c.hex.toLowerCase(),
                  );
                  return (
                    <Pressable
                      key={c.hex}
                      onPress={() => toggleColorSelect(c)}
                      style={[styles.colorPill, isSel && styles.colorPillActive]}
                    >
                      <View style={[styles.colorDot, { backgroundColor: c.hex }]} />
                      <Text style={[styles.colorPillText, isSel && styles.colorPillTextActive]}>
                        {c.name}
                      </Text>
                      {isSel && <Ionicons name="checkmark" size={14} color="#F10505" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Sizes Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Available Sizes</Text>
              <View style={styles.pillsWrap}>
                {SIZE_PRESETS.map((sz) => {
                  const isSel = selectedSizes.includes(sz);
                  return (
                    <Pressable
                      key={sz}
                      onPress={() => toggleSizeSelect(sz)}
                      style={[styles.sizePill, isSel && styles.sizePillActive]}
                    >
                      <Text style={[styles.sizePillText, isSel && styles.sizePillTextActive]}>
                        {sz}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Product Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter product specifications, fabric info, care instructions..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                style={[styles.textInput, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
              />
            </View>

            {/* Modal Bottom Save Action Buttons */}
            <View style={styles.modalActionsRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText} numberOfLines={1}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
                disabled={isSaving || isUploadingImage}
                onPress={handleSaveSubmit}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText} numberOfLines={1}>
                      {editingProduct ? 'Save Changes' : 'Publish Product'}
                    </Text>
                  </>
                )}
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
    backgroundColor: '#F8FAFC',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  topHeaderTitleBox: {
    flex: 1,
    marginRight: 10,
    minWidth: 0,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F10505',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 4,
    flexShrink: 0,
    shadowColor: '#F10505',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 96,
    gap: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricCardTextContent: {
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  valueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  valueBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  valueBannerTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  valueBannerAmount: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 0,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#3F0106',
    borderColor: '#3F0106',
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F10505',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
    marginTop: 6,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  productsList: {
    gap: 14,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageBox: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexShrink: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  photosBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  photosBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: 4,
  },
  titlePriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  productTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    minWidth: 0,
    lineHeight: 18,
  },
  productPrice: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 0,
  },
  descText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  stockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 1,
  },
  stockChipIn: {
    backgroundColor: '#ECFDF5',
  },
  stockChipLow: {
    backgroundColor: '#FFFBEB',
  },
  stockChipOut: {
    backgroundColor: '#FEF2F2',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  stockChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 1,
  },
  statusTagPublished: {
    backgroundColor: '#F1F5F9',
  },
  statusTagDraft: {
    backgroundColor: '#FFF7ED',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTagTextPublished: {
    color: '#475569',
  },
  statusTagTextDraft: {
    color: '#C2410C',
  },
  optionsSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  optionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  optionsLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    width: 42,
  },
  colorsDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    flex: 1,
  },
  miniColorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  sizesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    flex: 1,
  },
  miniSizePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniSizeText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
  },
  actionBtnEdit: {
    flex: 1,
    minWidth: 90,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
  actionBtnEditText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnDuplicate: {
    flex: 1,
    minWidth: 85,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnDuplicateText: {
    color: '#3F0106',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnDelete: {
    flex: 1,
    minWidth: 75,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnDeleteText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Modal Styles - Safe Area Guarded */
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCloseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  modalScrollContent: {
    padding: 18,
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  inputGroup: {
    gap: 6,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  fieldSubLabel: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 4,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    color: '#0F172A',
    fontSize: 14,
  },
  currencyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    color: '#F10505',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusToggleOption: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  statusToggleOptionActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusToggleOptionActiveDraft: {
    backgroundColor: '#64748B',
    borderColor: '#64748B',
  },
  statusToggleText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  statusToggleTextActive: {
    color: '#FFFFFF',
  },

  /* Upload Cards */
  uploadCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadCard: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  uploadCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadCardTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  uploadCardSub: {
    color: '#64748B',
    fontSize: 10,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  urlInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    color: '#0F172A',
    fontSize: 13,
  },
  urlAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  uploadingText: {
    color: '#F10505',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbsContainer: {
    gap: 6,
    marginTop: 6,
  },
  thumbsCountText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  thumbWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F10505',
    paddingVertical: 2,
    alignItems: 'center',
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  thumbRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },

  /* Colors & Sizes Pills */
  addColorLink: {
    color: '#F10505',
    fontSize: 12,
    fontWeight: '700',
  },
  customColorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customColorAddBtn: {
    backgroundColor: '#3F0106',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customColorAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pillsWrap: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
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
    paddingHorizontal: 14,
    paddingVertical: 7,
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
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    shadowColor: '#F10505',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
