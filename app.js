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
  if (item.dataset.page !== 'Resumen') showToast(`${item.dataset.page}: vista de demostración`);
}));

const searchInput = document.querySelector('#searchInput');
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLocaleLowerCase('es').trim();
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
  form.reset(); dialog.close(); showToast(`Orden #OT-${id} creada correctamente`);
});
