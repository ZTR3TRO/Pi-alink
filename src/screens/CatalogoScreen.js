import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView
} from 'react-native';
import { db } from '../database/initDb';
import { colors, spacing, radius, shadow, typography } from '../utils/theme';

export default function CatalogoScreen({ navigation }) {
  const [catalogo, setCatalogo] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [modelo, setModelo] = useState('');
  const [precioSugerido, setPrecioSugerido] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const cargarCatalogo = useCallback(() => {
    try {
      const data = db.getAllSync('SELECT * FROM catalogo_pinatas ORDER BY modelo ASC;');
      setCatalogo(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarCatalogo);
    return unsubscribe;
  }, [navigation, cargarCatalogo]);

  const abrirModal = (item = null) => {
    setItemEditando(item);
    setModelo(item?.modelo || '');
    setPrecioSugerido(item?.precio_sugerido?.toString() || '');
    setDescripcion(item?.descripcion || '');
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setItemEditando(null);
    setModelo('');
    setPrecioSugerido('');
    setDescripcion('');
  };

  const guardar = () => {
    if (!modelo.trim()) {
      Alert.alert('Campo requerido', 'El nombre del modelo no puede estar vacio.');
      return;
    }

    const precio = parseFloat(precioSugerido) || 0;

    try {
      if (itemEditando) {
        db.runSync(
          'UPDATE catalogo_pinatas SET modelo = ?, precio_sugerido = ?, descripcion = ? WHERE id = ?',
          [modelo.trim(), precio, descripcion.trim(), itemEditando.id]
        );
      } else {
        db.runSync(
          'INSERT INTO catalogo_pinatas (modelo, precio_sugerido, descripcion) VALUES (?, ?, ?)',
          [modelo.trim(), precio, descripcion.trim()]
        );
      }
      cerrarModal();
      cargarCatalogo();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al guardar.');
    }
  };

  const eliminar = (id, nombreModelo) => {
    Alert.alert(
      'Eliminar modelo',
      `¿Eliminar "${nombreModelo}" del catalogo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync('DELETE FROM catalogo_pinatas WHERE id = ?', [id]);
              cargarCatalogo();
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.modeloText}>{item.modelo}</Text>
          {item.precio_sugerido > 0 && (
            <Text style={styles.precioText}>${item.precio_sugerido.toFixed(2)}</Text>
          )}
        </View>
        {item.descripcion ? (
          <Text style={styles.descripcionText}>{item.descripcion}</Text>
        ) : null}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => abrirModal(item)}>
            <Text style={[styles.actionText, { color: colors.primary }]}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => eliminar(item.id, item.modelo)}>
            <Text style={[styles.actionText, { color: colors.danger }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={catalogo}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Catalogo vacio</Text>
            <Text style={styles.emptyText}>
              Agrega tus modelos de pinatas para usarlos rapidamente al crear pedidos.
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => abrirModal()}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {itemEditando ? 'Editar modelo' : 'Nuevo modelo'}
              </Text>

              <Text style={styles.label}>Nombre del modelo *</Text>
              <TextInput
                style={styles.input}
                value={modelo}
                onChangeText={setModelo}
                placeholder="Ej. Estrella 7 picos"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />

              <Text style={styles.label}>Precio sugerido ($)</Text>
              <TextInput
                style={styles.input}
                value={precioSugerido}
                onChangeText={setPrecioSugerido}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Descripcion</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                placeholder="Color, tamanio, materiales..."
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={cerrarModal}>
                  <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={guardar}>
                  <Text style={styles.modalBtnPrimaryText}>
                    {itemEditando ? 'Guardar cambios' : 'Agregar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadow.card,
  },
  cardAccent: {
    width: 5,
    backgroundColor: colors.accent,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modeloText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
    ...typography.label,
  },
  precioText: {
    fontSize: 15,
    color: colors.primary,
    fontFamily: 'Georgia',
  },
  descripcionText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  actionButton: {
    paddingVertical: 2,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    ...typography.heading,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.accent,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.fab,
  },
  fabText: {
    fontSize: 28,
    color: colors.surface,
    fontWeight: '300',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 26, 14, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.fab,
  },
  modalTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    ...typography.heading,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalBtnSecondary: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modalBtnPrimary: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    fontSize: 15,
    color: colors.surface,
    fontWeight: '600',
  },
});