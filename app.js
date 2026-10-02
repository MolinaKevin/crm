const weeklyData = {
  current: { total: '$ 6.480.000', growth: '8,2%', values: [54, 72, 46, 86, 67, 100, 78] },
  previous: { total: '$ 5.988.000', growth: '4,6%', values: [42, 60, 68, 55, 75, 82, 63] }
};
const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const chart = document.querySelector('#barChart');
function renderChart(key = 'current') {
  const data = weeklyData[key];
  document.querySelector('#weekTotal').textContent = data.total;
  document.querySelector('#weekGrowth').textContent = data.growth;
  chart.innerHTML = data.values.map((value, index) => `<div class="bar-wrap"><div class="bar" style="height:${value}%" title="${days[index]}: ${value}%"></div><label>${days[index]}</label></div>`).join('');
}
renderChart();
document.querySelector('#period').addEventListener('change', event => renderChart(event.target.value));

const toast = document.querySelector('#toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

const sidebar = document.querySelector('#sidebar');
document.querySelector('#menuToggle').addEventListener('click', () => sidebar.classList.toggle('open'));
document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(button => button.classList.remove('active'));
  item.classList.add('active');
  document.querySelector('#currentPage').textContent = item.dataset.page;
  sidebar.classList.remove('open');
  if (item.dataset.view) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    document.querySelector(`#${item.dataset.view}`).classList.add('active');
    if (item.dataset.module) renderModule(item.dataset.module);
    const placeholders = { Facturación: 'Buscar comprobantes...', 'Órdenes de trabajo': 'Buscar órdenes...', Productos: 'Buscar productos...', Clientes: 'Buscar clientes...', Caja: 'Buscar movimientos...', Stock: 'Buscar en stock...', Configuración: 'Buscar configuración...', Ayuda: 'Buscar ayuda...' };
    searchInput.placeholder = placeholders[item.dataset.page] || 'Buscar en el sistema...';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    showToast(`${item.dataset.page}: vista de demostración`);
  }
}));

const searchInput = document.querySelector('#searchInput');
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLocaleLowerCase('es').trim();
  if (document.querySelector('#billingView').classList.contains('active')) {
    document.querySelector('#invoiceSearch').value = searchInput.value;
    filterInvoices();
    return;
  }
  if (document.querySelector('#workOrdersView').classList.contains('active')) {
    document.querySelector('#workOrderSearch').value = searchInput.value;
    filterWorkOrders();
    return;
  }
  if (document.querySelector('#moduleView').classList.contains('active')) {
    const moduleSearch = document.querySelector('#moduleSearch');
    const helpSearch = document.querySelector('#helpSearch');
    if (moduleSearch) { moduleSearch.value = searchInput.value; filterModuleRows(); }
    else if (helpSearch) helpSearch.value = searchInput.value;
    return;
  }
  let visible = 0;
  document.querySelectorAll('#ordersBody tr').forEach(row => {
    const matches = row.textContent.toLocaleLowerCase('es').includes(query);
    row.hidden = !matches;
    if (matches) visible++;
  });
  document.querySelector('#emptyState').style.display = visible ? 'none' : 'block';
});

document.querySelectorAll('.priority').forEach(button => button.addEventListener('click', () => showToast(button.dataset.message)));
document.querySelector('#viewAll').addEventListener('click', () => showToast('Mostrando las órdenes más recientes'));

const dialog = document.querySelector('#orderDialog');
document.querySelector('#newOrder').addEventListener('click', () => dialog.showModal());
document.querySelector('#orderForm').addEventListener('submit', event => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const id = 1029 + document.querySelectorAll('#ordersBody tr').length - 3;
  const date = new Date(`${data.get('date')}T12:00:00`);
  const delivery = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', '');
  const row = document.createElement('tr');
  row.innerHTML = `<td>#OT-${id}</td><td></td><td></td><td><span class="status pending">Pendiente</span></td><td>${delivery}</td>`;
  row.children[1].textContent = data.get('client');
  row.children[2].textContent = data.get('job');
  document.querySelector('#ordersBody').prepend(row);
  const workRow = document.createElement('tr');
  workRow.dataset.status = 'pending';
  workRow.innerHTML = `<td><b>#OT-${id}</b><small>Creada hoy</small></td><td></td><td><span class="assignee unassigned"><i>?</i> Sin asignar</span></td><td><span class="priority-tag normal"></span></td><td><b>${delivery}</b><small>Próxima entrega</small></td><td><span class="status pending">Pendiente</span></td><td><button class="row-menu" aria-label="Opciones">•••</button></td>`;
  workRow.children[1].textContent = data.get('client');
  workRow.children[1].append(document.createElement('small'));
  workRow.children[1].querySelector('small').textContent = data.get('job');
  workRow.querySelector('.priority-tag').textContent = data.get('priority');
  if (data.get('priority') === 'Alta' || data.get('priority') === 'Urgente') workRow.querySelector('.priority-tag').className = 'priority-tag high';
  workRow.querySelector('.row-menu').addEventListener('click', () => showToast('Opciones de la orden'));
  document.querySelector('#workOrderBody').prepend(workRow);
  filterWorkOrders();
  form.reset(); dialog.close(); showToast(`Orden #OT-${id} creada correctamente`);
});

const invoiceDialog = document.querySelector('#invoiceDialog');
const invoiceForm = document.querySelector('#invoiceForm');
document.querySelector('#newInvoice').addEventListener('click', () => invoiceDialog.showModal());
invoiceForm.elements.amount.addEventListener('input', event => {
  const amount = Number(event.target.value || 0);
  document.querySelector('#invoicePreview').textContent = amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
});

function filterInvoices() {
  const query = document.querySelector('#invoiceSearch').value.toLocaleLowerCase('es').trim();
  const status = document.querySelector('#invoiceStatus').value;
  let visible = 0;
  document.querySelectorAll('#invoiceBody tr').forEach(row => {
    const matchesText = row.textContent.toLocaleLowerCase('es').includes(query);
    const matchesStatus = status === 'all' || row.dataset.status === status;
    row.hidden = !(matchesText && matchesStatus);
    if (!row.hidden) visible++;
  });
  document.querySelector('#invoiceCount').textContent = `Mostrando ${visible} comprobante${visible === 1 ? '' : 's'}`;
}
document.querySelector('#invoiceSearch').addEventListener('input', filterInvoices);
document.querySelector('#invoiceStatus').addEventListener('change', filterInvoices);
const exportDialog = document.querySelector('#exportDialog');
function showExportDemo(format) {
  document.querySelector('#exportMessage').textContent = `Esta es una demostración. En la versión productiva se generaría un archivo ${format} con el resumen fiscal y comercial del período seleccionado.`;
  exportDialog.showModal();
}
document.querySelector('#exportInvoices').addEventListener('click', () => showExportDemo('Excel'));
document.querySelectorAll('.report-export').forEach(button => button.addEventListener('click', () => showExportDemo(button.dataset.format)));
document.querySelector('#closeExport').addEventListener('click', () => exportDialog.close());
document.querySelectorAll('#invoiceBody .row-menu').forEach(button => button.addEventListener('click', () => showToast('Opciones del comprobante')));

invoiceForm.addEventListener('submit', event => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  if (!invoiceForm.reportValidity()) return;
  const data = new FormData(invoiceForm);
  const number = 1249 + document.querySelectorAll('#invoiceBody tr').length - 5;
  const amount = Number(data.get('amount')).toLocaleString('es-AR');
  const dueDate = new Date(`${data.get('date')}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
  const issued = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
  const row = document.createElement('tr');
  row.dataset.status = 'pending';
  row.innerHTML = `<td><b></b><small>0001-${String(number).padStart(8, '0')}</small></td><td></td><td>${issued}</td><td>${dueDate}</td><td><b>$ ${amount}</b></td><td><span class="status process">Pendiente</span></td><td><button class="row-menu" aria-label="Opciones">•••</button></td>`;
  row.querySelector('td b').textContent = data.get('type');
  row.children[1].textContent = data.get('client');
  row.querySelector('.row-menu').addEventListener('click', () => showToast('Opciones del comprobante'));
  document.querySelector('#invoiceBody').prepend(row);
  invoiceForm.reset(); document.querySelector('#invoicePreview').textContent = '$ 0'; invoiceDialog.close(); filterInvoices();
  showToast(`Factura 0001-${String(number).padStart(8, '0')} creada correctamente`);
});

function filterWorkOrders() {
  const query = document.querySelector('#workOrderSearch').value.toLocaleLowerCase('es').trim();
  const status = document.querySelector('#workOrderStatus').value;
  let visible = 0;
  document.querySelectorAll('#workOrderBody tr').forEach(row => {
    const matchesText = row.textContent.toLocaleLowerCase('es').includes(query);
    const matchesStatus = status === 'all' || row.dataset.status === status;
    row.hidden = !(matchesText && matchesStatus);
    if (!row.hidden) visible++;
  });
  document.querySelector('#workOrderCount').textContent = `Mostrando ${visible} orden${visible === 1 ? '' : 'es'}`;
}
document.querySelector('#workOrderSearch').addEventListener('input', filterWorkOrders);
document.querySelector('#workOrderStatus').addEventListener('change', filterWorkOrders);
document.querySelector('#workOrderFilter').addEventListener('click', () => showToast('Filtros avanzados: vista de demostración'));
document.querySelectorAll('#workOrderBody .row-menu').forEach(button => button.addEventListener('click', () => showToast('Opciones de la orden')));
document.querySelectorAll('.new-order-trigger').forEach(button => button.addEventListener('click', () => dialog.showModal()));

const moduleData = {
  products: {
    eyebrow: 'CATÁLOGO', title: 'Productos', description: 'Administrá productos, servicios, precios y disponibilidad.', action: '＋ Nuevo producto',
    stats: [['Productos activos','148','12 categorías'],['Servicios','32','8 tipos de servicio'],['Valor del catálogo','$ 18.420.000','Costo total estimado']],
    columns: ['CÓDIGO','PRODUCTO','CATEGORÍA','PRECIO','STOCK','ESTADO'],
    rows: [['PR-001','Compresor 2 HP','Maquinaria','$ 840.000','8 u.','Activo'],['PR-018','Filtro industrial XL','Repuestos','$ 48.500','3 u.','Stock bajo'],['SV-004','Mantenimiento preventivo','Servicios','$ 185.000','—','Activo'],['PR-032','Tablero trifásico','Electricidad','$ 320.000','12 u.','Activo'],['PR-044','Aceite hidráulico 20 L','Insumos','$ 96.800','0 u.','Sin stock']]
  },
  clients: {
    eyebrow: 'RELACIONES', title: 'Clientes', description: 'Centralizá contactos, actividad comercial y cuentas corrientes.', action: '＋ Nuevo cliente',
    stats: [['Clientes activos','286','↑ 14 este mes'],['Saldo a cobrar','$ 3.420.000','5 cuentas pendientes'],['Facturación promedio','$ 486.000','Por cliente activo']],
    columns: ['CLIENTE','CONTACTO','TELÉFONO','ÚLTIMA ACTIVIDAD','SALDO','ESTADO'],
    rows: [['Metalúrgica Norte','compras@metalnorte.com','11 4568-2091','Factura · 28 sep','$ 0','Al día'],['Estudio Delta','admin@delta.com','11 3987-4410','Orden · 27 sep','$ 860.000','Pendiente'],['Comercial San Martín','pagos@csm.com','11 5521-9082','Factura · 18 sep','$ 680.000','Vencido'],['Industrias Rivera','contacto@rivera.com','11 4812-7740','Orden · 12 sep','$ 1.880.000','Pendiente'],['Servicios del Sur','hola@servsur.com','11 6077-1204','Pago · 25 sep','$ 0','Al día']]
  },
  cash: {
    eyebrow: 'TESORERÍA', title: 'Caja', description: 'Controlá ingresos, egresos y el saldo diario del negocio.', action: '＋ Nuevo movimiento',
    stats: [['Saldo disponible','$ 8.642.500','Caja y bancos'],['Ingresos de hoy','$ 1.284.000','18 movimientos'],['Egresos de hoy','$ 346.800','7 movimientos']],
    columns: ['FECHA','CONCEPTO','CUENTA','REFERENCIA','IMPORTE','TIPO'],
    rows: [['02 oct · 14:32','Cobro Metalúrgica Norte','Banco Galicia','FC 0001-1248','+$ 1.284.000','Ingreso'],['02 oct · 12:10','Compra de repuestos','Caja principal','OC-0841','-$ 186.500','Egreso'],['02 oct · 10:45','Pago de servicios','Banco Galicia','SERV-0926','-$ 98.300','Egreso'],['02 oct · 09:18','Adelanto Estudio Delta','Mercado Pago','OT-1027','+$ 240.000','Ingreso'],['01 oct · 17:40','Combustible vehículos','Caja principal','TKT-8831','-$ 62.000','Egreso']]
  },
  stock: {
    eyebrow: 'INVENTARIO', title: 'Stock', description: 'Supervisá existencias, depósitos y necesidades de reposición.', action: '＋ Registrar movimiento',
    stats: [['Unidades en stock','1.842','148 productos'],['Stock bajo','7','Requieren reposición'],['Sin stock','3','Productos no disponibles']],
    columns: ['PRODUCTO','DEPÓSITO','DISPONIBLE','MÍNIMO','ÚLTIMO MOVIMIENTO','ESTADO'],
    rows: [['Filtro industrial XL','Depósito central','3','10','Salida · Hoy','Stock bajo'],['Aceite hidráulico 20 L','Depósito central','0','6','Salida · Ayer','Sin stock'],['Tablero trifásico','Sucursal norte','12','4','Ingreso · 30 sep','Disponible'],['Correa tipo B-42','Depósito central','5','8','Salida · 29 sep','Stock bajo'],['Rodamiento 6205','Sucursal norte','38','12','Ingreso · 28 sep','Disponible']]
  }
};

function statusClass(value) {
  if (['Activo','Al día','Ingreso','Disponible'].includes(value)) return 'done';
  if (['Vencido','Sin stock','Egreso'].includes(value)) return 'overdue';
  return 'process';
}

function renderModule(key) {
  const config = moduleData[key];
  const content = document.querySelector('#moduleContent');
  document.querySelector('#moduleEyebrow').textContent = config?.eyebrow || (key === 'settings' ? 'SISTEMA' : 'SOPORTE');
  document.querySelector('#moduleTitle').textContent = config?.title || (key === 'settings' ? 'Configuración' : 'Centro de ayuda');
  document.querySelector('#moduleDescription').textContent = config?.description || (key === 'settings' ? 'Personalizá los datos y preferencias del espacio de trabajo.' : 'Encontrá respuestas y recursos para usar Nexo.');
  const action = document.querySelector('#moduleAction');
  if (key === 'settings') { action.textContent = 'Guardar cambios'; action.hidden = true; content.innerHTML = settingsTemplate(); bindSettings(); return; }
  if (key === 'help') { action.textContent = 'Contactar soporte'; action.hidden = false; action.onclick = () => showToast('Solicitud enviada al equipo de soporte'); content.innerHTML = helpTemplate(); bindHelp(); return; }
  action.hidden = false; action.textContent = config.action; action.onclick = () => showToast(`${config.action.replace('＋ ', '')}: formulario de demostración`);
  content.innerHTML = `<section class="module-grid">${config.stats.map(stat => `<article class="card module-stat"><span>${stat[0]}</span><strong>${stat[1]}</strong><small>${stat[2]}</small></article>`).join('')}</section><section class="card billing-panel"><div class="billing-toolbar"><div><h3>Listado general</h3><p>Datos actualizados del espacio de trabajo</p></div><div class="filters"><label class="mini-search">⌕ <input id="moduleSearch" type="search" placeholder="Buscar en ${config.title.toLowerCase()}"></label><button class="secondary" id="moduleExport">↓ Exportar</button></div></div><div class="table-wrap"><table class="invoice-table"><thead><tr>${config.columns.map(column => `<th>${column}</th>`).join('')}<th></th></tr></thead><tbody id="moduleBody">${config.rows.map(row => `<tr>${row.map((cell,index) => `<td>${index === row.length - 1 ? `<span class="status ${statusClass(cell)}">${cell}</span>` : cell}</td>`).join('')}<td><button class="row-menu">•••</button></td></tr>`).join('')}</tbody></table></div><div class="table-footer"><span id="moduleCount">Mostrando ${config.rows.length} registros</span><div><button disabled>‹</button><button class="active">1</button><button>›</button></div></div></section>`;
  document.querySelector('#moduleSearch').addEventListener('input', filterModuleRows);
  document.querySelector('#moduleExport').addEventListener('click', () => showExportDemo('Excel'));
  document.querySelectorAll('#moduleBody .row-menu').forEach(button => button.addEventListener('click', () => showToast('Opciones del registro')));
}

function filterModuleRows() {
  const query = document.querySelector('#moduleSearch').value.toLocaleLowerCase('es').trim();
  let visible = 0;
  document.querySelectorAll('#moduleBody tr').forEach(row => { row.hidden = !row.textContent.toLocaleLowerCase('es').includes(query); if (!row.hidden) visible++; });
  document.querySelector('#moduleCount').textContent = `Mostrando ${visible} registro${visible === 1 ? '' : 's'}`;
}

function settingsTemplate() { return `<div class="settings-layout"><aside class="card settings-menu"><button class="active">Datos del negocio</button><button>Facturación</button><button>Usuarios y permisos</button><button>Notificaciones</button><button>Integraciones</button></aside><section class="card settings-form"><h3>Datos del negocio</h3><p>Esta información aparecerá en documentos y comunicaciones.</p><div class="field-grid"><label>Nombre comercial<input value="Nexo Servicios"></label><label>Razón social<input value="Nexo Servicios S.R.L."></label><label>CUIT<input value="30-71234567-8"></label><label>Condición fiscal<select><option>Responsable inscripto</option></select></label></div><label class="wide-field">Dirección<input value="Av. Corrientes 1240, CABA"></label><div class="activity"><i>✓</i><span><b>Notificaciones por correo</b><small>Recibir alertas de vencimientos y stock bajo</small></span><span class="switch"><i></i></span></div><div class="settings-actions"><button class="primary" id="saveSettings">Guardar cambios</button></div></section></div>`; }
function bindSettings() { document.querySelectorAll('.settings-menu button').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.settings-menu button').forEach(item => item.classList.remove('active')); button.classList.add('active'); showToast(`${button.textContent}: sección de demostración`); })); document.querySelector('#saveSettings').addEventListener('click', () => showToast('Configuración guardada correctamente')); }
function helpTemplate() { return `<section class="help-search"><h2>¿Cómo podemos ayudarte?</h2><p>Buscá una guía o explorá los temas más consultados.</p><label>⌕ <input id="helpSearch" placeholder="Ej. crear una factura, controlar stock..."></label></section><section class="help-topics"><button class="card help-topic"><span>▤</span><h3>Primeros pasos</h3><p>Configurá tu cuenta y comenzá a usar el sistema.</p></button><button class="card help-topic"><span>$</span><h3>Facturación y cobros</h3><p>Comprobantes, pagos y cuentas corrientes.</p></button><button class="card help-topic"><span>☷</span><h3>Órdenes de trabajo</h3><p>Planificación, responsables y entregas.</p></button><button class="card help-topic"><span>◫</span><h3>Productos y stock</h3><p>Catálogo, depósitos y movimientos.</p></button><button class="card help-topic"><span>◎</span><h3>Clientes</h3><p>Contactos, historial y saldos.</p></button><button class="card help-topic"><span>⚙</span><h3>Configuración</h3><p>Usuarios, permisos e integraciones.</p></button></section>`; }
function bindHelp() { document.querySelectorAll('.help-topic').forEach(button => button.addEventListener('click', () => showToast(`Abriendo ayuda: ${button.querySelector('h3').textContent}`))); document.querySelector('#helpSearch').addEventListener('keydown', event => { if (event.key === 'Enter') showToast(`Buscando ayuda sobre “${event.target.value}”`); }); }
