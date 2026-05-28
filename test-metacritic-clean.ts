import { MetacriticService } from 'metacritic-ts';

function cleanTitle(title: string) {
  return title
    .replace(/\(.*\)/g, '') // Remove anything in parentheses
    .replace(/\[.*\]/g, '') // Remove anything in brackets
    .replace(/ - .*Edition/gi, '') // Remove "- Deluxe Edition" etc.
    .replace(/ Digital Deluxe Edition/gi, '')
    .replace(/ Ultimate Edition/gi, '')
    .replace(/ Premium Edition/gi, '')
    .replace(/ Standard Edition/gi, '')
    .replace(/ Complete Edition/gi, '')
    .replace(/ Game of the Year Edition/gi, '')
    .replace(/ GOTY Edition/gi, '')
    .replace(/™/g, '')
    .replace(/®/g, '')
    .trim();
}

async function testClean() {
  const mc = new MetacriticService();
  const titles = [
    "Dead Island 2 Ultimate Edition (중국어(간체자), 한국어, 영어, 일본어, 중국어(번체자))",
    "마블 스파이더맨 2 (중국어(간체자), 한국어, 영어, 중국어(번체자))",
    "사이버펑크 2077: 얼티밋 에디션 (PS5) (한국어, 영어)",
    "Hades (중국어(간체자), 한국어, 영어, 일본어)",
    "더 위쳐 3: 와일드 헌트 - 컴플리트 에디션 (중국어(간체자), 한국어, 영어, 중국어(번체자))"
  ];

  for (const t of titles) {
    const cleaned = cleanTitle(t);
    console.log(`Original: ${t}`);
    console.log(`Cleaned:  ${cleaned}`);
    try {
      const result = await mc.search(cleaned);
      if (result && result.length > 0) {
        console.log(`Score:    ${result[0].criticScore}`);
      } else {
        console.log(`Score:    Not found`);
      }
    } catch (e) {
      console.log(`Score:    Error`);
    }
    console.log("---");
  }
}
testClean();
