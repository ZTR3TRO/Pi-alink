import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { db } from '../database/initDb';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar', 'Abr', 'May', 'Jun', 'Jul.', 'Ago', 'Sept.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

export default function CalendarioScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [pedidosDelDia, setPedidosDelDia] = useState([]);

  const cargarDatos = () => {
    try {
      const query = `
        SELECT pedidos.*, clientes.nombre AS nombre_cliente 
        FROM pedidos 
        JOIN clientes ON pedidos.cliente_id = clientes.id
      `;
      const data = db.getAllSync(query);
      setPedidos(data);

      const marks = {};
      data.forEach((pedido) => {
        marks[pedido.fecha_entrega] = { marked: true, dotColor: '#333333' };
      });
      setMarkedDates(marks);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarDatos();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (selectedDate) {
      const filtrados = pedidos.filter(p => p.fecha_entrega === selectedDate);
      setPedidosDelDia(filtrados);
    }
  }, [selectedDate, pedidos]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.clienteText}>{item.nombre_cliente}</Text>
      <Text style={styles.modeloText}>{item.modelo_pinata}</Text>
      <Text style={styles.precioText}>Restante a cobrar: ${item.precio_final}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          ...markedDates,
          [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: '#E0E0E0' }
        }}
        theme={{
          todayTextColor: '#333333',
          arrowColor: '#333333',
          dotColor: '#333333',
          selectedDayTextColor: '#000000',
          selectedDayBackgroundColor: '#E0E0E0',
          textDayFontWeight: '500',
        }}
      />
      
      <Text style={styles.title}>
        {selectedDate ? `Entregas para ${selectedDate}` : 'Selecciona una fecha'}
      </Text>

      <FlatList
        data={pedidosDelDia}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay entregas programadas.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clienteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  modeloText: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 4,
  },
  precioText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888888',
    marginTop: 20,
    fontSize: 14,
  },
});