(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  function renderWidget(containerId, scriptUrl, config) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.type = "text/javascript";
    script.textContent = JSON.stringify(config);
    container.appendChild(script);
  }

  renderWidget("ticker-widget", "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js", {
    symbols: [
      { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
      { proName: "NASDAQ:NDX", title: "Nasdaq 100" },
      { proName: "NASDAQ:AAPL", title: "Apple" },
      { proName: "NASDAQ:NVDA", title: "NVIDIA" },
      { proName: "NASDAQ:TSLA", title: "Tesla" },
      { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" }
    ],
    showSymbolLogo: true, isTransparent: true, displayMode: "adaptive", colorTheme: "dark", locale: "en"
  });

  renderWidget("landing-chart", "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js", {
    autosize: true, symbol: "NASDAQ:AAPL", interval: "D", timezone: "Etc/UTC", theme: "dark", style: "1", locale: "en", allow_symbol_change: true, calendar: false
  });

  renderWidget("news-widget", "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js", {
    feedMode: "all_symbols", isTransparent: true, displayMode: "regular", width: "100%", height: 620, colorTheme: "dark", locale: "en"
  });

  function getSupabaseClient() {
    const config = window.B3_CONFIG || {};
    if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) return null;
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  const form = document.getElementById("registration-form");
  const button = document.getElementById("register-button");
  const message = document.getElementById("registration-message");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    button.disabled = true;
    button.textContent = "Creating account…";
    message.className = "form-message";
    message.textContent = "";

    const fullName = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const accountType = new FormData(form).get("accountType") || "demo";

    try {
      if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
      let userId = "local-" + crypto.randomUUID();
      const supabaseClient = getSupabaseClient();

      if (supabaseClient) {
        const result = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone, requested_account_type: accountType } }
        });
        if (result.error) throw result.error;
        if (result.data.user) userId = result.data.user.id;
      }

      localStorage.setItem("b3-profile", JSON.stringify({ id: userId, fullName, email, phone, accountType, createdAt: new Date().toISOString() }));
      if (!localStorage.getItem("b3-demo-account")) {
        localStorage.setItem("b3-demo-account", JSON.stringify({ cash: 10000, equity: 10000, positions: [], orders: [] }));
      }

      try {
        await fetch("/api/welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fullName, email }) });
      } catch (emailError) {
        console.info("Welcome email will activate after deployment/provider setup.", emailError);
      }

      message.className = "form-message success";
      message.textContent = "Registration completed. Opening your dashboard…";
      setTimeout(function () { window.location.href = "dashboard.html"; }, 650);
    } catch (error) {
      message.className = "form-message error";
      message.textContent = error && error.message ? error.message : "Registration could not be completed.";
      button.disabled = false;
      button.textContent = "Register and open dashboard";
    }
  });
})();
