export interface SEOConfig {
  title: string
  description: string
  image?: string
  imageAlt?: string
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
  type?: 'website' | 'article' | 'profile'
  author?: string
}

export const defaultSEO: SEOConfig = {
  title: 'Moumousse Pet Sitting - Garde d\'animaux à Pélussin (42) | Chiens, Chats & NAC',
  description:
    'Service professionnel de garde d\'animaux à domicile à Pélussin et alentours (42). Visites, promenades canines, soins pour chiens, chats et NAC. Steffie, pet sitter passionnée et diplômée.',
  image: '/og-image.png',
  imageAlt: 'Moumousse Pet Sitting - Garde d\'animaux professionnelle à Pélussin',
  type: 'website',
  author: 'Steffie Thollot - Moumousse Pet Sitting',
}

export const siteMeta = {
  name: 'Moumousse Pet Sitting',
  url: 'https://moumousse-pet-sitting.fr',
  locale: 'fr_FR',
  businessName: 'Moumousse Pet Sitting',
  ownerName: 'Steffie Thollot',
  email: 'contact@moumousse-pet-sitting.fr',
  phone: '+33', // À compléter avec le vrai numéro
  location: {
    city: 'Pélussin',
    region: 'Loire',
    postalCode: '42410',
    country: 'France',
    coordinates: {
      latitude: 45.4186,
      longitude: 4.6836,
    },
  },
  social: {
    // À compléter si présent
    facebook: '',
    instagram: '',
  },
}
