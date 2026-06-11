import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./client";

export type KauzPost = {
  id: string;
  authorName: string;
  authorHandle: string;
  cause: string;
  content: string;
  supporters: number;
  comments: number;
  createdAt?: Timestamp;
  accent: string;
};

export const seedPosts: KauzPost[] = [
  {
    id: "seed-clean-water",
    authorName: "Maya Reed",
    authorHandle: "maya.moves",
    cause: "Clean Water Fund",
    content:
      "We funded 14 household filters this week. Next milestone: a full school filtration kit before Friday.",
    supporters: 1284,
    comments: 86,
    accent: "from-cyan-300 to-blue-500",
  },
  {
    id: "seed-neighborhood-fridge",
    authorName: "Kauz Collective",
    authorHandle: "kauz.collective",
    cause: "Community Fridge Drop",
    content:
      "Tonight's volunteer wave is live. Bring fresh fruit, pantry staples, or thirty minutes to help route deliveries.",
    supporters: 842,
    comments: 41,
    accent: "from-lime-300 to-emerald-500",
  },
  {
    id: "seed-art-supplies",
    authorName: "Noah Chen",
    authorHandle: "noahcreates",
    cause: "Art Supplies for Youth",
    content:
      "Our studio wall is filling up with donor notes. Every $12 kit supports one student workshop seat.",
    supporters: 2197,
    comments: 124,
    accent: "from-fuchsia-300 to-purple-600",
  },
];

export async function fetchPosts() {
  if (!db) return seedPosts;
  const snapshot = await getDocs(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(25)),
  );
  const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as KauzPost[];
  return rows.length ? rows : seedPosts;
}

export async function createPost(
  post: Omit<KauzPost, "id" | "supporters" | "comments" | "createdAt" | "accent">,
) {
  if (!db) return;
  await addDoc(collection(db, "posts"), {
    ...post,
    supporters: 0,
    comments: 0,
    accent: "from-fuchsia-300 to-purple-600",
    createdAt: serverTimestamp(),
  });
}
