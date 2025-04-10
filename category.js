
document.getElementById("nav-categories-tab").addEventListener("click", renderCategoryBreakdown);

document.getElementById("nav-merchants-tab").addEventListener("click", renderMerchants);


document.getElementById("nav-transactions-tab").addEventListener("click", renderTransactionsList);

// Load default categories on page load
window.addEventListener('DOMContentLoaded', loadCategories);

function renderTransactionsList() {
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  const list = document.getElementById("transactionsList");
  list.innerHTML = "";

  if (transactions.length === 0) {
    list.innerHTML = `<div class="text-muted text-center">No transactions recorded.</div>`;
    return;
  }

  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const dayMonth = date.toLocaleDateString("en-GB", {
      day: "numeric", month: "short"
    });

    const isExpense = tx.type === "Expense";
    const arrowIcon = isExpense ? "bi-arrow-up-circle text-danger" : "bi-arrow-down-circle text-success";
    const amountClass = isExpense ? "text-danger" : "text-success";

    const item = document.createElement("div");
    item.className = "list-group-item d-flex justify-content-between align-items-center";

    item.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi ${tx.icon || 'bi-tag'} me-2 fs-5 text-primary"></i>
        <div>
          <div class="fw-semibold">${tx.paidTo || tx.receivedFrom || "Unknown"}</div>
        </div>
      </div>
      <div class="text-end">
        <div class="small text-muted">${dayMonth}</div>
        <div>
          <i class="bi ${arrowIcon}"></i>
          <div class="fw-bold ${amountClass}">₹${parseFloat(tx.amount).toFixed(2)}</div>
        </div>
      </div>
    `;

    list.appendChild(item);
  });
}


function loadCategories() {
  const type = document.getElementById("transactionType").value;
  const container = document.getElementById("categoryButtons");

  // Update labels based on transaction type
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



function renderMerchants() {
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  const merchantTotals = {
    Income: {},
    Expense: {}
  };

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

  const renderGroup = (label, data, colorClass) => {
    if (Object.keys(data).length === 0) return;
    

    Object.entries(data).forEach(([name, total]) => {
      const item = document.createElement("div");
      item.className = "list-group-item d-flex justify-content-between align-items-center";
      item.innerHTML = `
        <span>${name}</span>
        <span class="fw-bold ${colorClass}">₹${total.toFixed(2)}</span>
      `;
      container.appendChild(item);
    });
  };

  renderGroup("Income", merchantTotals.Income, "text-success");
  renderGroup("Expense", merchantTotals.Expense, "text-danger");

  if (
    Object.keys(merchantTotals.Income).length === 0 &&
    Object.keys(merchantTotals.Expense).length === 0
  ) {
    container.innerHTML = `<div class="text-muted">No merchants with recorded transactions.</div>`;
  }
}




function renderCategoryBreakdown() {
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  const incomeTx = transactions.filter(tx => tx.type === "Income");
  const expenseTx = transactions.filter(tx => tx.type === "Expense");

  const incomeMap = {};
  const expenseMap = {};

  incomeTx.forEach(tx => {
    const cat = tx.category;
    const amt = parseFloat(tx.amount) || 0;
    incomeMap[cat] = (incomeMap[cat] || 0) + amt;
  });

  expenseTx.forEach(tx => {
    const cat = tx.category;
    const amt = parseFloat(tx.amount) || 0;
    expenseMap[cat] = (expenseMap[cat] || 0) + amt;
  });

  const incomeLabels = Object.keys(incomeMap);
  const incomeData = incomeLabels.map(cat => incomeMap[cat]);
  const expenseLabels = Object.keys(expenseMap);
  const expenseData = expenseLabels.map(cat => expenseMap[cat]);

  const ctxRadar = document.getElementById('mainRadarChart').getContext('2d');
  if (window.mainRadarChartInstance) {
    window.mainRadarChartInstance.destroy();
  }
  window.mainRadarChartInstance = new Chart(ctxRadar, {
    type: 'radar',
    data: {
      labels: [...new Set([...incomeLabels, ...expenseLabels])],
      datasets: [
        {
          label: 'Income',
          data: [...new Set([...incomeLabels, ...expenseLabels])].map(cat => incomeMap[cat] || 0),
          backgroundColor: 'rgba(13, 110, 253, 0.2)',
          borderColor: '#0d6efd',
          borderWidth: 2
        },
        {
          label: 'Expense',
          data: [...new Set([...incomeLabels, ...expenseLabels])].map(cat => expenseMap[cat] || 0),
          backgroundColor: 'rgba(220, 53, 69, 0.2)',
          borderColor: '#dc3545',
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
          position: 'top'
        }
      }
    }
  });

  // Render Income Category Cards
  const incomeTotal = incomeData.reduce((a, b) => a + b, 0);
  const incomeContainer = document.getElementById("incomeCategoryCards");
  incomeContainer.innerHTML = "";
  incomeLabels.forEach(cat => {
    const amt = incomeMap[cat];
    const percentage = ((amt / incomeTotal) * 100).toFixed(1);
    const card = document.createElement("div");
    card.className = "col-md-4 mb-3";
    card.innerHTML = `
      <div class="card shadow-sm h-100">
        <div class="card-body text-center">
          <canvas id="mini-income-${cat}" width="100" height="100"></canvas>
          <h6 class="mt-2">${cat}</h6>
          <p class="mb-0">₹${amt.toFixed(2)} / ₹${incomeTotal.toFixed(2)} (${percentage}%)</p>
        </div>
      </div>
    `;
    incomeContainer.appendChild(card);

    const miniCtx = document.getElementById(`mini-income-${cat}`).getContext("2d");
    new Chart(miniCtx, {
      type: 'doughnut',
      data: {
        labels: [cat, "Remaining"],
        datasets: [{
          data: [amt, incomeTotal - amt],
          backgroundColor: ['#0d6efd', '#e0e0e0']
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        cutout: "70%",
      }
    });
  });

  // Render Expense Category Cards
  const expenseTotal = expenseData.reduce((a, b) => a + b, 0);
  const expenseContainer = document.getElementById("expenseCategoryCards");
  expenseContainer.innerHTML = "";
  expenseLabels.forEach(cat => {
    const amt = expenseMap[cat];
    const percentage = ((amt / expenseTotal) * 100).toFixed(1);
    const card = document.createElement("div");
    card.className = "col-md-4 mb-3";
    card.innerHTML = `
      <div class="card shadow-sm h-100">
        <div class="card-body text-center">
          <canvas id="mini-expense-${cat}" width="100" height="100"></canvas>
          <h6 class="mt-2">${cat}</h6>
          <p class="mb-0">₹${amt.toFixed(2)} / ₹${expenseTotal.toFixed(2)} (${percentage}%)</p>
        </div>
      </div>
    `;
    expenseContainer.appendChild(card);

    const miniCtx = document.getElementById(`mini-expense-${cat}`).getContext("2d");
    new Chart(miniCtx, {
      type: 'doughnut',
      data: {
        labels: [cat, "Remaining"],
        datasets: [{
          data: [amt, expenseTotal - amt],
          backgroundColor: ['#dc3545', '#e0e0e0']
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        cutout: "70%",
      }
    });
  });
}




function exportToCSV() {
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    if (transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }

    const headers = ["Date", "Category", "Amount", "Paid To", "Type", "Notes", "Tags"];
    const rows = transactions.map(tx => [
        tx.date, tx.category, tx.amount, tx.paidTo, tx.type, tx.notes || "", tx.tags || ""
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "paddu_transactions.csv");
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
}




function saveTransaction() {
  // Get form values
  let type = document.querySelector(".modal select").value;
  let amount = document.querySelector(".modal input[type='number']").value;
  let date = document.querySelector(".modal input[type='date']").value;
  let paidTo = document.querySelector(".modal input[type='text']").value;
  let categoryBtn = document.querySelector(".modal .btn-outline-primary.active");
  let category = categoryBtn?.innerText.trim() || "Other";

  // Get icon class from <i> inside the button
  let icon = categoryBtn ? categoryBtn.querySelector("i").className : "bi bi-tag";

  if (!amount || !date || !paidTo) {
      alert("Please fill all required fields!");
      return;
  }

  // Create transaction object
  let transaction = { type, amount, date, paidTo, category, icon };

  // Get existing transactions from localStorage
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  // Add new transaction
  transactions.unshift(transaction);

  // Keep only the 10 most recent transactions
  transactions = transactions.slice(0, 10);

  // Save back to localStorage
  localStorage.setItem("transactions", JSON.stringify(transactions));

  // Reload the table
  loadTransactions();

  // Close the modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
  modal.hide();
}



function addTransaction() {
    var myModal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
    myModal.show();
}


function selectCategory(button) {
    // Remove 'active' class from all buttons
    document.querySelectorAll(".btn-outline-primary").forEach(btn => btn.classList.remove("active"));
    
    // Add 'active' class to the clicked button
    button.classList.add("active");
}




