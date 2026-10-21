import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../../services/api';
import { getStoredAccessToken } from '../../services/auth';
import { colors, spacing } from '../../theme';

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
    color: '#761B36',
    availableColors: [
      { name: 'Gileo Wine', hex: '#761B36' },
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
      { name: 'Burgundy', hex: '#761B36' },
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
      { name: 'Gileo Wine', hex: '#761B36' },
    ],
    availableSizes: ['One Size'],
  },
];

const categories = ['All', 'Gileo Scrubs', 'Equipment', 'Accessories'];

export default function MarketplaceScreen() {
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
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Order & Paystack Payment State
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);

  // Shipping Form State
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

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

  // Load products from backend if available
  useEffect(() => {
    async function loadBackendProducts() {
      try {
        const fetched = await apiRequest<any[]>('/shop/products');
        if (Array.isArray(fetched) && fetched.length > 0) {
          const mapped: Product[] = fetched.map((p) => ({
            id: p.id,
            title: p.title,
            category: p.category?.name || 'Gileo Collection',
            price: `₦${(p.priceKobo / 100).toLocaleString()}`,
            priceKobo: p.priceKobo,
            description: p.description,
            rating: '4.9',
            reviewsCount: 15,
            icon: 'bag-handle-outline',
            color: '#761B36',
            availableColors: [
              { name: 'Gileo Wine', hex: '#761B36' },
              { name: 'Navy Blue', hex: '#1E3A8A' },
            ],
            availableSizes: ['S', 'M', 'L', 'XL'],
          }));
          setProductsList(mapped);
        }
      } catch {
        // Keep initial demo products if backend is not reachable
      }
    }
    void loadBackendProducts();
  }, []);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColor(product.availableColors[0]?.name || '');
    setSelectedSize(product.availableSizes[0] || '');
    setItemQuantity(1);
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

    showAlertModal({
      title: 'Added to Cart',
      message: `${product.title} (${size}, ${color}) has been added to your cart.`,
      icon: 'bag-check-outline',
      iconColor: '#10B981',
      primaryBtnText: 'View Cart',
      onPrimaryPress: () => {
        hideAlertModal();
        setSelectedProduct(null);
        setShowCartModal(true);
      },
      secondaryBtnText: 'Continue Shopping',
      onSecondaryPress: () => {
        hideAlertModal();
      },
    });
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
  const cartTotalFormatted = `₦${(cartTotalKobo / 100).toLocaleString()}`;
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
        iconColor: '#761B36',
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

    try {
      // 1. Create order on backend
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

      // 2. Initialize Paystack Transaction via backend
      const paymentRes = await apiRequest<any>('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({
          purchaseType: 'SHOP_ORDER',
          targetId: order.id,
        }),
      });

      if (!paymentRes?.authorizationUrl) {
        throw new Error('Paystack initialization failed. Please check your payment details.');
      }

      const authUrl = paymentRes.authorizationUrl;
      setPaystackUrl(authUrl);
      setOrderRef(order.reference || paymentRes.reference || 'GILEO-ORDER');
      setOrderConfirmed(true);
      setCart([]);

      // 3. Launch Paystack Portal in-app WebBrowser
      await WebBrowser.openBrowserAsync(authUrl).catch(() => {
        void Linking.openURL(authUrl);
      });
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Welcome, Nurse! 👋</Text>
            <Text style={styles.headerTitle}>Gileo Marketplace</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowCartModal(true)}
              style={styles.cartButton}
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
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Gileo Scrubs, stethoscope, supplies..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          <View style={styles.searchBtn}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </View>
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

        {/* Product Catalog Grid OR Empty Search Result View */}
        {filteredProducts.length === 0 ? (
          <View style={styles.noResultContainer}>
            <View style={styles.noResultIconBox}>
              <Ionicons name="search-outline" size={40} color="#94A3B8" />
            </View>
            <Text style={styles.noResultTitle}>No results found</Text>
            <Text style={styles.noResultSub}>
              We couldn't find any items matching "{searchQuery}". Try searching for scrubs, stethoscope, or supplies.
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
                  {/* Image Container */}
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

                  {/* Info Container */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {product.title}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>
                        {product.rating} ({product.reviewsCount})
                      </Text>
                    </View>
                    <Text style={styles.cardPrice}>{product.price}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Product Detail Modal */}
        <Modal
          visible={Boolean(selectedProduct)}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedProduct(null)}
        >
          {selectedProduct && (
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.detailHeader}>
                <Pressable onPress={() => setSelectedProduct(null)} style={styles.circleBtn}>
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
                {/* Showcase Banner */}
                <View style={styles.showcaseBox}>
                  <Ionicons name={selectedProduct.icon} size={110} color={selectedProduct.color} />
                  <View style={styles.showcaseDots}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </View>

                {/* Title & Price Header */}
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

                {/* Details Description */}
                <View style={styles.sectionGroup}>
                  <Text style={styles.sectionHeaderTitle}>Details</Text>
                  <Text style={styles.detailDescriptionText}>
                    {selectedProduct.description}
                  </Text>
                </View>

                {/* Color Selection Swatches */}
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

                {/* Size Selection Chips */}
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

                {/* Quantity Stepper */}
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

              {/* Detail Action Footer */}
              <View style={styles.detailFooter}>
                <Pressable
                  style={styles.addCartBtn}
                  onPress={() => {
                    addToCart(selectedProduct, itemQuantity);
                  }}
                >
                  <Text style={styles.addCartBtnText}>Add to Cart</Text>
                </Pressable>

                <Pressable
                  style={styles.buyNowBtn}
                  onPress={() => {
                    addToCart(selectedProduct, itemQuantity);
                    setSelectedProduct(null);
                    setShowCartModal(true);
                  }}
                >
                  <Text style={styles.buyNowBtnText}>Buy Now</Text>
                </Pressable>
              </View>
            </SafeAreaView>
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
                <Text style={styles.emptyCartSub}>
                  Explore the marketplace and add items to your cart.
                </Text>
              </View>
            ) : (
              <>
                <ScrollView contentContainerStyle={styles.cartListContent}>
                  {cart.map((item) => (
                    <View key={item.id} style={styles.cartItemCard}>
                      <View style={styles.cartIconBox}>
                        <Ionicons name={item.icon} size={28} color="#761B36" />
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.cartItemTitle}>{item.title}</Text>
                        <Text style={styles.cartItemMeta}>
                          Size: {item.size} • Color: {item.color}
                        </Text>
                        <Text style={styles.cartItemPrice}>{item.price}</Text>
                      </View>

                      <View style={styles.stepperRowSmall}>
                        <Pressable
                          onPress={() => updateCartQuantity(item.id, -1)}
                          style={styles.stepperBtnSmall}
                        >
                          <Ionicons name="remove" size={14} color="#0F172A" />
                        </Pressable>
                        <Text style={styles.stepperValueSmall}>{item.quantity}</Text>
                        <Pressable
                          onPress={() => updateCartQuantity(item.id, 1)}
                          style={styles.stepperBtnSmall}
                        >
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

        {/* Checkout Modal with Direct Paystack Payment Integration */}
        <Modal
          visible={showCheckoutModal}
          animationType="slide"
          onRequestClose={() => setShowCheckoutModal(false)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.detailHeader}>
              <Pressable
                onPress={() => setShowCheckoutModal(false)}
                style={styles.circleBtn}
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </Pressable>
              <Text style={styles.cartHeaderTitle}>Paystack Checkout</Text>
              <View style={{ width: 40 }} />
            </View>

            {orderConfirmed ? (
              <View style={styles.orderSuccessContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.successTitle}>Order Created!</Text>
                <Text style={styles.successRef}>Ref: {orderRef}</Text>
                <Text style={styles.successSub}>
                  Your order is ready for payment. Complete your checkout securely on the Paystack gateway:
                </Text>

                {paystackUrl && (
                  <Pressable
                    style={styles.paystackLaunchBtn}
                    onPress={() => {
                      void WebBrowser.openBrowserAsync(paystackUrl).catch(() => {
                        void Linking.openURL(paystackUrl);
                      });
                    }}
                  >
                    <Ionicons name="card" size={18} color="#FFFFFF" />
                    <Text style={styles.paystackLaunchBtnText}>Open Paystack Gateway</Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.checkoutBtn}
                  onPress={() => {
                    setShowCheckoutModal(false);
                    setOrderConfirmed(false);
                    setPaystackUrl(null);
                  }}
                >
                  <Text style={styles.checkoutBtnText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.checkoutContent}>
                <View style={styles.paystackNoticeBox}>
                  <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.paystackNoticeTitle}>Secure Paystack Payment</Text>
                    <Text style={styles.paystackNoticeSub}>
                      Pay securely with Debit/Credit Card, Bank Transfer, or USSD via Paystack.
                    </Text>
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
                  <Ionicons name="card-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.checkoutBtnText}>
                    {isSubmittingOrder
                      ? 'Initializing Paystack...'
                      : `Pay ${cartTotalFormatted} with Paystack`}
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>

        {/* Custom Modern Alert Modal */}
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
                  <Pressable
                    style={styles.customAlertSecondaryBtn}
                    onPress={customAlert.onSecondaryPress}
                  >
                    <Text style={styles.customAlertSecondaryText}>
                      {customAlert.secondaryBtnText}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.customAlertPrimaryBtn}
                  onPress={customAlert.onPrimaryPress}
                >
                  <Text style={styles.customAlertPrimaryText}>
                    {customAlert.primaryBtnText}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '700',
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
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  searchBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesRow: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  categoryText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
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
    borderRadius: 22,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  cardImageContainer: {
    width: '100%',
    height: 130,
    borderRadius: 16,
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
    gap: 3,
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
    fontWeight: '500',
  },
  cardPrice: {
    color: '#761B36',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
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
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  noResultSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
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
    fontWeight: '600',
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
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    height: 240,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  showcaseDots: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#761B36',
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
    fontWeight: '700',
    letterSpacing: -0.4,
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
    fontWeight: '500',
  },
  detailPrice: {
    color: '#761B36',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionGroup: {
    gap: 8,
  },
  sectionHeaderTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
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
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#761B36',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    borderRadius: 18,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cartIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
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
    color: '#761B36',
    fontSize: 13,
    fontWeight: '700',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueSmall: {
    fontSize: 13,
    fontWeight: '700',
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
    fontWeight: '500',
  },
  totalValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700',
  },
  checkoutBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: '#761B36',
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
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  paystackNoticeTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '700',
  },
  paystackNoticeSub: {
    color: '#047857',
    fontSize: 12,
    lineHeight: 18,
  },
  paystackLaunchBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#059669',
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
  inputField: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '700',
  },
  successRef: {
    color: '#761B36',
    fontSize: 14,
    fontWeight: '700',
  },
  successSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
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
    borderRadius: 24,
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
    fontWeight: '700',
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
    backgroundColor: '#761B36',
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
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertSecondaryText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
});
