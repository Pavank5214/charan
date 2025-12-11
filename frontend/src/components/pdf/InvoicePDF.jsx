import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});


// --- Styles ---
const s = StyleSheet.create({
  page: { padding: 15, fontSize: 8.5, fontFamily: 'Roboto' },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  border: { borderWidth: 1, borderColor: '#000' },
  borderTop: { borderTopWidth: 1, borderColor: '#000' },
  borderRight: { borderRightWidth: 1, borderColor: '#000' },
  p: { padding: 3 },
  pt: { paddingTop: 2 },
  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },
  textBold: { fontWeight: 'bold' },
  fs9: { fontSize: 9 },
  fs10: { fontSize: 10 },
  fs12: { fontSize: 12 },
  mb: { marginBottom: 4 },
  mt: { marginTop: 3 },
  bg: { backgroundColor: '#f0f0f0' },
  small: { fontSize: 7.5 },
});

const InvoicePDF = ({ invoice }) => {
  const { company, client, items, totals, bank, gstRate, terms = [] } = invoice;
  const colFlex = [0.5, 3, 1.2, 0.8, 0.8, 1.2, 1.5];

  // Helper to safely display value or '-'
  const safe = (val) => (val && String(val).trim() !== '' ? val : '-');

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={[s.row, s.mb]}>
          <Text style={s.fs9}>GSTIN: {company.gstin}</Text>
          <Text style={[s.fs9, s.textRight, { flex: 1 }]}>Original Copy / Buyer</Text>
        </View>

        {/* Title */}
        <View style={[s.textCenter, s.mb]}>
          <Text style={[s.fs12, s.textBold]}>TAX INVOICE</Text>
          <Text style={[s.fs10, s.textBold]}>{company.name}</Text>
          <Text>{company.address}</Text>
          <Text>email: {company.email}</Text>
          <Text>PHONE NO: {company.phone}</Text>
        </View>

        {/* Invoice Details */}
        <View style={[s.row, s.mb]}>
          <View style={[s.border, s.p, { flex: 1 }]}>
            <Text>Invoice No: {invoice.number}</Text>
            <Text>Dated: {invoice.date}</Text>
            <Text>Place of Supply: {invoice.placeOfSupply}</Text>
            <Text>Reverse Charge: N</Text>
          </View>
          <View style={[s.border, s.p, { flex: 1 }]}>
            <Text>GR/RR No: -</Text>
            <Text>Transport: -</Text>
            <Text>Station: -</Text>
          </View>
        </View>

        {/* Billed & Shipped - FIXED & SAFE */}
        <View style={[s.row, s.mb]}>
          {['Billed to', 'Shipped to'].map((title, i) => (
            <View key={i} style={[s.border, s.p, { flex: 1 }]}>
              <Text style={s.textBold}>{title}:</Text>
              <Text>{client.name}</Text>
              <Text>{client.address}</Text>

              <Text style={s.small}>Party E-Mail ID: {safe(client.email)}</Text>
              <Text style={s.small}>Party Mobile No: {safe(client.mobile)}</Text>
              <Text style={s.small}>Party Pincode: {safe(client.pincode)}</Text>
              
              <Text>State: {client.state}</Text>
              <Text>GSTIN / UIN: {client.gstin || 'N/A'}</Text>
            </View>
          ))}
        </View>

        {/* Items Table */}
        <View style={[s.border, s.mb]}>
          <View style={s.row}>
            {['S.N.', 'Description of Goods', 'HSN/SAC Code', 'Qty.', 'Unit', 'Price', 'Amount(₹)'].map((h, i) => (
              <View key={i} style={[s.borderRight, s.bg, s.p, s.textCenter, { flex: colFlex[i] }]}>
                <Text style={s.textBold}>{h}</Text>
              </View>
            ))}
          </View>

          {items.map((it, i) => (
            <View key={i} style={s.row}>
              <View style={[s.borderRight, s.borderTop, s.p, s.textCenter, { flex: colFlex[0] }]}><Text>{i + 1}</Text></View>
              <View style={[s.borderRight, s.borderTop, s.p, { flex: colFlex[1] }]}><Text>{it.description}</Text></View>
              <View style={[s.borderRight, s.borderTop, s.p, s.textCenter, { flex: colFlex[2] }]}><Text>{it.hsn}</Text></View>
              <View style={[s.borderRight, s.borderTop, s.p, s.textCenter, { flex: colFlex[3] }]}><Text>{it.qty > 0 ? it.qty : "-"}</Text></View>
              <View style={[s.borderRight, s.borderTop, s.p, s.textCenter, { flex: colFlex[4] }]}><Text>{it.unit == "" ? "-": it.unit}</Text></View>
              <View style={[s.borderRight, s.borderTop, s.p, s.textCenter, { flex: colFlex[5] }]}><Text>{it.rate > 0 ? it.rate : "-"}</Text></View>
              <View style={[s.borderTop, s.p, s.textCenter, { flex: colFlex[6] }]}><Text>
  {it.amount > 0 ? it.amount.toLocaleString('en-IN') : "-"}
</Text>
</View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={[s.border, s.p, s.mb, { alignItems: 'flex-end' }]}>
          {/* {totals.itemsSubtotal && <Text>Items Subtotal: ₹ {Number(totals.itemsSubtotal).toLocaleString('en-IN')}</Text>} */}
          {totals.basicPrice && Number(totals.basicPrice) > 0 && <Text>Basic Price: ₹ {(totals.basicPrice).toLocaleString('en-IN')}</Text>}
          
          <Text>Subtotal: ₹ {totals.subtotal.toLocaleString('en-IN')}</Text>
          <Text><Text>Add: GST @ {gstRate}%</Text>: ₹ {totals.gst.toLocaleString('en-IN')}</Text>
          <Text style={s.textBold}>Total: ₹ {totals.total.toLocaleString('en-IN')}</Text>
          <Text style={s.textBold}>Grand Total: ₹ {totals.total.toLocaleString('en-IN')}</Text>
        </View>
        

        {/* GST Summary */}
       {/* GST Summary */}
<View style={[s.border, s.p, s.mb]}>
  <Text style={s.textBold}>GST Summary</Text>

  {/* Header */}
  <View style={[s.row, s.mt]}>
    {['HSN/SAC', 'Tax Rate', 'Taxable Amt.', 'GST Amt.', 'Total Tax'].map((h, i) => (
      <View key={i} style={[s.textCenter, { flex: [1.2, 0.8, 1.2, 1, 1][i] }]}>
        <Text>{h}</Text>
      </View>
    ))}
  </View>

  {/* Row */}
  <View style={[s.row, s.borderTop, s.pt]}>
    <View style={{ flex: 1.2 , marginLeft : 50}}>
      <Text>8536</Text>
    </View>
    <View style={{ flex: 0.8 }}>
      <Text>{gstRate}%</Text>
    </View>
    <View style={{ flex: 1.2 }}>
      <Text>{totals.subtotal.toLocaleString('en-IN')}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text>{totals.gst.toLocaleString('en-IN')}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text>{totals.gst.toLocaleString('en-IN')}</Text>
    </View>
  </View>
</View>


        <Text style={[s.textBold, s.mb]}>{totals.inWords}.</Text>

        <View style={[s.border, s.p, s.mb]}>
          <Text style={s.textBold}>Bank Details</Text>
          <Text>{bank.bankName} | A/C: {bank.accountNumber} | IFSC: {bank.ifsc}</Text>
        </View>

        <View style={s.mb}>
          <Text style={s.textBold}>Terms & Conditions</Text>
          {terms.map((t, i) => <Text key={i} style={s.small}>{t}</Text>)}
        </View>

        <View style={[s.row, { justifyContent: 'space-between', marginTop: 20 }]}>
          <Text>Receiver's Signature:</Text>
          <View style={[s.textRight, s.borderTop, s.pt, { width: '45%' }]}>
            <Text>For {company.name}</Text>
            <Text style={{ marginTop: 25 }}>Authorized Signatory</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default InvoicePDF;