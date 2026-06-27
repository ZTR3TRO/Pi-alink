import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../database/initDb';

export default function NuevoPedidoScreen({ navigation, route }) {
  const pedidoExistente = route.params?.pedido || null;

  const parseDateStr = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const [cliente, setCliente] = useState(pedidoExistente?.nombre_cliente || '');
  const [modelo, setModelo] = useState(pedidoExistente?.modelo_pinata || '');
  const [precio, setPrecio] = useState(pedidoExistente?.precio_final?.toString() || '');
  const [anticipo, setAnticipo] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(
    pedidoExistente ? parseDateStr(pedidoExistente.fecha_entrega) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);

  const precioNum = parseFloat(precio) || 0;
  const anticipoNum = parseFloat(anticipo) || 0;
  const saldoRestante = precioNum - anticipoNum;

  const onChangeFecha = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFechaEntrega(selectedDate);
    }
  };

  const guardarPedido = () => {
    if (!cliente || !modelo || !precio) {
      Alert.alert('Error', 'Llena los campos obligatorios.');
      return;
    }

    if (anticipoNum > precioNum) {
      Alert.alert('Error', 'El anticipo no puede ser mayor al precio final.');
      return;
    }

    const year = fechaEntrega.getFullYear();
    const month = String(fechaEntrega.getMonth() + 1).padStart(2, '0');
    const day = String(fechaEntrega.getDate()).padStart(2, '0');
    const fechaFormateada = `${year}-${month}-${day}`;

    try {
      if (pedidoExistente) {
        db.runSync(
          'UPDATE pedidos SET modelo_pinata = ?, precio_final = ?, fecha_entrega = ? WHERE id = ?',
          [modelo, precioNum, fechaFormateada, pedidoExistente.id]
        );
      } else {
        const resultCliente = db.runSync(
          'INSERT INTO clientes (nombre, telefono) VALUES (?, ?)',
          [cliente, `temp_${Date.now()}`]
        );
        
        const clienteId = resultCliente.lastInsertRowId;

        const resultPedido = db.runSync(
          'INSERT INTO pedidos (cliente_id, modelo_pinata, precio_final, fecha_entrega) VALUES (?, ?, ?, ?)',
          [clienteId, modelo, precioNum, fechaFormateada]
        );

        const pedidoId = resultPedido.lastInsertRowId;

        if (anticipoNum > 0) {
          db.runSync(
            'INSERT INTO abonos (pedido_id, monto) VALUES (?, ?)',
            [pedidoId, anticipoNum]
          );
        }
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al guardar.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nombre del Cliente</Text>
      <TextInput 
        style={styles.input} 
        value={cliente} 
        onChangeText={setCliente} 
        editable={!pedidoExistente}
      />

      <Text style={styles.label}>Modelo de Piñata</Text>
      <TextInput 
        style={styles.input} 
        value={modelo} 
        onChangeText={setModelo} 
      />

      <Text style={styles.label}>Precio Final ($)</Text>
      <TextInput 
        style={styles.input} 
        value={precio} 
        onChangeText={setPrecio} 
        keyboardType="numeric" 
      />

      {!pedidoExistente && (
        <>
          <Text style={styles.label}>Adelanto / Anticipo ($)</Text>
          <TextInput 
            style={styles.input} 
            value={anticipo} 
            onChangeText={setAnticipo} 
            keyboardType="numeric" 
          />
          <View style={styles.resumenContainer}>
            <Text style={styles.resumenText}>Saldo Restante: ${saldoRestante >= 0 ? saldoRestante : 0}</Text>
          </View>
        </>
      )}

      <Text style={styles.label}>Fecha de Entrega</Text>
      <TouchableOpacity 
        style={styles.dateButton} 
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {fechaEntrega.toISOString().split('T')[0]}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={fechaEntrega}
          mode="date"
          display="default"
          onChange={onChangeFecha}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={guardarPedido}>
        <Text style={styles.buttonText}>
          {pedidoExistente ? 'Actualizar Pedido' : 'Guardar Pedido'}
        </Text>
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
    color: '#000000',
  },
  resumenContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  resumenText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 14,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});