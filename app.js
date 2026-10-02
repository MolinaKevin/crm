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
    const placeholders = { Facturación: 'Buscar comprobantes...', 'Órdenes de trabajo': 'Buscar órdenes...' };
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
document.querySelector('#exportInvoices').addEventListener('click', () => showToast('Exportación preparada (datos de demostración)'));
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
