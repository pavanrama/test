import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const accountSchema = z.object({
  code: z.string().min(1, "Code is required").max(20),
  name: z.string().min(1, "Name is required").max(120),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
  subtype: z.string().max(60).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(60).optional().nullable(),
  company: z.string().max(160).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  taxNumber: z.string().max(60).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const customerSchema = contactSchema;
export const vendorSchema = contactSchema;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  sku: z.string().max(60).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(["SERVICE", "INVENTORY"]).default("SERVICE"),
  price: z.number().min(0).default(0),
  cost: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  incomeAccountId: z.string().optional().nullable(),
  expenseAccountId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const lineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, "Line description is required"),
  quantity: z.number().min(0),
  unitPrice: z.number(),
  taxRate: z.number().min(0).max(100).default(0),
});

const billLineSchema = lineSchema.extend({
  accountId: z.string().optional().nullable(),
});

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(["DRAFT", "SENT"]).optional(),
  notes: z.string().max(1000).optional().nullable(),
  terms: z.string().max(1000).optional().nullable(),
  lines: z.array(lineSchema).min(1, "Add at least one line item"),
});

export const billSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  notes: z.string().max(1000).optional().nullable(),
  lines: z.array(billLineSchema).min(1, "Add at least one line item"),
});

export const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  date: z.string().min(1),
  method: z.enum(["BANK", "CASH", "CARD", "OTHER"]).default("BANK"),
  depositAccountId: z.string().optional().nullable(),
  reference: z.string().max(120).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const journalEntrySchema = z.object({
  date: z.string().min(1),
  memo: z.string().max(500).optional().nullable(),
  reference: z.string().max(120).optional().nullable(),
  lines: z
    .array(
      z.object({
        accountId: z.string().min(1, "Account is required"),
        description: z.string().optional().nullable(),
        debit: z.number().min(0).default(0),
        credit: z.number().min(0).default(0),
      }),
    )
    .min(2, "A journal entry needs at least two lines"),
});

export const orgSchema = z.object({
  name: z.string().min(1).max(160),
  legalName: z.string().max(160).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(60).optional().nullable(),
  website: z.string().max(160).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  taxNumber: z.string().max(60).optional().nullable(),
  currency: z.string().max(8).optional(),
  currencySymbol: z.string().max(4).optional(),
  fiscalYearStart: z.number().min(1).max(12).optional(),
  invoicePrefix: z.string().max(12).optional(),
  billPrefix: z.string().max(12).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  invoiceTerms: z.string().max(1000).optional().nullable(),
});
