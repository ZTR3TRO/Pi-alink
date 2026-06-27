import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { db } from '../database/initDb';

export default function NuevoPedidoScreen({ navigation }) {
  const [cliente, setCliente] = useState('');
  const [modelo, setModelo] = useState('');
  const [precio, setPrecio] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');

  const guardarPedido = () => {
    if (!cliente || !modelo || !precio || !fechaEntrega) {
      Alert.alert('Error', 'Por favor llena todos los campos obligatorios.');
      return;
    }

    try {
      const resultCliente = db.runSync(
        'INSERT INTO clientes (nombre, telefono) VALUES (?, ?)',
        [cliente, 'Sin teléfono temporal']
      );
      
      const clienteId = resultCliente.lastInsertRowId;

      db.runSync(
        'INSERT INTO pedidos (cliente_id, modelo_pinata, precio_final, fecha_entrega) VALUES (?, ?, ?, ?)',
        [clienteId, modelo, parseFloat(precio), fechaEntrega]
      );

      Alert.alert('Éxito', 'Pedido guardado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al guardar el pedido.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nombre del Cliente</Text>
      <TextInput 
        style={styles.input} 
        value={cliente} 
        onChangeText={setCliente} 
        placeholder="Ej. Juan Pérez" 
      />

      <Text style={styles.label}>Modelo de Piñata</Text>
      <TextInput 
        style={styles.input} 
        value={modelo} 
        onChangeText={setModelo} 
        placeholder="Ej. Estrella 7 Picos" 
      />

      <Text style={styles.label}>Precio Final ($)</Text>
      <TextInput 
        style={styles.input} 
        value={precio} 
        onChangeText={setPrecio} 
        placeholder="Ej. 450" 
        keyboardType="numeric" 
      />

      <Text style={styles.label}>Fecha de Entrega (YYYY-MM-DD)</Text>
      <TextInput 
        style={styles.input} 
        value={fechaEntrega} 
        onChangeText={setFechaEntrega} 
        placeholder="Ej. 2026-07-15" 
      />

      <TouchableOpacity style={styles.button} onPress={guardarPedido}>
        <Text style={styles.buttonText}>Guardar Pedido</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  label: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});