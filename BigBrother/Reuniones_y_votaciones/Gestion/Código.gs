/**
 * Big Brother · Reuniones y votaciones v0.9.1
 * BEST Valencia | Aplicación INDEPENDIENTE de Miembros y Cambios de estatus.
 *
 * Calendario multi-reunión, borrado lógico, correos y actas desde cero.
 * Crea borradores Gmail sin enviar correos. Gestiona votaciones simples en su propia pestaña.
 *
 * Implantación: ejecutar COMO el usuario que accede, acceso limitado
 * al dominio. Cada usuario autorizado necesita Editor sobre la hoja Reuniones
 * para crear/editar; pertenecer al grupo NO sustituye los permisos Drive.
 */
const REU_CONFIG = Object.freeze({
  DOMINIO: 'bestvalencia.org',
  GRUPO_PRUEBAS: 'pruebasparri@bestvalencia.org', // Histórico: NO concede acceso a Gestión.
  // ID FIJO de la hoja de Reuniones. No se usan ScriptProperties ni se crea otro archivo.
  SPREADSHEET_ID: '1k_S9_ytQGFZwGKwYzfayKPYm4uII4B8H8YgsaFaagXs',
  PESTANA: 'Reuniones',
  PESTANA_PLANTILLAS: 'Plantillas_correo',
  COLUMNAS: [
    'ID_reunion', 'Fecha', 'Hora', 'Titulo', 'Lugar', 'Estado',
    'Puntos_dia_JSON', 'Puntos_noche_JSON', 'Link_acta',
    'Link_acta_anterior', 'Ultima_actualizacion', 'Actualizado_por',
    'Marcado_para_borrado'
  ]
});

/** Las URLs originales del correo deben conservarse tal cual.
 * El generador las identifica para no sustituir soles ni lunas originales
 * cuando incrusta fotos personales en borradores Gmail. */
const REU_IMAGENES_CORREO = Object.freeze({
  sol: 'https://cdn-icons-png.flaticon.com/512/890/890680.png',
  luna: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTi3xeFq8VhHuLQjIc7qYN_fJaj1Fe_8MqvQ&s',
  firma: 'https://ci3.googleusercontent.com/mail-sig/AIorK4yjR_Mo8kRtShncXf2MoOCsBpvgyNBq1qjq1zbv1fgE32SQ9pksEGM7iBi_djkCUICW4-AtwgU'
});

/**
 * Actas: copiar la plantilla nativa del usuario, sin tocar sus encabezados.
 * Cada Board (agosto-julio) requiere una carpeta RAÍZ explícita; dentro se crean
 * carpetas mensuales al necesitarse, con septiembre siempre como número 1.
 * El ID legado de carpeta se conserva como propiedad, pero NO se reutiliza
 * automáticamente para nuevos cursos.
 */
const REU_ACTAS = Object.freeze({
  PLANTILLA_DOC_ID: '1V6J6M-3pgr5-qjZOVe0z-VUEw1rakSDJiR5gkthIwck',
  PROP_URL_ARCHIVO: 'REUNIONES_URL_ARCHIVO_ACTAS',
  PROP_CARPETA_SALIDA: 'REUNIONES_CARPETA_SALIDA_ID', // propiedad antigua, solo lectura histórica
  PROP_BOARD_RAIZ_PREFIX: 'REUNIONES_BOARD_CARPETA_CURSO_',
  COLOR_MARCADOR: '#1155CC', // Azul clásico de los enlaces de Google Docs
  COLOR_AZUL: '#1973BE',
  COLOR_AMARILLO: '#FFD966'
});



/** ACCESO EXCLUSIVO A GESTIÓN.
 * DURANTE LAS PRUEBAS, esta cuenta personal ejerce de Secretaría.
 * En producción: sustituye por el correo institucional REAL de Secretaría,
 * elimina el correo de pruebas y publica una versión nueva.
 * NO autoriza a Board, al grupo de pruebas, ni a todos los miembros.
 */
const BB_GESTION_SECRETARIA = Object.freeze([
  'pablo.parrilla@bestvalencia.org'  // ADMINISTRADOR TEMPORAL DE PRUEBAS
]);

function bb_esSecretaria_(email) {
  const actual=String(email||'').trim().toLowerCase();
  return actual!=='' && actual.endsWith('@'+REU_CONFIG.DOMINIO) &&
    BB_GESTION_SECRETARIA.some(function(admin){return actual===String(admin).trim().toLowerCase();});
}
function bb_identidadActiva_() {
  return String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
}
function bb_exigirSecretaria_() {
  const email=bb_identidadActiva_();
  if(!bb_esSecretaria_(email)) throw new Error('Haber sido secretario, crack. Acceso exclusivo de Secretaría.');
  return email;
}
/** Únicamente para los triggers instalables, que se ejecutan bajo su creador. */
function bb_exigirSecretariaTrigger_() {
  const email=String(Session.getEffectiveUser().getEmail()||'').trim().toLowerCase();
  if(!bb_esSecretaria_(email))throw new Error('Trigger de publicación sin propietario autorizado.');
  return email;
}

/** La identidad visual ahora la aporta íntegramente la plantilla Google Docs. */

function doGet() {
  // NO se carga Index.html ni su información de Gestión para visitantes ajenos.
  if(!bb_esSecretaria_(bb_identidadActiva_())) {
    return HtmlService.createHtmlOutput(
      '<!doctype html><html lang="es"><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>Acceso denegado · BEST Valencia</title><style>'+
      'body{margin:0;min-height:100vh;display:grid;place-items:center;'+
      'font:16px/1.5 system-ui,sans-serif;background:#f4f8fc;color:#17324b}'+
      'main{text-align:center;max-width:480px;padding:36px 26px;background:white;'+
      'border:1px solid #dfebf4;border-radius:17px;box-shadow:0 12px 40px #17324b11}'+
      'h1{font-size:clamp(25px,5vw,35px);margin:10px 0 8px}'+
      'p{margin:0;color:#60778b}.badge{font-size:12px;letter-spacing:.12em;'+
      'text-transform:uppercase;color:#9b2635;font-weight:800}'+
      '.bar{height:5px;background:linear-gradient(90deg,#1973be 65%,#69cd28 65% 83%,#faa519 83%)}'+
      '</style></head><body><main><div class="bar"></div><p class="badge">Big Brother · Acceso restringido</p>'+
      '<h1>Haber sido secretario crack 😎</h1>'+
      '<p>Esta página es solo para superadmins de Secretaría. Tú tienes Participación.</p>'+
      '</main></body></html>'
    ).setTitle('Haber sido secretario, crack | BEST Valencia')
      .addMetaTag('viewport','width=device-width, initial-scale=1');
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Gestión · SOLO SECRETARÍA | Big Brother · BEST Valencia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Preparación OPCIONAL del archivo EXISTENTE indicado en REU_CONFIG.SPREADSHEET_ID.
 * - Nunca crea un nuevo Google Sheets ni altera datos de otras pestañas.
 * - Si la pestaña Reuniones ya contiene datos, solo valida los encabezados.
 * - Si la pestaña está vacía, inicializa las 13 columnas del módulo.
 * - Si el archivo tiene una sola pestaña COMPLETAMENTE vacía, puede renombrarla.
 * - Si no existe la pestaña y el archivo contiene otros datos, aborta sin tocarlos.
 *
 * Ejecutar desde el editor si el archivo está sin preparar; si ya existe una
 * pestaña Reuniones correcta, NO necesitas ejecutar nada.
 */
function prepararModuloReuniones() {
  bb_exigirSecretaria_();
  const email = requerirPruebas_();
  return bajoBloqueo_(function () {
    let archivo;
    try { archivo = SpreadsheetApp.openById(REU_CONFIG.SPREADSHEET_ID); }
    catch (err) {
      throw new Error('No se puede abrir la hoja configurada. Comprueba el ID y tus permisos de Google Drive.');
    }
    let hoja = archivo.getSheetByName(REU_CONFIG.PESTANA);
    if (!hoja) {
      const otras = archivo.getSheets();
      if (otras.length === 1 && otras[0].getLastRow() === 0 && otras[0].getLastColumn() === 0) {
        hoja = otras[0];
        hoja.setName(REU_CONFIG.PESTANA);
      } else {
        throw new Error('El archivo indicado no tiene una pestaña "Reuniones". No se ha modificado nada: revisa el nombre de la pestaña y el archivo correcto.');
      }
    }
    let inicializada = false;
    if (hoja.getLastRow() === 0) {
      hoja.getRange(1, 1, 1, REU_CONFIG.COLUMNAS.length).setValues([REU_CONFIG.COLUMNAS]);
      hoja.getRange(1, 1, 1, REU_CONFIG.COLUMNAS.length)
        .setBackground('#1973BE').setFontColor('#FFFFFF').setFontWeight('bold');
      hoja.setFrozenRows(1);
      hoja.getRange('A:B').setNumberFormat('@');
      hoja.getRange('C:E').setNumberFormat('@');
      hoja.getRange('G:J').setNumberFormat('@');
      hoja.autoResizeColumns(1, REU_CONFIG.COLUMNAS.length);
      hoja.hideColumns(1);
      hoja.hideColumns(13);
      inicializada = true;
    }
    validarEsquema_(hoja);
    asegurarColumnaConvocatoria_(hoja);
    Logger.log('Hoja de Reuniones configurada:' + archivo.getUrl());
    return { ok: true, inicializada: inicializada,
      spreadsheetId: REU_CONFIG.SPREADSHEET_ID, url: archivo.getUrl(),
      responsable: email, mensaje: inicializada
        ? 'Pestaña Reuniones inicializada en el archivo indicado.'
        : 'Se conserva la pestaña Reuniones existente: esquema correcto.' };
  });
}

/** Calendario de Secretaría y calendario general: filtrado EN EL SERVIDOR. */
function listarReunionesCurso(anioInicio) {
  bb_exigirSecretaria_();
  const email = requerirCuentaDominio_();
  const puedeGestionar = puedeGestionarReuniones_(email);
  const anio = validarAnioCurso_(anioInicio);
  const inicio = String(anio) + '-09-01';
  const fin = String(anio + 1) + '-08-31';
  const registros = leerReuniones_().filter(function (r) {
    return !r.marcado && r.fecha >= inicio && r.fecha <= fin &&
      (puedeGestionar || r.estado === 'Convocada');
  }).sort(function(a,b){return a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora);});
  // El público no recibe borradores, agenda privada ni JSON de convocatoria.
  const reuniones = puedeGestionar ? registros : registros.map(function(r){
    return {id:r.id,fecha:r.fecha,hora:r.hora,titulo:r.titulo,
      lugar:r.lugar,estado:'Convocada',linkActa:r.linkActa};
  });
  const respuesta = {
    usuario: email, puedeGestionar:puedeGestionar, anioInicio:anio,
    urlArchivoActas:PropertiesService.getScriptProperties().getProperty(REU_ACTAS.PROP_URL_ARCHIVO)||'',
    reuniones:reuniones
  };
  if(puedeGestionar){
    respuesta.urlCarpetaSalidaActas=urlCarpetaConfiguradaActas_(anio);
    respuesta.carpetasBoardActas={
      [anio]:urlCarpetaConfiguradaActas_(anio),
      [anio+1]:urlCarpetaConfiguradaActas_(anio+1)
    };
  }
  return respuesta;
}

/** Confirmación manual: nunca envia Gmail ni modifica el acta. */
function confirmarConvocatoriaReunion(idReunion) {
  bb_exigirSecretaria_();
  const email = requerirPruebas_();
  const id = String(idReunion||'').trim();
  if (!/^reu_[\w-]{15,60}$/.test(id)) throw new Error('Guarda primero la reunión antes de confirmar la convocatoria.');
  return bajoBloqueo_(function(){
    const hoja = abrirHojaReuniones_();
    const n = hoja.getLastRow()-1;
    if(n<=0) throw new Error('No hay reuniones guardadas.');
    const filas = hoja.getRange(2,1,n,13).getValues();
    const i=filas.findIndex(function(f){return String(f[0]||'').trim()===id;});
    if(i<0 || marcado_(filas[i][12])) throw new Error('Reunión no encontrada o marcada para borrado.');
    const actual=String(filas[i][5]||'Borrador').trim();
    if(actual==='Convocada') return {ok:true,id:id,estado:'Convocada',mensaje:'La reunión ya estaba convocada.'};
    if(actual!=='Borrador') throw new Error('Estado de reunión desconocido: '+actual+'. Revísalo en la hoja.');
    // La fotografía se guarda antes del cambio de estado: si falla, la reunión
    // permanece en borrador. Un nuevo intento sustituye cualquier fotografía
    // provisional de ese borrador; nunca se recalculan reuniones ya convocadas.
    asegurarColumnaCensoAsistencia_(hoja);
    const censo = crearCensoAsistencia_(id, email);
    hoja.getRange(i+2,15).setValue(JSON.stringify(censo));
    SpreadsheetApp.flush();
    hoja.getRange(i+2,6).setValue('Convocada');
    hoja.getRange(i+2,11,1,2).setValues([[new Date(),email]]);
    SpreadsheetApp.flush();
    bb_publicarTrasCambio_();
    return {ok:true,id:id,estado:'Convocada',mensaje:'Reunión marcada como Convocada. Visible en el calendario general.'};
  });
}

/** La reunión inmediatamente anterior se determina por FECHA + HORA, aunque coincida el día.
 * No se saltan reuniones sin acta: enlazar una más antigua sería un error.
 * Las reuniones marcadas para borrado nunca cuentan.
 */
function reunionAnteriorCronologica_(reuniones, fecha, hora, idExcluir) {
  const momento = String(fecha)+'T'+String(hora || '00:00');
  const orden = function(r){return r.fecha+'T'+(r.hora || '00:00');};
  return reuniones.filter(function(r){
    return !r.marcado && r.id !== idExcluir && orden(r) < momento;
  }).sort(function(a,b){return orden(b).localeCompare(orden(a));})[0] || null;
}

/** Cuando se termina un acta, ofrecerla automáticamente a la reunión siguiente
 * si su columna «Link_acta_anterior» todavía estaba vacía.
 * Solo afecta a la siguiente reunión cronológica inmediata, no a otras.
 */
function completarActaSiguienteSiFalta_(registros, reunion, url, hoja) {
  const marca=function(r){return r.fecha+'T'+(r.hora||'00:00');};
  const siguiente=registros.filter(function(r){
    return !r.marcado && r.id!==reunion.id && marca(r)>marca(reunion);
  }).sort(function(a,b){return marca(a).localeCompare(marca(b));})[0];
  if(!siguiente || siguiente.linkActaAnterior) return;
  const n=hoja.getLastRow()-1;
  if(n<=0)return;
  const ids=hoja.getRange(2,1,n,1).getValues();
  const ix=ids.findIndex(function(r){return String(r[0]||'')===siguiente.id;});
  if(ix<0)return;
  const celda=hoja.getRange(ix+2,10);
  if(!String(celda.getValue()||'').trim()) celda.setValue(url);
}

/** Carga automática del acta anterior en el formulario (sin tocar el documento). */
function buscarActaReunionAnterior(fecha, hora, idExcluir) {
  bb_exigirSecretaria_();
  requerirPruebas_();
  const dia = validarFecha_(fecha);
  const h = String(hora || '00:00');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) throw new Error('Indica una hora válida antes de buscar el acta anterior.');
  const anterior = reunionAnteriorCronologica_(leerReuniones_(),dia,h,String(idExcluir||''));
  return anterior ? {
    encontrada:true,fecha:anterior.fecha,hora:anterior.hora,
    titulo:anterior.titulo,linkActa:anterior.linkActa || ''
  } : {encontrada:false,linkActa:''};
}

/** Devuelve el último orden del día anterior a fecha/hora, para sugerirlo. */
function sugerirPuntosReunionAnterior(fecha, hora) {
  bb_exigirSecretaria_();
  requerirPruebas_();
  const dia = validarFecha_(fecha);
  const h = hora ? String(hora) : '00:00'; // Compatibilidad con llamadas anteriores solo por fecha
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) throw new Error('Hora inválida.');
  const anterior = reunionAnteriorCronologica_(leerReuniones_(),dia,h,'');
  return anterior ? {
    fecha: anterior.fecha, hora:anterior.hora,
    titulo: anterior.titulo,
    puntosDia: anterior.puntosDia,
    puntosNoche: anterior.puntosNoche, linkActa: anterior.linkActa
  } : null;
}

/** Crea o edita una reunión. Separación mínima de 60 minutos, bajo bloqueo. */
function guardarReunion(datos) {
  bb_exigirSecretaria_();
  const email = requerirPruebas_();
  const limpio = validarReunion_(datos);
  return bajoBloqueo_(function () {
    const hoja = abrirHojaReuniones_();
    asegurarColumnaConvocatoria_(hoja);
    const cantidad = hoja.getLastRow() - 1;
    const valores = cantidad > 0 ? hoja.getRange(2, 1, cantidad, REU_CONFIG.COLUMNAS.length).getValues() : [];
    const zona = hoja.getParent().getSpreadsheetTimeZone();
    let filaEditar = 0;
    let anterior = null;
    valores.forEach(function (fila, i) {
      const existenteId = String(fila[0] || '').trim();
      if (!existenteId || marcado_(fila[12])) return;
      if (limpio.id && existenteId === limpio.id) {
        filaEditar = i + 2;
        anterior = fila;
      }
      if (normalizarFechaHoja_(fila[1], zona, i + 2) === limpio.fecha && existenteId !== limpio.id) {
        const horaExistente = normalizarHoraHoja_(fila[2], zona, i + 2);
        if (!/^\d{2}:\d{2}$/.test(horaExistente)) throw new Error('Una reunión existente no tiene hora válida. Corrige su fila antes de crear otra en el mismo día.');
        const minutos = function(h){ const partes = h.split(':');return Number(partes[0])*60 + Number(partes[1]); };
        if (Math.abs(minutos(horaExistente) - minutos(limpio.hora)) < 60) {
          throw new Error('Conflicto horario: ya existe una reunión a las '+horaExistente+'. Se requieren al menos 60 minutos entre horas de inicio.');
        }
      }
    });
    if (limpio.id && !filaEditar) {
      throw new Error('La reunión que quieres editar no existe o ya está inactiva. Recarga el calendario.');
    }
    const id = limpio.id || 'reu_' + Utilities.getUuid();
    // Resolución definitiva en el servidor, dentro del bloqueo. No dependemos
    // de que la búsqueda del navegador haya terminado antes de pulsar Guardar.
    const inmediata = reunionAnteriorCronologica_(leerReuniones_(), limpio.fecha, limpio.hora, id);
    const actaAnterior = limpio.linkActaAnterior || (inmediata ? inmediata.linkActa : '') || '';
    const filaNueva = [
      id, limpio.fecha, textoParaHoja_(limpio.hora), textoParaHoja_(limpio.titulo),
      textoParaHoja_(limpio.lugar), anterior ? String(anterior[5] || 'Borrador') : 'Borrador',
      JSON.stringify(limpio.puntosDia), JSON.stringify(limpio.puntosNoche),
      limpio.linkActa, actaAnterior,
      new Date(), email, false, JSON.stringify(limpio.convocatoria)
    ];
    // Escribir Fecha/Hora como texto evita que Sheets las convierta a Date.
    // Esto solo afecta a la fila guardada, no transforma fechas históricas.
    const filaDestino = filaEditar || hoja.getLastRow() + 1;
    hoja.getRange(filaDestino, 2, 1, 2).setNumberFormat('@');
    hoja.getRange(filaDestino, 1, 1, REU_CONFIG.COLUMNAS.length + 1).setValues([filaNueva]);
    SpreadsheetApp.flush();
    bb_publicarTrasCambio_();
    return { ok: true, id: id, fecha: limpio.fecha, hora: limpio.hora,
    titulo: limpio.titulo, lugar: limpio.lugar, estado: filaNueva[5],
    puntosDia: limpio.puntosDia, puntosNoche: limpio.puntosNoche,
    linkActa: limpio.linkActa, linkActaAnterior: actaAnterior,
    convocatoria: limpio.convocatoria,
    mensaje: filaEditar ? 'Reunión actualizada.' : 'Reunión creada como borrador.' };
  });
}


/** Actualiza el botón «Archivo de actas» para todos los usuarios autorizados. */
function configurarEnlaceArchivoActas(url) {
  bb_exigirSecretaria_();
  requerirPruebas_();
  const enlace = String(url || '').trim();
  if (enlace && !/^https:\/\/drive\.google\.com\/drive\/folders\/[A-Za-z0-9_-]+(?:[/?#].*)?$/.test(enlace)) {
    throw new Error('Indica una URL de carpeta de Google Drive (drive.google.com/drive/folders/…).');
  }
  return bajoBloqueo_(function () {
    const propiedades = PropertiesService.getScriptProperties();
    if (enlace) propiedades.setProperty(REU_ACTAS.PROP_URL_ARCHIVO, enlace);
    else propiedades.deleteProperty(REU_ACTAS.PROP_URL_ARCHIVO);
    return {ok: true, urlArchivoActas: enlace,
      mensaje: enlace ? 'Enlace del archivo de actas actualizado.' : 'Enlace del archivo de actas retirado.'};
  });
}

/** Board nueva en agosto, tras cerrar julio, sin mezclar sus carpetas.
 * El índice mensual sigue siendo septiembre=1, octubre=2, ..., agosto=12.
 * El calendario académico continúa septiembre-agosto; no se modifica.
 */
function anioInicioBoardActas_(fecha) {
  const anio = Number(String(fecha).slice(0,4));
  const mes = Number(String(fecha).slice(5,7));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha)) || mes<1 || mes>12)
    throw new Error('Fecha de reunión inválida para archivar el acta.');
  return mes >= 8 ? anio : anio - 1;
}
function claveCarpetaBoardActas_(curso) {
  return REU_ACTAS.PROP_BOARD_RAIZ_PREFIX + validarAnioCurso_(curso);
}
function idCarpetaBoardActas_(curso) {
  return String(PropertiesService.getScriptProperties().getProperty(claveCarpetaBoardActas_(curso))||'').trim();
}
function urlCarpetaConfiguradaActas_(curso) {
  const id=idCarpetaBoardActas_(curso);
  return id ? 'https://drive.google.com/drive/folders/'+id : '';
}
function idCarpetaDesdeUrlActas_(entrada) {
  const valor=String(entrada||'').trim();
  const encontrado=/^https:\/\/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)(?:[/?#].*)?$/.exec(valor);
  if (!encontrado) throw new Error('Pega una URL de CARPETA de Drive: https://drive.google.com/drive/folders/ID.');
  return encontrado[1];
}
/** Configura la carpeta RAÍZ de una Board concreta, no una carpeta mensual. */
function configurarCarpetaSalidaActas(url, anioInicio) {
  bb_exigirSecretaria_();
  requerirPruebas_();
  const curso=validarAnioCurso_(anioInicio);
  const id=idCarpetaDesdeUrlActas_(url);
  let carpeta;
  try { carpeta=DriveApp.getFolderById(id); carpeta.getName(); }
  catch(err) {
    throw new Error('No puedo abrir esa carpeta de Board. Comprueba URL y permisos de Drive. Detalle: '+String(err.message||err));
  }
  return bajoBloqueo_(function(){
    const props=PropertiesService.getScriptProperties();
    const clave=claveCarpetaBoardActas_(curso);
    const anterior=props.getProperty(clave);
    if (anterior && anterior!==id) {
      // Nunca impedir la corrección de una carpeta equivocada, pero avisar.
      Logger.log('Cambio de carpeta de Board para curso '+curso+': '+anterior+' -> '+id);
    }
    props.setProperty(clave,id);
    return {ok:true,urlCarpetaSalidaActas:'https://drive.google.com/drive/folders/'+id,
      curso:curso,nombre:carpeta.getName(),
      mensaje:'Carpeta de Board '+curso+'–'+(curso+1)+' configurada: '+carpeta.getName()+'.'};
  });
}
function carpetaBoardActas_(curso) {
  const id=idCarpetaBoardActas_(curso);
  if (!id) throw new Error('Antes de generar el acta, configura la carpeta de la Board '+curso+'–'+(curso+1)+' desde el calendario. La nueva Board empieza en agosto, tras julio, y NO se reutiliza la carpeta anterior.');
  try {const carpeta=DriveApp.getFolderById(id);carpeta.getName();return carpeta;}
  catch(err){throw new Error('No se puede abrir la carpeta de Board configurada para '+curso+'–'+(curso+1)+'. Revisa el enlace y permisos. Detalle: '+String(err.message||err));}
}
const REU_MESES_ARCHIVO = ['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];
function nombreCarpetaMesActas_(fecha) {
  const mes=Number(String(fecha).slice(5,7));
  if (!Number.isInteger(mes)||mes<1||mes>12) throw new Error('No se reconoce el mes del acta.');
  const posicion=(mes+3)%12; // septiembre=0; octubre=1; agosto=11
  return (posicion+1)+'. '+REU_MESES_ARCHIVO[posicion];
}
/** Se llama dentro del bloqueo de generación; no crea meses ausentes previos. */
function carpetaMensualActas_(carpetaBoard,fecha) {
  const nombre=nombreCarpetaMesActas_(fecha);
  const existentes=carpetaBoard.getFoldersByName(nombre);
  let carpeta=null;
  if (existentes.hasNext()) {
    carpeta=existentes.next();
    if (existentes.hasNext()) throw new Error('Hay más de una carpeta llamada «'+nombre+'» dentro de la Board. Unifica los duplicados antes de continuar.');
  } else carpeta=carpetaBoard.createFolder(nombre);
  return carpeta;
}

function fechaCortaActa_(iso) {return iso.split('-').reverse().join('/');}
function horaParaNombre_(hora) {return String(hora || '').replace(':','h');}

/** Da estilo consistente a los párrafos del documento. */
function estiloParrafoActa_(p, opciones) {
  opciones=opciones||{};
  const texto=p.editAsText();
  texto.setFontFamily('Arial');
  texto.setFontSize(opciones.tamano||10);
  if (opciones.color) texto.setForegroundColor(opciones.color);
  // Evitar estilos heredados del CIF o del párrafo anterior.
  texto.setBold(!!opciones.negrita);
  texto.setUnderline(!!opciones.subrayado);
  if (opciones.centro) p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  if (opciones.derecha) p.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  if (opciones.antes!=null) p.setSpacingBefore(opciones.antes);
  if (opciones.despues!=null) p.setSpacingAfter(opciones.despues);
  return p;
}

/** Comprueba que la plantilla termina en CIF; NO BORRA NI CAMBIA NADA. */
function validarPlantillaActa_(documento) {
  const contenido=String(documento.getBody().getText()||'').trim();
  let cabecera='';
  try { const header=documento.getHeader(); if(header)cabecera=String(header.getText()||'').trim(); }
  catch(err){ /* Algunas plantillas no tienen sección de encabezado. */ }
  // El CIF puede estar en el encabezado formal o en el cuerpo de Google Docs.
  const contieneCif= /CIF\s*:\s*G98468663\b/i.test(cabecera+'\n'+contenido);
  if (!contieneCif) throw new Error('No encuentro «CIF: G98468663» en la plantilla. Comprueba el ID.');
  if (contenido && !/CIF\s*:\s*G98468663\s*$/i.test(contenido))
    throw new Error('La plantilla debe terminar en el CIF, sin contenido de actas después. No se ha modificado nada.');
}

/** AÑADE campos y agenda al final de la copia; encabezados e imágenes intactos. */
function escribirActaDebajoCif_(documento, reunion) {
  const body=documento.getBody();
  body.appendParagraph('');
  const campo=function(rotulo,valor,despues){
    // Al copiar una plantilla, Google Docs puede heredar el estilo del CIF.
    // Establecemos primero TODO el campo como normal y solo después la etiqueta en negrita.
    const contenido=rotulo+(valor ? ' '+String(valor) : '');
    const p=body.appendParagraph(contenido);
    estiloParrafoActa_(p,{tamano:10,color:'#000000',despues:despues==null?0:despues});
    const texto=p.editAsText();
    texto.setBold(false);
    texto.setUnderline(false);
    texto.setBold(0,rotulo.length-1,true);
    return p;
  };
  campo('Fecha:',fechaCortaActa_(reunion.fecha));
  campo('Hora de inicio:',reunion.hora);
  campo('Hora de fin:','');
  campo('Lugar:',reunion.lugar||'Por determinar',21);
  campo('Asistentes:','',19);
  campo('Asistentes tardíos:','',19);

  const dia=body.appendParagraph('Puntos del día');
  estiloParrafoActa_(dia,{centro:true,color:REU_ACTAS.COLOR_AMARILLO,negrita:true,tamano:18,antes:9,despues:10});
  const marcador=function(){
    body.appendParagraph('');
    body.appendParagraph('');
    estiloParrafoActa_(body.appendParagraph('#'),
      {color:REU_ACTAS.COLOR_MARCADOR,negrita:true,tamano:11,despues:16});
  };
  const epigrafe=function(texto){
    estiloParrafoActa_(body.appendParagraph(texto),
      {negrita:true,subrayado:true,color:'#000000',tamano:10,despues:0});
  };
  (reunion.puntosDia||[]).filter(function(x){return String(x||'').trim();}).forEach(function(p,i){
    epigrafe('Punto '+(i+1)+': '+String(p));marcador();
  });
  const noche=body.appendParagraph('Puntos de noche');
  estiloParrafoActa_(noche,{centro:true,negrita:true,color:REU_ACTAS.COLOR_AZUL,tamano:18,antes:12,despues:13});
  (reunion.puntosNoche||[]).forEach(function(bloque){
    const titulo=String(bloque.titulo||'').trim();
    if (!titulo) return;
    estiloParrafoActa_(body.appendParagraph(titulo+':'),
      {negrita:true,subrayado:true,color:'#000000',tamano:12,antes:8,despues:7});
    const subs=(bloque.apartados||[]).filter(function(x){return String(x||'').trim();});
    subs.forEach(function(sub){epigrafe('• '+String(sub)+':');marcador();});
    // Events Team lleva marcador al final aunque aún no tenga subapartados.
    // Si tiene subapartados, el último ya termina en # y no se duplica.
    if (!subs.length && !/^(board|management|wgs)$/i.test(titulo)) marcador();
  });
  documento.saveAndClose();
}

/** Genera una copia del Doc de plantilla en la carpeta mensual y actualiza I/J. */
function generarActaReunion(idReunion) {
  bb_exigirSecretaria_();
  const email=requerirPruebas_();
  const id=String(idReunion || '').trim();
  if (!/^reu_[\w-]{8,70}$/.test(id)) throw new Error('Guarda primero la reunión antes de generar un acta.');
  return bajoBloqueo_(function(){
    const registros=leerReuniones_();
    const reunion=registros.find(function(r){return r.id===id && !r.marcado;});
    if (!reunion) throw new Error('La reunión no existe o está marcada para borrado.');
    if (reunion.linkActa) return {ok:true,yaExistia:true,url:reunion.linkActa,
      linkActaAnterior:reunion.linkActaAnterior || '',mensaje:'Esta reunión ya tiene un acta vinculada. No se ha generado un duplicado.'};
    if (!reunion.puntosDia.length) throw new Error('Añade y guarda los puntos del día antes de generar el acta.');

    const anterior=reunionAnteriorCronologica_(registros,reunion.fecha,reunion.hora,id);
    // Si la reunión anterior todavía no tiene acta, no enlazamos una más vieja
    // por error. Conservamos cualquier vínculo introducido manualmente.
    const enlaceAnterior=reunion.linkActaAnterior || (anterior ? anterior.linkActa : '') || '';
    const curso=anioInicioBoardActas_(reunion.fecha);
    const carpetaBoard=carpetaBoardActas_(curso);
    // Validar la plantilla ANTES de crear carpeta/archivo alguno.
    const plantilla=DocumentApp.openById(REU_ACTAS.PLANTILLA_DOC_ID);
    validarPlantillaActa_(plantilla);
    const carpeta=carpetaMensualActas_(carpetaBoard,reunion.fecha);
    const mismoDia=registros.filter(function(r){return !r.marcado && r.fecha===reunion.fecha;}).length>1;
    const nombre=fechaCortaActa_(reunion.fecha)+(mismoDia?' '+horaParaNombre_(reunion.hora):'')+
      ' ACTA REUNIÓN - Acta de Reunión Regular';
    let documento,archivoDoc;
    try {
      archivoDoc=DriveApp.getFileById(REU_ACTAS.PLANTILLA_DOC_ID).makeCopy(nombre,carpeta);
      documento=DocumentApp.openById(archivoDoc.getId());
      escribirActaDebajoCif_(documento,reunion);
    } catch(err) {
      if(archivoDoc) {try{archivoDoc.setTrashed(true);}catch(noPudoEliminar){}}
      throw new Error('No se pudo copiar o completar la plantilla: '+String(err.message||err));
    }
    const url='https://docs.google.com/document/d/'+documento.getId()+'/edit';
    try {
      const hoja=abrirHojaReuniones_();
      const n=hoja.getLastRow()-1;
      const ids=n>0?hoja.getRange(2,1,n,1).getValues():[];
      const ix=ids.findIndex(function(f){return String(f[0] || '')===id;});
      if (ix<0)throw new Error('No se encuentra la fila original en Sheets.');
      const fila=ix+2;
      // Una única escritura de los dos enlaces, sin tocar otros campos.
      hoja.getRange(fila,9,1,2).setValues([[url,enlaceAnterior]]);
      hoja.getRange(fila,11,1,2).setValues([[new Date(),email]]);
      SpreadsheetApp.flush();
    } catch(err) {
      // No dejar copias huérfanas que provocarían duplicados en el siguiente intento.
      try {archivoDoc.setTrashed(true);} catch(falloTrash) {
        throw new Error('Fallo al vincular el acta: '+err.message+'. Hay una copia sin vincular en Drive: '+url);
      }
      throw err;
    }
    // Si ya estaba creada la siguiente reunión sin acta anterior, completamos
    // automáticamente su columna J. Un fallo aquí no invalida el acta creada.
    try {
      completarActaSiguienteSiFalta_(registros,reunion,url,abrirHojaReuniones_());
      SpreadsheetApp.flush();
    } catch (e) { Logger.log('Acta generada; pendiente de enlazar en reunión siguiente: '+e.message); }
    // Solo se propone el acceso al directorio si no existe ya uno personalizado.
    try {const props=PropertiesService.getScriptProperties();
      if (!props.getProperty(REU_ACTAS.PROP_URL_ARCHIVO))
        props.setProperty(REU_ACTAS.PROP_URL_ARCHIVO,carpetaBoard.getUrl());
    }catch(err){ /* No bloquear la creación por no poder actualizar el enlace. */ }
    return {ok:true,yaExistia:false,url:url,linkActaAnterior:enlaceAnterior,
      urlArchivoActas:PropertiesService.getScriptProperties().getProperty(REU_ACTAS.PROP_URL_ARCHIVO)||'',
      urlCarpetaSalidaActas: urlCarpetaConfiguradaActas_(curso),
      urlCarpetaMesActas: carpeta.getUrl(),
      mensaje:'Acta creada desde la plantilla en «'+nombreCarpetaMesActas_(reunion.fecha)+'» y vinculada a la reunión.'};
  });
}

/** Borrado lógico: la reunión queda en Sheets pero no en calendario ni bloquea horarios. */
function marcarReunionParaBorrado(idReunion) {
  bb_exigirSecretaria_();
  requerirPruebas_();
  const id = String(idReunion || '').trim();
  if (!/^reu_[\w-]{8,70}$/.test(id)) throw new Error('ID de reunión inválido.');
  return bajoBloqueo_(function(){
    const hoja = abrirHojaReuniones_();
    const n = hoja.getLastRow() - 1;
    if (n <= 0) throw new Error('No hay reuniones en la hoja.');
    const registros = hoja.getRange(2, 1, n, 13).getValues();
    const idx = registros.findIndex(function(r){return String(r[0] || '').trim() === id;});
    if (idx < 0 || marcado_(registros[idx][12])) throw new Error('La reunión no existe o ya está marcada para borrado.');
    hoja.getRange(idx + 2, 13).setValue(true);
    SpreadsheetApp.flush();
    bb_publicarTrasCambio_();
    return {ok:true, id:id, mensaje:'Reunión marcada para borrado. Ya no aparece en el calendario.'};
  });
}

/** Extiende la pestaña de la aplicación sin tocar las primeras 13 columnas ni crear archivos. */
function asegurarColumnaConvocatoria_(hoja) {
  const encabezado = String(hoja.getRange(1, 14).getDisplayValue() || '').trim();
  if (encabezado && encabezado !== 'Convocatoria_JSON') {
    throw new Error('La columna N está ocupada por "' + encabezado + '". No se sobrescribirá. Revisa la hoja.');
  }
  if (!encabezado) {
    hoja.getRange(1, 14).setValue('Convocatoria_JSON')
      .setBackground('#1973BE').setFontColor('#FFFFFF').setFontWeight('bold');
    hoja.getRange(2, 14, Math.max(1, hoja.getMaxRows()-1), 1).setNumberFormat('@');
    hoja.hideColumns(14);
  }
}

/** Columna independiente: guardarReunion solo escribe hasta la columna N. */
function asegurarColumnaCensoAsistencia_(hoja) {
  if (hoja.getMaxColumns() < 15) hoja.insertColumnsAfter(hoja.getMaxColumns(), 15 - hoja.getMaxColumns());
  const cab = String(hoja.getRange(1, 15).getDisplayValue() || '').trim();
  if (cab && cab !== 'Censo_asistencia_JSON')
    throw new Error('La columna O está ocupada por "' + cab + '". No se ha modificado la convocatoria.');
  if (!cab) {
    const n = hoja.getLastRow() - 1;
    if (n > 0 && hoja.getRange(2, 15, n, 1).getValues().some(function(r){return r[0] !== '' && r[0] !== null;}))
      throw new Error('La columna O contiene datos sin encabezado. Revisa la hoja antes de confirmar.');
    hoja.getRange(1, 15).setValue('Censo_asistencia_JSON')
      .setBackground('#1973BE').setFontColor('#FFFFFF').setFontWeight('bold');
    hoja.getRange(2, 15, Math.max(1, hoja.getMaxRows()-1), 1).setNumberFormat('@');
    hoja.hideColumns(15);
  }
}

/** Fotografía tomada al confirmar; no depende del estatus futuro. */
function crearCensoAsistencia_(reunionId, responsable) {
  const sh = SpreadsheetApp.openById(VOT_CONFIG.MIEMBROS_SHEET).getSheetByName('Miembros');
  if (!sh) throw new Error('No existe la pestaña Miembros; no se ha convocado la reunión.');
  const esperado = ['Nombre','Apellidos','Estatus','Correo','Fecha de union','Teléfono','ID_Miembro','Marcado_para_borrado'];
  const cab = sh.getRange(1,1,1,8).getDisplayValues()[0];
  if (esperado.some(function(x,i){return String(cab[i]||'').trim() !== x;}))
    throw new Error('Las cabeceras de Miembros no coinciden con el esquema esperado. Revisa la hoja antes de confirmar.');
  const n = sh.getLastRow()-1;
  const rows = n > 0 ? sh.getRange(2,1,n,8).getValues() : [];
  const ids = new Set();
  const roster = [];
  rows.forEach(function(r, i){
    const estado = vot_norm_(r[2]);
    if (marcado_(r[7]) || (estado !== 'full' && estado !== 'baby')) return;
    const id = String(r[6]||'').trim();
    const nombre = (String(r[0]||'').trim() + ' ' + String(r[1]||'').trim()).trim();
    if (!id || !nombre) throw new Error('Falta el ID o nombre de un Full/Baby en la fila '+(i+2)+' de Miembros.');
    if (ids.has(id)) throw new Error('ID de miembro duplicado en el censo: '+id+'.');
    ids.add(id);
    roster.push({id:id,nombre:nombre,estatus:estado === 'full' ? 'Full' : 'Baby'});
  });
  if (!roster.length) throw new Error('No hay Fulls ni Babies activos en Miembros. Revisa los datos antes de convocar.');
  const censo = {version:1,reunionId:reunionId,confirmadoPor:responsable,
    generado:new Date().toISOString(),roster:roster};
  if (JSON.stringify(censo).length > 45000) throw new Error('El censo es demasiado grande para guardarlo con seguridad.');
  return censo;
}

function diaAnterior_(fecha) {
  const d = new Date(fecha + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return Utilities.formatDate(d, 'GMT', 'yyyy-MM-dd');
}
const REU_PLANTILLA_PREDETERMINADA = "<p style=\"color:#c62828\"><strong>#INDICAR MOTIVO DE FALTA DE ASISTENCIA EN LA JUSTIFICACIÓN.</strong></p><p style=\"color:#c62828\"><strong>#DELEGAR VOTOS POR EL HILO DE LA VOTACIÓN, SI PROCEDE.</strong></p><p><strong>{{acta_anterior}}</strong></p><p><strong>{{acta_actual}}</strong></p><p>{{bigbrother}}</p><div style=\"text-align:center\"><h2 style=\"color:#073763\">{{saludo}}</h2><p>LA REU SERÁ EN</p><h2 style=\"color:#073763\">🦭 {{ubicacion}} 🦭</h2><p><strong>{{fecha_larga}} A LAS {{hora}}</strong></p><p>El orden del día será:</p><div style=\"text-align:center;margin:18px 0 1px\"><img src=\"https://cdn-icons-png.flaticon.com/512/890/890680.png\" alt=\"Puntos del día\" width=\"45\" height=\"45\" style=\"width:45px;height:45px\"><strong style=\"color:#FFD966;font-size:24px\"> Puntos del día </strong><img src=\"https://cdn-icons-png.flaticon.com/512/890/890680.png\" alt=\"Puntos del día\" width=\"45\" height=\"45\" style=\"width:45px;height:45px\"></div><div>{{puntos_dia}}</div><div style=\"text-align:center;margin:18px 0 1px\"><img src=\"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTi3xeFq8VhHuLQjIc7qYN_fJaj1Fe_8MqvQ&amp;s\" alt=\"Puntos de noche\" width=\"40\" height=\"40\" style=\"width:40px;height:40px\"><strong style=\"color:#0000FF;font-size:24px\"> Puntos de noche </strong><img src=\"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTi3xeFq8VhHuLQjIc7qYN_fJaj1Fe_8MqvQ&amp;s\" alt=\"Puntos de noche\" width=\"41\" height=\"41\" style=\"width:41px;height:41px\"></div><div style=\"text-align:center\"><small>a.k.a. fijos</small></div><div>{{puntos_noche}}</div></div><p>{{justificaciones}}</p><p>{{delegaciones}}</p>";

/** Editor limitado a HTML de correo inocuo. Sanitización repetida en servidor. */
function sanearPlantillaCorreo_(entrada) {
  const cadena = String(entrada || '');
  if (cadena.length > 38000) throw new Error('La plantilla supera el máximo de 38.000 caracteres.');
  const sinBloques = cadena.replace(/<!--[^]*?-->/g, '').replace(/<(script|style|iframe|object|svg|math|form|video|audio|template)[^>]*>[^]*?<\/\1\s*>/gi,'');
  const tags = ['div','p','span','strong','b','em','i','u','s','br','hr','h1','h2','h3','h4','small','ul','ol','li','blockquote','a','img','table','tbody','tr','td'];
  const cssOK = ['color','background-color','font-family','font-size','font-weight','font-style','text-decoration','text-align','line-height','margin','margin-top','margin-bottom','margin-left','margin-right','padding','padding-top','padding-bottom','vertical-align','height','width','border','border-collapse'];
  return sinBloques.replace(/<\/?[a-z][^>]*>/gi, function(etiqueta){
    const m = etiqueta.match(/^<(\/)?([a-z][\w-]*)/i);if(!m) return '';
    const nombre = m[2].toLowerCase();if(tags.indexOf(nombre) === -1) return '';
    if(m[1]) return '</'+nombre+'>';
    const attrs=[];let a;const re = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    while((a=re.exec(etiqueta))) {
      const k=a[1].toLowerCase(), valor=(a[2]==null?a[3]:a[2]).replace(/&amp;/g,'&');
      if(k==='style') {
        const limpio = valor.split(';').map(function(item){const idx=item.indexOf(':');if(idx<0)return '';const key=item.slice(0,idx).trim().toLowerCase(),val=item.slice(idx+1).trim();return cssOK.indexOf(key)>-1 && val.length<=90 && /^[#\w\s.,()%\/-]+$/.test(val) && !/expression|url|behavior|@import|\bposition\b/i.test(val) ? key+':'+val : '';}).filter(Boolean).join(';');
        if(limpio)attrs.push('style="'+htmlSeguro_(limpio)+'"');
      } else if(k==='href' && nombre==='a' && /^https:\/\//i.test(valor)) attrs.push('href="'+htmlSeguro_(valor)+'"');
      else if(k==='src' && nombre==='img' && /^https:\/\//i.test(valor))attrs.push('src="'+htmlSeguro_(valor)+'"');
      else if(['width','height'].indexOf(k)>-1 && nombre==='img' && /^\d{1,4}$/.test(valor))attrs.push(k+'="'+valor+'"');
      else if(k==='alt' && nombre==='img') attrs.push('alt="'+htmlSeguro_(valor.slice(0,120))+'"');
    }
    return '<'+nombre+(attrs.length?' '+attrs.join(' '):'')+'>';
  });
}

/** Plantilla individual: pestaña dedicada dentro del Sheets de Reuniones. */
function leerPlantillaUsuario_ (email) {
  const libro = SpreadsheetApp.openById(REU_CONFIG.SPREADSHEET_ID);
  const hoja = libro.getSheetByName(REU_CONFIG.PESTANA_PLANTILLAS);
  if(!hoja || hoja.getLastRow()<2) return {html:REU_PLANTILLA_PREDETERMINADA, personalizada:false};
  const datos=hoja.getRange(2,1,hoja.getLastRow()-1,2).getValues();
  const fila=datos.find(function(r){return String(r[0]).toLowerCase()===email;});
  return fila?{html:sanearPlantillaCorreo_(String(fila[1]||'')),personalizada:true}:{html:REU_PLANTILLA_PREDETERMINADA,personalizada:false};
}
function obtenerMiPlantillaCorreo() {
  bb_exigirSecretaria_();
  const email=requerirPruebas_();return leerPlantillaUsuario_(email);
}
function guardarMiPlantillaCorreo(html) {
  bb_exigirSecretaria_();
  const email=requerirPruebas_();const limpio=sanearPlantillaCorreo_(html);
  if(!limpio.trim())throw new Error('La plantilla está vacía.');
  return bajoBloqueo_(function(){
    const libro=SpreadsheetApp.openById(REU_CONFIG.SPREADSHEET_ID);
    let hoja=libro.getSheetByName(REU_CONFIG.PESTANA_PLANTILLAS);
    if(!hoja){hoja=libro.insertSheet(REU_CONFIG.PESTANA_PLANTILLAS);hoja.getRange(1,1,1,3).setValues([['Correo_usuario','Plantilla_HTML','Actualizado']]);hoja.setFrozenRows(1);hoja.getRange(1,1,1,3).setBackground('#1973BE').setFontColor('#ffffff').setFontWeight('bold');hoja.getRange('A:B').setNumberFormat('@');}
    const n=hoja.getLastRow()-1;
    const correos=n?hoja.getRange(2,1,n,1).getValues().map(function(x){return String(x[0]).toLowerCase();}):[];
    const idx=correos.indexOf(email); const fila=idx>=0?idx+2:hoja.getLastRow()+1;
    hoja.getRange(fila,1,1,3).setValues([[email,limpio,new Date()]]);
    return {ok:true,html:limpio,mensaje:'Plantilla personal guardada.'};
  });
}

function convocatoriaBase_(fecha) {
  return {
    saludo: '🌙 BUENAS NOCHES LBG 🌙',
    fechaLimite: diaAnterior_(fecha),
    horaLimite: '23:50'
  };
}
function normalizarConvocatoria_(valor, fecha) {
  let obj = valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
  const base = convocatoriaBase_(fecha);
  return {
    saludo: limitar_(obj.saludo == null ? base.saludo : obj.saludo, 180, 'Saludo del correo'),
    // Se omite la antigua introducción, incluso al leer reuniones previas.
    saludoHtml: obj.saludoHtml ? sanearPlantillaCorreo_(limitar_(obj.saludoHtml, 5000, 'Formato del saludo')) : '<strong>'+htmlSeguro_(obj.saludo == null ? base.saludo : obj.saludo)+'</strong>',
    fechaLimite: validarFecha_(obj.fechaLimite || base.fechaLimite),
    horaLimite: (/^([01]\d|2[0-3]):[0-5]\d$/).test(String(obj.horaLimite || base.horaLimite)) ? String(obj.horaLimite || base.horaLimite) : (function(){throw new Error('La hora límite del correo no es válida.');})(),
    plantillaHtml: obj.plantillaHtml ? sanearPlantillaCorreo_(String(obj.plantillaHtml)) : '',
    online: obj.online === true
  };
}
function leerConvocatoria_(celda, fecha) {
  let data = {};
  if (celda) {
    try { data = JSON.parse(String(celda)); } catch (err) { data = {}; }
  }
  return normalizarConvocatoria_(data, fecha);
}
function urlHTTPS_(valor, nombre, obligatoria) {
  const url = limitar_(valor, 1300, nombre);
  if (!url && !obligatoria) return '';
  if (!/^https:\/\/[a-z\d.-]+(?:[:/]\S*)?$/i.test(url)) throw new Error(nombre + ': utiliza una URL https:// válida.');
  return url;
}
function urlActa_(valor, nombre, obligatoria) {
  const url = urlHTTPS_(valor, nombre, obligatoria);
  if ((!url && obligatoria) || (url && !/^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z\d_-]+(?:[/?#].*)?$/.test(url))) {
    throw new Error(nombre + ': añade un enlace real de Google Docs.');
  }
  return url;
}

/** El borrador solo aparece en Gmail de quien ejecuta. DESTINO FIJO = usuario actual. */
function crearBorradorConvocatoria(idReunion) {
  bb_exigirSecretaria_();
  const email = requerirPruebas_();
  const id = String(idReunion || '').trim();
  if (!/^reu_[\w-]{15,60}$/.test(id)) throw new Error('Selecciona primero una reunión guardada.');
  const reuniones = leerReuniones_();
  const reu = reuniones.find(function (r) { return r.id === id && !r.marcado; });
  if (!reu) throw new Error('No se encuentra esta reunión en Sheets. Guarda primero y actualiza el calendario.');
  const anterior = reunionAnteriorCronologica_(reuniones,reu.fecha,reu.hora,reu.id);
  if (anterior) reu.fechaAnterior = anterior.fecha;
  reu.linkActa = urlActa_(reu.linkActa, 'Acta de la reunión convocada', true);
  // Última comprobación contra Sheets: si el acta previa se generó después de
  // guardar esta reunión, el borrador utilizará su enlace más reciente.
  reu.linkActaAnterior = urlActa_(reu.linkActaAnterior || (anterior ? anterior.linkActa : ''),
    'Acta anterior', true);
  if (!reu.lugar) reu.lugar = 'Por determinar';
  if (!reu.puntosDia.length) throw new Error('Completa los puntos del día antes de generar el correo.');
  // Releer desde la hoja deliberadamente: se usa siempre la última versión guardada.
  const correo = componerConvocatoria_(reu);
  // NUNCA usamos el grupo observers@ ni enviamos mensajes. Solo borrador para pruebas.
  const conImagenes = prepararImagenesCorreo_(correo.html);
  GmailApp.createDraft(email, reu.titulo, correo.texto, {htmlBody: codificarEmojisHtml_(conImagenes.html), inlineImages: conImagenes.inlineImages});
  return {ok: true, destinatario: email, asunto: reu.titulo,
    mensaje: 'Borrador creado en tu Gmail, dirigido a ti mismo. NO se ha enviado ningún correo.',
    urlBorradores: 'https://mail.google.com/mail/u/0/#drafts'};
}
function htmlSeguro_(valor) {
  return String(valor == null ? '' : valor).replace(/&/g,'&amp;')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function lineasHTML_(valor) { return htmlSeguro_(valor).replace(/\n/g,'<br>'); }
function diaEnEspanol_(fecha) {
  const [y,m,d] = fecha.split('-').map(Number);
  const nombres = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  return nombres[new Date(Date.UTC(y,m-1,d,12)).getUTCDay()];
}
function zonaEspana_(fecha, hora) {
  // 12:00 UTC evita ambigüedad horaria en el cambio CET/CEST.
  return Utilities.formatDate(new Date(fecha+'T12:00:00Z'), 'Europe/Madrid', 'z');
}
function componerConvocatoria_(r) {
  const c = r.convocatoria || convocatoriaBase_(r.fecha);
  const fechaTexto = r.fecha.split('-').reverse().join('/');
  const dia = diaEnEspanol_(r.fecha);
  const fechaLimite = c.fechaLimite.split('-').reverse().join('/');
  const zona = zonaEspana_(c.fechaLimite,c.horaLimite);
  const plazoDia = diaEnEspanol_(c.fechaLimite);
  const horas = c.horaLimite+' h ('+zona+')';
  const antFecha = r.fechaAnterior ? ' '+r.fechaAnterior.split('-').reverse().join('/') : '';
  const mensajeAusencias = 'Recordad, miembros Full y Baby, que debéis justificar la falta de asistencia respondiendo a este hilo, por privado, antes del '+plazoDia+' ('+fechaLimite+') a las '+horas+', mencionando brevemente el motivo de la ausencia.';
  const mensajeDelegacion = 'Asimismo, si procede una votación, los convocados que no puedan asistir deberán delegar su voto por el hilo de correo de la votación antes de ese mismo plazo.';
  const enlazar = function(url,nombre){return '<a href="'+htmlSeguro_(url)+'"><strong>'+htmlSeguro_(nombre)+'</strong></a>';};
  const puntosDia = r.puntosDia.filter(function(x){return String(x||'').trim();});
  const puntosNoche = r.puntosNoche.filter(function(x){return x && x.convocatoria;});
  const cambios = {
    '{{saludo}}':c.saludoHtml || htmlSeguro_(c.saludo||''), '{{introduccion}}':'',
    '{{ubicacion}}':htmlSeguro_(r.lugar||'Por determinar'),
    '{{fecha}}':htmlSeguro_(fechaTexto), '{{fecha_larga}}':htmlSeguro_(dia.toUpperCase()+' '+fechaTexto),
    '{{dia_semana}}':htmlSeguro_(dia),
    '{{hora}}':htmlSeguro_(r.hora),
    '{{acta_anterior}}':enlazar(r.linkActaAnterior,'#ACTA DE LA REUNIÓN ANTERIOR'+antFecha),
    '{{acta_actual}}':enlazar(r.linkActa,'#ACTA DE LA REUNIÓN CONVOCADA '+fechaTexto),
    '{{bigbrother}}':'<strong>BigBrother:</strong> enlace para consultar el estado de la asistencia a reuniones y participación en votaciones.',
    '{{puntos_dia}}':puntosDia.map(function(p){return '<div><strong>'+htmlSeguro_(p)+'</strong></div>';}).join(''),
    '{{puntos_noche}}':puntosNoche.map(function(p){return '<div><strong>'+htmlSeguro_(p.convocatoria)+'</strong></div>';}).join(''),
    '{{justificaciones}}':htmlSeguro_(mensajeAusencias),
    '{{delegaciones}}':htmlSeguro_(mensajeDelegacion)
  };
  let html=sanearPlantillaCorreo_(c.plantillaHtml || REU_PLANTILLA_PREDETERMINADA);
  // Limpieza de bloques vacíos heredados de plantillas antiguas.
  html=html.replace(/<p(?:\s[^>]*)?>\s*\{\{introduccion\}\}\s*<\/p>/gi,'');
  Object.keys(cambios).forEach(function(token){html=html.split(token).join(cambios[token]);});
  const texto=html.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(p|div|h[1-4]|li)>/gi,'\n').replace(/<[^>]*>/g,'')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
  return {html:'<div style="font-family:Verdana,Arial,sans-serif;font-size:13px;line-height:1.55">'+html+'</div>', texto:texto};
}


/** HTML con referencias Unicode numéricas: evita que el borrador malinterprete
 * pares sustitutos de emojis; la fuente final depende del cliente Gmail. */
function codificarEmojisHtml_(html) {
  return String(html).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(par){
    const cp=0x10000+((par.charCodeAt(0)-0xD800)<<10)+(par.charCodeAt(1)-0xDC00);
    return '&#'+cp+';';
  });
}

/** Mantiene las imágenes originales tal cual. Las fotos NUEVAS que Secretaría
 * inserte por URL se descargan como blobs y se adjuntan en línea (cid).
 * Una URL de página web no sirve como imagen: debe devolver PNG, JPG o GIF. */
function prepararImagenesCorreo_(html) {
  const especiales=[REU_IMAGENES_CORREO.sol,REU_IMAGENES_CORREO.luna,REU_IMAGENES_CORREO.firma];
  const inlineImages={};
  const cache={};
  let cantidad=0;
  const resultado=String(html).replace(/(<img\b[^>]*?\bsrc\s*=\s*)(["'])([^"']+)\2/gi,function(fragmento, prefijo, comilla, src){
    const url=src.replace(/&amp;/gi,'&');
    if(especiales.indexOf(url)!==-1) return fragmento;
    if(!/^https:\/\/([a-z\d-]+\.)+[a-z]{2,}(?::443)?\/[\S]*$/i.test(url)) {
      throw new Error('Una imagen no tiene una URL directa HTTPS pública. No sirve un enlace a una página web (por ejemplo, una ficha de emojis).');
    }
    if(!cache[url]) {
      cantidad++;
      if(cantidad>8)throw new Error('Máximo 8 imágenes personales por convocatoria.');
      let respuesta;
      try {respuesta=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true,validateHttpsCertificates:true});}
      catch(err){throw new Error('No puedo descargar una imagen. Revisa que la URL sea pública y directa a un archivo.');}
      if(respuesta.getResponseCode()!==200)throw new Error('Una imagen por URL no se puede descargar (HTTP '+respuesta.getResponseCode()+'). Usa una dirección pública directa a PNG, JPG o GIF.');
      const bytes=respuesta.getContent();
      if(bytes.length>2*1024*1024)throw new Error('Una imagen pesa más de 2 MB. Reduce su tamaño antes de añadirla.');
      const cabeceras=respuesta.getHeaders();
      const mime=String(cabeceras['Content-Type']||cabeceras['content-type']||respuesta.getBlob().getContentType()||'').split(';')[0].toLowerCase();
      if(['image/png','image/jpeg','image/gif'].indexOf(mime)<0)throw new Error('El enlace no devuelve una imagen compatible. Se admiten PNG, JPG y GIF públicos (no páginas web ni WebP).');
      const cid='bbcorreo'+cantidad;
      const ext=mime==='image/png'?'png':mime==='image/gif'?'gif':'jpg';
      inlineImages[cid]=Utilities.newBlob(bytes,mime,'imagen_convocatoria_'+cantidad+'.'+ext);
      cache[url]=cid;
    }
    return prefijo+comilla+'cid:'+cache[url]+comilla;
  });
  return {html:resultado,inlineImages:inlineImages};
}

/** Lectura limitada a cuentas corporativas. La edición necesita además el grupo. */
function requerirCuentaDominio_() {
  const email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(!email || !email.endsWith('@'+REU_CONFIG.DOMINIO))
    throw new Error('Accede con una cuenta @'+REU_CONFIG.DOMINIO+'.');
  return email;
}
function puedeGestionarReuniones_(email) {
  return bb_esSecretaria_(email);
}
function requerirPruebas_() {
  return bb_exigirSecretaria_();
}

function abrirHojaReuniones_() {
  let archivo;
  try { archivo = SpreadsheetApp.openById(REU_CONFIG.SPREADSHEET_ID); }
  catch (err) { throw new Error('No tienes acceso al Google Sheet de Reuniones configurado. Comprueba el ID, que es una hoja nativa y los permisos en Drive.'); }
  const hoja = archivo.getSheetByName(REU_CONFIG.PESTANA);
  validarEsquema_(hoja);
  return hoja;
}

function validarEsquema_(hoja) {
  if (!hoja) throw new Error('No existe la pestaña "' + REU_CONFIG.PESTANA + '".');
  const cabeceras = hoja.getRange(1, 1, 1, REU_CONFIG.COLUMNAS.length).getDisplayValues()[0];
  REU_CONFIG.COLUMNAS.forEach(function (h, i) {
    if (String(cabeceras[i] || '').trim() !== h) {
      throw new Error('La columna ' + (i + 1) + ' debe llamarse "' + h + '". No cambies el esquema técnico.');
    }
  });
}

function leerReuniones_() {
  const hoja = abrirHojaReuniones_();
  const n = hoja.getLastRow() - 1;
  if (n <= 0) return [];
  const zona = hoja.getParent().getSpreadsheetTimeZone();
  const hayConvocatoria = hoja.getRange(1, 14).getDisplayValue().trim() === 'Convocatoria_JSON';
  return hoja.getRange(2, 1, n, hayConvocatoria ? 14 : REU_CONFIG.COLUMNAS.length).getValues()
    .map(function (row, i) {
      if (!String(row[0] || '').trim()) return null;
      // Google Sheets puede devolver la fecha como texto ISO o como objeto Date
      // según el formato de columna. Convertirla con String(Date) rompe el filtro
      // por curso y hace desaparecer las reuniones después de recargar.
      const fecha = normalizarFechaHoja_(row[1], zona, i + 2);
      const hora = normalizarHoraHoja_(row[2], zona, i + 2);
      return {
        id: String(row[0] || ''), fecha: fecha,
        hora: hora, titulo: tituloVisible_(row[3], fecha),
        lugar: String(row[4] || ''), estado: String(row[5] || '').trim()==='Convocada' ? 'Convocada' : 'Borrador',
        puntosDia: parseLista_(row[6]), puntosNoche: parseLista_(row[7]),
        linkActa: String(row[8] || ''), linkActaAnterior: String(row[9] || ''),
        convocatoria: leerConvocatoria_(row[13], fecha),
        marcado: marcado_(row[12])
      };
    }).filter(Boolean);
}

/** Admite tanto fechas reales de Sheets como ISO y formatos de fecha españoles. */
function normalizarFechaHoja_(valor, zona, fila) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, zona, 'yyyy-MM-dd');
  }
  if (typeof valor === 'number' && Number.isFinite(valor) && valor >= 20000 && valor <= 80000) {
    // Por compatibilidad con filas importadas que guardan el número de serie.
    const fechaSerial = new Date(Date.UTC(1899, 11, 30) + Math.round(valor) * 86400000);
    return fechaSerial.toISOString().slice(0, 10);
  }
  const raw = String(valor == null ? '' : valor).trim();
  let m = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
  let iso;
  if (m) {
    iso = m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  } else {
    m = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+.*)?$/);
    if (m) iso = m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  }
  if (iso) {
    try { return validarFecha_(iso); } catch (err) { /* Mostrar fila concreta abajo. */ }
  }
  throw new Error('Fecha no reconocida en la fila ' + fila + ' de Reuniones (' + raw + '). Revisa su formato en Sheets; no se ha borrado nada.');
}

/** Evita mostrar fechas de 1899 cuando una hora se autoformatea en Google Sheets. */
function normalizarHoraHoja_(valor, zona, fila) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, zona, 'HH:mm');
  }
  if (typeof valor === 'number' && valor >= 0 && valor < 1) {
    const minutos = Math.round(valor * 1440) % 1440;
    return String(Math.floor(minutos / 60)).padStart(2, '0') + ':' + String(minutos % 60).padStart(2, '0');
  }
  const s = String(valor == null ? '' : valor).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m && +m[1] <= 23 && +m[2] <= 59) return m[1].padStart(2, '0') + ':' + m[2];
  if (!s) return ''; // Compatibilidad con reuniones antiguas sin hora.
  throw new Error('Hora no reconocida en la fila ' + fila + ' de Reuniones (' + s + '). Revisa su formato en Sheets.');
}

function validarReunion_(datos) {
  if (!datos || typeof datos !== 'object') throw new Error('Datos de reunión no válidos.');
  const fecha = validarFecha_(datos.fecha);
  const hora = String(datos.hora || '').trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) throw new Error('Indica una hora válida.');
  const titulo = limitar_(datos.titulo || tituloEstandar_(fecha), 160, 'Título');
  const lugar = limitar_(datos.lugar || '', 240, 'Lugar / enlace');
  const id = String(datos.id || '').trim();
  if (id && !/^reu_[\w-]{15,60}$/.test(id)) throw new Error('Identificador de reunión inválido.');
  if (!Array.isArray(datos.puntosDia) || datos.puntosDia.length > 40) throw new Error('Revisa los puntos del día.');
  if (!Array.isArray(datos.puntosNoche) || datos.puntosNoche.length > 20) throw new Error('Revisa los puntos de noche.');
  const puntosDia = datos.puntosDia.map(function (p) { return limitar_(p, 300, 'Punto del día'); }).filter(Boolean);
  const puntosNoche = datos.puntosNoche.map(function (p) {
    if (!p || typeof p !== 'object') throw new Error('Punto de noche inválido.');
    if (!Array.isArray(p.apartados) || p.apartados.length > 20) throw new Error('Demasiados subapartados.');
    return {
      titulo: limitar_(p.titulo, 150, 'Sección de noche'),
      convocatoria: limitar_(p.convocatoria, 220, 'Abreviatura de convocatoria'),
      apartados: p.apartados.map(function (x) { return limitar_(x, 150, 'Subapartado'); }).filter(Boolean)
    };
  });
  if (puntosNoche.some(function (p) { return !p.titulo || !p.convocatoria; })) {
    throw new Error('Completa el nombre y el texto de convocatoria de cada sección de noche.');
  }
  return { id: id, fecha: fecha, hora: hora, titulo: titulo,
    lugar: lugar, puntosDia: puntosDia, puntosNoche: puntosNoche,
    linkActa: urlActa_(datos.linkActa || '', 'Acta de la reunión convocada', false),
    linkActaAnterior: urlActa_(datos.linkActaAnterior || '', 'Acta anterior', false),
    convocatoria: normalizarConvocatoria_(datos.convocatoria, fecha) }; 
}

/** Asunto predeterminado del correo y título de la tarjeta (siempre editable). */
function tituloEstandar_(fecha) {
  const partes = String(fecha || '').split('-');
  return '[Secretaría][Agenda] Reunión semanal ' + partes[2] + '/' + partes[1] + '/' + partes[0];
}

/** No altera el histórico: interpreta el antiguo título genérico al leerlo. */
function tituloVisible_(titulo, fecha) {
  const original = String(titulo || '').trim();
  if (!original || original === 'Weekly Meeting') return tituloEstandar_(String(fecha || ''));
  return original;
}

function validarFecha_(fecha) {
  const s = String(fecha || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Indica una fecha válida.');
  const [y, m, d] = s.split('-').map(Number);
  const dia = new Date(Date.UTC(y, m - 1, d));
  if (dia.getUTCFullYear() !== y || dia.getUTCMonth() !== m - 1 || dia.getUTCDate() !== d) {
    throw new Error('La fecha no existe.');
  }
  if (y < 2020 || y > 2100) throw new Error('La fecha está fuera del intervalo permitido.');
  return s;
}

function validarAnioCurso_(anio) {
  const n = Number(anio);
  if (!Number.isInteger(n) || n < 2020 || n > 2099) throw new Error('Curso no válido.');
  return n;
}

function limitar_(valor, maximo, nombre) {
  const s = String(valor == null ? '' : valor).trim();
  if (s.length > maximo) throw new Error(nombre + ' supera los ' + maximo + ' caracteres.');
  return s;
}

function parseLista_(valor) {
  try { const data = JSON.parse(String(valor || '[]')); return Array.isArray(data) ? data : []; }
  catch (err) { return []; }
}
function textoParaHoja_(valor) {
  const s = String(valor || '');
  return /^[\s]*[=+@-]/.test(s) ? "'" + s : s;
}
function marcado_(valor) { return valor === true || String(valor).trim().toUpperCase() === 'TRUE'; }
function bajoBloqueo_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ================================================================
 * Big Brother · Votaciones + Election Runner v0.7.1 · módulo dentro Reuniones
 * Únicamente CONVOCATORIAS. No recibe, cuenta ni guarda votos.
 * Usa pestaña Votaciones del Sheet propio; Miembros se consulta
 * del Sheet central exclusivamente en modo lectura.
 * ================================================================ */
const VOT_CONFIG = Object.freeze({
  PESTANA:'Votaciones',
  MIEMBROS_SHEET:'1IZxJW6VMdmBzICjVOCEQXpe7hHu7oTcKc3tVMEp0yPY',
  CABECERAS:['ID_votacion','Fecha','Asunto','Tipo','Subtipo','Estado','Configuracion_JSON','Actualizado','Actualizado_por','Marcado_para_borrado'],
  ASUNTO_PREFIJO:'[Secretaría] [Votación]',
  CONDICION_ELECCION_SIMPLE:'Mitad más uno de los votos a un candidato.'
});

function vot_hoja_(crear) {
  const ss=SpreadsheetApp.openById(REU_CONFIG.SPREADSHEET_ID);
  let sh=ss.getSheetByName(VOT_CONFIG.PESTANA);
  if(!sh && crear){
    sh=ss.insertSheet(VOT_CONFIG.PESTANA);
    sh.getRange(1,1,1,VOT_CONFIG.CABECERAS.length).setValues([VOT_CONFIG.CABECERAS]);
    sh.getRange(1,1,1,VOT_CONFIG.CABECERAS.length).setBackground('#1973BE').setFontColor('#FFFFFF').setFontWeight('bold');
    sh.setFrozenRows(1);sh.getRange('A:G').setNumberFormat('@');
    sh.hideColumns(1);sh.hideColumns(10);
  }
  if(!sh)return null;
  const cab=sh.getRange(1,1,1,VOT_CONFIG.CABECERAS.length).getDisplayValues()[0];
  if(VOT_CONFIG.CABECERAS.some(function(t,i){return cab[i]!==t;}))throw new Error('La pestaña Votaciones no tiene las cabeceras previstas. No se ha modificado.');
  return sh;
}
function prepararModuloVotaciones(){
  bb_exigirSecretaria_();requerirPruebas_();return bajoBloqueo_(function(){vot_hoja_(true);return {ok:true,mensaje:'Pestaña Votaciones lista en el mismo archivo de Reuniones.'};});}
function vot_leer_(){
  const sh=vot_hoja_(false);if(!sh || sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,10).getValues().map(function(r,i){
    if(!r[0])return null;
    const zona=sh.getParent().getSpreadsheetTimeZone();
    let data={};try{data=JSON.parse(String(r[6]||'{}'));}catch(err){}
    return {id:String(r[0]),fecha:normalizarFechaHoja_(r[1],zona,i+2),asunto:String(r[2]||''),tipo:String(r[3]||'simple'),subtipo:String(r[4]||'cargos'),estado:String(r[5])==='Confirmada'?'Confirmada':'Borrador',config:data,marcado:marcado_(r[9]),fila:i+2};
  }).filter(Boolean);
}
function listarVotacionesCurso(anioInicio){
  bb_exigirSecretaria_();
  const email=requerirCuentaDominio_(),manager=puedeGestionarReuniones_(email),anio=validarAnioCurso_(anioInicio);
  const vot=vot_leer_().filter(function(v){return !v.marcado && v.fecha>=anio+'-09-01'&&v.fecha<=(anio+1)+'-08-31'&&(manager||v.estado==='Confirmada');});
  const todasReuniones=leerReuniones_();
  const meetingMap={};todasReuniones.forEach(function(r){meetingMap[r.id]=r;});
  // El calendario de Votaciones solo muestra referencias públicas a reuniones
  // confirmadas y no marcadas, sin devolver agenda, actas ni borradores.
  const reunionesVisibles=todasReuniones.filter(function(r){
    return !r.marcado&&r.estado==='Convocada'&&r.fecha>=anio+'-09-01'&&r.fecha<=(anio+1)+'-08-31';
  }).map(function(r){return {id:r.id,fecha:r.fecha,hora:r.hora,titulo:r.titulo};});
  return {usuario:email,puedeGestionar:manager,reuniones:reunionesVisibles,votaciones:vot.map(function(v){
    const linked=meetingMap[String(v.config.reunionId||'')];
    const advertencia=!!(linked&&linked.marcado);
    return manager?{id:v.id,fecha:v.fecha,asunto:v.asunto,subtipo:v.subtipo,estado:v.estado,config:v.config,reunionMarcada:advertencia}:
      {id:v.id,fecha:v.fecha,asunto:v.asunto,subtipo:v.subtipo,estado:v.estado,reunionMarcada:advertencia};
  })};
}
/** Búsqueda libre por nombre: no enviamos a la UI una lista completa desplegable. */
function vot_miembros_(){
  const sh=SpreadsheetApp.openById(VOT_CONFIG.MIEMBROS_SHEET).getSheetByName('Miembros');
  if(!sh)throw new Error('No existe la pestaña Miembros en la hoja central.');
  const n=sh.getLastRow()-1;if(n<1)return [];
  return sh.getRange(2,1,n,8).getValues().filter(function(r){return !!String(r[6]||'').trim()&&!marcado_(r[7]);}).map(function(r){
    return {id:String(r[6]).trim(),nombre:(String(r[0]||'').trim()+' '+String(r[1]||'').trim()).trim(),estatus:String(r[2]||'').trim(),email:String(r[3]||'').trim()};
  });
}
function vot_norm_(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function buscarMiembrosVotacion(texto){
  bb_exigirSecretaria_();
  requerirPruebas_();const q=vot_norm_(texto);
  if(q.length<2)return [];
  return vot_miembros_().filter(function(m){return vot_norm_(m.nombre).includes(q);}).slice(0,12);
}
function vot_quorum_(n,modo){return modo==='dosTercios'?Math.ceil(n*2/3):Math.ceil(n/2)+1;}
/** Permite asuntos antiguos sin prefijo y evita duplicarlo si Secretaría ya lo ha escrito. */
function vot_asuntoCorreo_(asunto){
  const texto=String(asunto||'').trim();
  return /^\[Secretar[ií]a\]\s*\[Votaci[oó]n\]/i.test(texto) ? texto : VOT_CONFIG.ASUNTO_PREFIJO+' '+texto;
}

/** Únicas transiciones admitidas para propuestas de cambio. No modifica la tabla Miembros. */
const VOT_TRANSICIONES_ESTATUS = Object.freeze({
  observer:['Baby','Inactive'],
  baby:['Full','Alumni','Inactive'],
  full:['Alumni','Inactive'],
  alumni:['Baby','Inactive'],
  guest:['Observer','Inactive'],
  inactive:['Observer'],
  'granizado de pleno derecho':['Full','Inactive','Alumni'],
  'granizado simple':['Baby','Inactive','Alumni']
});
function vot_estatusCanon_(nombre){
  const n=vot_norm_(nombre);
  const nombres={observer:'Observer',baby:'Baby',full:'Full',alumni:'Alumni',guest:'Guest',inactive:'Inactive',
    'granizado de pleno derecho':'Granizado de pleno derecho','granizado simple':'Granizado simple'};
  return nombres[n]||null;
}
function vot_requiereReport_(origen,destino){
  return (origen==='Observer'&&destino==='Baby') || (origen==='Baby'&&destino==='Full') ||
    (destino==='Inactive'&&['Observer','Baby','Full','Alumni'].includes(origen));
}
/** Esta modalidad usa exclusivamente Full, mitad más uno y reglas institucionales fijas. */
function vot_validarEstatus_(entrada){
  const fecha=validarFecha_(entrada.fecha),fechaReunion=entrada.fechaReunion?validarFecha_(entrada.fechaReunion):fecha;
  const asunto=limitar_(entrada.asunto,180,'Asunto');
  if(!asunto.replace(/^\[Secretar[ií]a\]\s*\[Votaci[oó]n\]\s*/i,'').trim())throw new Error('Completa el asunto de la votación.');
  const dlFecha=validarFecha_(entrada.dlFecha),dlHora=limitar_(entrada.dlHora,5,'Hora límite');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(dlHora))throw new Error('Hora límite de delegación incorrecta.');
  const lista=Array.isArray(entrada.cambios)?entrada.cambios:[];
  if(!lista.length||lista.length>60)throw new Error('Indica entre 1 y 60 propuestas de cambio de estatus.');
  const miembros=vot_miembros_(),porId={};miembros.forEach(function(m){porId[m.id]=m;});
  const vistos=new Set();
  const cambios=lista.map(function(item,i){
    const id=String(item.miembroId||'').trim(),m=porId[id];
    if(!m)throw new Error('Cambio '+(i+1)+': selecciona una persona registrada en Miembros.');
    if(vistos.has(id))throw new Error(m.nombre+' aparece dos veces. Una persona solo puede tener una propuesta por convocatoria.');
    vistos.add(id);
    const origen=vot_estatusCanon_(m.estatus),destino=vot_estatusCanon_(item.destino);
    if(!origen||!destino||!VOT_TRANSICIONES_ESTATUS[vot_norm_(origen)]||!VOT_TRANSICIONES_ESTATUS[vot_norm_(origen)].includes(destino)){
      throw new Error('Transición no permitida para '+m.nombre+': '+m.estatus+' → '+String(item.destino||'')+'.');
    }
    const requiereReport=vot_requiereReport_(origen,destino);
    const reportUrl=urlHTTPS_(item.reportUrl||'','Report de '+m.nombre,requiereReport);
    if(requiereReport&&!reportUrl)throw new Error('Añade el report obligatorio de '+m.nombre+' ('+origen+' → '+destino+').');
    return {miembroId:id,nombre:m.nombre,origen:origen,destino:destino,reportUrl:reportUrl};
  });
  const inactivos=cambios.filter(function(x){return x.destino==='Inactive';});
  const motivoRRI=limitar_(entrada.motivoRRI||'',3000,'Motivo de incumplimiento del RRI');
  if(inactivos.length&&motivoRRI.length<10)throw new Error('Completa el motivo de «Incumplimiento del RRI» para los cambios a Inactive (mínimo 10 caracteres).');
  return {fecha:fecha,fechaReunion:fechaReunion,asunto:asunto,tipo:'completa',subtipo:'estatus',quorum:'mitad',
    incluirBabies:false,extras:[],extrasInfo:[],cuestiones:[],cambios:cambios,motivoRRI:motivoRRI,
    dlFecha:dlFecha,dlHora:dlHora,dlPregFecha:'',dlPregHora:'',formActivo:false,mlActivo:false,linkML:'',linkForm:'',
    condicionEleccion:VOT_CONFIG.CONDICION_ELECCION_SIMPLE,textoLibreHtml:'',miembros:miembros};
}

function vot_validar_(entrada){
  if(!entrada || typeof entrada!=='object')throw new Error('No se han recibido los datos de la votación.');
  if(entrada.tipo==='completa' && entrada.subtipo==='estatus'){const v=vot_validarEstatus_(entrada);v.online=entrada.online===true;return v;}
  if(entrada.tipo==='otra'){const v=vot_validarOtra_(entrada);v.online=entrada.online===true;return v;}
  const fecha=validarFecha_(entrada.fecha);
  const asunto=limitar_(entrada.asunto,180,'Asunto');
  const detalleAsunto=asunto.replace(/^\[Secretar[ií]a\]\s*\[Votaci[oó]n\]\s*/i,'').trim();
  if(!detalleAsunto)throw new Error('Añade al asunto qué se vota, además de [Secretaría] [Votación].');
  if(entrada.tipo!=='simple')throw new Error('En esta primera versión solamente se pueden crear votaciones simples.');
  const subtipo=String(entrada.subtipo||'cargos');if(!['cargos','propuestas'].includes(subtipo))throw new Error('Subtipo no válido.');
  const quorum=entrada.quorum==='dosTercios'?'dosTercios':'mitad';
  const grupos=!!entrada.incluirBabies;
  const fechaReunion=entrada.fechaReunion?validarFecha_(entrada.fechaReunion):fecha;
  const dlFecha=validarFecha_(entrada.dlFecha);
  const dlHora=limitar_(entrada.dlHora,5,'Hora límite');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(dlHora))throw new Error('Hora límite incorrecta.');
  const formActivo=entrada.formActivo!==false;
  // Solo hay DL de preguntas si Secretaría ha incluido el formulario.
  // Si no la ha configurado todavía, usar el día anterior al calendario, a las 23:50.
  const diaAnterior=Utilities.formatDate(new Date(Date.UTC(Number(fecha.slice(0,4)),Number(fecha.slice(5,7))-1,Number(fecha.slice(8,10))-1,12)), 'UTC','yyyy-MM-dd');
  const pregFecha=formActivo&&entrada.dlPregFecha?validarFecha_(entrada.dlPregFecha):diaAnterior;
  const pregHora=formActivo?String(entrada.dlPregHora||'23:50'):'23:50';
  if(formActivo&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(pregHora))throw new Error('Hora límite de preguntas incorrecta.');
  const cuestiones=Array.isArray(entrada.cuestiones)?entrada.cuestiones:[];
  if(!cuestiones.length || cuestiones.length>25)throw new Error('Añade entre 1 y 25 votaciones dentro de esta convocatoria.');
  const validas=cuestiones.map(function(c,i){
    const pregunta=limitar_(c.pregunta,180,'Pregunta '+(i+1));if(!pregunta)throw new Error('Falta el cargo o asunto de la pregunta '+(i+1)+'.');
    const opciones=Array.isArray(c.opciones)?c.opciones:[];
    if(!opciones.length||opciones.length>20)throw new Error('La pregunta '+(i+1)+' necesita opciones (máximo 20).');
    const arr=opciones.map(function(o){
      const texto=limitar_(o.texto,150,'Opción');if(!texto||vot_norm_(texto)==='blanco')throw new Error('No dejes opciones vacías ni añadas Blanco (se añade automáticamente).');
      return {texto:texto,miembroId:subtipo==='cargos'?String(o.miembroId||'').trim():''};
    });
    if(new Set(arr.map(function(o){return vot_norm_(o.texto);})).size!==arr.length)throw new Error('Hay opciones duplicadas en '+pregunta+'.');
    return {pregunta:pregunta,opciones:arr};
  });
  const extra=Array.isArray(entrada.extras)?entrada.extras.map(String):[];
  if(extra.length>60)throw new Error('Demasiados convocados adicionales.');
  const miembros=vot_miembros_(),porId={};miembros.forEach(function(m){porId[m.id]=m;});
  extra.forEach(function(id){if(!porId[id])throw new Error('Un convocado adicional ya no existe en la tabla Miembros. Elimínalo y vuelve a buscarlo.');});
  validas.forEach(function(c){c.opciones.forEach(function(o){
    if(subtipo==='cargos'){
      if(!o.miembroId||!porId[o.miembroId])throw new Error('Los candidatos a cargos deben seleccionarse mediante la búsqueda de Miembros.');
      // Jamás confiamos en el nombre que envía el navegador.
      o.texto=porId[o.miembroId].nombre;
    }
  });});
  const mlActivo=entrada.mlActivo!==false;
  const enlaceML=mlActivo?urlHTTPS_(entrada.linkML||'','Enlace a las ML',false):'';
  const enlaceForm=formActivo?urlHTTPS_(entrada.linkForm||'','Formulario de preguntas',false):'';
  // Las cláusulas de votaciones simples son institucionales: no se aceptan
  // cambios enviados desde HTML ni se reutilizan cláusulas editables antiguas.
  const elige=VOT_CONFIG.CONDICION_ELECCION_SIMPLE;
  const html=sanearPlantillaCorreo_(entrada.textoLibreHtml||'');
  const extrasInfo=Array.from(new Set(extra)).map(function(id){return porId[id];});
  return {fecha:fecha,fechaReunion:fechaReunion,asunto:asunto,tipo:'simple',subtipo:subtipo,quorum:quorum,incluirBabies:grupos,extras:Array.from(new Set(extra)),extrasInfo:extrasInfo,cuestiones:validas,
    dlFecha:dlFecha,dlHora:dlHora,dlPregFecha:pregFecha,dlPregHora:pregHora,formActivo:formActivo,mlActivo:mlActivo,linkML:enlaceML,linkForm:enlaceForm,
    condicionEleccion:elige,textoLibreHtml:html,online:entrada.online===true,miembros:miembros};
}
function vot_configGuardable_(v){const c=Object.assign({},v);delete c.miembros;return c;}
function guardarVotacionSimple(entrada){
  bb_exigirSecretaria_();
  const email=requerirPruebas_();const valid=vot_validar_(entrada);
  const reunionId=String(entrada.reunionId||'').trim();
  valid.reunionId=reunionId;
  const id=String(entrada.id||'').trim();
  return bajoBloqueo_(function(){
    const sh=vot_hoja_(true),data=vot_leer_(),old=id?data.find(function(v){return v.id===id&&!v.marcado;}):null;
    if(id&&!old)throw new Error('Votación no encontrada o marcada para borrado.');
    // Solo los vínculos NUEVOS necesitan ser futuros, confirmados y no marcados.
    // Una convocatoria existente conserva su vínculo aunque la fecha haya pasado
    // o la reunión haya sido marcada posteriormente para borrado.
    if(reunionId){
      if(!old||String(old.config.reunionId||'').trim()!==reunionId){
        bb_exigirReunionEnlazableNueva_(reunionId);
      }else{
        bb_reunionVinculada_(reunionId,false);
      }
    }
    if(old&&old.estado==='Confirmada'&&bb_delegacionesDeVoto_(id).length)throw new Error('Ya hay delegaciones registradas: no edites los electores de una votación confirmada. Pide a Secretaría que resuelva las delegaciones antes de modificarla.');
    const nuevoId=id||'vot_'+Utilities.getUuid();
    const config=vot_configGuardable_(valid);
    if(old&&old.estado==='Confirmada') {
      const anterior=old.config.exportCenso;
      if(!anterior||!Array.isArray(anterior.roster)) throw new Error('La votación confirmada no tiene censo congelado. Revisa la convocatoria antes de editarla.');
      const propuesto=vot_snapshot_(valid);
      const firma=function(c){return JSON.stringify(c.roster.map(function(m){return {id:m.id,preguntas:(m.preguntas||[]).slice().sort()};}).sort(function(a,b){return a.id.localeCompare(b.id);}));};
      if(firma(anterior)!==firma(propuesto)) throw new Error('Esta edición cambiaría el censo de una votación ya convocada. Conserva el censo original.');
      config.exportCenso=anterior;
    }
    const fila=[nuevoId,valid.fecha,textoParaHoja_(valid.asunto),valid.tipo,valid.subtipo,old?old.estado:'Borrador',JSON.stringify(config),new Date(),email,false];
    if(old)sh.getRange(old.fila,1,1,10).setValues([fila]);else sh.appendRow(fila);
    SpreadsheetApp.flush();bb_publicarTrasCambio_();
    return {ok:true,id:nuevoId,estado:old?old.estado:'Borrador',mensaje:old&&old.estado==='Confirmada'?'Cambios guardados. La votación sigue convocada y visible.':'Votación guardada como borrador. Aún no es visible en el calendario general.'};
  });
}
function confirmarVotacionSimple(id){
  bb_exigirSecretaria_();
  const email=requerirPruebas_();return bajoBloqueo_(function(){
    const sh=vot_hoja_(false),row=vot_leer_().find(function(v){return v.id===id&&!v.marcado;});
    if(!row)throw new Error('Primero guarda la votación.');
    if(row.estado==='Confirmada')return {ok:true,estado:'Confirmada',mensaje:'Ya estaba confirmada.'};
    const valid=vot_validar_(row.config); // Vuelve a comprobar elegibilidad antes de publicar.
    valid.reunionId=String(row.config.reunionId||'').trim();
    // Al confirmar, la reunión seleccionada debe seguir siendo enlazable.
    // Si una DL ha pasado desde que se preparó el borrador, hay que
    // desvincularlo o elegir otra reunión futura antes de confirmarlo.
    if(valid.reunionId)bb_exigirReunionEnlazableNueva_(valid.reunionId);
    const config=Object.assign({},vot_configGuardable_(valid),{exportCenso:vot_snapshot_(valid)});
    sh.getRange(row.fila,7).setValue(JSON.stringify(config));
    sh.getRange(row.fila,6).setValue('Confirmada');sh.getRange(row.fila,8,1,2).setValues([[new Date(),email]]);
    SpreadsheetApp.flush();bb_publicarTrasCambio_();
    return {ok:true,estado:'Confirmada',mensaje:'Votación confirmada y visible en el calendario general. No se ha enviado ningún correo.'};
  });
}
function borrarVotacionSimple(id){
  bb_exigirSecretaria_();requerirPruebas_();return bajoBloqueo_(function(){
  const sh=vot_hoja_(false),row=vot_leer_().find(function(v){return v.id===id&&!v.marcado;});
  if(!sh||!row)throw new Error('Votación no encontrada.');sh.getRange(row.fila,10).setValue(true);
  SpreadsheetApp.flush();bb_publicarTrasCambio_();
  return {ok:true,mensaje:'Votación marcada para borrado. No se ha eliminado la fila.'};
});}

function vot_fechaLarga_(iso,hora){
  const p=iso.split('-').map(Number),d=new Date(Date.UTC(p[0],p[1]-1,p[2],12));
  const dias=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return dias[d.getUTCDay()]+' '+p[2]+' de '+meses[p[1]-1]+' de '+p[0]+(hora?' a las '+hora:'');
}
function vot_fechaCorta_(iso){return iso.split('-').reverse().join('/');}
function vot_dia_(iso){return vot_fechaLarga_(iso,'').split(' ')[0];}
function vot_zona_(iso){const p=iso.split('-').map(Number),d=new Date(Date.UTC(p[0],p[1]-1,p[2],12));
  return Utilities.formatDate(d,'Europe/Madrid','Z')==='+0200'?'CEST':'CET';
}
function vot_resolverElectorado_(v){
  const ms=v.miembros||vot_miembros_(),porId={};ms.forEach(function(m){porId[m.id]=m;});
  const full=v.tipo==='otra'&&v.incluirFulls===false?[]:ms.filter(function(m){return vot_norm_(m.estatus)==='full';});
  const baby=v.incluirBabies?ms.filter(function(m){return vot_norm_(m.estatus)==='baby';}):[];
  const baseIds=new Set(full.concat(baby).map(function(m){return m.id;}));
  const extras=(v.extras||[]).map(function(id){return porId[id];}).filter(function(m){return m&&!baseIds.has(m.id);});
  const candidateIds=new Set();
  (v.cuestiones||[]).forEach(function(c){c.opciones.forEach(function(o){if(o.miembroId)candidateIds.add(o.miembroId);});});
  const candidates=Array.from(candidateIds).map(function(id){return porId[id];}).filter(function(m){return m&&!baseIds.has(m.id)&&!extras.some(function(e){return e.id===m.id;});});
  const all=full.concat(baby,extras,candidates);const seen=new Set();
  const unique=all.filter(function(m){if(seen.has(m.id))return false;seen.add(m.id);return true;});
  return {full:full,baby:baby,extra:extras.concat(candidates),all:unique,base:full.concat(baby,extras),porId:porId,baseIds:baseIds};
}
function vot_correo_(v){
  if(v.tipo==='completa'&&v.subtipo==='estatus')return vot_correoEstatus_(v);
  if(v.tipo==='otra')return vot_correoOtra_(v);
  const elec=vot_resolverElectorado_(v),escape=htmlSeguro_;
  const deadline=vot_fechaLarga_(v.dlFecha,v.dlHora).replace(/^./,function(c){return c.toUpperCase();});
  const preguntaDL=vot_fechaLarga_(v.dlPregFecha,v.dlPregHora).replace(/^./,function(c){return c.toUpperCase();});
  const fecha=v.fechaReunion||v.fecha;
  const red='#ff0000';
  let h='<div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.65;color:#222">';
  h+='<div><strong>'+(v.online?'#DL para votar: ':'#DL para delegar: ')+'</strong><strong style="color:'+red+'">'+escape(deadline)+'</strong></div>';
  if(v.formActivo)h+='<div style="color:'+red+'"><strong>'+(v.linkForm?'<a style="color:'+red+'" href="'+escape(v.linkForm)+'">#Form de preguntas</a>':'#Form de preguntas')+'</strong></div>';
  if(v.mlActivo!==false)h+='<div style="color:'+red+'"><strong>'+(v.linkML?'<a style="color:'+red+'" href="'+escape(v.linkML)+'">#Link a la ML / Carpeta de MLs</a>':'#Link a la ML / Carpeta de MLs')+'</strong></div>';
  if(v.formActivo)h+='<div style="color:'+red+'"><strong>#DL para preguntar: '+escape(preguntaDL)+'</strong></div>';
  const partes=['miembros de pleno derecho'];if(v.incluirBabies)partes.push('miembros de simple derecho');if(elec.extra.length)partes.push('candidatos / invitados');
  h+='<div><strong>#Convocados '+escape(partes.join(' + '))+'</strong></div>';
  const listar=function(ms){return ms.map(function(m){return escape(m.nombre);}).join(', ');};
  h+='<div><strong>#'+elec.all.length+' Convocados: </strong><strong style="color:'+red+'">'+listar(elec.full);
  if(elec.baby.length)h+=' + '+listar(elec.baby);
  if(elec.extra.length)h+=' + '+listar(elec.extra);
  h+='</strong></div><div style="height:20px"></div>';
  const detalle=[];
  v.cuestiones.forEach(function(c){
    const miembrosEspecificos=c.opciones.filter(function(o){return o.miembroId&&!elec.base.some(function(m){return m.id===o.miembroId;});});
    const electoradoEspecifico=new Set(elec.base.map(function(m){return m.id;}));miembrosEspecificos.forEach(function(m){electoradoEspecifico.add(m.miembroId);});
    detalle.push({pregunta:c.pregunta,convocados:electoradoEspecifico.size,quorum:vot_quorum_(electoradoEspecifico.size,v.quorum)});
    h+='<div style="text-align:center;color:'+red+';margin:14px 0 22px"><strong>Opciones de voto a '+escape(c.pregunta)+':</strong>';
    c.opciones.forEach(function(o){const m=elec.porId[o.miembroId];const asterisco=!!(m&&vot_norm_(m.estatus)!=='full');
      h+='<div>'+escape(o.texto)+(asterisco?'*':'')+'</div>';
    });
    h+='<div>Blanco</div></div>';
  });
  h+='<div style="color:'+red+';margin-top:24px"><strong><u>Condiciones:</u></strong></div>';
  h+='<ol style="color:'+red+'"><li><strong>Condición de realización:</strong> '+(v.quorum==='mitad'?'Cuórum igual al de una votación no excepcional (por defecto, mitad más uno).':'Cuórum igual al de una votación excepcional (2/3, redondeando hacia arriba).')+'</li>';
  h+='<li><strong>Condición de elección:</strong> '+escape(v.quorum==='dosTercios'?'2/3, redondeando hacia arriba, de los votos a una opción.':VOT_CONFIG.CONDICION_ELECCION_SIMPLE)+'</li></ol>';
  if(v.subtipo==='cargos' && v.cuestiones.some(function(c){return c.opciones.some(function(o){const m=elec.porId[o.miembroId];return m&&vot_norm_(m.estatus)!=='full'&&!elec.base.some(function(e){return e.id===m.id;});});})) {
    h+='<p style="color:'+red+'">*De acuerdo con el <em>Anexo 4: Otros cargos</em> del RRI, los candidatos que no sean miembros de pleno derecho recibirán derecho a voto <strong>únicamente para su votación, <u>no teniendo derecho a voto en las votaciones de los otros candidatos</u></strong>.</p>';
  }
  h+='<hr style="border:0;border-top:1px solid #aaa;margin:18px 0"><div style="min-height:44px">'+(v.textoLibreHtml||'')+'</div><p style="margin-top:28px">';
  if(v.online)h+='<strong style="color:'+red+'">La votación se realizará online el '+escape(vot_dia_(fecha)+' '+vot_fechaCorta_(fecha))+'.</strong> No se admiten delegaciones de voto.</p></div>';
  else h+='<span style="color:'+red+'">La votación se llevará a cabo en la </span><strong style="color:'+red+'">reunión del '+escape(vot_dia_(fecha)+' '+vot_fechaCorta_(fecha))+'.</strong> Así, <strong>los convocados podrán delegar su voto</strong> respondiendo <strong>por privado a este hilo</strong>, indicando la persona <strong>a quién lo delegan</strong>, <strong>antes del '+escape(vot_dia_(v.dlFecha)+' '+vot_fechaCorta_(v.dlFecha)+' a las '+v.dlHora)+' horas '+vot_zona_(v.dlFecha)+'.</strong></p></div>';
  const texto=h.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/div>|<\/li>|<\/p>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  return {html:h,texto:texto,detalle:detalle,convocados:elec.all.length};
}

/** Formato de cambios de estatus tomado del correo institucional de mayo:
 * encabezado/condiciones siempre iguales salvo DL y Fulls; tablas naranja debajo de HR.
 */
function vot_correoEstatus_(v){
  const esc=htmlSeguro_,red='#ff0000';
  const ms=v.miembros||vot_miembros_(),full=ms.filter(function(m){return vot_estatusCanon_(m.estatus)==='Full';});
  const fecha=v.fechaReunion||v.fecha;
  const dl=vot_fechaLarga_(v.dlFecha,v.dlHora).replace(/^./,function(c){return c.toUpperCase();});
  let h='<div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.65;color:#222">';
  h+='<div><strong>'+(v.online?'#DL para votar: ':'#DL para delegar: ')+'</strong><strong style="color:'+red+'">'+esc(dl)+'</strong></div>';
  h+='<div><strong>#Convocados miembros de pleno derecho</strong></div>';
  h+='<div><strong>#'+full.length+' Convocados: </strong><strong style="color:'+red+'">'+full.map(function(m){return esc(m.nombre);}).join(', ')+'</strong></div>';
  h+='<div style="text-align:center;color:'+red+';margin:20px 0"><strong>Opciones de voto a cambios de estatus:</strong>';
  h+='<div>A favor</div><div>En contra</div><div>Blanco</div></div>';
  h+='<div style="color:'+red+'"><strong><u>Condiciones:</u></strong></div>';
  h+='<ol style="color:'+red+'"><li><strong>Condición de realización:</strong> Cuórum igual al de una votación no excepcional (por defecto, mitad más uno).</li>';
  h+='<li><strong>Condición de elección:</strong> '+esc(VOT_CONFIG.CONDICION_ELECCION_SIMPLE)+'</li></ol>';
  h+='<div style="color:'+red+'"><strong><u>Opciones de voto:</u></strong></div>';
  h+='<ul style="color:'+red+'">';
  h+='<li><strong>Opción «A favor»:</strong> Al votar esta opción se considera que el candidato cumple los requisitos para cambiar su estatus. De ser la opción mayoritaria y cumplir el cuórum de aprobación necesario el candidato cambiaría su estatus.</li>';
  h+='<li><strong>Opción «En contra»:</strong> Al votar esta opción se considera que el candidato no tiene los requisitos necesarios para el cambio de estatus.</li>';
  h+='<li><strong>Opción «Blanco»:</strong> Al votar esta opción, el votante declara que no tiene una decisión o conocimiento claro respecto al candidato, por lo que considera que ni la opción «A favor» o «En contra» representa su pensamiento.</li>';
  h+='<li>Votar cualquiera de las opciones cuenta como voto emitido y modifica el cuórum necesario para aprobar el cambio de estatus.</li></ul>';
  h+='<hr style="border:0;border-top:1px solid #aaa;margin:20px 0">';
  const grupos=new Map();
  v.cambios.forEach(function(c){const clave=c.origen+' → '+c.destino;if(!grupos.has(clave))grupos.set(clave,[]);grupos.get(clave).push(c);});
  grupos.forEach(function(cambios,clave){
    const [origen,destino]=clave.split(' → ');
    h+='<table role="presentation" cellpadding="7" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;text-align:center;margin:16px auto 22px">';
    h+='<tr><th style="background:#e69138;color:#000;font-weight:bold;border:1px solid #fff">Paso de '+esc(origen)+' a '+esc(destino)+'</th></tr>';
    h+='<tr><td style="background:#f9cb9c;color:#000;border:1px solid #fff">';
    h+=cambios.map(function(c){return '<div>'+esc(c.nombre)+(c.reportUrl?' (<a href="'+esc(c.reportUrl)+'" style="color:#1155cc">report</a>)':'')+'</div>';}).join('');
    h+='</td></tr></table>';
  });
  if(v.cambios.some(function(c){return c.destino==='Inactive';})){
    h+='<p style="color:'+red+'"><strong><u>Incumplimiento del RRI:</u></strong> '+esc(v.motivoRRI)+'</p>';
  }
  if(v.online){
    h+='<p style="margin-top:27px"><strong style="color:'+red+'">La votación se realizará online el '+esc(vot_dia_(fecha)+' '+vot_fechaCorta_(fecha))+'.</strong> No se admiten delegaciones de voto.</p></div>';
  }else{
    h+='<p style="margin-top:27px"><span style="color:'+red+'">La votación se llevará a cabo en la </span>';
    h+='<strong style="color:'+red+'">reunión del '+esc(vot_dia_(fecha)+' '+vot_fechaCorta_(fecha))+'.</strong> Así, ';
    h+='<strong>los convocados podrán delegar su voto</strong> respondiendo <strong>por privado a este hilo</strong>, indicando la persona ';
    h+='<strong>a quién lo delegan</strong>, <strong>antes del '+esc(vot_dia_(v.dlFecha)+' '+vot_fechaCorta_(v.dlFecha)+' a las '+v.dlHora)+' horas '+vot_zona_(v.dlFecha)+'.</strong></p></div>';
  }
  const texto=h.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/div>|<\/li>|<\/p>|<\/tr>|<\/table>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  return {html:h,texto:texto,detalle:[{pregunta:'Cambios de estatus',convocados:full.length,quorum:vot_quorum_(full.length,'mitad')}],convocados:full.length};
}

/**
 * OTRA: convocatoria de texto libre. Sin cuórums ni cláusulas automáticas.
 * Preguntas, opciones, enlaces y plazo de delegación opcionales. Si no hay
 * preguntas importables, puede convocarse pero no se ofrece exportación ER.
 */
function vot_validarOtra_(entrada){
  const fecha=validarFecha_(entrada.fecha),fechaReunion=entrada.fechaReunion?validarFecha_(entrada.fechaReunion):fecha;
  const asunto=limitar_(entrada.asunto,180,'Asunto');
  if(!asunto.replace(/^\[Secretar[ií]a\]\s*\[Votaci[oó]n\]\s*/i,'').trim())throw new Error('Escribe un título para la convocatoria.');
  const incluirFulls=entrada.incluirFulls!==false,incluirBabies=!!entrada.incluirBabies;
  const miembros=vot_miembros_(),porId={};miembros.forEach(function(m){porId[m.id]=m;});
  const ids=Array.isArray(entrada.extras)?entrada.extras.map(String):[];
  if(ids.length>200)throw new Error('Hay demasiados convocados adicionales.');
  ids.forEach(function(id){if(!porId[id])throw new Error('Un convocado adicional no existe en Miembros. Selecciónalo de nuevo.');});
  const extras=Array.from(new Set(ids));
  const fulls=incluirFulls?miembros.filter(function(m){return vot_norm_(m.estatus)==='full';}):[];
  const babies=incluirBabies?miembros.filter(function(m){return vot_norm_(m.estatus)==='baby';}):[];
  const elegidos=new Set(fulls.concat(babies).map(function(m){return m.id;}));extras.forEach(function(id){elegidos.add(id);});
  if(!elegidos.size)throw new Error('Convoca al menos a una persona: Fulls, Babies o miembros seleccionados.');
  const preguntas=Array.isArray(entrada.cuestiones)?entrada.cuestiones:[];
  if(preguntas.length>50)throw new Error('Máximo 50 preguntas para una convocatoria.');
  const cuestiones=preguntas.map(function(c,i){
    const pregunta=limitar_(c.pregunta||'',180,'Pregunta '+(i+1));
    const raw=Array.isArray(c.opciones)?c.opciones:[];
    const opciones=raw.map(function(o){return {texto:limitar_(o.texto||'',150,'Opción'),miembroId:''};});
    // En Otra una pregunta incompleta puede guardarse como borrador,
    // pero no será exportable hasta estar terminada.
    return {pregunta:pregunta,opciones:opciones,
      validationMin:Number.isInteger(Number(c.validationMin))?Number(c.validationMin):1,
      validationMax:Number.isInteger(Number(c.validationMax))?Number(c.validationMax):1,
      randomize:!!c.randomize};
  });
  const dlActivo=!!entrada.dlActivo;
  const dlFecha=dlActivo?validarFecha_(entrada.dlFecha):'',dlHora=dlActivo?limitar_(entrada.dlHora||'23:50',5,'Hora límite'):'';
  if(dlActivo&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(dlHora))throw new Error('Hora límite no válida.');
  const mlActivo=!!entrada.mlActivo,formActivo=!!entrada.formActivo;
  const linkML=mlActivo?urlHTTPS_(entrada.linkML||'','Enlace a las ML',false):'';
  const linkForm=formActivo?urlHTTPS_(entrada.linkForm||'','Formulario de preguntas',false):'';
  let dlPregFecha='',dlPregHora='';
  if(formActivo&&entrada.dlPregFecha){dlPregFecha=validarFecha_(entrada.dlPregFecha);dlPregHora=String(entrada.dlPregHora||'23:50');
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(dlPregHora))throw new Error('DL de preguntas incorrecta.');}
  return {fecha:fecha,fechaReunion:fechaReunion,asunto:asunto,tipo:'otra',subtipo:'libre',
    incluirFulls:incluirFulls,incluirBabies:incluirBabies,extras:extras,extrasInfo:extras.map(function(id){return porId[id];}),
    cuestiones:cuestiones,cambios:[],quorum:'',dlActivo:dlActivo,dlFecha:dlFecha,dlHora:dlHora,
    formActivo:formActivo,mlActivo:mlActivo,linkML:linkML,linkForm:linkForm,
    dlPregFecha:dlPregFecha,dlPregHora:dlPregHora,
    textoLibreHtml:sanearPlantillaCorreo_(entrada.textoLibreHtml||''),miembros:miembros};
}
function vot_correoOtra_(v){
  const esc=htmlSeguro_,elec=vot_resolverElectorado_(v),red='#ff0000';
  let h='<div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.65;color:#222">';
  if(v.dlActivo)h+='<p><strong>'+(v.online?'#DL para votar: ':'#DL para delegar: ')+'</strong><strong style="color:'+red+'">'+esc(vot_fechaLarga_(v.dlFecha,v.dlHora))+'</strong></p>';
  if(v.mlActivo)h+='<p style="color:'+red+'"><strong>'+(v.linkML?'<a href="'+esc(v.linkML)+'">#Link a la ML / Carpeta de MLs</a>':'#Link a la ML / Carpeta de MLs')+'</strong></p>';
  if(v.formActivo)h+='<p style="color:'+red+'"><strong>'+(v.linkForm?'<a href="'+esc(v.linkForm)+'">#Form de preguntas</a>':'#Form de preguntas')+'</strong></p>';
  if(v.formActivo&&v.dlPregFecha)h+='<p style="color:'+red+'"><strong>#DL para preguntar: '+esc(vot_fechaLarga_(v.dlPregFecha,v.dlPregHora))+'</strong></p>';
  const etiquetas=[];if(v.incluirFulls!==false)etiquetas.push('miembros de pleno derecho');if(v.incluirBabies)etiquetas.push('miembros de simple derecho');if(elec.extra.length)etiquetas.push('invitados');
  h+='<p><strong>#Fecha de votación / reunión: </strong>'+esc(vot_fechaLarga_(v.fechaReunion||v.fecha,''))+'</p>';
  h+='<p><strong>#Convocados '+esc(etiquetas.join(' + ')||'seleccionados')+'</strong></p>';
  h+='<p><strong>#'+elec.all.length+' Convocados: </strong><strong style="color:'+red+'">'+elec.all.map(function(m){return esc(m.nombre);}).join(', ')+'</strong></p>';
  if(v.cuestiones&&v.cuestiones.length){
    v.cuestiones.forEach(function(c){if(!c.pregunta&&!c.opciones.some(function(o){return o.texto;}))return;
      h+='<div style="text-align:center;color:'+red+';margin:16px 0"><strong>'+esc(c.pregunta||'Opciones')+'</strong>';
      c.opciones.forEach(function(o){if(o.texto)h+='<div>'+esc(o.texto)+'</div>';});h+='</div>';
    });
  }
  h+='<hr style="border:0;border-top:1px solid #ccc;margin:20px 0">';
  h+='<div style="min-height:70px">'+(v.textoLibreHtml||'<p>Contenido de la convocatoria.</p>')+'</div></div>';
  const texto=h.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:div|p|li)>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  return {html:h,texto:texto,detalle:[],convocados:elec.all.length};
}
/** Captura el electorado ELEGIBLE por pregunta, sin duplicar derecho a voto.
 * Para Fulls/Babies/convocados manuales: todas las preguntas.
 * Para candidatos no Full no convocados como grupo/extras: solo su candidatura.
 */
function vot_snapshot_(v){
  const ms=v.miembros||vot_miembros_(),byId={};ms.forEach(function(m){byId[m.id]=m;});
  const allQuestions=vot_preguntasExportacion_(v,false);
  const base=v.tipo==='completa'&&v.subtipo==='estatus' ? ms.filter(function(m){return vot_norm_(m.estatus)==='full';}) :
    (v.incluirFulls!==false?ms.filter(function(m){return vot_norm_(m.estatus)==='full';}):[])
      .concat(v.incluirBabies?ms.filter(function(m){return vot_norm_(m.estatus)==='baby';}):[])
      .concat((v.extras||[]).map(function(id){return byId[id];}).filter(Boolean));
  // Necesitamos evitar los nombres heredados como identidad: siempre ID_Miembro.
  const rights={};const candidates={};
  base.forEach(function(m){rights[m.id]=new Set(allQuestions.map(function(q){return q.key;}));});
  if(v.tipo==='simple'&&v.subtipo==='cargos'){
    (v.cuestiones||[]).forEach(function(c,i){(c.opciones||[]).forEach(function(o){
      const id=o.miembroId;if(!id||!byId[id])return;
      if(!rights[id])rights[id]=new Set();
      if(!base.some(function(m){return m.id===id;}))rights[id].add('q'+i);
    });});
  }
  const roster=Object.keys(rights).map(function(id){const m=byId[id];return {id:m.id,nombre:m.nombre,email:m.email,estatus:m.estatus,preguntas:Array.from(rights[id])};});
  return {generado:new Date().toISOString(),roster:roster};
}
function vot_preguntasExportacion_(v,strict){
  let preguntas=[];
  if(v.tipo==='completa'&&v.subtipo==='estatus'){
    preguntas=(v.cambios||[]).map(function(c,i){return {key:'q'+i,titulo:'Cambio de estatus: '+c.nombre+' ('+c.origen+' → '+c.destino+')',opciones:['A favor','En contra','Blanco'],min:1,max:1,randomize:0};});
  }else{
    preguntas=(v.cuestiones||[]).map(function(c,i){
      const opciones=(c.opciones||[]).map(function(o){return String(o.texto||'').trim();});
      if(v.tipo==='simple')opciones.push('Blanco');
      const min=v.tipo==='otra'?Number(c.validationMin??1):1;
      const max=v.tipo==='otra'?Number(c.validationMax??1):1;
      return {key:'q'+i,titulo:String(c.pregunta||'').trim(),opciones:opciones,min:min,max:max,randomize:v.tipo==='otra'&&c.randomize?1:0};
    });
  }
  if(strict){
    if(!preguntas.length)throw new Error('La convocatoria no tiene preguntas importables. Añade al menos una pregunta con opciones.');
    const names=new Set();
    preguntas.forEach(function(q,i){
      if(!q.titulo||q.opciones.length<2||q.opciones.some(function(o){return !o;}))throw new Error('Pregunta '+(i+1)+': completa el título y al menos dos respuestas.');
      if(q.opciones.length>30)throw new Error('Pregunta '+(i+1)+': Election Runner admite como máximo 30 respuestas por pregunta.');
      if(!Number.isInteger(q.min)||!Number.isInteger(q.max)||q.min<0||q.max<1||q.max>30||q.min>q.max||q.max>q.opciones.length)throw new Error('Pregunta '+(i+1)+': selección mínima y máxima incorrecta.');
      if(names.has(vot_norm_(q.titulo)))throw new Error('Dos preguntas tienen el mismo título. Election Runner necesita distinguirlas: '+q.titulo);
      names.add(vot_norm_(q.titulo));
    });
  }
  return preguntas;
}
/** Exporta el formato de IMPORTACIÓN, no el CSV de votantes ya registrados.
 * Election Runner: name,voter_identifier,voter_key,email,vote_weight
 * Los nombres reales y los IDs proceden de Miembros. No se inventan claves.
 */
/** Excel (especialmente con configuración regional española) necesita la marca
 * UTF-8 BOM para reconocer tildes, ñ y otros caracteres al abrir un .csv.
 * No cambiamos las comas ni las cabeceras exigidas por Election Runner.
 */
function vot_csv_(rows){return '\uFEFF'+rows.map(function(row){return row.map(function(item){
  const raw=String(item==null?'':item);
  if(/^[=+@\-\t\r]/.test(raw))throw new Error('Campo no seguro para CSV: '+raw.slice(0,45)+'. Revisa los datos de origen.');
  return /[",\r\n]/.test(raw)?'"'+raw.replace(/"/g,'""')+'"':raw;
}).join(',');}).join('\r\n')+'\r\n';}
/** Una elección por CONJUNTO DE CONVOCADOS NO FULL que pueden votar cada pregunta.
 * Todos los Full convocados se incluyen en CADA elección, no solo en la
 * elección principal. Ej.: 7 Full + pregunta común + tres cargos con un
 * Baby diferente => (7 Full) + (7 Full + Baby A) + (7 Full + Baby B)
 * + (7 Full + Baby C), es decir, 4 elecciones y 12 CSV.
 *
 * La instantánea fija los derechos por pregunta; la agrupación de preguntas
 * por iguales extras evita dar a los no Full acceso a otras candidaturas.
 * En «Otra» se respeta la decisión explícita de no convocar a los Fulls.
 */
function vot_exportarPlan_(row){
  const v=row.config;
  const preguntas=vot_preguntasExportacion_(v,true),qByKey={};preguntas.forEach(function(q){qByKey[q.key]=q;});
  const snap=v.exportCenso;
  if(!snap||!Array.isArray(snap.roster))throw new Error('No hay censo congelado de esta convocatoria. Guarda de nuevo la convocatoria confirmada para crear una instantánea, y vuelve a exportar.');
  const fulls=[],noFulls=[],idsSeen=new Set();
  snap.roster.forEach(function(m){
    if(!m.nombre||!m.id)throw new Error('Un convocado no tiene nombre o ID en la hoja Miembros.');
    if(bb_aliasInstitucional_(m.email))throw new Error('El censo contiene una cuenta institucional de la Board: '+m.email+'. Usa cuentas personales de Miembros; las cuentas compartidas no pueden votar.');
    if(idsSeen.has(m.id))throw new Error('El censo congelado contiene dos veces a '+m.nombre+'. Guarda de nuevo la convocatoria.');
    idsSeen.add(m.id);
    if(m.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email))throw new Error('Correo incorrecto para '+m.nombre+'. Corrígelo en Miembros y vuelve a guardar la convocatoria.');
    const elegibles=(m.preguntas||[]).some(function(k){return !!qByKey[k];});
    if(!elegibles)return;
    if(vot_norm_(m.estatus)==='full')fulls.push(m);
    else noFulls.push(m);
  });
  // La identidad de cada pregunta se mantiene con key (q0, q1...), nunca
  // se deduce por texto ni por el nombre de un candidato.
  const grupos=new Map();
  preguntas.forEach(function(q){
    const extras=noFulls.filter(function(m){return (m.preguntas||[]).includes(q.key);});
    const firma=extras.map(function(m){return String(m.id);}).sort().join('|');
    if(!grupos.has(firma))grupos.set(firma,{keys:[],voters:fulls.concat(extras),extraIds:extras.map(function(m){return m.id;})});
    grupos.get(firma).keys.push(q.key);
  });
  const result=Array.from(grupos.values());
  if(result.some(function(g){return !g.voters.length;}))throw new Error('Hay una o más preguntas sin votantes autorizados. Revisa los convocados antes de exportar.');
  if(!result.length)throw new Error('No hay votantes con derecho a voto sobre las preguntas configuradas.');
  result.sort(function(a,b){return a.extraIds.length-b.extraIds.length||b.keys.length-a.keys.length||a.keys[0].localeCompare(b.keys[0],undefined,{numeric:true});});
  result.forEach(function(g,i){
    g.numero=i+1;const perfiles={};g.voters.forEach(function(m){const perfil=vot_estatusCanon_(m.estatus)||m.estatus||'Otros';perfiles[perfil]=(perfiles[perfil]||0)+1;});
    g.nombre=(g.extraIds.length?'Censo '+(i+1):fulls.length?'Censo Full':'Censo '+(i+1))+' · '+Object.keys(perfiles).map(function(p){return p+': '+perfiles[p];}).join(', ');
    g.questions=g.keys.map(function(k){return qByKey[k];});
  });
  return result;
}
function vot_csvGrupo_(g,delegaciones){
  const headersQ=['title','description','validation_min','validation_max','randomize_options'];
  const headersO=['question','title','short_description','description','photo','sort'];
  const headersV=['name','voter_identifier','voter_key','email','vote_weight'];
  const questions=vot_csv_([headersQ].concat(g.questions.map(function(q){return [q.titulo,'',q.min,q.max,q.randomize];})));
  const options=[headersO];g.questions.forEach(function(q){q.opciones.forEach(function(o,i){options.push([q.titulo,o,'','','',i]);});});
  const porId={};(delegaciones||[]).forEach(function(d){porId[d.miembroId]=d;});
  const voters=vot_csv_([headersV].concat(g.voters.map(function(m){
    const d=porId[m.id];return [m.nombre,m.id,'',d?d.delegadoEmail:m.email,1];
  }))); 
  return [{name:'questions.csv',csv:questions},{name:'options.csv',csv:vot_csv_(options)},{name:'voters.csv',csv:voters}];
}
/** Listado seguro: no expone correos ni IDs a usuarios de lectura. */
function planExportacionElectionRunner(id){
  bb_exigirSecretaria_();requerirPruebas_();
  const row=vot_leer_().find(function(r){return r.id===String(id)&&!r.marcado;});
  if(!row||row.estado!=='Confirmada')throw new Error('La votación debe estar confirmada para exportarla.');
  bb_exigirDLExportacion_(row);
  return {ok:true,grupos:vot_exportarPlan_(row).map(function(g){return {numero:g.numero,nombre:g.nombre,preguntas:g.questions.map(function(q){return q.titulo;}),votantes:g.voters.length};})};
}
function descargarElectionRunner(id,numero,tipo){
  bb_exigirSecretaria_();requerirPruebas_();
  const row=vot_leer_().find(function(r){return r.id===String(id)&&!r.marcado;});
  if(!row||row.estado!=='Confirmada')throw new Error('Solo pueden descargarse votaciones confirmadas.');
  bb_exigirDLExportacion_(row);
  const grupos=vot_exportarPlan_(row),n=Number(numero),modo=String(tipo||'zip');
  if(numero!=='todos'&&(!Number.isInteger(n)||n<1||n>grupos.length))throw new Error('Selecciona un grupo válido.');
  if(!['zip','questions','options','voters'].includes(modo))throw new Error('Archivo de exportación no válido.');
  if(numero==='todos'&&modo!=='zip')throw new Error('El archivo global solo puede descargarse como ZIP.');
  const elegidos=numero==='todos'?grupos:[grupos[n-1]];
  if(modo!=='zip'){
    const file=vot_csvGrupo_(elegidos[0],bb_delegacionesDeVoto_(id)).find(function(x){return x.name===modo+'.csv';});
    const name='eleccion_'+String(elegidos[0].numero).padStart(2,'0')+'_'+file.name;
    const blob=Utilities.newBlob(file.csv,'text/csv;charset=UTF-8',name);
    return {ok:true,nombre:name,mime:'text/csv;charset=utf-8',base64:Utilities.base64Encode(blob.getBytes()),cantidad:1};
  }
  const archivos=[];
  elegidos.forEach(function(g){vot_csvGrupo_(g,bb_delegacionesDeVoto_(id)).forEach(function(f){
    archivos.push(Utilities.newBlob(f.csv,'text/csv;charset=UTF-8','eleccion_'+String(g.numero).padStart(2,'0')+'/'+f.name));
  });});
  const zip=Utilities.zip(archivos,'ElectionRunner_'+bb_nombreArchivo_(row.asunto)+'_'+String(row.fecha)+'_'+(numero==='todos'?'TODAS':'grupo_'+n)+'.zip');
  return {ok:true,nombre:zip.getName(),mime:'application/zip',base64:Utilities.base64Encode(zip.getBytes()),cantidad:archivos.length};
}

function previsualizarCorreoVotacion(datos){
  bb_exigirSecretaria_();requerirPruebas_();const v=vot_validar_(datos);return vot_correo_(v);}
function crearBorradorVotacion(id){
  bb_exigirSecretaria_();
  const email=requerirPruebas_();const row=vot_leer_().find(function(v){return v.id===id&&!v.marcado;});
  if(!row)throw new Error('Guarda antes la convocatoria.');
  const valid=vot_validar_(row.config);
  const cuerpo=vot_correo_(valid);
  const conImagenes=prepararImagenesCorreo_(cuerpo.html);
  GmailApp.createDraft(email,vot_asuntoCorreo_(row.asunto),cuerpo.texto,{htmlBody:codificarEmojisHtml_(conImagenes.html),inlineImages:conImagenes.inlineImages});
  return {ok:true,mensaje:'Borrador en tu Gmail, dirigido únicamente a tu propia cuenta. No se ha enviado.',urlBorradores:'https://mail.google.com/mail/u/0/#drafts'};
}



/**
 * Participación y delegaciones v0.8.0.
 * Los motivos privados se guardan en ScriptProperties del PROYECTO (no en
 * Sheets compartidos); la API devuelve únicamente los autorizados.
 * Conserva despliegue "ejecutar como usuario", necesario para crear borradores
 * Gmail en la cuenta de cada secretario. No compartas el proyecto Apps Script
 * con usuarios no administradores: los editores pueden ver sus propiedades.
 */
const BB_PART = Object.freeze({
  JUST_PREFIX:'BB_PART_JUST_V1_',DELEG_PREFIX:'BB_PART_DELEG_V1_',
  BOARD_GROUP_PROP:'BB_GRUPO_BOARD',BOARD_DEFAULT:'board@bestvalencia.org',
  STORE_VERSION:'BB_PART_VERSION'
});
function bb_nombreArchivo_(texto){return String(texto||'votacion').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\[Secretaria\]|\[Votacion\]/gi,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,78)||'Votacion';}
function bb_aliasInstitucional_(email){return /^(board|secretary|president|presidency|treasury|treasurer|internal|external|vp-?internal|vp-?external|hr|it|fr|prd|events|members|full-member|observers)@bestvalencia\.org$/i.test(String(email||''));}
/** PropertiesService almacena 1 propiedad por registro para minimizar escrituras
 * y evitar una hoja que los miembros puedan abrir en Drive. Hay cuota total
 * (500KB aprox.): si se llena, error explícito sin pérdida silenciosa.
 */
function bb_registros_(prefix){
  if(bb_puenteConfigurado_())return bb_privLeer_(prefix);
  const props=PropertiesService.getScriptProperties().getProperties();
  return Object.keys(props).filter(k=>k.indexOf(prefix)===0).map(k=>{
    try{return JSON.parse(props[k]);}catch(e){throw new Error('Registro privado antiguo dañado: '+k);}
  });
}
function bb_guardarRegistro_(prefix,reg){
  if(!reg||!/^([a-z]+)_[0-9a-f-]{36}$/i.test(reg.id))throw new Error('Identificador privado incorrecto.');
  if(JSON.stringify(reg).length>8000)throw new Error('Justificación demasiado larga.');
  if(bb_puenteConfigurado_())return bb_privGuardar_(prefix,reg);
  PropertiesService.getScriptProperties().setProperty(prefix+reg.id,JSON.stringify(reg));
}
function bb_borrarRegistro_(prefix,id){
  if(bb_puenteConfigurado_())return bb_privBorrar_(prefix,id);
  PropertiesService.getScriptProperties().deleteProperty(prefix+id);
}
function bb_justificaciones_(){return bb_registros_(BB_PART.JUST_PREFIX);}
function bb_delegaciones_(){return bb_registros_(BB_PART.DELEG_PREFIX);}
function bb_delegacionesDeVoto_(votacionId){return bb_delegaciones_().filter(function(d){return d.votacionId===votacionId;});}
function bb_miembroActual_(email){
  const ms=vot_miembros_();const encontrados=ms.filter(function(m){return String(m.email||'').trim().toLowerCase()===email;});
  if(bb_aliasInstitucional_(email))throw new Error('No puedes participar con un correo institucional compartido de la Board: usa tu correo personal de Miembros.');
  if(encontrados.length!==1)throw new Error('Tu correo '+email+' no coincide de forma única con una persona en Miembros. Secretaría debe corregir el correo antes de participar.');
  return {m:encontrados[0],miembros:ms};
}
function bb_puedeVerBoard_(email){
  if(puedeGestionarReuniones_(email))return true;
  const grupo=PropertiesService.getScriptProperties().getProperty(BB_PART.BOARD_GROUP_PROP)||BB_PART.BOARD_DEFAULT;
  try{return !!GroupsApp.getGroupByEmail(grupo).hasUser(email);}catch(e){return false;}
}
function bb_reunionVinculada_(id,exigirViva){
  const r=leerReuniones_().find(function(x){return x.id===id;});
  if(!r)throw new Error('La reunión vinculada no existe.');
  if(exigirViva&&r.marcado)throw new Error('No se puede vincular una reunión marcada para borrado.');
  return r;
}
function bb_limite_(v){return String(v.dlFecha||'')+' '+String(v.dlHora||'23:50');}
function bb_ahoraMadrid_(){return Utilities.formatDate(new Date(),'Europe/Madrid','yyyy-MM-dd HH:mm');}
function bb_exigirDLExportacion_(row){
  if(row.config.online===true)return; // Votación online: no existe delegación que esperar.
  const id=String(row.config.reunionId||'').trim();if(!id)return;
  bb_reunionVinculada_(id,false);
  if(!row.config.dlFecha||row.config.dlActivo===false)throw new Error('Para exportar una votación presencial vinculada a reunión, configura su DL para delegar.');
  if(bb_ahoraMadrid_()<bb_limite_(row.config))throw new Error('Elección presencial: los CSV estarán disponibles tras la DL para delegar ('+bb_limite_(row.config)+' hora peninsular).');
}
function bb_elector_(row,miembro){
  const roster=row.config.exportCenso&&row.config.exportCenso.roster||[];
  return roster.find(function(m){return m.id===miembro.id&&Array.isArray(m.preguntas)&&m.preguntas.length;})||null;
}
function bb_revisarVotacion_(id){const row=vot_leer_().find(function(v){return v.id===id;});
  if(!row||row.marcado||row.estado!=='Confirmada')throw new Error('Solo se puede delegar en una votación confirmada y no marcada para borrado.');
  if(row.config.online===true)throw new Error('Esta votación es online; no admite delegaciones.');
  const rid=String(row.config.reunionId||'').trim();
  if(rid){const r=bb_reunionVinculada_(rid,false);if(!r.marcado&&r.estado!=='Convocada')throw new Error('La reunión vinculada aún no está convocada.');}
  return row;
}
function bb_validarCapacidad_(row,propuesta){
  // La cuota se aplica a toda la convocatoria, NO de forma independiente
  // por cada CSV: un Full con dos delegaciones de dos cargos distintos
  // tendría tres votos (el suyo + dos) y eso está prohibido.
  const roster=row.config.exportCenso&&row.config.exportCenso.roster||[];
  const porId={};roster.forEach(function(m){porId[m.id]=m;});
  const outgoing=new Set(),entrantes={};
  propuesta.forEach(function(d){
    const origin=porId[d.miembroId],dest=porId[d.delegadoId];
    if(!origin||!dest||origin.id===dest.id)throw new Error('Origen o destino no pertenece al censo de la convocatoria.');
    if(outgoing.has(d.miembroId))throw new Error('No se puede delegar dos veces el mismo voto.');
    outgoing.add(d.miembroId);
    if(!(origin.preguntas||[]).every(function(k){return (dest.preguntas||[]).includes(k);}))throw new Error('El delegado debe tener derecho a las mismas preguntas.');
    entrantes[dest.id]=(entrantes[dest.id]||0)+1;
  });
  propuesta.forEach(function(d){if(outgoing.has(d.delegadoId))throw new Error('No puedes recibir votos delegados si has delegado tu propio voto.');});
  Object.keys(entrantes).forEach(function(id){
    // Todos los destinatarios son votantes de la convocatoria y tienen
    // también su voto personal: como máximo UNA delegación adicional.
    if(entrantes[id]>1)throw new Error('Límite de dos votos en total (incluido el propio) en esta convocatoria.');
  });
}
/** Listado privado orientado al miembro: nunca devuelve razones ajenas. */
function bb_miPanel(){
  bb_exigirSecretaria_();
  throw new Error('Esta acción pertenece exclusivamente a Big Brother Participación.');
}
function bb_guardarJustificacion(){
  bb_exigirSecretaria_();
  throw new Error('Esta acción pertenece exclusivamente a Big Brother Participación.');
}
function bb_buscarDelegados(){
  bb_exigirSecretaria_();
  throw new Error('Esta acción pertenece exclusivamente a Big Brother Participación.');
}
function bb_guardarDelegacion(){
  bb_exigirSecretaria_();
  throw new Error('Esta acción pertenece exclusivamente a Big Brother Participación.');
}
function bb_quitarDelegacion(){
  bb_exigirSecretaria_();
  throw new Error('Esta acción pertenece exclusivamente a Big Brother Participación.');
}
/** Secretaria (o Board cuando se autorice). El permiso para Board se controla por fila. */
function bb_listarJustificacionesSecretaria(){
  bb_exigirSecretaria_();
  const email=requerirCuentaDominio_(),admin=puedeGestionarReuniones_(email),board=bb_puedeVerBoard_(email);
  if(!admin&&!board)throw new Error('Solo Secretaría o Board autorizada puede consultar justificaciones.');
  const meetings=leerReuniones_(),porId={};meetings.forEach(function(r){porId[r.id]=r;});
  return {admin:admin,board:board,registros:bb_justificaciones_().filter(function(j){return admin||j.board;}).map(function(j){const r=porId[j.reunionId];return {id:j.id,nombre:j.nombre,texto:j.texto,reunionId:j.reunionId,reunion:r?r.titulo:'Reunión antigua',fecha:r?r.fecha:'',visibleBoard:j.board,marcada:!!(r&&r.marcado)};})};
}
function bb_cambiarVisibilidadBoard(justificacionId,activar){
  bb_exigirSecretaria_();requerirPruebas_();return bajoBloqueo_(function(){
  const reg=bb_justificaciones_().find(function(j){return j.id===justificacionId;});
  if(!reg)throw new Error('Justificación no encontrada.');
  reg.board=activar===true;reg.actualizado=new Date().toISOString();
  bb_guardarRegistro_(BB_PART.JUST_PREFIX,reg);
  return {ok:true,mensaje:activar?'La Board autorizada podrá consultar esta justificación.':'La justificación vuelve a estar reservada a Secretaría.'};
});}
/** Enlaces NUEVOS: solo reuniones convocadas, no marcadas y desde hoy
 * (fecha peninsular de España). No se exige que aún no haya llegado su hora;
 * una reunión de hoy sigue siendo elegible todo el día.
 */
function bb_exigirReunionEnlazableNueva_(id){
  const r=bb_reunionVinculada_(id,true);
  if(r.estado!=='Convocada')throw new Error('Solo puedes vincular votaciones a reuniones ya convocadas.');
  const hoy=Utilities.formatDate(new Date(),'Europe/Madrid','yyyy-MM-dd');
  if(r.fecha<hoy)throw new Error('No puedes vincular una votación a una reunión pasada ('+r.fecha+'). Elige una de hoy o posterior.');
  return r;
}
/** Dropdown de reuniones enlazables, sin las antiguas, borradores ni marcadas. */
function bb_reunionesEnlazables(){
  bb_exigirSecretaria_();
  requerirPruebas_();
  const hoy=Utilities.formatDate(new Date(),'Europe/Madrid','yyyy-MM-dd');
  return leerReuniones_().filter(function(r){
    return !r.marcado&&r.estado==='Convocada'&&r.fecha>=hoy;
  }).map(function(r){return {id:r.id,fecha:r.fecha,hora:r.hora,titulo:r.titulo};})
    .sort(function(a,b){return a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora);});
}

/** Resumen privado de delegaciones; solo Secretaría. */
function bb_listarDelegacionesSecretaria(){
  bb_exigirSecretaria_();
  requerirPruebas_();const d=bb_delegaciones_(),vs=vot_leer_(),miembros=vot_miembros_();
  const votos={};vs.forEach(function(v){votos[v.id]=v;});const personas={};miembros.forEach(function(m){personas[m.id]=m;});
  return d.filter(function(x){return votos[x.votacionId]&&!votos[x.votacionId].marcado;}).map(function(x){const v=votos[x.votacionId],m=personas[x.miembroId],t=personas[x.delegadoId];return {votacion:v.asunto,votacionId:v.id,fecha:v.fecha,de:(m&&m.nombre)||x.email,a:(t&&t.nombre)||x.delegadoEmail,correoDelegado:x.delegadoEmail};});
}
function prepararModuloParticipacion(){
  bb_exigirSecretaria_();
  return {ok:true,mensaje:'Participación se gestiona en el proyecto separado; los datos privados se almacenan en BigBrother_Participacion_Privada. Usa prepararPuenteBigBrother en Gestión para preparar la conexión.'};
}
