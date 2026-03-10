import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ChevronRight } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  // Pre-fill for the demo!
  const [email, setEmail] = useState('blobby@gmail.com');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/'); 
    }, 800);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Text style={{ fontSize: 36 }}>🥞</Text>
          </View>
          <Text style={styles.title}>Stack'd</Text>
          <Text style={styles.subtitle}>Wealth building, decoded.</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Mail color="#9ca3af" size={20} style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false} // Locked for the demo
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock color="#9ca3af" size={20} style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={false} // Locked for the demo
            />
          </View>

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <ChevronRight color="white" size={20} />
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 100, paddingBottom: 40, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logoIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#8b5cf615', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#8b5cf630' },
  title: { fontSize: 38, fontWeight: '900', color: '#111827', letterSpacing: -1.2, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  formContainer: { marginBottom: 32 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, marginBottom: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '600' },
  primaryButton: { backgroundColor: '#8b5cf6', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5, marginTop: 12 },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '800', marginRight: 6 },
});