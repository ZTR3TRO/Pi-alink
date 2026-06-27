import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('pinatas_local.db');

export const initDatabase = () => {
  try {
    db.execSync('PRAGMA foreign_keys = ON;');

    db.execSync(`
      CREATE TABLE IF NOT EXISTS perfil_usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_negocio TEXT NOT NULL,
        nombre_duena TEXT,
        mensaje_bienvenida TEXT
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        telefono TEXT NOT NULL UNIQUE
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS catalogo_pinatas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modelo TEXT NOT NULL,
        precio_sugerido REAL DEFAULT 0,
        descripcion TEXT
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        modelo_pinata TEXT NOT NULL,
        descripcion_detallada TEXT,
        precio_final REAL NOT NULL,
        fecha_registro TEXT DEFAULT (date('now')),
        fecha_entrega TEXT NOT NULL,
        estado TEXT DEFAULT 'Pendiente',
        wa_comprobante_enviado INTEGER DEFAULT 0,
        wa_recordatorio_enviado INTEGER DEFAULT 0,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS abonos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        monto REAL NOT NULL,
        fecha_pago TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
      );
    `);

    const perfilExistente = db.getFirstSync('SELECT COUNT(*) as count FROM perfil_usuario;');
    
    if (perfilExistente.count === 0) {
      db.runSync(`
        INSERT INTO perfil_usuario (nombre_negocio, nombre_duena, mensaje_bienvenida)
        VALUES ('Mi Taller de Piñatas', 'Diseñadora', '¡Hola! Te comparto el comprobante de tu pedido:');
      `);
    }
  } catch (error) {
    console.error(error);
  }
};