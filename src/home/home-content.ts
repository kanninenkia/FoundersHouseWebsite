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
      name: "MIKI KUUSI",
      quote: "This is what the startup ecosystem needs—a place where founders can focus on building without the usual distractions.",
      imageUrl: "/assets/images/team/miki.webp",
      nameColor: "white" as const,
      delay: 0.2,
      animateY: -60,
    },
    {
      name: "PETTERI KOPONEN",
      quote: "The environment matters more than people realize. Founders House gets this right—it's about surrounding yourself with people who are building the future.",
      imageUrl: "/assets/images/team/petteri.webp",
      nameColor: "dark-red" as const,
      delay: 0.3,
      animateY: 60,
    },
    {
      name: "MIKKO KODISOJA",
      quote: "Founders House is doing something essential for the startup ecosystem that nobody else is doing right.",
      imageUrl: "/assets/images/team/mikko.webp",
      nameColor: "white" as const,
      delay: 0.4,
      animateY: 60,
    },
    {
      name: "ELINA BERGROTH",
      quote: "I'm putting my money and reputation behind this because it's exactly what the next generation needs to succeed.",
      imageUrl: "/assets/images/team/ilkka.webp",
      nameColor: "dark-red" as const,
      delay: 0.5,
      animateY: -60,
    },
    {
      name: "TUOMAS ARTMAN",
      quote: "This is exactly the kind of concentrated energy and support that turns ideas into companies that matter.",
      imageUrl: "/assets/images/team/tuomas.webp",
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
