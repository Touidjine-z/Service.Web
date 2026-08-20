import {
  Building2, Wrench, Package, UtensilsCrossed, Tags, ShoppingCart, ClipboardCheck,
  Hammer, Images, Quote, HelpCircle, Euro, Clock, MapPin, Mail, FileText,
  CalendarCheck, Share2, Tv, QrCode, Square, TrendingUp, Route, Users,
  BadgeCheck, SlidersHorizontal, Megaphone, Bike, ChefHat, Percent, Store,
  Wheat, Gift, Filter, ListOrdered, HandCoins, type LucideIcon,
  Video, Newspaper, CalendarDays, Briefcase, FileDown, ShieldCheck, MapPinned, Mailbox,
} from 'lucide-react'
import type { ModuleId } from '@/engine/types'

/**
 * Table explicite plutot qu'un `import * as Icons` : la version barrel embarque
 * l'integralite de lucide-react dans le bundle (cf. §51).
 */
const ICONS: Record<ModuleId, LucideIcon> = {
  about: Building2,
  services: Wrench,
  products: Package,
  menu: UtensilsCrossed,
  categories: Tags,
  cart: ShoppingCart,
  order: ClipboardCheck,
  ordermodes: Bike,
  formulas: ChefHat,
  offers: Percent,
  venues: Store,
  allergens: Wheat,
  loyalty: Gift,
  portfolio: Hammer,
  gallery: Images,
  testimonials: Quote,
  faq: HelpCircle,
  pricing: Euro,
  hours: Clock,
  location: MapPin,
  contact: Mail,
  quote: FileText,
  booking: CalendarCheck,
  social: Share2,
  tv: Tv,
  qrcode: QrCode,
  stats: TrendingUp,
  process: Route,
  team: Users,
  logos: BadgeCheck,
  beforeafter: SlidersHorizontal,
  banner: Megaphone,
  finder: Filter,
  program: ListOrdered,
  funding: HandCoins,
  video: Video,
  news: Newspaper,
  events: CalendarDays,
  jobs: Briefcase,
  documents: FileDown,
  certifications: ShieldCheck,
  coverage: MapPinned,
  newsletter: Mailbox,
}

export default function ModuleIcon({ id, size = 17 }: { id: ModuleId; size?: number }) {
  const Icon = ICONS[id] ?? Square
  return <Icon size={size} />
}
