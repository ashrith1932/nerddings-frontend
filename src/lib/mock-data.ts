export type User = {
  id: string;
  name: string;
  username: string;
  role: string;
  roles: string[];
  bio: string;
  initials: string;
  color: string;
  affiliation?: string;
  location: string;
  followers: string;
  verified?: boolean;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  stage: string;
  category: string;
  accent: string;
  icon: string;
  stats: string;
  tags: string[];
  owner: string;
  location: string;
  fundraising?: {
    stage: "Pre-seed" | "Seed" | "Series A" | "Series B";
    targetAmount: number;
    raisedAmount: number;
    currency: "INR" | "USD";
    investorCount: number;
  };
};

export type Post = {
  id: string;
  author: User;
  type: "Build update" | "Milestone" | "Idea" | "Launch";
  time: string;
  text: string;
  project?: Project;
  likes: number;
  comments: number;
  reposts: number;
  saved?: boolean;
  liked?: boolean;
  proof?: string;
  media?: { publicUrl: string | null; mimeType: string }[];
};

export type TrendingPost = {
  id: string;
  topic: string;
  headline: string;
  summary: string;
  author: User;
  time: string;
  reactions: string;
  comments: string;
  accent: string;
  kind: "Hot discussion" | "Build story" | "Launch";
};

export const currentUser: User = {
  id: "ashrith",
  name: "Ashrith Reddy",
  username: "ashrith.builds",
  role: "Builder · Founder",
  roles: ["Builder", "Founder", "Student"],
  bio: "Building tools that make ambitious ideas easier to ship.",
  initials: "AR",
  color: "#e4572e",
  affiliation: "Founder @ Loomly",
  location: "Hyderabad, India",
  followers: "1,284",
  verified: true,
};

export const users: User[] = [
  currentUser,
  { id: "rahul", name: "Rahul Sharma", username: "rahulships", role: "Builder · Researcher", roles: ["Builder", "Researcher"], bio: "Making applied AI feel useful, not magical.", initials: "RS", color: "#5a67d8", affiliation: "Researcher @ Vector Labs", location: "Bengaluru, India", followers: "824", verified: true },
  { id: "sarah", name: "Sarah Jenkins", username: "sarahj", role: "Investor · Mentor", roles: ["Investor", "Mentor"], bio: "Backing the people who make hard things look inevitable.", initials: "SJ", color: "#725ac1", affiliation: "Partner @ Northstar", location: "London, UK", followers: "3,610", verified: true },
  { id: "maya", name: "Maya Patel", username: "mayamakes", role: "Founder · Creator", roles: ["Founder", "Creator"], bio: "The climate data layer for small farms.", initials: "MP", color: "#267d65", affiliation: "Founder @ Fieldnote", location: "Pune, India", followers: "2,102", verified: true },
  { id: "leo", name: "Leo Martins", username: "leomakes", role: "Student Builder", roles: ["Student Builder", "Builder"], bio: "Designing tiny games for big feelings.", initials: "LM", color: "#d8912e", location: "Lisbon, Portugal", followers: "592" },
  { id: "nina", name: "Nina Okafor", username: "ninaokafor", role: "Founder · Builder", roles: ["Founder", "Builder"], bio: "Payments infrastructure for the next billion.", initials: "NO", color: "#ca4d75", affiliation: "Co-founder @ Kora", location: "Lagos, Nigeria", followers: "1,738", verified: true },
];

export const projects: Project[] = [
  { id: "loomly", name: "Loomly", slug: "loomly", description: "A calmer way for small teams to turn scattered ideas into shipped work.", stage: "MVP", category: "Productivity", accent: "#e4572e", icon: "L", stats: "1.8k visits", tags: ["Next.js", "Postgres", "AI"], owner: "Ashrith Reddy", location: "Hyderabad" },
  { id: "fieldnote", name: "Fieldnote", slug: "fieldnote", description: "Climate intelligence that gives every small farm a clearer next move.", stage: "Growing", category: "Climate", accent: "#267d65", icon: "F", stats: "943 saves", tags: ["Climate", "Data", "B2B"], owner: "Maya Patel", location: "Pune", fundraising: { stage: "Seed", targetAmount: 12000000, raisedAmount: 7200000, currency: "INR", investorCount: 9 } },
  { id: "threadline", name: "Threadline", slug: "threadline", description: "Open-source knowledge graphs for teams that care about context.", stage: "Prototype", category: "Developer tools", accent: "#5a67d8", icon: "T", stats: "482 contributors", tags: ["Open source", "Graph", "Rust"], owner: "Rahul Sharma", location: "Bengaluru" },
  { id: "kora", name: "Kora", slug: "kora", description: "Modern payment rails for the people building across borders.", stage: "Fundraising", category: "Fintech", accent: "#ca4d75", icon: "K", stats: "Pre-seed", tags: ["Fintech", "Payments", "Africa"], owner: "Nina Okafor", location: "Lagos", fundraising: { stage: "Pre-seed", targetAmount: 4500000, raisedAmount: 2875000, currency: "INR", investorCount: 18 } },
];

export const posts: Post[] = [
  { id: "p1", author: currentUser, type: "Build update", time: "2h", text: "The first working version of Loomly is live. We cut the setup flow from 11 minutes to 90 seconds — mostly by asking better questions up front.\n\nShipping the messy middle feels good.", project: projects[0], likes: 84, comments: 12, reposts: 21, proof: "loomly.app / v0.4" },
  { id: "p2", author: users[1], type: "Milestone", time: "4h", text: "Threadline just crossed 400 contributors. The best part is that 70% of pull requests came from people who found the project through a build note here.", project: projects[2], likes: 128, comments: 18, reposts: 34, proof: "github.com/threadline · 482 contributors" },
  { id: "p3", author: users[3], type: "Launch", time: "6h", text: "Fieldnote is now helping 120 farms make irrigation decisions with less guesswork. We are looking for two pilot partners in Maharashtra this month.", project: projects[1], likes: 96, comments: 9, reposts: 18, proof: "fieldnote.earth · 120 farms" },
  { id: "p4", author: users[5], type: "Idea", time: "1d", text: "What if the best startup database was not a list of companies, but a map of the problems people keep trying to solve? Thinking out loud.", likes: 67, comments: 24, reposts: 8 },
];

export const trendingPosts: TrendingPost[] = [
  { id: "trend-1", topic: "AI · 2.4k people reading", headline: "The small-team AI stack is getting weirdly good", summary: "A thoughtful thread on what founders are actually shipping with five-person teams — and what they stopped building.", author: users[1], time: "38m", reactions: "1.2k", comments: "86", accent: "#5a67d8", kind: "Hot discussion" },
  { id: "trend-2", topic: "Climate · 18 projects joining", headline: "Fieldnote just made its first farm-to-dashboard loop", summary: "Maya shares the messy field notes behind a climate product that is now helping 120 farms decide when to irrigate.", author: users[3], time: "1h", reactions: "842", comments: "54", accent: "#267d65", kind: "Build story" },
  { id: "trend-3", topic: "Open source · 482 contributors", headline: "Threadline is becoming the context layer for teams", summary: "The project crossed 400 contributors after a build note brought in maintainers from three new communities.", author: users[1], time: "3h", reactions: "618", comments: "41", accent: "#e4572e", kind: "Launch" },
  { id: "trend-4", topic: "Founder life · 930 people talking", headline: "What did you delete from your roadmap?", summary: "The most useful founder conversation this week is about the work teams chose not to ship.", author: users[5], time: "5h", reactions: "403", comments: "119", accent: "#ca4d75", kind: "Hot discussion" },
];

export const events = [
  { id: "e1", date: "24", month: "AUG", title: "Build for Climate 2026", type: "Hackathon", organizer: "Founders Guild", location: "Online · 48 hours", people: "1,284 going", color: "#e4572e" },
  { id: "e2", date: "29", month: "AUG", title: "India Product Demo Day", type: "Demo day", organizer: "Peak XV", location: "Bengaluru · In person", people: "348 going", color: "#5a67d8" },
  { id: "e3", date: "06", month: "SEP", title: "The First 10 Customers", type: "Workshop", organizer: "Lenny’s Community", location: "Online · 6:00 PM IST", people: "92 going", color: "#267d65" },
];

export const conversations = [
  { id: "c1", user: users[1], preview: "The project board is looking great — one thought on…", time: "9:42 AM", unread: 2 },
  { id: "c2", user: users[3], preview: "Would love to compare notes on onboarding.", time: "Yesterday", unread: 0 },
  { id: "c3", user: users[2], preview: "Thanks for sharing your build note!", time: "Mon", unread: 0 },
];

export const notifications = [
  { id: "n1", kind: "proof", actor: users[1], text: "saved your build update", time: "18m", unread: true },
  { id: "n2", kind: "follow", actor: users[4], text: "started following you", time: "1h", unread: true },
  { id: "n3", kind: "comment", actor: users[3], text: "commented on your project", time: "3h", unread: false },
  { id: "n4", kind: "team", actor: users[2], text: "sent you a collaboration request", time: "Yesterday", unread: false },
];

export const charts = {
  builders: [users[1], users[3], users[5], users[4]],
  projects: projects,
  startups: [projects[3], projects[1], projects[0], projects[2]],
  communities: ["AI Builders India", "Indie Hackers Hyderabad", "Climate Tech Circle", "Open Source South"],
};

export const searchResults = [
  { kind: "Project", title: "Loomly", detail: "A calmer way to turn ideas into shipped work.", meta: "MVP · 1.8k visits", accent: "#e4572e" },
  { kind: "Person", title: "Rahul Sharma", detail: "Builder · Researcher · Bengaluru", meta: "@rahulships", accent: "#5a67d8" },
  { kind: "Startup", title: "Kora", detail: "Payment rails for cross-border teams.", meta: "Fintech · Fundraising", accent: "#ca4d75" },
  { kind: "Event", title: "Build for Climate 2026", detail: "Hackathon · Online · 24 Aug", meta: "1,284 going", accent: "#267d65" },
];
