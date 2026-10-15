/** Colunas que as rotas da API aceitam gravar em cada tabela. */
export const PRODUCT_FIELDS = [
  'name', 'slug', 'description', 'price', 'promo_price', 'category_id', 'supplier_id',
  'is_active', 'is_featured', 'min_stock',
] as const

export const CUSTOMER_FIELDS = [
  'name', 'phone', 'whatsapp', 'email', 'document', 'cpf', 'address', 'city', 'state', 'zip_code', 'is_active',
] as const

export const SUPPLIER_FIELDS = [
  'name', 'contact', 'phone', 'email', 'address', 'notes', 'is_active',
] as const

export const ORDER_FIELDS = [
  'customer_id', 'status', 'payment_method', 'origin', 'notes',
] as const

export const CATEGORY_FIELDS = ['name', 'slug', 'description', 'is_active'] as const

export const STORE_SETTINGS_FIELDS = [
  'store_name', 'whatsapp', 'banner_title', 'banner_subtitle', 'banner_url', 'logo_url', 'primary_color', 'instagram', 'facebook',
] as const
