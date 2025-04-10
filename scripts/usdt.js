const form = document.getElementById("transactionForm");
const list = document.getElementById("transactionList");
const chartCanvas = document.getElementById("monthlyChart");
let chartInstance;
let transactions = JSON.parse(localStorage.getItem("usdt_transactions")) || [];

form.addEventListener("submit", e => {
  e.preventDefault();
  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const rate = parseFloat(document.getElementById("rate").value);
  const datetime = document.getElementById("datetime").value;
  transactions.push({ type, amount, rate, datetime });
  localStorage.setItem("usdt_transactions", JSON.stringify(transactions));
  form.reset();
  render();
});

// সব ট্রানজেকশন মুছে ফেলার জন্য ফাংশন
function deleteAllTransactions() {
  Swal.fire({
    title: 'Are you sure?',
    text: "You will not be able to recover the transactions!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete all!'
  }).then((result) => {
    if (result.isConfirmed) {
      transactions = [];
      localStorage.setItem("usdt_transactions", JSON.stringify(transactions));
      render();
      Swal.fire(
        'Deleted!',
        'All transactions have been deleted.',
        'success'
      );
    }
  });
}

// এক একটা ট্রানজেকশন ডিলিট করার জন্য
function deleteTransaction(index) {
  // ট্রানজেকশন ডিলিট করার পর, নতুন ডেটা সেভ করা হবে, তবে টোটাল ডেটা আপডেট হবে না
  transactions.splice(index, 1);
  localStorage.setItem("usdt_transactions", JSON.stringify(transactions));
  render(false); // render ফাংশন কল করছি false প্যারামিটার দিয়ে যাতে গণনা না হয়
}

function render(updateTotals = true) {
  const now = new Date();
  let unlocked = 0, buyMonth = 0, sellMonth = 0, profit = 0;
  let monthlyBuy = {}, monthlySell = {};

  // যদি আপডেট না করতে হয় তাহলে কেবল ট্রানজেকশন লিস্ট দেখাবো
  if (updateTotals) {
    transactions.forEach((tx, i) => {
      const date = new Date(tx.datetime);
      const unlockDate = new Date(date.getTime() + 86400000);
      const isUnlocked = tx.type === "buy" && now >= unlockDate;
      const ym = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;

      if (tx.type === "buy") {
        if (isUnlocked) unlocked += tx.amount;
        monthlyBuy[ym] = (monthlyBuy[ym] || 0) + tx.amount;
      } else if (tx.type === "sell") {
        monthlySell[ym] = (monthlySell[ym] || 0) + tx.amount;
      }

      const isThisMonth = now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();
      if (isThisMonth && tx.type === "buy") buyMonth += tx.amount;
      if (isThisMonth && tx.type === "sell") sellMonth += tx.amount;
      if (tx.type === "sell") profit += tx.amount * tx.rate;
      if (tx.type === "buy" && isUnlocked) profit -= tx.amount * tx.rate;
    });
  }

  list.innerHTML = "";

  transactions.forEach((tx, i) => {
    const date = new Date(tx.datetime);
    const unlockDate = new Date(date.getTime() + 86400000);
    const isUnlocked = tx.type === "buy" && now >= unlockDate;
    const ym = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;

    const isThisMonth = now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();

    list.innerHTML += `
      <div class="bg-white border rounded p-3 relative">
        <button onclick="deleteTransaction(${i})" class="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm font-bold">×</button>
        <p><strong>${tx.type.toUpperCase()}</strong> — ${tx.amount} USDT @ ${tx.rate} SAR</p>
        <p>Date: ${new Date(tx.datetime).toLocaleString()}</p>
        ${tx.type === "buy" ? `<p>Status: ${isUnlocked ? '<span class="text-green-600">Unlocked</span>' : '<span class="text-red-600">Locked</span>'}</p>` : ''}
      </div>
    `;
  });

  if (updateTotals) {
    document.getElementById("totalUnlocked").textContent = unlocked.toFixed(2);
    document.getElementById("monthBuy").textContent = buyMonth.toFixed(2);
    document.getElementById("monthSell").textContent = sellMonth.toFixed(2);
    document.getElementById("profit").textContent = profit.toFixed(2);
    renderChart(monthlyBuy, monthlySell);
  }
}

render();
