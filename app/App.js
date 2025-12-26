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
  TextInput,
  Alert,
  Modal,
  useWindowDimensions,
  Platform,
  ToastAndroid,
  Keyboard,
  Animated
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// ---------- CONFIGURATION ----------
const THEME = {
  primary: '#661354', // Brand magenta
  secondary: '#9A2363', // Brand pink
  accent: '#CC00CC', // Darker magenta
  bg: '#FCF5EE',
  white: '#FFFFFF',
  black: '#000000',
  text: '#333333',
  subText: '#666666',
  border: '#E0E0E0',
  badgeBg: '#fff3e0',
  badgeText: '#e65100',
  green: '#4CAF50',
};

// ---------- HELPERS ----------
const showToast = (msg) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    console.log(msg);
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

// ---------- COMPONENTS ----------

const VentureCard = ({ image, title, desc, badge, tags, btnText, onPress }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.ventureCard, { opacity: fadeAnim }, isDesktop && styles.ventureCardDesktop]}>
      {/* Handle both local require() (number) and remote URI (object) */}
      <Image 
        source={typeof image === 'number' ? image : { uri: image }} 
        style={[styles.ventureImg, isDesktop && styles.ventureImgDesktop]} 
        resizeMode="cover" 
      />

      <View style={[styles.ventureContent, isDesktop && styles.ventureContentDesktop]}>
        <View style={styles.ventureHeaderRow}>
          <Text style={[styles.ventureTitle, isDesktop && styles.ventureTitleDesktop]}>{title}</Text>
          {badge && (
            <View style={styles.ventureBadge}>
              <Text style={styles.ventureBadgeText}>{badge}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.ventureDesc, isDesktop && styles.ventureDescDesktop]} numberOfLines={2}>{desc}</Text>

        <View style={styles.ventureTagRow}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.ventureTag}>
               <Feather name={tag.icon} size={isDesktop ? 12 : 10} color="#666" style={{marginRight: 4}} />
               <Text style={[styles.ventureTagText, isDesktop && styles.ventureTagTextDesktop]}>{tag.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={onPress}>
          <LinearGradient colors={[THEME.primary, THEME.secondary]} style={[styles.ventureBtn, isDesktop && styles.ventureBtnDesktop]}>
            <Text style={[styles.ventureBtnText, isDesktop && styles.ventureBtnTextDesktop]}>{btnText}  ›</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const BannerCarousel = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);
  
  // Using ban1.jpg and ban2.jpg (Verified in your folder)
  const banners = [
    require('./assets/ban1.jpg'),
    require('./assets/ban2.jpg'), 
  ];

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

  const onScroll = ({ nativeEvent }) => {
    const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
    if (slide !== active) setActive(slide);
  };

  return (
    <View style={styles.bannerWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ width, height: isDesktop ? 320 : 180 }}
      >
        {banners.map((imgSource, i) => (
          <Image 
            key={i} 
            source={imgSource}
            style={{ width, height: isDesktop ? 320 : 180 }} 
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      {banners.length > 1 && (
        <View style={styles.pagination}>
            {banners.map((_, i) => (
            <View key={i} style={[styles.dot, active === i && styles.activeDot, isDesktop && styles.dotDesktop]} />
            ))}
        </View>
      )}
    </View>
  );
};

// ---------- CALCULATOR SCREEN ----------
const CalculatorScreen = ({ onBack }) => {
  const [income, setIncome] = useState('');
  const [fixedRent, setFixedRent] = useState('');
  const [members, setMembers] = useState('1');
  const [lifestyle, setLifestyle] = useState('middle');
  const [budget, setBudget] = useState(null);

  const calculatePlan = () => {
    Keyboard.dismiss();
    const inc = parseNumber(income);
    const rentVal = parseNumber(fixedRent);
    const mem = parseInt(members) || 1;

    if (!inc || inc < 500) {
      Alert.alert('Details Required', 'Please enter a valid monthly income (min ₹500).');
      return;
    }
    
    // Logic
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

    const calcRent = rentVal > 0 ? rentVal : Math.floor(inc * 0.30);
    const disposable = Math.max(0, inc - calcRent);
    
    let remaining = disposable - (idealGrocery + idealUtility + idealTransport);
    let shopping = 0, dining = 0, entertainment = 0;

    if (remaining > 0) {
      shopping = Math.floor(remaining * 0.2);
      dining = Math.floor(remaining * 0.2);
      entertainment = Math.floor(remaining * 0.1);
    } else {
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
      shopping, dining, entertainment,
      savings,
      totalNeeds: calcRent + idealGrocery + idealUtility + idealTransport,
      totalWants: shopping + dining + entertainment,
      totalSave: savings
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

// ---------- HOME SCREEN ----------
const HomeScreen = ({ onNavigate, onService }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numColumns = 3; // 3 columns for both mobile and desktop to fit all services without scrolling

  return (
    <ScrollView style={{ flex: 1, backgroundColor: THEME.bg }} showsVerticalScrollIndicator={false}>
       
       <BannerCarousel />

       <TouchableOpacity style={[styles.promoBanner, isDesktop && styles.promoBannerDesktop]} onPress={() => onNavigate('calculator')}>
          <View>
             <Text style={[styles.promoTitle, isDesktop && styles.promoTitleDesktop]}>ACCESCO <Text style={{color: '#fff', fontWeight:'300'}}>CALC</Text></Text>
             <Text style={[styles.promoSub, isDesktop && styles.promoSubDesktop]}>Plan your wealth intelligently.</Text>
             <View style={styles.promoBtn}><Text style={styles.promoBtnText}>TRY NOW</Text></View>
          </View>
          <Ionicons name="calculator" size={isDesktop ? 100 : 60} color="rgba(255,255,255,0.2)" style={{position:'absolute', right: 20}} />
       </TouchableOpacity>

       {/* Static grid for services without scrolling */}
       <View style={{
         flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
         paddingHorizontal: 16, paddingBottom: 20
       }}>
         {[ 
           {
             image: require('./assets/delivery.jpg'),
             title: 'Grokly',
             badge: '60% OFF',
             desc: 'Eat Right. Live Better.',
             tags: [{icon:'clock', text:'14 min'}, {icon:'dollar-sign', text:'Cashback'}],
             btnText: 'ORDER NOW',
             onPress: () => onService('Grokly')
           },
           {
             image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=500',
             title: 'Swadisht',
             badge: '50% OFF',
             desc: 'food delivered with love',
             tags: [{icon:'clock', text:'30 min'}, {icon:'star', text:'Chef picks'}],
             btnText: 'ORDER NOW',
             onPress: () => onService('Swadisht')
           },
           {
             image: require('./assets/ban2.jpg'),
             title: 'InstaStyle',
             badge: 'NEW',
             desc: 'Instant Style, Zero Guesswork.',
             tags: [{icon:'camera', text:'Try in AR'}, {icon:'zap', text:'Fresh drops'}],
             btnText: 'EXPLORE',
             onPress: () => onService('InstaStyle')
           },
           {
             image: require('./assets/dineout.jpg'),
             title: 'Dineout',
             badge: 'Cashback',
             desc: 'Table ready before you are.',
             tags: [{icon:'calendar', text:'Reserve'}, {icon:'tag', text:'Offers'}],
             btnText: 'RESERVE',
             onPress: () => onService('Dineout')
           },
           {
             image: require('./assets/coin.jpg'),
             title: 'AccesGO',
             badge: '14 mins',
             desc: 'City hops without surge or haggling.',
             tags: [{icon:'battery-charging', text:'EV Pods'}, {icon:'clock', text:'24/7'}],
             btnText: 'BOOK NOW',
             onPress: () => onService('AccesGO')
           }
         ].map((service, idx) => (
           <View key={service.title} style={{ width: `${100 / numColumns - 2}%`, marginBottom: 6 }}>
             <VentureCard {...service} />
           </View>
         ))}
       </View>
       <View style={{height: 100}} />
    </ScrollView>
  );
};

// ---------- MAIN LAYOUT ----------
function MainLayout() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Home');
  const [modalVisible, setModalVisible] = useState(false);
  const [serviceName, setServiceName] = useState('');

  const handleService = (name) => {
    setServiceName(name);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" backgroundColor={THEME.primary} />
      {activeTab === 'Home' && (
          <LinearGradient colors={[THEME.primary, THEME.secondary]} style={styles.header}>
            <View style={styles.headerTop}>
                <View style={styles.brandContainer}>
                    <Image 
                      source={require('./assets/icon.png')} 
                      style={{width: 30, height: 30, marginRight: 8}} 
                      resizeMode="contain" 
                    />
                    <Text style={styles.headerTitle}>ACCESCO</Text>
                </View>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="notifications-outline" size={24} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="cart-outline" size={24} color="#fff" /></TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#666" />
                <Text style={styles.searchText}>Search services...</Text>
            </TouchableOpacity>
          </LinearGradient>
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

      <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                  <View style={styles.modalIcon}>
                      <Ionicons name="construct" size={32} color={THEME.primary} />
                  </View>
                  <Text style={styles.modalTitle}>{serviceName}</Text>
                  <Text style={styles.modalSub}>This feature is coming soon!</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.mainBtn}>
                      <Text style={styles.mainBtnText}>OKAY</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>
    </View>
  );
}

// ---------- EXPORT ----------
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
  header: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 10 },
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
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: 'hidden',
    paddingBottom: 6
  },
  ventureCardDesktop: {
    marginRight: 10,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ventureImg: {
    width: '100%',
    height: 70, // Even smaller image for compact
    backgroundColor: '#eee',
  },
  ventureImgDesktop: {
    height: 160,
  },
  ventureContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  ventureContentDesktop: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  ventureTitleDesktop: {
    fontSize: 22,
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
  ventureDescDesktop: {
    fontSize: 15,
    lineHeight: 22,
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
  ventureTagTextDesktop: {
    fontSize: 12,
  },
  ventureBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  ventureBtnDesktop: {
    paddingVertical: 16,
  },
  ventureBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  ventureBtnTextDesktop: {
    fontSize: 14,
  },
  promoBanner: { marginHorizontal: 16, marginBottom: 24, backgroundColor: THEME.secondary, borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  promoBannerDesktop: {
    marginHorizontal: 32,
    padding: 40,
  },
  promoTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  promoTitleDesktop: {
    fontSize: 28,
  },
  promoSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 12 },
  promoSubDesktop: {
    fontSize: 14,
    marginBottom: 16,
  },
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