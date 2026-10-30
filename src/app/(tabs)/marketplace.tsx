import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as LinkingExpo from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminProductsView } from '../../components/admin/AdminProductsView';
import { apiRequest } from '../../services/api';
import { AuthUser, getStoredAccessToken, getStoredUser } from '../../services/auth';
import { addNotification } from '../../services/notificationsStorage';
import { getFirstName } from './profile';
import { colors, formatKobo, spacing } from '../../theme/colors';

type Product = {
  id: string;
  title: string;
  category: string;
  price: string;
  priceKobo: number;
  description: string;
  rating: string;
  reviewsCount: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  availableColors: { name: string; hex: string }[];
  availableSizes: string[];
};

type CartItem = {
  id: string;
  productId: string;
  title: string;
  price: string;
  priceKobo: number;
  color: string;
  size: string;
  quantity: number;
  icon: keyof typeof Ionicons.glyphMap;
};

type CustomAlert = {
  visible: boolean;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  primaryBtnText: string;
  onPrimaryPress: () => void;
  secondaryBtnText?: string;
  onSecondaryPress?: () => void;
};

const initialProducts: Product[] = [
  {
    id: '9b1deb4d-3b7d-4149-9cd1-e633d3170001',
    title: 'Gileo Dri-FIT Premium Scrubs Set',
    category: 'Gileo Scrubs',
    price: '₦28,500',
    priceKobo: 2850000,
    description:
      'Engineered with fluid-resistant, 4-way stretch fabric designed to help healthcare professionals stay comfortable during demanding shifts.',
    rating: '4.9',
    reviewsCount: 38,
    icon: 'shirt-outline',
    color: '#F10505',
    availableColors: [
      { name: 'Gileo Red', hex: '#F10505' },
      { name: 'Navy Blue', hex: '#1E3A8A' },
      { name: 'Olive Green', hex: '#365314' },
      { name: 'Midnight Black', hex: '#111111' },
    ],
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: '9b1deb4d-3b7d-4149-9cd1-e633d3170002',
    title: 'Clinical Dual-Head Stethoscope',
    category: 'Equipment',
    price: '₦35,000',
    priceKobo: 3500000,
    description:
      'Precision acoustic sensitivity for cardiac and pulmonary assessment with soft-sealing eartips.',
    rating: '4.8',
    reviewsCount: 24,
    icon: 'fitness-outline',
    color: '#059669',
    availableColors: [
      { name: 'Classic Black', hex: '#111111' },
      { name: 'Gileo Red', hex: '#F10505' },
    ],
    availableSizes: ['Standard'],
  },
  {
    id: '9b1deb4d-3b7d-4149-9cd1-e633d3170003',
    title: 'Digital Automatic BP Monitor',
    category: 'Accessories',
    price: '₦22,000',
    priceKobo: 2200000,
    description:
      'Clinical-grade digital blood pressure monitor with automatic pulse readout and memory logs.',
    rating: '4.7',
    reviewsCount: 19,
    icon: 'pulse-outline',
    color: '#4F46E5',
    availableColors: [{ name: 'White/Gray', hex: '#E2E8F0' }],
    availableSizes: ['Universal Cuff'],
  },
  {
    id: '9b1deb4d-3b7d-4149-9cd1-e633d3170004',
    title: 'Nurse Organizer Carry Backpack',
    category: 'Accessories',
    price: '₦18,000',
    priceKobo: 1800000,
    description:
      'Waterproof multi-compartment organizer backpack designed for clinical equipment, devices, and personal essentials.',
    rating: '4.9',
    reviewsCount: 42,
    icon: 'bag-handle-outline',
    color: '#B45309',
    availableColors: [
      { name: 'Dark Navy', hex: '#1E293B' },
      { name: 'Gileo Red', hex: '#F10505' },
    ],
    availableSizes: ['One Size'],
  },
];

const categories = ['All', 'Gileo Scrubs', 'Equipment', 'Accessories'];
const CART_STORAGE_KEY = '@gileo/persistent_user_cart';

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Product Selection Details State
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Order & Paystack Payment State
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);

  // Verification & Order Success State
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [confirmedOrderRef, setConfirmedOrderRef] = useState('');
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState('');

  // Shipping Form State
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Page Entrance Animations
  const pageFadeAnim = useRef(new Animated.Value(0)).current;
  const pageSlideAnim = useRef(new Animated.Value(18)).current;

  // Modal Animation Scale & Translate
  const modalScale = useRef(new Animated.Value(0.92)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Toast Notification Bubble State & Animation
  const [toastText, setToastText] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(-150)).current;

  // Custom Modern Alert Dialog State
  const [customAlert, setCustomAlert] = useState<CustomAlert>({
    visible: false,
    title: '',
    message: '',
    icon: 'checkmark-circle-outline',
    iconColor: '#10B981',
    primaryBtnText: 'OK',
    onPrimaryPress: () => {},
  });

  // 1. Persistent Cart Loading & User Load & Entrance Animation on Mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    async function initMarketplace() {
      const u = await getStoredUser();
      setUser(u);

      try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCart(parsed);
          }
        }
      } catch {
      } finally {
        setIsCartLoaded(true);
      }
    }
    void initMarketplace();
  }, [pageFadeAnim, pageSlideAnim]);

  const params = useLocalSearchParams<{ productId?: string }>();
  const handledProductParamRef = useRef<string | null>(null);

  useEffect(() => {
    if (params.productId && productsList.length > 0 && handledProductParamRef.current !== params.productId) {
      const target = productsList.find((p) => p.id === params.productId);
      if (target) {
        handledProductParamRef.current = params.productId;
        openProductDetail(target);
        router.setParams({ productId: undefined });
      }
    }
  }, [params.productId, productsList]);
  useEffect(() => {
    if (!isCartLoaded) return;
    async function saveCart() {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch {}
    }
    void saveCart();
  }, [cart, isCartLoaded]);

  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const fetched = await apiRequest<any[]>('/shop/products');
      if (Array.isArray(fetched) && fetched.length > 0) {
        const mapped: Product[] = fetched.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category?.name || 'Gileo Collection',
          price: formatKobo(p.priceKobo),
          priceKobo: p.priceKobo,
          description: p.description,
          rating: '4.9',
          reviewsCount: 15,
          icon: 'bag-handle-outline',
          color: '#F10505',
          availableColors: [
            { name: 'Gileo Red', hex: '#F10505' },
            { name: 'Navy Blue', hex: '#1E3A8A' },
          ],
          availableSizes: ['S', 'M', 'L', 'XL'],
        }));
        setProductsList(mapped);
      }
    } catch {}
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const u = await getStoredUser();
      setUser(u);
      await fetchProducts();
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  // Detail Modal Entrance Animation
  useEffect(() => {
    if (selectedProduct) {
      modalScale.setValue(0.92);
      modalOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedProduct, modalScale, modalOpacity]);

  const triggerToast = (message: string) => {
    setToastText(message);
    setIsToastVisible(true);
    toastAnim.setValue(-150);

    Animated.sequence([
      Animated.spring(toastAnim, {
        toValue: Math.max(insets.top, 12),
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastAnim, {
        toValue: -150,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsToastVisible(false);
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColor(product.availableColors[0]?.name || '');
    setSelectedSize(product.availableSizes[0] || '');
    setItemQuantity(1);
  };

  const closeProductDetail = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.92,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedProduct(null);
    });
  };

  const showAlertModal = (config: Omit<CustomAlert, 'visible'>) => {
    setCustomAlert({ ...config, visible: true });
  };

  const hideAlertModal = () => {
    setCustomAlert((prev) => ({ ...prev, visible: false }));
  };

  const addToCart = (product: Product, quantity = 1) => {
    const color = selectedColor || product.availableColors[0]?.name || 'Default';
    const size = selectedSize || product.availableSizes[0] || 'Standard';
    const cartItemId = `${product.id}-${color}-${size}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          title: product.title,
          price: product.price,
          priceKobo: product.priceKobo,
          color,
          size,
          quantity,
          icon: product.icon,
        },
      ];
    });

    closeProductDetail();
    triggerToast(`${product.title} added to cart!`);
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const cartTotalKobo = cart.reduce((sum, item) => sum + item.priceKobo * item.quantity, 0);
  const cartTotalFormatted = formatKobo(cartTotalKobo);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const verifyPaymentWithBackend = async (ref: string, totalAmountFormatted?: string) => {
    if (!ref) return;
    setIsVerifyingPayment(true);
    try {
      const res = await apiRequest<any>(`/payments/verify/${encodeURIComponent(ref)}`, {
        method: 'POST',
      });

      if (res?.status === 'success' || res?.status === 'VERIFIED') {
        setCart([]);
        void AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
        setConfirmedOrderRef(ref);
        if (totalAmountFormatted) {
          setConfirmedOrderTotal(totalAmountFormatted);
        }
        setShowOrderSuccessModal(true);

        const currentU = user || (await getStoredUser());
        void addNotification(currentU?.id || 'guest', {
          title: 'Payment Successful',
          body: `Order ${ref} has been verified and paid successfully!`,
          icon: 'bag-check',
          iconBg: '#ECFDF5',
          iconColor: '#10B981',
        });
      } else {
        showAlertModal({
          title: 'Payment Unconfirmed',
          message:
            'Your payment could not be confirmed immediately by Paystack. If you were charged, please check your profile orders shortly.',
          icon: 'alert-circle-outline',
          iconColor: '#F59E0B',
          primaryBtnText: 'OK',
          onPrimaryPress: hideAlertModal,
        });
      }
    } catch (error) {
      showAlertModal({
        title: 'Payment Verification Error',
        message:
          error instanceof Error
            ? error.message
            : 'Could not verify payment with the server.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
        primaryBtnText: 'OK',
        onPrimaryPress: hideAlertModal,
      });
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  useEffect(() => {
    void LinkingExpo.getInitialURL().then((url) => {
      if (url && url.includes('payment-callback')) {
        try {
          WebBrowser.dismissBrowser();
          WebBrowser.dismissAuthSession();
        } catch (_) {}
        const parsed = LinkingExpo.parse(url);
        const ref = parsed.queryParams?.reference || parsed.queryParams?.trxref;
        if (ref) {
          void verifyPaymentWithBackend(String(ref));
        }
      }
    });

    const handleDeepLink = (event: { url: string }) => {
      if (event.url && event.url.includes('payment-callback')) {
        try {
          WebBrowser.dismissBrowser();
          WebBrowser.dismissAuthSession();
        } catch (_) {}
        const parsed = LinkingExpo.parse(event.url);
        const ref = parsed.queryParams?.reference || parsed.queryParams?.trxref;
        if (ref) {
          void verifyPaymentWithBackend(String(ref));
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleCheckoutSubmit = async () => {
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      showAlertModal({
        title: 'Missing Details',
        message: 'Please fill in your name, phone number, and delivery address to proceed.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
        primaryBtnText: 'OK',
        onPrimaryPress: hideAlertModal,
      });
      return;
    }

    const token = await getStoredAccessToken();
    if (!token) {
      showAlertModal({
        title: 'Sign In Required',
        message: 'Please sign in to your Gileo account to complete your Paystack checkout.',
        icon: 'lock-closed-outline',
        iconColor: '#F10505',
        primaryBtnText: 'Sign In',
        onPrimaryPress: () => {
          hideAlertModal();
          setShowCheckoutModal(false);
          router.push('/login');
        },
        secondaryBtnText: 'Cancel',
        onSecondaryPress: hideAlertModal,
      });
      return;
    }

    setIsSubmittingOrder(true);
    const totalFormatted = cartTotalFormatted;

    try {
      const order = await apiRequest<any>('/shop/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            name: shippingName,
            phone: shippingPhone,
            address: shippingAddress,
          },
        }),
      });

      if (!order?.id) {
        throw new Error('Could not create your order on the server.');
      }

      const paymentRes = await apiRequest<any>('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({
          purchaseType: 'SHOP_ORDER',
          targetId: order.id,
        }),
      });

      if (!paymentRes?.authorizationUrl) {
        throw new Error('Paystack initialization failed. Please check your backend setup.');
      }

      const authUrl = paymentRes.authorizationUrl;
      const ref = paymentRes.reference || order.reference || 'GILEO-ORDER';
      setShowCheckoutModal(false);

      const redirectUrl = LinkingExpo.createURL('payment-callback');
      const browserResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl).catch(
        async () => {
          await Linking.openURL(authUrl);
          return null;
        },
      );

      try {
        WebBrowser.dismissBrowser();
        WebBrowser.dismissAuthSession();
      } catch (_) {}

      let returnedRef = ref;
      if (browserResult && browserResult.type === 'success' && browserResult.url) {
        const parsed = LinkingExpo.parse(browserResult.url);
        if (parsed.queryParams?.reference || parsed.queryParams?.trxref) {
          returnedRef = String(parsed.queryParams.reference || parsed.queryParams.trxref);
        }
      }

      // Cross-check payment with the backend
      await verifyPaymentWithBackend(returnedRef, totalFormatted);
    } catch (error) {
      showAlertModal({
        title: 'Checkout Error',
        message:
          error instanceof Error
            ? error.message
            : 'We could not complete your Paystack checkout. Please try again.',
        icon: 'card-outline',
        iconColor: '#EF4444',
        primaryBtnText: 'Try Again',
        onPrimaryPress: hideAlertModal,
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const filteredProducts = productsList.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      searchQuery === '' || p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const firstName = getFirstName(user);

  if (user?.role === 'ADMIN') {
    return <AdminProductsView />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Toast Notification Banner (Positioned directly below status bar) */}
      {isToastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { top: Math.max(insets.top, 12), transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Ionicons name="bag-check" size={20} color="#FFFFFF" />
          <Text style={styles.toastText} numberOfLines={1}>
            {toastText}
          </Text>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F10505"
            colors={['#F10505']}
          />
        }
      >
        <Animated.View
          style={{
            gap: 16,
            opacity: pageFadeAnim,
            transform: [{ translateY: pageSlideAnim }],
          }}
        >
          {/* Top Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingSubTitle}>Hello, {firstName} 👋</Text>
              <Text style={styles.headerTitle}>Gileo Marketplace</Text>
            </View>

            <View style={styles.headerRight}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowCartModal(true)}
                style={({ pressed }) => [styles.cartButton, pressed && styles.pressed]}
              >
                <Ionicons name="bag-handle-outline" size={22} color="#0F172A" />
                {totalCartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Search Input Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Gileo Scrubs, stethoscope..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Product Catalog Grid OR Empty Search View */}
          {filteredProducts.length === 0 ? (
            <View style={styles.noResultContainer}>
              <View style={styles.noResultIconBox}>
                <Ionicons name="search-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.noResultTitle}>No results found</Text>
              <Text style={styles.noResultSub}>
                We couldn't find any items matching "{searchQuery}".
              </Text>
              <Pressable
                style={styles.clearSearchBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                <Text style={styles.clearSearchBtnText}>Clear Search</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => {
                const isFav = Boolean(favorites[product.id]);
                return (
                  <Pressable
                    key={product.id}
                    accessibilityRole="button"
                    onPress={() => openProductDetail(product)}
                    style={({ pressed }) => [styles.productCard, pressed && styles.pressed]}
                  >
                    <View style={styles.cardImageContainer}>
                      <Ionicons name={product.icon} size={52} color={product.color} />
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                        hitSlop={8}
                        style={styles.favButton}
                      >
                        <Ionicons
                          name={isFav ? 'heart' : 'heart-outline'}
                          size={18}
                          color={isFav ? '#EF4444' : '#64748B'}
                        />
                      </Pressable>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {product.title}
                      </Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>{product.rating} ({product.reviewsCount})</Text>
                      </View>

                      <View style={styles.cardPriceRow}>
                        <Text style={styles.cardPrice}>{product.price}</Text>
                        <View style={styles.addPillBtn}>
                          <Ionicons name="add" size={16} color="#F10505" />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Animated Product Detail Modal */}
          <Modal
            visible={Boolean(selectedProduct)}
            animationType="fade"
            transparent
            onRequestClose={closeProductDetail}
          >
            {selectedProduct && (
              <View style={styles.detailOverlay}>
                <Animated.View
                  style={[
                    styles.detailModalSheet,
                    {
                      opacity: modalOpacity,
                      transform: [{ scale: modalScale }],
                    },
                  ]}
                >
                  <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.detailHeader}>
                      <Pressable onPress={closeProductDetail} style={styles.circleBtn}>
                        <Ionicons name="arrow-back" size={20} color="#0F172A" />
                      </Pressable>

                      <Pressable
                        onPress={() => toggleFavorite(selectedProduct.id)}
                        style={styles.circleBtn}
                      >
                        <Ionicons
                          name={favorites[selectedProduct.id] ? 'heart' : 'heart-outline'}
                          size={20}
                          color={favorites[selectedProduct.id] ? '#EF4444' : '#0F172A'}
                        />
                      </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.detailScrollContent}>
                      <View style={styles.showcaseBox}>
                        <Ionicons name={selectedProduct.icon} size={110} color={selectedProduct.color} />
                      </View>

                      <View style={styles.detailTitleRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailTitle}>{selectedProduct.title}</Text>
                          <View style={styles.detailRatingRow}>
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text style={styles.detailRatingText}>
                              {selectedProduct.rating} ({selectedProduct.reviewsCount} Reviews)
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.detailPrice}>{selectedProduct.price}</Text>
                      </View>

                      <View style={styles.sectionGroup}>
                        <Text style={styles.sectionHeaderTitle}>Details</Text>
                        <Text style={styles.detailDescriptionText}>
                          {selectedProduct.description}
                        </Text>
                      </View>

                      {/* Color Swatches */}
                      <View style={styles.sectionGroup}>
                        <Text style={styles.sectionHeaderTitle}>Color:</Text>
                        <View style={styles.colorsRow}>
                          {selectedProduct.availableColors.map((c) => {
                            const isSelected = selectedColor === c.name;
                            return (
                              <Pressable
                                key={c.name}
                                onPress={() => setSelectedColor(c.name)}
                                style={[
                                  styles.colorSwatch,
                                  { backgroundColor: c.hex },
                                  isSelected && styles.colorSwatchSelected,
                                ]}
                              >
                                {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>

                      {/* Size Chips */}
                      <View style={styles.sectionGroup}>
                        <Text style={styles.sectionHeaderTitle}>Size:</Text>
                        <View style={styles.sizesRow}>
                          {selectedProduct.availableSizes.map((size) => {
                            const isSelected = selectedSize === size;
                            return (
                              <Pressable
                                key={size}
                                onPress={() => setSelectedSize(size)}
                                style={[styles.sizeChip, isSelected && styles.sizeChipSelected]}
                              >
                                <Text style={[styles.sizeText, isSelected && styles.sizeTextSelected]}>
                                  {size}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>

                      {/* Stepper */}
                      <View style={styles.sectionGroup}>
                        <Text style={styles.sectionHeaderTitle}>Quantity:</Text>
                        <View style={styles.stepperRow}>
                          <Pressable
                            onPress={() => setItemQuantity((q) => Math.max(1, q - 1))}
                            style={styles.stepperBtn}
                          >
                            <Ionicons name="remove" size={18} color="#0F172A" />
                          </Pressable>
                          <Text style={styles.stepperValue}>{itemQuantity}</Text>
                          <Pressable
                            onPress={() => setItemQuantity((q) => q + 1)}
                            style={styles.stepperBtn}
                          >
                            <Ionicons name="add" size={18} color="#0F172A" />
                          </Pressable>
                        </View>
                      </View>
                    </ScrollView>

                    <View style={styles.detailFooter}>
                      <Pressable
                        style={styles.addCartBtn}
                        onPress={() => addToCart(selectedProduct, itemQuantity)}
                      >
                        <Text style={styles.addCartBtnText}>Add to Cart</Text>
                      </Pressable>

                      <Pressable
                        style={styles.buyNowBtn}
                        onPress={() => {
                          addToCart(selectedProduct, itemQuantity);
                          setShowCartModal(true);
                        }}
                      >
                        <Text style={styles.buyNowBtnText}>Buy Now</Text>
                      </Pressable>
                    </View>
                  </SafeAreaView>
                </Animated.View>
              </View>
            )}
          </Modal>

          {/* Cart Modal */}
          <Modal
            visible={showCartModal}
            animationType="slide"
            onRequestClose={() => setShowCartModal(false)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.detailHeader}>
                <Pressable onPress={() => setShowCartModal(false)} style={styles.circleBtn}>
                  <Ionicons name="close" size={20} color="#0F172A" />
                </Pressable>
                <Text style={styles.cartHeaderTitle}>Your Cart ({totalCartCount})</Text>
                <View style={{ width: 40 }} />
              </View>

              {cart.length === 0 ? (
                <View style={styles.emptyCartContainer}>
                  <Ionicons name="bag-handle-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                  <Text style={styles.emptyCartSub}>Add medical supplies to your cart.</Text>
                </View>
              ) : (
                <>
                  <ScrollView contentContainerStyle={styles.cartListContent}>
                    {cart.map((item) => (
                      <View key={item.id} style={styles.cartItemCard}>
                        <View style={styles.cartIconBox}>
                          <Ionicons name={item.icon} size={28} color="#F10505" />
                        </View>

                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={styles.cartItemTitle}>{item.title}</Text>
                          <Text style={styles.cartItemMeta}>Size: {item.size} • Color: {item.color}</Text>
                          <Text style={styles.cartItemPrice}>{item.price}</Text>
                        </View>

                        <View style={styles.stepperRowSmall}>
                          <Pressable onPress={() => updateCartQuantity(item.id, -1)} style={styles.stepperBtnSmall}>
                            <Ionicons name="remove" size={14} color="#0F172A" />
                          </Pressable>
                          <Text style={styles.stepperValueSmall}>{item.quantity}</Text>
                          <Pressable onPress={() => updateCartQuantity(item.id, 1)} style={styles.stepperBtnSmall}>
                            <Ionicons name="add" size={14} color="#0F172A" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.cartFooter}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal</Text>
                      <Text style={styles.totalValue}>{cartTotalFormatted}</Text>
                    </View>

                    <Pressable
                      style={styles.checkoutBtn}
                      onPress={() => {
                        setShowCartModal(false);
                        setShowCheckoutModal(true);
                        setOrderConfirmed(false);
                      }}
                    >
                      <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </SafeAreaView>
          </Modal>

          {/* Checkout Modal */}
          <Modal
            visible={showCheckoutModal}
            animationType="slide"
            onRequestClose={() => setShowCheckoutModal(false)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.detailHeader}>
                <Pressable onPress={() => setShowCheckoutModal(false)} style={styles.circleBtn}>
                  <Ionicons name="close" size={20} color="#0F172A" />
                </Pressable>
                <Text style={styles.cartHeaderTitle}>Paystack Checkout</Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView contentContainerStyle={styles.checkoutContent}>
                <View style={styles.paystackNoticeBox}>
                  <Ionicons name="shield-checkmark" size={22} color="#F10505" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.paystackNoticeTitle}>Secure Paystack Payment</Text>
                    <Text style={styles.paystackNoticeSub}>Pay securely via Debit/Credit card or Transfer.</Text>
                  </View>
                </View>

                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionHeaderTitle}>Delivery Details</Text>
                  <TextInput
                    value={shippingName}
                    onChangeText={setShippingName}
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                    style={styles.inputField}
                  />
                  <TextInput
                    value={shippingPhone}
                    onChangeText={setShippingPhone}
                    placeholder="Phone Number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    style={styles.inputField}
                    />
                    <TextInput
                      value={shippingAddress}
                      onChangeText={setShippingAddress}
                      placeholder="Delivery Address"
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                      style={[styles.inputField, { height: 80 }]}
                    />
                  </View>

                  <Pressable
                    style={[styles.checkoutBtn, isSubmittingOrder && { opacity: 0.6 }]}
                    disabled={isSubmittingOrder}
                    onPress={handleCheckoutSubmit}
                  >
                    <Text style={styles.checkoutBtnText}>
                      {isSubmittingOrder ? 'Initializing...' : `Pay ${cartTotalFormatted} with Paystack`}
                    </Text>
                  </Pressable>
                </ScrollView>
            </SafeAreaView>
          </Modal>

          {/* Order Success Modal */}
          <Modal
            visible={showOrderSuccessModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowOrderSuccessModal(false)}
          >
            <View style={styles.successModalOverlay}>
              <View style={styles.successCard}>
                <View style={styles.successBadgeBox}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                </View>

                <Text style={styles.successHeading}>Your order was successful!</Text>
                <Text style={styles.successMessage}>
                  Thank you for your purchase. We have verified your payment with the server and your order is being processed.
                </Text>

                {confirmedOrderRef ? (
                  <View style={styles.orderRefBadge}>
                    <Text style={styles.orderRefLabel}>ORDER REFERENCE</Text>
                    <Text style={styles.orderRefValue}>{confirmedOrderRef}</Text>
                  </View>
                ) : null}

                {confirmedOrderTotal ? (
                  <Text style={styles.orderTotalPaidText}>Total Paid: {confirmedOrderTotal}</Text>
                ) : null}

                <View style={styles.successActionButtons}>
                  <Pressable
                    style={styles.primarySuccessBtn}
                    onPress={() => setShowOrderSuccessModal(false)}
                  >
                    <Text style={styles.primarySuccessBtnText}>Continue Shopping</Text>
                  </Pressable>

                  <Pressable
                    style={styles.secondarySuccessBtn}
                    onPress={() => {
                      setShowOrderSuccessModal(false);
                      router.push('/profile');
                    }}
                  >
                    <Text style={styles.secondarySuccessBtnText}>View Orders</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* Verifying Payment Overlay */}
          <Modal
            visible={isVerifyingPayment}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
          >
            <View style={styles.verifyingModalOverlay}>
              <View style={styles.verifyingCard}>
                <ActivityIndicator size="large" color="#F10505" />
                <Text style={styles.verifyingTitle}>Verifying Payment...</Text>
                <Text style={styles.verifyingSub}>Confirming transaction with Gileo server</Text>
              </View>
            </View>
          </Modal>

          {/* Alert Modal */}
          <Modal
            visible={customAlert.visible}
            transparent
            animationType="fade"
            onRequestClose={hideAlertModal}
          >
            <Pressable style={styles.customAlertOverlay} onPress={hideAlertModal}>
              <Pressable style={styles.customAlertCard} onPress={(e) => e.stopPropagation()}>
                <View style={[styles.customAlertIconBox, { backgroundColor: customAlert.iconColor + '18' }]}>
                  <Ionicons name={customAlert.icon} size={32} color={customAlert.iconColor} />
                </View>

                <Text style={styles.customAlertTitle}>{customAlert.title}</Text>
                <Text style={styles.customAlertMessage}>{customAlert.message}</Text>

                <View style={styles.customAlertActions}>
                  {customAlert.secondaryBtnText && (
                    <Pressable style={styles.customAlertSecondaryBtn} onPress={customAlert.onSecondaryPress}>
                      <Text style={styles.customAlertSecondaryText}>{customAlert.secondaryBtnText}</Text>
                    </Pressable>
                  )}

                  <Pressable style={styles.customAlertPrimaryBtn} onPress={customAlert.onPrimaryPress}>
                    <Text style={styles.customAlertPrimaryText}>{customAlert.primaryBtnText}</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 96,
    gap: 16,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#F10505',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingSubTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  searchBarContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  categoriesRow: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryPillActive: {
    backgroundColor: '#F10505',
  },
  categoryText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardImageContainer: {
    width: '100%',
    height: 125,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    gap: 4,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  cardPrice: {
    color: '#F10505',
    fontSize: 15,
    fontWeight: '800',
  },
  addPillBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  noResultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  noResultIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  noResultSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  clearSearchBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111111',
    marginTop: 4,
  },
  clearSearchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  detailModalSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
  },
  showcaseBox: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  detailRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  detailRatingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  detailPrice: {
    color: '#F10505',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionGroup: {
    gap: 8,
  },
  sectionHeaderTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  detailDescriptionText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sizeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  sizeChipSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  sizeText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  sizeTextSelected: {
    color: '#FFFFFF',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addCartBtn: {
    flex: 1,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCartBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  buyNowBtn: {
    flex: 1,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cartHeaderTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyCartTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCartSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  cartListContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  cartIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  cartItemMeta: {
    color: '#64748B',
    fontSize: 11,
  },
  cartItemPrice: {
    color: '#F10505',
    fontSize: 13,
    fontWeight: '800',
  },
  stepperRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueSmall: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cartFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  checkoutBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  checkoutContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  paystackNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  paystackNoticeTitle: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
  },
  paystackNoticeSub: {
    color: '#9F1239',
    fontSize: 12,
    lineHeight: 18,
  },
  inputField: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
  },
  orderSuccessContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  successRef: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
  },
  paystackLaunchBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  paystackLaunchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  customAlertCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  customAlertIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  customAlertTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  customAlertMessage: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  customAlertActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  customAlertPrimaryBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  customAlertSecondaryBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertSecondaryText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 8,
  },
  successBadgeBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successHeading: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  successMessage: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  orderRefBadge: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  orderRefLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  orderRefValue: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  orderTotalPaidText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '800',
  },
  successActionButtons: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  primarySuccessBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySuccessBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondarySuccessBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondarySuccessBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  verifyingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  verifyingCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  verifyingTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  verifyingSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
});
