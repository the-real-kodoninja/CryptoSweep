document.addEventListener("DOMContentLoaded", () => {
  // Profit Chart
  const profitCtx = document.getElementById("profitChart").getContext("2d");
  const profitChart = new Chart(profitCtx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Profit (BNB)",
          data: [0, 0.01, 0.03, 0.05, 0.08, 0.1],
          borderColor: "#FFFFFF",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          tension: 0.4,
        },
        {
          label: "EMA Projection",
          data: [0, 0.015, 0.035, 0.06, 0.09, 0.12],
          borderColor: "#A34747",
          borderDash: [5, 5],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, grid: { color: "#808080" } }, x: { grid: { color: "#808080" } } },
      plugins: { legend: { labels: { color: "#FFFFFF" } } },
    },
  });

  // Activity Chart (Pie)
  const activityCtx = document.getElementById("activityChart").getContext("2d");
  const activityChart = new Chart(activityCtx, {
    type: "pie",
    data: {
      labels: ["Airdrops", "Faucets", "Fragments", "Collectibles", "Bounties", "Farming", "Challenges", "Proposals", "Charity"],
      datasets: [{
        data: [
          <%= stats.activity.airdrops || 0 %>,
          <%= stats.activity.faucets || 0 %>,
          <%= stats.activity.fragments || 0 %>,
          <%= stats.activity.collectibles || 0 %>,
          <%= stats.activity.bounties || 0 %>,
          <%= stats.activity.farming || 0 %>,
          <%= stats.activity.challenges || 0 %>,
          <%= stats.activity.proposals || 0 %>,
          <%= stats.activity.charity || 0 %>
        ],
        backgroundColor: ["#A34747", "#808080", "#FFFFFF", "#404040", "#FF6347", "#4682B4", "#FFD700", "#32CD32", "#FF69B4"],
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#FFFFFF" } },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value}`;
            }
          }
        }
      }
    },
  });

  // Source Distribution (Bar)
  const sourceCtx = document.getElementById("sourceChart").getContext("2d");
  const sourceChart = new Chart(sourceCtx, {
    type: "bar",
    data: {
      labels: ["Reddit", "Twitter", "Faucets", "Jobs", "HackerOne", "PancakeSwap", "Instagram", "Snapshot", "Charity"],
      datasets: [{
        label: "Items Collected",
        data: [
          <%= stats.sourceItems.Reddit || 0 %>,
          <%= stats.sourceItems.Twitter || 0 %>,
          <%= stats.sourceItems.Faucets || 0 %>,
          <%= stats.sourceItems.Jobs || 0 %>,
          <%= stats.sourceItems.HackerOne || 0 %>,
          <%= stats.sourceItems.PancakeSwap || 0 %>,
          <%= stats.sourceItems.Instagram || 0 %>,
          <%= stats.sourceItems.Snapshot || 0 %>,
          <%= stats.sourceItems.Charity || 0 %>
        ],
        backgroundColor: "#A34747",
      }],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, grid: { color: "#808080" } }, x: { grid: { color: "#808080" } } },
      plugins: { legend: { labels: { color: "#FFFFFF" } } },
    },
  });

  // Profit Calendar
  const calendar = document.getElementById("profitCalendar");
  for (let i = 0; i < 365; i++) {
    const day = document.createElement("div");
    day.className = "day " + (Math.random() > 0.7 ? "green" : "");
    calendar.appendChild(day);
  }
});

function lookupDate() {
  const date = document.getElementById("dateLookup").value;
  document.getElementById("lookupResult").innerHTML = `<li>${date}: Simulated - 0.002 BNB collected</li>`;
}

setInterval(() => {
  window.location.reload();
}, 10000);
