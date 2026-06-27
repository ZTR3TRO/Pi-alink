import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const buildHTML = (pedido, perfil) => {
  const nombreNegocio = perfil?.nombre_negocio || 'Mi Taller de Pinatas';
  const mensajeBase = perfil?.mensaje_bienvenida || '';
  const saldo = pedido.saldo_restante > 0
    ? `$${pedido.saldo_restante.toFixed(2)}`
    : 'Liquidado';

  const descripcionHTML = pedido.descripcion_detallada
    ? `
      <div class="seccion">
        <div class="seccion-titulo">Detalles</div>
        <p class="descripcion">${pedido.descripcion_detallada}</p>
      </div>
    `
    : '';

  const mensajeHTML = mensajeBase
    ? `<div class="mensaje">${mensajeBase}</div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #2C1A0E; background: #FDF6EE; }
        .header { border-bottom: 2px solid #4A2C17; padding-bottom: 16px; margin-bottom: 28px; }
        .negocio { font-family: Georgia, serif; font-size: 24px; font-weight: 400; color: #4A2C17; letter-spacing: 1px; }
        .subtitulo { font-size: 12px; color: #7A5C44; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.5px; }
        .seccion { margin-bottom: 24px; }
        .seccion-titulo { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #D4713A; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #E8D9C8; }
        .fila { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .fila .etiqueta { color: #7A5C44; }
        .fila .valor { font-weight: 500; text-align: right; color: #2C1A0E; }
        .descripcion { font-size: 14px; color: #4A2C17; line-height: 1.6; font-style: italic; }
        .fila-total { display: flex; justify-content: space-between; font-size: 17px; font-weight: 700; border-top: 2px solid #4A2C17; padding-top: 14px; margin-top: 6px; font-family: Georgia, serif; }
        .saldo-cero { color: #4A7C3F; }
        .saldo-pendiente { color: #C0392B; }
        .mensaje { margin-top: 32px; padding: 16px; background: #FFFFFF; border-left: 3px solid #D4713A; border-radius: 4px; font-size: 13px; color: #4A2C17; line-height: 1.7; }
        .footer { margin-top: 48px; text-align: center; font-size: 10px; color: #A88B6E; letter-spacing: 1px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="negocio">${nombreNegocio}</div>
        <div class="subtitulo">Comprobante de pedido</div>
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

      ${descripcionHTML}

      <div class="seccion">
        <div class="seccion-titulo">Pago</div>
        <div class="fila"><span class="etiqueta">Precio total</span><span class="valor">$${pedido.precio_final.toFixed(2)}</span></div>
        <div class="fila"><span class="etiqueta">Total abonado</span><span class="valor">$${pedido.total_abonado.toFixed(2)}</span></div>
        <div class="fila-total">
          <span>Saldo restante</span>
          <span class="${pedido.saldo_restante <= 0 ? 'saldo-cero' : 'saldo-pendiente'}">${saldo}</span>
        </div>
      </div>

      ${mensajeHTML}

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