export interface SEOConfig {
  title: string
  description: string
  image?: string
  imageAlt?: string
  noindex?: boolean
  nofollow?: boolean
  type?: 'website' | 'article' | 'profile'
  author?: string
}

export const siteConfig = {
  bookPrevisiteUrl: 'https://calendly.com/steffiethollot/30min',

  contact: {
    encodedPhone: '@HWPjD}PjfGQj\\GQj\\GP',
    email: 'contact@moumousse-pet-sitting.fr',
  },

  social: {
    instagram: 'https://www.instagram.com/moumoussepetsitting/',
    facebook: 'https://www.facebook.com/p/Moumousse-Pet-Sitting-61586131220302/',
  },

  business: {
    name: 'Moumousse Pet Sitting',
    ownerName: 'Steffie Thollot',
    siret: '994 642 205 00011',
  },

  seo: {
    title: "Moumousse Pet Sitting - Garde d'animaux à Pélussin (42) | Chiens, Chats & NAC",
    description:
      "Service professionnel de garde d'animaux à domicile à Pélussin et alentours (42). Visites, promenades canines, soins pour chiens, chats et NAC. Steffie, pet sitter passionnée et diplômée.",
    image: '/moumousse-malisse.webp',
    imageAlt: "Moumousse Pet Sitting - Garde d'animaux professionnelle à Pélussin",
    noindex: false,
    nofollow: false,
    type: 'website',
    author: 'Steffie Thollot - Moumousse Pet Sitting',
    url: 'https://moumousse-pet-sitting.fr',
    locale: 'fr_FR',
    location: {
      city: 'Pélussin',
      region: 'Loire',
      postalCode: '42410',
      regionCode: 'FR-42',
      country: 'France',
    },
  },

  pricing: {
    zones: {
      zone1: '0-10km',
      zone2: '10-15km',
      zone3: '15-20km',
    },
    visit: {
      zone1: 13,
      zone2: 15,
      zone3: 17,
      additionalAnimal: 5, // 5€ supplémentaires par animal par visite
    },
    walking: {
      zone1: { '1h': 18, '1h30': 23, '2h': 28 },
      zone2: { '1h': 20, '1h30': 25, '2h': 30 },
      zone3: { '1h': 22, '1h30': 27, '2h': 32 },
    },
  },
} as const
