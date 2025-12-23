import { forwardRef } from 'react';
import { format } from 'date-fns';
import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

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

interface OrderInvoiceProps {
  order: Order;
  shopName?: string;
  shopLogo?: string;
}

const Barcode = ({ value }: { value: string }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 0,
        });
      } catch (e) {
        console.error('Barcode generation failed:', e);
      }
    }
  }, [value]);

  return <svg ref={barcodeRef} />;
};

export const OrderInvoice = forwardRef<HTMLDivElement, OrderInvoiceProps>(
  ({ order, shopName = 'Your Shop', shopLogo }, ref) => {
    const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 max-w-[800px] mx-auto"
        style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          {/* Logo Section */}
          <div className="flex-1">
            {shopLogo ? (
              <img src={shopLogo} alt={shopName} className="h-16 object-contain" />
            ) : (
              <h1
                className="text-4xl font-bold"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {shopName}
              </h1>
            )}
            <p className="text-red-600 text-sm mt-1">Logo</p>
          </div>

          {/* Invoice Title & Barcode */}
          <div className="text-right">
            <h2 className="text-xl font-bold mb-2">INVOICE</h2>
            {order.tracking_number && (
              <div className="inline-block">
                <Barcode value={order.tracking_number} />
              </div>
            )}
          </div>
        </div>

        {/* Billing & Shipping Info */}
        <div className="grid grid-cols-3 gap-8 mb-6 text-sm">
          {/* Billing To */}
          <div>
            <h3 className="font-bold mb-2">Billing To</h3>
            <p className="text-red-600">{order.shipping_name}</p>
            <p className="text-red-600">{order.shipping_phone}</p>
            <p className="text-red-600">
              {order.shipping_street}, {order.shipping_district}, {order.shipping_city}
            </p>
          </div>

          {/* Invoice Details */}
          <div>
            <p>
              <span className="font-medium">Invoice No:</span> {order.order_number.replace('ORD-', 'M')}
            </p>
            <p>
              <span className="font-medium">Invoice Date:</span>{' '}
              {format(new Date(order.created_at), 'dd/MM/yy')}
            </p>
            <p>
              <span className="font-medium">Total Items:</span> {totalItems}
            </p>
          </div>

          {/* Delivery Info */}
          <div>
            <p>
              <span className="font-medium">Delivery:</span> Steadfast
            </p>
            <p>
              <span className="font-medium">Tracking:</span>{' '}
              {order.tracking_number || 'Pending'}
            </p>
          </div>
        </div>

        {/* Products Table */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-y border-black">
              <th className="text-left py-2 px-2">PRODUCTS</th>
              <th className="text-center py-2 px-2">QTY</th>
              <th className="text-center py-2 px-2">PRICE</th>
              <th className="text-right py-2 px-2">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-10 h-10 object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-red-600 text-sm">৳{Number(item.price).toFixed(0)}</p>
                    </div>
                  </div>
                </td>
                <td className="text-center py-3 px-2 text-red-600">{item.quantity}</td>
                <td className="text-center py-3 px-2 text-red-600">৳{Number(item.price).toFixed(0)}</td>
                <td className="text-right py-3 px-2">
                  ৳{(Number(item.price) * item.quantity).toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes & Totals */}
        <div className="flex justify-between">
          {/* Notes */}
          <div className="text-red-600">
            {order.notes && <p>Note: {order.notes}</p>}
          </div>

          {/* Totals */}
          <div className="text-right space-y-1 min-w-[200px]">
            <div className="flex justify-between">
              <span>Sub Total</span>
              <span>৳{Number(order.subtotal).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span className="text-red-600">৳{Number(order.shipping_cost || 0).toFixed(0)}</span>
            </div>
            {order.discount && Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-৳{Number(order.discount).toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-black pt-1">
              <span>Total:</span>
              <span>৳{Number(order.total).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

OrderInvoice.displayName = 'OrderInvoice';
