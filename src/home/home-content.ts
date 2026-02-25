// ============================================================
// HOME PAGE CONTENT
// ============================================================
// This file contains all the editable text content for the Home page.
// Non-developers: Simply edit the text between the quotes.
// Save the file after making changes - no coding knowledge required!

import { quoteCardsData } from './sections/quotes/quoteCardsData'

export const homeContent = {
  // Hero section: Main animated text (4 lines)
  hero: {
    line1: "WE BRING EXCEPTIONAL YOUNG",
    line2: "TALENT UNDER ONE ROOF,",
    line3: "WHERE AMBITION CONCENTRATES",
    line4: "AND POTENTIAL MULTIPLIES.",
  },

  // Quote cards: Testimonials from supporters
  quotes: quoteCardsData,

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
