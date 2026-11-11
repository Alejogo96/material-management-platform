/**
 * Carga datos de ejemplo para la demo: equipo de Andy Electric, bodega y vans,
 * catálogo con alias de jerga, proyectos y pedidos.
 *
 * Uso: npm run db:seed   (requiere DATABASE_URL en .env.local)
 *
 * El catálogo viene del prototipo anterior del repo. Se reemplaza por
 * materiales y precios reales cuando tengamos las facturas de los suppliers.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as s from "./schema";
import catalog from "./data/catalog.json";
import { aliasesBySku } from "./data/aliases";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL. Copia .env.example como .env.local y llénalo.");
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema: s });

  await db.transaction(async (tx) => {
    const [company] = await tx.insert(s.companies).values({ name: "Andy Electric" }).returning();
    const companyId = company.id;

    // Equipo (los usuarios reales se crean al iniciar sesión por primera vez)
    const people = [
      { fullName: "Miguel Salomón", roles: ["owner", "manager"] },
      { fullName: "Andrés Lira", roles: ["owner", "manager"] },
      { fullName: "El Niño", roles: ["manager"] },
      { fullName: "Alex", roles: ["manager"] },
      { fullName: "Jimmy", roles: ["warehouse"] },
      { fullName: "Clara", roles: ["purchasing"] },
      { fullName: "Karina", roles: ["purchasing"] },
      { fullName: "Líder Van 1", roles: ["van_leader"] },
      { fullName: "Líder Van 2", roles: ["van_leader"] },
      { fullName: "Líder Van 3", roles: ["van_leader"] },
      { fullName: "Líder Van 4", roles: ["van_leader"] },
      { fullName: "Líder Van 5", roles: ["van_leader"] },
    ] as const;
    const users: Record<string, string> = {};
    for (const p of people) {
      const [u] = await tx.insert(s.users).values({ companyId, fullName: p.fullName }).returning();
      users[p.fullName] = u.id;
      await tx.insert(s.userRoles).values(p.roles.map((role) => ({ userId: u.id, role })));
    }

    // Bodega y vans
    const [warehouse] = await tx
      .insert(s.locations)
      .values({ companyId, kind: "warehouse", name: "Bodega principal", responsibleUserId: users["Jimmy"] })
      .returning();
    const vans = await tx
      .insert(s.locations)
      .values([1, 2, 3, 4, 5].map((n) => ({ companyId, kind: "van" as const, name: `Van ${n}`, responsibleUserId: users[`Líder Van ${n}`] })))
      .returning();

    const [supplier] = await tx.insert(s.suppliers).values({ companyId, name: "City Electric Supply" }).returning();

    // Catálogo + alias + stock inicial
    const bySku: Record<string, string> = {};
    for (const m of catalog) {
      const [mat] = await tx
        .insert(s.materials)
        .values({ companyId, sku: m.sku, name: m.name, category: m.category, unit: m.unit, description: m.description, avgCost: String(m.unitCost) })
        .returning();
      bySku[m.sku] = mat.id;
      const aliases = aliasesBySku[m.sku] ?? [];
      if (aliases.length) await tx.insert(s.materialAliases).values(aliases.map((alias) => ({ materialId: mat.id, alias, source: "manual" })));
      await tx.insert(s.supplierRefs).values({ materialId: mat.id, supplierId: supplier.id, supplierSku: m.sku, lastPrice: String(m.unitCost) });
      await tx.insert(s.stockMinimums).values({ locationId: warehouse.id, materialId: mat.id, minQty: String(m.minStock) });
      if (m.stock > 0)
        await tx.insert(s.movements).values({
          companyId, kind: "receipt", materialId: mat.id, qty: String(m.stock), toLocationId: warehouse.id,
          unitCost: String(m.unitCost), userId: users["Jimmy"], note: "Inventario inicial",
        });
    }

    // Caja de emergencia de cada van
    const vanBox = ["SQD-QO120", "SQD-QO115", "3M-Y1-100PK", "TnB-5133-12", "CAR-B114A"];
    for (const van of vans)
      for (const sku of vanBox) {
        await tx.insert(s.stockMinimums).values({ locationId: van.id, materialId: bySku[sku], minQty: "2", targetQty: "4" });
        await tx.insert(s.movements).values({
          companyId, kind: "transfer", materialId: bySku[sku], qty: "4", fromLocationId: warehouse.id, toLocationId: van.id,
          userId: users["Jimmy"], note: "Carga inicial caja de emergencia",
        });
      }

    // Proyectos de ejemplo
    const [oak] = await tx.insert(s.projects).values({
      companyId, code: "P-001", name: "Remodelación Oak St", kind: "project", status: "active",
      clientName: "Cliente Oak St", address: "1420 Oak St", managerId: users["Alex"], materialBudget: "6500", laborBudget: "9000",
    }).returning();
    const [maple] = await tx.insert(s.projects).values({
      companyId, code: "P-002", name: "Casa Maple Dr", kind: "project", status: "estimating",
      clientName: "Cliente Maple Dr", address: "88 Maple Dr", managerId: users["El Niño"], materialBudget: "18400", laborBudget: "22000",
    }).returning();
    await tx.insert(s.projects).values({
      companyId, code: "SC-001", name: "Service call · 88 Elm Ave", kind: "service_call", status: "active",
      address: "88 Elm Ave", managerId: users["Alex"],
    });

    await tx.insert(s.projectEstimates).values([
      { projectId: maple.id, materialId: bySku["ALD-EMT-34-10"], qty: "30", unitCost: "6.25" },
      { projectId: maple.id, materialId: bySku["SW-NMB-122-250"], qty: "4", unitCost: "119.75" },
      { projectId: maple.id, materialId: bySku["SQD-QO130L200PG"], qty: "1", unitCost: "285" },
      { projectId: maple.id, materialId: bySku["SQD-QO120"], qty: "24", unitCost: "9.5" },
    ]);

    // Un pedido diario con una línea en texto libre (para mostrar la conciliación)
    const [req] = await tx.insert(s.materialRequests).values({
      companyId, number: 1042, projectId: oak.id, kind: "daily", status: "sent", requestedById: users["Líder Van 2"],
    }).returning();
    await tx.insert(s.requestLines).values([
      { requestId: req.id, materialId: bySku["ALD-EMT-34-10"], qtyRequested: "20" },
      { requestId: req.id, materialId: bySku["SW-THHN-12BK-500"], qtyRequested: "1" },
      { requestId: req.id, materialId: bySku["TnB-5133-34"], qtyRequested: "12" },
      { requestId: req.id, freeText: "breaker de 20 doble", qtyRequested: "2" },
    ]);
  });

  await client.end();
  console.log("Datos de ejemplo cargados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
