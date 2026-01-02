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
  title: "Moumousse Pet Sitting - Garde d'animaux | Chiens, Chats & NAC",
  description:
    "Service de garde d'animaux à domicile à Pélussin et alentours. Visites, promenades canines, soins pour chiens, chats et NAC. Steffie, pet sitter passionnée et diplômée.",
  image: '/moumousse-malisse.webp',
  imageAlt: "Moumousse Pet Sitting - Garde d'animaux professionnelle à Pélussin et alentours",
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
  location: {
    city: 'Pélussin',
    region: 'Loire',
    postalCode: '42410',
    country: 'France',
  },
}
