import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, Easing, View, Text, TouchableWithoutFeedback, Vibration } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ToastType = 'success' | 'info' | 'error';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string, t: ToastType = 'info') => {
    setMessage(msg);
    setType(t);
    setVisible(true);

    // 💢 Vibration feedback on error
    if (t === 'error') Vibration.vibrate([0, 100, 60, 100]);

    // Reset position and opacity
    slideAnim.setValue(30);
    opacityAnim.setValue(0);

    // 🎞️ Animate toast in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // ⏱️ Dynamic duration
    const duration =
      t === 'error' ? 4000 : t === 'info' ? 3000 : 2500;

    // Auto hide after delay
    setTimeout(() => hideToast(), duration);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  const getColor = () =>
    type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db';

  const getIcon = () =>
    type === 'success'
      ? 'check-circle-outline'
      : type === 'error'
      ? 'alert-circle-outline'
      : 'information-outline';

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 40,
            left: 20,
            right: 20,
            borderRadius: 10,
            backgroundColor: getColor(),
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <MaterialCommunityIcons
            name={getIcon()}
            size={22}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={{ color: 'white', flex: 1, fontSize: 15 }}>{message}</Text>

          <TouchableWithoutFeedback onPress={() => hideToast()}>
            <MaterialCommunityIcons name="close" size={18} color="#fff" />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};
