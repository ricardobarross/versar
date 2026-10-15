export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  promo_price: number | null
  category_id: string | null
  supplier_id: string | null
  is_active: boolean
  is_featured: boolean
  slug: string | null
  created_at: string
  product_images?: ProductImage[]
  product_variations?: ProductVariation[]
  categories?: Category
}

export type ProductImage = {
  id: string
  product_id: string
  url: string
  order: number
}

export type ProductVariation = {
  id: string
  product_id: string
  color: string | null
  size: string | null
  stock: number
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
}

export type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  document: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  created_at: string
}

export type Supplier = {
  id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export type Order = {
  id: string
  customer_id: string | null
  status: 'new' | 'confirmed' | 'picking' | 'shipped' | 'delivered' | 'canceled'
  total: number
  payment_method: string | null
  origin: string
  created_at: string
  customers?: Customer
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  products?: Product
}

export type StoreSettings = {
  id: string
  store_name: string
  whatsapp: string | null
  banner_title: string | null
  banner_subtitle: string | null
  primary_color: string | null
  instagram: string | null
  facebook: string | null
  created_at: string
}

export type AccountPayable = {
  id: string
  description: string
  value: number
  due_date: string
  status: string
  created_at: string
}

export type StockMovement = {
  id: string
  product_id: string
  variation_id: string | null
  quantity: number
  movement_type: string
  created_at: string
}