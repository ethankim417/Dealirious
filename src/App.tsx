import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, 
  Gamepad2, 
  Heart, 
  Bell, 
  ExternalLink, 
  Star,
  Plus,
  Trash2,
  Monitor,
  Smartphone,
  Layers,
  ChevronRight,
  Globe,
  Zap,
  Check,
  AlignJustify,
  ShieldCheck,
  LogOut,
  LogIn,
  EyeOff,
  Eye,
  Share2,
  RefreshCw,
  Settings,
  Languages,
  ChevronDown,
  Filter,
  Percent,
  BadgeDollarSign,
  TrendingDown,
  ArrowUpDown,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import Cookies from "js-cookie";
import { auth, db, loginWithGoogle, logoutUser } from "./lib/firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  where,
  getDocs,
  addDoc,
  updateDoc,
  getDoc,
  getDocFromServer,
  writeBatch
} from "firebase/firestore";
import { onAuthStateChanged, User, deleteUser } from "firebase/auth";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LegalModals } from "./components/LegalModals";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface GameDeal {
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
}

export const extractCurrency = (priceStr?: string) => {
  if (!priceStr) return '$';
  const match = priceStr.match(/^[^0-9.-]+/) || priceStr.match(/[^0-9.-]+$/);
  return match ? match[0].trim() : '$';
};

export const formatChartPrice = (value: number, priceStr?: string) => {
  const currency = extractCurrency(priceStr);
  const isUSD = currency.includes('$');
  const formattedNum = value.toLocaleString(undefined, {
    minimumFractionDigits: isUSD ? 2 : 0,
    maximumFractionDigits: isUSD ? 2 : 0
  });

  const isSuffix = priceStr && priceStr.match(/[^0-9.-]+$/) !== null && priceStr.match(/^[^0-9.-]+/) === null;
  return isSuffix ? `${formattedNum}${currency}` : `${currency}${formattedNum}`;
};

const extractPriceData = (priceStr?: string) => {
  if (!priceStr) return 0;
  const numStr = priceStr.replace(/[^0-9.]/g, '');
  return parseFloat(numStr) || 0;
};

const cleanTitle = (title: string) => {
  if (!title) return "";
  
  // High-confidence language keywords that we want to strip
  const langKeywords = [
    'chinese', 'simplified', 'traditional', 'korean', 'japanese', 'english',
    '중국어', '한국어', '일본어', '영어', '한글', '간체', '번체',
    '繁體中文', '簡體中文', '버전', 'ver.'
  ];

  let cleaned = title;

  // Handle separators followed by language lists (common in Asian stores)
  // e.g., "Game Name : Simplified Chinese, Korean, English"
  const separators = [":", " - ", " / "];
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep);
      const lastPart = parts[parts.length - 1].toLowerCase();
      
      // If the last part contains language keywords, discard it
      if (langKeywords.some(kw => lastPart.includes(kw.toLowerCase()))) {
        cleaned = parts.slice(0, -1).join(sep);
      }
    }
  }

  // Also handle patterns in brackets/parentheses like (Korean/Chinese Ver.)
  // More aggressive cleanup for common store patterns
  const bracketRegex = /\s*[(\[][^()\[\]]*?(Korean|Chinese|English|Japanese|繁體中文|簡體中文|한국어|영어|중국어|일본어|버전|ver|Simplified|Traditional)[^()\[\]]*?[)\]]/gi;
  cleaned = cleaned.replace(bracketRegex, '');
  
  // Final cleanup of trailing separators
  return cleaned.replace(/[\s:/\\-]+$/g, '').trim();
};

const generatePriceHistory = (dealId: string, originalPriceStr?: string, currentPriceStr?: string) => {
  const currentPrice = extractPriceData(currentPriceStr);
  let origPrice = currentPrice > 0 ? currentPrice * 1.5 : 0; 
  if (originalPriceStr) {
    const parsed = extractPriceData(originalPriceStr);
    if (!isNaN(parsed) && parsed > currentPrice) {
      origPrice = parsed;
    }
  }

  const currency = extractCurrency(currentPriceStr);
  const isUSD = currency.includes('$');

  // Deterministic seed based on deal ID to prevent chart flickering/dancing on every React re-render
  let seed = 0;
  for(let i = 0; i < dealId.length; i++) {
    seed += dealId.charCodeAt(i);
  }
  const prng = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIndex = new Date().getMonth();
  
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const monthLabel = months[(currentMonthIndex - i + 12) % 12];
    if (i === 0) {
       data.push({ month: monthLabel, price: isUSD ? parseFloat(currentPrice.toFixed(2)) : Math.round(currentPrice) });
    } else if (i === 11) {
       data.push({ month: monthLabel, price: isUSD ? parseFloat(origPrice.toFixed(2)) : Math.round(origPrice) });
    } else {
       const isSale = prng() > 0.6;
       let pricePoint = origPrice;
       if (isSale) {
         const dropPRNG = prng();
         if (dropPRNG > 0.8) {
           pricePoint = currentPrice * (0.8 + prng() * 0.2);
           if (pricePoint > origPrice) pricePoint = origPrice;
         } else {
           pricePoint = Math.max(currentPrice, origPrice - (origPrice - currentPrice) * (prng() * 0.8));
         }
       }
         
       const finalPrice = isUSD ? parseFloat(pricePoint.toFixed(2)) : Math.round(pricePoint);
       data.push({ month: monthLabel, price: finalPrice });
    }
  }
  return data;
};

export function getMetacriticColor(score: number | undefined) {
  if (score == null) return "bg-gray-500/20 text-gray-500";
  if (score >= 75) return "bg-[#66CC33]/20 text-[#66CC33] border-[#66CC33]/50";
  if (score >= 50) return "bg-[#FFCC33]/20 text-[#FFCC33] border-[#FFCC33]/50";
  return "bg-[#FF0000]/20 text-[#FF0000] border-[#FF0000]/50";
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}



const t = (en: string, language: string) => {
  if (language !== 'ko') return en;
  const map: Record<string, string> = {
    'Search deals...': '할인 검색...',
    'Global Deals': '글로벌 게임 할인 모음',
    'Loading initial data...': '데이터 불러오는 중...',
    'Discover Deals': '스토어 할인 탐색',
    'Discover discounts across all platforms.': '모든 플랫폼의 할인된 게임을 찾아보세요.',
    'Wishlist': '위시리스트',
    'Login to sync wishlist': '위시리스트를 동기화하려면 로그인하세요',
    'Dashboard': '대시보드',
    'Any Price': '모든 가격',
    'Under ₩10,000': '₩10,000 이하',
    'Under ₩20,000': '₩20,000 이하',
    'Under ₩30,000': '₩30,000 이하',
    'Under 0': '0 이하',
    'Any Discount': '모든 할인율',
    '40%+ Off': '40% 이상 할인',
    '60%+ Off': '60% 이상 할인',
    '80%+ Off': '80% 이상 할인',
    'Any Score': '모든 점수',
    '70+ Score': '70점 이상',
    '80+ Score': '80점 이상',
    '90+ Score': '90점 이상',
    'All Genres': '모든 장르',
    'Action': '액션',
    'Adventure': '어드벤처',
    'RPG': 'RPG',
    'Simulation': '시뮬레이션',
    'Strategy': '전략',
    'Shooter': '슈팅',
    'VR': 'VR',
    'Sort By': '정렬 기준',
    'Price: Low to High': '가격: 낮은 순',
    'Price: High to Low': '가격: 높은 순',
    'Discount %': '최대 할인율 순',
    'Name': '이름 알파벳순',
    'Hide NSFW': '성인 콘텐츠 숨기기',
    'Filter by tag/genre...': '장르 또는 태그 필터...',
    'Best Deals': '최고의 딜',
    'Historical Lows': '역대 최저가 목록',
    'HISTORICAL LOW': '역대 최저가',
    'ALL-TIME LOW:': '역대 최저가:',
    'All Deals': '전체 보기',
    'Search Results': '검색 결과',
    'Filters': '상세 필터',
    'Clear Filters': '필터 초기화',
    'Available Platforms': '구매 가능한 플랫폼',
    'No deals found for this specific query.': '해당하는 할인 상품이 없습니다.',
    'all': '전체',
    'steam': '스팀',
    'playstation': '플레이스테이션',
    'epic': '에픽',
    'ubisoft': '유비소프트',
    'quest': '퀘스트',
    'Steam': '스팀',
    'PlayStation': '플레이스테이션',
    'Nintendo': '닌텐도',
    'Epic': '에픽',
    'Ubisoft': '유비소프트',
    'Quest': '퀘스트',
    'South Korea': '대한민국',
    'United States': '미국',
    'Advanced Filters': '고급 필터',
    'Showing Top 8': '상위 8개 기기 표시',
    'Terms of Service': '이용약관',
    'Privacy Policy': '개인정보 처리방침',
    'DMCA': '저작권 보호(DMCA)',
    'Contact': '문의하기',
    'Dealirious is an independent data aggregation tool and is not affiliated with, endorsed by, or sponsored by Sony Interactive Entertainment, Microsoft, Valve Corporation, Epic Games, Ubisoft, or Meta.': 'Dealirious는 독립적인 데이터 애그리게이터이며 소니 인터랙티브 엔터테인먼트, 마이크로소프트, 밸브 코퍼레이션, 에픽 게임즈, 유비소프트, 또는 메타와 제휴하거나 스폰서를 받지 않았습니다.',
    'All trademarks, brands, game names, and box art are the intellectual property of their respective owners. Prices and availability are subject to change by the respective storefronts at any time.': '모든 등록 상표, 게임명, 박스 아트 등은 개별 소유자들의 자산입니다.',
    'Under $10': '$10 이하 (약 1.3만원)',
    'Under $20': '$20 이하 (약 2.7만원)',
    'Under $30': '$30 이하 (약 4만원)',
    'PRICE HISTORY': '가격 변동 내역',
    'Expected Retail Price': '예상 판매가',
    'Current Discount': '현재 할인가',
    'Estimated 30-day projection': '최근 30일 가격 추이',
    'CLOSE': '닫기',
    'VIEW ON METACRITIC': '메타크리틱 점수 보기',
    'ADD TO WISHLIST': '위시리스트에 추가',
    'REMOVE FROM WISHLIST': '위시리스트에서 제거',
    'Logout': '로그아웃',
    'Sign Out': '로그아웃',
    'Logged in as': '로그인 계정:',
    'Asset Watchlist': '찜한 게임 목록',
    'Sync Prices': '가격 동기화',
    'Initialize Search Protocol': '새 게임 추가',
    'SCANNING EXCHANGES...': '외부 스토어 동기화 중...',
    'Scanning Database...': '데이터베이스 검색 중...',
    'No assets found matching designation.': '일치하는 게임을 찾을 수 없습니다.',
    ' SCANNING MARKETS...': ' 스토어 검색 중...',
    ' MULTI-MARKET SYNCED': ' 다중 플랫폼 동기화 완료',
    'PlayStation Store': 'PS 스토어',
    'Nintendo eShop': '닌텐도',
    'Epic Games Store': '에픽 스토어',
    'Ubisoft Store': '유비소프트 스토어',
    'Meta Quest Store': '메타 스토어',
    'Steam Store': '스팀 스토어',
    'Search wishlist...': '내 위시리스트 검색...',
    'SEARCH FOR GAMES (PLAYSTATION, STEAM, EPIC)...': '게임 검색 (플스, 스팀, 에픽)...',
    'Authentication Required': '로그인 필요',
    'Sync your wishlist natively via Google Cloud infrastructure to monitor deals cross-platform across all your personal devices.': 'Google Cloud 인프라를 통해 위시리스트를 게임 스토어와 실시간 동기화합니다.',
    'Login with Google': '구글 로그인',
    'Adjust your scan parameters or search query. If you\'re browsing a specific platform, there might be no active sales at this moment.': '검색 조건을 변경하거나 다른 검색어를 입력해보세요.',
    'End of Results': '마지막 결과입니다',
    'Load More Assets': '데이터 더 불러오기',
    'Scanning Sector': '섹터 스캔 중',
    'Legal Disclaimer': '법적 고지',
    'Privacy & Cookie Policy': '개인정보 보호 및 쿠키 정책',
    'Strictly Essential Cookies': '필수 쿠키',
    'Non-Essential Cookies': '비필수 쿠키',
    'View Deal': '할인 상세 보기',
    '12-Month Price Trend': '12개월 가격 변동',
    'Price': '가격',
    'Got It': '확인',
    'Dealirious is a price aggregation tool and is not affiliated with, endorsed by, authorized by, or sponsored by Sony Interactive Entertainment, Valve Corporation, Epic Games, or Ubisoft. "PlayStation", "Steam", "Epic Games", "Quest", and "Ubisoft" are registered trademarks of their respective owners.': 'Dealirious는 가격 비교 서비스로, 소니, 밸브, 에픽게임즈 또는 유비소프트와 제휴하거나 보증을 받은 서비스가 아닙니다.',
    'Items:': '항목 수:',
    'Sort:': '정렬:',
    'Lowest Price First': '가장 저렴한 가격 순',
    'Highest Discount First': '크게 할인하는 순',
    'Recently Added': '최근 추가된 순',
    'Refresh Prices': '최신 가격 업데이트',
    'Cross-checking multiple storefronts...': '여러 스토어 가격을 비교 중입니다...',
    'Your wishlist is empty.': '위시리스트가 비어 있습니다.',
    'Head over to the Dashboard to add some games.': '대시보드에서 관심 있는 게임을 추가해보세요.',
    'System Settings': '시스템 설정',
    'Weekly Price Alerts': '주간 가격 알림 메일 (광고성 정보 수신 동의)',
    'Notice: This alert service is strictly prohibited for US residents. By enabling, you confirm you are located outside the US.': '안내: 본 서비스 이용 시 미국 외 지역 거주자임을 확인하는 것으로 간주됩니다.',
    'Active. We will email you weekly with wishlist items that have dropped into severe discount thresholds.': '활성화됨. 주간 메일이 발송됩니다.',
    'Offline. Automated background tracking is paused. You will not receive emails.': '비활성화됨.',
    'Discount Target': '목표 알람 할인율',
    'Send Test Alert (Preview)': '알림 테스트 전송 (미리보기)',
    'Data Privacy': '개인 정보 보호',
    'Clear all preferences and local cache.': '모든 설정 및 캐시 데이터를 지웁니다.',
    'PURGE DATA': '데이터 초기화',
    'Account Danger Zone': '계정 위험 설정',
    'Permanently delete your account and all associated data.': '계정 및 모든 데이터를 영구적으로 삭제합니다.',
    'TERMINATE ACCOUNT': '계정 탈퇴',
    'Delete Account': '계정 삭제',
    "STEAM / PC Asset": "스팀 / PC",
    'None of your tracked items are currently experiencing deep discounts.': '관심 있는 게임 중 큰 폭으로 할인 중인 게임이 없습니다.',
    '10% OFF': '10% 할인',
    '20% OFF': '20% 할인',
    '30% OFF': '30% 할인',
    '40% OFF': '40% 할인',
    '50% OFF': '50% 할인',
    '60% OFF': '60% 할인',
    '75% OFF': '75% 할인',
    '90% OFF': '90% 할인',
    '12M Trend': '12개월 트렌드',
    'Showing results for': '검색 결과:',
    'Clear Search': '검색어 초기화',
    'No Assets Found': '발견된 게임 자산이 없습니다.',
    'Access': '구매하기',
    'Price Trend': '가격 추이',
    'NSFW Hidden': '성인 콘텐츠 숨김',
    'NSFW Shown': '성인 콘텐츠 표시',
    'Sort: Recommended': '추천순',
    'Sort: Highest Discount': '할인율순',
    'Sort: Highest Score': '평점순',
    'ENTER GAME TITLE...': '게임 제목 입력...',
    '100% Official Stores. Zero Shady CD Keys.': '100% 공식 스토어 할인만 제공.',
    'BEST PRICE': '최저가',
    'MSRP': '정가',
    'Store': '스토어',
    'Watchlist Offline': '위시리스트 오프라인',
    'Initialize search protocol to begin monitoring global gaming assets.': '검색을 시작하여 전 세계 게임 할인을 모니터링하세요.',
    'Login Status: Offline': '로그인 상태: 오프라인',
    'Send Test Alert': '테스트 알림 전송',
    'Test alert dispatched!': '테스트 알림이 발송되었습니다!',
    'Failed to trigger test alert.': '테스트 알림 발송에 실패했습니다.',
    'Share Deal': '할인 정보 공유',
    'No Deals Found': '발견된 할인 정보 없음',
    'OFF': '할인',
  };
  return map[en] || en;
};
export default function App() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [deals, setDeals] = useState<GameDeal[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [wishlist, setWishlist] = useState<GameDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get("q") || "";
    }
    return "";
  });
  const [serverSearchQuery, setServerSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (serverSearchQuery !== searchQuery) {
        setServerSearchQuery(searchQuery);
        setPage(1); // Reset pagination on new search
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, serverSearchQuery]);
  const [platformFilter, setPlatformFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get("platform");
      if (p && ["all", "steam", "playstation", "epic", "ubisoft", "quest"].includes(p.toLowerCase())) {
        return p.toLowerCase();
      }
    }
    return "all";
  });
  const [showWishlist, setShowWishlist] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get("view") === "wishlist";
    }
    return false;
  });
  const [isScraping, setIsScraping] = useState(false);
  const [country, setCountry] = useState("kr");
  const [language, setLanguage] = useState<"en" | "ko">(() => {
    const saved = Cookies.get("lang");
    if (saved === "ko" || saved === "en") return saved;
    // Default to Korean if starting in KR region
    return "ko";
  });
  const lastManualLangUpdate = useRef(parseInt(sessionStorage.getItem('lastManualLangUpdate') || '0'));
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [wishlistSearch, setWishlistSearch] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const API_BASE = (import.meta as any).env.VITE_API_URL || '';

  const fetchWithRetry = async (path: string, options: any = {}, retries: number = 2, backoff: number = 400): Promise<Response> => {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('Timeout')), 60000); // 60s timeout
    
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok && (response.status === 429 || response.status >= 500) && retries > 0) {
        throw new Error(`Status ${response.status}`);
      }
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (retries > 0 && err instanceof Error && (err.name !== 'AbortError' || err.message === 'Timeout')) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw err;
    }
  };
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [trackingStatuses, setTrackingStatuses] = useState<Record<string, 'searching' | 'complete'>>({});
  const [crossPlatformAggregates, setCrossPlatformAggregates] = useState<Record<string, GameDeal[]>>({});
  const [discountFilter, setDiscountFilter] = useState<number>(40);
  const [scoreFilter, setScoreFilter] = useState<number>(0);
  const [priceMaxFilter, setPriceMaxFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("compact");
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasSeenSaleNotification, setHasSeenSaleNotification] = useState(false);
  const prevSaleCountRef = useRef(0);
  const [hideNSFW, setHideNSFW] = useState(true);
  const [showLegal, setShowLegal] = useState<'Terms of Service' | 'Privacy Policy' | 'DMCA' | 'Contact' | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState<number>(20);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<GameDeal | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const countries = [
    { code: "kr", name: t("South Korea", language), flag: "🇰🇷" },
    { code: "us", name: t("United States", language), flag: "🇺🇸" },
  ];

  // Global Auth Observer
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    checkConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthLoaded(true);
        if (!currentUser) {
            setWishlist([]); // Clear if logged out
            setAlertsEnabled(false);
            setAlertThreshold(20);
        }
    });
    return () => unsubscribe();
  }, []);

  const toggleAlerts = async () => {
    if (!user) {
      await handleLogin();
      return;
    }
    const newState = !alertsEnabled;
    setAlertsEnabled(newState);
    
    try {
      const docRef = doc(db, `users/${user.uid}/preferences/alerts`);
      await setDoc(docRef, { emailEnabled: newState, threshold: alertThreshold }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/preferences/alerts`);
      // Revert on failure
      setAlertsEnabled(!newState);
    }
  };

  const updateAlertThreshold = async (newThreshold: number) => {
    if (!user) return;
    setAlertThreshold(newThreshold);
    try {
      const docRef = doc(db, `users/${user.uid}/preferences/alerts`);
      await setDoc(docRef, { threshold: newThreshold }, { merge: true });
    } catch (e) {
      console.error("Failed to save threshold:", e);
    }
  };

  const updateLanguage = async (newLang: 'en' | 'ko') => {
    const now = Date.now();
    lastManualLangUpdate.current = now;
    sessionStorage.setItem('lastManualLangUpdate', now.toString());
    setLanguage(newLang);
    Cookies.set("lang", newLang, { expires: 365, path: '/' });
    
    // Clear wishlist throttle to force a fresh translation on next load
    sessionStorage.removeItem('wishlist_last_refresh');
    sessionStorage.removeItem('wishlist_last_lang');

    if (user) {
      handleRefreshWishlist(true);
      try {
        const docRef = doc(db, `users/${user.uid}/preferences/alerts`);
        await setDoc(docRef, { language: newLang, updatedAt: now }, { merge: true });
      } catch (e) {
        console.error("Failed to save language preference:", e);
      }
    }
  };

  // Global Wishlist & Preferences Firestore Sync
  useEffect(() => {
      if (!user) return;
      
      const pDoc = doc(db, `users/${user.uid}/preferences/alerts`);
      const unsubPref = onSnapshot(pDoc, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setAlertsEnabled(data.emailEnabled === true);
          if (data.threshold !== undefined) {
             setAlertThreshold(data.threshold);
          }
          if (data.lastAlertTime !== undefined) {
             setLastAlertTime(data.lastAlertTime);
          }
          if (data.language && (data.language === 'en' || data.language === 'ko')) {
             const currentLang = Cookies.get("lang");
             if (data.language !== currentLang) {
                // Ignore Firestore sync if we manually updated within the last 10 seconds 
                // to prevent stale snapshots from resetting the user's choice
                if (Date.now() - lastManualLangUpdate.current < 10000) return;
                
                setLanguage(data.language);
                Cookies.set("lang", data.language, { expires: 365, path: '/' });
             }
          }
        }
      });

      const q = query(
        collection(db, `users/${user.uid}/wishlist`),
        where("userId", "==", user.uid)
      );

      const unsubWishlist = onSnapshot(
          q,
          (snapshot) => {
              const loadedWishlist = snapshot.docs.map(doc => {
                const data = doc.data() as GameDeal;
                return { ...data, name: cleanTitle(data.name) };
              });
              setWishlist(loadedWishlist);
              
              const statuses: Record<string, 'complete'> = {};
              loadedWishlist.forEach((item) => {
                  statuses[item.id] = 'complete';
              });
              setTrackingStatuses(statuses);
          },
          (error) => {
              console.error("Firestore sync failed:", error);
          }
      );
      return () => {
        unsubPref();
        unsubWishlist();
      };
  }, [user]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (wishlistSearch.length > 2) {
        searchGames(wishlistSearch);
      } else {
        setSearchSuggestions([]);
        setHasSearched(false);
        setIsSearching(false);
      }
    }, 600); 

    return () => clearTimeout(delayDebounceFn);
  }, [wishlistSearch]);

  const lastSearchQuery = useRef("");
  const searchGames = async (query: string) => {
    lastSearchQuery.current = query;
    setIsSearching(true);
    setHasSearched(false);
    try {
      if (query.startsWith('http://') || query.startsWith('https://')) {
        const response = await fetchWithRetry(`/api/metadata?url=${encodeURIComponent(query)}&cc=${country}&lang=${language}`);
        const data = await response.json();
        
        if (lastSearchQuery.current !== query) return;

        if (data && data.title) {
          setSearchSuggestions([{
            id: `custom-${Date.now()}`,
            name: cleanTitle(data.title),
            price: data.price_formatted || 'N/A',
            price_numeric: 0,
            original_price: '',
            discount_percent: 0,
            image: data.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400&h=200",
            platform: data.platform || 'unknown',
            url: query
          }]);
        } else {
          setSearchSuggestions([]);
        }
      } else {
        const response = await fetchWithRetry(`/api/search?q=${encodeURIComponent(query)}&cc=${country}&lang=${language}&v=6`);
        const data = await response.json();
        
        if (lastSearchQuery.current !== query) return;

        const cleanedData = Array.isArray(data) ? data.map((game: any) => ({
          ...game,
          name: cleanTitle(game.name)
        })) : [];
        setSearchSuggestions(cleanedData);
      }
    } catch (error) {
      if (lastSearchQuery.current === query) {
        console.error("Search failed:", error);
        setSearchSuggestions([]);
      }
    } finally {
      if (lastSearchQuery.current === query) {
        setIsSearching(false);
        setHasSearched(true);
      }
    }
  };

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError("Sign-in cancelled. You must be signed in to add items to your Wishlist.");
      } else {
        setAuthError("Failed to authenticate. Please check your cookies or popup blocker.");
      }
      setTimeout(() => setAuthError(null), 5000);
    }
  };

  const addToWishlistFromSearch = async (game: any) => {
    if (!user) {
        await handleLogin();
        return;
    }
    const exists = wishlist.find(item => item.name === game.name);
    if (!exists) {
      if (wishlist.length >= 500) {
        alert(t("You have reached the maximum limit of 500 items in your wishlist.", language));
        return;
      }
      setTrackingStatuses(prev => ({ ...prev, [game.id]: 'searching' }));
      const docRef = doc(db, `users/${user.uid}/wishlist/${game.id}`);
      await setDoc(docRef, {
          userId: user.uid,
          id: game.id,
          name: cleanTitle(game.name || "Unknown"),
          price: game.price || "N/A",
          price_numeric: game.price_numeric || 0,
          original_price: game.original_price || "",
          discount_percent: game.discount_percent || 0,
          image: game.image || "",
          platform: game.platform || "unknown",
          url: game.url || "",
          metacritic: game.metacritic || 0,
          steam_score: game.steam_score || "",
          genres: game.genres || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
      });
      
      fetchWithRetry(`/api/wishlist/cross_platform_refresh?cc=${country}&lang=${language}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titles: [game.name] })
      }).then(res => res.json()).then(data => {
          setCrossPlatformAggregates(prev => ({ ...prev, ...data }));
      }).catch(console.error);
    }
    setWishlistSearch("");
    setSearchSuggestions([]);
    setHasSearched(false);
  };

  // Restore missing functions
  const fetchDeals = async (cc: string = "kr", platform: string = "all", targetPage: number = 1, searchQueryParam: string = "") => {
    if (targetPage === 1) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const response = await fetchWithRetry(`/api/deals?cc=${cc}&platform=${platform}&page=${targetPage}&lang=${language}&q=${encodeURIComponent(searchQueryParam)}&v=6`);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("API returned non-JSON response:", text.substring(0, 500));
        throw new Error(`Server returned ${response.status} ${response.statusText} as ${contentType || 'unknown'}. This usually means the server is restarting or has crashed.`);
      }

      const data = await response.json();
      
      const rawDeals = Array.isArray(data) ? data : [];
      const dealsArray = rawDeals.map(d => ({ ...d, name: cleanTitle(d.name) }));
      if (data.error) {
        console.error("API returned error:", data.error);
        if (targetPage === 1 && dealsArray.length === 0) {
             setDeals([]);
             setHasMore(false);
             return;
        }
      }
      
      if (targetPage === 1) {
        setDeals(dealsArray);
        setHasMore(dealsArray.length > 0);
      } else {
        if (dealsArray.length === 0) setHasMore(false);
        setDeals(prev => {
          // Merge data uniquely by id to prevent duplicates
          const newDeals = [...prev];
          const idSet = new Set(prev.map(d => d.id));
          for (const deal of dealsArray) {
            if (!idSet.has(deal.id)) {
              newDeals.push(deal);
            }
          }
          return newDeals;
        });
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error);
    } finally {
      if (targetPage === 1) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const loadMoreDeals = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDeals(country, platformFilter, nextPage, serverSearchQuery);
  };

  const handleCountryChange = (cc: string) => {
    setCountry(cc);
    setPage(1);
  };

  const handlePlatformChange = (p: string) => {
    setPlatformFilter(p);
    setPage(1);
    
    // Update URL for SEO
    const currentUrl = new URL(window.location.href);
    if (p === "all") {
      currentUrl.searchParams.delete("platform");
    } else {
      currentUrl.searchParams.set("platform", p);
    }
    window.history.pushState({}, "", currentUrl.toString());

    if (p === "all") {
      setDiscountFilter(40);
      setSortBy("recommended");
    } else {
      setDiscountFilter(0);
    }
  };
  
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    const currentUrl = new URL(window.location.href);
    if (query.trim() === "") {
        currentUrl.searchParams.delete("q");
    } else {
        currentUrl.searchParams.set("q", query);
    }
    window.history.replaceState({}, "", currentUrl.toString());
  };

  useEffect(() => {
    fetchDeals(country, platformFilter, 1, serverSearchQuery);
  }, [country, platformFilter, language, serverSearchQuery]);

  const loadMoreRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || isLoadingMore || showWishlist || !hasMore || isDesktop) return;
    
    // Auto-load next page on intersection
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreDeals();
      }
    }, { threshold: 0.1 });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, showWishlist, page, country, platformFilter, hasMore, isDesktop]);

  const removeGroupFromWishlist = async (aliases: string[]) => {
    if (!user || !aliases || !Array.isArray(aliases)) return;
    try {
      const itemsToRemove = wishlist.filter(item => item.name && aliases.includes(item.name));
      if (itemsToRemove.length === 0) return;
      const batch = writeBatch(db);
      for (const item of itemsToRemove) {
        const docRef = doc(db, `users/${user.uid}/wishlist/${item.id}`);
        batch.delete(docRef);
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/wishlist/batch`);
    }
  };

  const toggleWishlist = async (game: GameDeal) => {
    if (!user) {
        await handleLogin();
        return;
    }
    const exists = wishlist.find(item => item.url === game.url);
    try {
      if (exists) {
        const docRef = doc(db, `users/${user.uid}/wishlist/${game.id}`);
        await deleteDoc(docRef);
      } else {
        if (wishlist.length >= 500) {
          alert(t("You have reached the maximum limit of 500 items in your wishlist.", language));
          return;
        }
        setTrackingStatuses(prev => ({ ...prev, [game.id]: 'searching' }));
        const docRef = doc(db, `users/${user.uid}/wishlist/${game.id}`);
        await setDoc(docRef, {
            userId: user.uid,
            id: game.id,
            name: game.name || "Unknown",
            price: game.price || "N/A",
            price_numeric: game.price_numeric || 0,
            original_price: game.original_price || "",
            discount_percent: game.discount_percent || 0,
            image: game.image || "",
            platform: game.platform || "unknown",
            url: game.url || "",
            metacritic: game.metacritic || 0,
            steam_score: game.steam_score || "",
            genres: game.genres || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, exists ? OperationType.DELETE : OperationType.CREATE, `users/${user.uid}/wishlist/${game.id}`);
    }
  };

  const handleShare = async (game: GameDeal) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Dealirious: ${game.name}`,
          text: `Check out this deal for ${game.name} on Dealirious!`,
          url: game.url,
        });
      } else {
        await navigator.clipboard.writeText(game.url);
        setShareFeedback(game.id);
        setTimeout(() => setShareFeedback(null), 2000);
      }
    } catch (e) {
      console.warn("Share failed", e);
    }
  };

  const getDealRating = (discount: number = 0) => {
    if (discount >= 80) return { label: t("EPIC DEAL", language), color: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30" };
    if (discount >= 60) return { label: t("GREAT DEAL", language), color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
    if (discount >= 40) return { label: t("GOOD DEAL", language), color: "bg-green-500/20 text-green-400 border-green-500/30" };
    return null;
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (!deal || !deal.name) return false;
      
      if (hideNSFW) {
        const lowerName = deal.name.toLowerCase();
        const nsfwKeywords = ['hentai', 'sexual content', 'nudity', 'nsfw', 'adult only', 'sex'];
        const hasNSFWTitle = nsfwKeywords.some(kw => lowerName.includes(kw));
        const hasNSFWGenre = deal.genres?.some(g => nsfwKeywords.some(kw => g.toLowerCase().includes(kw)));
        if (hasNSFWTitle || hasNSFWGenre) return false;
      }

      const matchesSearch = deal.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiscount = searchQuery ? true : (discountFilter === 0 || (deal.discount_percent || 0) >= discountFilter);
      const matchesScore = searchQuery ? true : (scoreFilter === 0 || (deal.metacritic || 0) >= scoreFilter);
      const matchesPrice = searchQuery ? true : (priceMaxFilter === 0 || (deal.price_numeric || 0) <= priceMaxFilter);
      
      return matchesSearch && matchesDiscount && matchesScore && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === "discount") return (b.discount_percent || 0) - (a.discount_percent || 0);
      if (sortBy === "score") return (b.metacritic || 0) - (a.metacritic || 0);
      if (sortBy === "asc") return (a.price_numeric || 999999) - (b.price_numeric || 999999);
      if (sortBy === "desc") return (b.price_numeric || 0) - (a.price_numeric || 0);
      const scoreA = (a.metacritic || 70) + (a.discount_percent || 0);
      const scoreB = (b.metacritic || 70) + (b.discount_percent || 0);
      return scoreB - scoreA;
    });
  }, [deals, hideNSFW, searchQuery, discountFilter, scoreFilter, priceMaxFilter, sortBy]);

  const [isRefreshingWishlist, setIsRefreshingWishlist] = useState(false);

  const [isCrossPlatformSyncing, setIsCrossPlatformSyncing] = useState(false);

  const handleRefreshWishlist = (force = false) => {
    if (!showWishlist || wishlist.length === 0 || isRefreshingWishlist) return;
    
    if (!force) {
      const lastRefresh = sessionStorage.getItem('wishlist_last_refresh');
      const lastLang = sessionStorage.getItem('wishlist_last_lang');
      const SIX_HOURS = 6 * 60 * 60 * 1000;
      if (lastRefresh && Date.now() - Number(lastRefresh) < SIX_HOURS && lastLang === language && Object.keys(crossPlatformAggregates).length > 0) return;
    }

    setIsRefreshingWishlist(true);
    setIsCrossPlatformSyncing(true);
    
    // Original refresh logic for exact saved deals
    fetchWithRetry(`/api/wishlist/refresh?cc=${country}&lang=${language}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: wishlist })
    })
    .then(res => res.json())
    .then(async updatedItems => {
      if (!user || !Array.isArray(updatedItems) || updatedItems.length === 0) return;
      
      let changed = false;
      const droppedItems = [];
      const newWishlist = [...wishlist];

      for (let i = 0; i < newWishlist.length; i++) {
        const existing = newWishlist[i];
        const updated = updatedItems.find(u => u.id === existing.id);
        
        if (updated && (existing.price !== updated.price || existing.discount_percent !== updated.discount_percent || existing.name !== updated.name)) {
          changed = true;
          
          if (
            updated.price_numeric < existing.price_numeric && 
            updated.price_numeric > 0 &&
            (updated.discount_percent || 0) >= alertThreshold
          ) {
            droppedItems.push({
               name: updated.name || existing.name,
               old_price: existing.price,
               current_price: updated.price,
               url: existing.url,
               image: existing.image,
               platform: existing.platform
            });
          }

          // Use the name from backend directly as it respects the 'lang' parameter
          const newName = cleanTitle(updated.name || existing.name);

          newWishlist[i] = {
            ...existing,
            name: newName,
            price: updated.price,
            price_numeric: updated.price_numeric,
            original_price: updated.original_price,
            discount_percent: updated.discount_percent,
          };

          try {
            const docRef = doc(db, `users/${user.uid}/wishlist/${existing.id}`);
            await setDoc(docRef, {
              ...newWishlist[i],
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (e) {
            console.warn("Failed to overwrite wishlist item:", e);
          }
        }
      }

      if (changed) {
        setWishlist(newWishlist);
      }

      if (droppedItems.length > 0 && alertsEnabled && user.email) {
        const now = Date.now();
        // 7 days weekly constraint
        if (now - lastAlertTime > 7 * 24 * 60 * 60 * 1000) {
          try {
            await fetchWithRetry("/api/alerts/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email, items: droppedItems, lang: language })
            });
            // Update Firestore with new lastAlertTime
            const docRef = doc(db, `users/${user.uid}/preferences/alerts`);
            await setDoc(docRef, { lastAlertTime: now }, { merge: true });
          } catch (e) {
            console.error("Failed to trigger price alert email on backend:", e);
          }
        } else {
          console.log("Weekly alert quota reached. Suppressing alert.");
        }
      }

      sessionStorage.setItem('wishlist_last_refresh', Date.now().toString());
      sessionStorage.setItem('wishlist_last_lang', language);
    })
    .catch(console.error)
    .finally(() => setIsRefreshingWishlist(false));
    
    // Cross-platform aggregate fetch
    const uniqueTitles = Array.from(new Set(wishlist.map(w => w.name)));
    fetchWithRetry(`/api/wishlist/cross_platform_refresh?cc=${country}&lang=${language}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titles: uniqueTitles })
    })
    .then(res => res.json())
    .then(data => {
      setCrossPlatformAggregates(data);
    })
    .catch(err => console.error("Cross platform fetch failed:", err))
    .finally(() => setIsCrossPlatformSyncing(false));
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Are you sure you want to completely delete your account and all associated data? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      // 1. Delete all wishlist items
      const batch = writeBatch(db);
      for (const item of wishlist) {
        const itemRef = doc(db, `users/${user.uid}/wishlist/${item.id}`);
        batch.delete(itemRef);
      }
      
      // 2. Delete preferences
      const pDoc = doc(db, `users/${user.uid}/preferences/alerts`);
      batch.delete(pDoc);

      await batch.commit();
      
      // 3. Delete auth account
      await deleteUser(user);

      setUser(null);
      setWishlist([]);
      setShowWishlist(false);
      alert(t("Your account and all associated data have been permanently deleted.", language));
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        alert(t("For security reasons, please log out and log back in before deleting your account.", language));
      } else {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/account`);
      }
    }
  };

  useEffect(() => {
    handleRefreshWishlist();
  }, [showWishlist, wishlist, country, user, alertThreshold, alertsEnabled, language]);

  const filteredWishlist = useMemo(() => {
    return wishlist.map(item => {
      // Merge with live deals if available (especially useful for PSN/Nintendo/Epic which don't auto-refresh yet)
      const liveDeal = deals.find(d => d.url === item.url || (d.name === item.name && d.platform === item.platform));
      if (liveDeal) {
        return {
          ...item,
          price: liveDeal.price,
          price_numeric: liveDeal.price_numeric,
          original_price: liveDeal.original_price,
          discount_percent: liveDeal.discount_percent,
        };
      }
      return item;
    }).filter(item => {
      if (!item || !item.name) return false;
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [wishlist, searchQuery, deals]);

  const groupedWishlist = useMemo(() => {
    const normalizeGameName = (name: string) => {
        if (!name) return "";
        // Extract English title from bilingual formats like "데드 바이 데이라이트 (Dead by Daylight)"
        let extracted = name;
        const match = name.match(/\((.*?)\)/);
        if (match && /^[a-z0-9\s\-\.\:\'!&]+$/i.test(match[1])) {
            extracted = match[1];
        } else if (name.includes(" (") && name.includes(")")) {
            // If it's "Korean (Eng)", try to separate
            const parts = name.split(/[()]/);
            if (parts.length >= 2) {
                const enPart = parts[1].trim();
                const koPart = parts[0].trim();
                if (/^[a-z0-9\s]+$/i.test(enPart)) extracted = enPart;
                else extracted = koPart;
            }
        }

        // Keep Korean characters as well as alphanumeric
        let n = extracted.toLowerCase().replace(/[^a-z0-9\s가-힣]/g, '').trim().replace(/\s+/g, ' ');
        n = n.replace(/\b(ps4|ps5|pc|switch|edition|deluxe|standard|ultimate|directors|cut|s)\b/g, '').trim();
        return n.replace(/\s+/g, '');
    };

    const groups: Record<string, { baseItem: GameDeal, aliases: string[] }> = {};
    
    filteredWishlist.forEach(item => {
        const norm = (item as any).slug || normalizeGameName(item.name);
        
        if (!groups[norm]) {
            groups[norm] = { baseItem: item, aliases: [item.name] };
        } else {
            if (!groups[norm].aliases.includes(item.name)) {
                groups[norm].aliases.push(item.name);
            }
        }
    });
    
    return Object.values(groups).map(group => {
       const allDeals = new Map<string, GameDeal>();
       filteredWishlist.filter(w => group.aliases.includes(w.name)).forEach(w => {
           allDeals.set(w.platform, w);
       });
       group.aliases.forEach(alias => {
           const crossDeals = crossPlatformAggregates[alias] || [];
           crossDeals.forEach(deal => {
               const existing = allDeals.get(deal.platform);
               if (!existing || deal.price_numeric < existing.price_numeric) {
                   allDeals.set(deal.platform, deal as unknown as GameDeal);
               }
           });
       });
       return {
           baseItem: group.baseItem,
           aliases: group.aliases,
           aggregated: Array.from(allDeals.values())
       };
    });
  }, [filteredWishlist, crossPlatformAggregates]);

  const wishlistOnSaleCount = useMemo(() => {
    return groupedWishlist.filter(group => {
      // Check if any deal in the group is on sale according to the user's alert threshold
      return group.aggregated.some(deal => deal.discount_percent && deal.discount_percent >= alertThreshold);
    }).length;
  }, [groupedWishlist, alertThreshold]);

  useEffect(() => {
    if (wishlistOnSaleCount > prevSaleCountRef.current) {
      setHasSeenSaleNotification(false);
    }
    prevSaleCountRef.current = wishlistOnSaleCount;
  }, [wishlistOnSaleCount]);

  const dealSections = [
    ...(searchQuery ? [] : [
      { 
        id: "best", 
        label: t("Best Deals", language),
        filterFn: (d: any) => (d.metacritic || 0) >= 80 && (d.discount_percent || 0) >= 50 
      },
      { 
        id: "historical", 
        label: t("Historical Lows", language),
        filterFn: (d: any) => (d.discount_percent || 0) >= 75 
      },
      { 
        id: "under10k", 
        label: t(country === "kr" ? "Under ₩10,000" : "Under $10", language), 
        filterFn: (d: any) => { 
          const limit = country === "kr" ? 10000 : 10; 
          return d.price_numeric > 0 && d.price_numeric <= limit; 
        } 
      }
    ]),
    { 
      id: "all", 
      label: searchQuery ? t("Search Results", language) : t("All Deals", language), 
      filterFn: () => true 
    }
  ];

  const handleTabChange = (showWish: boolean) => {
    setShowWishlist(showWish);
    const currentUrl = new URL(window.location.href);
    if (showWish) {
      currentUrl.searchParams.set("view", "wishlist");
    } else {
      currentUrl.searchParams.delete("view");
    }
    window.history.pushState({}, "", currentUrl.toString());
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#e4e4e7] font-sans selection:bg-cyan-500/30">
      
      {/* Auth Error Toast notification */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-24 left-1/2 z-[100] bg-red-500/10 border border-red-500/50 backdrop-blur-xl px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 w-max max-w-[90vw]"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-red-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
              {t(authError, language)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Futuristic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050507]/60 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => handleTabChange(false)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-2xl font-black tracking-tighter uppercase italic hidden md:block">
                  Deal<span className="text-cyan-500">irious</span>
                </span>
              </button>

              <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {["Dashboard", "Wishlist"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab === "Wishlist")}
                    className={cn(
                      "px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all",
                      (tab === "Wishlist" ? showWishlist : !showWishlist)
                        ? "bg-white/10 text-white shadow-lg"
                        : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {t(tab, language)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-2 sm:px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
                <Languages className="w-4 h-4 text-gray-500" />
                <select 
                  value={language}
                  onChange={(e) => updateLanguage(e.target.value as 'en' | 'ko')}
                  className="bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer text-cyan-400"
                >
                  <option value="en" className="bg-[#0a0a0c]">EN</option>
                  <option value="ko" className="bg-[#0a0a0c]">KO</option>
                </select>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-2 sm:px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
                <Globe className="w-4 h-4 text-gray-500" />
                <select 
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer"
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.code} className="bg-[#0a0a0c]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) setHasSeenSaleNotification(true);
                  }}
                  className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all relative"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                  {wishlistOnSaleCount > 0 && !hasSeenSaleNotification && <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-cyan-500 rounded-full text-[9px] font-black text-black">1</span>}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-white/90">{t("Notification Center", language)}</h3>
                      </div>
                      <div className="p-5 flex flex-col gap-4">
                         <div className="flex gap-4 items-start">
                           <div className="flex-1">
                             {wishlistOnSaleCount > 0 ? (
                               <button 
                                 onClick={() => {
                                   setShowWishlist(true);
                                   setShowNotifications(false);
                                 }}
                                 className="text-left group/sale"
                               >
                                 <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">{wishlistOnSaleCount} {wishlistOnSaleCount === 1 ? 'Item' : 'Items'} on sale!</p>
                                 <p className="text-xs text-gray-400 mt-1">{t("Check your wishlist now", language)}</p>
                               </button>
                             ) : (
                               <div>
                                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("No Active Drops", language)}</p>
                                 <p className="text-[10px] sm:text-xs text-gray-600 bg-[#0a0a0c]">{t("None of your tracked items are currently experiencing deep discounts.", language)}</p>
                               </div>
                             )}
                           </div>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleTabChange(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group/wishlist"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 group-hover/wishlist:text-cyan-300">{t("Wishlist", language)} ({wishlist.length})</span>
                  </button>

                  <div className="relative">
                    <button 
                      onClick={() => setShowSettings(!showSettings)}
                      className={cn(
                        "flex items-center justify-center p-2.5 rounded-lg transition-all cursor-pointer group/btn",
                        showSettings 
                          ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400" 
                          : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white"
                      )}
                      title={t("Account Settings", language)}
                    >
                      <Settings className={cn("w-5 h-5 transition-transform duration-500", showSettings ? "rotate-90" : "group-hover/btn:rotate-45")} />
                    </button>
                    
                    <AnimatePresence>
                      {showSettings && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-80 bg-[#0d0d10]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 origin-top-right"
                          >
                             <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                               <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{t("Signed in as", language)}</p>
                               <p className="text-[11px] font-bold text-gray-300 truncate mt-1">{user.email}</p>
                             </div>
                             
                             <div className="p-4 border-b border-white/5">
                                   <div className="flex items-center justify-between mb-2">
                                     <p className="text-[10px] font-bold text-white uppercase tracking-widest">{t("Weekly Price Alerts", language)}</p>
                                     <button 
                                       onClick={toggleAlerts}
                                       className={cn("w-8 h-4 rounded-full relative transition-colors", alertsEnabled ? "bg-cyan-500" : "bg-white/10")}
                                     >
                                       <div className={cn("w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all", alertsEnabled ? "right-0.5" : "left-0.5")} />
                                     </button>
                                   </div>
                                   <p className="text-[9px] text-gray-500 leading-relaxed font-mono mb-3">
                                     {alertsEnabled 
                                       ? t("Active. We will email you weekly with wishlist items that have dropped into severe discount thresholds.", language)
                                       : t("Offline. Automated background tracking is paused. You will not receive emails.", language)}
                                     <br/><br/>
                                     <span className="text-orange-500/80">{t("Notice: This alert service is strictly prohibited for US residents. By enabling, you confirm you are located outside the US.", language)}</span>
                                   </p>
                                   
                                   {alertsEnabled && (
                                     <div className="flex items-center justify-between mb-3 bg-white/5 p-2 rounded border border-white/10">
                                       <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t("Discount Target", language)}</span>
                                       <select 
                                         value={alertThreshold}
                                         onChange={(e) => updateAlertThreshold(Number(e.target.value))}
                                         className="bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none text-cyan-400 cursor-pointer"
                                       >
                                         <option value={10} className="bg-[#0a0a0c]">{t("10% OFF", language)}</option>
                                         <option value={20} className="bg-[#0a0a0c]">{t("20% OFF", language)}</option>
                                         <option value={30} className="bg-[#0a0a0c]">{t("30% OFF", language)}</option>
                                         <option value={40} className="bg-[#0a0a0c]">{t("40% OFF", language)}</option>
                                         <option value={50} className="bg-[#0a0a0c]">{t("50% OFF", language)}</option>
                                         <option value={60} className="bg-[#0a0a0c]">{t("60% OFF", language)}</option>
                                         <option value={75} className="bg-[#0a0a0c]">{t("75% OFF", language)}</option>
                                         <option value={90} className="bg-[#0a0a0c]">{t("90% OFF", language)}</option>
                                       </select>
                                     </div>
                                   )}

                                   {alertsEnabled && (
                                     <button
                                       onClick={async () => {
                                         if (!user?.email) return;
                                         try {
                                           let itemsToSend = wishlist
                                             .filter(item => item.discount_percent && item.discount_percent >= alertThreshold)
                                             .map(item => ({
                                                name: item.name,
                                                old_price: item.original_price || item.price,
                                                current_price: item.price,
                                                url: item.url,
                                                image: item.image,
                                                platform: item.platform
                                             }));

                                           if (itemsToSend.length === 0) {
                                              itemsToSend = [
                                                {
                                                  name: "Standard Edition Game",
                                                  old_price: "₩60,000",
                                                  current_price: "₩30,000",
                                                  url: "https://dealirious.com",
                                                  image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
                                                  platform: "steam"
                                                }
                                              ];
                                            } else if (false && itemsToSend.length === 0) {
                                             setAuthError(`No items currently meet your ${alertThreshold}% discount threshold.`);
                                             setTimeout(() => setAuthError(null), 3000);
                                             return;
                                           }

                                          try {
                                           await fetchWithRetry("/api/alerts/send", {
                                             method: "POST",
                                             headers: { "Content-Type": "application/json" },
                                             body: JSON.stringify({
                                               email: user.email,
                                               items: itemsToSend,
                                               lang: language
                                             })
                                           });
                                           setAuthError("Test alert dispatched!");
                                          } catch(e: any) {
                                           setAuthError(`Test alert failed: ${e.message}`);
                                          }
                                           setTimeout(() => setAuthError(null), 3000);
                                         } catch (e) {
                                           setAuthError("Failed to trigger test alert.");
                                           setTimeout(() => setAuthError(null), 3000);
                                         }
                                       }}
                                       className="w-full py-2 bg-white/5 hover:bg-cyan-500/20 text-[9px] font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 rounded-lg transition-all"
                                     >
                                       {t("Send Test Alert", language)}
                                     </button>
                                   )}
                             </div>

                             <div className="p-1">
                               <button onClick={logoutUser} className="w-full text-left px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors mb-1">
                                  <LogOut className="w-4 h-4" />
                                  <span className="font-bold uppercase tracking-wider text-[10px]">{t("Sign Out", language)}</span>
                               </button>
                               <button onClick={handleDeleteAccount} className="w-full text-left px-3 py-2.5 rounded-lg text-red-500/80 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                  <span className="font-bold uppercase tracking-wider text-[10px]">{t("Delete Account", language)}</span>
                               </button>
                             </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={loginWithGoogle}
                  className="hidden sm:flex items-center gap-2 p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-all text-cyan-400 group"
                  title={t("Login with Google", language)}
                >
                  <LogIn className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1">{t("Login Status: Offline", language)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-10 relative z-10">
        {!isAuthLoaded ? (
          <div className="flex flex-col items-center justify-center py-40">
             <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
             <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500 animate-pulse">
               {language === 'ko' ? "데이터베이스 연결 중..." : "Establishing Secure Data Link..."}
             </p>
          </div>
        ) : (
          <>
            {/* Trust Banner */}
        <div className="mb-8 flex items-center justify-center sm:justify-start">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400/90 text-xs font-bold uppercase tracking-wider">{t("100% Official Stores. Zero Shady CD Keys.", language)}</span>
          </div>
        </div>

        {!showWishlist ? (
          <>
            {/* Platform Rail */}
            <div className="flex items-center justify-between xl:mb-6 mb-8 w-full gap-4">
              <div className="flex items-center gap-2 sm:gap-3 justify-start overflow-x-auto pb-4 sm:pb-0 no-scrollbar w-full xl:w-auto">
                {["all", "steam", "playstation", "epic", "ubisoft", "quest"].map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePlatformChange(p)}
                    className={cn(
                      "px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all border shrink-0",
                      platformFilter === p 
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]" 
                        : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"
                    )}
                  >
                    {t(p, language)}
                  </button>
                ))}
              </div>
              
              <div className="hidden lg:flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/5 shrink-0">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={cn("p-2 rounded-md transition-colors", viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode("compact")}
                  className={cn("p-2 rounded-md transition-colors", viewMode === "compact" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4 hidden">
              {/* Removed Deal Categories Tabs */}
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col mb-12 w-full bg-white/[0.02] border border-white/5 rounded-2xl shadow-2xl backdrop-blur-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-5 sm:p-6 gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all whitespace-nowrap shrink-0",
                      showAdvancedFilters
                        ? "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                        : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                    )}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t("Advanced Filters", language)}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAdvancedFilters && "rotate-180")} />
                  </button>

                  <div className="relative min-w-[12rem] shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ArrowUpDown className="w-3.5 h-3.5 text-cyan-500/60 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full appearance-none bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 focus:outline-none focus:border-cyan-500/50 focus:text-white transition-all hover:bg-white/[0.05]"
                    >
                      <option value="recommended" className="bg-[#0a0a0c]">{t("Sort: Recommended", language)}</option>
                      <option value="discount" className="bg-[#0a0a0c]">{t("Sort: Highest Discount", language)}</option>
                      <option value="score" className="bg-[#0a0a0c]">{t("Sort: Highest Score", language)}</option>
                      <option value="asc" className="bg-[#0a0a0c]">{t("Price: Low to High", language)}</option>
                      <option value="desc" className="bg-[#0a0a0c]">{t("Price: High to Low", language)}</option>
                    </select>
                  </div>
                </div>

                {/* Utilities and Search right inside the header for compactness */}
                <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setHideNSFW(!hideNSFW)}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
                      hideNSFW
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20" 
                        : "bg-red-500/5 border-red-500/20 text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
                    )}
                  >
                    {hideNSFW ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{hideNSFW ? t("NSFW Hidden", language) : t("NSFW Shown", language)}</span>
                  </button>
                  <div className="relative w-full sm:w-auto md:min-w-[16rem]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/70" />
                    <input 
                      type="text"
                      placeholder={t("ENTER GAME TITLE...", language)}
                      value={searchQuery}
                      onChange={(e) => handleSearchQueryChange(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-mono tracking-widest focus:outline-none focus:border-cyan-500/50 w-full transition-all uppercase placeholder:text-gray-600 focus:bg-white/5 text-white"
                    />
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  showAdvancedFilters ? "opacity-100 max-h-96" : "opacity-0 max-h-0"
                )}
              >
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                    
                    {/* Discount Filter */}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Percent className="w-3.5 h-3.5 text-cyan-500/60 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <select 
                        value={discountFilter} 
                        onChange={(e) => setDiscountFilter(Number(e.target.value))}
                        className="w-full appearance-none bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-300 focus:outline-none focus:border-cyan-500/50 focus:text-white transition-all hover:bg-white/[0.05]"
                      >
                        <option value={0} className="bg-[#0a0a0c]">{t("Any Discount", language)}</option>
                        <option value={40} className="bg-[#0a0a0c]">{t("40%+ Off", language)}</option>
                        <option value={60} className="bg-[#0a0a0c]">{t("60%+ Off", language)}</option>
                        <option value={80} className="bg-[#0a0a0c]">{t("80%+ Off", language)}</option>
                      </select>
                    </div>

                    {/* Price Max Filter */}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BadgeDollarSign className="w-3.5 h-3.5 text-cyan-500/60 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <select 
                        value={priceMaxFilter} 
                        onChange={(e) => setPriceMaxFilter(Number(e.target.value))}
                        className="w-full appearance-none bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-300 focus:outline-none focus:border-cyan-500/50 focus:text-white transition-all hover:bg-white/[0.05]"
                      >
                        <option value={0} className="bg-[#0a0a0c]">{t("Any Price", language)}</option>
                        {country === 'kr' ? (
                          <>
                            <option value={10000} className="bg-[#0a0a0c]">{t("Under ₩10,000", language)}</option>
                            <option value={20000} className="bg-[#0a0a0c]">{t("Under ₩20,000", language)}</option>
                            <option value={30000} className="bg-[#0a0a0c]">{t("Under ₩30,000", language)}</option>
                          </>
                        ) : (
                          <>
                            <option value={10} className="bg-[#0a0a0c]">{t("Under $10", language)}</option>
                            <option value={20} className="bg-[#0a0a0c]">{t("Under $20", language)}</option>
                            <option value={30} className="bg-[#0a0a0c]">{t("Under $30", language)}</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Metacritic Score Filter */}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Star className="w-3.5 h-3.5 text-cyan-500/60 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <select 
                        value={scoreFilter} 
                        onChange={(e) => setScoreFilter(Number(e.target.value))}
                        className="w-full appearance-none bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-300 focus:outline-none focus:border-cyan-500/50 focus:text-white transition-all hover:bg-white/[0.05]"
                      >
                        <option value={0} className="bg-[#0a0a0c]">{t("Any Score", language)}</option>
                        <option value={70} className="bg-[#0a0a0c]">{t("70+ Score", language)}</option>
                        <option value={80} className="bg-[#0a0a0c]">{t("80+ Score", language)}</option>
                        <option value={90} className="bg-[#0a0a0c]">{t("90+ Score", language)}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deals Grid/List */}
            {loading ? (
              <div className={cn(
                "gap-4",
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "flex flex-col gap-2"
              )}>
                {[...Array(8)].map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className={cn(
                      "bg-white/[0.03] rounded-xl border border-white/5 relative overflow-hidden",
                      viewMode === "grid" ? "h-[320px] flex flex-col" : "h-16 sm:h-20 flex items-center pr-4"
                    )}
                  >
                    {viewMode === "grid" ? (
                      <>
                        <div className="h-40 w-full bg-white/5 shimmer" />
                        <div className="p-4 flex-1 space-y-3">
                          <div className="h-3 w-2/3 bg-white/5 rounded" />
                          <div className="h-5 w-full bg-white/5 rounded" />
                          <div className="flex justify-between items-end mt-auto">
                            <div className="h-8 w-24 bg-white/5 rounded" />
                            <div className="h-8 w-16 bg-white/5 rounded" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-24 sm:w-32 h-full bg-white/5 shimmer mr-4" />
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-20 bg-white/5 rounded" />
                          <div className="h-4 w-1/2 bg-white/5 rounded" />
                        </div>
                        <div className="h-8 w-24 bg-white/5 rounded ml-4" />
                      </>
                    )}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  </motion.div>
                ))}
              </div>
            ) : filteredDeals.length > 0 ? (
              <div className="space-y-16">
                {dealSections.map(section => {
                  const sectionDeals = filteredDeals.filter(section.filterFn);
                  
                  if (sectionDeals.length === 0) return null;
                  
                  const displayDeals = section.id === "all" ? sectionDeals : sectionDeals.slice(0, 8);

                  return (
                    <div key={section.id}>
                      <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">{section.label}</h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                        {section.id !== "all" && sectionDeals.length > 8 && (
                          <span className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-wider">{t("Showing Top 8", language)}</span>
                        )}
                      </div>
                      
                      <div className={cn(
                        "gap-4",
                        viewMode === "grid" 
                          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                          : "flex flex-col gap-2"
                      )}>
                        <AnimatePresence mode="popLayout">
                          {displayDeals.map((deal, idx) => {
                            const rating = getDealRating(deal.discount_percent);
                            const storeName = {
                              steam: t("Steam Store", language),
                              playstation: t("PlayStation Store", language),
                              epic: t("Epic Games Store", language),
                              ubisoft: t("Ubisoft Store", language),
                              quest: t("Meta Quest Store", language),
                            }[deal.platform] || `${deal.platform} ${t("Store", language)}`;
                            
                            if (viewMode === "compact") {
                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          key={`${section.id}-${deal.id}`}
                          className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/30 rounded-lg overflow-hidden transition-all flex items-center h-16 sm:h-20 pr-4 cursor-pointer"
                          onClick={() => setSelectedDeal(deal)}
                        >
                          <div className="w-24 sm:w-32 h-full shrink-0 relative overflow-hidden border-r border-white/5 mr-4">
                            <img 
                              src={deal.image} 
                              loading="lazy"
                              alt={deal.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(deal.name)}/400/225`; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050507]/60" />
                          </div>

                          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-mono text-cyan-500/60 uppercase tracking-widest">{storeName}</span>
                                {deal.steam_score ? (
                                  <>
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="text-[9px] font-mono text-blue-400/60 uppercase tracking-widest">{t("steam", language)} {deal.steam_score}</span>
                                  </>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
                                {deal.metacritic != null && deal.metacritic > 0 ? (
                                  <span className={cn("px-1.5 py-0.5 rounded shadow-sm font-black flex items-center justify-center min-w-[28px] border", getMetacriticColor(deal.metacritic))}>
                                    <span className="text-[12px] leading-none tracking-tighter">{deal.metacritic}</span>
                                  </span>
                                ) : null}
                                {deal.steamDeckVerified && (
                                  <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-sm" title="Steam Deck Verified">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Deck
                                  </span>
                                )}
                                <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{deal.name}</h3>
                              </div>
                            </div>

                            <div className="hidden lg:flex flex-col items-start w-24 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                              <span className="text-[7px] font-mono text-cyan-500/80 uppercase tracking-wider leading-none mb-1">{t("Price History", language)}</span>
                              <div className="w-full h-6">
                                {isDesktop && (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={generatePriceHistory(deal.id, deal.original_price, deal.price)}>
                                      <defs>
                                        <linearGradient id={`gradient-${deal.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <Area type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill={`url(#gradient-${deal.id})`} isAnimationActive={false} />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                              <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-1 sm:gap-2">
                                  {deal.discount_percent != null && deal.discount_percent > 0 ? (
                                    <span className="text-[9px] sm:text-[10px] md:text-xs font-black text-cyan-400 bg-cyan-500/10 px-1.5 sm:px-2 py-0.5 rounded">
                                      -{deal.discount_percent}%
                                    </span>
                                  ) : null}
                                  <span className="text-xs sm:text-sm font-mono text-gray-500 line-through hidden sm:inline-block">{deal.original_price}</span>
                                </div>
                                <span className="text-sm sm:text-base md:text-lg font-black font-mono tracking-tighter text-white">{deal.price}</span>
                              </div>

                              <div className="flex items-center gap-1 sm:gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleWishlist(deal); }}
                                  className={cn(
                                    "p-2 rounded-lg transition-all",
                                    wishlist.find(item => item.url === deal.url) 
                                      ? "text-cyan-400 bg-cyan-500/10" 
                                      : "text-gray-500 hover:text-white hover:bg-white/5"
                                  )}
                                >
                                  <Heart className={cn("w-4 h-4", wishlist.find(item => item.url === deal.url) && "fill-current")} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleShare(deal); }}
                                  className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all relative"
                                  title={t("Share Deal", language)}
                                >
                                  {shareFeedback === deal.id ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                                </button>
                                <a 
                                  href={deal.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 bg-white/5 hover:bg-cyan-500 hover:text-black rounded-lg transition-all border border-white/10 hover:border-cyan-500"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        key={`${section.id}-${deal.id}`}
                        className="group relative bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-xl overflow-hidden hover:bg-white/[0.06] hover:border-cyan-500/30 transition-all flex flex-col h-[320px] cursor-pointer"
                        onClick={() => setSelectedDeal(deal)}
                      >
                        {/* Slim Image Section */}
                        <div className="shrink-0 relative overflow-hidden w-full h-40 border-b border-white/5">
                          <img 
                            src={deal.image} 
                            loading="lazy"
                            alt={deal.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(deal.name)}/400/225`; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050507]/80 to-transparent" />
                          
                          {deal.discount_percent != null && deal.discount_percent > 0 ? (
                            <div className="absolute top-3 right-3 px-3 py-1.5 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/50 text-cyan-300 text-sm sm:text-base font-black italic uppercase tracking-tighter rounded-lg shadow-[0_4px_12px_rgba(6,182,212,0.2)]">
                              -{deal.discount_percent}%
                            </div>
                          ) : null}

                          {rating && (
                            <div className="absolute bottom-2 left-2">
                              <span className={cn("px-2 py-1 rounded text-[8px] font-black tracking-wider border backdrop-blur-md", rating.color)}>
                                {rating.label}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-[9px] font-mono text-cyan-500/60 uppercase tracking-widest">{storeName}</span>
                                {deal.steam_score ? (
                                  <>
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="text-[9px] font-mono text-blue-400/60 uppercase tracking-widest">{t("steam", language)} {deal.steam_score}</span>
                                  </>
                                ) : null}
                              </div>
                            <div className="flex items-center gap-2">
                              {deal.metacritic != null && deal.metacritic > 0 ? (
                                <span className={cn("px-1.5 py-0.5 rounded shadow-sm font-black flex items-center justify-center min-w-[28px] border", getMetacriticColor(deal.metacritic))}>
                                  <span className="text-[12px] leading-none tracking-tighter">{deal.metacritic}</span>
                                </span>
                              ) : null}
                              {deal.steamDeckVerified && (
                                <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-sm" title="Steam Deck Verified">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Deck
                                </span>
                              )}
                              <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{deal.name}</h3>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 shrink-0 z-10">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleWishlist(deal); }}
                              className={cn(
                                "p-2 rounded-lg border transition-all",
                                wishlist.find(item => item.url === deal.url) 
                                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" 
                                  : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                              )}
                            >
                              <Heart className={cn("w-4 h-4", wishlist.find(item => item.url === deal.url) && "fill-current")} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShare(deal); }}
                              className="p-2 rounded-lg border bg-white/5 border-white/10 text-gray-500 hover:text-white transition-all relative"
                              title={t("Share Deal", language)}
                            >
                              {shareFeedback === deal.id ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Sparkline integration */}
                        <div className="relative w-full mt-2 mb-[-8px] group/sparkline">
                          <span className="absolute -top-3 right-0 text-[8px] font-mono text-cyan-500/40 group-hover/sparkline:text-cyan-500/80 uppercase tracking-wider z-10 transition-colors">{t("12M Trend", language)}</span>
                          <div className="h-10 w-full opacity-30 group-hover:opacity-60 transition-opacity">
                            {isDesktop && (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={generatePriceHistory(deal.id, deal.original_price, deal.price)}>
                                  <defs>
                                    <linearGradient id={`gradient-grid-${deal.id}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <Area type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={1} fillOpacity={1} fill={`url(#gradient-grid-${deal.id})`} isAnimationActive={false} />
                                </AreaChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>

                        <div className="flex items-end justify-between relative z-10">
                          <div className="flex items-baseline gap-3">
                            <span className="text-xl sm:text-2xl font-black font-mono tracking-tighter text-white">{deal.price}</span>
                            {deal.original_price && (
                              <span className="text-xs font-mono text-gray-600 line-through">{deal.original_price}</span>
                            )}
                          </div>
                          
                          <a 
                            href={deal.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-cyan-500 hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 hover:border-cyan-500"
                          >
                            {t("Access", language)} <ChevronRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
               </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
              <div className="text-center py-32 bg-white/[0.02] rounded-3xl border border-white/5 border-dashed">
                <div className="inline-block p-6 bg-white/5 rounded-full mb-6">
                  <Layers className="w-10 h-10 text-gray-700" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{t("No Deals Found", language)}</h3>
                <p className="text-gray-500 max-w-md mx-auto text-sm font-medium mb-8">
                  {t("Adjust your scan parameters or search query. If you're browsing a specific platform, there might be no active sales at this moment.", language)}
                </p>
              </div>
            )}
            
            {hasMore ? (
              <div className="flex justify-center mt-12 mb-8 w-full max-w-7xl mx-auto">
                <button
                  ref={loadMoreRef}
                  onClick={loadMoreDeals}
                  disabled={isLoadingMore}
                  className={cn(
                    "flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all border",
                    isLoadingMore 
                      ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed" 
                      : "bg-cyan-500/10 hover:bg-cyan-500 hover:text-black border-cyan-500/30 hover:border-cyan-500 text-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  )}
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                      {t("Scanning Sector", language)} {page + 1}...
                    </>
                  ) : (
                    <>
                      {t("Load More Assets", language)}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : deals.length > 0 ? (
              <div className="flex justify-center mt-12 mb-8 w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border bg-white/5 border-white/10 text-gray-500">
                  {t("End of Results", language)}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="max-w-5xl mx-auto">
            {!user ? (
               <div className="text-center py-32 bg-white/[0.02] rounded-3xl border border-white/5 border-dashed">
                 <div className="inline-block p-6 bg-cyan-500/10 rounded-full mb-6 relative">
                   <Gamepad2 className="w-10 h-10 text-cyan-500" />
                   <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{t("Authentication Required", language)}</h3>
                 <p className="text-gray-500 max-w-md mx-auto text-sm font-medium mb-8 leading-relaxed">
                   {t("Sync your wishlist natively via Google Cloud infrastructure to monitor deals cross-platform across all your personal devices.", language)}
                 </p>
                 <button 
                  onClick={loginWithGoogle}
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                 >
                   {t("Login with Google", language)}
                 </button>
               </div>
            ) : (
             <>
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                 <div>
                   <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{t("Asset Watchlist", language)}</h1>
                   <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">{t("Logged in as", language)} {user.email}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row items-center gap-3">
                   {isCrossPlatformSyncing && (
                     <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-mono tracking-widest px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-md">
                       <div className="w-2 h-2 border border-cyan-500 border-t-transparent rounded-full animate-spin" />{t("SCANNING EXCHANGES...", language)}</div>
                   )}
                   <button 
                     onClick={() => handleRefreshWishlist(true)}
                     disabled={isRefreshingWishlist || isCrossPlatformSyncing}
                     className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                   >
                     <RefreshCw className={cn("w-3 h-3", (isRefreshingWishlist || isCrossPlatformSyncing) && "animate-spin")} />
                     {t("Sync Prices", language)}
                   </button>
                 </div>
               </div>

               {/* Smart Search */}
               <div className="mb-16 relative" ref={searchContainerRef}>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">{t("Initialize Search Protocol", language)}</label>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-cyan-500 transition-colors" />
                <input 
                  type="text"
                  placeholder={t("SEARCH FOR GAMES (PLAYSTATION, STEAM, EPIC)...", language)}
                  value={wishlistSearch}
                  onChange={(e) => {
                    setWishlistSearch(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all uppercase placeholder:text-gray-600"
                />
                
                <AnimatePresence>
                  {wishlistSearch.length > 2 && showSearchDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-[#0d0d10] border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-50 backdrop-blur-2xl"
                    >
                      {isSearching ? (
                        <div className="p-6 text-center text-cyan-500 text-sm font-mono uppercase tracking-widest flex items-center justify-center gap-3">
                          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />{t("Scanning Database...", language)}</div>
                      ) : searchSuggestions.length > 0 ? (
                        searchSuggestions.map((game) => (
                          <button
                            key={game.id}
                            onClick={() => addToWishlistFromSearch(game)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0 group/item"
                          >
                            <div className="w-20 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                              <img 
                                src={game.image} 
                                loading="lazy" 
                                alt="" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(game.name)}/400/225`; }}
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-bold uppercase tracking-tight group-hover/item:text-cyan-400 transition-colors">{game.name}</span>
                              <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mt-1">
                                {t(game.platform === 'playstation' ? 'PlayStation Store' : game.platform === 'epic' ? 'Epic Games Store' : game.platform === 'ubisoft' ? 'Ubisoft Store' : game.platform === 'quest' ? 'Meta Quest Store' : 'Steam Store', language)}
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-gray-700 group-hover/item:text-cyan-500" />
                          </button>
                        ))
                      ) : hasSearched ? (
                        <div className="p-6 text-center text-gray-500 text-sm font-mono uppercase tracking-wider">
                          {t("No assets found matching designation.", language)}
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Wishlist Items - SLIM CARDS */}
            {groupedWishlist.length > 0 ? (
              <div className="space-y-4">
                {groupedWishlist.map((group) => {
                  const baseItem = group.baseItem;
                  const aggregated = group.aggregated;
                  return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={baseItem.id}
                    className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-stretch gap-6 group hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all backdrop-blur-md"
                  >
                    <div className="w-full sm:w-48 aspect-video rounded-lg overflow-hidden shrink-0 border border-white/5 relative cursor-pointer" onClick={() => setSelectedDeal(baseItem as any)}>
                      <img 
                        src={baseItem.image} 
                        loading="lazy" 
                        alt={baseItem.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(baseItem.name)}/400/225`; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap pr-2">
                         {aggregated.map(a => (
                           <span key={a.platform} className="px-1.5 py-0.5 rounded-sm bg-black/50 text-[8px] font-mono border border-white/10 uppercase">{t(a.platform === 'steam' ? 'steam' : a.platform, language)}</span>
                         ))}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 w-full flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-[9px] font-mono uppercase tracking-widest flex items-center gap-1",
                              trackingStatuses[baseItem.id] === 'searching' ? "text-cyan-500" : "text-green-500"
                            )}>
                              {trackingStatuses[baseItem.id] === 'searching' ? (
                                <><div className="w-2 h-2 border border-cyan-500 border-t-transparent rounded-full animate-spin" />{t(" SCANNING MARKETS...", language)}</>
                              ) : (
                                <><Check className="w-3 h-3" />{t(" MULTI-MARKET SYNCED", language)}</>
                              )}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg uppercase tracking-tight truncate cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => setSelectedDeal(baseItem as any)}>{baseItem.name}</h3>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeGroupFromWishlist(group.aliases); }}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black rounded-lg transition-all border border-red-500/10 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-auto space-y-2 pt-2">
                        {(() => {
                          const lowestPrice = Math.min(...aggregated.map(a => a.price_numeric));
                          return aggregated.sort((a,b) => a.price_numeric - b.price_numeric).map(deal => {
                            const rating = getDealRating(deal.discount_percent);
                            // Only label "BEST PRICE" if it is actually a discount and the lowest across platforms
                            const isCheapest = aggregated.length > 1 && deal.price_numeric === lowestPrice && (deal.discount_percent || 0) > 0;
                            const isMSRP = (deal.discount_percent || 0) <= 0;
                            const difference = deal.price_numeric - lowestPrice;
                            
                            return (
                             <div key={deal.platform + deal.id} className={cn("flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-2.5 rounded-lg border group/deal transition-colors relative overflow-hidden", isCheapest ? "bg-green-500/10 border-green-500/30" : "bg-black/20 border-white/[0.03] hover:border-cyan-500/30")}>
                                {isCheapest && <div className="absolute inset-y-0 left-0 w-1 bg-green-500" />}
                                <div className="flex items-center gap-3 w-full sm:w-auto min-w-0 pl-1">
                                  <div className="min-w-0">
                                     <div className={cn("text-[10px] font-mono uppercase tracking-wider truncate", isCheapest ? "text-green-400" : "text-cyan-400")}>{deal.platform === 'steam' ? t('steam', language) : t(deal.platform, language)}</div>
                                     <div className="flex items-baseline gap-2 mt-0.5">
                                       <span className="text-sm font-bold font-mono text-white">{deal.price}</span>
                                       {deal.original_price && deal.original_price !== deal.price && (
                                         <span className="text-[10px] font-mono text-gray-500 line-through">{deal.original_price}</span>
                                       )}
                                       {!isCheapest && !isMSRP && difference > 0 && (
                                         <span className="text-[10px] font-mono text-red-400 ml-1">(+{country === 'kr' ? '₩' : '$'}{country === 'kr' ? Math.round(difference).toLocaleString() : difference.toFixed(2)})</span>
                                       )}
                                     </div>
                                  </div>
                                </div>
 
                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-0 relative z-10">
                                  {isCheapest ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-green-500/20 text-green-400 border border-green-500/30">{t("BEST PRICE", language)}</span>
                                  ) : rating ? (
                                    <div className={cn("px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase", rating.color)}>
                                      {rating.label}
                                    </div>
                                  ) : null}
                                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                                    {deal.discount_percent > 0 ? (
                                       <div className={cn("px-2 py-0.5 rounded border font-bold tracking-wider text-[10px] uppercase", isCheapest ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400")}>
                                         -{deal.discount_percent}%
                                       </div>
                                    ) : (
                                       <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-bold tracking-wider text-[10px] uppercase">
                                         {t("MSRP", language)}
                                       </div>
                                    )}
                                    <a href={deal.url} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-colors" onClick={e => e.stopPropagation()}>
                                      {t("Store", language)}
                                    </a>
                                  </div>
                                </div>
                             </div>
                           );
                          });
                        })()}
                      </div>
                    </div>
                  </motion.div>
                )})}
              </div>
            ) : (
              <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[40px]">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-gray-800" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{t("Watchlist Offline", language)}</h3>
                <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">{t("Initialize search protocol to begin monitoring global gaming assets.", language)}</p>
              </div>
            )}
             </>
            )}
          </div>
        )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-6 py-16 border-t border-white/5 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
          <div className="flex flex-col gap-6 max-w-3xl">
            <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity mb-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-black tracking-tighter uppercase italic">DEALIRIOUS</span>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest leading-loose">
                {t("Dealirious is an independent data aggregation tool and is not affiliated with, endorsed by, or sponsored by Sony Interactive Entertainment, Microsoft, Valve Corporation, Epic Games, Ubisoft, or Meta.", language)}
              </p>
              <p className="text-[10px] text-gray-600/80 font-mono uppercase tracking-widest leading-loose max-w-2xl">
                {t("All trademarks, brands, game names, and box art are the intellectual property of their respective owners. Prices and availability are subject to change by the respective storefronts at any time.", language)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-8 mt-2">
              {["Terms of Service", "Privacy Policy", "DMCA", "Contact"].map(link => (
                <button 
                  key={link} 
                  onClick={() => setShowLegal(link as 'Terms of Service' | 'Privacy Policy' | 'DMCA' | 'Contact')}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors uppercase"
                >
                  {t(link, language)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 opacity-30 mt-8 md:mt-0">
            <Smartphone className="w-4 h-4" />
            <div className="w-px h-4 bg-white/20" />
            <Monitor className="w-4 h-4" />
            <div className="w-px h-4 bg-white/20" />
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </footer>

      {/* Selected Deal Model (Price Trend) */}
      <AnimatePresence>
        {selectedDeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center overflow-y-auto"
            onClick={() => setSelectedDeal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden mt-20 sm:mt-0"
            >
              {/* Header Image */}
              <div className="h-48 sm:h-64 relative overflow-hidden">
                <img 
                  src={selectedDeal.image} 
                  alt={selectedDeal.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent" />
                <button 
                  onClick={() => setSelectedDeal(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-8 -mt-16 sm:-mt-20 relative z-10">
                <div className="flex flex-col gap-2 mb-4">
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white drop-shadow-md">
                    {selectedDeal.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    {selectedDeal.metacritic != null && selectedDeal.metacritic > 0 && (
                      <span className={cn("px-1.5 py-0.5 rounded shadow-sm font-black flex items-center justify-center min-w-[28px] border", getMetacriticColor(selectedDeal.metacritic))}>
                        <span className="text-[12px] leading-none tracking-tighter">{selectedDeal.metacritic}</span>
                      </span>
                    )}
                    {selectedDeal.steamDeckVerified && (
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm" title="Steam Deck Verified">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Deck Verified
                      </span>
                    )}
                  </div>
                </div>
                
                {(() => {
                  const chartData = generatePriceHistory(selectedDeal.id, selectedDeal.original_price, selectedDeal.price);
                  const allTimeLowPrice = Math.min(...chartData.map(d => d.price));
                  const isCurrentATL = allTimeLowPrice >= selectedDeal.price_numeric;
                  const allTimeLowFormatted = formatChartPrice(allTimeLowPrice, selectedDeal.price);

                  return (
                    <>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-8">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-400">
                            {selectedDeal.price}
                          </span>
                          {selectedDeal.original_price && (
                            <span className="text-sm font-mono text-gray-500 line-through">
                              {selectedDeal.original_price}
                            </span>
                          )}
                        </div>
                        {selectedDeal.discount_percent != null && selectedDeal.discount_percent > 0 && (
                          <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300 font-black italic uppercase text-sm">
                            -{selectedDeal.discount_percent}% {t("OFF", language)}
                          </div>
                        )}
                        {isCurrentATL ? (
                          <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-400 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingDown className="w-3 h-3" />
                            {t("HISTORICAL LOW", language)}
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-gray-400 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingDown className="w-3 h-3" />
                            {t("ALL-TIME LOW:", language)} {allTimeLowFormatted}
                          </div>
                        )}
                        <a 
                          href={selectedDeal.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        >
                          {t("View Deal", language)} <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Price Trend Chart */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 sm:p-6 mb-4">
                        <div className="flex items-center gap-3 mb-6">
                          <Zap className="w-4 h-4 text-cyan-500" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">{t("12-Month Price Trend", language)}</h3>
                        </div>
                        
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={chartData}
                              margin={{ top: 10, right: 10, left: country === "kr" ? 10 : -10, bottom: 0 }}
                            >
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="month" 
                          stroke="#ffffff33" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          fontFamily="monospace"
                        />
                        <YAxis 
                          stroke="#ffffff33" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => formatChartPrice(value, selectedDeal.price)}
                          fontFamily="monospace"
                        />
                        <Tooltip 
                          formatter={(value) => [formatChartPrice(Number(value), selectedDeal.price), t('Price', language)]}
                          contentStyle={{ 
                            backgroundColor: '#0a0a0c', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontFamily: 'monospace'
                          }}
                          itemStyle={{ color: '#06b6d4' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#06b6d4" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-center text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                  * Historical trend map generated algorithmically via local client-side computation to verify discount depth while enforcing a $0 backend footprint.
                </p>
                </>
              );
            })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal Footer */}
      <footer className="mt-24 border-t border-white/5 py-12 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
           <h5 className="text-white/60 font-black uppercase tracking-widest text-xs mb-4">{t("Legal Disclaimer", language)}</h5>
           <p className="text-gray-500 text-[10px] leading-relaxed max-w-4xl mx-auto mb-4 font-mono uppercase tracking-wider">
             {t('Dealirious is a price aggregation tool and is not affiliated with, endorsed by, authorized by, or sponsored by Sony Interactive Entertainment, Valve Corporation, Epic Games, or Ubisoft. "PlayStation", "Steam", "Epic Games", "Quest", and "Ubisoft" are registered trademarks of their respective owners.', language)}
           </p>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {showCookieBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
          >
            <div className="max-w-5xl mx-auto bg-[#0a0a0c]/95 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col xl:flex-row items-start xl:items-center gap-6 justify-between">
              <div className="flex-1 text-left">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm sm:text-base uppercase tracking-widest">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  {t("Privacy & Cookie Policy", language)}
                </h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-2">
                  We use <span className="text-white font-bold">{t("Strictly Essential Cookies", language)}</span> and browser storage mechanisms to securely authenticate you via Google Firebase and synchronize your Cloud Watchlist across your devices. 
                  These are mandatory for the application's core functionality.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
                <button 
                  onClick={() => {
                    localStorage.setItem("cookie-consent", "true");
                    setShowCookieBanner(false);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all whitespace-nowrap shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                >{t("Got It", language)}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LegalModals 
        document={showLegal} 
        onClose={() => setShowLegal(null)} 
        language={language}
      />
    </div>
  );
}
