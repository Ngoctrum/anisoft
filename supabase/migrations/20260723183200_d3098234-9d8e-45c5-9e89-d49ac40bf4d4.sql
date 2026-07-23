
-- ========= nexus_categories =========
CREATE TABLE public.nexus_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nexus_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nexus_categories TO authenticated;
GRANT ALL ON public.nexus_categories TO service_role;
ALTER TABLE public.nexus_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.nexus_categories FOR SELECT USING (true);
CREATE POLICY "admin manage categories" ON public.nexus_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER nexus_categories_updated BEFORE UPDATE ON public.nexus_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========= nexus_products =========
CREATE TABLE public.nexus_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_slug TEXT NOT NULL REFERENCES public.nexus_categories(slug) ON UPDATE CASCADE,
  short_description TEXT,
  description TEXT,
  image_url TEXT,
  plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge TEXT,
  warranty TEXT,
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nexus_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nexus_products TO authenticated;
GRANT ALL ON public.nexus_products TO service_role;
ALTER TABLE public.nexus_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.nexus_products FOR SELECT USING (true);
CREATE POLICY "admin manage products" ON public.nexus_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER nexus_products_updated BEFORE UPDATE ON public.nexus_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========= nexus_orders =========
CREATE TABLE public.nexus_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.nexus_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_channel TEXT NOT NULL DEFAULT 'zalo',
  contact_value TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.nexus_orders TO anon, authenticated;
GRANT UPDATE, DELETE ON public.nexus_orders TO authenticated;
GRANT ALL ON public.nexus_orders TO service_role;
ALTER TABLE public.nexus_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can create order" ON public.nexus_orders FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "user reads own order" ON public.nexus_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "admin manage orders" ON public.nexus_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER nexus_orders_updated BEFORE UPDATE ON public.nexus_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
