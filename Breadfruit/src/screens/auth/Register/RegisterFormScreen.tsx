import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebaseConfig';
import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';

export default function RegisterFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { type } = route.params as { type: string };

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  const toTitleCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

const handleRegister = async () => {
  // Validate empty fields
  if (!name || !email || !password || !confirmPassword) {
    setNotificationMessage('All fields are required.');
    setNotificationType('error');
    setNotificationVisible(true);
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setNotificationMessage('Please enter a valid email address.');
    setNotificationType('error');
    setNotificationVisible(true);
    return;
  }

  // Validate password match
  if (password !== confirmPassword) {
    setNotificationMessage('Passwords do not match.');
    setNotificationType('error');
    setNotificationVisible(true);
    return;
  }



 setLoading(true);

 try {
   console.log('📤 Sending data:', {
     name,
     email,
     password,
     role: type,
     status: type === 'viewer' ? 'verified' : 'pending',
     image: null,
   });

   const response = await fetch(
     'https://us-central1-breadfruit-tracker.cloudfunctions.net/createNewUser',
     {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         data: {
           name,
           email,
           password,
           role: type,
           status: type === 'viewer' ? 'verified' : 'pending',
           image: null,
           joined: new Date().toISOString(),
         },
       }),
     }
   );

   if (!response.ok) {
     const errorText = await response.text();
     throw new Error(`HTTP error! Status: ${response.status} | ${errorText}`);
   }

   const result = await response.json();
   console.log('✅ Function result:', result);

   if (result?.result?.success || result?.data?.success) {
     setNotificationMessage(
       'Your registration was successful. Please wait for admin approval.'
     );
     setNotificationType('success');
     setNotificationVisible(true);
   } else {
     throw new Error(result?.error?.message || 'Registration failed.');
   }
 } catch (error: any) {
   console.error('❌ Registration error:', error);

   let errorMessage = 'Registration failed. Please try again later.';
   let errorType: 'error' | 'info' = 'error';

   if (error.message?.includes('already-exists')) {
     errorMessage =
       'An account with this email already exists. Please use another email or log in.';
     errorType = 'info';
   } else if (error.message?.includes('invalid-email')) {
     errorMessage = 'Invalid email format. Please enter a valid email address.';
   } else if (error.message?.includes('weak-password')) {
     errorMessage = 'Password is too weak. Try a stronger password.';
   }

   setNotificationMessage(errorMessage);
   setNotificationType(errorType);
   setNotificationVisible(true);
 } finally {
   setLoading(false);
 }

};

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <LoadingAlert visible={loading} message="Please wait..." />
          <NotificationAlert
            visible={notificationVisible}
            message={notificationMessage}
            type={notificationType}
            onClose={() => {
              setNotificationVisible(false);
              if (notificationType === 'success') {
                navigation.navigate('Login');
              }
            }}
          />

          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-plus" size={80} color="#2ecc71" />
          </View>

          <Text variant="headlineMedium" style={styles.title}>
            {toTitleCase(type)} Registration
          </Text>

          <TextInput label="Name" value={name} onChangeText={setName} style={styles.input} left={<TextInput.Icon icon="account" />} />
          <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" left={<TextInput.Icon icon="email" />} />
          <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} left={<TextInput.Icon icon="lock" />} />
          <TextInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={styles.input} left={<TextInput.Icon icon="lock-check" />} />

          <Button mode="contained" onPress={handleRegister} style={styles.button} disabled={loading}>Create Account</Button>
          <Button mode="text" textColor="#666" onPress={() => navigation.navigate('Login')}>Already have an account? Login</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#ffffff' },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  title: { marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { marginBottom: 15, backgroundColor: '#f8f8f8' },
  button: { marginVertical: 10, borderRadius: 25, backgroundColor: '#2ecc71' },
});
