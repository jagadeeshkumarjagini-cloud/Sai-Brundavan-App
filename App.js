import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Camera, FileText, Trash2, Plus, Sparkles, UserPlus, X, Share2 } from 'lucide-react-native';

const OCR_API_KEY = 'K81963065788957'; // Your working Free Key

export default function App() {
  const [expenses, setEx] = useState([]);
  const [mV, setMV] = useState(false);
  const [pMV, setPMV] = useState(false);
  const [isProc, setProc] = useState(false);
  
  const [month, setMonth] = useState(new Date().toLocaleString('default',{month:'long',year:'numeric'}));
  const [oB, setOB] = useState('16725');
  const [wR, setWR] = useState('6597');
  const [mR, setMR] = useState('22800');
  const [wP, setWP] = useState([]);
  const [mP, setMP] = useState([]);
  const [pT, setPT] = useState('Water'); 

  const [pF, setPF] = useState(''); const [pA, setPA] = useState(''); const [pM, setPM] = useState('');
  const [vend, setVend] = useState(''); const [amt, setAmt] = useState(''); const [rem, setRem] = useState('');
  const [img, setImg] = useState(null);

  const tE = expenses.reduce((s, e) => s + e.amount, 0);
  const tI = (parseFloat(oB)||0) + (parseFloat(wR)||0) + (parseFloat(mR)||0);
  const totWP = wP.reduce((s, p) => s + (parseFloat(p.amt)||0), 0);
  const totMP = mP.reduce((s, p) => s + (parseFloat(p.amt)||0), 0);

  const getHTML = () => `
    <html><body style="font-family:Helvetica;padding:20px;color:#333;">
      <div style="text-align:center;border-bottom:4px solid #FFD700;padding-bottom:10px;">
        <h1 style="margin:0;color:#112240;font-size:18px;">SAI BRUNDAVAN APARTMENT ASSOCIATION</h1>
        <p><b>ACCOUNTS STATEMENT - ${month.toUpperCase()}</b></p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <thead><tr style="background:#112240;color:white;font-size:10px;">
          <th>S.No</th><th>Date</th><th>Particulars</th><th>Expenses</th><th>Income</th><th>Remarks</th>
        </tr></thead>
        <tbody style="font-size:10px;">
          <tr style="background:#e6f2ff;font-weight:bold;"><td>A</td><td>-</td><td>Opening Balance (Prev Month)</td><td></td><td>₹${oB}</td><td>B/F</td></tr>
          <tr style="background:#f4f8ff;"><td>A1</td><td>-</td><td>Amt received through water tankers</td><td></td><td>₹${wR}</td><td>Creditors</td></tr>
          <tr style="background:#f4f8ff;"><td>B</td><td>-</td><td>Maintenance total (Current Month)</td><td></td><td>₹${mR}</td><td>Collection</td></tr>
          ${expenses.map((e, i) => `<tr><td>${i+1}</td><td>${e.date}</td><td>${e.vendor}</td><td>₹${e.amount}</td><td></td><td>${e.remarks}</td></tr>`).join('')}
          <tr style="font-weight:bold;background:#eee;"><td>C</td><td>-</td><td>Total Expenses</td><td>₹${tE}</td><td></td><td></td></tr>
          <tr style="font-weight:bold;background:#eee;"><td>D</td><td>-</td><td>Total Income (A+A1+B)</td><td></td><td>₹${tI}</td><td></td></tr>
          <tr style="background:#FFD700;font-weight:bold;"><td>E</td><td>-</td><td>CLOSING BALANCE</td><td></td><td>₹${tI - tE}</td><td>Cash in hand</td></tr>
        </tbody>
      </table>
      <div style="margin-top:20px;border:1px solid #f87171;padding:12px;border-radius:10px;background:#fff9f9;">
        <p style="color:#d9534f;font-weight:bold;font-size:11px;">PENDING RECEIVABLES (AS ON DATE):</p>
        <p style="font-size:10px;"><b>Water Tankers Pending: ₹${totWP}</b> (Flats: ${wP.map(p=>p.flat).join(', ') || 'Nil'})</p>
        <p style="font-size:10px;margin-top:5px;"><b>Maintenance Pending: ₹${totMP}</b> (Flats: ${mP.map(p=>p.flat).join(', ') || 'Nil'})</p>
      </div>
      <p style="text-align:center;font-style:italic;font-size:9px;margin-top:30px;color:#666;border-top:1px solid #eee;padding-top:10px;">
        This is an updated statement as on ${new Date().toLocaleString('en-IN')}.
      </p>
    </body></html>`;

  const doAction = async () => {
    const { uri } = await Print.printToFileAsync({ html: getHTML() });
    await Sharing.shareAsync(uri);
  };

  const scan = async () => {
    let res = await ImagePicker.launchCameraAsync({ quality:0.7, base64:true });
    if (res.canceled) return;
    setImg(res.assets[0].uri); setProc(true);
    try {
      const f = new FormData();
      f.append('base64Image', `data:image/jpeg;base64,${res.assets[0].base64}`);
      f.append('OCREngine', '2');
      const api = await fetch('https://api.ocr.space/parse/image',{method:'POST',headers:{'apikey':OCR_API_KEY},body:f});
      const data = await api.json();
      const txt = data.ParsedResults?.[0]?.ParsedText || "";
      const nums = txt.match(/[\d,]+\.?\d*/g);
      const bestAmt = nums ? String(Math.max(...nums.map(n=>parseFloat(n.replace(/,/g,''))).filter(n=>n>5))) : "";
      setVend(txt.split('\n')[0]?.substring(0,25) || 'Bill'); setAmt(bestAmt); setRem('Auto-captured');
    } catch(e) { Alert.alert("Error", "Manual entry needed."); }
    setProc(false); setMV(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('./icon.png')} style={styles.logo} />
        <View style={{flex:1}}><Text style={styles.title}>SAI BRUNDAVAN</Text><Text style={styles.sub}>APARTMENT ASSOCIATION</Text></View>
        <View style={{flexDirection:'row'}}>
          <TouchableOpacity onPress={doAction} style={styles.btn}><FileText color="#FFD700" size={20}/></TouchableOpacity>
          <TouchableOpacity onPress={doAction} style={[styles.btn,{marginLeft:8}]}><Share2 color="#FFD700" size={20}/></TouchableOpacity>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.row}><Text style={styles.lbl}>Report Month:</Text><TextInput style={styles.mI} value={month} onChangeText={setMonth}/></View>
        <View style={styles.card}>
          <Text style={styles.cT}>Accounting Setup</Text>
          <Text style={styles.sl}>Opening Balance (A)</Text><TextInput style={styles.in} keyboardType="numeric" value={oB} onChangeText={setOpening}/>
          <Text style={styles.sl}>Water tankers amount received (A1)</Text><TextInput style={styles.in} keyboardType="numeric" value={wR} onChangeText={setWR}/>
          <TouchableOpacity style={styles.add} onPress={()=>{setPT('Water');setPMV(true)}}><UserPlus size={12} color="#FFD700"/><Text style={styles.at}>Add Pending Water Dues</Text></TouchableOpacity>
          <Text style={styles.sl}>Maintenance total (B)</Text><TextInput style={styles.in} keyboardType="numeric" value={mR} onChangeText={setMR}/>
          <TouchableOpacity style={styles.add} onPress={()=>{setPT('Maintenance');setPMV(true)}}><UserPlus size={12} color="#FFD700"/><Text style={styles.at}>Add Pending Maintenance</Text></TouchableOpacity>
        </View>
        <View style={styles.sum}><Text style={{color:'#8892b0'}}>Closing Balance (E)</Text><Text style={styles.amt}>₹{(tI - tE).toLocaleString()}</Text></View>
        <Text style={styles.sectionTitle}>Expenditure Ledger</Text>
        {expenses.map((e,idx) => (
          <View key={e.id} style={styles.item}>
            <View style={{flex:1}}><Text style={{color:'#fff'}}>{idx+1}. {e.vendor}</Text><Text style={{color:'#8892b0',fontSize:10}}>{e.date}</Text></View>
            <Text style={{color:'#FFD700',fontWeight:'bold'}}>₹{e.amount}</Text>
            <TouchableOpacity onPress={()=>setEx(expenses.filter(x=>x.id!==e.id))}><Trash2 size={16} color="#f87171" style={{marginLeft:10}}/></TouchableOpacity>
          </View>
        ))}
        <View style={{height:150}}/>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.ac}><TouchableOpacity style={[styles.fb,{backgroundColor:'#1d2d50'}]} onPress={()=>{setImg(null);setMV(true)}}><Plus color="#FFD700"/></TouchableOpacity><Text style={styles.fl}>Add bills manually if any</Text></View>
        <View style={styles.ac}><TouchableOpacity style={styles.fb} onPress={scan}><Camera color="#0A192F"/></TouchableOpacity><Text style={styles.fl}>Click camera to capture bills</Text></View>
      </View>
      <Modal visible={pMV} transparent={true} animationType="fade"><View style={styles.ov}><View style={styles.mc}>
        <View style={styles.mh}><Text style={{color:'#FFD700',fontWeight:'bold'}}>{pT} Pending</Text><TouchableOpacity onPress={()=>setPMV(false)}><X color="#fff"/></TouchableOpacity></View>
        <TextInput placeholder="Flat No" placeholderTextColor="#8892b0" style={styles.mi} value={pF} onChangeText={setPF}/><TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.mi} value={pA} onChangeText={setPA}/><TextInput placeholder="Month" placeholderTextColor="#8892b0" style={styles.mi} value={pM} onChangeText={setPM}/>
        <TouchableOpacity style={styles.sb} onPress={()=>{const n={id:Date.now(),flat:pF,amt:pA,mon:pM};pT==='Water'?setWaterP([...wP,n]):setMaintP([...mP,n]);setPF('');setPA('');setPMV(false)}}><Text style={{color:'#0A192F',fontWeight:'bold'}}>Save</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setPMV(false)} style={styles.gb}><Text style={{color:'#8892b0'}}>Go Back</Text></TouchableOpacity>
      </View></View></Modal>
      <Modal visible={mV} transparent={true} animationType="slide"><View style={styles.ov}><View style={styles.mc}>
        <View style={styles.ai}><Sparkles color="#FFD700" size={14}/><Text style={{color:'#FFD700',fontSize:10,marginLeft:5,flex:1}}>Please check the auto-captured details correctly entered.</Text></View>
        <View style={styles.mh}><Text style={{color:'#fff',fontWeight:'bold'}}>Verify Details</Text><TouchableOpacity onPress={()=>setMV(false)}><X color="#fff"/></TouchableOpacity></View>
        {img && <Image source={{uri:img}} style={{width:'100%',height:120,borderRadius:10,marginBottom:10}}/>}
        <TextInput placeholder="Particulars" placeholderTextColor="#8892b0" style={styles.mi} value={vendor} onChangeText={setVendor}/><TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.mi} value={amount} onChangeText={setAmount}/><TextInput placeholder="Remarks" placeholderTextColor="#8892b0" style={styles.mi} value={remarks} onChangeText={setRemarks}/>
        <TouchableOpacity style={styles.sb} onPress={()=>{setEx([{id:Date.now(),vendor,amount:parseInt(amount)||0,remarks,date:new Date().toLocaleDateString('en-IN')},...expenses]);setMV(false)}}><Text style={{color:'#0A192F',fontWeight:'bold'}}>Verify & Save</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setMV(false)} style={styles.gb}><Text style={{color:'#8892b0'}}>Go Back</Text></TouchableOpacity>
      </View></View></Modal>
      {isProc && <View style={styles.overlay}><ActivityIndicator size="large" color="#FFD700"/><Text style={{color:'#fff',marginTop:10}}>AI Scanning Bill...</Text></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#112240', flexDirection: 'row', alignItems: 'center' },
  logo: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#FFD700' },
  title: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  sub: { color: '#fff', fontSize: 8 },
  btn: { padding: 8, backgroundColor: '#1d2d50', borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', margin: 20, marginBottom: 10 },
  lbl: { color: '#8892b0', fontSize: 12 },
  mI: { color: '#FFD700', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
  card: { margin: 20, marginTop: 10, padding: 15, backgroundColor: '#112240', borderRadius: 15 },
  cT: { color: '#FFD700', fontWeight: 'bold', marginBottom: 5, fontSize: 12 },
  sl: { color: '#8892b0', fontSize: 10, marginTop: 10 },
  in: { borderBottomWidth: 1, borderColor: '#333', color: '#fff', padding: 5, fontSize: 14 },
  add: { flexDirection: 'row', marginTop: 8 },
  at: { color: '#FFD700', fontSize: 9, marginLeft: 5, fontWeight:'bold' },
  sum: { marginHorizontal: 20, padding: 20, borderRadius: 20, backgroundColor: '#1d2d50', borderLeftWidth: 5, borderLeftColor: '#FFD700' },
  amt: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', margin: 20 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#112240', marginHorizontal: 20, marginBottom: 10, borderRadius: 12 },
  footer: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row' },
  ac: { flex: 1, alignItems: 'center' },
  fb: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  fl: { color: '#FFD700', fontSize: 8, marginTop: 5, textAlign:'center' },
  ov: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  mc: { backgroundColor: '#112240', borderRadius: 20, padding: 20 },
  mh: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  mi: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 10, marginTop: 10 },
  sb: { backgroundColor: '#FFD700', padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  gb: { marginTop: 15, alignItems: 'center' },
  ai: { backgroundColor: '#1d2d50', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  overlay: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(10,25,47,0.95)', justifyContent:'center', alignItems:'center', zIndex:99 }
});
