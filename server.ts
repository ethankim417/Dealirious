import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import axios from "axios";
import axiosRetry from "axios-retry";
import * as cheerio from "cheerio";
import { MetacriticService } from "metacritic-ts";
import pLimit from "p-limit";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

import http from "http";
import https from "https";

// Globally configure Axios to prevent hanging sockets, timeout vulnerabilities, and 403 bots
axios.defaults.timeout = 30000; // Increased to 30s as bulk translation can be slow
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36 DealiriousDataBot/1.2';
axios.defaults.httpAgent = new http.Agent({ keepAlive: true });
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });

// Robust retry logic for all external APIs
axiosRetry(axios, { 
  retries: 3, 
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: any) => {
    // Retry on 429 (rate limit) or 5xx (server error)
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response && (error.response.status === 429 || error.response.status >= 500));
  },
  shouldResetTimeout: true
});

// Gemini import removed for cost optimization

const GAME_TITLE_MAP: Record<string, string> = {
  "Doom": "둠",
  "Hades": "하데스",
  "Control": "컨트롤",
  "Returnal": "리터널",
  "Bloodborne": "블러드본",
  "Elden Ring": "엘든 링",
  "Monster Hunter": "몬스터 헌터",
  "God of War": "갓 오브 워",
  "Horizon Zero Dawn": "호라이즌 제로 던",
  "Horizon Forbidden West": "호라이즌 포비든 웨스트",
  "Stray": "스트레이",
  "Dredge": "드레지",
  "Dave the Diver": "데이브 더 다이버",
  "Cult of the Lamb": "컬트 오브 더 램",
  "Dead Cells": "데드 셀",
  "Sekiro": "세키로",
  "Resident Evil": "바이오하자드",
  "Biohazard": "바이오하자드",
  "Like a Dragon": "용과 같이",
  "Yakuza": "용과 같이",
  "Ghost of Tsushima": "고스트 오브 쓰시마",
  "Death Stranding": "데스 스트랜딩",
  "Cyberpunk 2077": "사이버펑크 2077",
  "The Last of Us": "더 라스트 오브 어스",
  "Uncharted": "언차티드",
  "Ratchet & Clank": "라쳇 & 클랭크",
  "Spider-Man": "스파이더맨",
  "Gran Turismo": "그란 투리스모",
  "Demon's Souls": "데몬즈 소울",
  "Persona": "페르소나",
  "Persona 5": "페르소나 5",
  "Persona 5 Royal": "페르소나 5 더 로열",
  "Persona 4 Golden": "페르소나 4 골든",
  "Super Animal Royale": "슈퍼 애니멀 로얄",
  "Final Fantasy": "파이널 판타지",
  "Destiny": "데스티니",
  "Destiny 2": "데스티니 가디언즈",
  "Overwatch": "오버워치",
  "Diablo": "디아블로",
  "StarCraft": "스타크래프트",
  "WarCraft": "워크래프트",
  "The Witcher": "위쳐",
  "Witcher": "위쳐",
  "Call of Duty": "콜 오브 듀티",
  "Grand Theft Auto": "그랜드 세프트 오토",
  "GTA": "GTA",
  "Minecraft": "마인크래프트",
  "League of Legends": "리그 오브 레전드",
  "Valorant": "발로란트",
  "Assassin's Creed": "어쌔신 크리드",
  "Far Cry": "파 크라이",
  "Watch Dogs": "와치독스",
  "Need for Speed": "니드 포 스피드",
  "Tomb Raider": "툼 레이더",
  "Silent Hill": "사일런트 힐",
  "Kingdom Hearts": "킹덤 하츠",
  "Dark Souls": "다크 소울",
  "Dragon Age": "드래곤 에이지",
  "Mass Effect": "매스 이펙트",
  "Dead Space": "데드 스페이스",
  "Mirror's Edge": "미러즈 엣지",
  "Dishonored": "디스아너드",
  "Wolfenstein": "울펜슈타인",
  "Quake": "퀘이크",
  "Halo": "헤일로",
  "Gears of War": "기어즈 오브 워",
  "Forza Horizon": "포르자 호라이즌",
  "Stardew Valley": "스타듀 밸리",
  "Subnautica": "서브노티카",
  "Outer Wilds": "아우터 와일드",
  "Hollow Knight": "할로우 나이트",
  "Celeste": "셀레스트",
  "Undertale": "언더테일",
  "Cuphead": "컵헤드",
  "Slay the Spire": "슬레이 더 스파이어",
  "Balatro": "발라트로",
  "It Takes Two": "잇 테이크 투",
  "A Way Out": "어 웨이 아웃",
  "Detroit: Become Human": "디트로이트: 비컴 휴먼",
  "Heavy Rain": "헤비 레인",
  "Beyond: Two Souls": "비욘드: 투 소울즈",
  "Alan Wake": "앨런 웨이크",
  "Quantum Break": "퀀텀 브레이크",
  "Devil May Cry": "데빌 메이 크라이",
  "Metal Gear": "메탈 기어",
  "Mortal Kombat": "모탈 컴뱃",
  "Tekken": "철권",
  "Tekken 8": "철권 8",
  "Street Fighter": "스트리트 파이터",
  "Street Fighter 6": "스트리트 파이터 6",
  "Fallout": "폴아웃",
  "The Elder Scrolls": "엘더스크롤",
  "Skyrim": "스카이림",
  "Red Dead Redemption": "레드 데드 리뎀션",
  "Borderlands": "보더랜드",
  "BioShock": "바이오쇼크",
  "Animal Crossing": "동물의 숲",
  "Deep Rock Galactic": "딥 락 갤럭틱",
  "Sea of Thieves": "씨 오브 티브즈",
  "Battlefield": "배틀필드",
  "Battlefield 2042": "배틀필드 2042",
  "Battlefield V": "배틀필드 V",
  "Battlefield 1": "배틀필드 1",
  "Battlefield 4": "배틀필드 4",
  "Battlefield 3": "배틀필드 3",
  "Hades II": "하데스 II",
  "Metal Gear Solid": "메탈 기어 솔리드",
  "Metal Gear Solid V": "메탈 기어 솔리드 V",
  "Metal Gear Solid V: The Phantom Pain": "메탈 기어 솔리드 V: 팬텀 페인",
  "Metal Gear Solid V: Ground Zeroes": "메탈 기어 솔리드 V: 그라운드 제로즈",
  "Metal Gear Solid: Master Collection": "메탈 기어 솔리드: 마스터 컬렉션",
  "Tales of": "테일즈 오브",
  "Ace Combat": "에이스 컴뱃",
  "Ace Combat 7: Skies Unknown": "에이스 컴뱃 7: 스카이즈 언노운",
  "Baldur's Gate": "발더스 게이트",
  "Palworld": "팰월드",
  "Helldivers": "헬다이버즈",
  "Helldivers 2": "헬다이버즈 2",
  "Granblue Fantasy": "그랑블루 판타지",
  "Armored Core": "아머드 코어",
  "Lies of P": "P의 거짓",
  "Black Myth: Wukong": "검은 신화: 오공",
  "Stellar Blade": "스텔라 블레이드",
  "Rise of the Ronin": "라이즈 오브 더 로닌",
  "Dragon's Dogma": "드래곤즈 도그마",
  "Final Fantasy VII Rebirth": "파이널 판타지 VII 리버스",
  "Ghostrunner": "고스트러너",
  "Sifu": "시푸",
  "The First Descendant": "퍼스트 디센던트",
  "Zenless Zone Zero": "젠레스 존 제로",
  "Genshin Impact": "원신",
  "Honkai: Star Rail": "붕괴: 스타레일",
  "Avowed": "어바우드",
  "Baldur's Gate 3": "발더스 게이트 3",
  "The Legend of Zelda: Tears of the Kingdom": "젤다의 전설 티어스 오브 더 킹덤",
  "Super Mario Odyssey": "슈퍼 마리오 오디세이",
  "The Legend of Zelda: Breath of the Wild": "젤다의 전설 브레스 오브 더 와일드",
  "Super Mario 3D World": "슈퍼 마리오 3D 월드",
  "Mario Kart 8 Deluxe": "마리오 카트 8 디럭스",
  "Animal Crossing: New Horizons": "모여봐요 동물의 숲",
  "Disco Elysium": "디스코 엘리시움",
  "Divinity: Original Sin 2": "디비니티: 오리지널 신 2",
  "Portal 2": "포탈 2",
  "Half-Life 2": "하프라이프 2",
  "Metroid Dread": "메트로이드 드레드",
  "Ratchet & Clank: Rift Apart": "라쳇 & 클랭크: 리프트 어파트",
  "Sekiro: Shadows Die Twice": "세키로: 섀도우 다이 트와이스",
  "Final Fantasy VII Remake": "파이널 판타지 VII 리메이크",
  "Resident Evil 4": "바이오하자드 RE:4",
  "Monster Hunter: World": "몬스터 헌터: 월드",
  "Monster Hunter Rise": "몬스터 헌터 라이즈",
  "Nier: Automata": "니어: 오토마타",
  "Life is Strange": "라이프 이즈 스트레인지",
  "Astro Bot": "아스트로 봇",
  "Persona 3 Reload": "페르소나 3 리로드",
  "Vampire Survivors": "뱀파이어 서바이버",
  "Inscryption": "인스크립션",
  "Kingdom Come: Deliverance": "킹덤 컴: 딜리버런스",
  "Alan Wake 2": "앨런 웨이크 2",
  "Dead by Daylight": "데드 바이 데이라이트",
  "State of Decay 2": "스테이트 오브 디케이 2",
  "Left 4 Dead 2": "레프트 4 데드 2",
  "Payday 2": "페이데이 2",
  "Warframe": "워프레임",
  "Path of Exile": "패스 오브 엑자일",
  "Grounded": "그라운디드",
  "God of War Ragnarök": "갓 오브 워 라그나로크",
  "Hogwarts Legacy": "호그와트 레거시",
  "Marvel's Spider-Man 2": "마블 스파이더맨 2",
  "Starfield": "스타필드",
  "Armored Core VI Fires of Rubicon": "아머드 코어 VI 루비콘의 화염",
  "Final Fantasy XVI": "파이널 판타지 XVI",
  "Dragon's Dogma 2": "드래곤즈 도그마 2",
  "S.T.A.L.K.E.R. 2: Heart of Chornobyl": "스토커 2: 하트 오브 초르노빌",
};

// Normalized name helper for grouping
function getNorm(name: string): string {
    if (!name) return "";
    let n = name.toLowerCase().replace(/[^a-z0-9\s가-힣]/g, '').trim().replace(/\s+/g, ' ');
    n = n.replace(/\b(ps4|ps5|pc|switch|edition|deluxe|standard|ultimate|directors|cut|s)\b/g, '').trim();
    return n.replace(/\s+/g, '');
}

// Common manual fixes for Korean -> English when stores return Korean titles
const KOREAN_TO_ENGLISH_FIXES: Record<string, string> = {
  "어바우드": "Avowed",
  "공언": "Avowed",
  "공언됨": "Avowed",
  "어쌔신 크리드": "Assassin's Creed",
  "젤다의 전설": "The Legend of Zelda",
  "고스트 오브 쓰시마": "Ghost of Tsushima",
  "엘든 링": "Elden Ring",
  "갓 오브 워": "God of War",
  "호라이즌 제로 던": "Horizon Zero Dawn",
  "검은 신화: 오공": "Black Myth: Wukong",
  "오공": "Black Myth: Wukong",
  "나비소나": "Persona",
  "페르소나": "Persona",
  "슈퍼 애니멀 로얄": "Super Animal Royale",
};

// Helper to clean and validate Korean translations
function cleanKoreanTranslation(original: string, translated: string): string {
  if (!translated) return original;

  // Specific game-title fixes for common bad automatic translations (literal translations)
  const BAD_SEMANTIC_TRANSLATIONS: Record<string, string> = {
    "암살자의 신조": "어쌔신 크리드",
    "암살자 신조": "어쌔신 크리드",
    "애쌔신 크리드": "어쌔신 크리드",
    "애쌔신크리드": "어쌔신 크리드",
    "전장": "배틀필드",
    "감시견": "와치독스",
    "잠자는 개": "슬리핑 독스",
    "먼 외침": "파 크라이",
    "속도의 필요": "니드 포 스피드",
    "무덤 도굴꾼": "툼 레이더",
    "무덤 약탈자": "툼 레이더",
    "지평선": "호라이즌",
    "죽은 공간": "데드 스페이스",
    "일광에 의해 죽다": "데드 바이 데이라이트",
    "일광에 의한 죽음": "데드 바이 데이라이트",
    "대낮의 죽음": "데드 바이 데이라이트",
    "햇빛에 의해": "데드 바이 데이라이트",
    "햇빛에 의한": "데드 바이 데이라이트",
    "금속 기어": "메탈 기어",
    "금속 기어 솔리드": "메탈 기어 솔리드",
    "필멸의 과업": "모탈 컴뱃",
    "모탈 컴뱃 11": "모탈 컴뱃 11",
    "생명은 이상하다": "라이프 이즈 스트레인지",
    "인생은 이상해": "라이프 이즈 스트레인지",
    "우리의 마지막": "더 라스트 오브 어스",
    "문명": "시빌라이제이션",
    "용과 같이": "용과 같이",
    "분노의 질주": "분노의 질주",
    "공언": "어바우드",
    "공언됨": "어바우드",
    "공언함": "어바우드",
    "맹세": "어바우드",
    "맹세함": "어바우드",
    "검은 신화": "검은 신화: 오공",
    "빈 기사": "할로우 나이트",
    "공허의 기사": "할로우 나이트",
    "접지됨": "그라운디드",
    "제어": "컨트롤",
    "불명예": "디스아너드",
    "먹이": "프레이",
  };

  for (const [bad, good] of Object.entries(BAD_SEMANTIC_TRANSLATIONS)) {
    if (translated.includes(bad)) {
      translated = translated.replace(new RegExp(bad, 'g'), good);
    }
  }

  // 1. Metal Gear Solid -> 메탈 기어 솔리드
  if (translated.includes("기어") && (original.toLowerCase().includes("metal gear") || translated.includes("솔리드"))) {
    // Remove literal translations of "Metal" like "금속", "크롬", "철재", "철제"
    translated = translated.replace(/(금속|크롬|철재|철제)\s*/g, "");
    
    // Ensure "메탈" is present at the start if the original has "Metal"
    if (original.toLowerCase().includes("metal") && !translated.includes("메탈")) {
      translated = "메탈 " + translated;
    }
    
    // Cleanup spacing and duplicates
    translated = translated.replace(/메탈\s+메탈/g, "메탈")
                           .replace(/메탈기어/g, "메탈 기어")
                           .replace(/기어솔리드/g, "기어 솔리드")
                           .replace(/\s+/g, " ")
                           .trim();
  }

  // 1.1 Battlefield -> 배틀필드 (prevent weird translations like "전장" or "필드필드")
  if (original.toLowerCase().includes("battlefield") && !translated.includes("배틀필드")) {
     // Explicitly fix "필드필드" or other nonsense
     if (translated.includes("필드필드")) {
        translated = translated.replace("필드필드", "배틀필드");
     } else if (translated.includes("전장") || translated.includes("필드")) {
        translated = translated.replace("전장", "배틀필드").replace("필드", "배틀필드");
        // Remove duplicate "배틀필드배틀필드" produced by the above replace
        translated = translated.replace(/배틀필드배틀필드/g, "배틀필드");
     } else {
        translated = "배틀필드 " + translated;
     }

     // Ensure numbers are preserved properly
     if (original.includes("3") && !translated.includes("3")) translated += " 3";
     if (original.includes("4") && !translated.includes("4")) translated += " 4";
     if (original.includes("1") && !translated.includes("1")) translated += " 1";
  }

  // 1.2 Metal Gear Solid fixes
  if (original.toLowerCase().includes("metal gear") && !translated.includes("메탈 기어")) {
      if (translated.includes("기어")) {
          translated = translated.replace("기어", "메탈 기어");
      } else {
          translated = "메탈 기어 " + translated;
      }
      translated = translated.replace(/메탈\s+메탈/g, "메탈");
  }
  
  // 2. Generic "Chrome" fixed (often mistaken translation of "Metal" in some contexts)
  if (translated.includes("크롬") && original.toLowerCase().includes("metal")) {
     translated = translated.replace("크롬", "메탈");
  }
  
  // 2. Ace Combat 7 subtitle
  if (translated.includes("스카이스 알수없음") || translated.includes("스카이즈 알수없음") || translated.includes("하늘 알수없음")) {
    translated = translated.replace(/(스카이스|스카이즈|하늘)\s?알수없음/g, "스카이즈 언노운");
  }

  // 3. Prevent robotic "Unknown" translations in titles (e.g. from Google)
  const badUnknowns = ["알수없음", "알 수 없음", "미상의", "알 수 없는"];
  if (badUnknowns.some(term => translated.includes(term))) {
    if (original.toLowerCase().includes("unknown") && !translated.includes("언노운")) {
      // If it looks like a subtitle, try to preserve the sound instead
      if (original.toLowerCase().includes("skies unknown")) {
         translated = translated.replace(/(스카이스|스카이즈|하늘)\s?알수없음/g, "스카이즈 언노운");
      }
    }
  }
  
  // If the translation is just too short or looks like an error, fallback
  if (translated.length < 2) return original;
  
  return translated;
}

let translationCache: Record<string, string> = {};
let metacriticCache: Record<string, number | null> = {};
let psnCache: Record<string, { data: any, time: number }> = {};
let questCache: Record<string, { data: any, time: number }> = {};
let steamPriceCache: Record<string, { data: any, time: number }> = {};

// Cache guard to prevent memory bloating while keeping high performance
const enforceCacheLimit = () => {
    const MAX_ENTRIES = 3000;
    const now = Date.now();
    
    // Intelligent Pruning instead of nuclear wipe
    const pruneRecord = (record: Record<string, any>) => {
      const keys = Object.keys(record);
      if (keys.length > MAX_ENTRIES) {
        // Delete 25% of the oldest or random entries to keep overhead low
        const toDelete = Math.floor(MAX_ENTRIES * 0.25);
        for (let i = 0; i < toDelete; i++) {
          delete record[keys[i]];
        }
      }
    };

    pruneRecord(translationCache);
    pruneRecord(metacriticCache);

    const pruneTimed = (cache: Record<string, { data: any, time: number }>, ttl: number) => {
      const keys = Object.keys(cache);
      for (const k of keys) {
        if (now - cache[k].time > ttl) delete cache[k];
      }
      if (Object.keys(cache).length > 800) {
        const remainingKeys = Object.keys(cache);
        const toDelete = Math.floor(remainingKeys.length * 0.3);
        for (let i = 0; i < toDelete; i++) delete cache[remainingKeys[i]];
      }
    };

    const ONE_DAY = 1000 * 60 * 60 * 24;
    pruneTimed(psnCache, ONE_DAY);
    pruneTimed(questCache, ONE_DAY);
    pruneTimed(steamPriceCache, ONE_DAY);
};

// Globally suppress the "Failed to retrieve API key" error from metacritic-ts library
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Failed to retrieve API key')) return;
  originalConsoleError(...args);
};

const mcService = new MetacriticService();
const limit = pLimit(30); // Significantly increased for faster parallel processing of cached items

// Pre-compute sorted game titles for faster substitution performance
const SORTED_GAME_TITLES = Object.keys(GAME_TITLE_MAP).sort((a, b) => b.length - a.length);

const REVERSE_GAME_TITLE_MAP: Record<string, string> = Object.entries(GAME_TITLE_MAP).reduce((acc, [en, ko]) => {
  acc[ko] = en;
  return acc;
}, {} as Record<string, string>);

const SORTED_KO_TITLES = Object.keys(REVERSE_GAME_TITLE_MAP).sort((a, b) => b.length - a.length);

function isDLC(title: string): boolean {
  if (!title) return false;
  if (title.match(/jackbox/i)) return false;
  const t = title.toLowerCase();
  if (t.match(/(\bpack\b|\bdlc\b|\bexpansion\b|\bseason\s+pass\b|\bcurrency\b|\bcoins?\b|\bpoints?\b|\btokens?\b|\bbonus\b|\boutfits?\b|\bcosmetics?\b|\badd-ons?\b|\baddons?\b|\bsoundtrack\b|\bupgrade\b|\bbundle\b|\bcredits?\b|\bchapter\b)/i)) {
    return true;
  }
  if (t.match(/(코인|포인트|토큰|보너스|추가\s*콘텐츠|확장팩|시즌\s*패스|업그레이드|사운드트랙|아이템|아바타|스킨|크레딧|프리미엄 패스|디럭스 팩|스타터 팩|파운더스 팩|얼리 어답터 팩|화폐|챕터)/i)) {
    return true;
  }
  return false;
}

function cleanTitleForMetacritic(title: string) {
  const engMatch = title.match(/\(([A-Za-z0-9\s:\!&,'\-]+)\)/);
  let baseTitle = title;
  if (engMatch && engMatch[1].length > 3 && !engMatch[1].match(/(Korean|English|Chinese|Japanese|Russian|Spanish|French|German|Italian|Portuguese|Voice|Text|Subtitle|PS4|PS5)/i)) {
    if (/[가-힣]/.test(title)) {
      baseTitle = engMatch[1]; 
    }
  }

  let cleaned = baseTitle
    .replace(/\(.*?\)/g, '') // Remove anything in parentheses (non-greedy)
    .replace(/\[.*?\]/g, '') // Remove anything in brackets (non-greedy)
    .replace(/ - .*?Edition/gi, '') // Remove "- Deluxe Edition" etc.
    .replace(/ \/ .*/g, '')
    .replace(/ Digital Deluxe Edition/gi, '')
    .replace(/ Ultimate Edition/gi, '')
    .replace(/ Premium Edition/gi, '')
    .replace(/ Standard Edition/gi, '')
    .replace(/ Complete Edition/gi, '')
    .replace(/ Royal Edition/gi, '')
    .replace(/ Game of the Year Edition/gi, '')
    .replace(/ GOTY Edition/gi, '')
    .replace(/ 디지털 디럭스 에디션/gi, '')
    .replace(/ 먼데이 나이트 워 에디션/gi, '')
    .replace(/ 시즌 \d+ 디럭스 에디션/gi, '')
    .replace(/ 얼티밋 에디션/gi, '')
    .replace(/ 디럭스 에디션/gi, '')
    .replace(/ 컴플리트 에디션/gi, '')
    .replace(/ 프리미엄 에디션/gi, '')
    .replace(/ 스탠다드 에디션/gi, '')
    .replace(/ 합본/gi, '') // bundle
    .replace(/ 리마스터/gi, ' Remastered')
    .replace(/\bPS4\b/gi, '') // Remove PS4 tag
    .replace(/\bPS5\b/gi, '') // Remove PS5 tag
    .replace(/\s&\s*$/g, '')
    .replace(/^\s*&\s/g, '')
    .replace(/ & /g, ' ')
    .replace(/™/g, '')
    .replace(/®/g, '')
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
    .trim();
    
  // Additional cleanup if it ends with hyphen
  cleaned = cleaned.replace(/\s*-\s*$/, '').trim();
  
  return cleaned;
}

function cleanDisplayTitle(title: string) {
  let cleaned = title
    .replace(/\|\s*Download and Buy.*Epic Games Store/g, '')
    .replace(/-\s*Epic Games Store/g, '')
    .replace(/\s*[\(\[].*?(중국어|간체자|번체자|한국어|태국어|일본어|스페인어|프랑스어|독일어|이탈리아어|러시아어|포르투갈어|다국어|영어|한글|영문|중문|일어|Korean|Chinese|Japanese|English).*?[\)\]]/gi, '')
    .replace(/\s*[-:\/|,]*\s*(?:중국어|간체자|번체자|한국어|태국어|일본어|스페인어|프랑스어|독일어|이탈리아어|러시아어|포르투갈어|다국어|영어|한글|영문|중문|일어)(?:\s*지원|\s*판|\s*자막)?/gi, '')
    .replace(/[\(\[]\s*(?:,\s*)*[\)\]]/g, '')
    .replace(/[,\s\)]+\)$/, '') // removes trailing ")", ", )" etc recursively
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*[-:\/|,)]+\s*$/g, '')
    .trim();

  // Deduplicate redundant bilingual titles like "Dead by Daylight (Dead by Daylight)"
  if (cleaned.includes(" (") && cleaned.endsWith(")")) {
    const parts = cleaned.split(/[\(\)]/);
    if (parts.length >= 2) {
      const p1 = parts[0].trim();
      const p2 = parts[1].trim();
      if (p1 === p2) {
        cleaned = p1;
      }
    }
  }
    
  return cleaned;
}

async function fetchMetacriticScore(title: string): Promise<number | undefined> {
  enforceCacheLimit();
  try {
    let queryTitle = cleanTitleForMetacritic(title);

    if (metacriticCache[queryTitle] !== undefined) {
      return metacriticCache[queryTitle] === null ? undefined : metacriticCache[queryTitle]!;
    }
    
    const result = await mcService.search(queryTitle);
    if (result && result.length > 0) {
      metacriticCache[queryTitle] = result[0].criticScore;
      return result[0].criticScore;
    }
    
    metacriticCache[queryTitle] = null;
  } catch (e) {
    metacriticCache[cleanTitleForMetacritic(title)] = null;
  }
  return undefined;
}



const translateLimit = pLimit(5); // Increased slightly for better throughput
async function translateToKorean(englishText: string): Promise<string> {
  if (!englishText) return englishText;
  
  const cacheKey = `ko-v9-${englishText}`;
  if (translationCache[cacheKey]) return translationCache[cacheKey];

  return translateLimit(async () => {
    try {
      // 1. Manual mapping search FIRST (Handles cases where source might be English or partially translated)
      for (const en of SORTED_GAME_TITLES) {
        const ko = GAME_TITLE_MAP[en];
        const regex = new RegExp(`\\b${en}\\b`, 'i');
        if (regex.test(englishText)) {
          // Replace the English title with Korean, then translate the rest if needed
          let result = englishText.replace(regex, ko);
          
          // If there's still more English text, we might want to translate suffixes
          const hasEnglish = /[a-z]/i.test(result);
          if (hasEnglish) {
            result = result
              .replace(/Digital Deluxe Edition/gi, ' 디지털 디럭스 에디션')
              .replace(/Deluxe Edition/gi, ' 디럭스 에디션')
              .replace(/Standard Edition/gi, ' 스탠다드 에디션')
              .replace(/Ultimate Edition/gi, ' 얼티밋 에디션')
              .replace(/Premium Edition/gi, ' 프리미엄 에디션')
              .replace(/Complete Edition/gi, ' 컴플리트 에디션')
              .replace(/Gold Edition/gi, ' 골드 에디션')
              .replace(/Director's Cut/gi, ' 디렉터즈 컷')
              .replace(/Expansion Pass/gi, ' 확장 패스')
              .replace(/Season Pass/gi, ' 시즌 패스');
          }
          
          if (!/[a-z]/i.test(result)) {
            const final = cleanKoreanTranslation(englishText, result.trim());
            translationCache[cacheKey] = final;
            return final;
          }
          // If still contains English, fall through to Google Translate but use the mapping as hint
          englishText = result;
          break; 
        }
      }

      // 2. If it's already entirely Korean/numbers/symbols, skip Google Translate but still clean it
      if (/^[가-힣\s0-9:!&,'\-\(\)\[\]\/\.]+$/.test(englishText)) {
         return cleanKoreanTranslation(englishText, englishText);
      }

      // Clean trademarks that might confuse the translator
      const textToTranslate = englishText.replace(/[™®©]/g, '').trim();
      if (!textToTranslate) return englishText;

      const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(textToTranslate)}`, { timeout: 8000 });
      if (res.data && res.data[0]) {
        let translated = res.data[0].map((x: any[]) => x[0]).join('').trim();
        translated = cleanKoreanTranslation(englishText, translated);
        translationCache[cacheKey] = translated;
        return translated;
      }
    } catch (e: any) {
      console.error("Translate en->ko fail:", e.message);
    }
    return englishText;
  });
}

async function translateToEnglish(text: string): Promise<string> {
  if (!text || !/[가-힣]/.test(text)) return text;
  
  // Check manual fixes first
  const cleanT = text.trim();
  for (const [kr, en] of Object.entries(KOREAN_TO_ENGLISH_FIXES)) {
      if (cleanT.includes(kr)) return en;
  }

  const cacheKey = `en-v13-${text}`;
  if (translationCache[cacheKey]) return translationCache[cacheKey];

  return translateLimit(async () => {
    try {
      let currentText = text;
      // 1. Manual mapping search FIRST
      for (const ko of SORTED_KO_TITLES) {
        const en = REVERSE_GAME_TITLE_MAP[ko];
        const regex = new RegExp(ko, 'g');
        if (regex.test(currentText)) {
           let result = currentText.replace(regex, en);
           if (!/[가-힣]/.test(result)) {
             translationCache[cacheKey] = result.trim();
             return result.trim();
           }
           currentText = result;
        }
      }

      const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(currentText)}`, { timeout: 8000 });
      if (res.data && res.data[0]) {
        const translated = res.data[0].map((x: any[]) => x[0]).join('').trim();
        translationCache[cacheKey] = translated;
        return translated;
      }
    } catch (e: any) {
      console.error("Translate ko->en fail:", e.message);
    }
    return text;
  });
}

async function translateBulkToKorean(titles: string[]): Promise<string[]> {
  if (!titles || titles.length === 0) return [];
  
  // Check cache and manual mapping first for all titles
  const results = titles.map(t => {
    // 0. If it's already entirely Korean/numbers/symbols, skip translation
    if (!t || /^[가-힣\s0-9:!&,'\-\(\)\[\]\/\.]+$/.test(t)) return t;

    // 1. Precise cache match
    if (translationCache[`ko-v12-${t}`]) return translationCache[`ko-v12-${t}`];
    
    // 2. Precise manual map match
    if (GAME_TITLE_MAP[t]) return GAME_TITLE_MAP[t];
    
    // 3. Partial manual map match (for titles with suffixes like "Dead by Daylight: Deluxe Edition")
    for (const [en, ko] of Object.entries(GAME_TITLE_MAP)) {
      if (t.includes(en) && t !== en) {
        // Avoid duplications like "데드 바이 데이라이트 (데드 바이 데이라이트)"
        const replaced = t.replace(en, ko);
        if (replaced.includes(`(${ko})`) || replaced.includes(`( ${ko} )`)) {
          return replaced.replace(/\s*\([\s가-힣]*\)/g, "").trim();
        }
        return replaced;
      }
    }
    
    return null;
  });
  
  const untranslatedIndices = results.map((r, i) => r === null ? i : -1).filter(i => i !== -1);
  
  if (untranslatedIndices.length === 0) return results as string[];

  const untranslatedTitles = untranslatedIndices.map(i => titles[i]);
  
  try {
    // Join with newlines - Google Translate preserves them much better than custom separators
    const textToTranslate = untranslatedTitles.join("\n");
    
    // Use Google Translate free API in bulk
    const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(textToTranslate)}`, { timeout: 12000 });
    
    // Extract pieces correctly from multi-line response
    let translatedParts: string[] = [];
    if (res.data && res.data[0]) {
      // More robust way to handle Google's multi-segment response
      translatedParts = res.data[0]
        .map((x: any[]) => x[0])
        .join('')
        .split("\n")
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);
    }
    
    // Safety check: if Google Translate merged lines, fallback to individual
    if (translatedParts.length !== untranslatedTitles.length) {
      console.warn(`Bulk translation length mismatch: expected ${untranslatedTitles.length}, got ${translatedParts.length}. Falling back.`);
      const fallbackResults = await Promise.all(untranslatedTitles.map(t => translateToKorean(t)));
      untranslatedIndices.forEach((idx, i) => {
        results[idx] = fallbackResults[i];
      });
      return results as string[];
    }
    
    untranslatedIndices.forEach((origIdx, i) => {
      const original = titles[origIdx];
      const translatedRaw = translatedParts[i] || original;
      // Avoid duplications like "데드 바이 데이라이트 (데드 바이 데이라이트)"
      let final = cleanKoreanTranslation(original, translatedRaw);
      if (final.includes(" (") && final.includes(")")) {
         const parts = final.split(/[\(\)]/);
         if (parts[0].trim() === parts[1].trim()) {
           final = parts[0].trim();
         }
      }
      
      translationCache[`ko-v12-${original}`] = final;
      results[origIdx] = final;
    });
  } catch (e) {
    console.error("Bulk translation failed, falling back to individual:", e);
    // Fallback to individual
    const individualResults = await Promise.all(untranslatedTitles.map(t => translateToKorean(t)));
    untranslatedIndices.forEach((idx, i) => {
      results[idx] = individualResults[i];
    });
  }
  
  return results.map((r, i) => r || titles[i]);
}

async function translateBulkToEnglish(titles: string[]): Promise<string[]> {
  if (!titles || titles.length === 0) return [];
  
  const results = titles.map(t => {
    if (!t || !/[가-힣]/.test(t)) return t;
    return translationCache[`en-${t}`] || null;
  });
  const untranslatedIndices = results.map((r, i) => r === null ? i : -1).filter(i => i !== -1);
  
  if (untranslatedIndices.length === 0) return results as string[];

  const untranslatedTitles = untranslatedIndices.map(i => titles[i]);
  
  try {
    const SEP = " ||| ";
    const textToTranslate = untranslatedTitles.join(SEP);
    
    const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(textToTranslate)}`, { timeout: 12000 });
    
    if (res.data && res.data[0]) {
      const translatedFull = res.data[0].map((x: any[]) => x[0]).join('').trim();
      const translatedParts = translatedFull.split(/\s*\|\|\|\s*/).map(p => p.trim());
      
      if (translatedParts.length !== untranslatedTitles.length) {
        const fallbackResults = await Promise.all(untranslatedTitles.map(t => translateToEnglish(t)));
        untranslatedIndices.forEach((idx, i) => {
          results[idx] = fallbackResults[i];
        });
        return results as string[];
      }

      untranslatedIndices.forEach((origIdx, i) => {
        const original = titles[origIdx];
        let translated = translatedParts[i] || original;
        if (translated.includes("|||")) translated = translated.split("|||")[0].trim();
        translationCache[`en-${original}`] = translated;
        results[origIdx] = translated;
      });
    }
  } catch (e) {
    console.error("Bulk translation to English failed:", e);
    const individualResults = await Promise.all(untranslatedTitles.map(t => translateToEnglish(t)));
    untranslatedIndices.forEach((idx, i) => {
      results[idx] = individualResults[i];
    });
  }
  
  return results.map((r, i) => r || titles[i]);
}

async function startServer() {
  const app = express();
app.disable('x-powered-by');
  const PORT = 3001;

  // Enable CORS for frontend flexibility if hosted independently
  app.use(cors());

  // Cloud Run/Nginx Proxy Support
  app.set("trust proxy", 1);

  // 1. Security Headers (Helmet)
  // We disable contentSecurityPolicy in dev mode so Vite HMR works, but keep others
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false, // Allows loading external images (Steam, Nintendo)
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Ensure API and assets can be accessed across instances if needed
    dnsPrefetchControl: { allow: false },
    frameguard: false, // Disabled to allow rendering in AI Studio iframe preview
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
  }));

  // GZIP/Brotli Compression removed to offload to Cloudflare/Cloud CDN edge and save server CPU

  // 2. Global Rate Limiting (DDoS Protection)
  // Max 500 requests per 15 minutes per IP (Increased for dashboard usage)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: "Too many requests from this IP, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false,
      trustProxy: false,
    }
  });
  app.use("/api/", limiter);

  // Stricter rate limit for search/refresh operations
  const actionLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100, 
    message: { error: "Action rate limit exceeded. Please wait a moment." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false,
      trustProxy: false,
    }
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" })); // Prevent parameter bloat in urlencoded bodies

  function enforceCleanPrices(deals: any[]) {
      deals.forEach(deal => {
          ['price', 'original_price', 'current_price', 'old_price'].forEach(key => {
              if (deal[key] && typeof deal[key] === 'string') {
                  if (deal[key].includes('원')) {
                      let cleaned = deal[key].replace(/원/g, '').trim();
                      if (!cleaned.startsWith('₩') && !cleaned.startsWith('$') && cleaned !== 'Free' && cleaned !== 'N/A') {
                          cleaned = '₩' + cleaned;
                      }
                      deal[key] = cleaned;
                  }
              }
          });
      });
  }

  // API: Refresh Wishlist Prices
  app.post("/api/wishlist/refresh", actionLimiter, async (req, res) => {
    try {
      const items = req.body.items || [];
      if (!Array.isArray(items) || items.length === 0) return res.json([]);
      
      const cc = req.query.cc || "kr";
      const lang = req.query.lang || "en";
      const updatedItems = [];
      const now = Date.now();

      // Separate steam games to batch them
      const steamItems = items.filter(i => i.platform === "steam" && i.id && !isNaN(Number(i.id)));
      const psnItems = items.filter(i => i.platform === "playstation");
      const otherItems = items.filter(i => i.platform !== "steam" && i.platform !== "playstation");

      if (steamItems.length > 0) {
        // Steam appdetails allows multiple appids separated by comma
        const appids = steamItems.map(i => i.id).filter(id => id && !isNaN(Number(id))).join(",");
        if (appids) {
          try {
            const steamRes = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appids}&cc=${cc}&filters=price_overview`, { timeout: 10000 });
            
            for (const item of steamItems) {
              const data = steamRes.data[item.id];
              if (data && data.success && data.data && data.data.price_overview) {
                const priceData = data.data.price_overview;
                const initial = priceData.initial || 0;
                const final = priceData.final || 0;
                const discountStr = priceData.discount_percent || (initial > final && initial > 0 ? Math.round(((initial - final) / initial) * 100) : 0);
                const hasDiscount = discountStr > 0;

                // Ensure name is updated if backend has it (English store usually, but cc helps)
                
                updatedItems.push({
                  ...item,
                  price: priceData.final_formatted,
                  price_numeric: final ? final / 100 : 0,
                  original_price: hasDiscount ? priceData.initial_formatted : "",
                  discount_percent: discountStr,
                  last_refresh: now
                });
              } else {
                updatedItems.push({ ...item, last_refresh: now });
              }
            }
          } catch (e) {
            console.error("Steam refresh failed:", e.message);
            steamItems.forEach(i => updatedItems.push({ ...i, last_refresh: now }));
          }
        } else {
          steamItems.forEach(i => updatedItems.push({ ...i, last_refresh: now }));
        }
      }

      const limit = pLimit(3); // 3 parallel requests max to avoid blocking
      
      if (psnItems.length > 0) {
        await Promise.all(psnItems.map(item => limit(async () => {
          try {
            let region = "en-us";
            if (item.url && item.url.includes("/ko-kr/")) {
                region = "ko-kr";
            } else if (item.url && item.url.includes("/en-us/")) {
                region = "en-us";
            } else {
                region = cc === "kr" ? "ko-kr" : "en-us";
            }
            
            const psnResponse = await axios.get(`https://store.playstation.com/${region}/search/${encodeURIComponent(item.name)}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              timeout: 10000
            });
            const match = psnResponse.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
            if (match) {
              const json = JSON.parse(match[1]);
              const rawId = item.id.replace('psn-', '');
              const p = json.props.apolloState[`Product:${rawId}:${region}`];
              
              if (p && p.price) {
                const price = p.price;
                const usdToKrw = 1380;
                const isKRWFallback = (region === 'en-us' || !price.discountedPrice.includes('₩')) && cc === 'kr';
                
                let baseNumeric = price.basePriceValue ? price.basePriceValue / 100 : parseFloat(price.basePrice.replace(/,/g, '').replace(/[^0-9.]/g, ''));
                let discNumeric = price.discountedValue ? price.discountedValue / 100 : (price.discountedPrice ? parseFloat(price.discountedPrice.replace(/,/g, '').replace(/[^0-9.]/g, '')) : baseNumeric);
                
                if (isKRWFallback && discNumeric < 1000) {
                    baseNumeric = Math.round(baseNumeric * usdToKrw);
                    discNumeric = Math.round(discNumeric * usdToKrw);
                }

                const currencyPrefix = isKRWFallback || region === 'ko-kr' || price.discountedPrice.includes('₩') ? '₩' : '$';

                let discountPercent = 0;
                if (price.discountText) {
                  const m = price.discountText.match(/\d+/);
                  if (m) discountPercent = parseInt(m[0]);
                } else if (baseNumeric > discNumeric) {
                    discountPercent = Math.round((1 - (discNumeric / baseNumeric)) * 100);
                }

                updatedItems.push({
                  ...item,
                  name: p.name || item.name,
                  price: `${currencyPrefix}${discNumeric.toLocaleString()}`,
                  price_numeric: discNumeric,
                  original_price: discountPercent > 0 ? `${currencyPrefix}${baseNumeric.toLocaleString()}` : "",
                  discount_percent: discountPercent,
                  last_refresh: now
                });
                return;
              }
            }
          } catch (e) {
            console.error("PSN item refresh failed for:", item.name, e.message);
          }
          // Fallback if not found or errored
          updatedItems.push({ ...item, last_refresh: now });
        })));
      }

      // For other items, we return them as is but possibly convert currency if missing
      for (const item of otherItems) {
        let price = item.price;
        let orig = item.original_price;
        let priceNum = item.price_numeric;

        // Robust currency conversion: Only multiply if we have a small float (USD-ish) 
        // and the display string confirms it's in USD.
        if (cc === 'kr' && typeof price === 'string' && price.includes('$')) {
            const usdToKrw = 1380;
            // Remove commas before parsing numeric value for safety
            const cleanPriceNum = typeof priceNum === 'string' ? parseFloat((priceNum as string).replace(/,/g, '')) : priceNum;
            
            if (cleanPriceNum < 2000) { // $2000 limit for multiplication safety
              priceNum = Math.round(cleanPriceNum * usdToKrw);
              price = `₩${priceNum.toLocaleString()}`;
              if (orig && orig.includes('$')) {
                  const origNum = parseFloat(orig.replace(/,/g, '').replace(/[^0-9.]/g, ''));
                  if (!isNaN(origNum) && origNum < 2000) {
                      orig = `₩${Math.round(origNum * usdToKrw).toLocaleString()}`;
                  } else if (!isNaN(origNum)) {
                      orig = `₩${Math.round(origNum).toLocaleString()}`;
                  }
              }
            } else {
              // Already expensive, just fix the symbol
              priceNum = Math.round(cleanPriceNum);
              price = `₩${priceNum.toLocaleString()}`;
              if (orig && orig.includes('$')) {
                  const origNum = parseFloat(orig.replace(/,/g, '').replace(/[^0-9.]/g, ''));
                  if (!isNaN(origNum)) {
                      orig = `₩${Math.round(origNum).toLocaleString()}`;
                  }
              }
            }
        }

        updatedItems.push({ ...item, price, original_price: orig, price_numeric: priceNum, last_refresh: now, slug: getNorm(item.name) });
      }

      // Final step: Translate names if language is Korean
      if (lang === 'ko') {
          const titles = updatedItems.map(i => i.name);
          const translated = await translateBulkToKorean(titles);
          updatedItems.forEach((item, idx) => {
              if (translated[idx]) {
                item.name = translated[idx];
              }
          });
      } else if (lang === 'en') {
          const titles = updatedItems.map(i => i.name);
          const translated = await translateBulkToEnglish(titles);
          updatedItems.forEach((item, idx) => {
              if (translated[idx]) {
                item.name = translated[idx];
              }
          });
      }

      enforceCleanPrices(updatedItems);
      res.json(updatedItems);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to refresh wishlist" });
    }
  });

  const crossPlatformCache = new Map<string, { timestamp: number, data: any[] }>();
  const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

  const searchCrossPlatform = async (q: string, cc: string, lang: string = "en"): Promise<any[]> => {
    let searchQ = q;
    let searchQEn = q;
    let searchQKo = q;

    // Translation logic to improve store-specific matching
    if (/[가-힣]/.test(q)) {
      searchQEn = await translateToEnglish(q);
    } else if (cc === "kr") {
      // If English query but in KR, we should try to get Korean version for better matching in KR-only stores
      searchQKo = await translateToKorean(q);
    }

    const cacheKey = `${q}-${cc}-${lang}`;
    const cached = crossPlatformCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const results: any[] = [];
    const currencySymbol = cc === "kr" ? "₩" : "$";

    // --- 1. STEAM SEARCH ---
    try {
      const steamLang = cc === "kr" || lang === "ko" ? "korean" : "english";
      const steamResponse = await axios.get(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(searchQ)}&l=${steamLang}&cc=${cc}`,
        { timeout: 10000 }
      );
      
      const steamResults = (steamResponse.data.items || []).map((item: any) => {
        const initial = item.price ? item.price.initial : 0;
        const final = item.price ? item.price.final : 0;
        const calculatedDiscount = initial > final && initial > 0 ? Math.round(((initial - final) / initial) * 100) : 0;
        
        // Steam KRW prices in storesearch still return in subunits (e.g. 6980000 for 69800 KRW)
        const divisor = 100;

        return {
          id: item.id.toString(),
          name: cleanDisplayTitle(item.name),
          price: item.price ? (final === 0 ? 'Free' : `${currencySymbol}${Math.round(final / divisor).toLocaleString()}`) : "N/A",
          price_numeric: final / divisor,
          original_price: initial > final ? `${currencySymbol}${Math.round(initial / divisor).toLocaleString()}` : "",
          discount_percent: calculatedDiscount,
          image: item.id ? `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg` : (item.tiny_image || `https://picsum.photos/seed/${encodeURIComponent(item.name)}/400/225`),
          platform: "steam",
          url: `https://store.steampowered.com/app/${item.id}`,
          slug: getNorm(item.name)
        };
      });
      results.push(...steamResults);
    } catch (steamErr) {
      console.error("Steam search error:", steamErr);
    }

    // --- 1b. EPIC, UBISOFT, GOG SEARCH (Via CheapShark) ---
    try {
      const fetchCheapSharkSearch = async (storeID: string, platformName: string) => {
        const res = await axios.get(`https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(searchQEn)}&storeID=${storeID}`, { timeout: 10000 });
        const validDeals = res.data.filter((deal: any) => !deal.title.toLowerCase().includes('dlc') && !deal.title.toLowerCase().includes('season pass'));
        
        return validDeals.slice(0, 5).map((deal: any) => {
          const salePriceNum = parseFloat(deal.salePrice);
          const normalPriceNum = parseFloat(deal.normalPrice);
          const exchangeRate = cc === 'kr' ? 1380 : 1;
          
          let image = deal.thumb;
          if (image.includes('capsule_') && (image.includes('steamstatic') || image.includes('steampowered'))) {
            image = image.replace(/capsule_[a-z0-9_x]+/, 'header');
          }

          let url = `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`;
          if (platformName === "epic") url = `https://store.epicgames.com/browse?q=${encodeURIComponent(deal.title)}`;
          else if (platformName === "ubisoft") url = `https://store.ubisoft.com/${searchQEn === 'ko' ? 'kr/search' : 'search'}?q=${encodeURIComponent(deal.title)}`;
          else if (platformName === "gog") url = `https://www.gog.com/en/search?sq=${encodeURIComponent(deal.title)}`;

          return {
            id: `${platformName}-${deal.dealID}`,
            name: cleanDisplayTitle(deal.title),
            price: salePriceNum === 0 ? 'Free' : `${currencySymbol}${Math.round(salePriceNum * exchangeRate).toLocaleString()}`,
            price_numeric: salePriceNum * exchangeRate,
            original_price: salePriceNum < normalPriceNum ? `${currencySymbol}${Math.round(normalPriceNum * exchangeRate).toLocaleString()}` : "",
            discount_percent: Math.round(parseFloat(deal.savings)),
            image: image,
            platform: platformName,
            url: url,
            slug: getNorm(deal.title)
          };
        });
      };
      const [epicResults, ubisoftResults, gogResults] = await Promise.all([
        fetchCheapSharkSearch("25", "epic"),
        fetchCheapSharkSearch("13", "ubisoft"),
        fetchCheapSharkSearch("7", "gog")
      ]);
      results.push(...epicResults, ...ubisoftResults, ...gogResults);
    } catch (csErr) {
      console.error("CheapShark search error:", csErr);
    }

      // --- 2. PLAYSTATION SEARCH ---
      try {
          const region = cc === 'kr' ? 'ko-kr' : 'en-us';
          const searchTitle = cc === 'kr' ? q : searchQEn; // Use original/Korean query for ko-kr store
          
          const psnResponse = await axios.get(`https://store.playstation.com/${region}/search/${encodeURIComponent(searchTitle)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
          });
          
          const match = psnResponse.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
          if (match) {
            const json = JSON.parse(match[1]);
            const state = json.props.apolloState;
            const psnProducts = Object.keys(state)
              .filter(k => k.startsWith('Product:'))
              .map(k => state[k])
              .filter(p => p.name && p.price && typeof p.price === 'object' && p.storeDisplayClassification === 'FULL_GAME'); // Full games only

            const usdToKrw = 1380;

            const psnResults = psnProducts.slice(0, 10).map((p: any) => {
              const media = p.media || [];
              let image = media.find((m: any) => m.role === 'MASTER' || m.role === 'EDITION_KEY_ART')?.url || 
                          media.find((m: any) => m.role === 'SCREENSHOT' && m.type === 'IMAGE')?.url ||
                          media.find((m: any) => m.type === 'IMAGE')?.url || 
                          `https://picsum.photos/seed/${encodeURIComponent(p.name)}/400/225`;
              
              if (image.startsWith('/')) image = `https://image.api.playstation.com${image}`;

              const price = p.price;
              
              let initial = parseFloat((price.basePrice || "0").replace(/[^0-9.-]+/g, ""));
              let final = parseFloat((price.discountedPrice || price.basePrice || "0").replace(/[^0-9.-]+/g, ""));
              
              const priceStr = (price.discountedPrice || price.basePrice || "").toLowerCase();
              // If we are in ko-kr region, we expect KRW prices (usually > 1000)
              const isUSDPrice = region === 'en-us' && (priceStr.includes('$') || (final < 500 && !priceStr.includes('₩') && !priceStr.includes('원')));

              // if cc is KR but price is USD, multiply
              if (cc === 'kr' && isUSDPrice) {
                final = Math.round(final * usdToKrw);
                initial = Math.round(initial * usdToKrw);
              }

              let discountPercent = 0;
              if (price.discountText) {
                const m = price.discountText.match(/\d+/);
                if (m) discountPercent = parseInt(m[0]);
              }

              return {
                id: `psn-${p.id}`,
                name: p.name,
                price: cc === 'kr' ? `₩${Math.round(final).toLocaleString()}` : (price.discountedPrice || price.basePrice || "N/A"),
                price_numeric: final,
                original_price: discountPercent > 0 ? (cc === 'kr' ? `₩${Math.round(initial).toLocaleString()}` : price.basePrice) : "",
                discount_percent: discountPercent,
                image,
                platform: 'playstation',
                url: `https://store.playstation.com/${region}/product/${p.id}`,
                slug: getNorm(p.name)
              };
            });
            results.push(...psnResults);
        }
      } catch (psnErr) {
        console.error("PSN search error:", psnErr);
      }



      // (Removed redundant GOG block)

      // --- 5. QUEST SEARCH (Via VRDB) ---
      try {
        const vrdbResponse = await axios.get(`https://vrdb.app/api/search?q=${encodeURIComponent(searchQEn)}`, { timeout: 8000 });
        const questProducts = vrdbResponse.data?.data?.applications || [];
        
        const questResults = questProducts.slice(0, 5).map((p: any) => {
          const usdToKrw = 1380;
          let initialUSD = (p.price_USD_amount || 0) / 100;
          let finalUSD = p.price_special_offer_USD_amount !== null ? p.price_special_offer_USD_amount / 100 : initialUSD;

          let initial = cc === 'kr' ? Math.round(initialUSD * usdToKrw) : initialUSD;
          let final = cc === 'kr' ? Math.round(finalUSD * usdToKrw) : finalUSD;

          let discountPercent = p.price_special_offer_USD_discount_percentage || 0;
          if (!discountPercent && initial > final) {
             discountPercent = ((initial - final) / initial) * 100;
          }

          return {
            id: `quest-${p.id}`,
            name: cleanDisplayTitle(p.name),
            price: cc === 'kr' ? (final === 0 ? 'Free' : `₩${final.toLocaleString()}`) : (final === 0 ? 'Free' : `$${final.toFixed(2)}`),
            price_numeric: final,
            original_price: discountPercent > 0 ? (cc === 'kr' ? `₩${initial.toLocaleString()}` : `$${initial.toFixed(2)}`) : "",
            discount_percent: Math.round(discountPercent),
            image: p.image_landscape || p.image_hero || p.image_square || p.image_portrait || `https://picsum.photos/seed/${encodeURIComponent(p.name)}/400/225`,
            platform: "quest",
            url: p.store_link || `https://www.meta.com/experiences/${p.id}`,
            slug: p.slug || getNorm(p.name)
          };
        });
        results.push(...questResults);
      } catch (questErr) {
         console.error("Quest search error:", questErr);
      }

      if (crossPlatformCache.size > 2000) {
        // Prune oldest entries when cache grows too large
        const sorted = Array.from(crossPlatformCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < 500; i++) {
          crossPlatformCache.delete(sorted[i][0]);
        }
      }

      if (lang === "ko") {
        const titles = results.map(deal => deal.name);
        const translatedTitles = await translateBulkToKorean(titles);
        results.forEach((deal, idx) => {
          deal.name = translatedTitles[idx];
        });
      } else if (lang === "en") {
        const titles = results.map(deal => deal.name);
        const translatedTitles = await translateBulkToEnglish(titles);
        results.forEach((deal, idx) => {
          deal.name = translatedTitles[idx];
        });
      }

      enforceCleanPrices(results);
      crossPlatformCache.set(cacheKey, { timestamp: Date.now(), data: results });
      return results;
  };

  // API: Search Games for Wishlist (Autofill)
  app.get("/api/search", actionLimiter, async (req, res) => {
    let rawQ = req.query.q;
    let rawCc = req.query.cc;
    if (Array.isArray(rawQ)) rawQ = rawQ[0];
    if (Array.isArray(rawCc)) rawCc = rawCc[0];

    const q = rawQ;
    const cc = (typeof rawCc === "string" ? rawCc : "kr");
    const lang = (typeof req.query.lang === "string" ? req.query.lang : "en");

    if (!q || typeof q !== "string" || q.length > 100) return res.json([]);

    try {
      const results = await searchCrossPlatform(q, cc, lang);
      res.setHeader("Cache-Control", "public, s-maxage=14400, max-age=3600");
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  // API: Cross-Platform Refresh
  app.post("/api/wishlist/cross_platform_refresh", actionLimiter, async (req, res) => {
    try {
      const titles = req.body.titles || [];
      if (!Array.isArray(titles) || titles.length === 0) return res.json({});
      
      const cc = req.query.cc || "us";
      const lang = (typeof req.query.lang === "string" ? req.query.lang : "en");
      const limitSearch = pLimit(2);
      
      const aggregatedDeals: Record<string, any[]> = {};
      
      await Promise.all(titles.map(title => limitSearch(async () => {
        try {
          const normTitle = getNorm(title);
          const results = await searchCrossPlatform(normTitle.length > 0 ? normTitle : title, cc as string, lang);
          
          const isDlcOrAddon = (n: string) => /\b(dlc|add-on|addon|season pass|expansion|pack|currency|points|upgrade|coins|credits|premium|costume|soundtrack)\b/i.test(n);
          const titleIsDlc = isDlcOrAddon(title);
          
          const bestMatches = results.filter(deal => {
            if (!titleIsDlc && isDlcOrAddon(deal.name)) return false;
            const dpNorm = getNorm(deal.name);
            return dpNorm === normTitle || (normTitle.length > 5 && (dpNorm.includes(normTitle) || normTitle.includes(dpNorm)));
          });

          const platformMap = new Map<string, any>();
          for (const deal of bestMatches) {
            const existing = platformMap.get(deal.platform);
            if (!existing || deal.price_numeric < existing.price_numeric) {
              platformMap.set(deal.platform, deal);
            }
          }
          
          aggregatedDeals[title] = Array.from(platformMap.values());
        } catch (e) {
          console.error("Aggregation error for", title, e);
        }
      })));

      res.json(aggregatedDeals);
    } catch (e) {
      res.status(500).json({ error: "Failed cross platform aggregate" });
    }
  });

  // API: Get Deals (Unified)
  app.get("/api/deals", async (req, res) => {
    // Prevent HTTP Parameter Pollution (HPP) by coercing to string
    let rawCc = req.query.cc;
    let rawPlatform = req.query.platform;
    let rawPage = req.query.page;
    let rawQ = req.query.q;
    if (Array.isArray(rawCc)) rawCc = rawCc[0];
    if (Array.isArray(rawPlatform)) rawPlatform = rawPlatform[0];
    if (Array.isArray(rawPage)) rawPage = rawPage[0];
    if (Array.isArray(rawQ)) rawQ = rawQ[0];

    const cc = (typeof rawCc === "string" ? rawCc : "kr");
    const platform = (typeof rawPlatform === "string" ? rawPlatform : "all");
    const lang = (typeof req.query.lang === "string" ? req.query.lang : "en");
    const q = (typeof rawQ === "string" ? rawQ.trim() : "");
    let page = parseInt(typeof rawPage === "string" ? rawPage : "1", 10) || 1;
    
    // Optimization and Security 2026: Block excessively deep pagination to prevent scraping and abuse.
    if (page > 25) {
      return res.status(400).json({ error: "Deep pagination beyond page 25 is not allowed to prevent scraping." });
    }
    // Steam: If CC is KR, normally use Korean. But if user explicitly requested English (lang=en), use English.
    const steam_l = (lang === "ko" || (cc === "kr" && lang !== "en")) ? "korean" : "english";

    const fetchSteam = async () => {
      // Massive performance optimization: Instead of 80+ iterative calls to Steam API, use the high-performance CheapShark index!
      try {
        return await fetchCheapShark("1", "steam", cc as string, lang, q);
      } catch (err) {
        console.error("Steam CS fetch error:", err);
        return [];
      }
    };

    const fetchCheapShark = async (storeID: string, platformName: string, cc: string, lang: string = "en", query: string = "") => {
      try {
        let url = `https://www.cheapshark.com/api/1.0/deals?storeID=${storeID}&pageNumber=${page - 1}`;
        if (query) {
          url += `&title=${encodeURIComponent(query)}`;
        } else {
          url += `&onSale=1&sortBy=DealRating`;
        }
        console.log(`[DEALS-DEBUG] Requesting CheapShark: ${url}`);
        const res = await axios.get(url, { timeout: 15000 });
        console.log(`[DEALS-DEBUG] CheapShark response for ${platformName}:`, res.status, res.data?.length);
        const exchangeRate = cc === "kr" ? 1380 : 1;

        
        // Filter out DLCs and non-deals (where savings is 0 or price is same)
        const validDeals = res.data.filter((deal: any) => {
          if (isDLC(deal.title)) return false;
          if (!query) {
            const savings = parseFloat(deal.savings);
            if (isNaN(savings) || savings <= 0) return false;
          }
          return true;
        });
        
        let rawResults = validDeals.slice(0, 20).map((deal: any) => {
          const salePriceNum = parseFloat(deal.salePrice) * exchangeRate;
          const normalPriceNum = parseFloat(deal.normalPrice) * exchangeRate;
          
          let targetUrl = `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`;
          if (platformName === "steam" && deal.steamAppID) {
            targetUrl = `https://store.steampowered.com/app/${deal.steamAppID}?cc=${cc}&l=${lang === 'ko' ? 'korean' : 'english'}`;
          } else if (platformName === "epic") {
             targetUrl = `https://store.epicgames.com/browse?q=${encodeURIComponent(deal.title)}`;
          } else if (platformName === "ubisoft") {
             const ubisoftLocale = cc === 'kr' ? 'kr/search' : 'search';
             targetUrl = `https://store.ubisoft.com/${ubisoftLocale}?q=${encodeURIComponent(deal.title)}`;
          }
          
          let image = deal.thumb;
          if (deal.steamAppID) {
            image = `https://cdn.akamai.steamstatic.com/steam/apps/${deal.steamAppID}/header.jpg`;
          } else if (platformName === 'epic') {
            // Priority: Attempt to get a high-quality header if it's a known Epic thumb pattern
            if (deal.thumb.includes('cheapshark') || deal.thumb.includes('epicgames')) {
                // CheapShark often has low-res or placeholder thumbs for Epic. 
                // We'll try to use a more generic landing image if possible, or fallback
                image = deal.thumb.replace(/capsule_[a-z0-9_x]+/, 'header').replace('store_icon', 'header');
            }
          } else {
            image = deal.thumb.replace(/capsule_[a-z0-9_x]+/, 'header');
          }
          
          return {
            id: `${platformName}-${deal.dealID}`,
            name: cleanDisplayTitle(deal.title),
            price: cc === "kr" ? `₩${Math.round(salePriceNum).toLocaleString()}` : `$${deal.salePrice}`,
            price_numeric: salePriceNum,
            original_price: cc === "kr" ? `₩${Math.round(normalPriceNum).toLocaleString()}` : `$${deal.normalPrice}`,
            discount_percent: Math.round(parseFloat(deal.savings)),
            image: image,
            platform: platformName,
            steamDeckVerified: platformName === "steam" && parseInt(deal.metacriticScore) > 75,
            url: targetUrl,
            metacritic: parseInt(deal.metacriticScore),
            steam_score: deal.steamRatingText ? `${deal.steamRatingPercent}% ${deal.steamRatingText}` : undefined,
            steamAppID: deal.steamAppID,
            genres: []
          };
        });

        if (platformName === "steam" && cc === "kr") {
            const itemsWithIds = rawResults.filter((d: any) => d.steamAppID);
            if (itemsWithIds.length > 0) {
                const steamLimit = pLimit(3);
                await Promise.all(itemsWithIds.map(deal => steamLimit(async () => {
                    const appId = deal.steamAppID;
                    const steam_l = lang === "ko" ? "korean" : "english";
                    const cacheKey = `steam-${appId}-${cc}-${steam_l}`;
                    const now = Date.now();
                    
                    if (steamPriceCache[cacheKey] && (now - steamPriceCache[cacheKey].time < 1000 * 60 * 60 * 12)) {
                        const cached = steamPriceCache[cacheKey].data;
                        if (cached.name) deal.name = cached.name;
                        if (cached.price_overview) {
                            const po = cached.price_overview;
                            deal.price = po.final_formatted;
                            deal.price_numeric = po.final / 100;
                            deal.original_price = po.initial_formatted || deal.original_price;
                            deal.discount_percent = po.discount_percent;
                        }
                        return;
                    }

                    try {
                        const sRes = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${cc}&l=${steam_l}&filters=price_overview,basic`, { timeout: 8000 });
                        const sData = sRes.data[appId];
                        if (sData && sData.success && sData.data) {
                            const data = sData.data;
                            steamPriceCache[cacheKey] = { data: data, time: now };
                            if (data.name) deal.name = data.name;
                            if (data.price_overview) {
                                const po = data.price_overview;
                                deal.price = po.final_formatted;
                                deal.price_numeric = po.final / 100;
                                deal.original_price = po.initial_formatted || deal.original_price;
                                deal.discount_percent = po.discount_percent;
                            }
                        }
                    } catch (err) {
                        // Individual failures are okay, we have CheapShark fallback
                    }
                })));
            }
        }

        // Metacritic score integration - Only block on top 5 if not cached
        console.log(`[DEALS-DEBUG] Processing metacritic for ${platformName} (length=${rawResults.length})`);
        const results = await Promise.all(
          rawResults.map((deal: any, idx: number) => 
            limit(async () => {
              if (isNaN(deal.metacritic) || deal.metacritic === 0) {
                // If in cache, use it immediately
                const cleanedTitle = cleanTitleForMetacritic(deal.name);
                if (metacriticCache[cleanedTitle] !== undefined) {
                  deal.metacritic = metacriticCache[cleanedTitle] === null ? undefined : metacriticCache[cleanedTitle];
                } else if (idx < 5) {
                  // Only block on the first 5 items per category if not cached to ensure speed
                  console.log(`[DEALS-DEBUG] Fetch metacritic for ${deal.name}`);
                  deal.metacritic = await fetchMetacriticScore(deal.name);
                  console.log(`[DEALS-DEBUG] Metacritic for ${deal.name} completed`);
                }
              }
              return deal;
            })
          )
        );
        console.log(`[DEALS-DEBUG] Cheapshark return for ${platformName} complete`);
        return results;
      } catch (e) {
        console.error(`CheapShark error for ${platformName}:`, e);
        return [];
      }
    };

    const fetchPlayStationDeals = async (cc: string, lang: string = "en") => {
      const region = cc === "kr" ? "ko-kr" : "en-us"; 
      const cacheKey = `${region}-${lang}-${page}`;
      try {
        console.log(`[DEALS-DEBUG] Starting PSN fetch: ${region}`);
        const now = Date.now();
        const TWELVE_HOURS = 1000 * 60 * 60 * 12;
        
        if (psnCache[cacheKey] && (now - psnCache[cacheKey].time < TWELVE_HOURS)) {
          return psnCache[cacheKey].data;
        }

        const dealsRes = await axios.get(`https://store.playstation.com/${region}/pages/deals`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 8000
        });
        const $deals = cheerio.load(dealsRes.data);
        
        let products: any[] = [];
        const initialNextData = $deals('#__NEXT_DATA__').text();
        if (initialNextData && page === 1) {
            const parsed = JSON.parse(initialNextData);
            const state = parsed.props?.apolloState;
            if (state) {
                products = Object.values(state).filter((item: any) => 
                   (item.__typename === 'Product' || item.__typename === 'Concept') && 
                   (item.storeDisplayClassification === 'FULL_GAME' || !item.storeDisplayClassification)
                );
            }
        }

        // If no products found on index or it's page > 1, we must go to category page
        if (products.length < 10) {
            const categoryLinkRaw = $deals(`a[href^="/${region}/category/"]`).first().attr('href');
            let categoryLink = "";
            
            if (!categoryLinkRaw) {
                const latestRes = await axios.get(`https://store.playstation.com/${region}/pages/latest`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 5000
                });
                const $latest = cheerio.load(latestRes.data);
                const latestCatLink = $latest(`a[href^="/${region}/category/"]`).first().attr('href');
                if (!latestCatLink) return [];
                categoryLink = latestCatLink.replace(/\/\d+$/, '').replace(/\/$/, '');
            } else {
                categoryLink = categoryLinkRaw.replace(/\/\d+$/, '').replace(/\/$/, '');
            }
            
            if (page > 1) categoryLink += `/${page}`;
            
            const categoryRes = await axios.get(`https://store.playstation.com${categoryLink}`, {
              timeout: 10000 
            });
            const $cat = cheerio.load(categoryRes.data);
            const nextDataStr = $cat('#__NEXT_DATA__').text();
            if (nextDataStr) {
                const nextData = JSON.parse(nextDataStr);
                const apolloState = nextData.props?.apolloState;
                if (apolloState) {
                    products = Object.values(apolloState).filter((item: any) => 
                        (item.__typename === 'Product' || item.__typename === 'Concept') && 
                        (item.storeDisplayClassification === 'FULL_GAME' || !item.storeDisplayClassification)
                    );
                }
            }
        }
        
        const rawResults = products.map((p: any) => {
          const price = p.price;
          if (!price || !price.discountedPrice || isDLC(p.name)) return null;
          
          let discountPercent = 0;
          if (price.discountText) {
            const match = price.discountText.match(/\d+/);
            if (match) discountPercent = parseInt(match[0]);
          }

          let priceNum = price.discountedPrice ? parseFloat(price.discountedPrice.replace(/[^0-9.-]+/g, "")) : 0;
          let origNum = price.basePrice ? parseFloat(price.basePrice.replace(/[^0-9.-]+/g, "")) : 0;

          if (discountPercent === 0 && origNum > priceNum && origNum > 0) {
            discountPercent = Math.round(((origNum - priceNum) / origNum) * 100);
          }

          if (discountPercent <= 0) return null;

          const media = p.media || [];
          let image = media.find((m: any) => m.role === 'MASTER' || m.role === 'EDITION_KEY_ART')?.url || 
                      media.find((m: any) => m.type === 'IMAGE')?.url || 
                      `https://picsum.photos/seed/${encodeURIComponent(p.name)}/400/225`;

          if (image.startsWith('/')) image = `https://image.api.playstation.com${image}`;
          
          return {
            id: `psn-${p.id}`,
            name: cleanDisplayTitle(p.name || p.id),
            price: price.discountedPrice,
            price_numeric: priceNum,
            original_price: price.basePrice,
            discount_percent: discountPercent,
            image: image,
            platform: "playstation",
            url: `https://store.playstation.com/${region}/product/${p.id}`,
            metacritic: undefined,
            genres: []
          };
        }).filter((d: any) => d !== null);

        // Metacritic logic: check cache first, then only block on first 5 missing
        const results = await Promise.all(
          rawResults.map((deal: any, idx: number) => 
            limit(async () => {
              const cleanedTitle = cleanTitleForMetacritic(deal.name);
              if (metacriticCache[cleanedTitle] !== undefined) {
                deal.metacritic = metacriticCache[cleanedTitle] === null ? undefined : metacriticCache[cleanedTitle];
              } else if (idx < 5) {
                deal.metacritic = await fetchMetacriticScore(deal.name);
              }
              return deal;
            })
          )
        );

        // Convert USD to KRW for PlayStation Deals
        let finalResults = JSON.parse(JSON.stringify(results)); // Clone to avoid cache mutation
        if (cc === "kr") {
            const usdToKrw = 1380; 
            finalResults = finalResults.map((deal: any) => {
                const currentPriceStr = (deal.price || "").toLowerCase();
                const isAlreadyKRW = currentPriceStr.includes('₩') || currentPriceStr.includes('원') || deal.price_numeric > 400;
                
                // If it's already KRW (price > 400 is a safe bet for KRW vs USD/EUR), skip conversion
                if (isAlreadyKRW) {
                    return deal;
                }
                
                let origNumeric = deal.original_price ? parseFloat(deal.original_price.replace(/[^0-9.]/g, '')) : 0;
                if (isNaN(origNumeric)) origNumeric = 0;
                
                return {
                    ...deal,
                    price: deal.price_numeric === 0 ? 'Free' : `₩${Math.round(deal.price_numeric * usdToKrw).toLocaleString()}`,
                    price_numeric: Math.round(deal.price_numeric * usdToKrw),
                    original_price: origNumeric > 0 ? `₩${Math.round(origNumeric * usdToKrw).toLocaleString()}` : deal.original_price,
                    url: deal.url.replace('/en-us/', '/ko-kr/')
                };
            });
        }

        // console.log("PSN Final Results Length:", finalResults.length);
        if (finalResults.length > 0) {
            // console.log("First PSN Deal:", finalResults[0]);
        }

        psnCache[cacheKey] = { data: finalResults, time: now };
        return finalResults;
      } catch (e: any) {
        console.error("PlayStation fetch error:", e);
        return psnCache[cacheKey]?.data || [];
      }
    };



    const fetchQuestDeals = async () => {
      try {
        const now = Date.now();
        const cacheKey = `all-${page}`;
        const TWELVE_HOURS = 1000 * 60 * 60 * 12;
        
        if (questCache[cacheKey] && (now - questCache[cacheKey].time < TWELVE_HOURS)) {
          return questCache[cacheKey].data;
        }

        const targetUrl = page > 1 ? `https://odeals.net/platform/quest/discount?page=${page}` : 'https://odeals.net/platform/quest/discount';
        const res = await axios.get(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 10000
        });
        
        const $ = cheerio.load(res.data);
        const rawResults: any[] = [];
        
        $('a.game-item').each((i, el) => {
          if (rawResults.length >= 20) return; // Limit to 20 deals
          
          const title = $(el).find('.heading').text().trim();
          if (!title || isDLC(title)) return;
          
          let salePriceStr = $(el).find('.text-danger').text().trim();
          let originalPriceStr = $(el).find('del').text().trim();
          
          if (salePriceStr.toUpperCase() === 'FREE') salePriceStr = '$0.00';
          if (!originalPriceStr) originalPriceStr = salePriceStr;
          
          const salePriceNum = parseFloat(salePriceStr.replace(/[^0-9.-]+/g, ""));
          const originalPriceNum = parseFloat(originalPriceStr.replace(/[^0-9.-]+/g, ""));
          let discountPercent = 0;
          
          const discountStr = $(el).find('.game-item-sale').text().trim();
          if (discountStr) {
            discountPercent = parseInt(discountStr.replace(/[^0-9]/g, ""));
          } else if (originalPriceNum && salePriceNum) {
            discountPercent = Math.round(((originalPriceNum - salePriceNum) / originalPriceNum) * 100);
          }
          
          let image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || `https://picsum.photos/seed/${encodeURIComponent(title)}/400/225`;
          if (image.startsWith('//')) image = 'https:' + image;

          let displayedPrice = salePriceStr;
          let displayedOrig = originalPriceStr;
          let finalPriceNum = salePriceNum;

          if (cc === 'kr') {
             const exchange = 1380;
             finalPriceNum = Math.round(salePriceNum * exchange);
             displayedPrice = finalPriceNum === 0 ? 'Free' : `₩${finalPriceNum.toLocaleString()}`;
             displayedOrig = originalPriceNum > salePriceNum ? `₩${Math.round(originalPriceNum * exchange).toLocaleString()}` : displayedPrice;
          }
          
          rawResults.push({
            id: `quest-${encodeURIComponent(title)}-${i}`,
            name: cleanDisplayTitle(title),
            price: displayedPrice,
            price_numeric: finalPriceNum,
            original_price: displayedOrig,
            discount_percent: discountPercent,
            image: image,
            platform: "quest",
            url: `https://www.meta.com/experiences/search/?q=${encodeURIComponent(title)}`,
            metacritic: undefined,
            genres: []
          });
        });

        const results = await Promise.all(
          rawResults.map((deal: any, idx: number) => 
            limit(async () => {
              const cleanedTitle = cleanTitleForMetacritic(deal.name);
              if (metacriticCache[cleanedTitle] !== undefined) {
                deal.metacritic = metacriticCache[cleanedTitle] === null ? undefined : metacriticCache[cleanedTitle];
              } else if (idx < 5) {
                deal.metacritic = await fetchMetacriticScore(deal.name);
              }
              return deal;
            })
          )
        );

        questCache[cacheKey] = { data: results, time: now };
        return results;
      } catch (e) {
        console.error("Quest fetch error:", e);
        const errCacheKey = `all-${page}`;
        return questCache[errCacheKey]?.data || [];
      }
    };

    try {
      let results: any[] = [];
      
      console.log("Starting deals fetch", {q, cc, lang, platform, page});
      if (q && page === 1) {
        // High-fidelity search handling for explicit queries via storesearch 
        // console.log("CROSS PLATFORM SEARCH Q:", q);
        console.log("Triggering cross platform search");
        const searchResults = await searchCrossPlatform(q, cc as string, lang);
        // console.log("CROSS PLATFORM RESULTS:", searchResults.length);
        console.log("Cross platform search complete");
        results = platform === "all" ? searchResults : searchResults.filter((r: any) => r.platform === platform);
      } else if (q && page > 1) {
        // Since crossPlatformSearch returns everything in one go, page 2+ is just empty
        results = [];
      } else {
        const fetchList = [];
        if (platform === "all") {
          fetchList.push(fetchSteam().then(res => { console.log("Steam complete"); return res; }));
          fetchList.push(fetchCheapShark("25", "epic", cc as string, lang, q).then(res => { console.log("Epic complete"); return res; }));
          fetchList.push(fetchCheapShark("13", "ubisoft", cc as string, lang, q).then(res => { console.log("Ubisoft complete"); return res; }));
          if (!q) {
            fetchList.push(fetchPlayStationDeals(cc as string, lang).then(res => { console.log("PSN complete"); return res; }));
            fetchList.push(fetchQuestDeals().then(res => { console.log("Quest complete"); return res; }));
          }
        } else if (platform === "steam") {
          fetchList.push(fetchSteam());
        } else if (platform === "epic") {
          fetchList.push(fetchCheapShark("25", "epic", cc as string, lang, q));
        } else if (platform === "ubisoft") {
          fetchList.push(fetchCheapShark("13", "ubisoft", cc as string, lang, q));
        } else if (platform === "playstation") {
          if (!q) fetchList.push(fetchPlayStationDeals(cc as string, lang));
        } else if (platform === "quest") {
          if (!q) fetchList.push(fetchQuestDeals());
        }

        const rawPlatformResults = await Promise.all(fetchList);
        results = JSON.parse(JSON.stringify(rawPlatformResults.flat())).map((d: any) => ({
          ...d,
          slug: d.slug || getNorm(d.name)
        }));
      }

      if (!q) {
        if (lang === "ko") {
          const itemsToTranslate = results.slice(0, 100); // 100 ensures coverage across all platforms
          const titles = itemsToTranslate.map(deal => deal.name);
          const translatedTitles = await translateBulkToKorean(titles);
          itemsToTranslate.forEach((deal, idx) => {
            if (translatedTitles[idx]) {
              deal.name = translatedTitles[idx];
            }
          });
        } else if (lang === "en") {
          const itemsToTranslate = results.slice(0, 100);
          const titles = itemsToTranslate.map(deal => deal.name);
          const translatedTitles = await translateBulkToEnglish(titles);
          itemsToTranslate.forEach((deal, idx) => {
            if (translatedTitles[idx]) {
              deal.name = translatedTitles[idx];
            }
          });
        }
      }
      
      enforceCleanPrices(results);
      // console.log(`Sending ${results.length} results for q: ${q}, platform: ${platform}, page: ${page}`);
      res.setHeader("Cache-Control", "public, s-maxage=14400, max-age=3600");
      res.json(results);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: "Failed to fetch deals", message: error instanceof Error ? error.message : String(error) });
    }
  });

  // Final API catch-all to prevent HTML 404s for API requests in case of mismatches
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "Endpoint not found", path: req.path });
  });

  // API: Scrape Metadata for Fallback Links (PSN, Nintendo)
  app.get("/api/metadata", actionLimiter, async (req, res) => {
    res.setHeader("Cache-Control", "public, s-maxage=86400, max-age=86400");
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    // SSRF Domain Allowlist Protection
    const allowedDomains = ["store.playstation.com", "store.steampowered.com", "store.epicgames.com", "store.ubisoft.com", "www.meta.com"];
    try {
      const parsedUrl = new URL(url);
      const isAllowed = allowedDomains.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith("." + domain));
      if (!isAllowed) {
        return res.status(403).json({ error: "Access to the requested unified domain is forbidden. Only verified platforms allowed." });
      }
    } catch {
       return res.status(400).json({ error: "Invalid URL structure provided." });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        timeout: 8000
      });
      const $ = cheerio.load(response.data);

      // Basic metadata extraction
      const title = $("meta[property='og:title']").attr("content") || $("title").text();
      const image = $("meta[property='og:image']").attr("content") || "";
      const description = $("meta[property='og:description']").attr("content") || "";
      
      let price = "Check Store";
      if (url.includes("playstation.com")) {
        price = $(".psw-t-title-m").first().text() || "Check Store";
      }
      
      let finalTitle = cleanDisplayTitle(title.replace(" | PlayStation", "").replace(" | Nintendo", "").replace(" - Epic Games Store", ""));
      const langPreference = req.query.lang as string || "en";
      if (langPreference === 'ko') {
          finalTitle = await translateToKorean(finalTitle);
      }

      const resultObj = {
        title: finalTitle,
        image,
        description,
        price_formatted: price,
        url,
        platform: url.includes("playstation") ? "playstation" : url.includes("epicgames") ? "epic" : url.includes("steam") ? "steam" : "other"
      };
      
      const tmpArr = [{ price: resultObj.price_formatted }];
      enforceCleanPrices(tmpArr);
      resultObj.price_formatted = tmpArr[0].price;

      res.json(resultObj);
    } catch (error) {
      console.error("Error scraping metadata:", error);
      res.status(500).json({ error: "Failed to fetch metadata" });
    }
  });

  // Email Alert Endpoint
  app.post("/api/alerts/send", actionLimiter, async (req, res) => {
    try {
      const { email, items, lang } = req.body;
      if (!email || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing email or dropped items" });
      }
      
      const isKo = lang === 'ko';
      
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey || apiKey === "") {
        console.warn("Attempted to send price alert but RESEND_API_KEY is not configured.");
        return res.status(503).json({ error: "Email configuration missing." });
      }

      const subject = isKo 
        ? `⚠️ 가격 하락 알림: 위시리스트 게임 ${items.length}개가 할인 중입니다!` 
        : `⚠️ Price Drop Alert: ${items.length} games on sale!`;
      
      const subtitle = isKo ? "위시리스트 가격 알림" : "Price Alert Triggered";
      const viewDealText = isKo ? "할인 확인하기" : "View Deal";
      const openAppText = isKo ? "Dealirious 앱 열기" : "Open Dealirious";
      const noticeText = isKo 
        ? `시스템 알림: Dealirious 터미널에서 가격 알림이 활성화되어 이 전송을 받으셨습니다.<br/>`
        : `SYSTEM NOTICE: You're receiving this transmission because Price Alerts are enabled in your <strong>Dealirious</strong> terminal.<br/>`;
      const unsubscribeText = isKo ? "여기에서 구독 취소" : "Click here to unsubscribe";

      let html = `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050507; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #0d0d10; border-radius: 16px; overflow: hidden; margin: 0 auto; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                <tr>
                  <td style="padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); background: linear-gradient(to bottom, rgba(6,182,212,0.1), transparent);">
                    <h1 style="color: #ffffff; font-size: 32px; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; font-style: italic;">Deal<span style="color: #06b6d4;">irious</span></h1>
                    <p style="color: #a1a1aa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 16px 0 0 0;">${subtitle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
      `;
      
      const translatedItems = await Promise.all(items.map(async (item: any) => {
        if (isKo && item.name) {
          try {
            const translatedName = await translateToKorean(item.name);
            return { ...item, name: translatedName };
          } catch (e) {
            return item;
          }
        }
        return item;
      }));

      translatedItems.forEach((item: any) => {
        let platformDisplay = 'OTHER';
        if (item.platform === 'steam') platformDisplay = 'STEAM';
        if (item.platform === 'playstation') platformDisplay = 'PLAYSTATION';
        if (item.platform === 'epic') platformDisplay = 'EPIC GAMES';
        if (item.platform === 'ubisoft') platformDisplay = 'UBISOFT';
        if (item.platform === 'quest') platformDisplay = 'META QUEST';

        html += `
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 25px; overflow: hidden;">
                      ${item.image ? `
                      <tr>
                        <td>
                          <img src="${item.image}" alt="${item.name}" width="600" style="width: 100%; max-width: 600px; height: auto; display: block; border-bottom: 1px solid rgba(255,255,255,0.05);" />
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 24px;">
                          <div style="margin-bottom: 12px;">
                            <span style="background-color: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.2); color: #22d3ee; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${platformDisplay}</span>
                          </div>
                          <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #ffffff; font-weight: 800; line-height: 1.3; text-transform: uppercase; letter-spacing: -0.5px;">${item.name}</h2>
                          <div style="margin: 0 0 24px 0;">
                            <span style="font-size: 28px; font-weight: 900; color: #22d3ee; font-family: monospace;">${item.current_price}</span>
                            ${item.old_price ? `<span style="text-decoration: line-through; color: #71717a; font-family: monospace; font-size: 16px; margin-left: 12px; font-weight: 500;">${item.old_price}</span>` : ''}
                          </div>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="background-color: #06b6d4; border-radius: 8px;">
                                <a href="${item.url}" style="display: block; padding: 16px; color: #000000; text-decoration: none; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">${viewDealText} &rarr;</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
        `;
      });
      
      html += `
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #09090b; padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                    <div style="margin-bottom: 24px;">
                      <a href="https://dealirious.com" style="display: inline-block; padding: 12px 24px; background-color: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.2); color: #22d3ee; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${openAppText}</a>
                    </div>
                    <p style="color: #71717a; font-size: 11px; margin: 0 0 16px 0; line-height: 1.6; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${noticeText}
                      <a href="mailto:unsubscribe@dealirious.com?subject=Unsubscribe" style="color: #a1a1aa; text-decoration: underline;">${unsubscribeText}</a>
                    </p>
                    <p style="color: #52525b; font-size: 10px; margin: 0 0 16px 0; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.5px;">
                      Dealirious<br/>
                      Seoul, Republic of Korea
                    </p>
                    <p style="color: #3f3f46; font-size: 9px; margin: 0; line-height: 1.4; letter-spacing: 0.5px; text-align: justify;">
                      <strong>RESTRICTION OF SERVICE:</strong> This email service is strictly intended for users outside the United States. US residents are prohibited from using this service.<br/><br/>
                      <strong>DISCLAIMER:</strong> Prices and availability are subject to change without notice. Dealirious is an aggregator and is not responsible for transactions on external storefronts. Dealirious may earn an affiliate commission on purchases made through links provided. Trademarks remain the property of their respective owners.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const resend = new Resend(apiKey);

      const { data, error } = await resend.emails.send({
        from: 'Dealirious <onboarding@resend.dev>',
        to: [email],
        subject: subject,
        html: html
      });

      if (error) {
        console.error("Resend API Error:", error);
        return res.status(500).json({ error: "Failed to dispatch email", details: error.message });
      }

      res.status(200).json({ success: true, message: "Email dispatched", data });
    } catch (e: any) {
      console.error("Failed to send price alert email:", e);
      res.status(500).json({ error: "Internal server error", details: e.message });
    }
  });

  // SEO endpoints
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Crawl-delay: 5
Sitemap: https://dealirious.com/sitemap.xml

User-agent: Bytespider
Disallow: /

User-agent: MUIDataBnb
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /`);
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://dealirious.com/</loc><priority>1.0</priority></url>
  <url><loc>https://dealirious.com/?platform=steam</loc><priority>0.8</priority></url>
  <url><loc>https://dealirious.com/?platform=playstation</loc><priority>0.8</priority></url>
  <url><loc>https://dealirious.com/?platform=epic</loc><priority>0.8</priority></url>
  <url><loc>https://dealirious.com/?platform=quest</loc><priority>0.8</priority></url>
</urlset>`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? { port: Math.floor(Math.random() * (30000 - 25000) + 25000) } : false
      },
      appType: "custom", // Change from SPA to custom to allow HTML manipulation below
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      try {
        const urlPath = req.path;
        if (urlPath.includes('.')) return next(); // Skip assets
        
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        
        const platformMatch = req.query.platform as string;
        if (platformMatch) {
            const capitalized = platformMatch.charAt(0).toUpperCase() + platformMatch.slice(1);
            template = template.replace(/<title>.*?<\/title>/, `<title>${capitalized} Game Deals | Dealirious</title>`);
            template = template.replace(/<meta name="description" content=".*?"(.*?)>/, `<meta name="description" content="Top ${capitalized} deals and historical lows on Dealirious."$1>`);
        } else if (req.query.q) {
            template = template.replace(/<title>.*?<\/title>/, `<title>Search ${req.query.q} Deals | Dealirious</title>`);
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        if (e instanceof Error) vite.ssrFixStacktrace(e);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { 
      index: false,
      maxAge: "1y",
      setHeaders: (res, path) => {
        if (path.endsWith(".html")) {
          // HTML shouldn't be cached aggressively
          res.setHeader("Cache-Control", "public, max-age=0");
        } else {
          // Everything else (Vite hashes) is immutable
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    })); // Prevent static index.html interception
    app.get("*", (req, res) => {
      let template = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
      
      const platformMatch = req.query.platform as string;
      if (platformMatch) {
          const capitalized = platformMatch.charAt(0).toUpperCase() + platformMatch.slice(1);
          template = template.replace(/<title>.*?<\/title>/, `<title>${capitalized} Game Deals | Dealirious</title>`);
          template = template.replace(/<meta name="description" content=".*?"(.*?)>/, `<meta name="description" content="Top ${capitalized} deals and historical lows on Dealirious."$1>`);
      } else if (req.query.q) {
          template = template.replace(/<title>.*?<\/title>/, `<title>Search ${req.query.q} Deals | Dealirious</title>`);
      }
      
      res.set('Content-Type', 'text/html').send(template);
    });
  }

  // Global Error Handler (Security: Prevent Stack Trace Leaks)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Cloud Run / Serverless Keep-Alive Timeouts
  server.keepAliveTimeout = 120 * 1000;
  server.headersTimeout = 120 * 1000;

  // Graceful Shutdown
  const shutdown = () => {
    console.log('Stopping gracefully...');
    server.close(() => {
      console.log('HTTP Server closed.');
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  server.on('error', (e: NodeJS.ErrnoException) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use, trying to close and retry...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT, "0.0.0.0", () => {
          console.log(`Server restarted on port ${PORT}`);
        });
      }, 1000);
    } else {
      console.error('Server error:', e);
    }
  });
}

startServer();
