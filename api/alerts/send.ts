import { Resend } from "resend";

type AlertItem = {
  name?: string;
  old_price?: string;
  current_price?: string;
  url?: string;
  platform?: string;
};

const renderItems = (items: AlertItem[]) =>
  items
    .map((item) => {
      const price = [item.old_price, item.current_price].filter(Boolean).join(" -> ");
      const platform = item.platform ? ` (${item.platform})` : "";
      return `<li><strong>${item.name || "Wishlist item"}</strong>${platform}<br/>${price}<br/><a href="${item.url || "#"}">View deal</a></li>`;
    })
    .join("");

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const email = String(body.email || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(200).json({
      ok: true,
      demo: true,
      message: "Alert accepted in demo mode. Add RESEND_API_KEY in Vercel to send real email.",
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.ALERT_FROM_EMAIL || "Dealirious <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Dealirious weekly wishlist alerts",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h1>Wishlist deals moved this week</h1>
        <p>These saved games crossed your alert threshold.</p>
        <ul>${renderItems(items)}</ul>
      </div>
    `,
  });

  if (error) {
    return res.status(500).json({ error: (error as { message?: string }).message || "Failed to send email." });
  }

  return res.status(200).json({ ok: true });
}
