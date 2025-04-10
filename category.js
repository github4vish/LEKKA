// category.js - Optimized with shared utils.js

function renderTransactionsList(transactions) {
  const list = document.getElementById("transactionsList");
  list.innerHTML = transactions.length ? "" : `<div class="text-muted text-center">No transactions recorded.</div>`;

  transactions.forEach((tx, index) => {
    const date = new Date(tx.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const icon = tx.icon || "bi-tag";
    const arrow = tx.type === "Expense" ? "bi-arrow-up-circle text-danger" : "bi-arrow-down-circle text-success";
    const amountClass = tx.type === "Expense" ? "text-danger" : "text-success";
    const name = tx.paidTo || tx.receivedFrom || "Unknown";

    const item = document.createElement("div");
    item.className = "list-group-item d-flex justify-content-between align-items-center";
    item.style.cursor = "pointer";
    item.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi ${icon} me-2 fs-5 text-primary"></i>
        <div><div class="fw-semibold">${name}</div></div>
      </div>
      <div class="text-end">
        <div class="small text-muted">${date}</div>
        <div><i class="bi ${arrow}"></i> <div class="fw-bold ${amountClass}">₹${+tx.amount}</div></div>
      </div>`;

    item.onclick = () => showTransactionModal(tx, index, transactions);
    list.appendChild(item);
  });
}

function showTransactionModal(tx, index, transactions) {
  const body = document.getElementById("transactionModalBody");
  const modal = new bootstrap.Modal(document.getElementById("transactionModal"));
  document.getElementById("transactionModalLabel").textContent = tx.type === "Expense" ? "Debit Transaction" : "Credit Transaction";

  const tags = Array.isArray(tx.tags) ? tx.tags.join(", ") : tx.tags || "";
  body.innerHTML = `
    <div class="d-flex justify-content-end">
      <button class="btn btn-outline-danger btn-sm" onclick="deleteTransaction(${index})"><i class="bi bi-trash"></i> Delete</button>
    </div>
    <div class="card mt-3 text-center">
      <div class="card-body">
        <h5 class="text-muted">${tx.paidTo || tx.receivedFrom || "Unknown"}</h5>
        <h1 class="fw-bold">₹${+tx.amount}</h1>
        <p><i class="bi ${tx.icon || 'bi-tag'} me-1"></i> ${tx.category}</p>
      </div>
    </div>
    <div class="card mt-2"><div class="card-body"><strong>Notes:</strong><p>${tx.notes || "-"}</p></div></div>
    <div class="card mt-2"><div class="card-body"><strong>Tags:</strong><p>${tags || "-"}</p></div></div>
    <div class="card mt-2"><div class="card-body text-center">
      ${tx.image ? `<img src="${tx.image}" class="img-fluid rounded">` : "<p>No image uploaded.</p>"}
    </div></div>`;
  modal.show();
}

function deleteTransaction(index) {
  const txs = getTransactions();
  txs.splice(index, 1);
  localStorage.setItem("transactions", JSON.stringify(txs));
  bootstrap.Modal.getInstance(document.getElementById("transactionModal")).hide();
  location.reload();
}

function renderCategoryBreakdown(transactions) {
  const incomeMap = {}, expenseMap = {}, allCats = new Set();
  transactions.forEach(tx => {
    const cat = tx.category;
    if (!cat) return;
    allCats.add(cat);
    const amt = +tx.amount;
    if (tx.type === "Income") incomeMap[cat] = (incomeMap[cat] || 0) + amt;
    if (tx.type === "Expense") expenseMap[cat] = (expenseMap[cat] || 0) + amt;
  });

  const labels = [...allCats];
  const incomeData = labels.map(cat => incomeMap[cat] || 0);
  const expenseData = labels.map(cat => expenseMap[cat] || 0);

  const ctx = document.getElementById("mainRadarChart").getContext("2d");
  if (window.mainRadarChartInstance) window.mainRadarChartInstance.destroy();

  window.mainRadarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: incomeData, backgroundColor: 'rgba(13,110,253,0.2)', borderColor: '#0d6efd', borderWidth: 2 },
        { label: 'Expense', data: expenseData, backgroundColor: 'rgba(220,53,69,0.2)', borderColor: '#dc3545', borderWidth: 2 }
      ]
    },
    options: {
      responsive: true,
      scales: { r: { angleLines: { display: true }, beginAtZero: true } },
      plugins: { legend: { position: 'top' } }
    }
  });

  renderCategoryCards("incomeCategoryCards", incomeMap, incomeData);
  renderCategoryCards("expenseCategoryCards", expenseMap, expenseData);
}

function renderCategoryCards(containerId, dataMap, allData) {
  const container = document.getElementById(containerId);
  const total = allData.reduce((a, b) => a + b, 0);
  container.innerHTML = "";

  Object.entries(dataMap).forEach(([cat, amt]) => {
    const percent = ((amt / total) * 100).toFixed(1);
    const card = document.createElement("div");
    card.className = "col-md-4 mb-3";
    card.innerHTML = `
      <div class="card shadow-sm h-100">
        <div class="card-body text-center">
          <canvas id="mini-${cat}" width="100" height="100"></canvas>
          <h6 class="mt-2">${cat}</h6>
          <p class="mb-0">₹${amt.toFixed(2)} / ₹${total.toFixed(2)} (${percent}%)</p>
        </div>
      </div>`;
    container.appendChild(card);

    const miniCtx = document.getElementById(`mini-${cat}`).getContext("2d");
    new Chart(miniCtx, {
      type: 'doughnut',
      data: {
        labels: [cat, "Remaining"],
        datasets: [{ data: [amt, total - amt], backgroundColor: ['#36a2eb', '#e0e0e0'] }]
      },
      options: { plugins: { legend: { display: false } }, cutout: "70%" }
    });
  });
}

function renderMerchants(transactions) {
  const merchantList = document.getElementById("merchantList");
  merchantList.innerHTML = "";
  const merchantTotals = { Income: {}, Expense: {} };

  transactions.forEach(tx => {
    const name = tx.paidTo?.trim();
    if (!name) return;
    merchantTotals[tx.type][name] = (merchantTotals[tx.type][name] || 0) + +tx.amount;
  });

  const renderGroup = (label, data, color) => {
    if (!Object.keys(data).length) return;
    merchantList.innerHTML += `<h6 class="text-muted mt-3">${label} Merchants</h6>`;
    Object.entries(data).forEach(([name, total]) => {
      merchantList.innerHTML += `
        <div class="list-group-item d-flex justify-content-between">
          <span>${name}</span>
          <span class="fw-bold ${color}">₹${total.toFixed(2)}</span>
        </div>`;
    });
  };

  renderGroup("Income", merchantTotals.Income, "text-success");
  renderGroup("Expense", merchantTotals.Expense, "text-danger");
}

window.addEventListener("DOMContentLoaded", () => {
  const { from, to } = getQueryParams();
  const txs = filterTransactionsInRange(getTransactions(), from, to);

  renderTransactionsList(txs);
  renderCategoryBreakdown(txs);
  renderMerchants(txs);

  const summary = calculateSummary(txs);
  document.getElementById("incomeTotal").innerText = summary.income.toFixed(2);
  document.getElementById("expenseTotal").innerText = summary.expense.toFixed(2);
  document.getElementById("balanceTotal").innerText = summary.balance.toFixed(2);
  document.getElementById("dateRangeDisplay").innerText = `${from} → ${to}`;
});

function exportToCSV() {
  const { from, to } = getQueryParams();
  const txs = filterTransactionsInRange(getTransactions(), from, to);
  exportTransactionsToCSV(txs);
}
