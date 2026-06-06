const expenses = [];

const nameInput = document.getElementById('expenseName');
const amountInput = document.getElementById('expenseAmount');
const categorySelect = document.getElementById('expenseCategory');
const addBtn = document.getElementById('addBtn');
const errorMsg = document.getElementById('errorMsg');
const expenseList = document.getElementById('expenseList');
const totalAmount = document.getElementById('totalAmount');
const metricCount = document.getElementById('metricCount');
const metricAvg = document.getElementById('metricAvg');
const metricHighest = document.getElementById('metricHighest');
const metricMonth = document.getElementById('metricMonth');
const metricYear = document.getElementById('metricYear');
const metricTopCat = document.getElementById('metricTopCat');
const budgetLimit = document.getElementById('budgetLimit');
const budgetWarning = document.getElementById('budgetWarning');
const searchInput = document.getElementById('searchInput');
const categorySummary = document.getElementById('categorySummary');
const quickAmount = document.getElementById('quickAmount');
const quickName = document.getElementById('quickName');
const quickCategory = document.getElementById('quickCategory');
const quickEnterBtn = document.getElementById('quickEnterBtn');

const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const navLinks = document.querySelectorAll('.sidebar-nav a');
const pages = document.querySelectorAll('.page');
const sidebarBudget = document.getElementById('sidebarBudget');
const progressFill = document.getElementById('progressFill');
const filterCategory = document.getElementById('filterCategory');
const dateBtns = document.querySelectorAll('.date-btn');
const clearAllBtn = document.getElementById('clearAllBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const closeModal = document.getElementById('closeModal');

let currentPage = 'dashboard';
let dateFilter = 'all';

function formatNaira(amount) {
  return '₦' + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getToday() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseDate(str) {
  const parts = str.split('/');
  return new Date(+parts[2], +parts[1] - 1, +parts[0]);
}

function isToday(date) {
  const d = parseDate(date);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

function isThisWeek(date) {
  const d = parseDate(date);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return d >= startOfWeek && d <= endOfWeek;
}

function isThisMonth(date) {
  const d = parseDate(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isThisYear(date) {
  const d = parseDate(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear();
}

function getFilteredExpenses() {
  const cat = filterCategory.value;
  return expenses.filter(e => {
    if (cat && e.category !== cat) return false;
    if (dateFilter === 'today' && !isToday(e.date)) return false;
    if (dateFilter === 'week' && !isThisWeek(e.date)) return false;
    if (dateFilter === 'month' && !isThisMonth(e.date)) return false;
    return true;
  });
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = getFilteredExpenses().filter(e =>
    e.name.toLowerCase().includes(query) ||
    e.category.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    expenseList.innerHTML = `<div class="empty-state">${
      expenses.length === 0 ? 'No expenses yet. Add one above!' : 'No expenses match your search or filters.'
    }</div>`;
  } else {
    expenseList.innerHTML = filtered.map((e, i) => {
      const realIndex = expenses.indexOf(e);
      return `
        <div class="expense-item">
          <div class="expense-info">
            <span class="expense-name">${escapeHtml(e.name)}</span>
            <span class="expense-category">${e.category}</span>
            <span class="expense-amount">${formatNaira(e.amount)}</span>
            <span class="expense-date">${e.date}</span>
          </div>
          <button class="expense-delete" data-index="${realIndex}">Delete</button>
        </div>
      `;
    }).join('');
  }

  document.querySelectorAll('.expense-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      expenses.splice(idx, 1);
      render();
      updateTotal();
    });
  });

  updateTotal();
  updateSummary();
  refreshPeriodViews();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateTotal() {
  const count = expenses.length;
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avg = count > 0 ? total / count : 0;
  const highest = count > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;
  const monthTotal = expenses.filter(e => isThisMonth(e.date)).reduce((s, e) => s + e.amount, 0);
  const yearTotal = expenses.filter(e => isThisYear(e.date)).reduce((s, e) => s + e.amount, 0);
  const cats = {};
  expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
  let topCat = '—';
  let topAmt = 0;
  Object.keys(cats).forEach(c => {
    if (cats[c] > topAmt) { topAmt = cats[c]; topCat = c; }
  });

  totalAmount.textContent = formatNaira(total);
  metricCount.textContent = count;
  metricAvg.textContent = formatNaira(avg);
  metricHighest.textContent = formatNaira(highest);
  metricMonth.textContent = formatNaira(monthTotal);
  metricYear.textContent = formatNaira(yearTotal);
  metricTopCat.textContent = topCat !== '—' ? `${topCat} (${formatNaira(topAmt)})` : '—';

  const limit = parseFloat(budgetLimit.value);
  const overBudget = !isNaN(limit) && limit > 0 && total > limit;
  if (overBudget) {
    totalAmount.classList.add('over-budget');
    budgetWarning.classList.remove('hidden');
  } else {
    totalAmount.classList.remove('over-budget');
    budgetWarning.classList.add('hidden');
  }

  if (!isNaN(limit) && limit > 0) {
    const pct = Math.min((total / limit) * 100, 100);
    sidebarBudget.innerHTML = `${formatNaira(total)} of ${formatNaira(limit)}`;
    progressFill.style.width = pct + '%';
    if (overBudget) {
      progressFill.classList.add('over-budget');
    } else {
      progressFill.classList.remove('over-budget');
    }
  } else {
    sidebarBudget.innerHTML = `${formatNaira(total)} of ₦0.00`;
    progressFill.style.width = '0%';
    progressFill.classList.remove('over-budget');
  }
}

function updateSummary() {
  const cats = {};
  expenses.forEach(e => {
    cats[e.category] = (cats[e.category] || 0) + e.amount;
  });

  const allCats = ['Food', 'Transport', 'Rent', 'Data', 'Shopping', 'Others'];
  let html = '';
  allCats.forEach(cat => {
    const amt = cats[cat] || 0;
    html += `<div class="summary-item"><span>${cat}:</span><span>${formatNaira(amt)}</span></div>`;
  });
  categorySummary.innerHTML = html;

  renderMonthlyBreakdown();
  renderYearlyBreakdown();
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function renderMonthlyBreakdown() {
  const groups = {};
  expenses.forEach(e => {
    const d = parseDate(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    groups[key] = (groups[key] || 0) + e.amount;
  });
  const keys = Object.keys(groups).sort();
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let html = '';
  if (keys.length === 0) {
    html = '<div class="empty-state">No expenses recorded yet.</div>';
  } else {
    keys.forEach(key => {
      const [y, m] = key.split('-');
      const label = `${monthNames[+m - 1]} ${y}`;
      const isCurrent = key === currentKey;
      html += `<div class="breakdown-item${isCurrent ? ' highlight' : ''}">
        <span class="breakdown-label">${label}${isCurrent ? ' (current)' : ''}</span>
        <span class="breakdown-amount">${formatNaira(groups[key])}</span>
      </div>`;
    });
  }
  document.getElementById('monthlyBreakdown').innerHTML = html;
}

function renderYearlyBreakdown() {
  const groups = {};
  expenses.forEach(e => {
    const d = parseDate(e.date);
    const key = `${d.getFullYear()}`;
    groups[key] = (groups[key] || 0) + e.amount;
  });
  const keys = Object.keys(groups).sort();
  const now = new Date();
  const currentYear = `${now.getFullYear()}`;
  let html = '';
  if (keys.length === 0) {
    html = '<div class="empty-state">No expenses recorded yet.</div>';
  } else {
    keys.forEach(key => {
      const isCurrent = key === currentYear;
      html += `<div class="breakdown-item${isCurrent ? ' highlight' : ''}">
        <span class="breakdown-label">${key}${isCurrent ? ' (current)' : ''}</span>
        <span class="breakdown-amount">${formatNaira(groups[key])}</span>
      </div>`;
    });
  }
  document.getElementById('yearlyBreakdown').innerHTML = html;
}

function addExpense() {
  const name = nameInput.value.trim();
  const rawAmount = amountInput.value.trim();
  const category = categorySelect.value;

  if (!name) {
    errorMsg.textContent = 'Please enter an expense name.';
    nameInput.focus();
    return;
  }

  if (!category) {
    errorMsg.textContent = 'Please select a category.';
    categorySelect.focus();
    return;
  }

  if (!rawAmount) {
    errorMsg.textContent = 'Please enter an amount.';
    amountInput.focus();
    return;
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    errorMsg.textContent = 'Please enter a valid positive number for the amount.';
    amountInput.value = '';
    amountInput.focus();
    return;
  }

  errorMsg.textContent = '';

  expenses.push({
    name,
    amount,
    category,
    date: getToday(),
  });

  nameInput.value = '';
  amountInput.value = '';
  categorySelect.value = '';
  nameInput.focus();

  render();
}

function switchPage(page) {
  currentPage = page;
  pages.forEach(p => p.classList.add('hidden'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.remove('hidden');

  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  if (page === 'monthly') renderMonthlyView();
  if (page === 'yearly') renderYearlyView();

  if (window.innerWidth <= 768) {
    closeMenu();
  }
}

function openMenu() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

addBtn.addEventListener('click', addExpense);

[nameInput, amountInput, categorySelect].forEach(el => {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') addExpense();
  });
});

budgetLimit.addEventListener('input', updateTotal);

searchInput.addEventListener('input', render);

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    switchPage(link.dataset.page);
  });
});

menuToggle.addEventListener('click', openMenu);

closeSidebar.addEventListener('click', closeMenu);

sidebarOverlay.addEventListener('click', closeMenu);

filterCategory.addEventListener('change', render);

dateBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    dateBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    dateFilter = btn.dataset.date;
    render();
  });
});

document.getElementById('monthSelect').addEventListener('change', function() {
  selectedMonthKey = this.value;
  renderMonthlyView();
});

document.getElementById('yearSelect').addEventListener('change', function() {
  selectedYearKey = this.value;
  renderYearlyView();
});

clearAllBtn.addEventListener('click', () => {
  if (expenses.length === 0) return;
  if (confirm('Are you sure you want to delete all expenses? This cannot be undone.')) {
    expenses.length = 0;
    render();
  }
});

darkModeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-mode', darkModeToggle.checked);
});

aboutBtn.addEventListener('click', () => {
  aboutModal.classList.remove('hidden');
  if (window.innerWidth <= 768) closeMenu();
});

closeModal.addEventListener('click', () => {
  aboutModal.classList.add('hidden');
});

aboutModal.addEventListener('click', e => {
  if (e.target === aboutModal) aboutModal.classList.add('hidden');
});

let selectedMonthKey = '';
let selectedYearKey = '';

function getMonthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getAvailableMonths() {
  const set = new Set();
  expenses.forEach(e => set.add(getMonthKey(parseDate(e.date))));
  return Array.from(set).sort();
}

function getAvailableYears() {
  const set = new Set();
  expenses.forEach(e => set.add(`${parseDate(e.date).getFullYear()}`));
  return Array.from(set).sort();
}

function renderMonthlyView() {
  const keys = getAvailableMonths();
  const select = document.getElementById('monthSelect');
  const now = new Date();
  const currentKey = getMonthKey(now);

  if (!selectedMonthKey || !keys.includes(selectedMonthKey)) {
    selectedMonthKey = keys.includes(currentKey) ? currentKey : (keys[keys.length - 1] || '');
  }

  select.innerHTML = keys.map(k => {
    const [y, m] = k.split('-');
    const label = `${monthNames[+m - 1]} ${y}`;
    return `<option value="${k}"${k === selectedMonthKey ? ' selected' : ''}>${label}</option>`;
  }).join('');

  if (!selectedMonthKey) {
    document.getElementById('monthlyTotal').textContent = '₦0.00';
    document.getElementById('monthlyCount').textContent = '0';
    document.getElementById('monthlyHighest').textContent = '₦0.00';
    document.getElementById('monthlyViewContent').innerHTML = '<div class="empty-state">No expenses recorded yet.</div>';
    return;
  }

  const monthExpenses = expenses.filter(e => getMonthKey(parseDate(e.date)) === selectedMonthKey);
  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const highest = monthExpenses.length ? Math.max(...monthExpenses.map(e => e.amount)) : 0;

  document.getElementById('monthlyTotal').textContent = formatNaira(total);
  document.getElementById('monthlyCount').textContent = monthExpenses.length;
  document.getElementById('monthlyHighest').textContent = formatNaira(highest);

  const [selY, selM] = selectedMonthKey.split('-');
  const selLabel = `${monthNames[+selM - 1]} ${selY}`;
  const isCurrent = selectedMonthKey === currentKey;

  let html = '';
  html += `<div class="month-group${isCurrent ? '' : ' collapsed'}">`;
  html += `<div class="month-header" onclick="toggleMonth(this)">`;
  html += `<div class="month-header-left">`;
  html += `<span class="month-name">${selLabel}</span>`;
  html += `<span class="month-summary">${monthExpenses.length} transaction${monthExpenses.length !== 1 ? 's' : ''}</span>`;
  html += `</div>`;
  html += `<span class="month-toggle-icon">▼</span>`;
  html += `</div>`;
  html += `<div class="month-body">`;
  monthExpenses.forEach(e => {
    html += `<div class="month-expense">
      <div class="month-expense-info">
        <span class="month-expense-name">${escapeHtml(e.name)}</span>
        <span class="month-expense-category">${e.category}</span>
        <span class="month-expense-date">${e.date}</span>
      </div>
      <span class="month-expense-amount">${formatNaira(e.amount)}</span>
    </div>`;
  });
  html += `<div class="month-footer">
    <span class="month-footer-total">Total: ${formatNaira(total)}</span>
    <span class="month-footer-count">${monthExpenses.length} transaction${monthExpenses.length !== 1 ? 's' : ''}</span>
  </div>`;
  html += `</div></div>`;

  document.getElementById('monthlyViewContent').innerHTML = html;
}

function renderYearlyView() {
  const years = getAvailableYears();
  const select = document.getElementById('yearSelect');
  const now = new Date();
  const currentYear = `${now.getFullYear()}`;

  if (!selectedYearKey || !years.includes(selectedYearKey)) {
    selectedYearKey = years.includes(currentYear) ? currentYear : (years[years.length - 1] || '');
  }

  select.innerHTML = years.map(y =>
    `<option value="${y}"${y === selectedYearKey ? ' selected' : ''}>${y}</option>`
  ).join('');

  if (!selectedYearKey) {
    document.getElementById('yearlyTotal').textContent = '₦0.00';
    document.getElementById('yearlyCount').textContent = '0';
    document.getElementById('yearlyHighest').textContent = '₦0.00';
    document.getElementById('yearlyViewContent').innerHTML = '<div class="empty-state">No expenses recorded yet.</div>';
    return;
  }

  const yearExpenses = expenses.filter(e => `${parseDate(e.date).getFullYear()}` === selectedYearKey);
  const total = yearExpenses.reduce((s, e) => s + e.amount, 0);
  const highest = yearExpenses.length ? Math.max(...yearExpenses.map(e => e.amount)) : 0;

  document.getElementById('yearlyTotal').textContent = formatNaira(total);
  document.getElementById('yearlyCount').textContent = yearExpenses.length;
  document.getElementById('yearlyHighest').textContent = formatNaira(highest);

  const monthTotals = {};
  yearExpenses.forEach(e => {
    const d = parseDate(e.date);
    const mk = `${d.getMonth()}`;
    monthTotals[mk] = (monthTotals[mk] || 0) + e.amount;
  });

  let maxAmt = -1, minAmt = Infinity, maxM = '', minM = '';
  for (let i = 0; i < 12; i++) {
    const amt = monthTotals[`${i}`] || 0;
    if (amt > maxAmt) { maxAmt = amt; maxM = `${i}`; }
    if (amt < minAmt) { minAmt = amt; minM = `${i}`; }
  }

  let html = `<div class="year-group">
    <div class="year-header">${selectedYearKey}</div>
    <div class="year-month-list">`;

  for (let i = 0; i < 12; i++) {
    const amt = monthTotals[`${i}`] || 0;
    let cls = '';
    if (amt > 0) {
      if (`${i}` === maxM && maxAmt > 0) cls = ' highest';
      if (`${i}` === minM && maxAmt !== minAmt) cls = ' lowest';
    }
    html += `<div class="year-month-item${cls}">
      <span class="ym-label">${monthNames[i]}</span>
      <span class="ym-amount">${formatNaira(amt)}</span>
    </div>`;
  }

  html += `</div>
    <div class="year-footer">
      <span class="year-grand-total">Grand Total: ${formatNaira(total)}</span>
      <span class="year-footer-count">${yearExpenses.length} transaction${yearExpenses.length !== 1 ? 's' : ''}</span>
    </div>
  </div>`;

  document.getElementById('yearlyViewContent').innerHTML = html;
}

function toggleMonth(header) {
  header.parentElement.classList.toggle('collapsed');
}

function refreshPeriodViews() {
  if (currentPage === 'monthly') renderMonthlyView();
  if (currentPage === 'yearly') renderYearlyView();
}

let quickTotal = 0;

function updateQuickDisplay() {
  quickAmount.textContent = formatNaira(quickTotal);
  quickAmount.style.color = quickTotal >= 0 ? '#43D9A2' : '#FF6B6B';
}

document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = parseInt(btn.dataset.value, 10);
    quickTotal = Math.max(0, quickTotal + val);
    updateQuickDisplay();
  });
});

quickEnterBtn.addEventListener('click', () => {
  const name = quickName.value.trim();
  const category = quickCategory.value;

  if (!name) { quickName.focus(); return; }
  if (!category) { quickCategory.focus(); return; }
  if (quickTotal <= 0) return;

  expenses.push({ name, amount: quickTotal, category, date: getToday() });
  quickName.value = '';
  quickCategory.value = '';
  quickTotal = 0;
  updateQuickDisplay();
  render();
  switchPage('expenses');
});

[quickName, quickCategory].forEach(el => {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') quickEnterBtn.click();
  });
});

render();
switchPage('dashboard');
