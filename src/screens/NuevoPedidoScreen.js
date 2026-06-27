import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../database/initDb';
import { colors, spacing, radius, shadow, typography } from '../utils/theme';

const formatearFechaLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [telefono, setTelefono] = useState(pedidoExistente?.telefono_cliente || '');
  const [modelo, setModelo] = useState(pedidoExistente?.modelo_pinata || '');
  const [descripcion, setDescripcion] = useState(pedidoExistente?.descripcion_detallada || '');
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
    if (selectedDate) setFechaEntrega(selectedDate);
  };

  const validarTelefono = (tel) => tel.replace(/\D/g, '').length === 10;

  const guardarPedido = () => {
    if (!cliente || !modelo || !precio) {
      Alert.alert('Campos requeridos', 'Completa el nombre del cliente, modelo y precio.');
      return;
    }
    if (!pedidoExistente && !validarTelefono(telefono)) {
      Alert.alert('Telefono invalido', 'El telefono debe tener exactamente 10 digitos.');
      return;
    }
    if (anticipoNum > precioNum) {
      Alert.alert('Anticipo invalido', 'El anticipo no puede ser mayor al precio final.');
      return;
    }

    const fechaFormateada = formatearFechaLocal(fechaEntrega);
    const telefonoLimpio = telefono.replace(/\D/g, '');

    try {
      if (pedidoExistente) {
        db.runSync(
          'UPDATE pedidos SET modelo_pinata = ?, descripcion_detallada = ?, precio_final = ?, fecha_entrega = ? WHERE id = ?',
          [modelo, descripcion, precioNum, fechaFormateada, pedidoExistente.id]
        );
      } else {
        let clienteId;
        const clienteExistente = db.getFirstSync(
          'SELECT id FROM clientes WHERE telefono = ?',
          [telefonoLimpio]
        );

        if (clienteExistente) {
          clienteId = clienteExistente.id;
          db.runSync('UPDATE clientes SET nombre = ? WHERE id = ?', [cliente, clienteId]);
        } else {
          const resultCliente = db.runSync(
            'INSERT INTO clientes (nombre, telefono) VALUES (?, ?)',
            [cliente, telefonoLimpio]
          );
          clienteId = resultCliente.lastInsertRowId;
        }

        const resultPedido = db.runSync(
          'INSERT INTO pedidos (cliente_id, modelo_pinata, descripcion_detallada, precio_final, fecha_entrega) VALUES (?, ?, ?, ?, ?)',
          [clienteId, modelo, descripcion, precioNum, fechaFormateada]
        );

        if (anticipoNum > 0) {
          db.runSync(
            'INSERT INTO abonos (pedido_id, monto) VALUES (?, ?)',
            [resultPedido.lastInsertRowId, anticipoNum]
          );
        }
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al guardar el pedido.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Cliente</Text>

        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={[styles.input, pedidoExistente && styles.inputDisabled]}
          value={cliente}
          onChangeText={setCliente}
          editable={!pedidoExistente}
          placeholder="Ej. Maria Garcia"
          placeholderTextColor={colors.textMuted}
        />

        {!pedidoExistente && (
          <>
            <Text style={styles.label}>Telefono (10 digitos) *</Text>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="Ej. 6671234567"
              placeholderTextColor={colors.textMuted}
            />
          </>
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Pedido</Text>

        <Text style={styles.label}>Modelo de pinata *</Text>
        <TextInput
          style={styles.input}
          value={modelo}
          onChangeText={setModelo}
          placeholder="Ej. Estrella 7 picos"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Descripcion / detalles</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={3}
          placeholder="Color, tamanio, personaje, instrucciones especiales..."
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Fecha de entrega</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateButtonText}>{formatearFechaLocal(fechaEntrega)}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={fechaEntrega}
            mode="date"
            display="default"
            onChange={onChangeFecha}
          />
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Pago</Text>

        <Text style={styles.label}>Precio final ($) *</Text>
        <TextInput
          style={styles.input}
          value={precio}
          onChangeText={setPrecio}
          keyboardType="numeric"
          placeholder="Ej. 350"
          placeholderTextColor={colors.textMuted}
        />

        {!pedidoExistente && (
          <>
            <Text style={styles.label}>Anticipo ($)</Text>
            <TextInput
              style={styles.input}
              value={anticipo}
              onChangeText={setAnticipo}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />

            {precioNum > 0 && (
              <View style={[
                styles.resumenPago,
                saldoRestante <= 0 ? styles.resumenPagado : styles.resumenPendiente
              ]}>
                <Text style={[
                  styles.resumenLabel,
                  { color: saldoRestante <= 0 ? colors.success : colors.textSecondary }
                ]}>
                  {saldoRestante <= 0 ? 'Liquidado' : 'Saldo restante'}
                </Text>
                <Text style={[
                  styles.resumenMonto,
                  { color: saldoRestante <= 0 ? colors.success : colors.danger }
                ]}>
                  {saldoRestante <= 0 ? 'Pagado' : `$${saldoRestante.toFixed(2)}`}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={guardarPedido}>
        <Text style={styles.buttonText}>
          {pedidoExistente ? 'Guardar cambios' : 'Registrar pedido'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  seccion: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    ...typography.label,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    ...typography.label,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputDisabled: {
    color: colors.textMuted,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    fontWeight: '400',
  },
  resumenPago: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  resumenPendiente: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFCDD2',
  },
  resumenPagado: {
    backgroundColor: colors.successLight,
    borderColor: '#C8E6C9',
  },
  resumenLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  resumenMonto: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});