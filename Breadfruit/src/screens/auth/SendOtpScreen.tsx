import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import functions from '@react-native-firebase/functions';

export default function SendOtpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');

  const sendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      const sendEmailOtp = functions().httpsCallable('sendEmailOtp');
      const res = await sendEmailOtp({ email });

      if (res.data.success) {

        navigation.navigate('VerifyOtp', { email });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP');
      console.error(err);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Enter your email</Text>
      <TextInput
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 20 }}
        placeholder="Email"
        value={email}
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <Button title="Send OTP" onPress={sendOtp} />
    </View>
  );
}
