(function () {
  "use strict";

  const defaultProfile = { id: "guest", fullName: "B3 Demo User", email: "demo@b3-trading.com", phone: "Not provided", accountType: "demo" };
  const defaultAccount = { cash: 10000, equity: 10000, positions: [], orders: [] };
  let profile = readJSON("b3-profile", defaultProfile);
  let account = readJSON("b3-demo-account", defaultAccount);
  let side = "buy";

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; }
  }
  function money(value) { return "$" + Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function showNotice(text) { const notice = document.getElementById("notice"); notice.textContent = text; notice.classList.remove("hidden"); window.clearTimeout(showNotice.timer); showNotice.timer = window.setTimeout(function () { notice.classList.add("hidden"); }, 7000); }
  function saveAccount() { localStorage.setItem("b3-demo-account", JSON.stringify(account)); renderAccount(); }

  document.getElementById("profile-name").textContent = profile.fullName;
  document.getElementById("profile-email").textContent = profile.email;
  document.getElementById("welcome-name").textContent = (profile.fullName || "Trader").split(" ")[0];
  document.getElementById("account-request").textContent = profile.accountType === "live" ? "Live review" : "Demo";

  function renderWidget(containerId, scriptUrl, config) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement("script"); script.src = scriptUrl; script.async = true; script.type = "text/javascript"; script.textContent = JSON.stringify(config); container.appendChild(script);
  }

  function renderChart() {
    const symbol = (document.getElementById("order-symbol").value.trim() || "NASDAQ:AAPL").toUpperCase();
    document.getElementById("chart-title").textContent = symbol;
    renderWidget("dashboard-chart", "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js", { autosize: true, symbol, interval: "15", timezone: "Etc/UTC", theme: "dark", style: "1", locale: "en", allow_symbol_change: true, calendar: false });
  }

  function renderAccount() {
    document.getElementById("cash-balance").textContent = money(account.cash);
    document.getElementById("equity-balance").textContent = money(account.equity);
    document.getElementById("position-count").textContent = account.positions.length;
    const positionsBody = document.getElementById("positions-body");
    positionsBody.innerHTML = account.positions.length ? account.positions.map(function (position) {
      return `<tr><td>${escapeHTML(position.symbol)}</td><td>${position.quantity}</td><td>${money(position.averagePrice)}</td><td>${position.stopLoss ? money(position.stopLoss) : "—"}</td><td>${position.margin}x</td></tr>`;
    }).join("") : '<tr><td colspan="5">No demo positions yet.</td></tr>';
    const ordersBody = document.getElementById("orders-body");
    ordersBody.innerHTML = account.orders.length ? account.orders.slice(0, 20).map(function (order) {
      return `<tr><td>${new Date(order.createdAt).toLocaleString()}</td><td class="${order.side}">${order.side.toUpperCase()}</td><td>${escapeHTML(order.symbol)}</td><td>${order.quantity}</td><td>${money(order.price)}</td></tr>`;
    }).join("") : '<tr><td colspan="5">No demo orders yet.</td></tr>';
  }

  function escapeHTML(text) { const element = document.createElement("div"); element.textContent = String(text); return element.innerHTML; }
  function updateNotional() { const quantity = Number(document.getElementById("order-quantity").value); const price = Number(document.getElementById("order-price").value); document.getElementById("order-notional").textContent = money(quantity * price); }
  function setSide(nextSide) {
    side = nextSide;
    document.getElementById("buy-side").className = nextSide === "buy" ? "active buy" : "";
    document.getElementById("sell-side").className = nextSide === "sell" ? "active sell" : "";
    const placeOrder = document.getElementById("place-order");
    placeOrder.textContent = "Place demo " + nextSide + " order";
    placeOrder.className = nextSide === "sell" ? "button button-danger" : "button";
  }

  document.getElementById("buy-side").addEventListener("click", function () { setSide("buy"); });
  document.getElementById("sell-side").addEventListener("click", function () { setSide("sell"); });
  document.getElementById("order-quantity").addEventListener("input", updateNotional);
  document.getElementById("order-price").addEventListener("input", updateNotional);
  document.getElementById("order-symbol").addEventListener("change", renderChart);

  document.getElementById("order-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const rawSymbol = document.getElementById("order-symbol").value.trim().toUpperCase() || "NASDAQ:AAPL";
    const symbol = rawSymbol.split(":").pop();
    const quantity = Number(document.getElementById("order-quantity").value);
    const price = Number(document.getElementById("order-price").value);
    const stopLoss = Number(document.getElementById("order-stop").value) || null;
    const margin = Number(document.getElementById("order-margin").value);
    if (!(quantity > 0) || !(price > 0) || margin < 1 || margin > 10) return showNotice("Enter valid order values. Margin must be between 1x and 10x.");
    const notional = quantity * price;

    if (side === "buy") {
      const requiredCash = notional / margin;
      if (requiredCash > account.cash) return showNotice("Insufficient virtual cash for this simulated order.");
      const existing = account.positions.find(function (item) { return item.symbol === symbol; });
      if (existing) {
        existing.averagePrice = ((existing.averagePrice * existing.quantity) + (price * quantity)) / (existing.quantity + quantity);
        existing.quantity += quantity; existing.stopLoss = stopLoss; existing.margin = margin;
      } else account.positions.push({ symbol, quantity, averagePrice: price, stopLoss, margin });
      account.cash -= requiredCash;
    } else {
      const existing = account.positions.find(function (item) { return item.symbol === symbol; });
      if (!existing || existing.quantity < quantity) return showNotice("You do not have enough units in this demo position to sell.");
      account.cash += quantity * price / existing.margin;
      existing.quantity -= quantity;
      if (existing.quantity <= 0) account.positions = account.positions.filter(function (item) { return item.symbol !== symbol; });
    }

    account.orders.unshift({ id: crypto.randomUUID(), side, symbol, quantity, price, stopLoss, margin, createdAt: new Date().toISOString() });
    saveAccount();
    showNotice(`Demo ${side} order recorded for ${quantity} ${symbol}.`);
  });

  document.getElementById("live-account").addEventListener("submit", function (event) {
    event.preventDefault();
    const request = { amount: Number(document.getElementById("live-amount").value), fundingSource: document.getElementById("funding-source").value, status: "pending_review", createdAt: new Date().toISOString() };
    localStorage.setItem("b3-live-account-request", JSON.stringify(request));
    showNotice("Live account request saved as pending compliance review. No money was transferred.");
  });

  const payout = readJSON("b3-payout-preference", { method: "bank", accountHolder: "", provider: "", last4: "" });
  document.getElementById("payout-method").value = payout.method;
  document.getElementById("account-holder").value = payout.accountHolder;
  document.getElementById("provider-name").value = payout.provider;
  document.getElementById("account-last4").value = payout.last4;
  document.getElementById("account-last4").addEventListener("input", function (event) { event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4); });
  document.getElementById("payout").addEventListener("submit", function (event) {
    event.preventDefault();
    const preference = { method: document.getElementById("payout-method").value, accountHolder: document.getElementById("account-holder").value.trim(), provider: document.getElementById("provider-name").value.trim(), last4: document.getElementById("account-last4").value.trim() };
    if (preference.last4.length !== 4) return showNotice("Enter exactly the last four digits only.");
    localStorage.setItem("b3-payout-preference", JSON.stringify(preference));
    showNotice("Payout preference saved. No transfer was initiated.");
  });

  document.getElementById("sign-out").addEventListener("click", function () { localStorage.removeItem("b3-profile"); window.location.href = "index.html"; });

  renderChart(); renderAccount(); updateNotional();
  renderWidget("dashboard-news", "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js", { feedMode: "all_symbols", isTransparent: true, displayMode: "regular", width: "100%", height: 620, colorTheme: "dark", locale: "en" });
})();
