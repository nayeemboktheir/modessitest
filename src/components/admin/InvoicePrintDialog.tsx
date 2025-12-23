import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { OrderInvoice } from './OrderInvoice';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  subtotal: number;
  shipping_cost: number | null;
  discount: number | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_district: string;
  shipping_postal_code: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

interface InvoicePrintDialogProps {
  orders: Order[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopName?: string;
  shopLogo?: string;
}

export function InvoicePrintDialog({
  orders,
  open,
  onOpenChange,
  shopName = 'Your Shop',
  shopLogo,
}: InvoicePrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoices-${new Date().toISOString().split('T')[0]}`,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Print Invoices ({orders.length})</span>
            <Button onClick={() => handlePrint()} className="gap-2">
              <Printer className="h-4 w-4" />
              Print All
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
          <div ref={printRef} className="space-y-0">
            {orders.map((order, index) => (
              <div
                key={order.id}
                className="bg-white"
                style={{
                  pageBreakAfter: index < orders.length - 1 ? 'always' : 'auto',
                  pageBreakInside: 'avoid',
                }}
              >
                <OrderInvoice order={order} shopName={shopName} shopLogo={shopLogo} />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
