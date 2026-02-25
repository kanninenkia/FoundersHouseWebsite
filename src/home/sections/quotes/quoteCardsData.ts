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
    imageUrl: "/assets/images/team/ilkka.webp",
    nameColor: "light-red",
    delay: 0.1,
    animateY: 60,
  },
  {
    name: "MARIANNE VIKKULA",
    quote: "I believe the next Oura, Supercell and Wolt will be built at Founder House. It's never been a better time to start.",
    imageUrl: "/assets/images/team/marianne_vikkula.jpg",
    nameColor: "white",
    delay: 0.2,
    animateY: -60,
  },
  {
    name: "TIMO AHOPELTO",
    quote: "Founders House has it all: right people and excitement to build the future!",
    imageUrl: "/assets/images/team/timo.webp",
    nameColor: "dark-red",
    delay: 0.3,
    animateY: 60,
  },
  {
    name: "EERIKA SAVOLAINEN",
    quote: "To be successful early on, a startup needs energy and excitement to keep moving, and Founders House is something that can really bring that to early-stage teams.",
    imageUrl: "/assets/images/team/eerika_savolainen.jpeg",
    nameColor: "white",
    delay: 0.4,
    animateY: 60,
  },
  {
    name: "KRISTO OVASKA",
    quote: "Finland has exceptional talent, but the strongest companies are built when ambitious founders are surrounded by peers who push them forward every single day. Founders House creates that kind of environment",
    imageUrl: "/assets/images/team/kristo_ovaska.jpeg",
    nameColor: "dark-red",
    delay: 0.5,
    animateY: -60,
  },
  {
    name: "RISTO SIILASMAA",
    quote: "Founders House has really great quality companies and founders. That's a really good start for the community that they're building here",
    imageUrl: "/assets/images/team/risto_siilasmaa.jpg",
    nameColor: "light-red",
    delay: 0.6,
    animateY: 60,
  },
]