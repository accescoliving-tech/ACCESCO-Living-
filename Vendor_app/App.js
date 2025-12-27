// App.js
import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications'; // NEW IMPORT
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Platform,
  ToastAndroid,
  FlatList,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Animated,
  ImageBackground,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// ---------- SUPABASE CONFIGURATION ----------
// 🚨 REPLACE WITH YOUR ACTUAL KEYS
const SUPABASE_URL = 'https://jgliqmqielkvncjpiowx.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_XXKvo7uRkmGIKmYK-xIxhg_an2IvBTO';

let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.warn("Supabase init failed. Check keys.");
}

// ---------- NOTIFICATION CONFIGURATION ----------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------- THEME ----------
const COLORS = {
  brand: 'rgb(112,4,87)', // ACCESCO Maroon
  brandSoft: '#FDF2F8',   
  orange: '#FC8019',      
  green: '#10B981',       
  red: '#EF4444',         
  gold: '#F59E0B',
  blue: '#3B82F6',        // Added Blue for Driver info
  textDark: '#1F2937',    
  textGray: '#6B7280',    
  bg: '#F3F4F6',          
  white: '#FFFFFF',
  border: '#E5E7EB',
};

// ---------- HELPERS ----------
const showToast = (msg) => {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert('Notice', msg);
};

const formatCurrency = (amount) => {
  return '₹' + Number(amount).toFixed(0).replace(/(\d)(?=(\d{2})+\d\.)/g, '$1,');
};

const getStatusColor = (status) => {
  switch(status?.toLowerCase()) {
    case 'completed': return COLORS.green;
    case 'cancelled': return COLORS.red;
    case 'accepted': return COLORS.blue; // New Status
    default: return COLORS.orange;
  }
};

// Mock Drivers for Simulation
const MOCK_DRIVERS = [
  { name: 'Ramesh Kumar', phone: '+91 98765 43210' },
  { name: 'Suresh Singh', phone: '+91 99887 76655' },
  { name: 'Amit Verma', phone: '+91 91234 56789' },
  { name: 'Rahul Sharma', phone: '+91 90000 11111' },
];

// ---------- COMPONENTS ----------

// 1. SIDEBAR
const Sidebar = ({ visible, onClose, onLogout, email, currentScreen, onNavigate }) => {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: -300, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const MenuLink = ({ icon, label, target }) => {
    const isActive = currentScreen === target;
    return (
      <TouchableOpacity 
        style={[styles.menuLink, isActive && styles.menuLinkActive]} 
        onPress={() => { onNavigate(target); onClose(); }}
      >
        <Feather name={icon} size={20} color={isActive ? COLORS.brand : COLORS.textGray} />
        <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View style={styles.sidebarOverlay}>
        <TouchableOpacity style={styles.sidebarBackdrop} onPress={onClose} />
        <Animated.View style={[styles.sidebarPanel, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarLogoContainer}>
               <Image source={require('./assets/icon.png')} style={styles.sidebarLogo} resizeMode="contain" />
            </View>
            <View style={{marginLeft: 12, flex: 1}}>
              <Text style={styles.sidebarName} numberOfLines={1}>ACCESCO LIVING</Text>
              <Text style={styles.sidebarEmail} numberOfLines={1}>{email}</Text>
            </View>
          </View>
          <View style={styles.sidebarDivider} />
          <View style={{padding: 16, gap: 8}}>
            <MenuLink icon="grid" label="Dashboard" target="dashboard" />
            <MenuLink icon="shopping-bag" label="Orders" target="orders" />
            <MenuLink icon="list" label="Menu Catalog" target="dashboard" /> 
            <MenuLink icon="trending-up" label="Sales Insights" target="dashboard" />
          </View>
          <View style={{flex: 1, justifyContent: 'flex-end', padding: 16}}>
            <TouchableOpacity style={styles.logoutRow} onPress={onLogout}>
              <Feather name="log-out" size={20} color={COLORS.red} />
              <Text style={[styles.menuText, {color: COLORS.red}]}>Logout</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>v2.6.0 • Partner App</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// 2. LOGIN SCREEN
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    if (!email || !password) return showToast("Enter email & password");
    if (password === 'accesco') {
      Keyboard.dismiss();
      onLogin(email.toLowerCase().trim());
    } else {
      Alert.alert("Login Failed", "Incorrect Password. Try 'accesco'");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1, backgroundColor: COLORS.white}}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View style={styles.loginBanner}>
          <View style={styles.logoBadge}>
            <Image source={require('./assets/icon.png')} style={styles.logoImg} resizeMode="contain" />
          </View>
          <Text style={styles.loginBrand}>ACCESCO LIVING</Text>
          <Text style={styles.loginTag}>PARTNER PORTAL</Text>
        </View>

        <View style={styles.loginForm}>
          <Text style={styles.label}>STORE EMAIL</Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color={COLORS.brand} style={{marginRight: 10}}/>
            <TextInput 
              style={styles.input} 
              placeholder="store@accescoliving.com" 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color={COLORS.brand} style={{marginRight: 10}}/>
            <TextInput 
              style={[styles.input, {flex:1}]} 
              placeholder="•••••••" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={()=>setShowPass(!showPass)}>
              <Feather name={showPass ? "eye" : "eye-off"} size={20} color={COLORS.textGray} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.9}>
            <Text style={styles.loginBtnText}>LOGIN DASHBOARD</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// 3. DASHBOARD SCREEN
const DashboardScreen = ({ vendorEmail, onAdd, onEdit, onOpenSidebar, onNavigate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayRevenue: 0, todayOrders: 0, pendingOrders: 0 });
  const [bestSellers, setBestSellers] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); 

  // --- REAL-TIME NOTIFICATION SETUP ---
  useEffect(() => {
    // 1. Request Permission
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') console.log('Permission not granted for notifications');
    })();

    // 2. Setup Supabase Realtime Channel
    const channel = supabase
      .channel('public:sales')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'sales',
          filter: `vendor_name=eq.${vendorEmail}` // Only listen for MY orders
        },
        (payload) => {
          // New Order Received!
          console.log('New Order:', payload.new);
          
          // Trigger Local Notification
          Notifications.scheduleNotificationAsync({
            content: {
              title: "🔔 New Order Received!",
              body: `${payload.new.item_name} - ${formatCurrency(payload.new.order_value)}`,
              sound: true
            },
            trigger: null, // Send immediately
          });

          // Refresh data
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorEmail]);
  // ------------------------------------

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);

    const { data: prodData } = await supabase.from('products').select('*').eq('vendor_name', vendorEmail);
    const { data: salesData } = await supabase.from('sales').select('*').eq('vendor_name', vendorEmail);

    if (prodData) setProducts(prodData);
    
    if (salesData) {
      const today = new Date().toISOString().split('T')[0];
      const todaySales = salesData.filter(item => item.created_at && item.created_at.startsWith(today));
      const pending = salesData.filter(item => item.status === 'Pending');
      const todayRev = todaySales.reduce((sum, item) => sum + (Number(item.order_value) || 0), 0);
      
      setStats({ 
        todayRevenue: todayRev, 
        todayOrders: todaySales.length,
        pendingOrders: pending.length
      });

      const itemCounts = {};
      salesData.forEach(s => {
        const name = s.item_name || 'Unknown';
        itemCounts[name] = (itemCounts[name] || 0) + 1;
      });
      const sortedBestSellers = Object.entries(itemCounts)
        .sort((a,b) => b[1] - a[1]) 
        .slice(0, 3) 
        .map(([name, count]) => ({ name, count }));
      setBestSellers(sortedBestSellers);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = (id) => {
    Alert.alert("Confirm Delete", "Permanently remove this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          const prev = [...products];
          setProducts(current => current.filter(p => p.id !== id));
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) { setProducts(prev); Alert.alert("Error", "Delete failed."); }
          else showToast("Item deleted");
      }}
    ]);
  };

  const handleRecordQuickSale = () => {
    Alert.alert("Quick Cash Sale", "Record a generic sale of ₹100?", [
      { text: "Cancel" },
      { text: "Confirm", onPress: async () => {
          const { error } = await supabase.from('sales').insert([{
            vendor_name: vendorEmail, 
            order_value: 100, 
            item_name: 'Quick Walk-in',
            status: 'Completed',
            customer_details: 'Walk-in',
            delivery_partner_name: null // Walk-ins don't need drivers
          }]);
          if(!error) { showToast("₹100 Sale Recorded"); fetchData(); }
      }}
    ]);
  };

  const getSortedProducts = () => {
    let sorted = products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortOrder === 'price_asc') sorted.sort((a,b) => a.price - b.price);
    else if (sortOrder === 'price_desc') sorted.sort((a,b) => b.price - a.price);
    else if (sortOrder === 'name') sorted.sort((a,b) => a.title.localeCompare(b.title));
    else sorted.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); 
    return sorted;
  };

  const cycleSort = () => {
    if (sortOrder === 'newest') { setSortOrder('price_asc'); showToast("Sorted by Price: Low to High"); }
    else if (sortOrder === 'price_asc') { setSortOrder('price_desc'); showToast("Sorted by Price: High to Low"); }
    else if (sortOrder === 'price_desc') { setSortOrder('name'); showToast("Sorted by Name"); }
    else { setSortOrder('newest'); showToast("Sorted by Newest"); }
  };

  const renderItem = ({ item }) => {
    const regPrice = Number(item.price) || 0;
    const salePrice = Number(item.sale_price) || 0;
    const isOnSale = salePrice > 0 && salePrice < regPrice;
    const discount = isOnSale ? Math.round(((regPrice - salePrice) / regPrice) * 100) : 0;

    return (
      <View style={styles.foodCard}>
        <View style={styles.foodInfo}>
          <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
            <View style={styles.vegRow}><View style={styles.vegIcon}><View style={styles.vegDot} /></View></View>
            {isOnSale && <View style={styles.offerBadge}><Text style={styles.offerText}>{discount}% OFF</Text></View>}
          </View>
          <Text style={styles.foodTitle}>{item.title}</Text>
          <View style={{flexDirection:'row', alignItems:'center', gap: 6, marginBottom: 4}}>
             <Text style={[styles.foodPrice, isOnSale && styles.strikethroughPrice]}>₹{regPrice}</Text>
             {isOnSale && <Text style={[styles.foodPrice, {color: COLORS.red, fontWeight:'900'}]}>₹{salePrice}</Text>}
          </View>
          <Text style={styles.foodDesc} numberOfLines={2}>{item.description || 'No description available.'}</Text>
        </View>
        <View style={styles.imageColumn}>
          <View style={styles.imageWrapper}>
             <Image source={{ uri: item.image_url }} style={styles.foodImage} />
             <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}><Feather name="edit-2" size={12} color={COLORS.brand} /></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.deleteLink} onPress={() => handleDelete(item.id)}><Text style={styles.deleteText}>REMOVE</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar}><Feather name="menu" size={24} color={COLORS.textDark} /></TouchableOpacity>
        <View style={styles.headerCenter}><Image source={require('./assets/icon.png')} style={styles.headerLogo} /><Text style={styles.headerTitle}>ACCESCO</Text></View>
        <TouchableOpacity onPress={fetchData}><Feather name="refresh-cw" size={20} color={COLORS.textDark} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{paddingBottom: 100}} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, {backgroundColor: COLORS.brand}]}>
             <Text style={[styles.statLabel, {color: 'rgba(255,255,255,0.7)'}]}>TODAY'S SALES</Text>
             <Text style={[styles.statValue, {color: 'white'}]}>{formatCurrency(stats.todayRevenue)}</Text>
             <Text style={{color:'rgba(255,255,255,0.5)', fontSize:10}}>{stats.todayOrders} orders today</Text>
          </View>
          <TouchableOpacity style={[styles.statCard, {backgroundColor: COLORS.orange}]} onPress={() => onNavigate('orders')}>
             <View style={{flexDirection:'row', justifyContent:'space-between'}}><Text style={[styles.statLabel, {color: 'white'}]}>PENDING</Text><Feather name="bell" size={16} color="white" /></View>
             <Text style={[styles.statValue, {color: 'white'}]}>{stats.pendingOrders}</Text>
             <Text style={{color:'rgba(255,255,255,0.8)', fontSize:10}}>Tap to view orders</Text>
          </TouchableOpacity>
        </View>
        {bestSellers.length > 0 && (
          <View style={styles.sectionContainer}>
             <View style={{flexDirection:'row', alignItems:'center', gap: 6, marginBottom: 8}}><MaterialCommunityIcons name="trophy" size={16} color={COLORS.gold} /><Text style={styles.sectionTitle}>BEST SELLERS</Text></View>
             <View style={styles.bestSellerRow}>
                {bestSellers.map((item, idx) => (
                  <View key={idx} style={styles.bestSellerCard}>
                    <View style={styles.rankBadge}><Text style={styles.rankText}>#{idx+1}</Text></View>
                    <Text style={styles.bsName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.bsCount}>{item.count} Sold</Text>
                  </View>
                ))}
             </View>
          </View>
        )}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionChip} onPress={handleRecordQuickSale}><Feather name="zap" size={14} color={COLORS.brand} /><Text style={styles.actionText}>Quick Sale (+100)</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => onNavigate('orders')}><Feather name="list" size={14} color={COLORS.textDark} /><Text style={styles.actionText}>View Orders</Text></TouchableOpacity>
        </View>
        <View style={{flexDirection:'row', alignItems:'center', marginHorizontal: 16}}>
          <View style={styles.searchContainer}><Feather name="search" size={18} color={COLORS.textGray} /><TextInput style={styles.searchInput} placeholder="Search menu..." value={searchQuery} onChangeText={setSearchQuery} /></View>
          <TouchableOpacity style={styles.sortBtn} onPress={cycleSort}><Feather name="sliders" size={20} color={COLORS.textDark} /></TouchableOpacity>
        </View>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>CATALOG ({products.length})</Text>
          <View style={styles.toggleRow}><Text style={[styles.statusText, {color: isOnline ? COLORS.green : 'gray'}]}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text><Switch value={isOnline} onValueChange={setIsOnline} trackColor={{true: COLORS.green}} thumbColor={'white'} style={{transform: [{scale: 0.8}]}} /></View>
        </View>
        {getSortedProducts().map(item => <View key={item.id}>{renderItem({item})}</View>)}
        {products.length === 0 && !loading && <View style={styles.emptyState}><Feather name="box" size={40} color={COLORS.textGray} /><Text style={styles.emptyTitle}>No Items Found</Text></View>}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={onAdd} activeOpacity={0.9}><Feather name="plus" size={26} color="white" /></TouchableOpacity>
    </View>
  );
};

// 4. ORDERS SCREEN (Updated with Delivery Assignment)
const OrdersScreen = ({ vendorEmail, onBack, onOpenSidebar }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sales')
      .select('*')
      .eq('vendor_name', vendorEmail)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // UPDATE: Assigns a Driver on Accept
  const acceptOrder = async (id) => {
    const randomDriver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
    
    const { error } = await supabase.from('sales').update({ 
      status: 'Accepted',
      delivery_partner_name: randomDriver.name,
      delivery_partner_phone: randomDriver.phone
    }).eq('id', id);

    if (!error) { 
      showToast(`Accepted & Assigned to ${randomDriver.name}`); 
      fetchOrders(); 
    } else {
      Alert.alert("Error", error.message);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase.from('sales').update({ status: newStatus }).eq('id', id);
    if (!error) { showToast(`Order ${newStatus}`); fetchOrders(); }
    else Alert.alert("Error", error.message);
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return o.status === 'Pending' || o.status === 'Accepted' || !o.status;
    return o.status === 'Completed' || o.status === 'Cancelled';
  });

  const OrderCard = ({ item }) => {
    const date = new Date(item.created_at);
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={{flexDirection:'row', alignItems:'center'}}>
            <View style={[styles.orderBadge, {backgroundColor: getStatusColor(item.status)}]}>
              <Text style={styles.orderBadgeText}>{item.status || 'PENDING'}</Text>
            </View>
            <Text style={styles.orderTime}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <Text style={styles.orderPrice}>{formatCurrency(item.order_value)}</Text>
        </View>
        <View style={styles.orderBody}>
          <Text style={styles.orderItemName}>{item.item_name || 'Unknown Item'}</Text>
          <Text style={styles.orderCustomer}>{item.customer_details || 'Walk-in Customer'}</Text>
          
          {/* DELIVERY PARTNER SECTION */}
          {item.delivery_partner_name && (
            <View style={styles.driverContainer}>
              <View style={styles.driverRow}>
                <View style={styles.driverIcon}><Feather name="user" size={12} color="white"/></View>
                <Text style={styles.driverName}>{item.delivery_partner_name}</Text>
              </View>
              <Text style={styles.driverPhone}>{item.delivery_partner_phone}</Text>
            </View>
          )}
        </View>

        {filter === 'active' && (
          <View style={styles.orderActions}>
             {/* Show ACCEPT only if Pending */}
             {(!item.status || item.status === 'Pending') && (
                <TouchableOpacity style={[styles.btnSmall, {backgroundColor: COLORS.blue, flex: 1}]} onPress={() => acceptOrder(item.id)}>
                   <Text style={{color: 'white', fontWeight:'bold', fontSize:12}}>ACCEPT ORDER</Text>
                </TouchableOpacity>
             )}

             {/* Show COMPLETE if Accepted */}
             {item.status === 'Accepted' && (
               <TouchableOpacity style={[styles.btnSmall, {backgroundColor: COLORS.green, flex: 1}]} onPress={() => updateStatus(item.id, 'Completed')}>
                 <Text style={{color: 'white', fontWeight:'bold', fontSize:12}}>MARK READY</Text>
               </TouchableOpacity>
             )}

             {/* Cancel always available */}
             <TouchableOpacity style={[styles.btnSmall, {borderColor: COLORS.red, borderWidth:1, width: 40}]} onPress={() => updateStatus(item.id, 'Cancelled')}>
               <Feather name="x" size={14} color={COLORS.red}/>
             </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar}><Feather name="menu" size={24} color={COLORS.textDark} /></TouchableOpacity>
        <Text style={styles.headerTitle}>ORDERS</Text>
        <TouchableOpacity onPress={fetchOrders}><Feather name="refresh-ccw" size={20} color={COLORS.textDark} /></TouchableOpacity>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, filter === 'active' && styles.activeTab]} onPress={() => setFilter('active')}>
          <Text style={[styles.tabText, filter === 'active' && styles.activeTabText]}>Active</Text>
          {orders.filter(o => o.status === 'Pending' || o.status === 'Accepted').length > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, filter === 'history' && styles.activeTab]} onPress={() => setFilter('history')}>
          <Text style={[styles.tabText, filter === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredOrders}
        renderItem={({item}) => <OrderCard item={item} />}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{padding: 16}}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} />}
        ListEmptyComponent={<View style={styles.emptyState}><Feather name="clipboard" size={50} color={COLORS.textGray} /><Text style={styles.emptyTitle}>No {filter} orders</Text></View>}
      />
    </View>
  );
};

// 5. MANAGE ITEM SCREEN (Fixed)
const ManageItemScreen = ({ vendorEmail, itemToEdit, onBack }) => {
  const isEdit = !!itemToEdit;
  const [form, setForm] = useState({
    title: itemToEdit?.title || '',
    price: itemToEdit?.price ? String(itemToEdit.price) : '',
    sale_price: itemToEdit?.sale_price ? String(itemToEdit.sale_price) : '', 
    description: itemToEdit?.description || '',
    image_url: itemToEdit?.image_url || '',
    is_available: itemToEdit?.is_available ?? true,
    stock: itemToEdit?.stock ?? 100
  });
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setForm({ ...form, image_url: result.assets[0].uri });
  };

  const handleSave = async () => {
    if(!form.title || !form.price) return showToast("Name and Price required");
    const regPrice = parseFloat(form.price);
    const salePriceRaw = parseFloat(form.sale_price);
    if (form.sale_price && salePriceRaw >= regPrice) { Alert.alert("Invalid Offer", "Offer price must be lower than regular price."); return; }
    setLoading(true);

    const img = form.image_url.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop';
    const finalSalePrice = (form.sale_price && salePriceRaw > 0) ? salePriceRaw : null;

    const payload = { title: form.title, price: regPrice, sale_price: finalSalePrice, description: form.description, image_url: img, is_available: form.is_available, stock: form.stock, vendor_name: vendorEmail };
    let error;
    if (isEdit) { const { error: err } = await supabase.from('products').update(payload).eq('id', itemToEdit.id); error = err; } 
    else { const { error: err } = await supabase.from('products').insert([payload]); error = err; }
    
    setLoading(false);
    if (!error) { showToast(isEdit ? "Item Updated" : "Item Created"); onBack(); } else Alert.alert("Database Error", error.message);
  };

  return (
    <View style={styles.container}>
      <View style={styles.editorHero}>
        <ImageBackground source={{ uri: form.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop' }} style={styles.heroBg} blurRadius={form.image_url ? 0 : 10}>
          <View style={styles.heroOverlay}>
            <View style={styles.modalHeaderTransparent}>
              <TouchableOpacity onPress={onBack} style={styles.roundBackBtn}><Feather name="arrow-left" size={24} color={COLORS.textDark} /></TouchableOpacity>
              <Text style={styles.heroTitle}>{isEdit ? 'Edit Item' : 'New Item'}</Text>
              <View style={{width: 40}} /> 
            </View>
          </View>
        </ImageBackground>
      </View>
      <ScrollView contentContainerStyle={styles.editorForm} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>IMAGE</Text><TouchableOpacity onPress={pickImage} style={{flexDirection:'row', alignItems:'center', gap: 10}}><Feather name="image" size={24} color={COLORS.brand} /><Text style={{ color: COLORS.brand, fontWeight: 'bold' }}>Pick from Gallery</Text></TouchableOpacity></View>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>DETAILS</Text>
          <TextInput style={[styles.fieldInput, {fontSize: 18, fontWeight: 'bold', marginBottom: 15}]} placeholder="Product Title" value={form.title} onChangeText={t => setForm({...form, title:t})} />
          <View style={{flexDirection: 'row', gap: 15}}>
             <View style={{flex: 1}}><Text style={{fontSize: 10, color: '#999', fontWeight:'bold', marginBottom: 5}}>REGULAR PRICE</Text><TextInput style={[styles.fieldInput, {fontSize: 20, color: COLORS.textDark, borderBottomWidth: 1, borderColor: '#eee'}]} placeholder="0" value={form.price} onChangeText={t => setForm({...form, price:t})} keyboardType="numeric" /></View>
             <View style={{flex: 1}}><Text style={{fontSize: 10, color: COLORS.red, fontWeight:'bold', marginBottom: 5}}>OFFER PRICE (Optional)</Text><TextInput style={[styles.fieldInput, {fontSize: 20, color: COLORS.red, borderBottomWidth: 1, borderColor: '#eee'}]} placeholder="0" value={form.sale_price} onChangeText={t => setForm({...form, sale_price:t})} keyboardType="numeric" /></View>
          </View>
        </View>
        <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>DESCRIPTION</Text><TextInput style={[styles.fieldInput, {height: 80, textAlignVertical:'top'}]} placeholder="Describe ingredients..." value={form.description} onChangeText={t => setForm({...form, description:t})} multiline /></View>
        <View style={{height: 100}} />
      </ScrollView>
      <View style={styles.floatingFooter}><TouchableOpacity style={styles.saveBtnBig} onPress={handleSave} disabled={loading}>{loading ? <ActivityIndicator color="white"/> : <Text style={styles.saveBtnTextBig}>SAVE PRODUCT</Text>}</TouchableOpacity></View>
    </View>
  );
};

// MAIN WRAPPER
function MainLayout() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState('login'); 
  const [vendorEmail, setVendorEmail] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <View style={{flex:1, backgroundColor:'white', paddingTop: insets.top}}>
      <StatusBar style="dark" />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} onLogout={() => setScreen('login')} email={vendorEmail} currentScreen={screen} onNavigate={setScreen} />
      {screen === 'login' && <LoginScreen onLogin={(email) => { setVendorEmail(email); setScreen('dashboard'); }} />}
      {screen === 'dashboard' && <DashboardScreen vendorEmail={vendorEmail} onAdd={() => { setEditItem(null); setScreen('manage'); }} onEdit={(item) => { setEditItem(item); setScreen('manage'); }} onOpenSidebar={() => setSidebarVisible(true)} onNavigate={setScreen} />}
      {screen === 'orders' && <OrdersScreen vendorEmail={vendorEmail} onBack={() => setScreen('dashboard')} onOpenSidebar={() => setSidebarVisible(true)} />}
      {screen === 'manage' && <ManageItemScreen vendorEmail={vendorEmail} itemToEdit={editItem} onBack={() => setScreen('dashboard')} />}
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  // Sidebar
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebarBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebarPanel: { width: '80%', backgroundColor: 'white', position: 'absolute', left: 0, top: 0, bottom: 0, shadowColor: '#000', elevation: 20 },
  sidebarHeader: { padding: 24, backgroundColor: COLORS.brand, paddingTop: 40, flexDirection:'row', alignItems:'center' },
  sidebarLogoContainer: { width: 50, height: 50, backgroundColor:'white', borderRadius: 25, padding: 8 },
  sidebarLogo: { width: '100%', height: '100%' },
  sidebarName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  sidebarEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  sidebarDivider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  menuLink: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 8 },
  menuLinkActive: { backgroundColor: COLORS.brandSoft },
  menuText: { fontSize: 16, marginLeft: 16, color: COLORS.textDark, fontWeight: '500' },
  menuTextActive: { color: COLORS.brand, fontWeight: 'bold' },
  logoutRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  versionText: { marginTop: 'auto', fontSize: 12, color: '#ccc', textAlign: 'center', paddingTop: 20 },
  // Login
  loginBanner: { height: 260, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderBottomRightRadius: 50 },
  logoBadge: { width: 100, height: 100, marginBottom: 16 },
  logoImg: { width: '100%', height: '100%' },
  loginBrand: { fontSize: 28, fontWeight: '900', color: COLORS.brand, letterSpacing: 1 },
  loginTag: { fontSize: 12, fontWeight: 'bold', color: COLORS.textGray, letterSpacing: 3 },
  loginForm: { padding: 32 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  input: { flex: 1, fontSize: 16, color: COLORS.textDark },
  loginBtn: { backgroundColor: COLORS.brand, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 4 },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  // Header
  header: { padding: 16, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 28, height: 28 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.brand },
  // Dashboard
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  actionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eee', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '600', color: COLORS.textDark },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginVertical: 5, paddingHorizontal: 12, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  sortBtn: { marginLeft: 10, width: 44, height: 44, backgroundColor:'white', borderRadius: 8, justifyContent:'center', alignItems:'center', borderWidth: 1, borderColor: '#E0E0E0' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16, marginTop: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, elevation: 2 },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  statValue: { fontSize: 22, fontWeight: '900', color: COLORS.textDark, marginTop: 6, marginBottom: 2 },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10, marginTop: 10 },
  menuTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.textGray, letterSpacing: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  // Best Sellers
  sectionContainer: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.textDark },
  bestSellerRow: { flexDirection: 'row', gap: 10 },
  bestSellerCard: { flex: 1, backgroundColor: 'white', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  rankBadge: { backgroundColor: COLORS.gold, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  rankText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  bsName: { fontSize: 12, fontWeight: '600', color: COLORS.textDark, textAlign: 'center' },
  bsCount: { fontSize: 10, color: COLORS.textGray, marginTop: 2 },
  // Food Card
  foodCard: { flexDirection: 'row', backgroundColor: 'white', padding: 16, marginBottom: 2, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  foodInfo: { flex: 1, paddingRight: 16 },
  vegRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  vegIcon: { width: 14, height: 14, borderWidth: 1, borderColor: COLORS.green, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  vegDot: { width: 8, height: 8, backgroundColor: COLORS.green, borderRadius: 4 },
  foodTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 2 },
  foodPrice: { fontSize: 14, color: COLORS.textDark, marginBottom: 6 },
  strikethroughPrice: { textDecorationLine: 'line-through', color: COLORS.textGray, fontSize: 12 },
  offerBadge: { backgroundColor: COLORS.red, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  offerText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  foodDesc: { fontSize: 12, color: COLORS.textGray, lineHeight: 18 },
  imageColumn: { alignItems: 'center' },
  imageWrapper: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden', backgroundColor: '#eee', position: 'relative' },
  foodImage: { width: '100%', height: '100%' },
  editBtn: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'white', padding: 6, borderRadius: 20, elevation: 2 },
  deleteLink: { marginTop: 8 },
  deleteText: { fontSize: 11, fontWeight: 'bold', color: COLORS.red, textDecorationLine: 'underline' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.brand, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  // Orders
  tabContainer: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.brand },
  tabText: { fontWeight: '600', color: COLORS.textGray },
  activeTabText: { color: COLORS.brand, fontWeight: 'bold' },
  notifDot: { position: 'absolute', top: 12, right: 30, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  orderCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8 },
  orderBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  orderTime: { color: COLORS.textGray, fontSize: 12 },
  orderPrice: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  orderBody: { borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 12, marginBottom: 12 },
  orderItemName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  orderCustomer: { fontSize: 13, color: COLORS.textGray, marginTop: 4 },
  orderActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  btnSmall: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  driverContainer: { marginTop: 12, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  driverRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  driverIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.blue, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  driverName: { fontWeight: 'bold', color: COLORS.blue, fontSize: 13 },
  driverPhone: { fontSize: 12, color: COLORS.textGray, marginLeft: 28 },
  // Editor
  editorHero: { height: 200, backgroundColor: COLORS.bg },
  heroBg: { flex: 1, justifyContent: 'flex-start' },
  heroOverlay: { backgroundColor: 'rgba(0,0,0,0.3)', flex: 1 },
  modalHeaderTransparent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  roundBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 },
  editorForm: { padding: 20, paddingBottom: 120, backgroundColor: COLORS.bg },
  fieldContainer: { marginBottom: 20, backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', marginBottom: 12, letterSpacing: 0.5 },
  fieldInput: { fontSize: 16, color: COLORS.textDark },
  floatingFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
  saveBtnBig: { backgroundColor: COLORS.brand, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: COLORS.brand, shadowOpacity: 0.3, elevation: 5 },
  saveBtnTextBig: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  emptyState: { alignItems: 'center', marginTop: 50, opacity: 0.6 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginTop: 10 },
});