import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as LinkingExpo from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminCareRequestsView } from '../../components/admin/AdminCareRequestsView';
import { apiRequest } from '../../services/api';
import { AuthUser, getStoredAccessToken, getStoredUser } from '../../services/auth';
import { getFirstName } from './profile';
import { colors, formatKobo, spacing } from '../../theme/colors';

WebBrowser.maybeCompleteAuthSession();

type ServiceItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  audience?: string;
  whatIsIncluded?: string;
  priceKobo?: number;
  priceLabel?: string;
  isIndicative?: boolean;
};

type ServiceRequestItem = {
  id: string;
  reference: string;
  status: string;
  preferredDate?: string;
  location?: string;
  customerNote?: string;
  createdAt: string;
  service: ServiceItem;
  assignedProvider?: { id: string; displayName: string };
};

const defaultServices: ServiceItem[] = [
  {
    id: 's-1',
    title: 'Elderly Care & Post-Hospital Recovery',
    slug: 'elderly-care-post-hospital-recovery',
    description:
      'Dedicated nursing assistance, vitals monitoring, medication support, mobility aid, and recovery companionship for seniors and recovering patients.',
    audience: 'Seniors, elderly family members, or individuals recovering from major medical procedures.',
    whatIsIncluded:
      'Personalized care plan, daily vitals tracking, medication administration support, mobility assistance, and family updates.',
    priceKobo: 3500000,
    priceLabel: 'Custom Care Estimate • Contact Support',
  },
  {
    id: 's-2',
    title: 'On-Set & Production Medical Coverage',
    slug: 'onset-film-production-medical',
    description:
      'Dedicated on-set medical personnel and safety compliance for film sets, TV productions, commercials, and high-activity creative projects.',
    audience: 'Film directors, production managers, crew leads, and media agencies.',
    whatIsIncluded:
      'Continuous set standby, cast/crew safety triage, emergency first response, heat/exhaustion monitoring, and health compliance.',
    priceKobo: 6000000,
    priceLabel: 'Custom Production Quote • Contact Support',
  },
  {
    id: 's-3',
    title: 'Home-Service Wound Dressing & Clinical Nursing',
    slug: 'home-service-wound-dressing',
    description:
      'Professional clinical wound care, sterile dressing, suture removal, and post-procedure management delivered at your home by a registered nurse.',
    audience: 'Patients recovering from surgery, chronic wound management, or post-hospital discharge.',
    whatIsIncluded:
      'Sterile wound dressing change, clinical assessment, vitals check, physician notes coordination, and care instructions.',
    priceKobo: 2000000,
    priceLabel: '₦20,000 / session • Indicative Demo Pricing',
  },
  {
    id: 's-4',
    title: 'Event Medical Coverage & First Aid Standby',
    slug: 'event-medical-coverage',
    description:
      'On-site standby nurses, emergency response, and equipped first-aid coverage for public gatherings, sports events, and corporate functions.',
    audience: 'Event organizers, corporate event planners, and venue managers.',
    whatIsIncluded:
      'On-site registered nurses, emergency response kit, triage station setup, ambulance coordination, and incident reporting.',
    priceKobo: 5000000,
    priceLabel: 'Custom Event Quote • Contact Support',
  },
  {
    id: 's-5',
    title: 'Corporate & Organisational Medical Services',
    slug: 'corporate-organisational-medical',
    description:
      'On-site corporate wellness checks, employee health screenings, occupational health support, and executive wellness programs.',
    audience: 'HR departments, corporate organizations, and business executives.',
    whatIsIncluded:
      'Employee health screenings, ergonomic assessment, wellness lectures, occupational health reports, and quarterly reviews.',
    priceKobo: 10000000,
    priceLabel: 'Custom Corporate Retainer • Contact Support',
  },
  {
    id: 's-6',
    title: 'Healthcare Service Coordination & Concierge',
    slug: 'healthcare-service-coordination',
    description:
      'End-to-end medical concierge service: hospital appointment scheduling, specialist referrals, lab test home sample collection, and prescription delivery.',
    audience: 'Busy professionals, international patients, and families seeking seamless healthcare navigation.',
    whatIsIncluded:
      'Dedicated nurse coordinator, priority specialist referrals, home sample collection, prescription delivery, and medical record management.',
    priceKobo: 2500000,
    priceLabel: '₦25,000 / month • Concierge Access',
  },
  {
    id: 's-7',
    title: 'Community Health Outreach & Screenings',
    slug: 'community-health-outreaches',
    description:
      'Structured community health screenings, medical outreaches, blood pressure/glucose testing, and wellness education tailored for groups.',
    audience: 'NGOs, religious bodies, community leaders, and philanthropic organizations.',
    whatIsIncluded:
      'Mobile clinical team, health screening tools, vitals assessment, health education talks, and referral guidance.',
    priceKobo: 7500000,
    priceLabel: 'Custom Outreach Estimate • Contact Support',
  },
];

const getDateOptionChips = () => {
  const now = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const in3Days = new Date(now);
  in3Days.setDate(now.getDate() + 3);

  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  return [
    { label: 'Today', val: formatDate(today) },
    { label: 'Tomorrow', val: formatDate(tomorrow) },
    { label: 'In 3 Days', val: formatDate(in3Days) },
    { label: 'Next Week', val: formatDate(nextWeek) },
  ];
};

const formatReadableDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};


export function sortServicesInRequiredOrder(items: ServiceItem[]): ServiceItem[] {
  const getRank = (item: ServiceItem) => {
    const slug = (item.slug || '').toLowerCase();
    const title = (item.title || '').toLowerCase();

    if (slug.includes('elderly') || title.includes('elderly')) return 1;
    if (slug.includes('onset') || slug.includes('production') || title.includes('on-set') || title.includes('production')) return 2;
    if (slug.includes('wound') || title.includes('wound')) return 3;
    if (slug.includes('event') || title.includes('event')) return 4;
    if (slug.includes('corporate') || title.includes('corporate') || title.includes('organisational')) return 5;
    if (slug.includes('coordination') || slug.includes('concierge') || title.includes('coordination') || title.includes('concierge')) return 6;
    if (slug.includes('community') || title.includes('outreach')) return 7;
    return 99;
  };

  return [...items].sort((a, b) => getRank(a) - getRank(b));
}

export default function ServicesScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'my_requests'>('browse');

  // Services Data State
  const [services, setServices] = useState<ServiceItem[]>(() => sortServicesInRequiredOrder(defaultServices));
  const [myRequests, setMyRequests] = useState<ServiceRequestItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Service Detail Modal
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Booking Request Form State & Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [location, setLocation] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request Confirmation Success Modal
  const [confirmedRequestRef, setConfirmedRequestRef] = useState<string | null>(null);

  // Care Onboarding Form Modal
  const [onboardingTargetRequest, setOnboardingTargetRequest] = useState<ServiceRequestItem | null>(null);
  const [patientName, setPatientName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [careNotes, setCareNotes] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);

  // Paystack Payment Verification State
  const [isPayingRequest, setIsPayingRequest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Alert Dialog State
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
  }>({
    visible: false,
    title: '',
    message: '',
    icon: 'checkmark-circle-outline',
    iconColor: '#10B981',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  const loadServicesData = async () => {
    const u = await getStoredUser();
    setUser(u);

    // 1. Fetch published services from backend API
    try {
      const backendServices = await apiRequest<ServiceItem[]>('/services');
      if (Array.isArray(backendServices) && backendServices.length > 0) {
        setServices(sortServicesInRequiredOrder(backendServices));
      } else {
        setServices(sortServicesInRequiredOrder(defaultServices));
      }
    } catch {
      setServices(sortServicesInRequiredOrder(defaultServices));
    }

    // 2. Fetch my service requests from backend API if signed in
    try {
      const token = await getStoredAccessToken();
      if (token) {
        const requestsRes = await apiRequest<ServiceRequestItem[]>('/service-requests/mine');
        if (Array.isArray(requestsRes)) {
          setMyRequests(requestsRes);
        }
      }
    } catch {
      setMyRequests([]);
    }
  };

  const verifyServicePaymentWithBackend = async (ref: string) => {
    if (!ref) return;
    setIsVerifyingPayment(true);
    try {
      const res = await apiRequest<any>(`/payments/verify/${encodeURIComponent(ref)}`, {
        method: 'POST',
      });

      if (res?.status === 'success' || res?.status === 'VERIFIED') {
        setAlertInfo({
          visible: true,
          title: 'Payment Confirmed',
          message:
            'Your payment has been verified with Paystack! Please complete your confidential care onboarding form.',
          icon: 'checkmark-circle-outline',
          iconColor: '#10B981',
        });
        await loadServicesData();
      } else {
        setAlertInfo({
          visible: true,
          title: 'Payment Unconfirmed',
          message: 'Your payment could not be confirmed immediately. Please check back shortly.',
          icon: 'alert-circle-outline',
          iconColor: '#F59E0B',
        });
      }
    } catch (error) {
      setAlertInfo({
        visible: true,
        title: 'Verification Error',
        message: error instanceof Error ? error.message : 'Could not verify payment with server.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
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
          void verifyServicePaymentWithBackend(String(ref));
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
          void verifyServicePaymentWithBackend(String(ref));
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    void loadServicesData();
  }, [fadeAnim, slideAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadServicesData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  const firstName = getFirstName(user);

  const handleOpenBookingForm = (service: ServiceItem) => {
    setSelectedService(service);
    setShowRequestModal(true);
  };

  const handlePayServiceRequest = async (req: ServiceRequestItem) => {
    const token = await getStoredAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setIsPayingRequest(true);

    try {
      const paymentRes = await apiRequest<any>('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({
          purchaseType: 'SERVICE_REQUEST',
          targetId: req.id,
        }),
      });

      if (!paymentRes?.authorizationUrl) {
        throw new Error('Could not initialize Paystack payment for this request.');
      }

      const authUrl = paymentRes.authorizationUrl;
      const ref = paymentRes.reference || req.reference;

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

      await verifyServicePaymentWithBackend(returnedRef);
    } catch (error) {
      setAlertInfo({
        visible: true,
        title: 'Payment Error',
        message: error instanceof Error ? error.message : 'Could not launch Paystack payment.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
      });
    } finally {
      setIsPayingRequest(false);
    }
  };

  const handleSubmitCareRequest = async () => {
    if (!selectedService) return;

    if (!location.trim()) {
      setAlertInfo({
        visible: true,
        title: 'Missing Location',
        message: 'Please provide the care delivery address/location for this request.',
        icon: 'location-outline',
        iconColor: '#EF4444',
      });
      return;
    }

    const token = await getStoredAccessToken();
    if (!token) {
      setShowRequestModal(false);
      setSelectedService(null);
      setAlertInfo({
        visible: true,
        title: 'Sign In Required',
        message: 'Please sign in to submit a healthcare care request.',
        icon: 'lock-closed-outline',
        iconColor: '#F10505',
      });
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiRequest<any>('/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedService.id,
          preferredDate: preferredDate.trim() || undefined,
          location: location.trim(),
          customerNote: customerNote.trim() || undefined,
        }),
      });

      const ref = res?.reference || 'GIL-SRV-REQUEST';
      setShowRequestModal(false);
      setSelectedService(null);
      setPreferredDate('');
      setLocation('');
      setCustomerNote('');
      setConfirmedRequestRef(ref);

      await loadServicesData();
    } catch (error) {
      setAlertInfo({
        visible: true,
        title: 'Request Failed',
        message:
          error instanceof Error
            ? error.message
            : 'Could not submit your care request. Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCareOnboarding = async () => {
    if (!onboardingTargetRequest) return;

    if (
      !patientName.trim() ||
      !contactPhone.trim() ||
      !emergencyContactName.trim() ||
      !emergencyContactPhone.trim()
    ) {
      setAlertInfo({
        visible: true,
        title: 'Incomplete Details',
        message: 'Please fill in patient name, contact phone, and emergency contact details.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
      });
      return;
    }

    if (!consentGiven) {
      setAlertInfo({
        visible: true,
        title: 'Consent Required',
        message: 'Please confirm consent to proceed with clinical care data onboarding.',
        icon: 'shield-outline',
        iconColor: '#EF4444',
      });
      return;
    }

    setIsSubmittingOnboarding(true);

    try {
      await apiRequest<any>('/service-requests/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          serviceRequestId: onboardingTargetRequest.id,
          patientName: patientName.trim(),
          contactPhone: contactPhone.trim(),
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
          careNotes: careNotes.trim() || undefined,
          consentToCareData: true,
        }),
      });

      setOnboardingTargetRequest(null);
      setPatientName('');
      setContactPhone('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setCareNotes('');
      setConsentGiven(false);

      setAlertInfo({
        visible: true,
        title: 'Onboarding Completed',
        message:
          'Your care onboarding information has been securely submitted to GILEO clinical leads.',
        icon: 'checkmark-circle-outline',
        iconColor: '#10B981',
      });

      await loadServicesData();
    } catch (error) {
      setAlertInfo({
        visible: true,
        title: 'Onboarding Error',
        message:
          error instanceof Error
            ? error.message
            : 'Could not submit care onboarding details.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
      });
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return { bg: '#FEF3C7', color: '#B45309', label: 'Under Review' };
      case 'ACCEPTED':
      case 'AWAITING_PAYMENT':
        return { bg: '#EFF6FF', color: '#1D4ED8', label: 'Accepted • Paystack Ready' };
      case 'PAID':
      case 'ONBOARDING_REQUIRED':
        return { bg: '#ECFDF5', color: '#047857', label: 'Paid • Onboarding Ready' };
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return { bg: '#F0FDF4', color: '#15803D', label: 'Nurse Assigned • Active' };
      case 'COMPLETED':
        return { bg: '#F8FAFC', color: '#475569', label: 'Completed' };
      default:
        return { bg: '#F1F5F9', color: '#64748B', label: status };
    }
  };

  if (user?.role === 'ADMIN') {
    return <AdminCareRequestsView />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Top Bar Header with Hello First Name */}
          <View style={styles.topHeaderRow}>
            <View style={styles.greetingBox}>
              <Text style={styles.greetingSubTitle}>Hello, {firstName} 👋</Text>
              <Text style={styles.greetingTitle} numberOfLines={1}>Services & Clinical Care</Text>
            </View>

            <View style={styles.topRightActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/notifications')}
                style={({ pressed }) => [styles.circleIconBtn, pressed && styles.pressed]}
              >
                <Ionicons name="notifications-outline" size={20} color="#0F172A" />
                <View style={styles.notifBadgeDot} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Request home-care nursing, elderly support, event medical standby, production coverage, and clinical service coordination.
          </Text>

          {/* Services Search Bar */}
          <View style={styles.searchBarBox}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search healthcare services, home care..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'browse' && styles.tabBtnActive]}
              onPress={() => setActiveTab('browse')}
            >
              <Ionicons
                name="medkit-outline"
                size={16}
                color={activeTab === 'browse' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}
              >
                Browse Care ({services.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, activeTab === 'my_requests' && styles.tabBtnActive]}
              onPress={() => setActiveTab('my_requests')}
            >
              <Ionicons
                name="clipboard-outline"
                size={16}
                color={activeTab === 'my_requests' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'my_requests' && styles.tabTextActive,
                ]}
              >
                My Requests ({myRequests.length})
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: BROWSE SERVICES */}
          {activeTab === 'browse' && (
            <View style={styles.list}>
              {services.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="medical-outline" size={22} color="#F10505" />
                    </View>

                    <View style={styles.headerInfo}>
                      <Text style={styles.cardCategory}>Healthcare Service</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardDescription}>{item.description}</Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.priceCol}>
                      <Text style={styles.cardPriceLabel}>INDICATIVE PRICING</Text>
                      <Text style={styles.cardPrice} numberOfLines={1}>
                        {item.priceLabel ||
                          (item.priceKobo
                            ? formatKobo(item.priceKobo)
                            : 'Custom Quote')}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.requestPillBtn,
                        pressed && styles.requestPillBtnPressed,
                      ]}
                      onPress={() => setSelectedService(item)}
                    >
                      <Text style={styles.requestPillBtnText}>Request Care</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: MY CARE REQUESTS */}
          {activeTab === 'my_requests' && (
            <View style={styles.list}>
              {myRequests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="clipboard-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Care Requests Yet</Text>
                  <Text style={styles.emptySub}>
                    Browse our healthcare services tab to submit your first clinical home care or coverage request.
                  </Text>
                  <Pressable
                    style={styles.emptyPrimaryBtn}
                    onPress={() => setActiveTab('browse')}
                  >
                    <Text style={styles.emptyPrimaryText}>Browse Healthcare Services</Text>
                  </Pressable>
                </View>
              ) : (
                myRequests.map((req) => {
                  const badge = getStatusBadgeStyle(req.status);
                  const isAccepted = req.status === 'ACCEPTED' || req.status === 'AWAITING_PAYMENT';
                  return (
                    <View key={req.id} style={styles.requestCard}>
                      <View style={styles.requestCardTop}>
                        <View style={styles.refBox}>
                          <Text style={styles.refLabel}>REFERENCE</Text>
                          <Text style={styles.refVal}>{req.reference}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.statusText, { color: badge.color }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.requestServiceTitle}>{req.service?.title}</Text>

                      {req.location ? (
                        <View style={styles.metaRow}>
                          <Ionicons name="location-outline" size={14} color="#64748B" />
                          <Text style={styles.metaText}>{req.location}</Text>
                        </View>
                      ) : null}

                      {req.preferredDate ? (
                        <View style={styles.metaRow}>
                          <Ionicons name="calendar-outline" size={14} color="#64748B" />
                          <Text style={styles.metaText}>
                            Preferred Date: {formatReadableDate(req.preferredDate)}
                          </Text>
                        </View>
                      ) : null}

                      {req.createdAt ? (
                        <View style={styles.metaRow}>
                          <Ionicons name="time-outline" size={14} color="#64748B" />
                          <Text style={styles.metaText}>
                            Requested: {formatReadableDate(req.createdAt)}
                          </Text>
                        </View>
                      ) : null}

                      {req.assignedProvider ? (
                        <View style={styles.providerBadge}>
                          <Ionicons name="person-circle-outline" size={16} color="#059669" />
                          <Text style={styles.providerText}>
                            Assigned Nurse: {req.assignedProvider.displayName}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.requestCardActions}>
                        {isAccepted && (
                          <Pressable
                            style={[
                              styles.paystackActionBtn,
                              isPayingRequest && { opacity: 0.6 },
                            ]}
                            disabled={isPayingRequest}
                            onPress={() => handlePayServiceRequest(req)}
                          >
                            <Ionicons name="card" size={16} color="#FFFFFF" />
                            <Text style={styles.paystackActionText}>
                              {isPayingRequest ? 'Opening Paystack...' : 'Pay with Paystack'}
                            </Text>
                          </Pressable>
                        )}

                        {(req.status === 'PAID' || req.status === 'ONBOARDING_REQUIRED') && (
                          <Pressable
                            style={styles.onboardingActionBtn}
                            onPress={() => setOnboardingTargetRequest(req)}
                          >
                            <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.onboardingActionText}>
                              Complete Care Onboarding
                            </Text>
                          </Pressable>
                        )}

                        <Pressable
                          style={styles.callSupportOutlineBtn}
                          onPress={handleCallSupport}
                        >
                          <Ionicons name="call-outline" size={14} color="#F10505" />
                          <Text style={styles.callSupportOutlineText}>Call Support</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Support Banner */}
          <Pressable style={styles.supportBannerCard} onPress={handleCallSupport}>
            <View style={styles.supportIconSquare}>
              <Ionicons name="headset" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.supportTitle}>Questions About Care Booking?</Text>
              <Text style={styles.supportSub}>Speak directly with GILEO Support Team</Text>
              <Text style={styles.supportPhone}>+234 816 533 5594</Text>
            </View>
            <Ionicons name="call" size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* SERVICE DETAIL MODAL */}
      <Modal
        visible={Boolean(selectedService) && !showRequestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedService(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedService(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedService && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconBox}>
                    <Ionicons name="medkit-outline" size={24} color="#F10505" />
                  </View>
                  <Pressable onPress={() => setSelectedService(null)} hitSlop={10}>
                    <Ionicons name="close" size={22} color="#64748B" />
                  </Pressable>
                </View>

                <Text style={styles.modalCategory}>Healthcare Service</Text>
                <Text style={styles.modalTitle}>{selectedService.title}</Text>
                <Text style={styles.modalPrice}>
                  {selectedService.priceLabel ||
                    (selectedService.priceKobo
                      ? formatKobo(selectedService.priceKobo)
                      : 'Custom Quote')}
                </Text>

                <Text style={styles.modalDescription}>{selectedService.description}</Text>

                {selectedService.audience ? (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>WHO IT IS FOR</Text>
                    <Text style={styles.infoBoxText}>{selectedService.audience}</Text>
                  </View>
                ) : null}

                {selectedService.whatIsIncluded ? (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>WHAT IS INCLUDED</Text>
                    <Text style={styles.infoBoxText}>{selectedService.whatIsIncluded}</Text>
                  </View>
                ) : null}

                <View style={styles.modalFooterActions}>
                  <Pressable
                    style={styles.primaryBookingBtn}
                    onPress={() => handleOpenBookingForm(selectedService)}
                  >
                    <Ionicons name="calendar" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBookingText}>Proceed to Request Care</Text>
                  </Pressable>

                  <Pressable style={styles.supportBtnOutline} onPress={handleCallSupport}>
                    <Ionicons name="call-outline" size={16} color="#F10505" />
                    <Text style={styles.supportBtnOutlineText}>
                      Call Support (+234 816 533 5594)
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* BOOKING REQUEST FORM MODAL */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <SafeAreaView style={styles.formSafeArea}>
          <View style={styles.formHeader}>
            <Pressable onPress={() => setShowRequestModal(false)} style={styles.circleBtn}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.formHeaderTitle}>Request Care Service</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            {selectedService && (
              <View style={styles.selectedServiceBanner}>
                <Ionicons name="medkit" size={20} color="#F10505" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.selectedServiceTitle}>{selectedService.title}</Text>
                  <Text style={styles.selectedServicePrice}>
                    {selectedService.priceLabel || 'Indicative Pricing'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Care Delivery Location / Address *</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Enter full home address or venue location"
                placeholderTextColor="#94A3B8"
                style={styles.inputField}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Preferred Date *</Text>

              {/* Quick Date Selector Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateChipsContainer}
              >
                {getDateOptionChips().map((chip) => (
                  <Pressable
                    key={chip.val}
                    style={[
                      styles.dateChip,
                      preferredDate === chip.val && styles.dateChipActive,
                    ]}
                    onPress={() => setPreferredDate(chip.val)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={preferredDate === chip.val ? '#FFFFFF' : '#F10505'}
                    />
                    <Text
                      style={[
                        styles.dateChipText,
                        preferredDate === chip.val && styles.dateChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <TextInput
                value={preferredDate}
                onChangeText={setPreferredDate}
                placeholder="Select date above or type YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                style={styles.inputField}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Clinical Requirements & Notes (Optional)</Text>
              <TextInput
                value={customerNote}
                onChangeText={setCustomerNote}
                placeholder="Describe special patient conditions, procedure history, or event notes"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                style={[styles.inputField, { height: 90, textAlignVertical: 'top' }]}
              />
            </View>

            <Pressable
              style={[styles.submitFormBtn, isSubmitting && { opacity: 0.6 }]}
              disabled={isSubmitting}
              onPress={handleSubmitCareRequest}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                  <Text style={styles.submitFormText}>Submit Care Request</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* REQUEST SUBMITTED SUCCESS MODAL */}
      <Modal
        visible={Boolean(confirmedRequestRef)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmedRequestRef(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>

            <Text style={styles.successHeading}>Request Submitted!</Text>
            <Text style={styles.successSubtext}>
              Your care request has been registered with GILEO Medicals. Our clinical team is reviewing your location and availability.
            </Text>

            <View style={styles.refBadgeBox}>
              <Text style={styles.refBadgeLabel}>REFERENCE NUMBER</Text>
              <Text style={styles.refBadgeValue}>{confirmedRequestRef}</Text>
            </View>

            <Pressable
              style={styles.primarySuccessBtn}
              onPress={() => {
                setConfirmedRequestRef(null);
                setActiveTab('my_requests');
              }}
            >
              <Text style={styles.primarySuccessText}>View My Requests</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CARE ONBOARDING FORM MODAL */}
      <Modal
        visible={Boolean(onboardingTargetRequest)}
        animationType="slide"
        onRequestClose={() => setOnboardingTargetRequest(null)}
      >
        <SafeAreaView style={styles.formSafeArea}>
          <View style={styles.formHeader}>
            <Pressable
              onPress={() => setOnboardingTargetRequest(null)}
              style={styles.circleBtn}
            >
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.formHeaderTitle}>Care Onboarding Form</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            <View style={styles.noticeBoxLight}>
              <Ionicons name="lock-closed" size={20} color="#F10505" />
              <Text style={styles.noticeBoxLightText}>
                Confidential clinical onboarding. Patient and emergency details are restricted strictly to assigned GILEO registered nurses.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Patient Full Name *</Text>
              <TextInput
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                style={styles.inputField}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Patient Contact Phone *</Text>
              <TextInput
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="Phone Number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                style={styles.inputField}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Emergency Contact Name *</Text>
              <TextInput
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Emergency Contact Name"
                placeholderTextColor="#94A3B8"
                style={styles.inputField}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Emergency Contact Phone *</Text>
              <TextInput
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                placeholder="Emergency Contact Phone"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                style={styles.inputField}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Care Notes & Medical History (Optional)</Text>
              <TextInput
                value={careNotes}
                onChangeText={setCareNotes}
                placeholder="Allergies, chronic conditions, or specific nursing instructions"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                style={[styles.inputField, { height: 80, textAlignVertical: 'top' }]}
              />
            </View>

            <Pressable
              style={styles.consentRow}
              onPress={() => setConsentGiven(!consentGiven)}
            >
              <Ionicons
                name={consentGiven ? 'checkbox' : 'square-outline'}
                size={22}
                color={consentGiven ? '#F10505' : '#94A3B8'}
              />
              <Text style={styles.consentText}>
                I confirm that I authorize GILEO Medicals to process this care information to assign a qualified registered nurse.
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.submitFormBtn,
                (isSubmittingOnboarding || !consentGiven) && { opacity: 0.6 },
              ]}
              disabled={isSubmittingOnboarding || !consentGiven}
              onPress={handleSubmitCareOnboarding}
            >
              {isSubmittingOnboarding ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.submitFormText}>Submit Care Information</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* VERIFYING PAYMENT MODAL */}
      <Modal
        visible={isVerifyingPayment}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.verifyingCard}>
            <ActivityIndicator size="large" color="#F10505" />
            <Text style={styles.verifyingTitle}>Verifying Payment...</Text>
            <Text style={styles.verifyingSub}>Confirming Paystack transaction with Gileo server</Text>
          </View>
        </View>
      </Modal>

      {/* ALERT DIALOG */}
      <Modal
        visible={alertInfo.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertInfo({ ...alertInfo, visible: false })}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAlertInfo({ ...alertInfo, visible: false })}
        >
          <Pressable style={styles.alertCard} onPress={(e) => e.stopPropagation()}>
            <Ionicons name={alertInfo.icon} size={48} color={alertInfo.iconColor} />
            <Text style={styles.alertTitle}>{alertInfo.title}</Text>
            <Text style={styles.alertMessage}>{alertInfo.message}</Text>

            <Pressable
              style={styles.alertBtn}
              onPress={() => setAlertInfo({ ...alertInfo, visible: false })}
            >
              <Text style={styles.alertBtnText}>OK</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  searchBarBox: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  greetingBox: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  greetingSubTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  greetingTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconBtn: {
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
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 999,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#F10505',
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    gap: 14,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  cardCategory: {
    color: '#8A7045',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  cardDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  priceCol: {
    flex: 1,
    gap: 2,
  },
  cardPriceLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardPrice: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
  },
  requestPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F10505',
  },
  requestPillBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  requestPillBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  noticeBoxLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
  },
  noticeBoxLightText: {
    flex: 1,
    color: '#047857',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyPrimaryBtn: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  requestCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  requestCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refBox: {
    gap: 2,
  },
  refLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  refVal: {
    color: '#F10505',
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  requestServiceTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#64748B',
    fontSize: 13,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
  },
  providerText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },
  requestCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  paystackActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  paystackActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  onboardingActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  onboardingActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  callSupportOutlineBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callSupportOutlineText: {
    color: '#F10505',
    fontSize: 13,
    fontWeight: '700',
  },
  supportBannerCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  supportIconSquare: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  supportSub: {
    color: '#FECDD3',
    fontSize: 12,
  },
  supportPhone: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCategory: {
    color: '#8A7045',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  modalPrice: {
    color: '#F10505',
    fontSize: 16,
    fontWeight: '800',
  },
  modalDescription: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  infoBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    gap: 4,
  },
  infoBoxTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  infoBoxText: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 20,
  },
  modalFooterActions: {
    gap: 10,
    paddingTop: 8,
  },
  primaryBookingBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBookingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  supportBtnOutline: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  supportBtnOutlineText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  formSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formHeaderTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    padding: 20,
    gap: 16,
  },
  selectedServiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
  },
  selectedServiceTitle: {
    color: '#F10505',
    fontSize: 15,
    fontWeight: '800',
  },
  selectedServicePrice: {
    color: '#9F1239',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  dateChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  dateChipActive: {
    backgroundColor: '#F10505',
    borderColor: '#F10505',
  },
  dateChipText: {
    color: '#F10505',
    fontSize: 12,
    fontWeight: '700',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  inputField: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
  },
  submitFormBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitFormText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  consentText: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
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
  successIconCircle: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  successHeading: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtext: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  refBadgeBox: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 4,
  },
  refBadgeLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  refBadgeValue: {
    color: '#F10505',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  primarySuccessBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primarySuccessText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  alertCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  alertTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  alertMessage: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  alertBtn: {
    height: 48,
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  alertBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
