export interface Event {
  id: number;
  title: string;
  description: string;
  image: string;
  date: string;
  location: string;
}

export const eventsData: Event[] = [
  {
    id: 1,
    title: "Legends Day",
    description: "Connect with Finland's top founders, investors, and innovators. Share insights, discover opportunities, and build lasting relationships that accelerate your startup journey.",
    image: "/assets/images/membership/join-process.webp",
    date: "19.11.2025",
    location: "HELSINKI"
  },
  {
    id: 2,
    title: "Founders Day",
    description: "Experience an evening of deep work, meaningful conversations, and creative collaboration. Join ambitious builders pushing boundaries in their respective fields.",
    image: "/assets/images/events/Wave x Maki Photo.webp",
    date: "25.01.2025",
    location: "HELSINKI"
  },
  {
    id: 3,
    title: "FH Helsinki Launch",
    description: "Intimate fireside chats and workshops with successful founders sharing real stories, hard-won lessons, and actionable strategies for scaling startups in the Nordics.",
    image: "/assets/images/events/FH_zechen.webp",
    date: "26.02.2026",
    location: "HELSINKI"
  },
  {
    id: 4,
    title: "Community Nights",
    description: "Casual meetups designed for genuine connection and spontaneous collaboration. Where ideas collide, friendships form, and the next big thing takes shape over coffee.",
    image: "/assets/images/events/LoadInImage-min.webp",
    date: "08.03.2025",
    location: "HELSINKI"
  }
];
