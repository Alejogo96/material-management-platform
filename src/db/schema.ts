/**
 * Modelo de datos de la plataforma de gestión de material.
 *
 * Idea central: el inventario NUNCA se edita a mano. Cada entrada, salida,
 * devolución o ajuste es un "movimiento", y el stock se calcula sumándolos.
 * Así queda trazado quién movió qué, cuándo y para qué proyecto.
 *
 * Todas las tablas llevan company_id para poder ofrecer la plataforma a otras
 * empresas en el futuro sin rehacer la base de datos.
 */
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", [
  "owner", // Dueño (Miguel, Andrés)
  "manager", // Manager (El Niño, Alex)
  "van_leader", // Líder de van
  "warehouse", // Bodega (Jimmy)
  "purchasing", // Compras / administración (Clara, Karina)
]);

export const projectKindEnum = pgEnum("project_kind", ["project", "service_call"]);
export const projectStatusEnum = pgEnum("project_status", [
  "estimating",
  "active",
  "paused",
  "closed",
]);

export const projectTypeEnum = pgEnum("project_type", ["rough_in", "trim", "both", "service_call", "other"]);
export const phaseStatusEnum = pgEnum("phase_status", ["pending", "in_progress", "done"]);
export const inspectionStatusEnum = pgEnum("inspection_status", ["pending", "passed", "failed"]);

export const locationKindEnum = pgEnum("location_kind", ["warehouse", "van"]);

export const requestKindEnum = pgEnum("request_kind", [
  "estimate", // Proyecto nuevo: lista inicial del manager
  "daily", // Proyecto en curso: pedido del líder para hoy/mañana
  "urgent", // Service call
  "quick_pickup", // Retiro rápido: tomé material sin Jimmy
]);
export const requestStatusEnum = pgEnum("request_status", [
  "draft",
  "sent",
  "preparing",
  "ready",
  "delivered",
  "partial",
  "closed",
  "cancelled",
]);

export const movementKindEnum = pgEnum("movement_kind", [
  "receipt", // entrada a bodega (compra recibida)
  "issue", // salida a un proyecto
  "return", // devolución de sobrante
  "transfer", // bodega ↔ van
  "adjustment", // conteo físico
  "van_use", // usé de la caja de la van
  "scrap_sale", // sobrante vendido a chatarrería
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "open", // faltante detectado
  "quoting", // Clara cotizando
  "pending_approval", // espera a Miguel o Karina
  "ordered", // OC enviada
  "received",
  "cancelled",
]);

// ── Empresa y usuarios ───────────────────────────────────────────────────
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(), // = auth.users.id de Supabase
    companyId: uuid("company_id").notNull().references(() => companies.id),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    email: text("email"),
    locale: text("locale").notNull().default("en"),
    /** Administradores: gestionan perfiles y límites (Andrés, Miguel, Jimmy, Karina). */
    isAdmin: boolean("is_admin").notNull().default(false),
    /** Equipo / van asignada. */
    teamId: uuid("team_id"),
    /** scrypt "salt:hash". Vacío = solo entra por el selector de demo. */
    passwordHash: text("password_hash"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_company_idx").on(t.companyId)],
);

/** Una persona puede tener varios roles (p. ej. Dueño que también gestiona proyectos). */
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] })],
);

// ── Ubicaciones (bodega y vans) ─────────────────────────────────────────
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  kind: locationKindEnum("kind").notNull(),
  name: text("name").notNull(),
  responsibleUserId: uuid("responsible_user_id").references(() => users.id),
});

// ── Proyectos y service calls ───────────────────────────────────────────
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    kind: projectKindEnum("kind").notNull().default("project"),
    status: projectStatusEnum("status").notNull().default("estimating"),
    clientName: text("client_name"),
    address: text("address"),
    managerId: uuid("manager_id").references(() => users.id),
    type: projectTypeEnum("type").notNull().default("rough_in"),
    typeOther: text("type_other"),
    vanId: uuid("van_id").references(() => locations.id),
    createdById: uuid("created_by_id").references(() => users.id),
    /** Presupuesto de material y de mano de obra (USD). El MVP compara solo material. */
    materialBudget: numeric("material_budget", { precision: 12, scale: 2 }),
    laborBudget: numeric("labor_budget", { precision: 12, scale: 2 }),
    startDate: date("start_date"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_company_code_uq").on(t.companyId, t.code)],
);

// ── Catálogo ─────────────────────────────────────────────────────────────
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
});

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    sku: text("sku").notNull(), // código interno
    name: text("name").notNull(), // nombre canónico
    category: text("category").notNull(),
    unit: text("unit").notNull(), // u, ft, caja, rollo…
    description: text("description"),
    avgCost: numeric("avg_cost", { precision: 12, scale: 4 }),
    active: boolean("active").notNull().default(true),
  },
  (t) => [uniqueIndex("materials_company_sku_uq").on(t.companyId, t.sku)],
);

/**
 * Nombres de jerga: "pipe 3/4", "tubo EMT 3/4", "3/4 EMT" → el mismo material.
 * Cuando Jimmy concilia un texto libre, el texto se guarda aquí (source = learned).
 */
export const materialAliases = pgTable(
  "material_aliases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    lang: text("lang"), // es, en, mix
    source: text("source").notNull().default("manual"), // manual | learned | supplier
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("material_aliases_material_idx").on(t.materialId)],
);

export const supplierRefs = pgTable(
  "supplier_refs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
    supplierSku: text("supplier_sku"),
    supplierDescription: text("supplier_description"),
    lastPrice: numeric("last_price", { precision: 12, scale: 4 }),
    lastPriceAt: date("last_price_at"),
  },
  (t) => [index("supplier_refs_material_idx").on(t.materialId)],
);

export const stockMinimums = pgTable(
  "stock_minimums",
  {
    locationId: uuid("location_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
    materialId: uuid("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
    minQty: numeric("min_qty", { precision: 12, scale: 2 }).notNull(),
    targetQty: numeric("target_qty", { precision: 12, scale: 2 }),
  },
  (t) => [primaryKey({ columns: [t.locationId, t.materialId] })],
);

// ── Pedidos de material (un solo objeto para los 4 flujos) ──────────────
export const materialRequests = pgTable(
  "material_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    number: integer("number").notNull(), // #1042
    projectId: uuid("project_id").notNull().references(() => projects.id),
    kind: requestKindEnum("kind").notNull(),
    status: requestStatusEnum("status").notNull().default("draft"),
    requestedById: uuid("requested_by_id").notNull().references(() => users.id),
    neededAt: timestamp("needed_at", { withTimezone: true }),
    note: text("note"),
    photoPath: text("photo_path"), // foto de la lista en papel (Supabase Storage)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("material_requests_company_number_uq").on(t.companyId, t.number),
    index("material_requests_project_idx").on(t.projectId),
  ],
);

export const requestLines = pgTable(
  "request_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().references(() => materialRequests.id, { onDelete: "cascade" }),
    /** null mientras sea texto libre sin conciliar. */
    materialId: uuid("material_id").references(() => materials.id),
    freeText: text("free_text"),
    qtyRequested: numeric("qty_requested", { precision: 12, scale: 2 }).notNull(),
    qtyDelivered: numeric("qty_delivered", { precision: 12, scale: 2 }).notNull().default("0"),
  },
  (t) => [index("request_lines_request_idx").on(t.requestId)],
);

// ── Movimientos: fuente de verdad del inventario y los costos ───────────
export const movements = pgTable(
  "movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    kind: movementKindEnum("kind").notNull(),
    materialId: uuid("material_id").notNull().references(() => materials.id),
    qty: numeric("qty", { precision: 12, scale: 2 }).notNull(), // siempre positivo; la dirección la dan from/to
    fromLocationId: uuid("from_location_id").references(() => locations.id),
    toLocationId: uuid("to_location_id").references(() => locations.id),
    projectId: uuid("project_id").references(() => projects.id),
    requestLineId: uuid("request_line_id").references(() => requestLines.id),
    purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
    unitCost: numeric("unit_cost", { precision: 12, scale: 4 }),
    userId: uuid("user_id").notNull().references(() => users.id),
    note: text("note"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("movements_material_idx").on(t.materialId),
    index("movements_project_idx").on(t.projectId),
  ],
);

/** Separa stock para un proyecto sin sacarlo de la bodega. */
export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  qty: numeric("qty", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Estimación de proyecto (base de estimado vs real) ───────────────────
export const projectEstimates = pgTable(
  "project_estimates",
  {
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    materialId: uuid("material_id").notNull().references(() => materials.id),
    qty: numeric("qty", { precision: 12, scale: 2 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 12, scale: 4 }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.materialId] })],
);

// ── Compras ──────────────────────────────────────────────────────────────
export const purchaseRequests = pgTable("purchase_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  materialId: uuid("material_id").notNull().references(() => materials.id),
  qty: numeric("qty", { precision: 12, scale: 2 }).notNull(),
  /** Proyectos que originaron el faltante, para repartir el costo real. */
  projectIds: uuid("project_ids").array().notNull().default([]),
  status: purchaseStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseRequestId: uuid("purchase_request_id").notNull().references(() => purchaseRequests.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  unitPrice: numeric("unit_price", { precision: 12, scale: 4 }).notNull(),
  leadTimeDays: integer("lead_time_days"),
  chosen: boolean("chosen").notNull().default(false),
  quotedAt: date("quoted_at").notNull().defaultNow(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  number: integer("number").notNull(),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  status: purchaseStatusEnum("status").notNull().default("pending_approval"),
  approvedById: uuid("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  total: numeric("total", { precision: 12, scale: 2 }),
  invoicePath: text("invoice_path"), // factura del supplier (PDF o foto)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Fases, revisiones e histórico de proyectos ──────────────────────────
export const projectPhases = pgTable("project_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  name: text("name").notNull(),
  spec: text("spec"),
  status: phaseStatusEnum("status").notNull().default("pending"),
});

export const projectInspections = pgTable("project_inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  phaseId: uuid("phase_id").references(() => projectPhases.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  dueDate: date("due_date"),
  status: inspectionStatusEnum("status").notNull().default("pending"),
});

/** Histórico del proyecto desde que nace: quién hizo qué y cuándo. */
export const projectEvents = pgTable(
  "project_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    kind: text("kind").notNull(), // created | status | lead | van | phase | inspection | request | delivery
    detail: text("detail").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("project_events_project_idx").on(t.projectId, t.createdAt)],
);

/** Límites configurables por los administradores. */
export const companySettings = pgTable("company_settings", {
  companyId: uuid("company_id").primaryKey().references(() => companies.id),
  approvalThreshold: numeric("approval_threshold", { precision: 12, scale: 2 }).notNull().default("500"),
  excessPct: integer("excess_pct").notNull().default(10),
  reminderHours: integer("reminder_hours").notNull().default(2),
});
