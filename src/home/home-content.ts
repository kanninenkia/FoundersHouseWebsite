// ============================================================
// HOME PAGE CONTENT
// ============================================================
// This file contains all the editable text content for the Home page.
// Non-developers: Simply edit the text between the quotes.
// Save the file after making changes - no coding knowledge required!

export interface QuoteCardData {
  name: string
  quote: string
  imageUrl: string
  nameColor: 'white' | 'dark-red' | 'light-red'
  delay: number
  animateY: number // Alternating up/down animation
}

export const homeContent = {
  // Hero section: Main animated text (4 lines)
  hero: {
    line1: "WE BRING EXCEPTIONAL YOUNG",
    line2: "TALENT UNDER ONE ROOF,",
    line3: "WHERE AMBITION CONCENTRATES",
    line4: "AND POTENTIAL MULTIPLIES.",
  },

  // Quote cards: Testimonials from supporters
  quotes: [
    {
      name: "ILKKA PAANANEN",
      quote: "I'm backing Founders House because every serious founder deserves the environment we had in our early days.",
      imageUrl: "/assets/images/team/ilkka.webp",
      nameColor: "light-red" as const,
      delay: 0.1,
      animateY: 60,
    },
    {
      name: "MARIANNE VIKKULA",
      quote: "I believe the next Oura, Supercell and Wolt will be built at Founder House. It’s never been a better time to start.",
      imageUrl: "/assets/images/team/marianne_vikkula.jpg",
      nameColor: "white" as const,
      delay: 0.2,
      animateY: -60,
    },
    {
      name: "TIMO AHOPELTO",
      quote: "The environment matters more than people realize. Founders House gets this right—it's about surrounding yourself with people who are building the future.",
      imageUrl: "/assets/images/team/timo.webp",
      nameColor: "dark-red" as const,
      delay: 0.3,
      animateY: 60,
    },
    {
      name: "EERIKA SAVOLAINEN",
      quote: "To be successful early on, a startup needs energy and excitement to keep moving, and Founders House is something that can really bring that to early-stage teams.",
      imageUrl: "/assets/images/team/eerika_savolainen.jpeg",
      nameColor: "white" as const,
      delay: 0.4,
      animateY: 60,
    },
    {
      name: "KRISTO OVASKA",
      quote: "Finland has exceptional talent, but the strongest companies are built when ambitious founders are surrounded by peers who push them forward every single day. Founders House creates that kind of environment",
      imageUrl: "/assets/images/team/kristo_ovaska.jpeg",
      nameColor: "dark-red" as const,
      delay: 0.5,
      animateY: -60,
    },
    {
      name: "RISTO SIILASMAA",
      quote: "Founders House has really great quality companies and founders. That’s a really good start for the community that they’re building here",
      imageUrl: "/assets/images/team/risto_siilasmaa.jpg",
      nameColor: "light-red" as const,
      delay: 0.6,
      animateY: 60,
    },
  ] as QuoteCardData[],

  // Values sections: Each section has a title and description
  values: {
    obsessive: {
      title: "OBSESSIVE",
      description: "For founders who think about their companies 24/7.",
    },
    ambitious: {
      title: "AMBITIOUS",
      description: "A space built for the rare few who operate at the 0.1% level.",
    },
    nextgen: {
      title: "NEXTGEN",
      description: "For the ones moving faster than everyone else.",
    },
    builders: {
      title: "BUILDERS",
      description: "For those who outpace their own ambition.",
    },
  },

  // Final CTA section
  join: {
    description: "Only a handful move fast enough to be here, and they build alongside the people who will define what comes next.",
    heading: "BUILD WITH US, MOVE FASTER, DEFINE TOMORROW.",
    buttonText: "JOIN",
  },
};
