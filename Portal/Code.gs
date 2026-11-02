/**
 * Intranet LBG — prototipo 0.1
 * Acceso limitado al dominio; cuenta IT directa y grupo opcional.
 * No utiliza Drive ni Sheets y NO guarda información.
 */
const CONFIG = Object.freeze({
  DOMINIO: 'bestvalencia.org',
  ADMIN_EMAIL: 'pablo.parrilla@bestvalencia.org',
  GRUPO_IT: 'pruebasparri@bestvalencia.org' // Opcional: pon aquí el correo de un Google Group real
});

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Intranet LBG')
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1'
    );
}

/** Información mínima para pintar el portal. */
function obtenerPortal() {
  const email = usuarioAutorizado_();
  const accesoIT = tieneAccesoIT_(email);

  return {
    email,
    modulos: [
      {
        id: 'general',
        nombre: 'Herramienta general',
        descripcion: 'Una prueba disponible para las cuentas del dominio.',
        permitido: true
      },
      {
        id: 'it',
        nombre: 'Herramienta restringida',
        descripcion: 'Una prueba controlada por el correo del responsable IT o un grupo opcional.',
        permitido: accesoIT
      }
    ]
  };
}

/**
 * Operación de demostración. Revalida los permisos SIEMPRE en el servidor.
 * La función no escribe en ningún almacén, tampoco cuando está autorizado.
 */
function ejecutarPrueba(idModulo, texto) {
  const email = usuarioAutorizado_();

  if (idModulo !== 'general' && idModulo !== 'it') {
    throw new Error('Módulo desconocido.');
  }

  if (idModulo === 'it' && !tieneAccesoIT_(email)) {
    return {
      autorizado: false,
      mensaje: 'Permiso denegado. Puedes tocar los controles, pero aquí no mandas 😄. No se ha ejecutado ni guardado nada.'
    };
  }

  const valor = String(texto == null ? '' : texto).trim().slice(0, 200);
  return {
    autorizado: true,
    mensaje: 'Prueba autorizada. El servidor ha recibido el texto, pero este prototipo no almacena datos.',
    eco: valor
  };
}

/** Comprueba identidad; nunca confía en un correo enviado por el navegador. */
function usuarioAutorizado_() {
  const email = String(Session.getActiveUser().getEmail() || '')
    .trim()
    .toLowerCase();

  const dominio = CONFIG.DOMINIO.trim().toLowerCase();
  if (!email || email.split('@')[1] !== dominio) {
    throw new Error('Acceso restringido a cuentas del dominio de LBG.');
  }
  return email;
}

/** Autorización IT: responsable nominal o miembro de un grupo real (si se configura). */
function tieneAccesoIT_(email) {
  if (email === String(CONFIG.ADMIN_EMAIL || '').trim().toLowerCase()) {
    return true;
  }
  if (!String(CONFIG.GRUPO_IT || '').trim()) {
    return false;
  }
  return perteneceAGrupo_(email, CONFIG.GRUPO_IT);
}

/**
 * Solo membresía directa. Si el grupo no se puede consultar, deniega acceso.
 * La configuración de visibilidad de Google Groups puede afectar la consulta.
 */
function perteneceAGrupo_(email, correoGrupo) {
  try {
    return GroupsApp.getGroupByEmail(correoGrupo).hasUser(email);
  } catch (error) {
    console.error('No se pudo comprobar la pertenencia al grupo: ' + String(error));
    return false;
  }
}
