import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  createBill,
  createInvoice,
  recordBillPayment,
  recordInvoicePayment,
} from "../src/lib/services/documents";
import { postJournalEntry } from "../src/lib/accounting";

const prisma = new PrismaClient();

type AccountSeed = {
  code: string;
  name: string;
  type: string;
  subtype?: string;
  isSystem?: boolean;
  description?: string;
};

const CHART_OF_ACCOUNTS: AccountSeed[] = [
  // Assets
  { code: "1000", name: "Cash on Hand", type: "ASSET", subtype: "CASH" },
  { code: "1010", name: "Business Bank Account", type: "ASSET", subtype: "BANK", isSystem: true, description: "Default account for deposits and payments" },
  { code: "1200", name: "Accounts Receivable", type: "ASSET", subtype: "ACCOUNTS_RECEIVABLE", isSystem: true, description: "Money owed to you by customers" },
  { code: "1300", name: "Inventory", type: "ASSET", subtype: "INVENTORY" },
  { code: "1400", name: "Prepaid Expenses", type: "ASSET" },
  { code: "1500", name: "Office Equipment", type: "ASSET", subtype: "FIXED_ASSET" },
  // Liabilities
  { code: "2000", name: "Accounts Payable", type: "LIABILITY", subtype: "ACCOUNTS_PAYABLE", isSystem: true, description: "Money you owe to vendors" },
  { code: "2100", name: "Sales Tax Payable", type: "LIABILITY", subtype: "SALES_TAX_PAYABLE", isSystem: true, description: "Sales tax collected on invoices" },
  { code: "2200", name: "Credit Card", type: "LIABILITY" },
  { code: "2400", name: "Loans Payable", type: "LIABILITY" },
  // Equity
  { code: "3000", name: "Owner's Equity", type: "EQUITY" },
  { code: "3100", name: "Owner's Drawings", type: "EQUITY" },
  { code: "3900", name: "Retained Earnings", type: "EQUITY", subtype: "RETAINED_EARNINGS", isSystem: true },
  // Income
  { code: "4000", name: "Sales Revenue", type: "INCOME", subtype: "SALES", isSystem: true, description: "Default income account" },
  { code: "4100", name: "Consulting Revenue", type: "INCOME" },
  { code: "4200", name: "Other Income", type: "INCOME" },
  // Expenses
  { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE", subtype: "COGS" },
  { code: "6000", name: "Operating Expenses", type: "EXPENSE", subtype: "OPERATING_EXPENSE", isSystem: true, description: "Default expense account" },
  { code: "6100", name: "Rent Expense", type: "EXPENSE" },
  { code: "6200", name: "Utilities", type: "EXPENSE" },
  { code: "6300", name: "Salaries & Wages", type: "EXPENSE" },
  { code: "6400", name: "Office Supplies", type: "EXPENSE" },
  { code: "6500", name: "Marketing & Advertising", type: "EXPENSE" },
  { code: "6600", name: "Software & Subscriptions", type: "EXPENSE" },
  { code: "6700", name: "Travel & Meals", type: "EXPENSE" },
  { code: "6800", name: "Bank Fees", type: "EXPENSE" },
  { code: "6900", name: "Depreciation Expense", type: "EXPENSE" },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  return daysAgo(-n);
}

async function main() {
  console.log("Resetting data…");
  await prisma.payment.deleteMany();
  await prisma.journalLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.billLine.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.account.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating organisation & user…");
  await prisma.organization.create({
    data: {
      name: "Northwind Studio",
      legalName: "Northwind Studio LLC",
      email: "hello@northwind.studio",
      phone: "+1 (555) 248-1100",
      website: "https://northwind.studio",
      address: "742 Market Street, Suite 300\nSan Francisco, CA 94102",
      taxNumber: "US-984-221-007",
      currency: "USD",
      currencySymbol: "$",
      invoicePrefix: "INV-",
      billPrefix: "BILL-",
      defaultTaxRate: 8.5,
      invoiceTerms: "Payment due within 30 days. Thank you for your business!",
    },
  });

  await prisma.user.create({
    data: {
      name: "Demo Accountant",
      email: "demo@ledgerly.app",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "OWNER",
    },
  });

  console.log("Seeding chart of accounts…");
  for (const a of CHART_OF_ACCOUNTS) {
    await prisma.account.create({
      data: {
        code: a.code,
        name: a.name,
        type: a.type,
        subtype: a.subtype ?? null,
        isSystem: a.isSystem ?? false,
        description: a.description ?? null,
      },
    });
  }

  const acc = async (code: string) => {
    const a = await prisma.account.findFirst({ where: { code } });
    if (!a) throw new Error(`Account ${code} missing`);
    return a;
  };

  const sales = await acc("4000");
  const consulting = await acc("4100");
  const cogs = await acc("5000");
  const bank = await acc("1010");
  const ownerEquity = await acc("3000");

  console.log("Seeding products…");
  const website = await prisma.product.create({
    data: { name: "Website Design Package", sku: "SVC-WEB", type: "SERVICE", price: 3500, taxRate: 8.5, incomeAccountId: consulting.id },
  });
  const consultingHour = await prisma.product.create({
    data: { name: "Consulting (hourly)", sku: "SVC-HR", type: "SERVICE", price: 150, taxRate: 8.5, incomeAccountId: consulting.id },
  });
  const branding = await prisma.product.create({
    data: { name: "Brand Identity Kit", sku: "SVC-BRAND", type: "SERVICE", price: 1200, taxRate: 8.5, incomeAccountId: sales.id },
  });
  const hosting = await prisma.product.create({
    data: { name: "Managed Hosting (monthly)", sku: "SVC-HOST", type: "SERVICE", price: 99, taxRate: 8.5, incomeAccountId: sales.id, expenseAccountId: cogs.id },
  });

  console.log("Seeding customers & vendors…");
  const customers = await Promise.all(
    [
      { name: "Acme Corporation", email: "ap@acme.com", company: "Acme Corporation", phone: "+1 (555) 100-2000", address: "100 Industrial Way, Newark, NJ" },
      { name: "Globex Inc.", email: "billing@globex.com", company: "Globex Inc.", phone: "+1 (555) 200-3000", address: "1 Globex Plaza, Austin, TX" },
      { name: "Initech LLC", email: "accounts@initech.com", company: "Initech LLC", phone: "+1 (555) 300-4000", address: "55 Office Park, Dallas, TX" },
      { name: "Umbrella Co.", email: "finance@umbrella.co", company: "Umbrella Co.", phone: "+1 (555) 400-5000", address: "9 Raccoon Ave, Seattle, WA" },
    ].map((c) => prisma.customer.create({ data: c })),
  );

  const vendors = await Promise.all(
    [
      { name: "Cloud Hosting Co.", email: "billing@cloudhost.com", company: "Cloud Hosting Co." },
      { name: "WeWork Offices", email: "rent@wework.com", company: "WeWork" },
      { name: "Adobe Systems", email: "billing@adobe.com", company: "Adobe" },
      { name: "Staples Supplies", email: "orders@staples.com", company: "Staples" },
    ].map((v) => prisma.vendor.create({ data: v })),
  );

  console.log("Recording owner investment (opening balance)…");
  await postJournalEntry(prisma, {
    date: daysAgo(120),
    memo: "Owner investment — opening capital",
    reference: "OPENING",
    source: "MANUAL",
    lines: [
      { accountId: bank.id, debit: 25000, credit: 0, description: "Initial deposit" },
      { accountId: ownerEquity.id, debit: 0, credit: 25000, description: "Owner contribution" },
    ],
  });

  console.log("Creating invoices…");
  const inv1 = await createInvoice(prisma, {
    customerId: customers[0].id,
    issueDate: daysAgo(40),
    dueDate: daysAgo(10),
    status: "SENT",
    lines: [
      { productId: website.id, description: website.name, quantity: 1, unitPrice: 3500, taxRate: 8.5 },
      { productId: consultingHour.id, description: "Discovery workshop", quantity: 8, unitPrice: 150, taxRate: 8.5 },
    ],
  });
  await recordInvoicePayment(prisma, inv1.id, { amount: inv1.total, date: daysAgo(8), method: "BANK" });

  const inv2 = await createInvoice(prisma, {
    customerId: customers[1].id,
    issueDate: daysAgo(25),
    dueDate: daysFromNow(5),
    status: "SENT",
    lines: [
      { productId: branding.id, description: branding.name, quantity: 1, unitPrice: 1200, taxRate: 8.5 },
      { productId: consultingHour.id, description: "Strategy sessions", quantity: 12, unitPrice: 150, taxRate: 8.5 },
    ],
  });
  await recordInvoicePayment(prisma, inv2.id, { amount: 1500, date: daysAgo(15), method: "CARD" });

  await createInvoice(prisma, {
    customerId: customers[2].id,
    issueDate: daysAgo(20),
    dueDate: daysAgo(2),
    status: "SENT",
    lines: [
      { productId: hosting.id, description: "Hosting — Q1", quantity: 3, unitPrice: 99, taxRate: 8.5 },
      { productId: consultingHour.id, description: "Maintenance retainer", quantity: 10, unitPrice: 150, taxRate: 8.5 },
    ],
  });

  await createInvoice(prisma, {
    customerId: customers[3].id,
    issueDate: daysAgo(3),
    dueDate: daysFromNow(27),
    status: "DRAFT",
    lines: [
      { productId: website.id, description: "Marketing site redesign", quantity: 1, unitPrice: 3500, taxRate: 8.5 },
    ],
  });

  console.log("Creating bills…");
  const rentAcc = await acc("6100");
  const softwareAcc = await acc("6600");
  const suppliesAcc = await acc("6400");

  const bill1 = await createBill(prisma, {
    vendorId: vendors[1].id,
    issueDate: daysAgo(30),
    dueDate: daysAgo(2),
    lines: [{ accountId: rentAcc.id, description: "Office rent — monthly", quantity: 1, unitPrice: 2200, taxRate: 0 }],
  });
  await recordBillPayment(prisma, bill1.id, { amount: bill1.total, date: daysAgo(28), method: "BANK" });

  await createBill(prisma, {
    vendorId: vendors[2].id,
    issueDate: daysAgo(18),
    dueDate: daysFromNow(12),
    lines: [{ accountId: softwareAcc.id, description: "Creative Cloud — team plan", quantity: 5, unitPrice: 79.99, taxRate: 0 }],
  });

  const bill3 = await createBill(prisma, {
    vendorId: vendors[3].id,
    issueDate: daysAgo(12),
    dueDate: daysFromNow(18),
    lines: [
      { accountId: suppliesAcc.id, description: "Office supplies", quantity: 1, unitPrice: 340, taxRate: 8.5 },
    ],
  });
  await recordBillPayment(prisma, bill3.id, { amount: 200, date: daysAgo(5), method: "CARD" });

  await createBill(prisma, {
    vendorId: vendors[0].id,
    issueDate: daysAgo(6),
    dueDate: daysFromNow(24),
    lines: [{ accountId: (await acc("5000")).id, description: "Server infrastructure", quantity: 1, unitPrice: 450, taxRate: 0 }],
  });

  console.log("Seed complete ✅");
  console.log("Login with: demo@ledgerly.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
