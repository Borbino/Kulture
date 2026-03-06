/**
 * K-Culture Signals Database — Kulture Platform v2.0
 *
 * ──────────────────────────────────────────────────────
 * [목적]
 *   "K-Culture"의 범위를 K-Pop/드라마에서 크게 확장합니다.
 *   전 세계(북미/남미/유럽/동남아/오세아니아)가 대한민국에
 *   관심을 갖는 모든 분야를 커버합니다.
 *
 * [카테고리 구조]
 *   엔터테인먼트: 음악, 드라마, 영화, 예능, 웹툰, 게임
 *   라이프스타일: 뷰티, 음식, 패션, 인테리어, 건강
 *   사회/문화: 언어, 교육, 역사, 전통, 종교, 스포츠
 *   경제/기술: IT, 반도체, 스타트업, 자동차, K-브랜드
 *   현대사회: 정치, 서울 도시문화, MZ세대, 인터넷 밈
 * ──────────────────────────────────────────────────────
 */

// ══════════════════════════════════════════════════════
// 카테고리별 신호어 (소문자 통일, 자동 감지용)
// ══════════════════════════════════════════════════════

export const K_CULTURE_CATEGORIES = {

  // ─────────────────────────────────
  // 🎵 K-POP & 음악
  // ─────────────────────────────────
  kpop: {
    label: 'K-Pop & 음악',
    globalInterest: 10,
    signals: [
      'k-pop', 'kpop', 'k pop', '케이팝', '케팝',
      'idol', '아이돌', 'comeback', '컴백', 'debut', '데뷔',
      'mv', 'music video', 'fancam', '직캠', 'fansite',
      'idol group', 'boy group', 'girl group',
      'melon chart', 'gaon chart', 'hanteo', 'circle chart',
      'billboard kpop', 'spotify kpop',
      // 아티스트 (현재 활동 + 레거시)
      'bts', 'bangtan', 'army', 'blackpink', 'blink',
      'aespa', 'newjeans', 'twice', 'ive', 'le sserafim',
      'seventeen', 'nct', 'nct dream', 'nct 127', 'wayv',
      'stray kids', 'skz', 'exo', 'shinee', 'bigbang',
      'got7', 'monsta x', 'astro', 'txt', 'enhypen',
      'treasure', 'ateez', 'the boyz', 'oneus', 'victon',
      'mamamoo', 'red velvet', 'f(x)', 'girls generation', 'snsd',
      'itzy', 'loona', 'gfriend', '(g)i-dle', 'kard',
      'taeyeon', 'boa', 'rain', 'psy', 'gangnam style',
      'hyuna', 'taeyang', 'gdragon', 'cl',
      'hybe', 'sm entertainment', 'yg entertainment', 'jyp entertainment',
      'starship', 'cube', 'woollim', 'mnh', 'pledis',
      'weverse', 'fab', 'universe app',
      'lightstick', 'photocard', '포토카드', 'album unboxing',
      'kpop merch', 'fan sign', '팬싸인회',
    ],
  },

  // ─────────────────────────────────
  // 📺 K-드라마 & K-무비
  // ─────────────────────────────────
  kdrama: {
    label: 'K-드라마 & K-무비',
    globalInterest: 9,
    signals: [
      'kdrama', 'k-drama', 'k drama', 'korean drama', '한국드라마', '드라마',
      'korean movie', 'k-movie', 'korean film', '한국영화',
      'netflix korea', 'disney plus korea', 'wavve', 'viki', 'viu',
      'squid game', 'parasite', '기생충', 'crash landing on you', '사랑의 불시착',
      'reply 1988', 'my mister', 'itaewon class', 'vincenzo',
      'mr. sunshine', 'kingdom', 'sweet home', 'all of us are dead',
      'business proposal', 'my name', 'hellbound', 'juvenile justice',
      'extraordinary attorney woo', '이상한 변호사 우영우',
      'move to heaven', 'twenty-five twenty-one',
      'the glory', '더 글로리', 'moving', 'mask girl',
      'celebrity', 'my demon', 'castaway diva',
      'cha eunwoo', 'kim soo hyun', 'song joong ki', 'lee min ho',
      'hwang dong hyuk', 'bong joon ho', 'park chan wook',
      'lee byung hun', 'gong yoo', 'park bo gum',
      'jun ji hyun', 'kim tae ri', 'han so hee', 'kim go eun',
      'kdrama ost', '드라마 ost', 'korean ost',
      'korean webtoon adaptation', '웹툰 원작',
    ],
  },

  // ─────────────────────────────────
  // 💄 K-뷰티 & 스킨케어
  // ─────────────────────────────────
  kbeauty: {
    label: 'K-뷰티 & 스킨케어',
    globalInterest: 8,
    signals: [
      'k-beauty', 'kbeauty', 'korean beauty', 'korean skincare',
      'korean makeup', 'korean cosmetics', '한국 화장품',
      '10 step skincare', 'glass skin', 'dewy skin', 'honey skin',
      'double cleansing', 'essence', 'ampoule', 'sheet mask',
      'snail cream', 'propolis', 'centella', 'niacinamide korea',
      'laneige', 'sulwhasoo', 'innisfree', 'cosrx', 'anua',
      'amorepacific', 'lg household', 'some by mi',
      'klairs', 'missha', 'etude house', 'nature republic',
      'peach slices', 'round lab', 'be plain',
      'gua sha korean', 'facial massage korean',
      'korean lip tint', 'cushion foundation', 'bb cream origin',
      'korean sunscreen', 'spf korean',
    ],
  },

  // ─────────────────────────────────
  // 🍜 K-푸드 & 음식 문화
  // ─────────────────────────────────
  kfood: {
    label: 'K-푸드 & 음식 문화',
    globalInterest: 8,
    signals: [
      'korean food', 'k-food', 'kfood', '한식', 'korean cuisine',
      'korean bbq', '삼겹살', 'bulgogi', '불고기', 'galbi', '갈비',
      'bibimbap', '비빔밥', 'kimchi', '김치', 'tteok', '떡',
      'ramyeon', '라면', 'buldak', '불닭', 'samyang',
      'mukbang', '먹방', 'eating show', 'asmr eating',
      'Korean street food', 'tteokbokki', '떡볶이', 'hotteok',
      'korean fried chicken', '치킨', 'korean corn dog', '핫도그',
      'soju', '소주', 'makgeolli', '막걸리', 'baekseju',
      'honey butter', 'buldak noodles', 'dasida',
      'maangchi', 'korean cooking', 'banchan', '반찬',
      'doenjang', '된장', 'gochujang', '고추장', 'sesame oil',
      'korean cafe', '카페', 'dalgona', 'kyeong bok gung cafe',
      'paris baguette', 'tous les jours', 'baskin robbins korea',
      'korean food tiktok', 'mukbang youtube',
    ],
  },

  // ─────────────────────────────────
  // 👗 K-패션 & 스트릿 패션
  // ─────────────────────────────────
  kfashion: {
    label: 'K-패션 & 스트릿 패션',
    globalInterest: 7,
    signals: [
      'korean fashion', 'k-fashion', 'kfashion', '한국 패션',
      'seoul fashion week', '서울 패션위크',
      'korean street style', 'hongdae fashion', 'sinchon style',
      'hanbok', '한복', 'modern hanbok', '생활한복',
      'oversized fashion korea', 'kpop fashion', 'idol fashion',
      'y2k korea', 'korean vintage', 'korean minimal fashion',
      'musinsa', '무신사', 'ably', 'kakao style', '29cm',
      'stylenanda', '스타일난다', 'gentle monster', '젠틀몬스터',
      'kirsh', '키르시', 'ader error', 'andersson bell',
      'wooyoungmi', 'blindness', 'pushbutton',
      'nike korea limited', 'new balance 1906 korea',
      'uniqlo korea collab', 'korean minimalist brand',
    ],
  },

  // ─────────────────────────────────
  // 📚 K-웹툰 & K-문학
  // ─────────────────────────────────
  kwebtoon: {
    label: 'K-웹툰 & K-문학',
    globalInterest: 7,
    signals: [
      'webtoon', '웹툰', 'manhwa', '만화', 'korean comic',
      'naver webtoon', 'kakao webtoon', 'lezhin', '레진코믹스',
      'tapas', 'canvas webtoon', 'line webtoon',
      'solo leveling', '나 혼자만 레벨업', 'tower of god', '신의 탑',
      'the beginning after the end', 'omniscient reader',
      '전지적 독자 시점', 'true beauty', '여신강림',
      'bastian', 'tales of demons and gods',
      'korean novel', 'korean literature', '한강 소설',
      'han kang', '한강', 'the vegetarian', '채식주의자',
      'human acts', '소년이 온다', 'we do not part',
      'cho nam joo',
      'korean manhwa recommendation',
    ],
  },

  // ─────────────────────────────────
  // 🎮 K-게임 & e스포츠
  // ─────────────────────────────────
  kgaming: {
    label: 'K-게임 & e스포츠',
    globalInterest: 7,
    signals: [
      'korean esports', 'lck', 'league of legends korea',
      'faker', '페이커', 't1', 'gen.g', 'dk', 'kia tigers esports',
      '리그 오브 레전드', 'league of legends kr',
      'nexon', 'ncsoft', 'krafton', 'smilegate',
      'lineage', '리니지', 'lost ark', '로스트아크',
      'black desert', '검은사막', 'maple story', '메이플스토리',
      'valorant korea', 'overwatch korea', 'esports tournament korea',
      'starcraft korea', 'broodwar', 'afreeca tv',
      'korean pro gamer', 'pc bang', 'pc방',
      'gstar', '지스타', 'blizzcon korea',
    ],
  },

  // ─────────────────────────────────
  // 🏃 K-스포츠
  // ─────────────────────────────────
  ksports: {
    label: 'K-스포츠',
    globalInterest: 6,
    signals: [
      'korean sports', 'k league', '케이리그', 'korean football',
      'korea national team', '태극전사', 'world cup korea',
      'son heung min', '손흥민', 'hwang hee chan', '황희찬',
      'kim min jae', '김민재', 'lee kang in', '이강인',
      'korean baseball', 'kbo', '한국야구', 'samsung lions',
      'kt wiz', 'lg twins', 'doosan bears',
      'korean archery', 'olympic korea', '올림픽 한국',
      'taekwondo', '태권도', 'hapkido', '합기도',
      'ssireum', '씨름', 'koryo saram sport',
      'korean golf', 'lpga korea', 'park inbee', 'ko jinee',
    ],
  },

  // ─────────────────────────────────
  // 🏛️ K-역사 & 문화유산
  // ─────────────────────────────────
  kheritage: {
    label: 'K-역사 & 문화유산',
    globalInterest: 5,
    signals: [
      'korean history', '한국 역사', 'joseon dynasty', '조선',
      'korean empire', 'goryeo', '고려', 'silla', '신라',
      'korean war', '6.25 전쟁', 'dmz', '비무장지대',
      'gyeongbokgung', '경복궁', 'changdeokgung', '창덕궁',
      'namsan tower', '남산타워', 'bukchon hanok',
      'hanok village', '한옥마을', 'jeonju', '전주',
      'mudang', 'shaman korea', '무당', '무속',
      'buddhism korea', '불교 한국', 'temple stay', '템플스테이',
      'confucianism korea', 'gwanghwamun', '광화문',
      'korean traditional music', '국악', 'gayageum', '가야금',
      'jangdan', '장단', 'farmer\'s dance', '농악',
      'korean ceramics', '도자기', 'hanji', '한지',
      'UNESCO korea', 'korean intangible heritage',
    ],
  },

  // ─────────────────────────────────
  // 🌐 K-언어 학습
  // ─────────────────────────────────
  klanguage: {
    label: 'K-언어 학습',
    globalInterest: 8,
    signals: [
      'learn korean', 'korean language', '한국어', 'hangul', '한글',
      'topik', '토픽', 'eps-topik', 'klpt',
      'korean for beginners', 'korean grammar',
      'ttmik', 'talk to me in korean', 'koreanclass101',
      'duolingo korean', 'pimsleur korean',
      'korean alphabet', 'korean pronunciation',
      'seoul dialect', 'busan dialect', '서울말', '부산 사투리',
      'formal korean', 'informal korean', 'honorific',
      'korean slang', 'aegyo', '애교', 'hangul day',
      'korean internet slang', 'ㅋㅋ', 'ㅠㅠ', 'ㄷㄷ',
    ],
  },

  // ─────────────────────────────────
  // 💻 K-테크 & 산업
  // ─────────────────────────────────
  ktech: {
    label: 'K-테크 & 산업',
    globalInterest: 6,
    signals: [
      'samsung', '삼성', 'lg', 'sk hynix', 'hyundai', '현대',
      'kia', '기아', 'posco', '포스코', 'lotte', '롯데',
      'kakao', '카카오', 'naver', '네이버', 'coupang', '쿠팡',
      'krafton', 'nc soft', 'kakao games',
      'samsung galaxy', 'samsung chip', 'hbm memory',
      'kddi korea semiconductor', 'korean battery',
      'korean solar panel', 'korean ev',
      'korean startup', '스타트업', 'k-unicorn',
      'toss', '토스', 'kakaopay', '카카오페이', 'naver pay',
      'korean ai', 'hyperclova', 'clova', 'naver clova',
      'olleh kt', 'sk telecom', 'lg uplus',
      'kimchi premium crypto', 'upbit', '업비트', 'bithumb',
    ],
  },

  // ─────────────────────────────────
  // ✈️ 한국 여행 & 서울 라이프
  // ─────────────────────────────────
  ktravel: {
    label: '한국 여행 & 서울 라이프',
    globalInterest: 7,
    signals: [
      'visit korea', 'korea travel', '한국 여행', 'seoul travel',
      'seoul guide', 'busan travel', '부산', 'jeju island', '제주',
      'gyeongju travel', '경주', 'incheon', '인천',
      'hongdae', '홍대', 'itaewon', '이태원', 'sinchon', '신촌',
      'insadong', '인사동', 'bukchon', '북촌', 'myeongdong', '명동',
      'dongdaemun', '동대문', 'gangnam', '강남',
      'korea food tour', 'gwangjang market', '광장시장',
      'korean convenience store', 'gs25', 'cu', 'seven eleven korea',
      'korea aesthetic', 'seoul aesthetic', 'korea vlog',
      'korea winter', 'korea cherry blossom', '벚꽃',
      'korea autumn', 'korea rainy season',
      'korean air', 'asiana', 'jeju air',
      'korea entry', 'korea visa', 'k-eta',
    ],
  },

  // ─────────────────────────────────
  // 🏥 K-wellness & 건강
  // ─────────────────────────────────
  kwellness: {
    label: 'K-웰니스 & 건강',
    globalInterest: 5,
    signals: [
      'korean medicine', '한의학', 'traditional korean medicine',
      'ginseng', '홍삼', 'red ginseng', 'korea ginseng corp',
      'korean sauna', 'jjimjilbang', '찜질방', 'saunas korea',
      'korean diet', '한국 다이어트', 'intermittent fasting korea',
      'korean wellness', 'k-wellness', 'noori health',
      'korean yoga', 'korean meditation', 'temple stay health',
      'korean acupuncture', '침술', 'cupping therapy korea',
      'korean psychiatry', 'k-healing', 'korean spa',
    ],
  },

  // ─────────────────────────────────
  // 🌏 글로벌 한류 현상 (한류 자체를 다루는 콘텐츠)
  // ─────────────────────────────────
  hallyu: {
    label: '글로벌 한류 현상',
    globalInterest: 9,
    signals: [
      'hallyu', '한류', 'korean wave', 'soft power korea',
      'korea global', 'korean culture worldwide',
      'korean fans', 'kfan', 'international kpop fan',
      'kpop in latin america', 'kpop europe', 'kpop usa',
      'kpop france', 'kpop brazil', 'kpop mexico',
      'korean content', 'korean entertainment industry',
      'korean export', 'hallyu economic impact',
      'korea brand', 'cool korea', 'image korea',
      'korean diaspora', 'korean american', 'korean british',
      'koreatown', '코리아타운', 'korean community abroad',
    ],
  },

  // ─────────────────────────────────
  // 🏙️ 현대 한국 사회 & MZ세대
  // ─────────────────────────────────
  ksociety: {
    label: '현대 한국 사회 & MZ세대',
    globalInterest: 6,
    signals: [
      'mz generation korea', 'mz세대', 'korean millennials', 'korean gen z',
      'korean work culture', '직장 문화', 'hierarchy korea',
      'korean education', '수능', 'suneung', 'hagwon', '학원',
      'korean apartment', '부동산', 'jeonse', '전세', 'monthly rent',
      'korean cafe culture', 'cafe hopping seoul',
      'korean internet culture', 'pann', 'nate pann', '더쿠', 'theqoo',
      'twitter korea', 'instagram korea', 'tiktok korea', 'youtube korea',
      'korean meme', '짤', '밈', 'korea trending tiktok',
      'korean couple culture', '소개팅', 'blind date korea',
      'ppali ppali', '빨리빨리', 'korean work ethic',
      'korean housing', 'one room korea', 'jikbang',
      'korean movie theater', 'cgv', 'lotte cinema', 'megabox',
    ],
  },
};

// ══════════════════════════════════════════════════════
// 통합 신호어 플랫 리스트 (기존 코드와 호환)
// ══════════════════════════════════════════════════════
export const K_CULTURE_SIGNALS_FULL = Object.values(K_CULTURE_CATEGORIES)
  .flatMap(cat => cat.signals);

// 카테고리별 빠른 분류 함수
export function categorizeContent(text) {
  const lower = text.toLowerCase();
  const matches = [];

  for (const [key, category] of Object.entries(K_CULTURE_CATEGORIES)) {
    const matchCount = category.signals.filter(s => lower.includes(s)).length;
    if (matchCount > 0) {
      matches.push({ category: key, label: category.label, matchCount, globalInterest: category.globalInterest });
    }
  }

  return matches.sort((a, b) => b.matchCount - a.matchCount);
}

// K-Culture 여부 판별 (기존 isKCultureRelated 대체)
export function isKCultureContent(text) {
  const lower = text.toLowerCase();
  return K_CULTURE_SIGNALS_FULL.some(signal => lower.includes(signal));
}

// 지역별 관심 카테고리 맵핑
export const REGION_INTERESTS = {
  northAmerica: ['kpop', 'kdrama', 'kfood', 'klanguage', 'kwebtoon', 'kgaming'],
  southAmerica: ['kpop', 'kdrama', 'klanguage', 'kfashion', 'kbeauty'],
  europe:       ['kdrama', 'kbeauty', 'kfood', 'kfashion', 'kheritage', 'klanguage'],
  japan:        ['kpop', 'kdrama', 'kbeauty', 'kfood', 'kfashion'],
  southeast_asia: ['kdrama', 'kpop', 'kbeauty', 'kfood', 'ktech'],
  china:        ['kdrama', 'kpop', 'kbeauty', 'kheritage', 'kfashion'],
  oceania:      ['kpop', 'kdrama', 'kfood', 'klanguage', 'ktravel'],
  middleEast:   ['kdrama', 'kbeauty', 'kfood', 'kpop'],
};

export default {
  K_CULTURE_CATEGORIES,
  K_CULTURE_SIGNALS_FULL,
  REGION_INTERESTS,
  categorizeContent,
  isKCultureContent,
};
