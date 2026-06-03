-- Initial schema for KMB business management app
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  role text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_types text,
  country text,
  currency text DEFAULT 'ZMW',
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products / Services
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  product_type text,
  brand text,
  category text,
  season text,
  volume text,
  concentration text,
  team text,
  size text,
  sleeve_type text,
  gender text,
  model text,
  status text DEFAULT 'active',
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_cost numeric(12,2) NOT NULL DEFAULT 0,
  cost_currency text DEFAULT 'ZMW',
  cost_total_zmw numeric(12,2) DEFAULT 0,
  price numeric(12,2) NOT NULL DEFAULT 0,
  price_currency text DEFAULT 'ZMW',
  price_zmw numeric(12,2) DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  reorder_threshold integer NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  attributes jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 0,
  status text DEFAULT 'requested',
  shipping_status text DEFAULT 'pending',
  total_cost numeric(12,2) DEFAULT 0,
  expected_delivery_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  movement_type text NOT NULL DEFAULT 'adjustment',
  quantity integer NOT NULL DEFAULT 0,
  source text,
  destination text,
  related_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  note text,
  movement_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Shipping records
CREATE TABLE IF NOT EXISTS shipping_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  carrier text,
  tracking_number text,
  status text DEFAULT 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  status text DEFAULT 'draft',
  total numeric(12,2) DEFAULT 0,
  issued_at timestamptz DEFAULT now(),
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_at timestamptz DEFAULT now(),
  method text,
  created_at timestamptz DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES employees(id) ON DELETE SET NULL,
  status text DEFAULT 'open',
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
