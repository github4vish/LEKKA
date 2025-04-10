

document.addEventListener("DOMContentLoaded", function () {
    loadTransactions(); // Load transactions when page loads
    updateReviewButton(); // Set review button text dynamically
});

// 🔍 Search Transactions Function (Updates Modal Table)
function searchTransactions() {
    let keyword = document.getElementById("searchInput").value.toLowerCase();
    let transactions = document.querySelectorAll("#transactionsBody tr");
    let searchResults = document.getElementById("searchResults");

    searchResults.innerHTML = ""; // Clear previous results

    transactions.forEach(row => {
        let text = row.innerText.toLowerCase();
        if (text.includes(keyword)) {
            searchResults.appendChild(row.cloneNode(true)); // Show only matching rows
        }
    });

    if (searchResults.innerHTML === "") {
        searchResults.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No transactions found</td></tr>`;
    }
}


// 📅 Dynamic Review Button (Month + Year)
function updateReviewButton() {
    const currentDate = new Date();
    const month = currentDate.toLocaleString("default", { month: "short" }); // Apr
    const year = currentDate.getFullYear().toString().slice(-2); // 25
    document.getElementById("reviewButton").innerText = `Add Review (${month} '${year})`;
}



function loadTransactions() {
    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let tableBody = document.getElementById("transactionsBody");
    tableBody.innerHTML = ""; // Clear existing entries

    transactions.forEach(trx => {
        let row = `<tr>
            <td>${trx.date}</td>
            <td>${trx.category}</td>
            <td>${trx.type === "Income" ? "+" : "-"} ₹${trx.amount}</td>
            <td>${trx.paidTo}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}



// Sample Data for Expense & Income (You can fetch this from localStorage)
let monthlyExpense = [10000, 12000, 8000, 9500, 11000, 13000, 7000, 12500, 14000, 11500, 13500, 12000];
let monthlyIncome = [20000, 25000, 23000, 24000, 26000, 27000, 22000, 28000, 29000, 25000, 27500, 26000];

// Get Current Month (0-based index)
const currentMonthIndex = new Date().getMonth();

// Get Chart Context
const ctx = document.getElementById("expenseIncomeChart").getContext("2d");

// Create Chart
let expenseIncomeChart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
            {
                label: "Expense",
                data: monthlyExpense,
                backgroundColor: (ctx) => ctx.dataIndex === currentMonthIndex ? "red" : "rgba(255, 99, 132, 0.6)", // Highlight current month
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1
            },
            {
                label: "Income",
                data: monthlyIncome,
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
        scales: {
            y: { beginAtZero: true }
        },
        plugins: {
            legend: { display: true }
        }
    }
});

// Function to Update Chart Data Based on Filter
function updateChart() {
    let filterType = document.getElementById("filterSelect").value;

    if (filterType === "month") {
        expenseIncomeChart.data.labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        expenseIncomeChart.data.datasets[0].data = monthlyExpense;
        expenseIncomeChart.data.datasets[1].data = monthlyIncome;
    } else if (filterType === "day") {
        expenseIncomeChart.data.labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        expenseIncomeChart.data.datasets[0].data = [500, 600, 450, 700, 650, 800, 750]; // Sample daily expenses
        expenseIncomeChart.data.datasets[1].data = [2000, 2200, 2100, 2500, 2400, 2600, 2300]; // Sample daily income
    } else if (filterType === "week") {
        expenseIncomeChart.data.labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        expenseIncomeChart.data.datasets[0].data = [3000, 3200, 2800, 3100]; // Sample weekly expenses
        expenseIncomeChart.data.datasets[1].data = [9000, 10000, 9500, 9800]; // Sample weekly income
    } else if (filterType === "quarter") {
        expenseIncomeChart.data.labels = ["Q1", "Q2", "Q3", "Q4"];
        expenseIncomeChart.data.datasets[0].data = [12000, 14000, 13000, 12500]; // Sample quarterly expenses
        expenseIncomeChart.data.datasets[1].data = [50000, 52000, 51000, 53000]; // Sample quarterly income
    }

    // Update the chart
    expenseIncomeChart.update();

    // Update Selected Month's Expense & Income
    document.getElementById("expenseValue").innerText = monthlyExpense[currentMonthIndex];
    document.getElementById("incomeValue").innerText = monthlyIncome[currentMonthIndex];
}

// Function to Toggle Expense Chart
function toggleExpense() {
    let expenseDataset = expenseIncomeChart.data.datasets[0];
    expenseDataset.hidden = !expenseDataset.hidden;
    expenseIncomeChart.update();
}

// Function to Toggle Income Chart
function toggleIncome() {
    let incomeDataset = expenseIncomeChart.data.datasets[1];
    incomeDataset.hidden = !incomeDataset.hidden;
    expenseIncomeChart.update();
}

// Load Default Selected Month's Data
document.getElementById("expenseValue").innerText = monthlyExpense[currentMonthIndex];
document.getElementById("incomeValue").innerText = monthlyIncome[currentMonthIndex];


    