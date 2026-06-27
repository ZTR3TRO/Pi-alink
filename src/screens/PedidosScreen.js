import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Linking, TextInput, Modal, ScrollView
} from 'react-native';
import { db } from '../database/initDb';
import { generarYCompartirPDF } from '../utils/generarComprobante';
import { colors, spacing, radius, shadow, typography, stateColor } from '../utils/theme';

const FILTROS = ['Todos', 'Pendiente', 'Entregado', 'Cancelado'];

export default function PedidosScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [perfil, setPerfil] = useState({ mensaje_bienvenida: '' });
  const [filtroActivo, setFiltroActivo] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbono, setModalAbono] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [expandido, setExpandido] = useState(null);
  const [abonos, setAbonos] = useState({});

  const cargarDatos = () => {
    try {
      const query = `
        SELECT
          pedidos.*,
          clientes.nombre AS nombre_cliente,
          clientes.telefono AS telefono_cliente,
          COALESCE(SUM(abonos.monto), 0) AS total_abonado,
          pedidos.precio_final - COALESCE(SUM(abonos.monto), 0) AS saldo_restante
        FROM pedidos
        JOIN clientes ON pedidos.cliente_id = clientes.id
        LEFT JOIN abonos ON abonos.pedido_id = pedidos.id
        GROUP BY pedidos.id
        ORDER BY pedidos.fecha_entrega ASC;
      `;
      const todosLosPedidos = db.getAllSync(query);
      setPedidos(todosLosPedidos);

      const perfilData = db.getFirstSync('SELECT * FROM perfil_usuario LIMIT 1;');
      if (perfilData) setPerfil(perfilData);
    } catch (error) {
      console.error(error);
    }
  };

  const cargarAbonos = (pedidoId) => {
    try {
      const data = db.getAllSync(
        'SELECT * FROM abonos WHERE pedido_id = ? ORDER BY fecha_pago ASC;',
        [pedidoId]
      );
      setAbonos(prev => ({ ...prev, [pedidoId]: data }));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarDatos);
    return unsubscribe;
  }, [navigation]);

  const toggleExpandido = (pedidoId) => {
    if (expandido === pedidoId) {
      setExpandido(null);
    } else {
      setExpandido(pedidoId);
      cargarAbonos(pedidoId);
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const coincideFiltro = filtroActivo === 'Todos' || p.estado === filtroActivo;
    const coincideBusqueda = p.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  const marcarEntregado = (id) => {
    Alert.alert('Confirmar entrega', '¿Marcar este pedido como entregado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Entregar',
        onPress: () => {
          try {
            db.runSync("UPDATE pedidos SET estado = 'Entregado' WHERE id = ?", [id]);
            cargarDatos();
          } catch (error) {
            console.error(error);
          }
        }
      }
    ]);
  };

  const cancelarPedido = (id) => {
    Alert.alert('Cancelar pedido', '¿Estas seguro de cancelar este pedido?', [
      { text: 'Atras', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: () => {
          try {
            db.runSync("UPDATE pedidos SET estado = 'Cancelado' WHERE id = ?", [id]);
            cargarDatos();
          } catch (error) {
            console.error(error);
          }
        }
      }
    ]);
  };

  const eliminarPedido = (id) => {
    Alert.alert('Eliminar pedido', '¿Estas seguro? Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          try {
            db.runSync('DELETE FROM pedidos WHERE id = ?', [id]);
            if (expandido === id) setExpandido(null);
            cargarDatos();
          } catch (error) {
            console.error(error);
          }
        }
      }
    ]);
  };

  const registrarAbono = () => {
    const monto = parseFloat(montoAbono);
    if (!monto || monto <= 0) {
      Alert.alert('Error', 'Ingresa un monto valido.');
      return;
    }
    if (monto > modalAbono.saldo_restante) {
      Alert.alert('Error', 'El abono supera el saldo restante.');
      return;
    }
    try {
      db.runSync('INSERT INTO abonos (pedido_id, monto) VALUES (?, ?)', [modalAbono.id, monto]);
      if (expandido === modalAbono.id) cargarAbonos(modalAbono.id);
      setModalAbono(null);
      setMontoAbono('');
      cargarDatos();
    } catch (error) {
      console.error(error);
    }
  };

  const enviarWhatsApp = (pedido) => {
    const mensajeBase = perfil.mensaje_bienvenida || 'Hola, aqui tienes la informacion de tu pedido:';
    const saldo = pedido.saldo_restante > 0
      ? `Saldo restante: $${pedido.saldo_restante.toFixed(2)}`
      : 'Pedido liquidado';

    const texto = `${mensajeBase}\n\nDetalle del Pedido:\nCliente: ${pedido.nombre_cliente}\nModelo: ${pedido.modelo_pinata}\nFecha de Entrega: ${pedido.fecha_entrega}\nPrecio Final: $${pedido.precio_final.toFixed(2)}\nAbonado: $${pedido.total_abonado.toFixed(2)}\n${saldo}\nEstado: ${pedido.estado}`;

    const url = `whatsapp://send?phone=52${pedido.telefono_cliente}&text=${encodeURIComponent(texto)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    });
  };

  const compartirPDF = async (pedido) => {
    try {
      await generarYCompartirPDF(pedido, perfil);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo generar el comprobante.');
    }
  };

  const renderItem = ({ item }) => {
    const colorEstado = stateColor(item.estado);
    const esActivo = item.estado === 'Pendiente';
    const estaExpandido = expandido === item.id;
    const abonosDelPedido = abonos[item.id] || [];

    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: colorEstado }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.modeloText}>{item.modelo_pinata}</Text>
            <View style={[styles.badge, { borderColor: colorEstado }]}>
              <Text style={[styles.badgeText, { color: colorEstado }]}>{item.estado}</Text>
            </View>
          </View>

          <Text style={styles.clienteText}>{item.nombre_cliente}</Text>
          <Text style={styles.detalleText}>{item.telefono_cliente}</Text>
          <Text style={styles.detalleText}>Entrega: {item.fecha_entrega}</Text>

          <View style={styles.pagosRow}>
            <Text style={styles.detalleText}>Total: ${item.precio_final.toFixed(2)}</Text>
            {item.total_abonado > 0 && (
              <Text style={styles.detalleText}>Abonado: ${item.total_abonado.toFixed(2)}</Text>
            )}
          </View>

          {item.saldo_restante > 0 ? (
            <Text style={styles.saldoPendiente}>Restante: ${item.saldo_restante.toFixed(2)}</Text>
          ) : (
            <Text style={styles.saldoCero}>Liquidado</Text>
          )}

          <TouchableOpacity
            style={styles.historialToggle}
            onPress={() => toggleExpandido(item.id)}
          >
            <Text style={styles.historialToggleText}>
              {estaExpandido ? 'Ocultar historial' : 'Ver historial de abonos'}
            </Text>
            <Text style={[styles.historialFlecha, estaExpandido && styles.historialFlechaAbierta]}>
              ›
            </Text>
          </TouchableOpacity>

          {estaExpandido && (
            <View style={styles.historialContainer}>
              {abonosDelPedido.length === 0 ? (
                <Text style={styles.historialVacio}>Sin abonos registrados.</Text>
              ) : (
                abonosDelPedido.map((abono, index) => (
                  <View key={abono.id} style={styles.abonoFila}>
                    <Text style={styles.abonoNumero}>#{index + 1}</Text>
                    <Text style={styles.abonoFecha}>{abono.fecha_pago?.split(' ')[0] || ''}</Text>
                    <Text style={styles.abonoMonto}>${abono.monto.toFixed(2)}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => enviarWhatsApp(item)}>
              <Text style={[styles.actionText, { color: colors.whatsapp }]}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => compartirPDF(item)}>
              <Text style={[styles.actionText, { color: colors.pdf }]}>PDF</Text>
            </TouchableOpacity>

            {esActivo && (
              <TouchableOpacity style={styles.actionButton} onPress={() => {
                setModalAbono(item);
                setMontoAbono('');
              }}>
                <Text style={[styles.actionText, { color: colors.accent }]}>Abonar</Text>
              </TouchableOpacity>
            )}

            {esActivo && (
              <TouchableOpacity style={styles.actionButton} onPress={() => marcarEntregado(item.id)}>
                <Text style={[styles.actionText, { color: colors.success }]}>Entregar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('NuevoPedido', { pedido: item })}>
              <Text style={[styles.actionText, { color: colors.primary }]}>Editar</Text>
            </TouchableOpacity>

            {esActivo && (
              <TouchableOpacity style={styles.actionButton} onPress={() => cancelarPedido(item.id)}>
                <Text style={[styles.actionText, { color: colors.stateCancelado }]}>Cancelar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={() => eliminarPedido(item.id)}>
              <Text style={[styles.actionText, { color: colors.danger }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por cliente..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrosContainer}
      >
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroBtn, filtroActivo === f && styles.filtroBtnActivo]}
            onPress={() => setFiltroActivo(f)}
          >
            <Text style={[styles.filtroText, filtroActivo === f && styles.filtroTextActivo]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={pedidosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Sin pedidos</Text>
            <Text style={styles.emptyText}>
              {busqueda ? 'No hay resultados para tu busqueda.' : 'Toca + para registrar tu primer pedido.'}
            </Text>
          </View>
        }
      />

      <Modal visible={!!modalAbono} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Registrar abono</Text>
            <Text style={styles.modalSubtitle}>
              {modalAbono?.nombre_cliente} — Saldo: ${modalAbono?.saldo_restante.toFixed(2)}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={montoAbono}
              onChangeText={setMontoAbono}
              keyboardType="numeric"
              placeholder="Monto del abono"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setModalAbono(null)}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={registrarAbono}>
                <Text style={styles.modalBtnPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NuevoPedido')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.textPrimary,
  },
  filtrosContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filtroBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filtroBtnActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filtroTextActivo: {
    color: colors.surface,
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
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
    ...typography.heading,
  },
  clienteText: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
    ...typography.label,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detalleText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pagosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  saldoPendiente: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    marginTop: spacing.xs,
  },
  saldoCero: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
    marginTop: spacing.xs,
  },
  historialToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  historialToggleText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
    flex: 1,
  },
  historialFlecha: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: '300',
    transform: [{ rotate: '0deg' }],
  },
  historialFlechaAbierta: {
    transform: [{ rotate: '90deg' }],
  },
  historialContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  historialVacio: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  abonoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  abonoNumero: {
    fontSize: 12,
    color: colors.textMuted,
    width: 28,
  },
  abonoFecha: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  abonoMonto: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'Georgia',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
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
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    ...typography.heading,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 26, 14, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    ...shadow.fab,
  },
  modalTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
});