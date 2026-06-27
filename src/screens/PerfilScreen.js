import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { db } from '../database/initDb';

export default function PerfilScreen() {
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarPerfil = () => {
    try {
      const perfil = db.getFirstSync('SELECT * FROM perfil_usuario LIMIT 1;');
      if (perfil) {
        setNombreNegocio(perfil.nombre_negocio);
        setMensaje(perfil.mensaje_bienvenida);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const guardarPerfil = () => {
    try {
      db.runSync(
        'UPDATE perfil_usuario SET nombre_negocio = ?, mensaje_bienvenida = ? WHERE id = 1',
        [nombreNegocio, mensaje]
      );
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al guardar');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Datos del Negocio</Text>
        
        <Text style={styles.label}>Nombre del Negocio</Text>
        <TextInput
          style={styles.input}
          value={nombreNegocio}
          onChangeText={setNombreNegocio}
          placeholder="Ej. Piñatas Mágicas"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Configuración de WhatsApp</Text>
        <Text style={styles.description}>
          Este mensaje se enviará como introducción cuando compartas un comprobante o recordatorio con tus clientes.
        </Text>
        
        <Text style={styles.label}>Mensaje Base</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={mensaje}
          onChangeText={setMensaje}
          multiline
          numberOfLines={4}
          placeholder="Hola, te escribo para confirmar tu pedido..."
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={guardarPerfil}>
        <Text style={styles.buttonText}>Guardar Cambios</Text>
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
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#000000',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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