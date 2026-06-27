import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const buildHTML = (pedido, perfil) => {
  const nombreNegocio = perfil?.nombre_negocio || 'Mi Taller de Pinatas';
  const mensajeBase = perfil?.mensaje_bienvenida || '';
  const saldo = pedido.saldo_restante > 0
    ? `$${pedido.saldo_restante.toFixed(2)}`
    : 'Liquidado';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #222; }
        .header { border-bottom: 2px solid #222; padding-bottom: 16px; margin-bottom: 24px; }
        .negocio { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
        .subtitulo { font-size: 13px; color: #666; margin-top: 4px; }
        .seccion { margin-bottom: 20px; }
        .seccion-titulo { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .fila { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .fila .etiqueta { color: #555; }
        .fila .valor { font-weight: 500; text-align: right; }
        .fila-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; border-top: 2px solid #222; padding-top: 12px; margin-top: 4px; }
        .saldo-cero { color: #2a7a2a; }
        .saldo-pendiente { color: #c62828; }
        .mensaje { margin-top: 32px; padding: 16px; background: #f5f5f5; border-radius: 6px; font-size: 13px; color: #444; line-height: 1.6; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="negocio">${nombreNegocio}</div>
        <div class="subtitulo">Comprobante de Pedido</div>
      </div>

      <div class="seccion">
        <div class="seccion-titulo">Cliente</div>
        <div class="fila"><span class="etiqueta">Nombre</span><span class="valor">${pedido.nombre_cliente}</span></div>
        <div class="fila"><span class="etiqueta">Telefono</span><span class="valor">${pedido.telefono_cliente}</span></div>
      </div>

      <div class="seccion">
        <div class="seccion-titulo">Pedido</div>
        <div class="fila"><span class="etiqueta">Modelo</span><span class="valor">${pedido.modelo_pinata}</span></div>
        <div class="fila"><span class="etiqueta">Fecha de entrega</span><span class="valor">${pedido.fecha_entrega}</span></div>
        <div class="fila"><span class="etiqueta">Estado</span><span class="valor">${pedido.estado}</span></div>
      </div>

      <div class="seccion">
        <div class="seccion-titulo">Pagos</div>
        <div class="fila"><span class="etiqueta">Precio total</span><span class="valor">$${pedido.precio_final.toFixed(2)}</span></div>
        <div class="fila"><span class="etiqueta">Total abonado</span><span class="valor">$${pedido.total_abonado.toFixed(2)}</span></div>
        <div class="fila-total">
          <span>Saldo restante</span>
          <span class="${pedido.saldo_restante <= 0 ? 'saldo-cero' : 'saldo-pendiente'}">${saldo}</span>
        </div>
      </div>

      ${mensajeBase ? `<div class="mensaje">${mensajeBase}</div>` : ''}

      <div class="footer">Generado con Pi-alink</div>
    </body>
    </html>
  `;
};

export const generarYCompartirPDF = async (pedido, perfil) => {
  const html = buildHTML(pedido, perfil);

  const { uri } = await Print.printToFileAsync({ html });

  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error('El sistema de comparticion no esta disponible en este dispositivo.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Comprobante - ${pedido.nombre_cliente}`,
    UTI: 'com.adobe.pdf',
  });
};