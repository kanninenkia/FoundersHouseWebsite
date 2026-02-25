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
    title: "FH Helsinki Launch",
    description: "Founders House Helsinki is finally launching and opening its doors for the public for one night.",
    image: "/assets/images/events/FH_banner.webp",
    date: "26.02.2026",
    location: "HELSINKI"
  }
];
