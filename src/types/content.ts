export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  image: string
  category: 'Technology' | 'Artificial Intelligence' | 'Research' | 'Healthcare' | 'Business' | 'Education' | 'Events'
  author: string
  authorRole: string
  authorAvatar: string
  publishedAt: string
  readingTime: number
  tags: string[]
  featured?: boolean
  status?: 'PUBLISHED' | 'DRAFT'
  views?: number
}

export const BLOG_CATEGORIES = ['All', 'Technology', 'Artificial Intelligence', 'Research', 'Healthcare', 'Business', 'Education', 'Events'] as const
export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export interface CategoryItem {
  id: string
  name: string
  slug: string
  iconName: 'Cpu' | 'Bot' | 'HeartPulse' | 'Cog' | 'Atom' | 'Briefcase' | 'GraduationCap' | 'BarChart3'
  conferenceCount: number
  description: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'General' | 'Registration' | 'Abstract Submission' | 'Speakers' | 'Payments' | 'Certificates' | 'Conferences'
  tags?: string[]
  order?: number
  status?: 'PUBLISHED' | 'DRAFT'
}
export const FAQ_CATEGORIES = ['All', 'General', 'Registration', 'Abstract Submission', 'Speakers', 'Payments', 'Certificates', 'Conferences'] as const
export type FAQCategory = (typeof FAQ_CATEGORIES)[number]

export interface GalleryItem {
  id: string
  src: string
  title: string
  category: 'Conferences' | 'Speakers' | 'Networking' | 'Workshops' | 'Awards'
  alt: string
  description?: string
  conferenceName?: string
  location?: string
  year?: string
  date?: string
  featured?: boolean
  status?: 'PUBLISHED' | 'DRAFT'
}
export const GALLERY_CATEGORIES = ['All', 'Conferences', 'Speakers', 'Networking', 'Workshops', 'Awards'] as const
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]

export interface StatisticItem {
  id: string
  value: string
  numericValue: number
  label: string
  description: string
  iconName: 'Calendar' | 'Globe' | 'Users' | 'GraduationCap'
}

export interface TestimonialItem {
  id: string
  quote: string
  name: string
  designation: string
  organization: string
  country: string
  image: string
  rating: number
  conferenceTitle?: string
}
