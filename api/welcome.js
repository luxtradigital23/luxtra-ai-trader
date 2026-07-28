module.exports = async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    if (!name || !email.includes("@")) return response.status(400).json({ error: "A valid name and email are required." });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.WELCOME_FROM_EMAIL;
    const title = process.env.WELCOME_SIGNATURE_TITLE || "Investment Education Specialist";
    if (!apiKey || !from) return response.status(200).json({ sent: false, configured: false });

    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `B3 Trading <${from}>`, to: [email], subject: "Welcome to B3 Trading",
        html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#14213d;line-height:1.6"><h1 style="color:#0A2342">Welcome to B3 Trading, ${escapeHTML(name)}.</h1><p>Your registration has been received successfully.</p><p>You can now access your profile, explore live market charts and practice with <strong>$10,000 in virtual capital</strong>.</p><p>The demo account is educational and does not involve real money. Live accounts remain subject to identity verification, compliance review and an approved financial-services integration.</p><p style="margin-top:32px">Best regards,<br><strong>Carlos Espinal</strong><br>${escapeHTML(title)}<br>B3 Trading</p></div>`
      })
    });
    if (!result.ok) return response.status(502).json({ error: "Email provider rejected the message." });
    return response.status(200).json({ sent: true, configured: true });
  } catch (error) {
    console.error(error); return response.status(500).json({ error: "Unable to process welcome email." });
  }
};
function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, function (character) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#039;", '"':"&quot;" })[character]; }); }
