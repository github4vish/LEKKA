
document.getElementById("nav-categories-tab").addEventListener("click", renderCategoryBreakdown);

document.getElementById("nav-merchants-tab").addEventListener("click", renderMerchants);


document.getElementById("nav-transactions-tab").addEventListener("click", renderTransactionsList);



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
    const sign = isExpense ? "-" : "+";
    const amountClass = isExpense ? "text-danger" : "text-success";

    const item = document.createElement("div");
    item.className = "list-group-item d-flex justify-content-between align-items-center";

    item.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi bi-tag me-2 fs-5 text-primary"></i>
        <div>
          <div class="fw-semibold">${tx.category}</div>
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





function renderMerchants() {
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  // Filter only expenses
  const expenses = transactions.filter(tx => tx.type === "Expense");

  // Group by 'paidTo'
  const merchantTotals = {};
  expenses.forEach(tx => {
    const name = tx.paidTo?.trim();
    const amount = parseFloat(tx.amount);
    if (name && !isNaN(amount)) {
      merchantTotals[name] = (merchantTotals[name] || 0) + amount;
    }
  });

  // Render merchants only if they exist
  const container = document.getElementById("merchantList");
  container.innerHTML = "";

  if (Object.keys(merchantTotals).length === 0) {
    container.innerHTML = `<div class="text-muted">No merchants with recorded expenses.</div>`;
    return;
  }

  Object.entries(merchantTotals).forEach(([name, total]) => {
    const item = document.createElement("div");
    item.className = "list-group-item d-flex justify-content-between align-items-center";
    item.innerHTML = `
      <span>${name}</span>
      <span class="fw-bold text-success">₹${total.toFixed(2)}</span>
    `;
    container.appendChild(item);
  });
}




function renderCategoryBreakdown() {
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  
    // Filter only expenses
    const expenseTx = transactions.filter(tx => tx.type === "Expense");
  
    // Group by category
    const categoryTotals = {};
    let totalExpense = 0;
    expenseTx.forEach(tx => {
      const cat = tx.category;
      const amt = parseFloat(tx.amount) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      totalExpense += amt;
    });
  
    // Generate radial chart
    const ctx = document.getElementById("categoryRadialChart").getContext("2d");
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryTotals),
        datasets: [{
          data: Object.values(categoryTotals),
          backgroundColor: [
            '#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0',
            '#9966ff', '#ff9f40', '#c9cbcf', '#e67e22',
            '#2ecc71', '#f39c12', '#1abc9c', '#e74c3c'
          ]
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Expense Breakdown by Category'
          }
        }
      }
    });
  
    // Render Category Cards
    const container = document.getElementById("categoryCards");
    container.innerHTML = "";
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      const percentage = ((amt / totalExpense) * 100).toFixed(1);
      const card = document.createElement("div");
      card.className = "col-md-4 mb-3";
      card.innerHTML = `
        <div class="card shadow-sm h-100">
          <div class="card-body text-center">
            <canvas id="mini-${cat}" width="100" height="100"></canvas>
            <h6 class="mt-2">${cat}</h6>
            <p class="mb-0">₹${amt.toFixed(2)} / ₹${totalExpense.toFixed(2)} (${percentage}%)</p>
          </div>
        </div>
      `;
      container.appendChild(card);
  
      // Mini radial chart per category
      const miniCtx = document.getElementById(`mini-${cat}`).getContext("2d");
      new Chart(miniCtx, {
        type: 'doughnut',
        data: {
          labels: [cat, "Remaining"],
          datasets: [{
            data: [amt, totalExpense - amt],
            backgroundColor: ['#36a2eb', '#e0e0e0']
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




// Dummy Data
   let transactions = [
    { date: '2025-03-29', desc: 'Salary', amount: 1500, type: 'Income' },
    { date: '2025-03-28', desc: 'Groceries', amount: -200, type: 'Expense' }
];

function saveTransaction() {
    // Get form values
    let type = document.querySelector(".modal select").value;
    let amount = document.querySelector(".modal input[type='number']").value;
    let date = document.querySelector(".modal input[type='date']").value;
    let paidTo = document.querySelector(".modal input[type='text']").value;
    let category = document.querySelector(".modal .btn-outline-primary.active")?.innerText || "Other";

    if (!amount || !date || !paidTo) {
        alert("Please fill all required fields!");
        return;
    }

    // Create transaction object
    let transaction = { type, amount, date, paidTo, category };

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
    var modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
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




