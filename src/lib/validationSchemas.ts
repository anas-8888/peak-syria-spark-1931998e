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
  
  city: z.string()
    .trim()
    .min(2, { message: "اسم المدينة قصير جداً" })
    .max(100, { message: "اسم المدينة طويل جداً" })
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

export type CheckoutFormData = z.infer<typeof CheckoutSchema>;
export type PaymentFormData = z.infer<typeof PaymentSchema>;
