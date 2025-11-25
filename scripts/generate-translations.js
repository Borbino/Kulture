const fs = require('fs');
const path = require('path');

const baseTranslation = {
  common: {
    welcome: "Welcome to Kulture",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    more: "More",
    less: "Less",
    show_more: "Show more",
    show_less: "Show less",
    back: "Back",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
    confirm: "Confirm",
    close: "Close",
    open: "Open",
    yes: "Yes",
    no: "No",
    ok: "OK",
    required: "Required",
    optional: "Optional",
    language: "Language",
    theme: "Theme",
    settings: "Settings"
  },
  navigation: {
    home: "Home",
    trending: "Trending",
    community: "Community",
    profile: "Profile",
    notifications: "Notifications",
    messages: "Messages",
    explore: "Explore",
    search: "Search"
  },
  posts: {
    new_post: "New post",
    edit_post: "Edit post",
    delete_post: "Delete post",
    share_post: "Share post",
    like: "Like",
    unlike: "Unlike",
    comment: "Comment",
    comments: "Comments",
    views: "Views",
    shares: "Shares",
    report: "Report",
    save: "Save",
    saved: "Saved",
    trending_now: "Trending now",
    hot_topics: "Hot topics",
    latest_posts: "Latest posts",
    popular_posts: "Popular posts",
    no_posts: "No posts",
    load_more: "Load more"
  },
  user: {
    profile: "Profile",
    edit_profile: "Edit profile",
    follow: "Follow",
    unfollow: "Unfollow",
    followers: "Followers",
    following: "Following",
    posts: "Posts",
    likes: "Likes",
    joined: "Member since",
    bio: "Bio"
  },
  comments: {
    add_comment: "Add comment",
    edit_comment: "Edit comment",
    delete_comment: "Delete comment",
    reply: "Reply",
    replies: "Replies",
    show_replies: "Show replies",
    hide_replies: "Hide replies",
    no_comments: "No comments yet"
  },
  social: {
    follow_request: "Follow request",
    follow_request_sent: "Request sent",
    follow_request_accepted: "Request accepted",
    mention: "Mention",
    tag: "Tag",
    hashtag: "Hashtag",
    share_to: "Share to",
    copied: "Copied to clipboard",
    share_url: "Share URL",
    download: "Download",
    embed: "Embed",
    qr_code: "QR Code",
    invite: "Invite friends",
    referral: "Referral"
  },
  missions: {
    daily_missions: "Daily missions",
    weekly_missions: "Weekly missions",
    special_missions: "Special missions",
    completed: "Completed",
    in_progress: "In progress",
    claim_reward: "Claim reward",
    rewards: "Rewards",
    points: "Points",
    level: "Level",
    exp: "EXP",
    achievements: "Achievements",
    badges: "Badges",
    leaderboard: "Leaderboard",
    rank: "Rank"
  },
  time: {
    just_now: "Just now",
    minutes_ago: "{{count}} minutes ago",
    hours_ago: "{{count}} hours ago",
    days_ago: "{{count}} days ago",
    weeks_ago: "{{count}} weeks ago",
    months_ago: "{{count}} months ago",
    years_ago: "{{count}} years ago",
    today: "Today",
    yesterday: "Yesterday",
    this_week: "This week"
  }
};

// 나머지 언어들 (영어 기본으로 생성)
const languages = [
  'it', 'pl', 'nl', 'tr', 'vi', 'th', 'id', 'bn', 'ur', 'pa',
  'jv', 'mr', 'te', 'ro', 'cs', 'el', 'sv', 'hu', 'pt-BR',
  'ca', 'sr', 'hr', 'bg', 'sk', 'da', 'fi', 'no', 'lt',
  'sl', 'lv', 'et', 'ga', 'mt', 'cy', 'is', 'sq', 'mk',
  'bs', 'my', 'km', 'lo', 'tl', 'ms', 'si', 'ne', 'ta',
  'kn', 'ml', 'gu', 'or', 'as', 'sd', 'ks', 'dz', 'bo',
  'mn', 'fa', 'he', 'az', 'uz', 'kk', 'ky', 'tk', 'tg',
  'ps', 'ku', 'sw', 'ha', 'yo', 'ig', 'am', 'om', 'so',
  'zu', 'xh', 'st', 'tn', 'rw', 'ny', 'mg', 'sn', 'ti',
  'lg', 'qu', 'ay', 'gn', 'ht', 'eu', 'gl', 'eo', 'la',
  'yi', 'sa', 'fo', 'kl', 'gd', 'br'
];

const localesDir = path.join(__dirname, '..', 'public', 'locales');

let created = 0;
let skipped = 0;

languages.forEach(lang => {
  const langDir = path.join(localesDir, lang);
  const commonFile = path.join(langDir, 'common.json');
  
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }
  
  if (!fs.existsSync(commonFile)) {
    fs.writeFileSync(commonFile, JSON.stringify(baseTranslation, null, 2), 'utf8');
    console.log(`✓ Created: ${lang}/common.json`);
    created++;
  } else {
    console.log(`- Skipped: ${lang}/common.json (already exists)`);
    skipped++;
  }
});

console.log(`\nSummary: ${created} created, ${skipped} skipped`);
