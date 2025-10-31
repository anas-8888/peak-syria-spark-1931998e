-- Create legal pages table
CREATE TABLE IF NOT EXISTS public.legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL UNIQUE CHECK (page_type IN ('terms', 'privacy', 'refund')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view legal pages"
  ON public.legal_pages FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage legal pages"
  ON public.legal_pages FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default content
INSERT INTO public.legal_pages (page_type, title, content) VALUES
  ('terms', 'Terms of Service', 'These Terms of Service govern your use of PEAK Syria''s website and services. By accessing our website, you agree to be bound by these terms.

## 1. Acceptance of Terms
By using our services, you accept these terms in full. If you disagree with any part of these terms, you must not use our website.

## 2. Products and Services
- All products displayed are authentic PEAK brand merchandise
- Prices are subject to change without notice
- We reserve the right to refuse service to anyone

## 3. Orders and Payment
- All orders are subject to acceptance and availability
- Payment must be received before order processing
- We accept various payment methods as displayed at checkout

## 4. Shipping and Delivery
- Delivery times are estimates and not guaranteed
- Risk of loss passes to you upon delivery
- Additional customs fees may apply for certain regions

## 5. Returns and Refunds
- Please refer to our Refund Policy for detailed information
- Products must be in original condition for returns

## 6. Intellectual Property
- All content on this site is owned by PEAK Syria or its licensors
- Unauthorized use of any content is prohibited

## 7. Limitation of Liability
We are not liable for any indirect or consequential damages arising from your use of our services.

## 8. Changes to Terms
We reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.

For questions, contact us at info@peaksyria.com'),
  
  ('privacy', 'Privacy Policy', 'PEAK Syria is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.

## 1. Information We Collect
- **Personal Information**: Name, email, phone number, shipping address
- **Payment Information**: Processed securely through our payment providers
- **Usage Data**: IP address, browser type, pages visited, time spent

## 2. How We Use Your Information
- Process and fulfill your orders
- Communicate about orders and promotions
- Improve our website and services
- Comply with legal obligations

## 3. Data Sharing
We do not sell your personal information. We may share data with:
- Payment processors for transaction processing
- Shipping companies for order delivery
- Legal authorities when required by law

## 4. Data Security
We implement industry-standard security measures to protect your information, including:
- Encrypted data transmission
- Secure servers
- Regular security audits

## 5. Your Rights
You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Opt-out of marketing communications

## 6. Cookies
We use cookies to enhance your browsing experience. You can control cookie settings in your browser.

## 7. Third-Party Links
Our website may contain links to third-party websites. We are not responsible for their privacy practices.

## 8. Children''s Privacy
Our services are not directed to children under 13. We do not knowingly collect data from children.

## 9. Changes to Privacy Policy
We may update this policy periodically. Continued use constitutes acceptance of changes.

## 10. Contact Us
For privacy concerns, email us at info@peaksyria.com'),
  
  ('refund', 'Refund Policy', 'At PEAK Syria, we want you to be completely satisfied with your purchase. This Refund Policy outlines our return and refund procedures.

## 1. Return Eligibility
Products are eligible for return if:
- Returned within 14 days of delivery
- In original, unused condition
- With original packaging and tags attached
- Accompanied by proof of purchase

## 2. Non-Returnable Items
The following items cannot be returned:
- Items marked as final sale
- Used or worn products
- Products without original packaging
- Custom or personalized items

## 3. Return Process
To initiate a return:
1. Contact our customer service within 14 days
2. Provide your order number and reason for return
3. Receive return authorization and instructions
4. Ship the product back with tracking
5. Retain shipping receipt as proof

## 4. Refund Processing
- Refunds are processed within 5-7 business days after receiving returned items
- Original payment method will be credited
- Shipping costs are non-refundable unless the return is due to our error
- Return shipping costs are the customer''s responsibility

## 5. Exchanges
We currently do not offer direct exchanges. Please return the item for a refund and place a new order for the desired product.

## 6. Damaged or Defective Products
If you receive a damaged or defective product:
- Contact us immediately with photos
- We will arrange replacement or full refund
- Return shipping costs will be covered by us

## 7. Wrong Items
If you receive the wrong item:
- Contact us within 48 hours
- We will arrange for correct item delivery
- Return shipping costs will be covered by us

## 8. Order Cancellations
- Orders can be cancelled within 2 hours of placement
- After processing begins, cancellation may not be possible
- Contact customer service immediately for cancellation requests

## 9. Refund Timeline
- Refund processing: 5-7 business days after return receipt
- Bank processing: Additional 3-5 business days
- Total refund time: Approximately 10-14 business days

## 10. Contact Information
For return or refund inquiries:
- Email: info@peaksyria.com
- Phone: +963 XXX XXX XXX
- WhatsApp: Available on our website')
ON CONFLICT (page_type) DO NOTHING;

-- Create trigger for updating timestamp
CREATE TRIGGER update_legal_pages_updated_at
  BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();