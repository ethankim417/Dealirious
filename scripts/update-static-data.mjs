import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, "public", "data", "deals.json");
const CHEAPSHARK_BASE = "https://www.cheapshark.com/api/1.0";

const CURATED_DEMO_DEALS = [
  {
    id: "demo-playstation-spider-man-2",
    name: "Marvel's Spider-Man 2",
    price: "$39.89",
    price_numeric: 39.89,
    original_price: "$69.99",
    discount_percent: 43,
    image: "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/97e9f5fa6e50b3bb63fda43acb3070a4d1e99b525d2f8f99.png",
    metacritic: 90,
    steam_score: "",
    platform: "playstation",
    url: "https://store.playstation.com/concept/10002456",
    genres: ["Action", "Adventure", "Open World"],
  },
  {
    id: "demo-playstation-god-of-war-ragnarok",
    name: "God of War Ragnarok",
    price: "$29.39",
    price_numeric: 29.39,
    original_price: "$69.99",
    discount_percent: 58,
    image: "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/3Jd2jT8GQ7wC5QeFQv7YxU6g.png",
    metacritic: 94,
    steam_score: "",
    platform: "playstation",
    url: "https://store.playstation.com/concept/10001850",
    genres: ["Action", "Adventure"],
  },
  {
    id: "demo-playstation-horizon-forbidden-west",
    name: "Horizon Forbidden West",
    price: "$19.79",
    price_numeric: 19.79,
    original_price: "$49.99",
    discount_percent: 60,
    image: "https://image.api.playstation.com/vulcan/ap/rnd/202107/3100/Sd2YrCwG5j0C8HabYKDw5U5P.png",
    metacritic: 88,
    steam_score: "",
    platform: "playstation",
    url: "https://store.playstation.com/concept/10000886",
    genres: ["Action", "RPG", "Open World"],
  },
];

const platformForStore = (storeName = "") => {
  const name = storeName.toLowerCase();
  if (name.includes("steam")) return "steam";
  if (name.includes("epic")) return "epic";
  if (name.includes("ubisoft") || name.includes("uplay")) return "ubisoft";
  return "other";
};

const formatUsd = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";
  return number <= 0 ? "Free" : `$${number.toFixed(2)}`;
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "DealiriousDemoData/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return response.json();
};

const buildDeal = (deal, storeById) => {
  const store = storeById.get(String(deal.storeID));
  const salePrice = Number(deal.salePrice);
  const normalPrice = Number(deal.normalPrice);

  return {
    id: `cheapshark-${deal.dealID}`,
    name: deal.title,
    price: formatUsd(salePrice),
    price_numeric: Number.isFinite(salePrice) ? salePrice : 0,
    original_price: formatUsd(normalPrice),
    discount_percent: Math.round(Number(deal.savings) || 0),
    image: deal.thumb || "",
    metacritic: Number(deal.metacriticScore) || 0,
    steam_score: deal.steamRatingText || "",
    platform: platformForStore(store?.storeName),
    url: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
    genres: [],
  };
};

const main = async () => {
  const stores = await fetchJson(`${CHEAPSHARK_BASE}/stores`);
  const activeStores = stores.filter((store) => String(store.isActive) === "1");
  const targetStores = activeStores.filter((store) => {
    const platform = platformForStore(store.storeName);
    return platform === "steam" || platform === "epic" || platform === "ubisoft";
  });

  const storeById = new Map(activeStores.map((store) => [String(store.storeID), store]));
  const dealPages = await Promise.all(
    targetStores.map((store) => {
      const params = new URLSearchParams({
        storeID: String(store.storeID),
        onSale: "1",
        pageNumber: "0",
        pageSize: "60",
        sortBy: "Savings",
        upperPrice: "60",
      });
      return fetchJson(`${CHEAPSHARK_BASE}/deals?${params.toString()}`);
    }),
  );

  const seen = new Set();
  const deals = [...CURATED_DEMO_DEALS, ...dealPages
    .flat()
    .map((deal) => buildDeal(deal, storeById))
    .filter((deal) => {
      if (!deal.name || !deal.url || seen.has(deal.id)) return false;
      seen.add(deal.id);
      return deal.discount_percent >= 40;
    })]
    .sort((a, b) => {
      const scoreA = (a.metacritic || 70) + (a.discount_percent || 0);
      const scoreB = (b.metacritic || 70) + (b.discount_percent || 0);
      return scoreB - scoreA;
    })
    .slice(0, 150);

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(
    OUT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "CheapShark public deals API",
        note: "Static demo data generated for GitHub/Vercel hosting.",
        deals,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Wrote ${deals.length} deals to ${path.relative(ROOT, OUT_FILE)}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
