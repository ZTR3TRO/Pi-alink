import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView
} from 'react-native';
import { db } from '../database/initDb';
import { colors, spacing, radius, shadow, typography } from '../utils/theme';

export default function PerfilScreen({ navigation }) {
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [resumen, setResumen] = useState({
    totalPedidos: 0,
    pedidosMes: 0,
    totalCobrado: 0,
    totalPendiente: 0,
    pedidosEntregados: 0,
    pedidosCancelados: 0,
  });

  const cargarDatos = useCallback(() => {
    try {
      const perfil = db.getFirstSync('SELECT * FROM perfil_usuario LIMIT 1;');
      if (perfil) {
        setNombreNegocio(perfil.nombre_negocio || '');
        setMensaje(perfil.mensaje_bienvenida || '');
      }

      const ahora = new Date();
      const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

      const stats = db.getFirstSync(`
        SELECT
          COUNT(*) AS totalPedidos,
          SUM(CASE WHEN strftime('%Y-%m', fecha_entrega) = ? THEN 1 ELSE 0 END) AS pedidosMes,
          SUM(CASE WHEN estado = 'Entregado' THEN 1 ELSE 0 END) AS pedidosEntregados,
          SUM(CASE WHEN estado = 'Cancelado' THEN 1 ELSE 0 END) AS pedidosCancelados
        FROM pedidos
      `, [mesActual]);

      const pagos = db.getFirstSync(`
        SELECT
          COALESCE(SUM(pedidos.precio_final - COALESCE(sub.total_abonado, 0)), 0) AS totalPendiente
        FROM pedidos
        LEFT JOIN (
          SELECT pedido_id, SUM(monto) AS total_abonado FROM abonos GROUP BY pedido_id
        ) sub ON sub.pedido_id = pedidos.id
        WHERE pedidos.estado = 'Pendiente'
      `);

      const totalCobrado = db.getFirstSync(`
        SELECT COALESCE(SUM(monto), 0) AS total FROM abonos
      `);

      setResumen({
        totalPedidos: stats?.totalPedidos || 0,
        pedidosMes: stats?.pedidosMes || 0,
        pedidosEntregados: stats?.pedidosEntregados || 0,
        pedidosCancelados: stats?.pedidosCancelados || 0,
        totalCobrado: totalCobrado?.total || 0,
        totalPendiente: pagos?.totalPendiente || 0,
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarDatos);
    return unsubscribe;
  }, [navigation, cargarDatos]);

  const guardarPerfil = () => {
    if (!nombreNegocio.trim()) {
      Alert.alert('Campo requerido', 'El nombre del negocio no puede estar vacio.');
      return;
    }
    try {
      db.runSync(
        'UPDATE perfil_usuario SET nombre_negocio = ?, mensaje_bienvenida = ? WHERE id = 1',
        [nombreNegocio.trim(), mensaje.trim()]
      );
      Alert.alert('Listo', 'Configuracion guardada correctamente.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al guardar.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Resumen del negocio</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumero}>{resumen.totalPedidos}</Text>
            <Text style={styles.statLabel}>Total pedidos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumero}>{resumen.pedidosMes}</Text>
            <Text style={styles.statLabel}>Este mes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumero}>{resumen.pedidosEntregados}</Text>
            <Text style={styles.statLabel}>Entregados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumero}>{resumen.pedidosCancelados}</Text>
            <Text style={styles.statLabel}>Cancelados</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.financieroRow}>
          <View style={styles.financieroItem}>
            <Text style={styles.financieroLabel}>Total cobrado</Text>
            <Text style={[styles.financieroMonto, { color: colors.success }]}>
              ${resumen.totalCobrado.toFixed(2)}
            </Text>
          </View>
          <View style={styles.financieroSeparador} />
          <View style={styles.financieroItem}>
            <Text style={styles.financieroLabel}>Por cobrar</Text>
            <Text style={[styles.financieroMonto, { color: resumen.totalPendiente > 0 ? colors.danger : colors.success }]}>
              ${resumen.totalPendiente.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Herramientas</Text>
        <TouchableOpacity
          style={styles.botonHerramienta}
          onPress={() => navigation.navigate('Catalogo')}
        >
          <View>
            <Text style={styles.botonHerramientaTitulo}>Catalogo de pinatas</Text>
            <Text style={styles.botonHerramientaDesc}>Gestiona tus modelos y precios sugeridos</Text>
          </View>
          <Text style={styles.botonHerramientaFlecha}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Datos del negocio</Text>

        <Text style={styles.label}>Nombre del negocio</Text>
        <TextInput
          style={styles.input}
          value={nombreNegocio}
          onChangeText={setNombreNegocio}
          placeholder="Ej. Pinatas Magicas"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Mensaje de WhatsApp</Text>
        <Text style={styles.descripcion}>
          Este texto se usa como introduccion al enviar el comprobante de un pedido a tus clientes.
        </Text>

        <Text style={styles.label}>Mensaje base</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={mensaje}
          onChangeText={setMensaje}
          multiline
          numberOfLines={4}
          placeholder="Hola, te escribo para confirmar tu pedido..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={guardarPerfil}>
        <Text style={styles.buttonText}>Guardar cambios</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumero: {
    fontSize: 28,
    color: colors.primary,
    fontFamily: 'Georgia',
    fontWeight: '400',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  financieroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financieroItem: {
    flex: 1,
    alignItems: 'center',
  },
  financieroSeparador: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  financieroLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  financieroMonto: {
    fontSize: 20,
    fontFamily: 'Georgia',
    fontWeight: '400',
  },
  botonHerramienta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  botonHerramientaTitulo: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  botonHerramientaDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  botonHerramientaFlecha: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    ...typography.label,
  },
  descripcion: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radius.sm,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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