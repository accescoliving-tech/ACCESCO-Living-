import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-chart-kit';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- CONFIG ---
// REPLACE THIS WITH YOUR ACTUAL API KEY
const GEMINI_API_KEY = "";

// --- THEME COLORS ---
const COLORS = {
    maroon: '#800000',
    maroonLight: '#fde8e8',
    maroonDark: '#630000',
    green: '#16a34a',
    greenLight: '#dcfce7',
    text: '#1f2937',
    textLight: '#6b7280',
    bg: '#ffffff',
    bgAlt: '#f9fafb',
    border: '#e5e7eb',
};

// --- COMPONENTS ---

const InputField = ({ label, value, onChange, placeholder, icon, type = 'default' }) => (
    <View className="mb-4">
        <Text className="text-xs font-bold text-slate-500 uppercase mb-1 ml-1">{label}</Text>
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            {icon && <Ionicons name={icon} size={20} color="#6b7280" style={{ marginRight: 10 }} />}
            {type === 'currency' && <Text className="text-slate-500 font-bold mr-2">₹</Text>}
            <TextInput
                className="flex-1 text-lg font-bold text-slate-900"
                placeholder={placeholder}
                placeholderTextColor="#cbd5e1"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
            />
        </View>
    </View>
);

const StatCard = ({ label, value, color }) => (
    <View className="items-center flex-1">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</Text>
        <Text style={{ color: color }} className="text-xl font-black mt-1">₹{value.toLocaleString()}</Text>
    </View>
);

const BreakdownCard = ({ title, icon, color, children, borderColor }) => (
    <View className={`bg-white p-5 rounded-2xl border-t-4 shadow-sm mb-4 border-slate-100`} style={{ borderTopColor: borderColor }}>
        <View className="flex-row justify-between items-center mb-4">
            <Text className="font-black text-lg" style={{ color: color }}>{title}</Text>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <View className="space-y-3">
            {children}
        </View>
    </View>
);

const BreakdownInput = ({ label, value, onChange }) => (
    <View className="flex-row justify-between items-center mb-2">
        <Text className="text-xs font-bold text-slate-500">{label}</Text>
        <View className="flex-row items-center border-b border-slate-200 pb-1 w-24">
            <Text className="text-slate-400 text-xs mr-1">₹</Text>
            <TextInput
                className="text-right font-bold text-slate-800 text-sm flex-1"
                value={String(value)}
                onChangeText={(t) => onChange(t)}
                keyboardType="numeric"
            />
        </View>
    </View>
);

// --- MAIN SCREEN ---

export default function CalculatorScreen({ onBack }) {
    // Setup State
    const [income, setIncome] = useState('');
    const [fixedRent, setFixedRent] = useState('');
    const [city, setCity] = useState('');
    const [lifestyle, setLifestyle] = useState('middle'); // frugal, middle, luxury
    const [members, setMembers] = useState('1');

    // Dashboard State
    const [showDashboard, setShowDashboard] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiReasoning, setAiReasoning] = useState('');

    // Budget State
    const [budget, setBudget] = useState({
        rent: 0, grocery: 0, transport: 0, utility: 0,
        shopping: 0, dining: 0, entertainment: 0,
        savings: 0
    });

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState(null);
    const [loadingText, setLoadingText] = useState('');

    // --- LOGIC ---

    const calculatePlan = async () => {
        const inc = parseFloat(income);
        if (!inc || inc < 500) {
            Alert.alert("Error", "Please enter a valid monthly income (min ₹500).");
            return;
        }
        if (!city) {
            Alert.alert("Error", "Please enter your city.");
            return;
        }

        setIsAnalyzing(true);

        // Simulate Processing Delay for "AI Feel"
        setTimeout(async () => {
            // 1. Consumption Model (Offline Logic)
            const mem = parseInt(members) || 1;
            const rentVal = parseFloat(fixedRent) || 0;

            // Base Costs
            let baseFood = lifestyle === 'frugal' ? 2500 : lifestyle === 'luxury' ? 5000 : 3000;
            let baseUtil = lifestyle === 'frugal' ? 600 : lifestyle === 'luxury' ? 2000 : 1000;
            let baseTrans = 1500;

            // Scaling
            let scale = 1 + (mem > 1 ? 0.7 : 0) + (mem > 2 ? (mem - 2) * 0.6 : 0);
            let utilScale = 1 + ((mem - 1) * 0.3);
            let transScale = mem > 2 ? mem * 0.8 : mem;

            let idealGroc = Math.floor(baseFood * scale);
            let idealUtil = Math.floor(baseUtil * utilScale);
            let idealTrans = Math.floor(baseTrans * transScale);
            let idealRent = rentVal > 0 ? rentVal : Math.floor(inc * 0.30);

            // Wants Allocation
            const disposable = Math.max(0, inc - idealRent);
            let remaining = disposable - (idealGroc + idealUtil + idealTrans);

            let shop = 0, dine = 0, fun = 0;
            if (remaining > 0) {
                shop = Math.floor(remaining * 0.2);
                dine = Math.floor(remaining * 0.2);
                fun = Math.floor(remaining * 0.1);
            } else {
                // Deficit: Scale down needs (except rent)
                const totalNeeds = idealGroc + idealUtil + idealTrans;
                const ratio = Math.max(0, disposable) / totalNeeds;
                idealGroc = Math.floor(idealGroc * ratio);
                idealUtil = Math.floor(idealUtil * ratio);
                idealTrans = Math.floor(idealTrans * ratio);
            }

            // AI Enhancement (If Key Exists)
            let reasoning = `Budget optimized for ${mem} person(s) in ${city} with a ${lifestyle} lifestyle.`;

            if (GEMINI_API_KEY) {
                try {
                    // Placeholder for actual AI call if we wanted to make it async here
                    // For now, we use the robust offline logic as the base
                } catch (e) {
                    console.log("AI Error", e);
                }
            }

            setBudget({
                rent: idealRent,
                grocery: idealGroc,
                transport: idealTrans,
                utility: idealUtil,
                shopping: shop,
                dining: dine,
                entertainment: fun,
                savings: Math.max(0, inc - (idealRent + idealGroc + idealTrans + idealUtil + shop + dine + fun))
            });

            setAiReasoning(reasoning);
            setIsAnalyzing(false);
            setShowDashboard(true);
        }, 1500);
    };

    const updateBudget = (field, value) => {
        const val = parseFloat(value) || 0;
        const newBudget = { ...budget, [field]: val };

        // Recalculate Savings
        const totalEx = newBudget.rent + newBudget.grocery + newBudget.transport + newBudget.utility +
            newBudget.shopping + newBudget.dining + newBudget.entertainment;
        newBudget.savings = Math.max(0, parseFloat(income) - totalEx);

        setBudget(newBudget);
    };

    // --- AI FEATURES ---

    const callGemini = async (prompt) => {
        if (!GEMINI_API_KEY) {
            setModalContent(<Text className="text-red-500 font-bold text-center">Please add your GEMINI_API_KEY in the code to use AI features.</Text>);
            return null;
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                return JSON.parse(text);
            }
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const openAiAudit = async () => {
        setModalVisible(true);
        setModalTitle("Financial Health Audit");
        setLoadingText("Analyzing spending habits...");
        setModalContent(null);

        const prompt = `Analyze this monthly budget for someone in ${city} with Income ₹${income}: Rent ₹${budget.rent}, Grocery ₹${budget.grocery}, Wants ₹${budget.shopping + budget.dining}. Provide a short, brutal financial health check.
    Return JSON: { score: number(0-100), verdict: "string title", analysis_points: ["string", "string", "string"] }`;

        const data = await callGemini(prompt);

        if (data) {
            let color = data.score > 70 ? 'text-green-600' : (data.score > 40 ? 'text-orange-500' : 'text-red-600');
            setModalContent(
                <View>
                    <View className="items-center mb-6">
                        <Text className={`text-6xl font-black ${color} mb-2`}>{data.score}</Text>
                        <Text className="text-xl font-bold text-slate-800">{data.verdict}</Text>
                    </View>
                    <View className="space-y-3">
                        {data.analysis_points.map((p, i) => (
                            <View key={i} className={`bg-slate-50 p-3 rounded-lg border-l-4 ${data.score > 50 ? 'border-blue-500' : 'border-red-500'} mb-2`}>
                                <Text className="text-sm text-slate-700">{p}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            );
        } else if (GEMINI_API_KEY) {
            setModalContent(<Text className="text-center text-slate-500">AI is taking a nap. Try again later.</Text>);
        }
    };

    const openSmartCuts = async () => {
        setModalVisible(true);
        setModalTitle("Smart Cuts Strategy");
        setLoadingText("Finding savings...");
        setModalContent(null);

        const prompt = `Suggest 3 specific, actionable ways to cut costs for a person in ${city} spending: Shopping ₹${budget.shopping}, Dining ₹${budget.dining}, Entertainment ₹${budget.entertainment}.
    Return JSON: { tips: [{ title: "string", saving_est: "string (e.g. ₹500/mo)", detail: "string" }] }`;

        const data = await callGemini(prompt);

        if (data) {
            setModalContent(
                <View className="space-y-4">
                    {data.tips.map((t, i) => (
                        <View key={i} className="flex-row gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-sm mb-3">
                            <View className="bg-purple-100 w-10 h-10 items-center justify-center rounded-full">
                                <Text>✂️</Text>
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className="font-bold text-slate-800 flex-1 mr-2">{t.title}</Text>
                                    <View className="bg-green-100 px-2 py-1 rounded">
                                        <Text className="text-[10px] font-bold text-green-700">{t.saving_est}</Text>
                                    </View>
                                </View>
                                <Text className="text-xs text-slate-500 leading-4">{t.detail}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            );
        } else if (GEMINI_API_KEY) {
            setModalContent(<Text className="text-center text-slate-500">No cuts found. You might be frugal enough!</Text>);
        }
    };

    // --- RENDER ---

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* HEADER */}
            <View className="px-6 py-4 border-b border-slate-100 flex-row justify-between items-center bg-white z-10">
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={onBack}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.maroon} />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-slate-900 tracking-tighter">
                        ACCESCO <Text style={{ color: COLORS.maroon }}>CALCULATOR</Text>
                    </Text>
                </View>
                <View className="bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    <Text className="text-[10px] font-bold text-red-800">INDIA 2025</Text>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>

                {/* SETUP SECTION */}
                <View className="p-6">
                    <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <Text className="text-xs font-bold text-red-800 uppercase mb-4 tracking-wider border-b border-slate-100 pb-2">Financial Setup</Text>

                        <InputField label="Total Monthly Income" value={income} onChange={setIncome} placeholder="50000" type="currency" />
                        <InputField label="Fixed Rent / EMI (Optional)" value={fixedRent} onChange={setFixedRent} placeholder="15000" type="currency" />

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-xs font-bold text-slate-500 uppercase mb-1 ml-1">City</Text>
                                <TextInput className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800" value={city} onChangeText={setCity} placeholder="Mumbai" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Members</Text>
                                <TextInput className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800" value={members} onChangeText={setMembers} placeholder="1" keyboardType="numeric" />
                            </View>
                        </View>

                        <Text className="text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Lifestyle</Text>
                        <View className="flex-row gap-2 mb-6">
                            {['frugal', 'middle', 'luxury'].map((l) => (
                                <TouchableOpacity
                                    key={l}
                                    onPress={() => setLifestyle(l)}
                                    className={`flex-1 py-3 rounded-xl border ${lifestyle === l ? 'bg-red-50 border-red-800' : 'bg-slate-50 border-slate-200'}`}
                                >
                                    <Text className={`text-center text-xs font-bold uppercase ${lifestyle === l ? 'text-red-800' : 'text-slate-500'}`}>{l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={calculatePlan}
                            disabled={isAnalyzing}
                            className="w-full bg-red-900 py-4 rounded-xl shadow-lg active:bg-red-950 flex-row justify-center items-center"
                        >
                            {isAnalyzing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white font-bold text-lg mr-2">CALCULATE PLAN</Text>
                                    <Ionicons name="arrow-forward" size={20} color="white" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* DASHBOARD */}
                {showDashboard && (
                    <View className="px-6 space-y-6">

                        {/* AI Insight */}
                        <View className="bg-red-50 p-4 rounded-xl border-l-4 border-red-800">
                            <Text className="text-red-900 text-xs font-medium leading-5">
                                <Text className="font-bold">AI Insight: </Text>{aiReasoning}
                            </Text>
                        </View>

                        {/* Stats Bar */}
                        <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-row justify-between">
                            <StatCard label="Needs" value={budget.rent + budget.grocery + budget.transport + budget.utility} color="#1f2937" />
                            <View className="w-[1px] bg-slate-200 h-full" />
                            <StatCard label="Wants" value={budget.shopping + budget.dining + budget.entertainment} color="#991b1b" />
                            <View className="w-[1px] bg-slate-200 h-full" />
                            <StatCard label="Savings" value={budget.savings} color="#16a34a" />
                        </View>

                        {/* Charts */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-4">
                            <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 items-center justify-center mr-4">
                                <PieChart
                                    data={[
                                        { name: 'Needs', population: budget.rent + budget.grocery + budget.transport + budget.utility, color: '#800000', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                                        { name: 'Wants', population: budget.shopping + budget.dining + budget.entertainment, color: '#b91c1c', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                                        { name: 'Savings', population: budget.savings, color: '#16a34a', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                                    ]}
                                    width={SCREEN_WIDTH - 80}
                                    height={200}
                                    chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                                    accessor="population"
                                    backgroundColor="transparent"
                                    paddingLeft="15"
                                    absolute
                                />
                            </View>
                        </ScrollView>

                        {/* Breakdown Cards */}
                        <View>
                            <BreakdownCard title="NEEDS" icon="home" color="#1f2937" borderColor="#800000">
                                <BreakdownInput label="RENT" value={budget.rent} onChange={(v) => updateBudget('rent', v)} />
                                <BreakdownInput label="GROCERY" value={budget.grocery} onChange={(v) => updateBudget('grocery', v)} />
                                <BreakdownInput label="TRANSPORT" value={budget.transport} onChange={(v) => updateBudget('transport', v)} />
                                <BreakdownInput label="BILLS" value={budget.utility} onChange={(v) => updateBudget('utility', v)} />
                            </BreakdownCard>

                            <BreakdownCard title="WANTS" icon="cart" color="#991b1b" borderColor="#b91c1c">
                                <BreakdownInput label="SHOPPING" value={budget.shopping} onChange={(v) => updateBudget('shopping', v)} />
                                <BreakdownInput label="DINING" value={budget.dining} onChange={(v) => updateBudget('dining', v)} />
                                <BreakdownInput label="ENTERTAIN" value={budget.entertainment} onChange={(v) => updateBudget('entertainment', v)} />
                                <TouchableOpacity onPress={openSmartCuts} className="mt-2 py-3 border border-red-200 rounded-lg bg-red-50">
                                    <Text className="text-center text-red-800 font-bold text-xs">✂️ AI SMART CUTS</Text>
                                </TouchableOpacity>
                            </BreakdownCard>

                            <BreakdownCard title="SAVINGS" icon="wallet" color="#16a34a" borderColor="#16a34a">
                                <View className="items-center py-4">
                                    <Text className="text-4xl font-black text-green-600">₹{Math.floor(budget.savings).toLocaleString()}</Text>
                                    <Text className="text-[10px] text-slate-400 font-bold uppercase mt-1">Monthly Surplus</Text>
                                </View>
                                <TouchableOpacity onPress={openAiAudit} className="w-full py-3 bg-green-700 rounded-lg shadow-sm">
                                    <Text className="text-white text-center font-bold text-xs">🎯 AI AUDIT</Text>
                                </TouchableOpacity>
                            </BreakdownCard>
                        </View>

                    </View>
                )}
            </ScrollView>

            {/* AI MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl h-[70%] p-6">
                        <View className="flex-row justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <Text className="text-xl font-black text-red-900">{modalTitle}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#991b1b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {!modalContent ? (
                                <View className="items-center justify-center py-10">
                                    <ActivityIndicator size="large" color="#800000" />
                                    <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">{loadingText}</Text>
                                </View>
                            ) : (
                                modalContent
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
