// App.js
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
import { Ionicons, FontAwesome5, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
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
    Alert.alert(msg);
  }
};

const formatNumber = (val) => {
  if (val == null) return '';
  const digits = String(val).replace(/[^0-9.]/g, ''); 
  if (digits.length === 0) return '';
  const parts = digits.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const parseNumber = (val) => {
  if (!val) return 0;
  return Number(String(val).replace(/,/g, '')) || 0;
};

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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.loginTitle}>LOG IN OR SIGN UP</Text>
            <Text style={styles.loginSubtitle}>
              Enjoy members-only access to exclusive products, rewards, offers and more.
            </Text>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={() => showToast('Apple login')}>
                <AntDesign name="apple1" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => showToast('Facebook login')}>
                <FontAwesome5 name="facebook" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => showToast('Google login')}>
                <AntDesign name="google" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="EMAIL ADDRESS *"
                placeholderTextColor="#666"
                style={styles.loginInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to receive personalised marketing messages from ACCESCO.
              </Text>
            </TouchableOpacity>

            <View style={styles.authButtonsRow}>
              <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn}>
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signUpBtn} onPress={handleSignUp}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ---------- SIDEBAR COMPONENT ----------
const Sidebar = ({ isOpen, onClose, onNavigate }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(Math.round(width * 0.85), 420);
  const slideAnim = useRef(new Animated.Value(-panelWidth)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -panelWidth,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [isOpen, panelWidth]);

  if (!isOpen) return null;

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
        </Animated.View>
      </View>
    </Modal>
  );
};

// ---------- CALCULATOR COMPONENT (SMART BUDGET PLANNER) ----------
const CalculatorScreen = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  
  // Inputs
  const [income, setIncome] = useState('');
  const [fixedRent, setFixedRent] = useState('');
  const [city, setCity] = useState('');
  const [members, setMembers] = useState('1');
  const [lifestyle, setLifestyle] = useState('middle'); // frugal, middle, luxury

  // Computed Budget
  const [budget, setBudget] = useState(null);
  // { rent, groc, trans, util, shop, dine, hob, totalNeeds, totalWants, totalSave }

  // Logic
  const calculatePlan = () => {
    Keyboard.dismiss();
    const inc = parseNumber(income);
    const rentVal = parseNumber(fixedRent);
    const mem = parseInt(members) || 1;

    if (!inc || inc < 500) {
      Alert.alert('Input Error', 'Minimum income ₹500 required.');
      return;
    }
    
    // Logic Translation
    let baseFoodCost = 3000;
    if(lifestyle === 'frugal') baseFoodCost = 2500;
    if(lifestyle === 'luxury') baseFoodCost = 5000;

    let scaleFactor = 1;
    if (mem > 1) scaleFactor += 0.7;
    if (mem > 2) scaleFactor += (mem - 2) * 0.6;
    let idealGrocery = Math.floor(baseFoodCost * scaleFactor);

    let baseUtil = 1000;
    if(lifestyle === 'frugal') baseUtil = 600;
    if(lifestyle === 'luxury') baseUtil = 2000;
    let utilScale = 1 + ((mem-1) * 0.3);
    let idealUtility = Math.floor(baseUtil * utilScale);

    let baseTrans = 1500;
    let transScale = mem;
    if(mem > 2) transScale = mem * 0.8;
    let idealTransport = Math.floor(baseTrans * transScale);

    const calcRent = rentVal > 0 ? rentVal : Math.floor(inc * 0.30);
    const disposable = Math.max(0, inc - calcRent);
    
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

    const expenses = calcRent + idealGrocery + idealUtility + idealTransport + shopping + dining + entertainment;
    const savings = inc - expenses;

    setBudget({
      rent: calcRent,
      grocery: idealGrocery,
      utility: idealUtility,
      transport: idealTransport,
      shopping: shopping,
      dining: dining,
      entertainment: entertainment,
      savings: savings,
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
    <View style={[styles.container, { backgroundColor: '#fff7f5' }]}>
      
      {/* Brand Strip - MODIFIED: Removed brandBox background */}
      <View style={[styles.brandStrip, { paddingTop: insets.top + 15 }]}>
        <View style={{flex: 1, flexDirection:'row', alignItems:'center', marginRight: 10}}>
          {/* Logo Image directly here, tinted maroon */}
          <Image 
            source={require('./assets/icon.png')} 
            style={{width: 40, height: 40}} 
            resizeMode="contain"
            tintColor="#8b0a14" 
          />
          <View style={{marginLeft: 12, flex: 1}}>
            <Text style={styles.brandTitle} numberOfLines={1}>ACCESCO <Text style={{color:'#8b0a14'}}>CALC</Text></Text>
            <Text style={styles.brandSub} numberOfLines={1}>Smart planner</Text>
          </View>
        </View>
        
        {/* Close/Back Button */}
        <TouchableOpacity onPress={onBack} style={styles.navBackBtn} activeOpacity={0.7}>
           <Ionicons name="close" size={24} color="#8b0a14" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 50, paddingTop: 10 }}>
        
        {/* INPUT CARD */}
        <View style={styles.calcCard}>
          <View style={styles.pillContainer}><Text style={styles.pillText}>Financial Setup</Text></View>
          <Text style={styles.cardHeading}>Budget & Income</Text>
          <Text style={styles.cardMuted}>Enter details to get a balanced plan.</Text>

          <View style={{marginTop: 20, gap: 14}}>
            <View>
              <Text style={styles.fieldLabel}>Total Monthly Income</Text>
              <View style={styles.moneyField}>
                <Text style={styles.moneySymbol}>₹</Text>
                <TextInput 
                  style={styles.fieldInput} 
                  placeholder="50000" 
                  keyboardType="numeric"
                  value={income}
                  onChangeText={(v) => setIncome(formatNumber(v))}
                />
              </View>
            </View>

            <View>
              <Text style={styles.fieldLabel}>Fixed Rent / EMI (Optional)</Text>
              <View style={styles.moneyField}>
                <Text style={styles.moneySymbol}>₹</Text>
                <TextInput 
                  style={styles.fieldInput} 
                  placeholder="15000" 
                  keyboardType="numeric"
                  value={fixedRent}
                  onChangeText={(v) => setFixedRent(formatNumber(v))}
                />
              </View>
            </View>

            <View style={{flexDirection:'row', gap: 10}}>
              <View style={{flex:1.2}}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput 
                  style={[styles.moneyField, {paddingVertical:12}]} 
                  placeholder="Mumbai"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{flex:0.8}}>
                 <Text style={styles.fieldLabel}>Members</Text>
                 <View style={styles.moneyField}>
                    <FontAwesome5 name="users" size={14} color="#8b0a14" style={{marginRight:8}} />
                    <TextInput 
                      style={styles.fieldInput} 
                      placeholder="1" 
                      keyboardType="numeric"
                      value={members}
                      onChangeText={(v) => setMembers(v.replace(/[^0-9]/g, ''))}
                    />
                 </View>
              </View>
            </View>

            {/* Lifestyle Selector */}
            <View style={{flexDirection:'row', backgroundColor:'#fbfbfb', borderRadius:12, padding:4, borderWidth:1, borderColor:'#eee'}}>
              {['frugal', 'middle', 'luxury'].map((mode) => (
                <TouchableOpacity 
                  key={mode} 
                  onPress={() => setLifestyle(mode)}
                  style={[
                    styles.lsOption, 
                    lifestyle === mode && styles.lsOptionActive
                  ]}
                >
                  <Text style={[styles.lsText, lifestyle === mode && styles.lsTextActive]}>
                    {mode === 'frugal' ? 'Student' : mode === 'middle' ? 'Pro' : 'Luxury'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.calcBtnPrimary} onPress={calculatePlan}>
              <Text style={styles.calcBtnText}>CALCULATE PLAN</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* RESULTS DASHBOARD */}
        {budget && (
          <View style={{marginTop: 20}}>
            
            {/* Stats Row */}
            <View style={[styles.calcCard, {flexDirection:'row', justifyContent:'space-between', paddingVertical: 20}]}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>NEEDS</Text>
                <Text style={styles.statValue}>₹{formatNumber(budget.totalNeeds)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, {color:'#b91c1c'}]}>WANTS</Text>
                <Text style={[styles.statValue, {color:'#b91c1c'}]}>₹{formatNumber(budget.totalWants)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, {color:'#16a34a'}]}>SAVE</Text>
                <Text style={[styles.statValue, {color:'#16a34a'}]}>₹{formatNumber(Math.max(0, budget.totalSave))}</Text>
              </View>
            </View>

            {/* Visual Bar */}
            <View style={styles.chartBarContainer}>
               <View style={{flex: budget.totalNeeds || 1, backgroundColor:'#8b0a14'}} />
               <View style={{flex: budget.totalWants || 1, backgroundColor:'#ef4444'}} />
               <View style={{flex: Math.max(0, budget.totalSave) || 1, backgroundColor:'#22c55e'}} />
            </View>

            {/* Detailed Cards Grid */}
            <View style={{gap: 16}}>
              
              {/* NEEDS */}
              <View style={styles.breakCard}>
                <View style={styles.breakHeader}>
                  <Text style={styles.breakTitle}>NEEDS</Text>
                  <FontAwesome5 name="home" size={16} color="#777" />
                </View>
                {[['Rent', 'rent'], ['Grocery', 'grocery'], ['Transport', 'transport'], ['Bills', 'utility']].map(([label, key]) => (
                  <View key={key} style={styles.breakRow}>
                    <Text style={styles.breakLabel}>{label.toUpperCase()}</Text>
                    <TextInput 
                      style={styles.breakInput}
                      value={String(budget[key])}
                      keyboardType="numeric"
                      onChangeText={(v) => updateField(key, v)}
                    />
                  </View>
                ))}
              </View>

              {/* WANTS */}
              <View style={styles.breakCard}>
                <View style={styles.breakHeader}>
                  <Text style={[styles.breakTitle, {color:'#b91c1c'}]}>WANTS</Text>
                  <FontAwesome5 name="shopping-bag" size={16} color="#b91c1c" />
                </View>
                {[['Shopping', 'shopping'], ['Dining', 'dining'], ['Entertain', 'entertainment']].map(([label, key]) => (
                  <View key={key} style={styles.breakRow}>
                    <Text style={styles.breakLabel}>{label.toUpperCase()}</Text>
                    <TextInput 
                      style={styles.breakInput}
                      value={String(budget[key])}
                      keyboardType="numeric"
                      onChangeText={(v) => updateField(key, v)}
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.ghostBtn} onPress={() => showToast('Smart cuts applied')}>
                   <Text style={styles.ghostBtnText}>✂️ Smart Cuts</Text>
                </TouchableOpacity>
              </View>

              {/* SAVINGS */}
              <View style={styles.breakCard}>
                <View style={{position:'absolute', right:12, top:12, backgroundColor:'#16a34a', paddingHorizontal:8, paddingVertical:4, borderRadius:8}}>
                  <Text style={{color:'white', fontSize:10, fontWeight:'bold'}}>AUTO</Text>
                </View>
                <View style={styles.breakHeader}>
                  <Text style={[styles.breakTitle, {color:'#166534'}]}>SAVINGS</Text>
                  <FontAwesome5 name="piggy-bank" size={16} color="#16a34a" />
                </View>
                <View style={{alignItems:'center', paddingVertical:10}}>
                  <Text style={{fontSize:28, fontWeight:'900', color: budget.totalSave < 0 ? '#dc2626' : '#16a34a'}}>
                    ₹{formatNumber(Math.max(0, budget.totalSave))}
                  </Text>
                  <Text style={styles.cardMuted}>Monthly Surplus</Text>
                </View>
                <View style={{borderTopWidth:1, borderTopColor:'#f1f1f1', paddingTop:12}}>
                   <TextInput style={styles.field} placeholder="E.g. Buy a Car" placeholderTextColor="#aaa" />
                   <TouchableOpacity style={[styles.calcBtnPrimary, {backgroundColor:'#16a34a', marginTop:10, height:44}]}>
                      <Text style={styles.calcBtnText}>🎯 Plan Goal</Text>
                   </TouchableOpacity>
                </View>
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
          <TouchableOpacity onPress={() => setIsLoginOpen(true)} style={styles.headerButton}>
            <Ionicons name="person-circle-outline" size={32} color="#1a1a1a" />
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
      <AppContent />
    </SafeAreaProvider>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flex: 1, backgroundColor: '#fff' },

  // Header
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', zIndex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', letterSpacing: -0.5, fontFamily: CUSTOM_FONT },
  headerButton: { padding: 4 },

  // Banner
  bannerContainer: { marginBottom: 20, backgroundColor: '#fff' },

  // Login Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  loginContainer: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 24, maxHeight: '85%' },
  loginHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  loginLogo: { width: 80, height: 80 },
  closeIcon: { marginTop: 10 },
  loginTitle: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 12, fontFamily: CUSTOM_FONT },
  loginSubtitle: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 30, fontFamily: CUSTOM_FONT },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  socialBtn: { flex: 1, height: 50, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  inputContainer: { marginBottom: 24 },
  loginInput: { height: 56, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 16, fontSize: 14, fontFamily: CUSTOM_FONT },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 30 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#999', borderRadius: 4, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#000', borderColor: '#000' },
  checkboxText: { flex: 1, fontSize: 12, color: '#333', lineHeight: 18, fontFamily: CUSTOM_FONT },
  authButtonsRow: { flexDirection: 'row', gap: 12 },
  signInBtn: { flex: 1, height: 50, backgroundColor: '#000', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  signInText: { color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: CUSTOM_FONT },
  signUpBtn: { flex: 1, height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: '#000', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  signUpText: { color: '#000', fontWeight: 'bold', fontSize: 16, fontFamily: CUSTOM_FONT },

  // Sidebar
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebarBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebarContainer: { backgroundColor: 'white', height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 5, padding: 20 },
  closeButton: { alignSelf: 'flex-end', padding: 5, marginBottom: 10 },
  sidebarLogoContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  sidebarLogo: { width: 120, height: 120 },
  menuLabel: { color: '#D6336C', fontSize: 14, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1, fontFamily: CUSTOM_FONT },
  menuList: { flex: 1 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuItemText: { fontSize: 16, color: '#333', letterSpacing: 1, fontWeight: '500', fontFamily: CUSTOM_FONT },

  // Hero
  heroContainer: { height: 400 },
  heroImage: { flex: 1, justifyContent: 'flex-end' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroContent: { padding: 24, paddingBottom: 48 },
  pill: { backgroundColor: '#700457', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 16 },
  pillText: { color: 'white', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', fontFamily: CUSTOM_FONT },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: 'bold', fontFamily: CUSTOM_FONT },
  heroBrand: { color: '#e879f9', fontSize: 32, fontWeight: 'bold', marginBottom: 24, fontFamily: CUSTOM_FONT },
  heroButtons: { flexDirection: 'row', gap: 16 },
  btnPrimary: { flex: 1, backgroundColor: '#700457', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnOutline: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontFamily: CUSTOM_FONT },

  // Stats
  statsBar: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#700457', fontSize: 20, fontWeight: 'bold', fontFamily: CUSTOM_FONT },
  statLabel: { color: '#64748b', fontSize: 12, fontFamily: CUSTOM_FONT },
  divider: { width: 1, backgroundColor: '#e2e8f0' },

  // Grid & Cards
  section: { padding: 20, backgroundColor: '#f8fafc' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 16, fontFamily: CUSTOM_FONT },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  cardItemWrapper: { width: '48%', height: 180, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  cardItemTouchable: { flex: 1 },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  cardContent: { flex: 1, padding: 12 },
  badge: { backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#000', letterSpacing: 0.5, fontFamily: CUSTOM_FONT },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', fontFamily: CUSTOM_FONT },
  cardSubtitle: { fontSize: 12, color: '#f1f5f9', marginTop: 2, fontFamily: CUSTOM_FONT },

  // CalcIQ (Updated Dimensions for Mobile & Icon)
  brandStrip: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: 16, paddingBottom: 15, marginBottom: 5 },
  // brandBox style is removed as it's no longer used
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#111', fontFamily: CUSTOM_FONT, flexShrink: 1 },
  brandSub: { fontSize: 11, color: '#8a8a8a', marginTop: 1, fontFamily: CUSTOM_FONT },
  navBackBtn: { width: 40, height: 40, alignItems:'center', justifyContent:'center', backgroundColor: 'rgba(139,10,20,0.06)', borderRadius: 20, marginLeft: 8 },
  
  calcCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#8b0a14', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset:{width:0,height:18}, elevation: 4 },
  pillContainer: { backgroundColor: 'rgba(139,10,20,0.06)', alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:4, borderRadius:20, marginBottom:10 },
  pillText: { color: '#8b0a14', fontSize: 11, fontWeight: '700', fontFamily: CUSTOM_FONT },
  cardHeading: { fontSize: 18, fontWeight: '800', color: '#111', fontFamily: CUSTOM_FONT },
  cardMuted: { color: '#8a8a8a', fontSize: 12, marginTop: 4, fontFamily: CUSTOM_FONT },
  
  fieldLabel: { color: '#777', fontSize: 11, fontWeight: '700', textTransform:'uppercase', marginBottom: 6, fontFamily: CUSTOM_FONT },
  moneyField: { flexDirection:'row', alignItems:'center', backgroundColor:'#fbfbfb', borderRadius:12, paddingHorizontal:12, height:48, borderWidth:1, borderColor:'#eee' },
  moneySymbol: { color:'#777', fontWeight:'700', marginRight:8 },
  fieldInput: { flex:1, fontSize:15, color:'#111', fontWeight:'600', height:'100%', fontFamily: CUSTOM_FONT },
  field: { width:'100%', backgroundColor:'#fbfbfb', borderRadius:12, paddingHorizontal:12, height:44, borderWidth:1, borderColor:'#eee' },

  lsOption: { flex:1, alignItems:'center', paddingVertical:8, borderRadius:10 },
  lsOptionActive: { backgroundColor: '#fff', shadowColor:'#000', shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  lsText: { fontSize:12, fontWeight:'600', color:'#888', fontFamily: CUSTOM_FONT },
  lsTextActive: { color:'#8b0a14', fontWeight:'800' },
  
  calcBtnPrimary: { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor: '#8b0a14', height:50, borderRadius:12, marginTop:10, shadowColor:'#8b0a14', shadowOpacity:0.2, shadowOffset:{width:0, height:8}, elevation:6, gap:8 },
  calcBtnText: { color:'white', fontWeight:'800', fontFamily: CUSTOM_FONT },

  statBox: { alignItems:'center', flex:1 },
  statLabel: { fontSize:10, fontWeight:'700', color:'#666', marginBottom:4, fontFamily: CUSTOM_FONT },
  statValue: { fontSize:16, fontWeight:'900', color:'#111', fontFamily: CUSTOM_FONT },
  
  chartBarContainer: { flexDirection:'row', height:12, borderRadius:6, overflow:'hidden', marginVertical:16, backgroundColor:'#eee' },
  
  breakCard: { backgroundColor:'#fff', borderRadius:14, padding:14, shadowColor:'#000', shadowOpacity:0.03, shadowRadius:12, elevation:2 },
  breakHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  breakTitle: { fontSize:14, fontWeight:'800', color:'#111', fontFamily: CUSTOM_FONT },
  breakRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  breakLabel: { fontSize:11, color:'#777', fontWeight:'600', fontFamily: CUSTOM_FONT },
  breakInput: { width:90, textAlign:'right', borderBottomWidth:1, borderBottomColor:'#eee', paddingVertical:4, fontSize:14, fontWeight:'600', color:'#333', fontFamily: CUSTOM_FONT },
  
  ghostBtn: { backgroundColor:'#fff', borderWidth:1, borderColor:'rgba(139,10,20,0.08)', borderRadius:12, paddingVertical:10, alignItems:'center', marginTop:8 },
  ghostBtnText: { color:'#8b0a14', fontWeight:'700', fontSize:13, fontFamily: CUSTOM_FONT },

  // Coming Soon
  comingSoonBody: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconCircleBig: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(112, 4, 87, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  comingSoonTitle: { fontSize: 28, fontWeight: 'bold', color: '#700457', marginBottom: 12, fontFamily: CUSTOM_FONT },
  comingSoonSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, fontFamily: CUSTOM_FONT },

  // Resources
  resourcesSection: { backgroundColor: '#fff9f9', paddingVertical: 48 },
  resourcesHeader: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
  resTagline: { color: '#b91c1c', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase', fontFamily: CUSTOM_FONT },
  resTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 12, fontFamily: CUSTOM_FONT },
  resSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', maxWidth: 320, lineHeight: 24, fontFamily: CUSTOM_FONT },
  resScrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  resCard: { backgroundColor: '#fff', width: 260, height: 180, borderRadius: 16, padding: 24, marginRight: 16, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  resCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#dc2626', marginBottom: 8, fontFamily: CUSTOM_FONT },
  resCardDesc: { fontSize: 14, color: '#64748b', lineHeight: 20, fontFamily: CUSTOM_FONT },
  resArrow: { alignSelf: 'flex-start', marginTop: 10 },

  // Footer
  footerContainer: { backgroundColor: '#0f0f0f', paddingVertical: 40, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: '#222' },
  footerContent: { marginBottom: 30 },
  footerBrandSection: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 24 },
  footerLogoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  footerLogo: { width: 80, height: 80, marginRight: 12, tintColor: '#D6336C' },
  footerBrandName: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 0.5, fontFamily: CUSTOM_FONT },
  footerTagline: { color: '#9ca3af', fontSize: 15, lineHeight: 22, maxWidth: 300, fontFamily: CUSTOM_FONT },
  footerLinksContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 20 },
  footerColumn: { flex: 1 },
  footerColTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 16, fontFamily: CUSTOM_FONT },
  footerLink: { color: '#9ca3af', fontSize: 14, marginBottom: 12, lineHeight: 20, fontFamily: CUSTOM_FONT },
  footerBottom: { borderTopWidth: 1, borderTopColor: '#262626', paddingTop: 24, alignItems: 'center' },
  footerCopyright: { color: '#6b7280', fontSize: 13, fontFamily: CUSTOM_FONT },
});