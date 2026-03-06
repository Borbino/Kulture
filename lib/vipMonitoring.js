import client from './sanityClient.js'
import { logger } from './logger.js'
import { TwitterApi } from 'twitter-api-v2'/**
 * [설명] VIP 인물 및 트렌드 자동 모니터링 시스템
 * [일시] 2025-11-19 15:00 (KST)
 * [목적] 주요 K-Culture 인물과 실시간 트렌드 자동 추적
 */

// ========== VIP 인물 데이터베이스 (확장판) ==========

export const VIP_DATABASE = {
  // Tier 1: 글로벌 슈퍼스타 (30분마다 모니터링)
  tier1: [
    // === K-POP 아이돌 그룹 ===
    {
      id: 'bts',
      name: 'BTS',
      koreanName: '방탄소년단',
      members: ['RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jungkook'],
      keywords: ['BTS', '방탄소년단', 'Bangtan', 'ARMY', 'Yet To Come'],
      socialMedia: {
        twitter: 'https://twitter.com/BTS_twt',
        instagram: 'https://www.instagram.com/bts.bighitofficial/',
        youtube: 'https://www.youtube.com/@BTS',
        weverse: 'https://weverse.io/bts',
      },
      priority: 10,
      frequency: 'realtime',
      category: 'K-Pop',
    },
    {
      id: 'bigbang',
      name: 'BIGBANG',
      koreanName: '빅뱅',
      members: ['G-Dragon', 'Taeyang', 'TOP', 'Daesung'],
      keywords: ['BIGBANG', '빅뱅', 'G-Dragon', 'GD', 'Taeyang', 'Still Life', 'VIP'],
      socialMedia: {
        instagram: 'https://www.instagram.com/xxxibgdrgn/',
        youtube: 'https://www.youtube.com/@BIGBANG',
      },
      priority: 10,
      frequency: 'realtime',
      category: 'K-Pop',
    },
    {
      id: 'blackpink',
      name: 'BLACKPINK',
      koreanName: '블랙핑크',
      members: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'],
      keywords: ['BLACKPINK', '블랙핑크', 'Jisoo', 'Jennie', 'Rosé', 'Lisa', 'BLINK', 'Born Pink'],
      socialMedia: {
        twitter: 'https://twitter.com/BLACKPINK',
        instagram: 'https://www.instagram.com/blackpinkofficial/',
        youtube: 'https://www.youtube.com/@BLACKPINK',
      },
      priority: 10,
      frequency: 'realtime',
      category: 'K-Pop',
    },
    {
      id: 'aespa',
      name: 'aespa',
      koreanName: '에스파',
      members: ['Karina', 'Giselle', 'Winter', 'Ningning'],
      keywords: ['aespa', '에스파', 'Karina', 'Giselle', 'Winter', 'Ningning', 'MY', 'Supernova'],
      socialMedia: {
        twitter: 'https://twitter.com/aespa_official',
        instagram: 'https://www.instagram.com/aespa_official/',
        youtube: 'https://www.youtube.com/@aespa',
      },
      priority: 10,
      frequency: 'realtime',
      category: 'K-Pop',
    },
    {
      id: 'seventeen',
      name: 'SEVENTEEN',
      koreanName: '세븐틴',
      members: [
        'S.Coups',
        'Jeonghan',
        'Joshua',
        'Jun',
        'Hoshi',
        'Wonwoo',
        'Woozi',
        'DK',
        'Mingyu',
        'The8',
        'Seungkwan',
        'Vernon',
        'Dino',
      ],
      keywords: ['SEVENTEEN', '세븐틴', 'Carat', 'SVT', 'God of Music'],
      socialMedia: {
        twitter: 'https://twitter.com/pledis_17',
        instagram: 'https://www.instagram.com/saythename_17/',
        youtube: 'https://www.youtube.com/@SEVENTEEN',
      },
      priority: 10,
      frequency: 'realtime',
      category: 'K-Pop',
    },

    // === K-POP 솔로 아티스트 ===
    {
      id: 'psy',
      name: 'PSY',
      koreanName: '싸이',
      keywords: ['PSY', '싸이', 'Gangnam Style', 'That That', 'P NATION', 'Gentleman'],
      socialMedia: {
        twitter: 'https://twitter.com/psy_oppa',
        instagram: 'https://www.instagram.com/42psy42/',
        youtube: 'https://www.youtube.com/@officialpsy',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Pop',
    },
    {
      id: 'iu',
      name: 'IU',
      koreanName: '아이유',
      keywords: ['IU', '아이유', 'Uaena', 'Love Wins All', 'Eight'],
      socialMedia: {
        instagram: 'https://www.instagram.com/dlwlrma/',
        youtube: 'https://www.youtube.com/@iuofficial',
      },
      priority: 10,
      frequency: 'realtime',
      category: 'K-Pop',
    },

    // === K-DRAMA 배우 ===
    {
      id: 'song-joong-ki',
      name: 'Song Joong-ki',
      koreanName: '송중기',
      keywords: ['송중기', 'Song Joong-ki', 'Vincenzo', 'Descendants of the Sun', 'Reborn Rich'],
      socialMedia: {
        instagram: 'https://www.instagram.com/hi_songjoongki/',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Drama',
    },
    {
      id: 'lee-byung-hun',
      name: 'Lee Byung-hun',
      koreanName: '이병헌',
      keywords: ['이병헌', 'Lee Byung-hun', 'Squid Game', 'G.I. Joe', 'Inside Men'],
      socialMedia: {
        instagram: 'https://www.instagram.com/byunghun0712/',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Drama',
    },
    {
      id: 'park-seo-joon',
      name: 'Park Seo-joon',
      koreanName: '박서준',
      keywords: ['박서준', 'Park Seo-joon', 'Itaewon Class', 'Parasite', 'The Marvels'],
      socialMedia: {
        instagram: 'https://www.instagram.com/bn_sj2013/',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Drama',
    },

    // === 영화 감독 ===
    {
      id: 'bong-joon-ho',
      name: 'Bong Joon-ho',
      koreanName: '봉준호',
      keywords: ['봉준호', 'Bong Joon-ho', 'Parasite', 'Oscar', 'Snowpiercer', 'Okja'],
      socialMedia: {},
      priority: 9,
      frequency: 'realtime',
      category: 'K-Movie',
    },
    {
      id: 'park-chan-wook',
      name: 'Park Chan-wook',
      koreanName: '박찬욱',
      keywords: ['박찬욱', 'Park Chan-wook', 'Oldboy', 'The Handmaiden', 'Decision to Leave'],
      socialMedia: {},
      priority: 9,
      frequency: 'realtime',
      category: 'K-Movie',
    },

    // === 스포츠 선수 ===
    {
      id: 'son-heung-min',
      name: 'Son Heung-min',
      koreanName: '손흥민',
      keywords: ['손흥민', 'Son Heung-min', 'Sonny', 'Tottenham', 'THFC', 'Premier League'],
      socialMedia: {
        instagram: 'https://www.instagram.com/hm_son7/',
        youtube: 'https://www.youtube.com/@SonTube',
      },
      priority: 10,
      frequency: 'realtime',
      category: 'K-Sports',
    },
    {
      id: 'kim-yuna',
      name: 'Kim Yuna',
      koreanName: '김연아',
      keywords: ['김연아', 'Kim Yuna', 'Figure Skating', 'Queen Yuna', 'Olympic Gold'],
      socialMedia: {
        instagram: 'https://www.instagram.com/yuna_kim/',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Sports',
    },

    // === 글로벌 인플루언서 ===
    {
      id: 'rose-blackpink',
      name: 'Rosé',
      koreanName: '로제',
      keywords: ['Rosé', '로제', 'BLACKPINK', 'APT', 'Bruno Mars', 'On The Ground'],
      socialMedia: {
        instagram: 'https://www.instagram.com/roses_are_rosie/',
        youtube: 'https://www.youtube.com/@ROSES_are_ROSIE',
        tiktok: 'https://www.tiktok.com/@roses_are_rosie',
      },
      priority: 10,
      frequency: 'realtime',
      category: 'K-Pop',
    },

    // === K-먹방 유튜버 & 인플루언서 ===
    {
      id: 'tzuyang',
      name: 'Tzuyang',
      koreanName: '쯔양',
      keywords: ['쯔양', 'Tzuyang', '먹방', 'Mukbang', 'Korean Food', '대식가'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@Tzuyang',
        instagram: 'https://www.instagram.com/tzuyang.mukbang/',
        tiktok: 'https://www.tiktok.com/@tzuyang_2',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Mukbang',
    },
    {
      id: 'boki',
      name: 'Boki',
      koreanName: '보키',
      keywords: ['보키', 'Boki', 'Mukbang', 'ASMR', 'Korean Mukbang'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@Boki',
        instagram: 'https://www.instagram.com/moon_boki/',
        tiktok: 'https://www.tiktok.com/@moon_boki',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Mukbang',
    },
    {
      id: 'hunnomnom',
      name: 'Hunnomnom',
      koreanName: '흔놈놈',
      keywords: ['흔놈놈', 'Hunnomnom', 'Mukbang', 'Korean Desserts', 'Food Review'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@hunnomnom',
        instagram: 'https://www.instagram.com/hunnomnom/',
        tiktok: 'https://www.tiktok.com/@hunnomnom',
      },
      priority: 8,
      frequency: 'realtime',
      category: 'K-Mukbang',
    },
    {
      id: 'hamzy',
      name: 'Hamzy',
      koreanName: '햄지',
      keywords: ['햄지', 'Hamzy', 'Mukbang', 'Real Sound', 'Korean Food'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@Hamzy',
        instagram: 'https://www.instagram.com/hamzzi/',
        tiktok: 'https://www.tiktok.com/@hamzzi',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Mukbang',
    },

    // === K-Beauty 인플루언서 & 전문가 ===
    {
      id: 'pony',
      name: 'PONY',
      koreanName: '포니',
      keywords: ['포니', 'PONY', 'K-Beauty', 'Makeup', 'Korean Makeup', 'Beauty Tutorial'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@PONY_Makeup',
        instagram: 'https://www.instagram.com/ponysmakeup/',
        tiktok: 'https://www.tiktok.com/@ponysmakeup',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Beauty',
    },
    {
      id: 'ssinnim',
      name: 'Ssinnim',
      koreanName: '씬님',
      keywords: ['씬님', 'Ssinnim', 'K-Beauty', 'Skincare', 'Korean Beauty'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@Ssinnim',
        instagram: 'https://www.instagram.com/ssinnim/',
        tiktok: 'https://www.tiktok.com/@ssinnim_',
      },
      priority: 8,
      frequency: 'realtime',
      category: 'K-Beauty',
    },
    {
      id: 'edward-avila',
      name: 'Edward Avila',
      koreanName: '에드워드 아빌라',
      keywords: ['Edward Avila', 'K-Beauty', 'Korean Makeup', 'Beauty Vlogger'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@EdwardAvila',
        instagram: 'https://www.instagram.com/edwardavila/',
        tiktok: 'https://www.tiktok.com/@edwardavila',
      },
      priority: 8,
      frequency: 'realtime',
      category: 'K-Beauty',
    },
    {
      id: 'liah-yoo',
      name: 'Liah Yoo',
      koreanName: '유리아',
      keywords: ['Liah Yoo', 'K-Beauty', 'Skincare', 'KraveBeauty', 'Korean Skincare'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@LiahYoo',
        instagram: 'https://www.instagram.com/liahyoo/',
        tiktok: 'https://www.tiktok.com/@liahyoo',
      },
      priority: 8,
      frequency: 'realtime',
      category: 'K-Beauty',
    },

    // === 글로벌 K-Culture 인플루언서 (비한국인) ===
    {
      id: 'korean-englishman',
      name: 'Korean Englishman',
      koreanName: '영국남자',
      keywords: ['Korean Englishman', '영국남자', 'Jolly', 'K-Food', 'Korean Culture'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@KoreanEnglishman',
        instagram: 'https://www.instagram.com/koreanenglishman/',
        tiktok: 'https://www.tiktok.com/@koreanenglishman',
      },
      priority: 9,
      frequency: 'realtime',
      category: 'K-Culture',
    },
    {
      id: 'dave-disci',
      name: 'Dave DiSci (MRXD)',
      koreanName: '데이브',
      keywords: ['Dave DiSci', 'MRXD', 'K-Pop Reaction', 'Korean Culture'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@MRXDofficial',
        instagram: 'https://www.instagram.com/mrxdofficial/',
        tiktok: 'https://www.tiktok.com/@mrxdofficial',
      },
      priority: 7,
      frequency: 'realtime',
      category: 'K-Culture',
    },
  ],

  // Tier 2: 주요 스타 (2시간마다 모니터링)
  tier2: [
    // === 4세대 아이돌 ===
    {
      id: 'newjeans',
      name: 'NewJeans',
      koreanName: '뉴진스',
      members: ['Minji', 'Hanni', 'Danielle', 'Haerin', 'Hyein'],
      keywords: ['NewJeans', '뉴진스', 'OMG', 'Ditto', 'Bunnies', 'Super Shy'],
      socialMedia: {
        instagram: 'https://www.instagram.com/newjeans_official/',
        youtube: 'https://www.youtube.com/@NewJeans_official',
      },
      priority: 9,
      frequency: 'hourly',
      category: 'K-Pop',
    },
    {
      id: 'straykids',
      name: 'Stray Kids',
      koreanName: '스트레이 키즈',
      keywords: ['Stray Kids', '스트레이키즈', 'SKZ', 'STAY', "God's Menu", 'MANIAC'],
      socialMedia: {
        twitter: 'https://twitter.com/Stray_Kids',
        instagram: 'https://www.instagram.com/realstraykids/',
        youtube: 'https://www.youtube.com/@StrayKids',
      },
      priority: 9,
      frequency: 'hourly',
      category: 'K-Pop',
    },
    {
      id: 'twice',
      name: 'TWICE',
      koreanName: '트와이스',
      keywords: ['TWICE', '트와이스', 'ONCE', 'Feel Special', "I Can't Stop Me"],
      socialMedia: {
        twitter: 'https://twitter.com/JYPETWICE',
        instagram: 'https://www.instagram.com/twicetagram/',
        youtube: 'https://www.youtube.com/@TWICE',
      },
      priority: 9,
      frequency: 'hourly',
      category: 'K-Pop',
    },
    {
      id: 'itzy',
      name: 'ITZY',
      koreanName: '있지',
      members: ['Yeji', 'Lia', 'Ryujin', 'Chaeryeong', 'Yuna'],
      keywords: ['ITZY', '있지', 'MIDZY', 'Dalla Dalla', 'Wannabe'],
      socialMedia: {
        twitter: 'https://twitter.com/ITZYofficial',
        instagram: 'https://www.instagram.com/itzy.all.in.us/',
        youtube: 'https://www.youtube.com/@ITZY',
      },
      priority: 8,
      frequency: 'hourly',
      category: 'K-Pop',
    },
    {
      id: 'lesserafim',
      name: 'LE SSERAFIM',
      koreanName: '르세라핌',
      members: ['Sakura', 'Kim Chaewon', 'Huh Yunjin', 'Kazuha', 'Hong Eunchae'],
      keywords: ['LE SSERAFIM', '르세라핌', 'FEARLESS', 'ANTIFRAGILE', 'FEARNOT'],
      socialMedia: {
        twitter: 'https://twitter.com/le_sserafim',
        instagram: 'https://www.instagram.com/le_sserafim/',
        youtube: 'https://www.youtube.com/@le_sserafim',
      },
      priority: 9,
      frequency: 'hourly',
      category: 'K-Pop',
    },

    // === 배우 ===
    {
      id: 'song-hye-kyo',
      name: 'Song Hye-kyo',
      koreanName: '송혜교',
      keywords: ['송혜교', 'Song Hye-kyo', 'Descendants of the Sun', 'The Glory', 'Full House'],
      socialMedia: {
        instagram: 'https://www.instagram.com/kyo1122/',
      },
      priority: 8,
      frequency: 'hourly',
      category: 'K-Drama',
    },
    {
      id: 'jun-ji-hyun',
      name: 'Jun Ji-hyun',
      koreanName: '전지현',
      keywords: ['전지현', 'Jun Ji-hyun', 'My Sassy Girl', 'Jirisan', 'Kingdom'],
      socialMedia: {},
      priority: 8,
      frequency: 'hourly',
      category: 'K-Drama',
    },
    {
      id: 'lee-jung-jae',
      name: 'Lee Jung-jae',
      koreanName: '이정재',
      keywords: ['이정재', 'Lee Jung-jae', 'Squid Game', 'Emmy', 'New World'],
      socialMedia: {
        instagram: 'https://www.instagram.com/from_jjlee/',
      },
      priority: 8,
      frequency: 'hourly',
      category: 'K-Drama',
    },

    // === 스포츠 선수 ===
    {
      id: 'kim-min-jae',
      name: 'Kim Min-jae',
      koreanName: '김민재',
      keywords: ['김민재', 'Kim Min-jae', 'Bayern Munich', 'Monster', 'Napoli'],
      socialMedia: {
        instagram: 'https://www.instagram.com/zzbig3/',
      },
      priority: 8,
      frequency: 'hourly',
      category: 'K-Sports',
    },
    {
      id: 'lee-kang-in',
      name: 'Lee Kang-in',
      koreanName: '이강인',
      keywords: ['이강인', 'Lee Kang-in', 'PSG', 'Parisien', 'Mallorca'],
      socialMedia: {
        instagram: 'https://www.instagram.com/kangin_10/',
      },
      priority: 8,
      frequency: 'hourly',
      category: 'K-Sports',
    },
    {
      id: 'hwang-hee-chan',
      name: 'Hwang Hee-chan',
      koreanName: '황희찬',
      keywords: ['황희찬', 'Hwang Hee-chan', 'Wolverhampton', 'Wolves', 'Bundesliga'],
      socialMedia: {
        instagram: 'https://www.instagram.com/hcfootball26/',
      },
      priority: 7,
      frequency: 'hourly',
      category: 'K-Sports',
    },

    // === 코미디언 / 예능인 ===
    {
      id: 'yoo-jae-suk',
      name: 'Yoo Jae-suk',
      koreanName: '유재석',
      keywords: ['유재석', 'Yoo Jae-suk', 'Running Man', '국민 MC', 'Hangout with Yoo'],
      socialMedia: {},
      priority: 8,
      frequency: 'hourly',
      category: 'K-Entertainment',
    },

    // === 먹방 크리에이터 (Tier 2) ===
    {
      id: 'sio',
      name: 'Sio ASMR',
      koreanName: '시오',
      keywords: ['시오', 'Sio ASMR', 'Mukbang', 'ASMR', 'Korean Food'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@sioasmr',
        instagram: 'https://www.instagram.com/sioasmr/',
        tiktok: 'https://www.tiktok.com/@sioasmr',
      },
      priority: 7,
      frequency: 'hourly',
      category: 'K-Mukbang',
    },
    {
      id: 'stephanie-soo',
      name: 'Stephanie Soo',
      koreanName: '스테파니 수',
      keywords: ['Stephanie Soo', 'Mukbang', 'MissMangoButt', 'Korean Food Review'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@StephanieSoo',
        instagram: 'https://www.instagram.com/stephaniesoo/',
        tiktok: 'https://www.tiktok.com/@stephsoo',
      },
      priority: 7,
      frequency: 'hourly',
      category: 'K-Mukbang',
    },

    // === K-Beauty 인플루언서 (Tier 2) ===
    {
      id: 'risabae',
      name: 'Risabae',
      koreanName: '리사배',
      keywords: ['리사배', 'Risabae', 'K-Beauty', 'Makeup Tutorial', 'Korean Makeup'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@RISABAE',
        instagram: 'https://www.instagram.com/risabae_art/',
        tiktok: 'https://www.tiktok.com/@risabae',
      },
      priority: 7,
      frequency: 'hourly',
      category: 'K-Beauty',
    },
    {
      id: 'lamuqe',
      name: 'Lamuqe',
      koreanName: '라뮤끄',
      keywords: ['라뮤끄', 'Lamuqe', 'K-Beauty', 'Makeup', 'Beauty Review'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@lamuqe',
        instagram: 'https://www.instagram.com/lamuqe/',
        tiktok: 'https://www.tiktok.com/@lamuqe',
      },
      priority: 7,
      frequency: 'hourly',
      category: 'K-Beauty',
    },
  ],

  // Tier 3: 신인 & 떠오르는 스타 (일별 모니터링)
  tier3: [
    {
      id: 'riize',
      name: 'RIIZE',
      koreanName: '라이즈',
      keywords: ['RIIZE', '라이즈', 'Get A Guitar', 'Siren', 'BRIIZE'],
      socialMedia: {
        instagram: 'https://www.instagram.com/riize_official/',
        youtube: 'https://www.youtube.com/@RIIZE_official',
        tiktok: 'https://www.tiktok.com/@riize_official',
      },
      priority: 7,
      frequency: 'daily',
      category: 'K-Pop',
    },
    {
      id: 'zerobaseone',
      name: 'ZEROBASEONE',
      koreanName: '제로베이스원',
      keywords: ['ZEROBASEONE', 'ZB1', '제로베이스원', 'ZEROSE'],
      socialMedia: {
        instagram: 'https://www.instagram.com/zb1official/',
        youtube: 'https://www.youtube.com/@ZEROBASEONE',
        tiktok: 'https://www.tiktok.com/@zb1official',
      },
      priority: 7,
      frequency: 'daily',
      category: 'K-Pop',
    },
    {
      id: 'babymonster',
      name: 'BABYMONSTER',
      koreanName: '베이비몬스터',
      keywords: ['BABYMONSTER', '베이비몬스터', 'MONSTIEZ', 'YG'],
      socialMedia: {
        instagram: 'https://www.instagram.com/babymonster_ygofficial/',
        youtube: 'https://www.youtube.com/@BABY_MONSTER',
        tiktok: 'https://www.tiktok.com/@babymonster_ygofficial',
      },
      priority: 7,
      frequency: 'daily',
      category: 'K-Pop',
    },

    // === 신흥 먹방 크리에이터 ===
    {
      id: 'nado',
      name: 'Nado',
      koreanName: '나도',
      keywords: ['나도', 'Nado', 'Mukbang', 'Korean Food', 'ASMR'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@NadoMukbang',
        instagram: 'https://www.instagram.com/nado_official/',
        tiktok: 'https://www.tiktok.com/@nado_official',
      },
      priority: 6,
      frequency: 'daily',
      category: 'K-Mukbang',
    },
    {
      id: 'dongmukd',
      name: 'Dongmukd',
      koreanName: '동묵디',
      keywords: ['동묵디', 'Dongmukd', 'Mukbang', 'Spicy Food', 'Korean Noodles'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@Dongmukd',
        instagram: 'https://www.instagram.com/dongmukd/',
        tiktok: 'https://www.tiktok.com/@dongmukd',
      },
      priority: 6,
      frequency: 'daily',
      category: 'K-Mukbang',
    },

    // === 신흥 K-Beauty 크리에이터 ===
    {
      id: 'jella',
      name: 'Jella',
      koreanName: '젤라',
      keywords: ['젤라', 'Jella', 'K-Beauty', 'Makeup', 'Beauty Tips'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@Jella_official',
        instagram: 'https://www.instagram.com/jella_cosmetics/',
        tiktok: 'https://www.tiktok.com/@jella_official',
      },
      priority: 6,
      frequency: 'daily',
      category: 'K-Beauty',
    },
    {
      id: 'director-pi',
      name: 'Director Pi',
      koreanName: '디렉터 파이',
      keywords: ['디렉터파이', 'Director Pi', 'K-Beauty', 'Skincare', 'Beauty Science'],
      socialMedia: {
        youtube: 'https://www.youtube.com/@DirectorPi',
        instagram: 'https://www.instagram.com/director_pi/',
        tiktok: 'https://www.tiktok.com/@director_pi',
      },
      priority: 6,
      frequency: 'daily',
      category: 'K-Beauty',
    },
  ],
}

// ========== 트렌드 감지 설정 ==========

export const TREND_SOURCES = {
  global: [
    {
      name: 'Twitter Trends',
      url: 'https://api.twitter.com/2/trends/place.json',
      locations: [23424868], // 한국
      frequency: 'realtime',
    },
    {
      name: 'Google Trends',
      url: 'https://trends.google.com/trends/trendingsearches/daily/rss',
      regions: ['KR'],
      frequency: 'hourly',
    },
    {
      name: 'YouTube Trending',
      url: 'https://www.googleapis.com/youtube/v3/videos',
      params: { part: 'snippet', chart: 'mostPopular', regionCode: 'KR' },
      frequency: 'hourly',
    },
  ],

  korean: [
    {
      name: 'Naver Datalab',
      url: 'https://openapi.naver.com/v1/datalab/search',
      frequency: 'hourly',
    },
    {
      name: 'Melon Chart',
      url: 'https://www.melon.com/chart/index.htm',
      frequency: 'hourly',
    },
    {
      name: 'Genie Chart',
      url: 'https://www.genie.co.kr/chart/top200',
      frequency: 'hourly',
    },
  ],

  community: [
    {
      name: 'DC인사이드 실시간',
      url: 'https://gall.dcinside.com',
      galleries: ['idol', 'entertain', 'drama', 'movie'],
      frequency: 'realtime',
    },
    {
      name: '인스티즈 차트',
      url: 'https://www.instiz.net/pt',
      frequency: 'hourly',
    },
    {
      name: '더쿠 HOT',
      url: 'https://theqoo.net/hot',
      frequency: 'realtime',
    },
    {
      name: 'Reddit r/kpop',
      url: 'https://www.reddit.com/r/kpop/hot.json',
      frequency: 'hourly',
    },
  ],
}

// ========== 특정 이슈 추적 ==========

export const TRACKING_ISSUES = [
  {
    keyword: 'K-pop demon hunters',
    description: '최신 트렌드: K-Pop과 호러 장르 결합',
    relatedKeywords: ['Huntrix', 'K-pop horror', 'creepypasta'],
    priority: 10,
    autoGenerate: true, // 자동 콘텐츠 생성
  },
  {
    keyword: 'Huntrix',
    description: '떠오르는 밈/트렌드',
    relatedKeywords: ['K-pop demon hunters', 'horror concept'],
    priority: 9,
    autoGenerate: true,
  },
  {
    keyword: 'NewJeans OMG challenge',
    description: '바이럴 챌린지',
    relatedKeywords: ['OMG dance', 'NewJeans challenge', 'TikTok'],
    priority: 8,
    autoGenerate: true,
  },
  {
    keyword: 'aespa Supernova',
    description: '최신 컴백',
    relatedKeywords: ['aespa comeback', 'Supernova dance', 'MY'],
    priority: 8,
    autoGenerate: true,
  },
]

// ========== 모니터링 함수 ==========

import { monitorVIPAcrossPlatforms } from './socialMediaIntegration.js'

/**
 * VIP 인물 실시간 모니터링 (모든 소셜 미디어 플랫폼 통합)
 */
export async function monitorVIP(vipId) {
  const vip = getVIPById(vipId)

  if (!vip) {
    throw new Error(`VIP not found: ${vipId}`)
  }

  logger.info('[vip]', `[VIP Monitor] Monitoring ${vip.name} across all platforms...`)

  // 기존 플랫폼 검색 (Twitter, YouTube, Reddit 등)
  const basicResults = await Promise.all([
    // Twitter 검색
    searchTwitter(vip.keywords),

    // YouTube 검색
    searchYouTube(vip.keywords),

    // Instagram (공식 계정만)
    // fetchInstagram은 socialMediaIntegration 모듈에서 제공
    vip.socialMedia?.instagram ? Promise.resolve({ posts: [], metrics: {} }) : null,

    // 커뮤니티 검색
    searchCommunities(vip.keywords),
  ])

  // 신규 소셜 미디어 플랫폼 통합 모니터링
  let socialMediaResults = {}
  try {
    socialMediaResults = await monitorVIPAcrossPlatforms(vip)
  } catch (error) {
    logger.error('[vip]', `[VIP Monitor] Social media integration failed: ${error.message}`)
  }

  // 결과 통합
  const allPlatforms = {}

  // 기존 플랫폼 데이터
  basicResults
    .filter(r => r !== null)
    .forEach(result => {
      allPlatforms[result.platform || 'unknown'] = result
    })

  // 신규 플랫폼 데이터
  if (socialMediaResults.platforms) {
    Object.assign(allPlatforms, socialMediaResults.platforms)
  }

  return {
    vip: vip.name,
    vipId: vip.id,
    category: vip.category,
    timestamp: new Date().toISOString(),
    platforms: allPlatforms,
    totalMentions:
      Object.values(allPlatforms).reduce((sum, p) => {
        if (p.metrics) {
          return sum + (p.metrics.totalLikes || 0) + (p.metrics.totalComments || 0)
        }
        return sum + (p.count || 0)
      }, 0) || 0,
    platformsMonitored: Object.keys(allPlatforms),
    summary: {
      totalPlatforms: Object.keys(allPlatforms).length,
      successfulPlatforms: Object.values(allPlatforms).filter(p => !p.error).length,
      failedPlatforms: Object.values(allPlatforms).filter(p => p.error).length,
    },
  }
}

/**
 * 트렌드 자동 감지
 */
export async function detectTrends() {
  const allTrends = await Promise.all([
    fetchGlobalTrends(),
    fetchKoreanTrends(),
    fetchCommunityTrends(),
  ])

  // 중복 제거 및 집계
  const trendMap = new Map()

  allTrends.flat().forEach(trend => {
    if (trendMap.has(trend.keyword)) {
      const existing = trendMap.get(trend.keyword)
      existing.mentions += trend.mentions
      existing.sources.push(trend.source)
    } else {
      trendMap.set(trend.keyword, {
        keyword: trend.keyword,
        mentions: trend.mentions,
        sources: [trend.source],
        timestamp: new Date().toISOString(),
      })
    }
  })

  // 상위 50개 트렌드 반환
  return Array.from(trendMap.values())
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 50)
}

/**
 * 특정 이슈 추적
 */
export async function trackIssue(issueKeyword) {
  const issue = TRACKING_ISSUES.find(i => i.keyword === issueKeyword)

  if (!issue) {
    throw new Error(`Issue not found: ${issueKeyword}`)
  }

  const allKeywords = [issue.keyword, ...issue.relatedKeywords]

  const results = await Promise.all([
    searchTwitter(allKeywords),
    searchYouTube(allKeywords),
    // searchReddit와 searchTikTok은 별도 구현 필요
    Promise.resolve({ count: 0, items: [] }), // Reddit placeholder
    Promise.resolve({ count: 0, items: [] }), // TikTok placeholder
    searchCommunities(allKeywords),
  ])

  return {
    issue: issue.keyword,
    description: issue.description,
    mentions: results.reduce((sum, r) => sum + r.count, 0),
    content: results.flatMap(r => r.items).slice(0, 100),
    sentiment: analyzeSentiment(results),
    shouldAutoGenerate: issue.autoGenerate && results.reduce((sum, r) => sum + r.count, 0) > 1000,
  }
}

/**
 * 자동 콘텐츠 생성 트리거
 */
export async function autoGenerateContent(data) {
  if (!data.shouldAutoGenerate) {
    return null
  }

  // GPT-4로 기사 생성
  const article = await generateArticle(data)

  // 이미지 생성 (옵션)
  let image = null
  if (process.env.ENABLE_IMAGE_GENERATION === 'true') {
    image = await generateImage(data.issue)
  }

  // 소셜 포스트 생성
  const socialPosts = await generateSocialPost(article)

  // 2차 검증
  const verification = await autoFilter(article)

  if (!verification.approved) {
    return { status: 'rejected', reason: verification.reason }
  }

  return {
    status: 'pending',
    type: 'auto-generated',
    article,
    image,
    socialPosts,
    trustScore: 85,
  }
}

// ========== 헬퍼 함수 (실제 구현) ==========

/**
 * Rate Limiter (무료 플랜 보호)
 */
const rateLimiter = {
  twitter: { lastCall: 0, minInterval: 1000 }, // 1초당 1회
  youtube: { lastCall: 0, minInterval: 1000 },
  reddit: { lastCall: 0, minInterval: 1000 },
}

async function waitForRateLimit(service) {
  const limiter = rateLimiter[service]
  if (!limiter) return

  const now = Date.now()
  const elapsed = now - limiter.lastCall
  if (elapsed < limiter.minInterval) {
    await new Promise(resolve => setTimeout(resolve, limiter.minInterval - elapsed))
  }
  limiter.lastCall = Date.now()
}

/**
 * Retry 로직 (API 실패 시 3회 재시도)
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      const delay = baseDelay * Math.pow(2, i) // 지수 백오프
      logger.warn('[vip]', `Retry ${i+1}/${maxRetries} after ${delay}ms`, { error: error.message })
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Twitter/X API v2 — twitter-api-v2 SDK 사용
 * 무료 플랜: 월 50만 트윗 조회 / Bearer Token 인증 (App-only, 읽기 전용)
 * SDK 장점: 자동 레이트리밋 핸들링, 페이지네이션, TypeScript 타입 지원
 */
async function searchTwitter(keywords) {
  const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN

  if (!TWITTER_BEARER_TOKEN || TWITTER_BEARER_TOKEN === 'your_twitter_bearer_token') {
    logger.warn('[vip]', '[Twitter] API token not configured, skipping')
    return { count: 0, items: [] }
  }

  await waitForRateLimit('twitter')
  const endApiCall = performanceMonitor.startApiCall('twitter-search')

  try {
    // twitter-api-v2 SDK: Bearer Token only (App-only auth)
    const twitterClient = new TwitterApi(TWITTER_BEARER_TOKEN)
    const query = keywords.slice(0, 3).join(' OR ') + ' -is:retweet'

    const result = await twitterClient.v2.searchRecent(query, {
      max_results: 10,
      'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
    })

    const tweets = result.data?.data || []
    endApiCall(true)

    return {
      count: tweets.length,
      items: tweets.map(t => ({
        text: t.text,
        source: 'Twitter',
        url: `https://twitter.com/i/web/status/${t.id}`,
        timestamp: t.created_at,
        metrics: t.public_metrics,
      })),
    }
  } catch (error) {
    logger.error('[vip]', '[Twitter] Search failed', { error: error.message, code: error.code })
    endApiCall(false, error)
    return { count: 0, items: [] }
  }
}

/**
 * YouTube API 구현 (무료 플랜: 일 10,000 쿼터 = 100회 검색)
 */
async function searchYouTube(keywords) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key') {
    logger.warn('[vip]', '[YouTube] API key not configured, skipping')
    return { count: 0, items: [] }
  }

  await waitForRateLimit('youtube')

  const endApiCall = performanceMonitor.startApiCall('youtube-search')

  try {
    const query = keywords.slice(0, 3).join(' ')
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`

    const response = await retryWithBackoff(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (res.status === 403) {
          const data = await res.json()
          if (data.error?.errors?.[0]?.reason === 'quotaExceeded') {
            throw new Error('YouTube quota exceeded (daily limit: 10,000)')
          }
        }

        if (!res.ok) {
          throw new Error(`YouTube API error: ${res.status}`)
        }

        return res
      } catch (err) {
        clearTimeout(timeoutId)
        throw err
      }
    })

    const data = await response.json()
    const videos = data.items || []

    endApiCall(true)
    return {
      count: videos.length,
      items: videos.map(v => ({
        text: v.snippet.title,
        source: 'YouTube',
        url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
        timestamp: v.snippet.publishedAt,
      })),
    }
  } catch (error) {
    logger.error('[vip]', '[YouTube] Search failed', { error: error.message })
    endApiCall(false, error)
    return { count: 0, items: [] }
  }
}

import performanceMonitor from './performanceMonitor.js'

/**
 * Reddit OAuth 토큰 캐시 (55분 유효)
 */
let redditTokenCache = null
let redditTokenExpiry = 0

/**
 * Reddit OAuth 토큰 발급 (캐시 사용)
 * @returns {Promise<string|null>} Access token or null
 */
async function getRedditToken() {
  const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID
  const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET

  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) return null

  // 캐시된 토큰이 유효하면 재사용
  if (redditTokenCache && Date.now() < redditTokenExpiry) {
    logger.info('[vip]', '[Reddit] Using cached OAuth token')
    performanceMonitor.recordCacheAccess('reddit-token', true)
    return redditTokenCache
  }

  // 새 토큰 발급
  performanceMonitor.recordCacheAccess('reddit-token', false)
  const endApiCall = performanceMonitor.startApiCall('reddit-oauth')

  try {
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!authResponse.ok) {
      logger.error('[vip]', '[Reddit] OAuth failed', { status: authResponse.status })
      endApiCall(false, new Error(`OAuth failed: ${authResponse.status}`))
      return null
    }

    const authData = await authResponse.json()
    redditTokenCache = authData.access_token
    redditTokenExpiry = Date.now() + 55 * 60 * 1000 // 55분 (안전 마진 5분)
    logger.info('[vip]', '[Reddit] New OAuth token issued, expires in 55min')
    endApiCall(true)
    return redditTokenCache
  } catch (error) {
    logger.error('[vip]', '[Reddit] Token fetch failed', { error: error.message })
    endApiCall(false, error)
    return null
  }
}

/**
 * Reddit API 구현 (완전 무료, 분당 60회)
 */
async function searchCommunities(keywords) {
  const accessToken = await getRedditToken()

  if (!accessToken) {
    logger.warn('[vip]', '[Reddit] API credentials not configured, skipping')
    return { count: 0, items: [] }
  }

  await waitForRateLimit('reddit')

  const endApiCall = performanceMonitor.startApiCall('reddit-search')

  try {
    // r/kpop 검색
    const query = keywords.slice(0, 2).join(' ')
    const url = `https://oauth.reddit.com/r/kpop/search?q=${encodeURIComponent(query)}&restrict_sr=1&limit=10&sort=new`

    const response = await retryWithBackoff(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'Kulture/1.0',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          throw new Error(`Reddit API error: ${res.status}`)
        }

        return res
      } catch (err) {
        clearTimeout(timeoutId)
        throw err
      }
    })

    const data = await response.json()
    const posts = data.data?.children || []

    endApiCall(true)
    return {
      count: posts.length,
      items: posts.map(p => ({
        text: p.data.title,
        source: 'Reddit r/kpop',
        url: `https://www.reddit.com${p.data.permalink}`,
        timestamp: new Date(p.data.created_utc * 1000).toISOString(),
      })),
    }
  } catch (error) {
    logger.error('[vip]', '[Reddit] Search failed', { error: error.message })
    endApiCall(false, error)
    return { count: 0, items: [] }
  }
}

/**
 * 글로벌 트렌드 수집 (Google Trends RSS - 무료)
 */
async function fetchGlobalTrends() {
  try {
    const url = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KR'
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Google Trends error: ${response.status}`)
    }

    const xml = await response.text()

    // 간단한 RSS 파싱 (XML → JSON)
    const trends = []
    const titleRegex = /<title><!\[CDATA\[(.+?)\]\]><\/title>/g
    let match

    while ((match = titleRegex.exec(xml)) !== null) {
      const keyword = match[1]
      if (keyword && keyword !== 'Trending Searches') {
        trends.push({
          keyword,
          mentions: 1000, // Google Trends는 정확한 수치 제공 안함
          source: 'Google Trends',
        })
      }
    }

    return trends.slice(0, 20)
  } catch (error) {
    logger.error('[vip]', '[Google Trends] Fetch failed', { error: error.message })
    return []
  }
}

/**
 * 한국 트렌드 수집 (Naver DataLab - 무료, 일 25,000회)
 */
async function fetchKoreanTrends() {
  const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID
  const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    logger.warn('[vip]', '[Naver] API credentials not configured, skipping')
    return []
  }

  try {
    // Naver 실시간 검색어 API (무료)
    const url = 'https://openapi.naver.com/v1/search/news.json?query=K-pop&display=10&sort=date'

    const response = await retryWithBackoff(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const res = await fetch(url, {
          headers: {
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          throw new Error(`Naver API error: ${res.status}`)
        }

        return res
      } catch (err) {
        clearTimeout(timeoutId)
        throw err
      }
    })

    const data = await response.json()
    const items = data.items || []

    // 제목에서 키워드 추출
    const keywords = new Set()
    items.forEach(item => {
      const title = item.title.replace(/<[^>]*>/g, '') // HTML 태그 제거
      const words = title.split(/\s+/).filter(w => w.length >= 2)
      words.forEach(w => keywords.add(w))
    })

    return Array.from(keywords)
      .slice(0, 20)
      .map(keyword => ({
        keyword,
        mentions: 500,
        source: 'Naver',
      }))
  } catch (error) {
    logger.error('[vip]', '[Naver] Fetch failed', { error: error.message })
    return []
  }
}

/**
 * 커뮤니티 트렌드 수집 (Reddit 활용)
 */
async function fetchCommunityTrends() {
  try {
    // Reddit r/kpop hot posts (무료)
    const posts = await searchCommunities(['trending', 'viral'])

    return posts.items.map(post => ({
      keyword: post.text.split(' ').slice(0, 3).join(' '),
      mentions: 100,
      source: 'Reddit Community',
    }))
  } catch (error) {
    logger.error('[vip]', '[Community Trends] Fetch failed', { error: error.message })
    return []
  }
}

/**
 * 감정 분석 (Hugging Face 무료 API)
 */
async function analyzeSentiment(results) {
  const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN

  if (!HF_TOKEN) {
    logger.warn('[vip]', '[Sentiment] HF token not configured, using default')
    return { positive: 0.7, negative: 0.2, neutral: 0.1 }
  }

  try {
    const texts = results.flatMap(r => r.items.map(i => i.text)).slice(0, 10)
    if (texts.length === 0) return { positive: 0, negative: 0, neutral: 1 }

    const url =
      'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: texts[0] }),
    })

    if (!response.ok) {
      throw new Error('Sentiment API failed')
    }

    const data = await response.json()
    const sentiment = data[0]?.reduce((acc, item) => {
      acc[item.label.toLowerCase()] = item.score
      return acc
    }, {})

    return {
      positive: sentiment.positive || 0,
      negative: sentiment.negative || 0,
      neutral: sentiment.neutral || 0,
    }
  } catch (error) {
    logger.error('[vip]', '[Sentiment] Analysis failed', { error: error.message })
    return { positive: 0.7, negative: 0.2, neutral: 0.1 }
  }
}

/**
 * AI 기사 생성 (Hugging Face 무료 API)
 */
async function generateArticle(data) {
  const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN

  if (!HF_TOKEN) {
    logger.warn('[vip]', '[Article Generation] HF token not configured, using template')
    return `제목: ${data.issue} - K-Culture 트렌드 분석\n\n최근 ${data.mentions}회 언급된 "${data.issue}"가 주목받고 있습니다.`
  }

  try {
    const prompt = `K-Culture 트렌드: "${data.issue}"에 대한 500단어 기사를 작성하세요. 멘션 수: ${data.mentions}`

    const url = 'https://api-inference.huggingface.co/models/microsoft/phi-2'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 500 },
      }),
    })

    if (!response.ok) {
      throw new Error('Article generation failed')
    }

    const result = await response.json()
    return result[0]?.generated_text || '기사 생성 실패'
  } catch (error) {
    logger.error('[vip]', '[Article] Generation failed', { error: error.message })
    return `제목: ${data.issue}\n\n트렌드 분석 내용...`
  }
}

/**
 * 이미지 생성 (무료 플랜에서는 비활성화)
 */
async function generateImage(_concept) {
  logger.info('[vip]', '[Image] Generation disabled (free plan)')
  return null
}

/**
 * 소셜 포스트 생성 (템플릿 기반, 100% 무료)
 */
async function generateSocialPost(article) {
  const title = article.split('\n')[0]
  return {
    twitter: `🔥 ${title}\n\n#KCulture #Korean #Trending`,
    instagram: `${title} 📱\n\n#한류 #KCulture #트렌드`,
    facebook: `${title}\n\n자세한 내용은 링크를 확인하세요!`,
  }
}

/**
 * 자동 필터링 (규칙 기반, 무료)
 */
async function autoFilter(content) {
  const bannedWords = ['섹스', '마약', '도박', '불법', '성인']
  const contentLower = content.toLowerCase()

  const hasBannedWord = bannedWords.some(word => contentLower.includes(word))

  if (hasBannedWord) {
    return { approved: false, reason: '부적절한 단어 포함' }
  }

  if (content.length < 50) {
    return { approved: false, reason: '콘텐츠가 너무 짧음' }
  }

  return { approved: true }
}

// VIP 인물 데이터베이스 (Map 기반)
export const VIP_MAP = new Map()
for (const tier of ['tier1', 'tier2', 'tier3']) {
  if (VIP_DATABASE[tier]) {
    for (const vip of VIP_DATABASE[tier]) {
      VIP_MAP.set(vip.id, vip)
    }
  }
}

/**
 * VIP ID로 빠른 조회
 * @param {string} vipId
 * @returns {object|null}
 */
export function getVIPById(vipId) {
  return VIP_MAP.get(vipId) || null
}

// 기존 monitorVIP 함수에서 배열 검색을 getVIPById로 변경 필요

/**
 * [수익 엔진] RPM 기반 우선순위 산출 로직 (RL-20260113-04)
 */

// 1. 데이터 Fetching: siteSettings 문서에서 revenueWeights 객체 가져오기
async function getRevenueWeights() {
  try {
    // 원칙 8: 단일 클라이언트 사용 (import client from './sanityClient.js')
    const settings = await client.fetch(`*[_type == "siteSettings"][0]{ revenueWeights }`)
    return settings?.revenueWeights || {}
  } catch (error) {
    logger.warn('[vip]', '[VIP Monitor] Failed to fetch revenue weights', { error: error.message })
    return {}
  }
}

// 2. 가중치 매핑 함수
function getRegionWeight(region, weights) {
  const w = {
    northAmericaWeight: 1.5,
    eastAsiaWeight: 1.0,
    southeastAsiaWeight: 0.5,
    globalRestWeight: 0.3,
    ...weights,
  }

  if (!region) return w.globalRestWeight

  // 문자열 포함 여부 검사
  if (region.includes('North America') || region.includes('Europe')) {
    return w.northAmericaWeight
  }
  if (region.includes('East Asia')) {
    return w.eastAsiaWeight
  }
  if (region.includes('Southeast Asia')) {
    return w.southeastAsiaWeight
  }

  return w.globalRestWeight
}

// 3. 우선순위 점수(priorityScore) 산출 및 4. 결과 정렬
export async function getPrioritizedVIPList() {
  const weights = await getRevenueWeights()
  const allVIPs = []

  // 모든 티어 통합
  for (const tier of Object.keys(VIP_DATABASE)) {
    if (Array.isArray(VIP_DATABASE[tier])) {
      allVIPs.push(...VIP_DATABASE[tier])
    }
  }

  return allVIPs
    .map(vip => {
      // primaryRegion 기반 가중치 매핑
      const regionWeight = getRegionWeight(vip.primaryRegion, weights)
      // 기존 활동 지수(priority) 또는 기본점수 1
      const baseScore = vip.priority || 1

      return {
        ...vip,
        priorityScore: baseScore * regionWeight,
        regionWeight, // 디버깅 및 검증용
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore) // 내림차순 정렬
}
