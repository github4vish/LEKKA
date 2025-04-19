// dashboard.js - Modular JavaScript for LEKKA Dashboard
// Requires utils.js to be loaded before this script

// 📊 Aggregation by filter
const aggregators = {
  month: () => aggregateBy("month", 12, tx => new Date(tx.date).getMonth()),
  day: () => aggregateBy("day", 7, tx => new Date(tx.date).getDay()),
  week: () => aggregateBy("week", 4, tx => Math.min(Math.floor((new Date(tx.date).getDate() - 1) / 7), 3)),
  quarter: () => aggregateBy("quarter", 4, tx => Math.floor(new Date(tx.date).getMonth() / 3)),
  custom: (start, end) => aggregateByDateRange(start, end)
};

function aggregateBy(type, count, groupFn) {
  const txs = getTransactions();
  const expense = Array(count).fill(0);
  const income = Array(count).fill(0);

  txs.forEach(tx => {
    const index = groupFn(tx);
    if (index >= 0 && index < count) {
      if (tx.type === "Expense") expense[index] += +tx.amount;
      if (tx.type === "Income") income[index] += +tx.amount;
    }
  });

  return { labels: getLabels(type), expense, income };
}

function aggregateByDateRange(start, end) {
  const txs = filterTransactionsInRange(getTransactions(), start, end);
  const grouped = {};

  txs.forEach(tx => {
    const key = formatDate(tx.date);
    if (!grouped[key]) grouped[key] = { expense: 0, income: 0 };
    if (tx.type === "Expense") grouped[key].expense += +tx.amount;
    if (tx.type === "Income") grouped[key].income += +tx.amount;
  });

  const labels = Object.keys(grouped).sort();
  return {
    labels,
    expense: labels.map(d => grouped[d].expense),
    income: labels.map(d => grouped[d].income)
  };
}

function getLabels(type) {
  switch (type) {
    case "month": return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    case "day": return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    case "week": return ["Week 1", "Week 2", "Week 3", "Week 4"];
    case "quarter": return ["Q1", "Q2", "Q3", "Q4"];
    default: return [];
  }
}

let expenseIncomeChart;
function initializeChart() {
  const ctx = document.getElementById("expenseIncomeChart").getContext("2d");
  const { labels, expense, income } = aggregators.month();
  const currentMonth = new Date().getMonth();

  expenseIncomeChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Expense",
          data: expense,
          backgroundColor: (ctx) => ctx.dataIndex === currentMonth ? "red" : "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1
        },
        {
          label: "Income",
          data: income,
          type: "line",
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderWidth: 2,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: true } }
    }
  });
  updateSummary("month");
}

function updateChart() {
  const filter = document.getElementById("filterSelect").value;
  const customStart = document.getElementById("startDate")?.value;
  const customEnd = document.getElementById("endDate")?.value;

  const { labels, expense, income } =
    filter === "custom" && customStart && customEnd
      ? aggregators.custom(customStart, customEnd)
      : aggregators[filter]();

  expenseIncomeChart.data.labels = labels;
  expenseIncomeChart.data.datasets[0].data = expense;
  expenseIncomeChart.data.datasets[1].data = income;
  expenseIncomeChart.update();

  updateSummary(filter);
}

function updateSummary(filter) {
  const now = new Date();
  let index = now.getMonth();

  if (filter === "day") index = now.getDay();
  if (filter === "week") index = Math.min(Math.floor((now.getDate() - 1) / 7), 3);
  if (filter === "quarter") index = Math.floor(now.getMonth() / 3);

  const expenses = expenseIncomeChart.data.datasets[0].data;
  const incomes = expenseIncomeChart.data.datasets[1].data;

  document.getElementById("expenseValue").innerText = expenses[index]?.toFixed(2) || 0;
  document.getElementById("incomeValue").innerText = incomes[index]?.toFixed(2) || 0;
}

function searchTransactions() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const results = document.getElementById("searchResults");
  const transactions = getTransactions();

  results.innerHTML = "";

  const filtered = transactions.filter(tx =>
    tx.category?.toLowerCase().includes(keyword) ||
    tx.paidTo?.toLowerCase().includes(keyword) ||
    tx.date?.toLowerCase().includes(keyword) ||
    tx.amount.toString().includes(keyword)
  );

  if (filtered.length === 0) {
    results.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No transactions found</td></tr>`;
  } else {
    filtered.forEach(tx => {
      results.innerHTML += `
        <tr>
          <td>${tx.date}</td>
          <td>${tx.category}</td>
          <td>${tx.type === "Income" ? "+" : "-"} ₹${tx.amount}</td>
          <td>${tx.paidTo}</td>
        </tr>`;
    });
  }
}

function updateReviewButton() {
  const filter = document.getElementById("filterSelect").value;
  const range = getDateRangeForFilter(filter);

  let label = "";

  if (filter === "custom") {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    label = `${formatDate(start)} to ${formatDate(end)}`;
  } else {
    label = `${capitalizeFirstLetter(filter)} (${range.from} to ${range.to})`;
  }

  const btn = document.getElementById("reviewButton");
  btn.innerText = `Review ${label}`;
  btn.onclick = () => {
    window.location.href = `category.html?filter=${filter}&from=${range.from}&to=${range.to}`;
  };
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function onFilterChange() {
  const isCustom = document.getElementById("filterSelect").value === "custom";
  document.getElementById("customDateRange").style.display = isCustom ? "flex" : "none";
  if (!isCustom) updateChart();
  updateReviewButton();

}

function toggleIncome() {
  const income = expenseIncomeChart.data.datasets[1];
  income.hidden = !income.hidden;
  expenseIncomeChart.update();
}

function toggleExpense() {
  const expense = expenseIncomeChart.data.datasets[0];
  expense.hidden = !expense.hidden;
  expenseIncomeChart.update();
}

document.addEventListener("DOMContentLoaded", () => {
  initializeChart();
  updateReviewButton();
});
