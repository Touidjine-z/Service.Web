import {
  Building2, Wrench, Package, UtensilsCrossed, Tags, ShoppingCart, ClipboardCheck,
  Hammer, Images, Quote, HelpCircle, Euro, Clock, MapPin, Mail, FileText,
  CalendarCheck, Share2, Tv, QrCode, Square, type LucideIcon,
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
}

export default function ModuleIcon({ id, size = 17 }: { id: ModuleId; size?: number }) {
  const Icon = ICONS[id] ?? Square
  return <Icon size={size} />
}
