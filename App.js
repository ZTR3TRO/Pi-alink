import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initDatabase } from './src/database/initDb';

import PedidosScreen from './src/screens/PedidosScreen';
import CalendarioScreen from './src/screens/CalendarioScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import NuevoPedidoScreen from './src/screens/NuevoPedidoScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff', shadowOpacity: 0, elevation: 0 },
        headerTintColor: '#333333',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 5 },
        tabBarStyle: { backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#EEEEEE', height: 60 },
        tabBarIconStyle: { display: 'none' }, 
        tabBarLabelPosition: 'beside-icon',
      }}
    >
      <Tab.Screen name="Pedidos" component={PedidosScreen} options={{ title: 'Mis Pedidos' }} />
      <Tab.Screen name="Calendario" component={CalendarioScreen} options={{ title: 'Calendario' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [dbLista, setDbLista] = useState(false);

  useEffect(() => {
    try {
      initDatabase();
      setDbLista(true);
    } catch (error) {
      console.error(error);
    }
  }, []);

  if (!dbLista) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#333333" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="NuevoPedido" 
          component={NuevoPedidoScreen} 
          options={{ 
            title: 'Nuevo Pedido',
            headerBackTitleVisible: false,
            headerTintColor: '#333333'
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});