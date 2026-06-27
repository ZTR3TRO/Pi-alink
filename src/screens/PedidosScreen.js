import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { db } from '../database/initDb';

export default function PedidosScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);

  const cargarPedidos = () => {
    try {
      const query = `
        SELECT pedidos.*, clientes.nombre AS nombre_cliente 
        FROM pedidos 
        JOIN clientes ON pedidos.cliente_id = clientes.id 
        ORDER BY fecha_entrega ASC;
      `;
      const todosLosPedidos = db.getAllSync(query);
      setPedidos(todosLosPedidos);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarPedidos();
    });
    return unsubscribe;
  }, [navigation]);

  const eliminarPedido = (id) => {
    Alert.alert('Advertencia', '¿Estás seguro de eliminar este pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Sí, eliminar', 
        style: 'destructive',
        onPress: () => {
          try {
            db.runSync('DELETE FROM pedidos WHERE id = ?', [id]);
            cargarPedidos();
          } catch (error) {
            console.error(error);
          }
        } 
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.modeloText}>{item.modelo_pinata}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.estado}</Text>
        </View>
      </View>
      <Text style={styles.clienteText}>{item.nombre_cliente}</Text>
      <Text style={styles.detalleText}>Entrega: {item.fecha_entrega}</Text>
      <Text style={styles.detalleText}>Precio Final: ${item.precio_final}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('NuevoPedido', { pedido: item })}
        >
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => eliminarPedido(item.id)}
        >
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay pedidos registrados aún.</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('NuevoPedido')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeloText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  clienteText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444444',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '500',
  },
  detalleText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
    paddingTop: 12,
  },
  actionButton: {
    marginLeft: 20,
    paddingVertical: 4,
  },
  editText: {
    color: '#333333',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#888888',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#333333',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
});