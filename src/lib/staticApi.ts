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

const jsonResponse = (data: unknown, init: ResponseInit = {}) =>
  {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    return new Response(JSON.stringify(data), { ...init, headers });
  };

const getParam = (url: URL, name: string) => url.searchParams.get(name)?.trim() || "";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");

const loadDeals = async (): Promise<StaticDeal[]> => {
  const response = await fetch(`/data/deals.json?demo=${Date.now()}`, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Static data unavailable: ${response.status}`);
  }

  const dataset = (await response.json()) as StaticDataset | StaticDeal[];
  return Array.isArray(dataset) ? dataset : dataset.deals || [];
};

const filterDeals = (deals: StaticDeal[], url: URL) => {
  const platform = getParam(url, "platform").toLowerCase();
  const query = getParam(url, "q");

  return deals.filter((deal) => {
    const matchesPlatform = !platform || platform === "all" || deal.platform === platform;
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
