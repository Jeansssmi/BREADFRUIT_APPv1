import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import functions from '@react-native-firebase/functions';

export default function VerifyOtpScreen({ route }: any) {
  const { email } = route.params;
  const [otp, setOtp] = useState('');

  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    try {
      const verifyEmailOtp = functions().httpsCallable('verifyEmailOtp');
      const res = await verifyEmailOtp({ email, otp });

      if (res.data.success) {
        Alert.alert('Success', 'Email verified successfully!');
      } else {
        Alert.alert('Error', 'Invalid OTP.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Verification failed');
      console.error(err);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18 }}>Enter the OTP sent to {email}</Text>
      <TextInput
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 20 }}
        placeholder="Enter OTP"
        value={otp}
        keyboardType="number-pad"
        onChangeText={setOtp}
      />
      <Button title="Verify OTP" onPress={verifyOtp} />
    </View>
  );
}
