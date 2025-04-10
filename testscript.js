// Global variable to store Chart instance
let expenseChart;

// Function to load and display expenses
function loadExpenses() {
    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    let tableBody = document.getElementById("expenseTable");
    let totalAmount = 0;

    tableBody.innerHTML = ""; // Clear existing table data

    expenses.forEach((expense, index) => {
        let row = `<tr>
            <td>${expense.name}</td>
            <td>${expense.category}</td>
            <td>₹${expense.amount}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteExpense(${index})">Delete</button></td>
        </tr>`;
        tableBody.innerHTML += row;
        totalAmount += parseFloat(expense.amount);
    });

    document.getElementById("totalAmount").textContent = totalAmount.toFixed(2);
    updateChart(expenses);
}

// Function to add expense
function addExpense() {
    let name = document.getElementById("expenseName").value.trim();
    let category = document.getElementById("expenseCategory").value;
    let amount = document.getElementById("expenseAmount").value.trim();

    if (name === "" || amount === "" || isNaN(amount) || amount <= 0) {
        alert("Please enter valid details.");
        return;
    }

    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    expenses.push({ name, category, amount });
    localStorage.setItem("expenses", JSON.stringify(expenses));

    document.getElementById("expenseName").value = "";
    document.getElementById("expenseAmount").value = "";

    loadExpenses();
}

// Function to delete an expense
function deleteExpense(index) {
    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    expenses.splice(index, 1);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    loadExpenses();
}

// Function to update the Chart
function updateChart(expenseData) {
    // Destroy existing chart if it exists
    if (expenseChart) {
        expenseChart.destroy();
    }

    let categoryTotals = {};
    expenseData.forEach(expense => {
        let category = expense.category;
        let amount = parseFloat(expense.amount);
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    let labels = Object.keys(categoryTotals);
    let data = Object.values(categoryTotals);

    let ctx = document.getElementById("expenseChart").getContext("2d");

    if (labels.length > 0) {
        expenseChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    label: "Expense Distribution",
                    data: data,
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"]
                }]
            }
        });
    }
}

// Load data when page loads
document.addEventListener("DOMContentLoaded", loadExpenses);
