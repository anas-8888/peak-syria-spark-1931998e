import { z } from 'zod';

export const CheckoutSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .max(255, { message: "البريد الإلكتروني طويل جداً" }),
  
  phone: z.string()
    .trim()
    .regex(/^[\+]?[0-9]{10,15}$/, { message: "رقم الهاتف غير صالح" })
    .min(10, { message: "رقم الهاتف قصير جداً" })
    .max(15, { message: "رقم الهاتف طويل جداً" }),
  
  fullName: z.string()
    .trim()
    .min(2, { message: "الاسم قصير جداً" })
    .max(100, { message: "الاسم طويل جداً" }),
  
  address: z.string()
    .trim()
    .min(5, { message: "العنوان قصير جداً" })
    .max(500, { message: "العنوان طويل جداً" }),
  
  regionId: z.string()
    .min(1, { message: "يرجى اختيار المنطقة" }),
  
  carrierId: z.string()
    .min(1, { message: "يرجى اختيار طريقة الشحن" }),
  
  discountCode: z.string().optional()
});

export const PaymentSchema = z.object({
  cardNumber: z.string()
    .trim()
    .regex(/^[0-9\s]{13,19}$/, { message: "رقم البطاقة غير صالح" }),
  
  cardName: z.string()
    .trim()
    .min(2, { message: "اسم حامل البطاقة قصير جداً" })
    .max(100, { message: "اسم حامل البطاقة طويل جداً" }),
  
  expiry: z.string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/[0-9]{2}$/, { message: "تاريخ الانتهاء غير صالح (MM/YY)" }),
  
  cvv: z.string()
    .trim()
    .regex(/^[0-9]{3,4}$/, { message: "رمز CVV غير صالح" })
});

export const ContactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, { message: "Name can only contain letters and spaces" }),
  
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  
  phone: z.string()
    .trim()
    .regex(/^[\+]?[0-9]{10,15}$/, { message: "Invalid phone number format" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional()
    .or(z.literal("")),
  
  message: z.string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(2000, { message: "Message must be less than 2000 characters" })
    .regex(/^[^<>]*$/, { message: "Message cannot contain HTML tags" })
});

export type CheckoutFormData = z.infer<typeof CheckoutSchema>;
export type PaymentFormData = z.infer<typeof PaymentSchema>;
export type ContactFormData = z.infer<typeof ContactSchema>;
