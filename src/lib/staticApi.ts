type StaticDeal = {
  id: string;
  name: string;
  price: string;
  price_numeric?: number;
  original_price?: string;
  discount_percent?: number;
  image: string;
  metacritic?: number;
  steam_score?: string;
  platform: "steam" | "playstation" | "epic" | "ubisoft" | "other";
  url: string;
  genres?: string[];
  steamDeckVerified?: boolean;
};

type StaticDataset = {
  generatedAt?: string;
  deals: StaticDeal[];
};

const FALLBACK_DEMO_DEALS: StaticDeal[] = [
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
  {
    id: "demo-epic-control",
    name: "Control Ultimate Edition",
    price: "$9.99",
    price_numeric: 9.99,
    original_price: "$39.99",
    discount_percent: 75,
    image: "https://cdn1.epicgames.com/offer/calluna/EGS_ControlUltimateEdition_RemedyEntertainment_S1-2560x1440-ec5a8b8e84a140155aad3b622e121b9b.jpg",
    metacritic: 85,
    steam_score: "",
    platform: "epic",
    url: "https://store.epicgames.com/p/control",
    genres: ["Action", "Adventure", "Supernatural"],
  },
  {
    id: "demo-epic-alan-wake-2",
    name: "Alan Wake 2",
    price: "$29.99",
    price_numeric: 29.99,
    original_price: "$59.99",
    discount_percent: 50,
    image: "https://cdn1.epicgames.com/offer/6bb855de0c5843f7a9b799f4840d4c25/EGS_AlanWake2_RemedyEntertainment_S1_2560x1440-ec444cdf2cb6e8b7f8cce867fd7f90fd",
    metacritic: 89,
    steam_score: "",
    platform: "epic",
    url: "https://store.epicgames.com/p/alan-wake-2",
    genres: ["Survival Horror", "Action", "Story Rich"],
  },
];

const jsonResponse = (data: unknown, init: ResponseInit = {}) =>
  {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    return new Response(JSON.stringify(data), { ...init, headers });
  };

const getParam = (url: URL, name: string) => url.searchParams.get(name)?.trim() || "";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");

const normalizePlatform = (value: string) => {
  const platform = value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (platform === "ps" || platform === "psn" || platform === "playstationstore") return "playstation";
  if (platform === "egs" || platform === "epicgames" || platform === "epicgamesstore") return "epic";
  return platform;
};

const mergeFallbackDeals = (deals: StaticDeal[]) => {
  const seen = new Set<string>();
  return [...FALLBACK_DEMO_DEALS, ...deals].filter((deal) => {
    const key = deal.id || deal.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const loadDeals = async (): Promise<StaticDeal[]> => {
  const response = await fetch(`/data/deals.json?demo=${Date.now()}`, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Static data unavailable: ${response.status}`);
  }

  const dataset = (await response.json()) as StaticDataset | StaticDeal[];
  const deals = Array.isArray(dataset) ? dataset : dataset.deals || [];
  return mergeFallbackDeals(deals);
};

const filterDeals = (deals: StaticDeal[], url: URL) => {
  const platform = normalizePlatform(getParam(url, "platform"));
  const query = getParam(url, "q");

  return deals.filter((deal) => {
    const dealPlatform = normalizePlatform(deal.platform);
    const matchesPlatform = !platform || platform === "all" || dealPlatform === platform;
    const matchesQuery = !query || normalize(deal.name).includes(normalize(query));
    return matchesPlatform && matchesQuery;
  });
};

const paginate = (deals: StaticDeal[], url: URL) => {
  const page = Math.max(Number(getParam(url, "page")) || 1, 1);
  const pageSize = 48;
  return deals.slice((page - 1) * pageSize, page * pageSize);
};

export const handleStaticApiRequest = async (path: string, options: RequestInit = {}) => {
  const url = new URL(path, window.location.origin);
  const deals = await loadDeals();

  if (url.pathname === "/api/deals") {
    return jsonResponse(paginate(filterDeals(deals, url), url));
  }

  if (url.pathname === "/api/search") {
    const query = getParam(url, "q");
    const searchUrl = new URL(url);
    searchUrl.searchParams.set("platform", "all");
    searchUrl.searchParams.set("page", "1");
    const results = filterDeals(deals, searchUrl)
      .filter((deal) => !query || normalize(deal.name).includes(normalize(query)))
      .slice(0, 12);
    return jsonResponse(results);
  }

  if (url.pathname === "/api/wishlist/refresh" && options.method === "POST") {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const items = Array.isArray(body.items) ? body.items : [];
    const refreshed = items.map((item: StaticDeal) => {
      const liveDeal = deals.find((deal) => deal.id === item.id || deal.url === item.url);
      return liveDeal || item;
    });
    return jsonResponse(refreshed);
  }

  if (url.pathname === "/api/wishlist/cross_platform_refresh" && options.method === "POST") {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const titles = Array.isArray(body.titles) ? body.titles : [];
    const grouped = titles.reduce<Record<string, StaticDeal[]>>((acc, title: string) => {
      const key = normalize(title);
      acc[title] = deals.filter((deal) => normalize(deal.name).includes(key)).slice(0, 5);
      return acc;
    }, {});
    return jsonResponse(grouped);
  }

  if (url.pathname === "/api/alerts/send" && options.method === "POST") {
    return jsonResponse({ ok: true, demo: true });
  }

  if (url.pathname === "/api/metadata") {
    return jsonResponse({});
  }

  return jsonResponse({ error: "Static demo endpoint not available" }, { status: 404 });
};
