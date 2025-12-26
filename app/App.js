
// =============================
// ACCESCO APP MAIN ENTRY (App.js)
// =============================

// ----------- IMPORTS -----------
import React, { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  TextInput,
  Alert,
  Modal,
  Animated,
  useWindowDimensions,
  Platform,
  ToastAndroid,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// If you have the font file, uncomment the import below:
// import { useFonts } from 'expo-font'; 

// ---------- CONFIGURATION ----------
const CUSTOM_FONT = Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif'; 

// ---------- Helpers ----------
const showToast = (msg) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    console.log(msg);
  }
};

/**
 * Format a number with commas for thousands
 */
const formatNumber = (val) => {
  if (val == null) return '';
  const digits = String(val).replace(/[^0-9.]/g, ''); 
  if (digits.length === 0) return '';
  const parts = digits.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

/**
 * Parse a formatted number string to a number
 */
const parseNumber = (val) => {
  if (!val) return 0;
  return Number(String(val).replace(/,/g, '')) || 0;
};

// =============================
// COMPONENTS
// =============================

// ---------- LOGIN MODAL COMPONENT ----------
const LoginModal = ({ isOpen, onClose }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 60, duration: 180, useNativeDriver: true })
      ]).start();
    }
  }, [isOpen]);

  const handleSignIn = () => {
    if (!email) {
      showToast('Please enter an email.');
      return;
    }
    showToast('Signed in successfully');
    onClose();
  };

  const handleSignUp = () => {
    if (!email) {
      showToast('Please enter an email.');
      return;
    }
    showToast('Signed up successfully');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.loginContainer,
            {
              paddingTop: insets.top + 18,
              opacity,
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={styles.loginHeader}>
            <Image
              source={require('./assets/icon.png')}
              style={styles.loginLogo}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Ionicons name="close" size={28} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.ventureDesc} numberOfLines={2}>{desc}</Text>

      <View style={styles.ventureTagRow}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.ventureTag}>
             <Feather name={tag.icon} size={10} color="#666" style={{marginRight: 4}} />
             <Text style={styles.ventureTagText}>{tag.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.ventureBtn} onPress={onPress}>
        <Text style={styles.ventureBtnText}>{btnText}  ›</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ---------- SIDEBAR COMPONENT ----------
const Sidebar = ({ isOpen, onClose, onNavigate }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);
  
  // Using ban1.jpg and ban2.jpg (Verified in your folder)
  const banners = [
    require('./assets/ban1.jpg'),
    require('./assets/ban2.jpg'), 
  ];

  // Animate sidebar in/out
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActive(prev => {
        const next = prev === banners.length - 1 ? 0 : prev + 1;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [width]);

  const menuItems = [
    { title: 'HOME', key: 'home' },
    { title: 'ABOUT', key: 'about' },
    { title: 'SERVICES', key: 'services' },
    { title: 'RESOURCES', key: 'resources' },
    { title: 'CONTACT', key: 'contact' },
  ];

  return (
    <Modal animationType="none" transparent={true} visible={isOpen} onRequestClose={onClose}>
      <View style={styles.sidebarOverlay}>
        <TouchableOpacity style={styles.sidebarBackdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View
          style={[
            styles.sidebarContainer,
            {
              paddingTop: insets.top,
              width: panelWidth,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={32} color="#1a1a1a" />
          </TouchableOpacity>

          <View style={styles.sidebarLogoContainer}>
            <Image
              source={require('./assets/icon.png')}
              style={styles.sidebarLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.menuLabel}>MENU</Text>

          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  if (onNavigate) onNavigate(item.key);
                  onClose();
                }}
              >
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color="#333" />
              </TouchableOpacity>
            ))}
        </View>
      )}
    </View>
  );
};


// ---------- CALCULATOR COMPONENT (SMART BUDGET PLANNER) ----------
const CalculatorScreen = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  
  // Inputs
  const [income, setIncome] = useState('');
  const [fixedRent, setFixedRent] = useState('');
  const [members, setMembers] = useState('1');
  const [lifestyle, setLifestyle] = useState('middle'); // frugal, middle, luxury

  // Computed Budget
  const [budget, setBudget] = useState(null);

  // Logic
  const calculatePlan = () => {
    Keyboard.dismiss();
    const inc = parseNumber(income);
    const rentVal = parseNumber(fixedRent);
    const mem = parseInt(members) || 1;

    if (!inc || inc < 500) {
      Alert.alert('Details Required', 'Please enter a valid monthly income (min ₹500).');
      return;
    }
    
    // Logic Translation
    let baseFoodCost = 3000;
    if(lifestyle === 'frugal') baseFoodCost = 2500;
    if(lifestyle === 'luxury') baseFoodCost = 5000;

    let scaleFactor = 1;
    if (mem > 1) scaleFactor += 0.7;
    let idealGrocery = Math.floor(baseFoodCost * scaleFactor);

    let baseUtil = 1000; 
    let utilScale = 1 + ((mem-1) * 0.3);
    let idealUtility = Math.floor(baseUtil * utilScale);

    let baseTrans = 1500;
    let idealTransport = Math.floor(baseTrans * mem);

    // Rent/EMI logic
    const calcRent = rentVal > 0 ? rentVal : Math.floor(inc * 0.30);
    const disposable = Math.max(0, inc - calcRent);

    // Distribute remaining budget
    let remaining = disposable - (idealGrocery + idealUtility + idealTransport);
    let shopping = 0, dining = 0, entertainment = 0;
    if (remaining > 0) {
      shopping = Math.floor(remaining * 0.2);
      dining = Math.floor(remaining * 0.2);
      entertainment = Math.floor(remaining * 0.1);
    } else {
      // Deficit logic
      let totalNeeds = idealGrocery + idealUtility + idealTransport;
      let scaleDown = disposable / totalNeeds;
      idealGrocery = Math.floor(idealGrocery * scaleDown);
      idealUtility = Math.floor(idealUtility * scaleDown);
      idealTransport = Math.floor(idealTransport * scaleDown);
    }

    // Final budget object
    const expenses = calcRent + idealGrocery + idealUtility + idealTransport + shopping + dining + entertainment;
    const savings = inc - expenses;

    setBudget({
      rent: calcRent,
      grocery: idealGrocery,
      utility: idealUtility,
      transport: idealTransport,
      shopping, dining, entertainment,
      savings,
      totalNeeds: calcRent + idealGrocery + idealUtility + idealTransport,
      totalWants: shopping + dining + entertainment,
      totalSave: savings
    });
  };

  // Auto-rebalance when editing specific fields
  const updateField = (field, value) => {
    if(!budget) return;
    const val = parseNumber(value);
    const newBudget = { ...budget, [field]: val };
    
    // Recalculate totals
    const tNeeds = newBudget.rent + newBudget.grocery + newBudget.transport + newBudget.utility;
    const tWants = newBudget.shopping + newBudget.dining + newBudget.entertainment;
    const inc = parseNumber(income);
    const tSave = inc - (tNeeds + tWants);

    setBudget({
      ...newBudget,
      totalNeeds: tNeeds,
      totalWants: tWants,
      totalSave: tSave
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.navHeaderTitle}>CalcIQ Planner</Text>
        <View style={{width:24}} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Details</Text>
            <View style={styles.inputRow}>
                <View style={{flex:1}}>
                    <Text style={styles.label}>Monthly Income</Text>
                    <TextInput style={styles.input} placeholder="₹ 0" keyboardType="numeric" value={income} onChangeText={(t) => setIncome(formatNumber(t))} />
                </View>
            </View>
            <View style={styles.inputRow}>
                <View style={{flex:1, marginRight: 10}}>
                    <Text style={styles.label}>Fixed Rent</Text>
                    <TextInput style={styles.input} placeholder="Optional" keyboardType="numeric" value={fixedRent} onChangeText={(t) => setFixedRent(formatNumber(t))} />
                </View>
                <View style={{flex:0.8}}>
                    <Text style={styles.label}>Members</Text>
                    <TextInput style={styles.input} placeholder="1" keyboardType="numeric" value={members} onChangeText={setMembers} />
                </View>
            </View>
            <Text style={[styles.label, {marginTop: 10}]}>Lifestyle Type</Text>
            <View style={styles.segmentRow}>
                {['frugal', 'middle', 'luxury'].map((m) => (
                    <TouchableOpacity key={m} onPress={() => setLifestyle(m)} style={[styles.segmentBtn, lifestyle === m && styles.segmentBtnActive]}>
                        <Text style={[styles.segmentText, lifestyle === m && styles.segmentTextActive]}>{m.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={styles.mainBtn} onPress={calculatePlan}>
                <Text style={styles.mainBtnText}>CALCULATE BUDGET</Text>
            </TouchableOpacity>
        </View>

        {budget && (
             <View style={{marginTop: 16}}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Suggested Plan</Text>
                    <View style={styles.summaryRow}>
                        <View style={{alignItems:'center'}}>
                            <Text style={styles.summaryLabel}>NEEDS</Text>
                            <Text style={styles.summaryVal}>₹{formatNumber(budget.totalNeeds)}</Text>
                        </View>
                        <View style={{width:1, height: 30, backgroundColor:'#eee'}}/>
                        <View style={{alignItems:'center'}}>
                            <Text style={[styles.summaryLabel, {color: THEME.green}]}>SAVINGS</Text>
                            <Text style={[styles.summaryVal, {color: THEME.green}]}>₹{formatNumber(budget.totalSave)}</Text>
                        </View>
                    </View>
                    <View style={styles.barContainer}>
                         <View style={{flex: budget.totalNeeds, backgroundColor: THEME.primary}} />
                         <View style={{flex: budget.totalWants, backgroundColor: '#fbbf24'}} />
                         <View style={{flex: Math.max(0, budget.totalSave), backgroundColor: THEME.green}} />
                    </View>
                </View>
             </View>
        )}
      </ScrollView>
    </View>
  );
};

// ---------- COMING SOON SCREEN ----------
const ComingSoonScreen = ({ onBack, serviceName }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{serviceName || 'Service'}</Text>
      </View>
      <View style={styles.comingSoonBody}>
        <View style={styles.iconCircleBig}>
          <Ionicons name="construct" size={48} color="#700457" />
        </View>
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <Text style={styles.comingSoonSubtitle}>
          We are working hard to bring you this service. Stay tuned for updates!
        </Text>
      </View>
    </View>
  );
};

// ---------- HELPERS ----------
const StatItem = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ---------- SERVICE CARD ----------
const ServiceCard = React.memo(({ title, subTitle, badge, img, onPress, isFullWidth }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.975, speed: 20, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, speed: 20, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.cardItemWrapper, isFullWidth && { width: '100%' }, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.cardItemTouchable}
        onPress={onPress}
      >
        <Image source={{ uri: img }} style={styles.cardImage} />
        <View style={styles.cardOverlay} />
        <View style={styles.cardContent}>
          {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
          <View style={{ marginTop: 'auto' }}>
            <Text style={styles.cardTitle}>{title}</Text>
            {subTitle && <Text style={styles.cardSubtitle}>{subTitle}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ---------- LANDING SCREEN ----------
const LandingScreen = ({ onLaunchCalculator, onLaunchService, scrollRef, onSectionLayout }) => {
  const { width } = useWindowDimensions();
  const bannerWidth = width > 768 ? 800 : width - 40; 
  const bannerHeight = width > 768 ? 400 : 200; 

  const resources = [
    { title: 'Metrics & Certificates', desc: 'View achievements and milestones' },
    { title: 'QTC Videos', desc: 'High-quality tutorials' },
    { title: 'Blogs', desc: 'Industry insights & updates' },
    { title: 'Tutorials', desc: 'Step-by-step guides' },
  ];

  const banners = [
    require('./assets/ban1.jpg'),
    require('./assets/ban2.jpg')
  ];

  const bannerScrollRef = useRef(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prevIndex) => {
        let nextIndex = prevIndex + 1;
        if (nextIndex >= banners.length) nextIndex = 0;
        if (bannerScrollRef.current) {
           bannerScrollRef.current.scrollTo({ x: nextIndex * width, animated: true });
        }
        return nextIndex;
      });
    }, 5000); 
    return () => clearInterval(interval);
  }, [width]);

  const onMomentumScrollEnd = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setBannerIndex(Math.round(contentOffsetX / width));
  };

  return (
    <ScrollView 
      ref={scrollRef}
      style={styles.scrollContainer} 
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.bannerContainer, { height: bannerHeight }]}>
        <ScrollView 
          ref={bannerScrollRef}
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {banners.map((banner, index) => (
            <View key={index} style={{ width: width, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Image 
                  source={banner} 
                  style={{ width: bannerWidth, height: '100%', borderRadius: 16 }} 
                  resizeMode="cover" 
                />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section} onLayout={(event) => onSectionLayout && onSectionLayout('services', event.nativeEvent.layout.y)}>
        <Text style={styles.sectionTitle}>Explore Services</Text>
        <View style={styles.grid}>
          <ServiceCard onPress={() => onLaunchService('Grokly')} title="Grokly" subTitle="Fresh Groceries" badge="FAST DELIVERY" img="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop" />
          <ServiceCard onPress={() => onLaunchService('Swadisht')} title="Swadisht" subTitle="Food Delivery" badge="Collect coupons" img="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop" />
          <ServiceCard onPress={() => onLaunchService('Dineout')} title="Dineout" subTitle="Book Tables" badge="FLAT 20% OFF" img="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop" />
          <ServiceCard onPress={() => onLaunchService('InstaStyle')} title="InstaStyle" subTitle="Fashion Store" badge="NEW ARRIVALS" img="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop" />
          <ServiceCard onPress={onLaunchCalculator} title="CalcIQ" subTitle="Smart Budget Planner" badge="PREMIUM" img="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop" isFullWidth={true} />
        </View>
      </View>

      <View style={styles.heroContainer} onLayout={(event) => onSectionLayout && onSectionLayout('home', event.nativeEvent.layout.y)}>
        <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop' }} style={styles.heroImage} resizeMode="cover">
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.pill}><Text style={styles.pillText}>Digital Services</Text></View>
            <Text style={styles.heroTitle}>Upgrade your lifestyle with</Text>
            <Text style={styles.heroBrand}>ACCESCO</Text>
            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.btnPrimary}><Text style={styles.btnText}>Explore</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnOutline}><Text style={styles.btnText}>Learn More</Text></TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.statsBar}>
        <StatItem label="Active Users" value="10K+" />
        <View style={styles.divider} />
        <StatItem label="Top Rating" value="5/5" />
        <View style={styles.divider} />
        <StatItem label="Support" value="24/7" />
      </View>

      <View style={styles.resourcesSection} onLayout={(event) => onSectionLayout && onSectionLayout('resources', event.nativeEvent.layout.y)}>
        <View style={styles.resourcesHeader}>
          <Text style={styles.resTagline}>RESOURCES</Text>
          <Text style={styles.resTitle}>Learn, Grow, and Succeed</Text>
          <Text style={styles.resSubtitle}>Access valuable resources to enhance your ACCESCO experience.</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resScrollContent}>
          {resources.map((item, index) => (
            <TouchableOpacity key={index} style={styles.resCard} activeOpacity={0.9} onPress={() => onLaunchService(item.title)}>
              <View>
                <Text style={styles.resCardTitle}>{item.title}</Text>
                <Text style={styles.resCardDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#b91c1c" style={styles.resArrow} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footerContainer} onLayout={(event) => { if(onSectionLayout) { onSectionLayout('contact', event.nativeEvent.layout.y); onSectionLayout('about', event.nativeEvent.layout.y); } }}>
        <View style={styles.footerContent}>
          <View style={styles.footerBrandSection}>
            <View style={styles.footerLogoRow}>
              <Image source={require('./assets/icon.png')} style={styles.footerLogo} resizeMode="contain" />
              <Text style={styles.footerBrandName}>ACCESCO</Text>
            </View>
            <Text style={styles.footerTagline}>Empowering digital excellence through innovative solutions.</Text>
          </View>
          <View style={styles.footerLinksContainer}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColTitle}>Company</Text>
              <TouchableOpacity onPress={() => onLaunchService('About Us')}><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => onLaunchService('Contact Us')}><Text style={styles.footerLink}>Contact Us</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => onLaunchService('Help & Support')}><Text style={styles.footerLink}>Help & Support</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColTitle}>Resources</Text>
              <TouchableOpacity onPress={() => onLaunchService('Metrics')}><Text style={styles.footerLink}>Metrics & Certificates</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => onLaunchService('Videos')}><Text style={styles.footerLink}>QTC Videos</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => onLaunchService('Blogs')}><Text style={styles.footerLink}>Blogs</Text></TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>© 2025 ACCESCO — All rights reserved.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// ---------- MAIN APP CONTENT ----------
function AppContent() {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [selectedService, setSelectedService] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const scrollViewRef = useRef(null);
  const sectionPositions = useRef({});

  const handleSectionLayout = (key, y) => { sectionPositions.current[key] = y; };

  const handleNavigate = (key) => {
    if (currentScreen !== 'landing') {
      setCurrentScreen('landing');
      return;
    }
    const y = sectionPositions.current[key] || 0;
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y, animated: true });
    }
  };

  const handleLaunchService = (name) => {
    setSelectedService(name);
    setCurrentScreen('comingSoon');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={handleNavigate} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Hide standard header on Calc Screen for custom look */}
      {currentScreen !== 'calculator' && (
        <View style={styles.mainHeader}>
          <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.headerButton}>
            <Ionicons name="menu" size={32} color="#1a1a1a" />
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <Image source={require('./assets/icon.png')} style={{ width: 32, height: 32, marginRight: 8 }} resizeMode="contain" />
            <Text style={styles.brandName}>ACCESCO</Text>
          </View>
      )}

      <View style={{ flex: 1 }}>
        {activeTab === 'Home' && <HomeScreen onNavigate={setActiveTab} onService={handleService} />}
        {activeTab === 'Calculator' && <CalculatorScreen onBack={() => setActiveTab('Home')} />}
        {activeTab === 'Account' && (
            <View style={styles.center}>
                <Text style={{color: THEME.subText}}>Login to view Account</Text>
            </View>
        )}
      </View>

      {activeTab !== 'Calculator' && (
          <View style={styles.bottomTab}>
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Home')}>
                <Ionicons name={activeTab === 'Home' ? "home" : "home-outline"} size={24} color={activeTab === 'Home' ? THEME.primary : '#666'} />
                <Text style={[styles.tabText, activeTab === 'Home' && {color: THEME.primary}]}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tabItem} onPress={() => handleService('Categories')}>
                <Ionicons name="grid-outline" size={24} color="#666" />
                <Text style={styles.tabText}>Categories</Text>
            </TouchableOpacity>

            <View style={{width: 60}} /> 
            
            <TouchableOpacity style={styles.fab} onPress={() => setActiveTab('Calculator')}>
                 <FontAwesome5 name="calculator" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => handleService('Rewards')}>
                <Ionicons name="gift-outline" size={24} color="#666" />
                <Text style={styles.tabText}>Rewards</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Account')}>
                <Ionicons name={activeTab === 'Account' ? "person" : "person-outline"} size={24} color={activeTab === 'Account' ? THEME.primary : '#666'} />
                <Text style={[styles.tabText, activeTab === 'Account' && {color: THEME.primary}]}>Account</Text>
            </TouchableOpacity>
          </View>
      )}

      {currentScreen === 'landing' && (
        <LandingScreen 
          onLaunchCalculator={() => setCurrentScreen('calculator')} 
          onLaunchService={handleLaunchService}
          scrollRef={scrollViewRef}
          onSectionLayout={handleSectionLayout}
        />
      )}
      
      {currentScreen === 'calculator' && (
        <CalculatorScreen onBack={() => setCurrentScreen('landing')} />
      )}

      {currentScreen === 'comingSoon' && (
        <ComingSoonScreen 
          serviceName={selectedService} 
          onBack={() => setCurrentScreen('landing')} 
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainLayout />
    </SafeAreaProvider>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: THEME.primary, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 20, fontStyle: 'italic' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBtn: {},
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, height: 44, paddingHorizontal: 12 },
  searchText: { flex: 1, color: '#888', marginLeft: 8, fontSize: 14 },
  bannerWrapper: { marginBottom: 16 },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 10, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 3 },
  activeDot: { backgroundColor: '#fff', width: 12 },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: THEME.black },
  sectionSub: { fontSize: 12, color: '#666', marginTop: 2 },
  ventureCard: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
    paddingBottom: 16
  },
  ventureImg: {
    width: '100%',
    height: 140, // Height of the image area
    backgroundColor: '#eee',
  },
  ventureContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  ventureHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  ventureTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000'
  },
  ventureBadge: {
    backgroundColor: THEME.badgeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  ventureBadgeText: {
    color: THEME.badgeText,
    fontSize: 10,
    fontWeight: 'bold'
  },
  ventureDesc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 18
  },
  ventureTagRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8
  },
  ventureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee'
  },
  ventureTagText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600'
  },
  ventureBtn: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  ventureBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  promoBanner: { marginHorizontal: 16, marginBottom: 24, backgroundColor: THEME.secondary, borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  promoTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  promoSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 12 },
  promoBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4, alignSelf: 'flex-start' },
  promoBtnText: { color: THEME.secondary, fontWeight: 'bold', fontSize: 12 },
  navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.primary, padding: 16 },
  navHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 10, elevation: 1 },
  label: { fontSize: 12, color: '#666', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, paddingHorizontal: 10, height: 45, fontSize: 16, color: '#333', backgroundColor: '#fff' },
  inputRow: { flexDirection: 'row', marginBottom: 16 },
  segmentRow: { flexDirection: 'row', borderWidth: 1, borderColor: THEME.primary, borderRadius: 4, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  segmentBtnActive: { backgroundColor: THEME.primary },
  segmentText: { fontSize: 12, fontWeight: 'bold', color: THEME.primary },
  segmentTextActive: { color: '#fff' },
  mainBtn: { backgroundColor: THEME.primary, paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
  mainBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  summaryLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 4 },
  summaryVal: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  barContainer: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#eee', marginBottom: 10 },
  bottomTab: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#eee', elevation: 8 },
  tabItem: { alignItems: 'center', flex: 1 },
  tabText: { fontSize: 10, marginTop: 4, color: '#666', fontWeight: '600' },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: THEME.primary, position: 'absolute', bottom: 25, left: '50%', marginLeft: -28, alignItems: 'center', justifyContent: 'center', elevation: 6, borderWidth: 3, borderColor: '#fff' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 24, borderRadius: 8, alignItems: 'center' },
  modalIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(139,10,20,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }
});
