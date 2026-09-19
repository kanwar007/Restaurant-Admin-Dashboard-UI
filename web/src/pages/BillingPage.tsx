import { Download, Printer } from 'lucide-react';
import { useState } from 'react';

import { useBill, useOrders } from '../api/hooks';
import type { BillFormat } from '../api/types';
import { PageHead, QueryState } from '../components/ui';
import { formatCurrency } from '../lib/format';

const formats: { id: BillFormat; label: string; title: string; details: string[] }[] = [
  {
    id: 'kot',
    label: 'KOT (Kitchen Order Ticket)',
    title: 'KOT Format Details',
    details: [
      'Includes Order Number and Table ID',
      'Lists all items with quantities',
      'Shows add-ons for each item',
      'Displays special instructions/notes',
      'Optimized for kitchen printer (thermal)',
      'No pricing information included',
    ],
  },
  {
    id: 'customer',
    label: 'Customer Bill',
    title: 'Customer Bill Details',
    details: [
      'Itemised list with prices and add-ons',
      'Subtotal and GST applied at 5%',
      'Grand total payable by the customer',
      'Restaurant contact details in the footer',
    ],
  },
  {
    id: 'ca',
    label: 'CA Bill',
    title: 'CA Bill Details',
    details: [
      'Customer Bill + GST breakdown',
      'Customer/Company details section',
      'CGST and SGST separate calculation',
      'Restaurant GSTIN number',
    ],
  },
  {
    id: 'restaurant',
    label: 'Restaurant Copy',
    title: 'Restaurant Copy Details',
    details: [
      'Internal record of the settled order',
      'Payment mode and serving staff',
      'Subtotal, GST and total collected',
      'Retained for daily reconciliation',
    ],
  },
];

export const BillingPage = () => {
  const [format, setFormat] = useState<BillFormat>('kot');
  const { data: orders } = useOrders();
  const [orderNo, setOrderNo] = useState<string>('');
  const selectedOrderNo = orderNo || orders?.[0]?.orderNo || '';
  const { data: bill, isLoading, error } = useBill(selectedOrderNo, format);
  const active = formats.find((entry) => entry.id === format)!;

  return (
    <>
      <PageHead title="Billing & Printing" subtitle="View and print different bill formats" />

      <div className="row row-wrap no-print" style={{ marginBottom: 24 }}>
        <div className="tabs">
          {formats.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={entry.id === format ? 'tab active' : 'tab'}
              onClick={() => setFormat(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <select
          className="chip"
          aria-label="Select order"
          value={selectedOrderNo}
          onChange={(event) => setOrderNo(event.target.value)}
        >
          {orders?.map((order) => (
            <option key={order.id} value={order.orderNo}>
              {order.orderNo} • {order.table}
            </option>
          ))}
        </select>
      </div>

      <QueryState isLoading={isLoading} error={error} />

      {bill ? (
        <div className="billing-grid">
          <section className="card">
            <div className="receipt">
              <h3>{bill.title}</h3>

              {format !== 'kot' ? (
                <div className="muted" style={{ textAlign: 'center', fontSize: 13 }}>
                  {bill.restaurant.address}
                  <br />
                  {bill.restaurant.phone}
                  {format === 'ca' ? <> · GSTIN: {bill.restaurant.gstin}</> : null}
                </div>
              ) : null}

              <div className="receipt-meta">
                <div>
                  <span className="muted">Order No:</span>
                  <strong>{bill.orderNo}</strong>
                </div>
                <div>
                  <span className="muted">Table No:</span>
                  <strong>{bill.table}</strong>
                </div>
                <div>
                  <span className="muted">Date &amp; Time:</span>
                  <strong>
                    {bill.date}, {bill.time}
                  </strong>
                </div>
              </div>

              <div className="stack" style={{ gap: 12 }}>
                {bill.lines.map((line) => (
                  <div key={line.name}>
                    <div className="receipt-line">
                      <span>{line.name}</span>
                      <span>{bill.showPricing ? formatCurrency(line.amount) : `x${line.quantity}`}</span>
                    </div>
                    {line.addons.length ? (
                      <div className="rail-item-addons">+ {line.addons.join(', ')}</div>
                    ) : null}
                    {bill.showPricing ? (
                      <div className="muted" style={{ fontSize: 13 }}>
                        {line.quantity} × {formatCurrency(line.unitPrice)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {bill.totals ? (
                <div className="receipt-totals">
                  <div>
                    <span className="muted">Subtotal</span>
                    <span>{formatCurrency(bill.totals.subtotal)}</span>
                  </div>
                  {bill.totals.cgst !== undefined && bill.totals.sgst !== undefined ? (
                    <>
                      <div>
                        <span className="muted">CGST (2.5%)</span>
                        <span>{formatCurrency(bill.totals.cgst)}</span>
                      </div>
                      <div>
                        <span className="muted">SGST (2.5%)</span>
                        <span>{formatCurrency(bill.totals.sgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="muted">GST (5%)</span>
                      <span>{formatCurrency(bill.totals.gst)}</span>
                    </div>
                  )}
                  <div className="grand">
                    <span>Total</span>
                    <span>{formatCurrency(bill.totals.total)}</span>
                  </div>
                </div>
              ) : null}

              {bill.settlement ? (
                <div className="receipt-note">
                  Payment: {bill.settlement.paymentMode.toUpperCase()} · Served by {bill.settlement.server}
                </div>
              ) : null}

              {bill.notes ? (
                <div className="receipt-note">
                  <div className="muted">Special Instructions:</div>
                  {bill.notes}
                </div>
              ) : null}

              {bill.footer ? (
                <div className="muted" style={{ textAlign: 'center' }}>
                  {bill.footer}
                </div>
              ) : null}
            </div>

            <div className="row no-print" style={{ marginTop: 20 }}>
              <button className="btn btn-primary" type="button" style={{ flex: 1 }} onClick={() => window.print()}>
                <Printer size={16} />
                Print {format === 'kot' ? 'KOT' : 'Bill'}
              </button>
              <button className="btn btn-outline" type="button" style={{ flex: 1 }} onClick={() => window.print()}>
                <Download size={16} />
                Download
              </button>
            </div>
          </section>

          <aside className="info-panel no-print">
            <h3 className="section-title">{active.title}</h3>
            <ul>
              {active.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}
    </>
  );
};
