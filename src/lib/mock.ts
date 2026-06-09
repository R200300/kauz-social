export const avatars = [
  "https://i.pravatar.cc/200?img=1",
  "https://i.pravatar.cc/200?img=5",
  "https://i.pravatar.cc/200?img=12",
  "https://i.pravatar.cc/200?img=20",
  "https://i.pravatar.cc/200?img=32",
  "https://i.pravatar.cc/200?img=45",
  "https://i.pravatar.cc/200?img=49",
  "https://i.pravatar.cc/200?img=56",
  "https://i.pravatar.cc/200?img=60",
  "https://i.pravatar.cc/200?img=68",
];

export const postImages = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800",
  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800",
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
  "https://images.unsplash.com/photo-1635776062764-e025521e3df3?w=800",
  "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800",
  "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=800",
  "https://images.unsplash.com/photo-1614851099511-773084f6911d?w=800",
  "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800",
  "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=800",
  "https://images.unsplash.com/photo-1635776063043-9e23f3d1c4f5?w=800",
  "https://images.unsplash.com/photo-1641326201918-3cb813bd5302?w=800",
];

export type AiBadge = "AI Pick" | "Trending" | "For You";
export type Post = {
  id: string;
  user: { name: string; handle: string; avatar: string; following: boolean };
  image: string;
  aiTag?: "AI Recommended" | "Trending" | "AI Picks";
  aiBadge?: AiBadge;
  sensitive?: boolean;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  time: string;
};

export const aiPicks = [
  { id: "p1", image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600", handle: "aarya.ai", reason: "Matches your love for neon & AI art" },
  { id: "p2", image: "https://images.unsplash.com/photo-1635776062764-e025521e3df3?w=600", handle: "lumi", reason: "Trending with creators you follow" },
  { id: "p3", image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600", handle: "nova", reason: "Similar to posts you saved" },
  { id: "p4", image: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=600", handle: "kai.wren", reason: "Popular in Mumbai today" },
  { id: "p5", image: "https://images.unsplash.com/photo-1641326201918-3cb813bd5302?w=600", handle: "theo", reason: "Picked from your interests: design" },
];

export const smartSearches = [
  "People you may know",
  "Trending in your city",
  "Creators like @aarya.ai",
  "Sounds you'll love",
  "Reels for tonight",
];

export const posts: Post[] = [
  {
    id: "1",
    user: { name: "Aarya Mehta", handle: "aarya.ai", avatar: avatars[0], following: false },
    image: postImages[0],
    aiTag: "AI Recommended",
    aiBadge: "AI Pick",
    caption: "midnight dreams in neon. #AIart #neon #cyberpunk",
    likes: 12400,
    comments: 312,
    shares: 88,
    time: "2h ago",
  },
  {
    id: "2",
    user: { name: "Kai Wren", handle: "kai.wren", avatar: avatars[1], following: true },
    image: postImages[1],
    aiTag: "Trending",
    aiBadge: "Trending",
    caption: "field notes from the algorithm. #generative #future",
    likes: 8420,
    comments: 201,
    shares: 44,
    time: "4h ago",
  },
  {
    id: "3",
    user: { name: "Nova Reyes", handle: "nova", avatar: avatars[2], following: false },
    image: postImages[2],
    aiBadge: "For You",
    sensitive: true,
    caption: "soft static. quiet noise. #mood #photography",
    likes: 2230,
    comments: 67,
    shares: 12,
    time: "6h ago",
  },
  {
    id: "4",
    user: { name: "Ishaan Roy", handle: "ish.roy", avatar: avatars[3], following: true },
    image: postImages[3],
    aiTag: "AI Picks",
    aiBadge: "AI Pick",
    caption: "built this in 24 hours. what should i ship next? #dev #ui",
    likes: 5680,
    comments: 432,
    shares: 99,
    time: "8h ago",
  },
  {
    id: "5",
    user: { name: "Lumi Sato", handle: "lumi", avatar: avatars[4], following: false },
    image: postImages[4],
    aiTag: "Trending",
    aiBadge: "Trending",
    caption: "violet hours. #aesthetic #violet",
    likes: 19200,
    comments: 540,
    shares: 220,
    time: "10h ago",
  },
  {
    id: "6",
    user: { name: "Theo Park", handle: "theo", avatar: avatars[5], following: true },
    image: postImages[5],
    aiBadge: "For You",
    caption: "studio dump 🪩 #studio #process",
    likes: 1430,
    comments: 22,
    shares: 5,
    time: "12h ago",
  },
];

export const stories = avatars.slice(0, 8).map((a, i) => ({
  id: String(i),
  handle: ["you", "aarya", "kai", "nova", "ish", "lumi", "theo", "zane"][i],
  avatar: a,
}));

export const conversations = [
  { id: "1", name: "Aarya Mehta", avatar: avatars[0], last: "haha that's wild 😂", time: "now", unread: true, online: true },
  { id: "2", name: "Kai Wren", avatar: avatars[1], last: "send me the file when ready", time: "5m", unread: true, online: true },
  { id: "3", name: "Nova Reyes", avatar: avatars[2], last: "loved your post ✨", time: "1h", unread: false, online: false },
  { id: "4", name: "Ishaan Roy", avatar: avatars[3], last: "let's collab next week", time: "3h", unread: false, online: true },
  { id: "5", name: "Lumi Sato", avatar: avatars[4], last: "🫶", time: "1d", unread: false, online: false },
  { id: "6", name: "Theo Park", avatar: avatars[5], last: "see you tomorrow", time: "2d", unread: false, online: false },
];

export const notifications = {
  all: [
    { id: "1", type: "like", user: "aarya", avatar: avatars[0], text: "liked your post", time: "2m" },
    { id: "2", type: "ai", text: "Your post is trending in Mumbai! 🚀", time: "1h" },
    { id: "3", type: "follow", user: "kai.wren", avatar: avatars[1], text: "started following you", time: "3h" },
    { id: "4", type: "comment", user: "nova", avatar: avatars[2], text: "commented: \"so good\"", time: "5h" },
    { id: "5", type: "ai", text: "AI noticed 3 new creators that match your taste.", time: "8h" },
    { id: "6", type: "like", user: "ish.roy", avatar: avatars[3], text: "and 24 others liked your reel", time: "1d" },
  ],
};

export const trendingTags = ["#AIart", "#Viral", "#NeonNights", "#Mumbai", "#Reels", "#Design", "#Cyberpunk", "#Music"];