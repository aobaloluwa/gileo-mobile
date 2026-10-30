import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
};

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
    setShowModal(true);
  };

  const handleOpenEdit = (p: AdminProduct) => {
    setEditingProduct(p);
    setTitle(p.title);
    setPriceNaira(String(Math.floor((p.priceKobo || 0) / 100)));
    setStock(String(p.stock || 0));
    setDescription(p.description || '');
    setShowModal(true);
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
          }),
        });
        setToastText('Product created!');
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
      <View style={styles.topHeader}>
        <Text style={styles.headerSub}>Admin Controls</Text>
        <Text style={styles.headerTitle}>Marketplace Products</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />}
      >
        <Pressable style={styles.primaryAddBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.primaryAddBtnText}>Add New Marketplace Product</Text>
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

                <View style={styles.actionRow}>
                  <Pressable style={styles.editBtn} onPress={() => handleOpenEdit(p)}>
                    <Text style={styles.editBtnText}>Edit Product</Text>
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 20, gap: 14 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
            {editingProduct ? 'Edit Marketplace Product' : 'Add New Product'}
          </Text>

          <Text style={styles.fieldLabel}>Product Title *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Title" style={styles.modalInput} />

          <Text style={styles.fieldLabel}>Price (₦ Naira) *</Text>
          <TextInput value={priceNaira} onChangeText={setPriceNaira} placeholder="28500" keyboardType="numeric" style={styles.modalInput} />

          <Text style={styles.fieldLabel}>Stock Units *</Text>
          <TextInput value={stock} onChangeText={setStock} placeholder="10" keyboardType="numeric" style={styles.modalInput} />

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Details..." multiline numberOfLines={3} style={[styles.modalInput, { height: 80 }]} />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 'auto' }}>
            <Pressable style={{ flex: 1, height: 48, borderRadius: 999, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }} onPress={() => setShowModal(false)}>
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>Cancel</Text>
            </Pressable>
            <Pressable style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: '#F10505', alignItems: 'center', justifyContent: 'center' }} disabled={isSaving} onPress={handleSaveSubmit}>
              <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>{isSaving ? 'Saving...' : 'Save Product'}</Text>
            </Pressable>
          </View>
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
  fieldLabel: {
    color: '#0F172A',
    fontSize: 13,
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
});
