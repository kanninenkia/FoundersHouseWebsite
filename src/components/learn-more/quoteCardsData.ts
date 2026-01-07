/**
 * Quote Cards Data
 * Centralizes all quote card content and configuration
 */

export interface QuoteCardData {
  name: string
  quote: string
  imageUrl: string
  nameColor: 'white' | 'dark-red' | 'light-red'
  delay: number
  animateY: number // Alternating up/down animation
}

export const quoteCardsData: QuoteCardData[] = [
  {
    name: "ILKKA PAANANEN",
    quote: "I'm backing Founders House because every serious founder deserves the environment we had in our early days.",
    imageUrl: "/LoadInImage-min.webp",
    nameColor: "light-red",
    delay: 0.1,
    animateY: 60,
  },
  {
    name: "MIKI KUUSI",
    quote: "This is what the startup ecosystem needs—a place where founders can focus on building without the usual distractions.",
    imageUrl: "/Wave x Maki Photo.webp",
    nameColor: "white",
    delay: 0.2,
    animateY: -60,
  },
  {
    name: "PETTERI KOPONEN",
    quote: "The environment matters more than people realize. Founders House gets this right—it's about surrounding yourself with people who are building the future.",
    imageUrl: "/Legends Day Still 002.webp",
    nameColor: "dark-red",
    delay: 0.3,
    animateY: 60,
  },
  {
    name: "MIKKO KODISOJA",
    quote: "Founders House is doing something essential for the startup ecosystem that nobody else is doing right.",
    imageUrl: "/Legends Day Still 014.webp",
    nameColor: "white",
    delay: 0.4,
    animateY: 60,
  },
  {
    name: "ELINA BERGROTH",
    quote: "I'm putting my money and reputation behind this because it's exactly what the next generation needs to succeed.",
    imageUrl: "/The Legends Day.webp",
    nameColor: "dark-red",
    delay: 0.5,
    animateY: -60,
  },
  {
    name: "TUOMAS ARTMAN",
    quote: "This is exactly the kind of concentrated energy and support that turns ideas into companies that matter.",
    imageUrl: "/Wave x Maki Photo (2).webp",
    nameColor: "light-red",
    delay: 0.6,
    animateY: 60,
  },
]
