import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initDatabase } from './src/database/initDb';
import { colors, typography } from './src/utils/theme';

import PedidosScreen from './src/screens/PedidosScreen';
import CalendarioScreen from './src/screens/CalendarioScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import NuevoPedidoScreen from './src/screens/NuevoPedidoScreen';
import CatalogoScreen from './src/screens/CatalogoScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ label, focused }) => (
  <Text style={{
    fontSize: 11,
    fontWeight: focused ? '700' : '400',
    color: focused ? colors.accent : colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  }}>
    {label}
  </Text>
);

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          shadowColor: colors.border,
          shadowOpacity: 1,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          ...typography.heading,
          fontSize: 18,
          color: colors.textPrimary,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIconStyle: { display: 'none' },
        tabBarLabelPosition: 'beside-icon',
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Pedidos"
        component={PedidosScreen}
        options={{
          title: 'Pedidos',
          tabBarLabel: ({ focused }) => <TabIcon label="Pedidos" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{
          title: 'Calendario',
          tabBarLabel: ({ focused }) => <TabIcon label="Calendario" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          title: 'Ajustes',
          tabBarLabel: ({ focused }) => <TabIcon label="Ajustes" focused={focused} />,
        }}
      />
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
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            ...typography.heading,
            fontSize: 18,
            color: colors.textPrimary,
          },
          headerBackTitleVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NuevoPedido"
          component={NuevoPedidoScreen}
          options={({ route }) => ({
            title: route.params?.pedido ? 'Editar pedido' : 'Nuevo pedido',
          })}
        />
        <Stack.Screen
          name="Catalogo"
          component={CatalogoScreen}
          options={{ title: 'Catalogo de pinatas' }}
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
    backgroundColor: colors.background,
  },
});