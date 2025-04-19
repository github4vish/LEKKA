
import "./util.js";
// category.js - Cleaned and Optimized

document.getElementById("nav-categories-tab").addEventListener("click", renderCategoryBreakdown);
document.getElementById("nav-merchants-tab").addEventListener("click", renderMerchants);
document.getElementById("nav-transactions-tab").addEventListener("click", renderTransactionsList);

// Load default categories on page load
window.addEventListener("DOMContentLoaded", loadCategories);

// Load categories based on type
function loadCategories() {
  const type = document.getElementById("transactionType").value;
  const container = document.getElementById("categoryButtons");

  document.getElementById("amountLabel").textContent = type === "Income" ? "Amount Credited" : "Amount Spent";
  document.getElementById("paidToLabel").textContent = type === "Income" ? "Received From" : "Paid To";

  const incomeCategories = [
    "A/C Transfer", "Bank Deposit", "Bill Payment", "Business", "Credit", "Interest",
    "Investment", "Loan", "Recharge", "Refund", "Reimbursement", "Rewards", "Salary"
  ];

  const expenseCategories = [
    "Bills", "EMI", "Entertainment", "Food & Drinks", "Fuel", "Groceries",
    "Health", "Investment", "Other", "Shopping", "Transfer", "Travel", "Gift", "Service"
  ];

  const icons = {
    "Bills": "bi-receipt", "EMI": "bi-credit-card", "Entertainment": "bi-film",
    "Food & Drinks": "bi-cup-straw", "Fuel": "bi-fuel-pump", "Groceries": "bi-basket",
    "Health": "bi-heart-pulse", "Investment": "bi-graph-up-arrow", "Other": "bi-tags",
    "Shopping": "bi-bag", "Transfer": "bi-arrow-left-right", "Travel": "bi-airplane",
    "Gift": "bi-gift", "Service": "bi-wrench", "Salary": "bi-currency-dollar",
    "Business": "bi-briefcase", "Loan": "bi-bank", "Refund": "bi-arrow-repeat",
    "Rewards": "bi-trophy", "Credit": "bi-piggy-bank"
  };

  const categories = type === "Income" ? incomeCategories : expenseCategories;
  container.innerHTML = "";

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-outline-primary";
    btn.setAttribute("onclick", "selectCategory(this)");
    btn.innerHTML = `<i class="bi ${icons[cat] || 'bi-tag'}"></i> ${cat}`;
    container.appendChild(btn);
  });
}

// Render transactions
function renderTransactionsList() {
  const transactions = getFilteredTransactions();
  const list = document.getElementById("transactionsList");
  list.innerHTML = "";

  if (transactions.length === 0) {
    list.innerHTML = `<div class="text-muted text-center">No transactions recorded.</div>`;
    return;
  }

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
        <div><i class="bi ${arrow}"></i> <div class="fw-bold ${amountClass}">₹${parseFloat(tx.amount).toFixed(2)}</div></div>
      </div>
    `;
    item.onclick = () => showTransactionModal(tx, index, transactions);
    list.appendChild(item);
  });
}

// Modal for transaction detail
function showTransactionModal(tx, index) {
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
    <div class="card mt-2"><div class="card-body"><strong>Tags:</strong><p>${tags}</p></div></div>
    <div class="card mt-2"><div class="card-body text-center">
      ${tx.image ? `<img src="${tx.image}" class="img-fluid rounded">` : "<p>No image uploaded.</p>"}
    </div></div>`;
  
  modal.show();
}

// Delete transaction
function deleteTransaction(index) {
  const txs = getFilteredTransactions();
  txs.splice(index, 1);
  localStorage.setItem("transactions", JSON.stringify(txs));
  bootstrap.Modal.getInstance(document.getElementById("transactionModal")).hide();
  location.reload();
}

// Merchant-wise summary
function renderMerchants() {
  const transactions = getFilteredTransactions();

  const merchantTotals = { Income: {}, Expense: {} };

  transactions.forEach(tx => {
    const type = tx.type;
    const name = tx.paidTo?.trim();
    const amount = parseFloat(tx.amount);
    if (name && !isNaN(amount)) {
      merchantTotals[type][name] = (merchantTotals[type][name] || 0) + amount;
    }
  });

  const container = document.getElementById("merchantList");
  container.innerHTML = "";

  const renderGroup = (data, colorClass) => {
    Object.entries(data).forEach(([name, total]) => {
      const item = document.createElement("div");
      item.className = "list-group-item d-flex justify-content-between align-items-center";
      item.innerHTML = `<span>${name}</span><span class="fw-bold ${colorClass}">₹${total.toFixed(2)}</span>`;
      container.appendChild(item);
    });
  };

  renderGroup(merchantTotals.Income, "text-success");
  renderGroup(merchantTotals.Expense, "text-danger");

  if (
    Object.keys(merchantTotals.Income).length === 0 &&
    Object.keys(merchantTotals.Expense).length === 0
  ) {
    container.innerHTML = `<div class="text-muted">No merchants with recorded transactions.</div>`;
  }
}

// Category breakdown using Radar Chart
function renderCategoryBreakdown() {
  const transactions = getFilteredTransactions();

  const incomeMap = {}, expenseMap = {}, allCats = new Set();

  transactions.forEach(tx => {
    const cat = tx.category;
    const amt = parseFloat(tx.amount);
    if (!cat || isNaN(amt)) return;
    allCats.add(cat);
    if (tx.type === "Income") incomeMap[cat] = (incomeMap[cat] || 0) + amt;
    if (tx.type === "Expense") expenseMap[cat] = (expenseMap[cat] || 0) + amt;
  });

  const labels = [...allCats];
  const incomeData = labels.map(cat => incomeMap[cat] || 0);
  const expenseData = labels.map(cat => expenseMap[cat] || 0);

  const ctx = document.getElementById("mainRadarChart").getContext("2d");
  if (window.mainRadarChartInstance) window.mainRadarChartInstance.destroy();

  window.mainRadarChartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          backgroundColor: "rgba(13,110,253,0.2)",
          borderColor: "#0d6efd",
          borderWidth: 2
        },
        {
          label: "Expense",
          data: expenseData,
          backgroundColor: "rgba(220,53,69,0.2)",
          borderColor: "#dc3545",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          angleLines: { display: true },
          suggestedMin: 0,
          suggestedMax: Math.max(...incomeData, ...expenseData, 100)
        }
      },
      plugins: {
        legend: {
          position: "top"
        }
      }
    }
  });
}
