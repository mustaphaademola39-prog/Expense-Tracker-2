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
const budgetLimit = document.getElementById('budgetLimit');
const budgetWarning = document.getElementById('budgetWarning');
const searchInput = document.getElementById('searchInput');
const categorySummary = document.getElementById('categorySummary');

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

  totalAmount.textContent = formatNaira(total);
  metricCount.textContent = count;
  metricAvg.textContent = formatNaira(avg);
  metricHighest.textContent = formatNaira(highest);

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

render();
switchPage('dashboard');
