// utils.js - Shared utilities for LEKKA

// 🔁 Format date to yyyy-mm-dd
function formatDate(date) {
    return new Date(date).toISOString().split("T")[0];
  }
  
  // 📦 Load all transactions
  function getTransactions() {
    return JSON.parse(localStorage.getItem("transactions")) || [];
  }
  
  // 📥 Filter transactions by date range
  function filterTransactionsInRange(transactions, from, to) {
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= new Date(from) && d <= new Date(to);
    });
  }
  
  // 📊 Calculate income, expense, and balance
  function calculateSummary(transactions) {
    const income = transactions.filter(tx => tx.type === "Income").reduce((sum, tx) => sum + +tx.amount, 0);
    const expense = transactions.filter(tx => tx.type === "Expense").reduce((sum, tx) => sum + +tx.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }
  
  // 🌐 Extract query parameters
  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      filter: params.get("filter"),
      from: params.get("from"),
      to: params.get("to")
    };
  }
  
  // 📤 Export to CSV
  function exportTransactionsToCSV(transactions) {
    if (!transactions.length) return alert("No transactions to export.");
  
    let csv = "Date,Type,Amount,Category,PaidTo/ReceivedFrom\n";
    transactions.forEach(tx => {
      csv += `${tx.date},${tx.type},${tx.amount},${tx.category},${tx.paidTo || tx.receivedFrom || ""}\n`;
    });
  
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    link.click();
  }
  
  // 📆 Date range calculation for dashboard filters
  function getDateRangeForFilter(filter) {
    const now = new Date();
    let from = new Date(), to = new Date();
  
    if (filter === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (filter === "day") {
      from = to = now;
    } else if (filter === "week") {
      const day = now.getDay();
      from.setDate(now.getDate() - day);
      to.setDate(now.getDate() + (6 - day));
    } else if (filter === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), q * 3, 1);
      to = new Date(now.getFullYear(), q * 3 + 3, 0);
    }
  
    return {
      from: formatDate(from),
      to: formatDate(to)
    };
  }
  