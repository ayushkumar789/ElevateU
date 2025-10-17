import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';

const API = "http://10.0.2.2:8000"; // Android emulator to local server
export default function App(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [token,setToken]=useState(null);
  const [resume,setResume]=useState(""); const [jd,setJd]=useState(""); const [score,setScore]=useState(null);

  async function login(){
    const res = await fetch(`${API}/api/auth/login`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json(); if(res.ok) setToken(data.token);
  }
  async function scoreResume(){
    const res = await fetch(`${API}/api/resume/score`, { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ resumeText:resume, jobDescription:jd }) });
    const data = await res.json(); if(res.ok) setScore(data);
  }
  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#0b0b0b" }}>
      <ScrollView contentContainerStyle={{ padding:16 }}>
        <Text style={{ color:"white", fontSize:28, fontWeight:"800" }}>ElevateU Mobile</Text>
        {!token ? (
          <View style={{ marginTop:16 }}>
            <TextInput placeholder="Email" placeholderTextColor="#aaa" onChangeText={setEmail} style={{ color:"white", borderWidth:1, borderColor:"#333", padding:12, borderRadius:12, marginBottom:8 }}/>
            <TextInput placeholder="Password" placeholderTextColor="#aaa" onChangeText={setPassword} secureTextEntry style={{ color:"white", borderWidth:1, borderColor:"#333", padding:12, borderRadius:12, marginBottom:8 }}/>
            <TouchableOpacity onPress={login} style={{ backgroundColor:"#6366F1", padding:12, borderRadius:12 }}><Text style={{ color:"white", textAlign:"center", fontWeight:"700" }}>Login</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop:16 }}>
            <Text style={{ color:"white", fontWeight:"700", marginBottom:8 }}>Resume</Text>
            <TextInput multiline placeholder="Paste resume..." placeholderTextColor="#aaa" onChangeText={setResume} style={{ color:"white", borderWidth:1, borderColor:"#333", padding:12, borderRadius:12, height:120, marginBottom:8 }}/>
            <Text style={{ color:"white", fontWeight:"700", marginBottom:8 }}>Job Description</Text>
            <TextInput multiline placeholder="Paste JD..." placeholderTextColor="#aaa" onChangeText={setJd} style={{ color:"white", borderWidth:1, borderColor:"#333", padding:12, borderRadius:12, height:100, marginBottom:8 }}/>
            <TouchableOpacity onPress={scoreResume} style={{ backgroundColor:"#6366F1", padding:12, borderRadius:12 }}><Text style={{ color:"white", textAlign:"center", fontWeight:"700" }}>Get ATS Score</Text></TouchableOpacity>
            {score && (<View style={{ marginTop:12 }}><Text style={{ color:"white" }}>Score: {score.score}/100</Text><Text style={{ color:"white" }}>Coverage: {score.keywordCoverage}%</Text></View>)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
