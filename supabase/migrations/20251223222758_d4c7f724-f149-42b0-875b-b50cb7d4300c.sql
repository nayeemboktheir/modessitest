
-- SMS Templates table for customizable messages
CREATE TABLE public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SMS Logs table to track all sent messages
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  template_key TEXT,
  order_id UUID REFERENCES public.orders(id),
  status TEXT NOT NULL DEFAULT 'pending',
  provider_response JSONB,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sms_templates
CREATE POLICY "Admins can manage SMS templates"
ON public.sms_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for sms_logs
CREATE POLICY "Admins can view all SMS logs"
ON public.sms_logs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert default SMS templates
INSERT INTO public.sms_templates (template_key, template_name, message_template, description) VALUES
('order_placed', 'Order Placed', 'ধন্যবাদ {{customer_name}}! আপনার অর্ডার #{{order_number}} সফলভাবে গ্রহণ করা হয়েছে। মোট: ৳{{total}}। আমরা শীঘ্রই যোগাযোগ করব।', 'Sent when a new order is placed'),
('order_confirmed', 'Order Confirmed', 'শুভ সংবাদ {{customer_name}}! আপনার অর্ডার #{{order_number}} নিশ্চিত করা হয়েছে এবং প্রক্রিয়াকরণ শুরু হয়েছে।', 'Sent when order is confirmed by admin'),
('order_processing', 'Order Processing', '{{customer_name}}, আপনার অর্ডার #{{order_number}} প্রস্তুত করা হচ্ছে। শীঘ্রই ডেলিভারি হবে।', 'Sent when order is being processed'),
('order_shipped', 'Order Shipped', '{{customer_name}}, আপনার অর্ডার #{{order_number}} শিপ করা হয়েছে! ট্র্যাকিং: {{tracking_number}}', 'Sent when order is shipped'),
('order_delivered', 'Order Delivered', '{{customer_name}}, আপনার অর্ডার #{{order_number}} সফলভাবে ডেলিভারি হয়েছে। ধন্যবাদ!', 'Sent when order is delivered'),
('order_cancelled', 'Order Cancelled', '{{customer_name}}, দুঃখিত! আপনার অর্ডার #{{order_number}} বাতিল করা হয়েছে।', 'Sent when order is cancelled');

-- Add SMS provider settings to admin_settings if not exists
INSERT INTO public.admin_settings (key, value) VALUES
('sms_provider', 'bulksmsbd'),
('sms_api_key', ''),
('sms_sender_id', ''),
('sms_enabled', 'false'),
('sms_auto_send_order_placed', 'true'),
('sms_auto_send_status_change', 'true')
ON CONFLICT (key) DO NOTHING;
