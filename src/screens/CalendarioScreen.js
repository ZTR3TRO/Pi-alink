import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { db } from '../database/initDb';
import { colors, spacing, radius, shadow, typography, stateColor } from '../utils/theme';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar', 'Abr', 'May', 'Jun', 'Jul.', 'Ago', 'Sept.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mie.', 'Jue.', 'Vie.', 'Sab.'],
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
      `;
      const data = db.getAllSync(query);
      setPedidos(data);

      const marks = {};
      data.forEach((pedido) => {
        const color = stateColor(pedido.estado);
        marks[pedido.fecha_entrega] = {
          marked: true,
          dotColor: color,
        };
      });
      setMarkedDates(marks);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarDatos);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (selectedDate) {
      const filtrados = pedidos.filter(p => p.fecha_entrega === selectedDate);
      setPedidosDelDia(filtrados);
    }
  }, [selectedDate, pedidos]);

  const renderItem = ({ item }) => {
    const colorEstado = stateColor(item.estado);

    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: colorEstado }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.clienteText}>{item.nombre_cliente}</Text>
            <View style={[styles.badge, { borderColor: colorEstado }]}>
              <Text style={[styles.badgeText, { color: colorEstado }]}>{item.estado}</Text>
            </View>
          </View>

          <Text style={styles.modeloText}>{item.modelo_pinata}</Text>

          {item.descripcion_detallada ? (
            <Text style={styles.descripcionText}>{item.descripcion_detallada}</Text>
          ) : null}

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
        </View>
      </View>
    );
  };

  const totalDelDia = pedidosDelDia.reduce((acc, p) => acc + p.saldo_restante, 0);

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: colors.primary,
          }
        }}
        theme={{
          backgroundColor: colors.surface,
          calendarBackground: colors.surface,
          todayTextColor: colors.accent,
          arrowColor: colors.primary,
          dotColor: colors.accent,
          selectedDayTextColor: colors.surface,
          selectedDayBackgroundColor: colors.primary,
          textDayFontWeight: '500',
          textMonthFontFamily: 'Georgia',
          textMonthFontWeight: '400',
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
          textDayHeaderFontWeight: '600',
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.textMuted,
          monthTextColor: colors.textPrimary,
        }}
        style={styles.calendario}
      />

      <View style={styles.encabezadoDia}>
        <Text style={styles.encabezadoTitulo}>
          {selectedDate ? selectedDate : 'Selecciona una fecha'}
        </Text>
        {pedidosDelDia.length > 0 && (
          <Text style={styles.encabezadoResumen}>
            {pedidosDelDia.length} {pedidosDelDia.length === 1 ? 'entrega' : 'entregas'}
            {totalDelDia > 0 ? `  •  Por cobrar: $${totalDelDia.toFixed(2)}` : '  •  Todo cobrado'}
          </Text>
        )}
      </View>

      <FlatList
        data={pedidosDelDia}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {selectedDate ? 'Sin entregas' : 'Ninguna fecha seleccionada'}
            </Text>
            <Text style={styles.emptyText}>
              {selectedDate
                ? 'No hay pedidos programados para este dia.'
                : 'Toca un dia en el calendario para ver sus entregas.'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  calendario: {
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  encabezadoDia: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  encabezadoTitulo: {
    fontSize: 15,
    color: colors.textPrimary,
    ...typography.heading,
  },
  encabezadoResumen: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
  clienteText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
    ...typography.label,
  },
  modeloText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
    ...typography.heading,
  },
  descripcionText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
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
  pagosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  detalleText: {
    fontSize: 13,
    color: colors.textSecondary,
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
  emptyContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
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
});