import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Seeding Loopnow CPA Copilot database...");

  // --------------------------------------------------
  // GIFI CODES
  // --------------------------------------------------

  const gifiCodes = [
    {
      code: "8810",
      description: "Office expenses",
      category: "Office Expenses",
      parent: null,
      applicableExpenseTypes: "OFFICE",
      confidence: 1.0,
      source: "CRA GIFI",
    },
    {
      code: "8523",
      description: "Meals and entertainment",
      category: "Meals",
      parent: null,
      applicableExpenseTypes: "MEALS,ENTERTAINMENT",
      confidence: 1.0,
      source: "CRA GIFI",
    },
    {
      code: "1001",
      description: "Cash",
      category: "Cash",
      parent: null,
      applicableExpenseTypes: "CASH",
      confidence: 1.0,
      source: "CRA GIFI",
    },
  ];

  for (const gifi of gifiCodes) {
    await prisma.gifiCode.upsert({
      where: {
        code: gifi.code,
      },
      update: {
        description: gifi.description,
        category: gifi.category,
        parent: gifi.parent,
        applicableExpenseTypes: gifi.applicableExpenseTypes,
        confidence: gifi.confidence,
        source: gifi.source,
      },
      create: gifi,
    });
  }

  // --------------------------------------------------
  // COMPLIANCE RULES
  // --------------------------------------------------

  const rules = [
    {
      ruleCode: "CRA_RULESET_VERSION",
      name: "CRA Rule Set",
      description: "Configured CRA bookkeeping and GST/HST rule set.",
      ruleVersion: "2026.09.1",
      source: "CRA",
    },
    {
      ruleCode: "ITC_MEALS_STANDARD",
      name: "Standard Business Meal ITC",
      description:
        "Standard business meals are subject to the configured 50% ITC limitation.",
      ruleVersion: "2026.09.1",
      source: "CRA",
    },
    {
      ruleCode: "DOCUMENTATION_TIER_1",
      name: "Documentation Tier 1",
      description:
        "Receipts under $30 follow the configured Tier 1 documentation requirements.",
      ruleVersion: "2026.09.1",
      source: "CRA",
    },
    {
      ruleCode: "DOCUMENTATION_TIER_2",
      name: "Documentation Tier 2",
      description:
        "Receipts from $30 to under $150 follow the configured Tier 2 documentation requirements.",
      ruleVersion: "2026.09.1",
      source: "CRA",
    },
    {
      ruleCode: "DOCUMENTATION_TIER_3",
      name: "Documentation Tier 3",
      description:
        "Receipts of $150 or more follow the configured Tier 3 documentation requirements.",
      ruleVersion: "2026.09.1",
      source: "CRA",
    },
  ];

  for (const rule of rules) {
    await prisma.complianceRule.upsert({
      where: {
        ruleCode: rule.ruleCode,
      },
      update: {
        name: rule.name,
        description: rule.description,
        ruleVersion: rule.ruleVersion,
        source: rule.source,
      },
      create: rule,
    });
  }

  // --------------------------------------------------
  // RECEIPT A — Staples Canada
  // --------------------------------------------------

  await prisma.receipt.upsert({
    where: {
      id: "receipt-staples-2026-09-18",
    },
    update: {},
    create: {
      id: "receipt-staples-2026-09-18",
      vendorName: "Staples Canada",
      receiptDate: new Date("2026-09-18"),
      subtotal: 82.0,
      taxAmount: 4.1,
      totalAmount: 86.1,
      taxType: "GST",
      gstHstNumber: "PRESENT",
      commercialUsePercent: 100,
      description: "Office supplies",
      status: "PENDING",
      processingStage: "IDLE",
      documentationStatus: "SUFFICIENT",
      gstNumberStatus: "VALID_FORMAT",
    },
  });

  // --------------------------------------------------
  // RECEIPT B — Restaurant ABC
  // --------------------------------------------------

  await prisma.receipt.upsert({
    where: {
      id: "receipt-restaurant-abc-2026-09",
    },
    update: {},
    create: {
      id: "receipt-restaurant-abc-2026-09",
      vendorName: "Restaurant ABC",
      receiptDate: new Date("2026-09-19"),
      subtotal: 240.0,
      taxAmount: 12.0,
      totalAmount: 252.0,
      taxType: "GST",
      gstHstNumber: "PRESENT",
      commercialUsePercent: 100,
      description: "Business meal",
      status: "PENDING",
      processingStage: "IDLE",
      documentationStatus: "SUFFICIENT",
      gstNumberStatus: "VALID_FORMAT",
    },
  });

  // --------------------------------------------------
  // RECEIPT C — Unknown Vendor
  // --------------------------------------------------

  await prisma.receipt.upsert({
    where: {
      id: "receipt-unknown-vendor-2026-09",
    },
    update: {},
    create: {
      id: "receipt-unknown-vendor-2026-09",
      vendorName: "Unknown Vendor",
      receiptDate: new Date("2026-09-20"),
      subtotal: 1200.0,
      taxAmount: 60.0,
      totalAmount: 1260.0,
      taxType: "GST",
      gstHstNumber: null,
      commercialUsePercent: 100,
      description: "Vendor documentation incomplete",
      status: "REVIEW_REQUIRED",
      processingStage: "REVIEW",
      documentationStatus: "MISSING",
      gstNumberStatus: "MISSING",
    },
  });

  // --------------------------------------------------
  // RECEIPT D — Cash Deposit
  // --------------------------------------------------

  await prisma.receipt.upsert({
    where: {
      id: "receipt-cash-deposit-2026-09",
    },
    update: {},
    create: {
      id: "receipt-cash-deposit-2026-09",
      vendorName: "Cash Deposit",
      receiptDate: new Date("2026-09-21"),
      subtotal: 5000.0,
      taxAmount: 0,
      totalAmount: 5000.0,
      taxType: null,
      gstHstNumber: null,
      commercialUsePercent: 0,
      description: "Cash deposit — not an expense",
      status: "PENDING",
      processingStage: "IDLE",
      documentationStatus: "SUFFICIENT",
      gstNumberStatus: "UNKNOWN",
    },
  });

  console.log("✅ GIFI codes seeded");
  console.log("✅ CRA rules seeded");
  console.log("✅ Receipt A seeded");
  console.log("✅ Receipt B seeded");
  console.log("✅ Receipt C seeded");
  console.log("✅ Receipt D seeded");
  console.log("🌱 Database seeding completed");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });