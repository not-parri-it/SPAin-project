/**
 * Big Brother · Miembros Gestión v1.0.0 (base funcional v0.3.8)
 * BEST Valencia · Google Apps Script
 *
 * Copia completa para el proyecto Big Brother EXISTENTE.
 * Despliegue web: ejecutar como "usuario que accede", acceso "dominio".
 * Para LEER: acceso de lector a la hoja. Para ESCRIBIR: acceso de editor.
 * Implementada como «ejecutar como usuario que accede»; el scope OAuth puede ser amplio.
 *
 * A:F son las columnas que ya ha definido Secretaría.
 * G = ID_Miembro (oculta); H = Marcado_para_borrado (oculta).
 */
const BB_CONFIG = Object.freeze({
  DOMINIO: 'bestvalencia.org',
  SECRETARIA_EMAILS: ['pablo.parrilla@bestvalencia.org'], // Sustituir por la cuenta institucional cuando exista
  SPREADSHEET_ID: '1IZxJW6VMdmBzICjVOCEQXpe7hHu7oTcKc3tVMEp0yPY',
  PESTANA: 'Miembros',
  SPREADSHEET_CAMBIOS_ID: '1StwdcqsKtdTiADLAMBAjsacVX7_vBsngNrh1vr7nwfQ',
  PESTANA_CAMBIOS: 'Cambios de estatus',
  // Al ponerlo en producción, cambiar por 'secretary@bestvalencia.org'
  GRUPO_CAMBIOS: 'SECRETARIA', // El permiso de cambios se comprueba contra SECRETARIA_EMAILS
  // Alta y destinos de estatus; los valores históricos heredados no se reescriben automáticamente.
  ESTATUS_VALIDOS: ['Full', 'Baby', 'Observer', 'Alumni', 'Inactive', 'Granizado de pleno derecho', 'Granizado simple', 'Guest']
});

function doGet() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!esSecretariaMiembros_(email)) {
    return HtmlService.createHtmlOutput('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acceso restringido · BEST Valencia</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px system-ui;background:#f4f8fc;color:#17324b}.card{max-width:460px;margin:20px;padding:38px 32px;text-align:center;background:white;border:1px solid #dce6ef;border-top:5px solid #a72b3f;border-radius:18px;box-shadow:0 12px 30px #16406310}h1{font-size:29px;letter-spacing:-.05em}p{color:#61798b}a{color:#1973be;font-weight:750}</style></head><body><main class="card"><div style="font-size:35px">🔐</div><h1>Haber sido secretario crack 😎</h1><p>Miembros · Gestión solo para Secretaría. Para consultar miembros, utiliza la aplicación de Participación.</p><a href="https://intranet.bestvalencia.org/">Volver al portal</a></main></body></html>')
      .setTitle('Acceso restringido · BEST Valencia');
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Miembros · Gestión · BEST Valencia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * EJECUTAR UNA SOLA VEZ desde el editor de Apps Script como propietario/editor.
 * Es idempotente: comprueba el esquema antes de escribir.
 * Añade G:H, crea los ID que falten y oculta ambas columnas técnicas.
 * No modifica A:F ni borra registros.
 */
function prepararHojaMiembros() {
  requerirPermiso_();
  return conBloqueo_(function () {
    const hoja = abrirHoja_();
    validarColumnasVisibles_(hoja);
    const headersTecnicos = hoja.getRange(1, 7, 1, 2).getDisplayValues()[0];
    if ((headersTecnicos[0] && headersTecnicos[0] !== 'ID_Miembro') ||
        (headersTecnicos[1] && headersTecnicos[1] !== 'Marcado_para_borrado')) {
      throw new Error('G:H ya contienen columnas distintas. Haz una copia y revisa el esquema antes de continuar.');
    }
    hoja.getRange(1, 7, 1, 2).setValues([['ID_Miembro', 'Marcado_para_borrado']]);
    hoja.setFrozenRows(1);
    hoja.getRange('A:B').setNumberFormat('@');
    hoja.getRange('D:D').setNumberFormat('@');
    hoja.getRange('F:G').setNumberFormat('@');
    hoja.getRange('E:E').setNumberFormat('dd/mm/yyyy');

    const n = Math.max(0, hoja.getLastRow() - 1);
    let asignados = 0;
    if (n > 0) {
      const filas = hoja.getRange(2, 1, n, 8).getValues();
      const ids = new Set();
      filas.forEach(function (fila, i) {
        const hayDatos = fila.slice(0, 6).some(function (celda) { return celda !== '' && celda !== null; });
        if (!hayDatos) return;
        let id = String(fila[6] || '').trim();
        if (!id) {
          id = crearId_();
          hoja.getRange(i + 2, 7).setValue(id);
          asignados++;
        }
        if (ids.has(id)) throw new Error('ID duplicado en la fila ' + (i + 2) + '. Corrígelo antes de seguir.');
        ids.add(id);
        if (fila[7] === '' || fila[7] === null) hoja.getRange(i + 2, 8).setValue(false);
      });
    }
    hoja.hideColumns(7, 2);
    return 'Hoja preparada. Se asignaron ' + asignados + ' identificadores. Las columnas G:H permanecen ocultas.';
  });
}

/** Lista únicamente miembros no marcados. Sin permisos no se entregan datos. */
function listarMiembros() {
  const email = requerirPermiso_();
  const hoja = abrirHoja_();
  validarEsquema_(hoja);
  const n = hoja.getLastRow() - 1;
  if (n <= 0) {
    return { autorizado: true, usuario: email, estatusDisponibles: BB_CONFIG.ESTATUS_VALIDOS, miembros: [] };
  }
  const zona = hoja.getRange(2, 1, n, 8).getValues();
  const miembros = zona.filter(function (fila) {
    return String(fila[6] || '').trim() && !estaMarcado_(fila[7]);
  }).map(function (fila) { return filaAObjeto_(fila, hoja); });
  return { autorizado: true, usuario: email, estatusDisponibles: BB_CONFIG.ESTATUS_VALIDOS, miembros: miembros };
}

/** Alta: estatus obligatorio. No se crea todavía una entrada histórica de cambio. */
function crearMiembro(datos) {
  requerirPermiso_();
  const limpio = validarDatos_(datos, true);
  return conBloqueo_(function () {
    const hoja = abrirHoja_();
    validarEsquema_(hoja);
    comprobarCorreoNoDuplicado_(hoja, limpio.correo, '');
    const id = crearId_();
    hoja.appendRow([
      textoHoja_(limpio.nombre), textoHoja_(limpio.apellidos), limpio.estatus,
      textoHoja_(limpio.correo), fechaParaHoja_(limpio.fechaUnion), textoHoja_(limpio.telefono), id, false
    ]);
    return { ok: true, id: id, mensaje: 'Miembro añadido correctamente.' };
  });
}

/** Edición explícita: jamás toca la columna C (estatus) ni G:H. */
function actualizarMiembro(id, datos) {
  requerirPermiso_();
  const limpio = validarDatos_(datos, false);
  return conBloqueo_(function () {
    const hoja = abrirHoja_();
    validarEsquema_(hoja);
    const fila = buscarFilaActivaPorId_(hoja, id);
    const actual = hoja.getRange(fila, 1, 1, 8).getValues()[0];
    const nombreAnterior = String(actual[0] || '').trim();
    const apellidosAnteriores = String(actual[1] || '').trim();
    const cambiaIdentidad = limpio.nombre !== nombreAnterior || limpio.apellidos !== apellidosAnteriores;
    const estatusAnterior = String(actual[2] || '').trim().toLowerCase();
    // Seguridad en el servidor: solo Observer y Guest pueden cambiar su identidad.
    // No basta con deshabilitar los campos del formulario HTML.
    const puedeEditarIdentidad = estatusAnterior === 'observer' || estatusAnterior === 'guest';
    if (cambiaIdentidad && !puedeEditarIdentidad) {
      throw new Error('Nombre y apellidos solo se pueden modificar en miembros Observer o Guest.');
    }
    comprobarCorreoNoDuplicado_(hoja, limpio.correo, id);
    // Si el dato heredado contiene fechas como "Septiembre 2025", el input
    // HTML no puede representarlo. No lo borramos al editar otro campo.
    const fechaAntigua = hoja.getRange(fila, 5).getValue();
    const fechaIncompatible = !limpio.fechaUnion && fechaAntigua && !fechaDesdeHoja_(fechaAntigua, hoja);
    const fechaGuardar = fechaIncompatible ? fechaAntigua : fechaParaHoja_(limpio.fechaUnion);
    if (cambiaIdentidad) {
      hoja.getRange(fila, 1, 1, 2).setValues([[textoHoja_(limpio.nombre), textoHoja_(limpio.apellidos)]]);
    }
    hoja.getRange(fila, 4, 1, 3).setValues([[
      textoHoja_(limpio.correo), fechaGuardar, textoHoja_(limpio.telefono)
    ]]);
    return { ok: true, mensaje: 'Datos actualizados. El estatus no se ha modificado.' };
  });
}

/** Borrado lógico irreversible desde ESTA interfaz. Ninguna fila se elimina. */
function marcarMiembroParaBorrado(id) {
  requerirPermiso_();
  return conBloqueo_(function () {
    const hoja = abrirHoja_();
    validarEsquema_(hoja);
    const fila = buscarFilaActivaPorId_(hoja, id);
    hoja.getRange(fila, 8).setValue(true);
    return { ok: true, mensaje: 'Miembro marcado para borrado. El registro se conserva en la hoja.' };
  });
}

/** Carga aislada del módulo Miembros. No consulta el historial. */
function cargarVistaMiembros() {
  const datos = listarMiembros();
  return {
    autorizado: datos.autorizado,
    usuario: datos.usuario,
    estatusDisponibles: datos.estatusDisponibles,
    miembros: datos.miembros,
    puedeCambiarEstatus: perteneceAGrupo_(datos.usuario, BB_CONFIG.GRUPO_CAMBIOS)
  };
}

/** Carga aislada del módulo de cambios. No consulta la hoja Miembros. */
function cargarVistaCambios() {
  const usuario = requerirPermiso_();
  const hoja = abrirHojaCambios_();
  const autorizadoCambios = perteneceAGrupo_(usuario, BB_CONFIG.GRUPO_CAMBIOS);
  const preparada = estaPreparadoBorradoCambios_(hoja);
  return {
    cambios: listarCambiosEstatus_(),
    // Antes la UI devolvía silenciosamente "—" si la columna H no existía.
    // Ahora puede explicar el bloqueo y ofrecer un paso explícito de preparación.
    puedeMarcarCambios: autorizadoCambios && preparada,
    puedePrepararCambios: autorizadoCambios && !preparada,
    borradoCambiosPreparado: preparada
  };
}

/**
 * EJECUTAR UNA VEZ desde el editor antes de activar el borrado lógico.
 * Se añade H = Marcado_para_borrado; A:G se conservan intactas.
 * Si H contiene información ajena se detiene para evitar sobrescribirla.
 */
function prepararHojaCambios() {
  const usuario = requerirPermiso_();
  if (!perteneceAGrupo_(usuario, BB_CONFIG.GRUPO_CAMBIOS)) {
    throw new Error('No tienes permiso para preparar la hoja de cambios.');
  }
  return conBloqueo_(function () {
    const hoja = abrirHojaCambios_();
    validarEsquemaCambios_(hoja);
    if (hoja.getMaxColumns() < 8) {
      hoja.insertColumnsAfter(hoja.getMaxColumns(), 8 - hoja.getMaxColumns());
    }
    const cabecera = String(hoja.getRange(1, 8).getDisplayValue() || '').trim();
    if (cabecera && cabecera !== 'Marcado_para_borrado') {
      throw new Error('La columna H ya tiene otra cabecera. Revísala antes de continuar.');
    }
    const cantidad = Math.max(0, hoja.getLastRow() - 1);
    if (cantidad) {
      const originales = hoja.getRange(2, 8, cantidad, 1).getValues();
      // No machacar información preexistente que pudiera haber en la columna H.
      if (originales.some(function (fila) {
        const valor = fila[0];
        return valor !== '' && valor !== null &&
          valor !== true && valor !== false &&
          !/^(true|false)$/i.test(String(valor).trim());
      })) throw new Error('H contiene datos no relacionados con el borrado lógico. Revisa esa columna.');
      hoja.getRange(2, 8, cantidad, 1).setValues(originales.map(function (fila) {
        return [estaMarcado_(fila[0])];
      }));
    }
    hoja.getRange(1, 8).setValue('Marcado_para_borrado');
    hoja.hideColumns(8);
    return 'Historial preparado: columna H creada y oculta. A:G y sus enlaces siguen intactos.';
  });
}

function estaPreparadoBorradoCambios_(hoja) {
  return hoja.getMaxColumns() >= 8 &&
    String(hoja.getRange(1, 8).getDisplayValue() || '').trim() === 'Marcado_para_borrado';
}

/** Borrado lógico exclusivo de usuarios autorizados: no toca Miembros ni elimina historial. */
function marcarCambioParaBorrado(idCambio) {
  const usuario = requerirPermiso_();
  if (!perteneceAGrupo_(usuario, BB_CONFIG.GRUPO_CAMBIOS)) {
    throw new Error('No tienes permiso para marcar cambios de estatus para borrado.');
  }
  const id = String(idCambio || '').trim();
  if (!id || id.length > 128) throw new Error('Identificador de cambio no válido.');
  return conBloqueo_(function () {
    const hoja = abrirHojaCambios_();
    validarEsquemaCambios_(hoja);
    if (!estaPreparadoBorradoCambios_(hoja)) {
      throw new Error('Primero ejecuta prepararHojaCambios() en el editor de Apps Script.');
    }
    const cantidad = Math.max(0, hoja.getLastRow() - 1);
    if (!cantidad) throw new Error('No hay cambios de estatus.');
    const cambios = hoja.getRange(2, 1, cantidad, 8).getValues();
    const coincidencias = [];
    cambios.forEach(function (fila, i) {
      if (String(fila[0] || '').trim() === id) coincidencias.push({ fila: i + 2, marcado: estaMarcado_(fila[7]) });
    });
    if (!coincidencias.length) throw new Error('No se encuentra ese cambio de estatus.');
    if (coincidencias.length !== 1) {
      throw new Error('Hay IDs de cambio duplicados; revisa la hoja antes de marcar uno.');
    }
    if (coincidencias[0].marcado) throw new Error('Ese cambio ya está marcado para borrado.');
    hoja.getRange(coincidencias[0].fila, 8).setValue(true);
    return { ok: true, mensaje: 'Cambio ocultado del historial habitual. No se ha modificado el estatus actual del miembro.' };
  });
}

function listarCambiosEstatus_(publicacionInterna) {
  // La publicación periódica usa la identidad efectiva del trigger; allí ActiveUser puede venir vacío.
  // Este helper privado (sufijo _) solo se llama desde controladores autorizados.
  if (!publicacionInterna) requerirPermiso_();
  const hoja = abrirHojaCambios_();
  validarEsquemaCambios_(hoja);
  const cantidad = Math.max(0, hoja.getLastRow() - 1);
  if (!cantidad) return [];
  const preparada = estaPreparadoBorradoCambios_(hoja);
  const matriz = hoja.getRange(2, 1, cantidad, preparada ? 8 : 7).getValues();
  const mostrados = hoja.getRange(2, 1, cantidad, 7).getDisplayValues();
  const hipervinculos = hoja.getRange(2, 7, cantidad, 1).getRichTextValues();
  return matriz.map(function(fila, i) {
    if (preparada && estaMarcado_(fila[7])) return null;
    const enlaceCelda = hipervinculos[i][0];
    const referencia = String(mostrados[i][6] || '').trim();
    const linkOculto = enlaceCelda && enlaceCelda.getLinkUrl() || '';
    const url = urlDocumento_(String(fila[6] || ''), linkOculto) || urlDocumento_(referencia, linkOculto);
    return {
      id: String(fila[0] || '').trim(),
      miembroId: String(fila[1] || '').trim(),
      nombre: String(fila[2] || '').trim(),
      apellidos: String(fila[3] || '').trim(),
      nuevoEstatus: String(fila[4] || '').trim(),
      fecha: fechaDesdeHoja_(fila[5], hoja) || String(mostrados[i][5] || ''),
      documento: referencia,
      url: url
    };
  }).filter(function(c) { return c && (c.id || c.miembroId || c.nombre || c.nuevoEstatus); })
    .sort(function(a, b) {
      // ISO-8601 yyyy-mm-dd admite comparación lexicográfica.
      // Fechas heredadas sin normalizar quedan al final; los IDs no fijan el orden.
      const aa = /^\d{4}-\d{2}-\d{2}$/.test(a.fecha) ? a.fecha : '';
      const bb = /^\d{4}-\d{2}-\d{2}$/.test(b.fecha) ? b.fecha : '';
      return bb.localeCompare(aa);
    });
}

/**
 * Una única operación de negocio: deja constancia documental y cambia
 * la columna C de Miembros. NO borra ni archiva al pasar a Inactive.
 */
function cambiarEstatusMiembro(idMiembro, nuevoEstatus, fecha, documento) {
  const usuario = requerirPermiso_();
  if (!perteneceAGrupo_(usuario, BB_CONFIG.GRUPO_CAMBIOS)) {
    throw new Error('No tienes permiso para registrar cambios de estatus.');
  }
  const id = String(idMiembro || '').trim();
  const nuevo = String(nuevoEstatus || '').trim();
  const fechaISO = String(fecha || '').trim();
  const link = String(documento == null ? '' : documento).trim();
  if (!id || id.length > 128) throw new Error('Miembro no válido.');
  if (BB_CONFIG.ESTATUS_VALIDOS.indexOf(nuevo) === -1) throw new Error('Estatus de destino no válido.');
  validarFechaISO_(fechaISO);
  if (link.length > 1000) throw new Error('El documento o enlace supera 1000 caracteres.');
  if (/[\r\n]/.test(link)) throw new Error('El enlace/documento debe escribirse en una sola línea.');

  return conBloqueo_(function() {
    const hojaMiembros = abrirHoja_();
    const hojaCambios = abrirHojaCambios_();
    validarEsquema_(hojaMiembros);
    validarEsquemaCambios_(hojaCambios);
    const fila = buscarFilaActivaPorId_(hojaMiembros, id);
    const actual = hojaMiembros.getRange(fila, 1, 1, 8).getValues()[0];
    if (String(actual[6]).trim() !== id) throw new Error('El miembro ha cambiado de posición. Vuelve a cargar.');
    const anterior = String(actual[2] || '').trim();
    if (anterior.toLowerCase() === nuevo.toLowerCase()) throw new Error('El miembro ya tiene ese estatus.');
    if (nuevo === 'Baby' && (!String(actual[0] || '').trim() || !String(actual[1] || '').trim())) {
      throw new Error('Antes de pasar a Baby, revisa y completa el nombre y los apellidos del miembro.');
    }
    const idCambio = 'cambio_' + Utilities.getUuid();
    // Guardamos primero el histórico: si falla el registro no cambiamos la ficha.
    const preparada = estaPreparadoBorradoCambios_(hojaCambios);
    if (!preparada) throw new Error('Primero ejecuta prepararHojaCambios() en Apps Script.');
    hojaCambios.appendRow([
      idCambio, id, textoHoja_(actual[0]), textoHoja_(actual[1]), nuevo,
      fechaParaHoja_(fechaISO), textoHoja_(link)
    ].concat(preparada ? [false] : []));
    SpreadsheetApp.flush();
    const nuevaFila = hojaCambios.getLastRow();
    try {
      // Comprobación adicional para evitar sobrescribir un cambio fuera de banda.
      const estadoJustoAntes = String(hojaMiembros.getRange(fila, 3).getValue() || '').trim();
      if (estadoJustoAntes !== anterior) throw new Error('Otro usuario ha modificado el estatus. Recarga los datos.');
      hojaMiembros.getRange(fila, 3).setValue(nuevo);
      SpreadsheetApp.flush();
      if (String(hojaMiembros.getRange(fila, 3).getValue()) !== nuevo) {
        throw new Error('No se ha podido confirmar la actualización del estatus.');
      }
    } catch (error) {
      // Google Sheets NO ofrece transacciones entre archivos. Intentamos
      // compensar tanto la celda de estatus como la fila histórica.
      let miembroRevertido = false;
      let historicoRevertido = false;
      try {
        const estadoAhora = String(hojaMiembros.getRange(fila, 3).getValue() || '').trim();
        if (estadoAhora === nuevo) {
          hojaMiembros.getRange(fila, 3).setValue(anterior);
          SpreadsheetApp.flush();
        }
        miembroRevertido = String(hojaMiembros.getRange(fila, 3).getValue() || '').trim() === anterior;
      } catch (rollbackMiembro) {
        console.error('ERROR CRÍTICO al revertir miembro ' + id + ': ' + rollbackMiembro);
      }
      try {
        if (String(hojaCambios.getRange(nuevaFila, 1).getValue()) === idCambio) {
          hojaCambios.deleteRow(nuevaFila);
          SpreadsheetApp.flush();
          historicoRevertido = true;
        }
      } catch (rollbackError) {
        console.error('ERROR CRÍTICO al revertir histórico ' + idCambio + ': ' + rollbackError);
      }
      if (!miembroRevertido || !historicoRevertido) {
        throw new Error('OPERACIÓN INCOMPLETA: revisa ambas hojas manualmente. Referencia: ' + idCambio);
      }
      throw error;
    }
    return {
      ok: true, idCambio: idCambio, nuevoEstatus: nuevo,
      mensaje: nuevo === 'Inactive'
        ? 'Estatus cambiado a Inactive. RECUERDA: revisar y marcar para borrado manualmente si corresponde.'
        : 'Cambio de estatus registrado en el histórico y en Miembros.'
    };
  });
}

function abrirHojaCambios_() {
  const hoja = SpreadsheetApp.openById(BB_CONFIG.SPREADSHEET_CAMBIOS_ID).getSheetByName(BB_CONFIG.PESTANA_CAMBIOS);
  if (!hoja) throw new Error('No se encuentra la pestaña "Cambios de estatus" en el archivo indicado.');
  return hoja;
}

function validarEsquemaCambios_(hoja) {
  const esperadas = ['id_cambio', 'id_miembro', 'nombre', 'apellidos', 'nuevo estatus', 'fecha', 'link / documento'];
  const actuales = hoja.getRange(1, 1, 1, 7).getDisplayValues()[0].map(normalizarCabecera_);
  if (esperadas.some(function(x, i) { return actuales[i] !== x; })) {
    throw new Error('La fila 1 de Cambios de estatus debe tener: ID_cambio | ID_miembro | Nombre | Apellidos | Nuevo estatus | Fecha | Link / documento.');
  }
}

function urlDocumento_(valor, enlaceCelda) {
  // Nunca abrir esquemas inseguros introducidos en la hoja.
  const candidato = String(enlaceCelda || valor || '').trim();
  return /^https:\/\/[^\s<>"']+$/i.test(candidato) ? candidato : '';
}

function esSecretariaMiembros_(email) {
  const correo = String(email || '').trim().toLowerCase();
  return correo.endsWith('@' + BB_CONFIG.DOMINIO) && BB_CONFIG.SECRETARIA_EMAILS.indexOf(correo) !== -1;
}

// El grupo de pruebas deja de conceder permisos: las acciones solo corresponden a Secretaría.
function perteneceAGrupo_(email, grupo) {
  return esSecretariaMiembros_(email);
}

function requerirPermiso_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!esSecretariaMiembros_(email)) throw new Error('Acceso denegado: esta aplicación es exclusiva de Secretaría.');
  return email;
}

function abrirHoja_() {
  const libro = SpreadsheetApp.openById(BB_CONFIG.SPREADSHEET_ID);
  const hoja = libro.getSheetByName(BB_CONFIG.PESTANA);
  if (!hoja) {
    throw new Error('No existe una pestaña llamada "Miembros". Renombra la pestaña del documento (no solo el archivo).');
  }
  return hoja;
}

function normalizarCabecera_(x) {
  return String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function validarColumnasVisibles_(hoja) {
  const esperadas = ['nombre', 'apellidos', 'estatus', 'correo', 'fecha de union', 'telefono'];
  const reales = hoja.getRange(1, 1, 1, 6).getDisplayValues()[0].map(normalizarCabecera_);
  if (esperadas.some(function (valor, i) { return valor !== reales[i]; })) {
    throw new Error('La fila 1 de la pestaña Miembros debe ser: Nombre | Apellidos | Estatus | Correo | Fecha de union | Teléfono.');
  }
}

function validarEsquema_(hoja) {
  validarColumnasVisibles_(hoja);
  const extras = hoja.getRange(1, 7, 1, 2).getDisplayValues()[0];
  if (extras[0] !== 'ID_Miembro' || extras[1] !== 'Marcado_para_borrado') {
    throw new Error('Falta preparar la hoja. Ejecuta prepararHojaMiembros() una sola vez desde Apps Script.');
  }
}

function validarDatos_(datos, esAlta) {
  if (!datos || typeof datos !== 'object') throw new Error('Formulario no válido.');
  const campo = function (n, max) {
    const v = String(datos[n] == null ? '' : datos[n]).trim().replace(/[\r\n\t]+/g, ' ');
    if (v.length > max) throw new Error('El campo ' + n + ' supera ' + max + ' caracteres.');
    return v;
  };
  const nombre = campo('nombre', 100);
  const apellidos = campo('apellidos', 150);
  const correo = campo('correo', 160);
  const telefono = campo('telefono', 40);
  const fechaUnion = campo('fechaUnion', 10);
  if (!nombre || !apellidos) throw new Error('Nombre y apellidos son obligatorios.');
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error('El correo no tiene un formato válido.');
  if (correo && !correo.toLowerCase().endsWith('@' + BB_CONFIG.DOMINIO)) {
    throw new Error('El correo debe pertenecer al dominio corporativo @' + BB_CONFIG.DOMINIO + '.');
  }
  if (fechaUnion) validarFechaISO_(fechaUnion);
  let estatus = '';
  if (esAlta) {
    estatus = campo('estatus', 30);
    if (BB_CONFIG.ESTATUS_VALIDOS.indexOf(estatus) === -1) {
      throw new Error('Selecciona un estatus válido para el alta.');
    }
  }
  return { nombre: nombre, apellidos: apellidos, correo: correo, telefono: telefono, fechaUnion: fechaUnion, estatus: estatus };
}

function validarFechaISO_(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('La fecha de unión debe tener formato AAAA-MM-DD.');
  const p = s.split('-').map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  if (d.getUTCFullYear() !== p[0] || d.getUTCMonth() + 1 !== p[1] || d.getUTCDate() !== p[2]) {
    throw new Error('La fecha de unión no existe.');
  }
}

function fechaParaHoja_(s) {
  if (!s) return '';
  validarFechaISO_(s);
  const p = s.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2], 12, 0, 0);
}

function fechaDesdeHoja_(v, hoja) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, hoja.getParent().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  const texto = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const es = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);
  if (es) {
    const iso = es[3] + '-' + es[2].padStart(2, '0') + '-' + es[1].padStart(2, '0');
    try { validarFechaISO_(iso); return iso; } catch (_) { return ''; }
  }
  return ''; // Datos heredados no interpretables: revisar en la hoja antes de editar ese campo.
}

function filaAObjeto_(fila, hoja) {
  return {
    id: String(fila[6]),
    nombre: String(fila[0] || '').trim(),
    apellidos: String(fila[1] || '').trim(),
    estatus: String(fila[2] || '').trim(),
    correo: String(fila[3] || '').trim(),
    fechaUnion: fechaDesdeHoja_(fila[4], hoja),
    telefono: String(fila[5] || '').trim()
  };
}

function buscarFilaActivaPorId_(hoja, id) {
  const valor = String(id || '').trim();
  if (!valor) throw new Error('Falta el identificador del miembro.');
  const n = hoja.getLastRow() - 1;
  if (n <= 0) throw new Error('No hay miembros.');
  const vals = hoja.getRange(2, 7, n, 2).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === valor) {
      if (estaMarcado_(vals[i][1])) throw new Error('Este miembro está marcado para borrado y no puede editarse.');
      return i + 2;
    }
  }
  throw new Error('No se ha encontrado el miembro solicitado.');
}

function comprobarCorreoNoDuplicado_(hoja, correo, idActual) {
  if (!correo) return;
  const n = hoja.getLastRow() - 1;
  if (n <= 0) return;
  const filas = hoja.getRange(2, 1, n, 8).getValues();
  const encontrado = filas.some(function (fila) {
    return !estaMarcado_(fila[7]) && String(fila[6] || '') !== idActual &&
      String(fila[3] || '').trim().toLowerCase() === correo.toLowerCase();
  });
  if (encontrado) throw new Error('Ya existe un miembro activo con ese correo.');
}

function estaMarcado_(x) {
  return x === true || String(x).trim().toUpperCase() === 'TRUE';
}

function textoHoja_(texto) {
  const s = String(texto || '');
  // Evita interpretar entradas de usuario como fórmulas en Sheets.
  return /^[\s]*[=+\-@]/.test(s) ? "'" + s : s;
}

function crearId_() { return 'miem_' + Utilities.getUuid(); }

function conBloqueo_(operacion) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const resultado = operacion();
    SpreadsheetApp.flush();
    // La publicación es derivada: un fallo no debe repetir o revertir el cambio administrativo.
    try { sincronizarPublicacionMiembros_(); }
    catch (err) { console.error('PUBLICACIÓN PENDIENTE. Ejecutar reconstruirPublicacionMiembros(): ' + err); }
    return resultado;
  } finally {
    lock.releaseLock();
  }
}
