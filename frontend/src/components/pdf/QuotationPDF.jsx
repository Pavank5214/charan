import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a bold font if needed, otherwise Helvetica-Bold works natively
Font.register({ family: 'Helvetica-Bold', src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
  },
  // Header Section
  headerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  companySub: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 2,
  },
  companyContact: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 5,
    marginBottom: 5,
    textDecoration: 'underline',
  },
  
  // Info Section (To... and Quote Details)
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    fontSize: 10,
  },
  leftInfo: {
    width: '60%',
  },
  rightInfo: {
    width: '40%',
    alignItems: 'flex-end',
  },
  label: {
    fontFamily: 'Helvetica-Bold',
  },

  // Subject Line
  subjectSection: {
    marginBottom: 10,
  },
  subjectText: {
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    fontSize: 10,
    marginBottom: 5,
  },
  introText: {
    fontSize: 10,
    marginBottom: 10,
    textAlign: 'justify',
  },

  // Table Styling
  tableContainer: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    height: 25,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    minHeight: 20,
    fontSize: 9,
  },
  // Table Columns (Matches Image: Sl No, Desc, Qty, Price, Make, Total)
  col1: { width: '8%', borderRightWidth: 1, borderColor: '#000', textAlign: 'center', padding: 2 }, // Sl No
  col2: { width: '42%', borderRightWidth: 1, borderColor: '#000', padding: 2 }, // Description
  col3: { width: '10%', borderRightWidth: 1, borderColor: '#000', textAlign: 'center', padding: 2 }, // Qty
  col4: { width: '15%', borderRightWidth: 1, borderColor: '#000', textAlign: 'center', padding: 2 }, // Price
  col5: { width: '10%', borderRightWidth: 1, borderColor: '#000', textAlign: 'center', padding: 2 }, // Make
  col6: { width: '15%', textAlign: 'right', padding: 2 }, // Total

  // Totals Section
  totalsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    minHeight: 18,
    fontSize: 9,
  },
  totalLabelCol: {
    width: '85%', // Spans across first 5 cols
    borderRightWidth: 1,
    borderColor: '#000',
    textAlign: 'right',
    paddingRight: 5,
    paddingTop: 2,
  },
  totalValueCol: {
    width: '15%',
    textAlign: 'right',
    paddingRight: 2,
    paddingTop: 2,
  },

  // Terms Section
  termsContainer: {
    marginTop: 5,
    fontSize: 9,
  },
  termsHeader: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    textDecoration: 'underline',
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  termBullet: {
    width: 15,
  },
  termText: {
    flex: 1,
  },

  // Footer
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
  },
  signatureBlock: {
    textAlign: 'right',
    width: '50%',
  },
  signSpace: {
    marginTop: 40,
    fontFamily: 'Helvetica-Bold',
  },
  
  // Grey Bar specific to image
  sectionHeaderBar: {
    backgroundColor: '#e0e0e0',
    padding: 2,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
});

const QuotationPDF = ({ quotation }) => {
  const { company, client, items, totals, gstRate, number, date, defaults } = quotation;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* --- Header Section (Matches Image Layout) --- */}
        <View style={styles.headerContainer}>
          <Text style={styles.companyName}>{company.name}</Text>
          {/* Optional: Add Company Description if available, else static text matching image style */}
          <Text style={styles.companySub}>(Mfg All Type Power Switchboards, Control panels & bus ducts)</Text>
          <Text style={styles.companyAddress}>{company.address}</Text>
          <Text style={styles.companyAddress}>{company.city} - {company.zip}</Text>
          <Text style={styles.companyContact}>Email: {company.email}</Text>
          <Text style={styles.companyContact}>Ph No: {company.phone}</Text>
          
          <Text style={styles.title}>QUOTATION</Text>
        </View>

        {/* --- Info Row (Quote No Left/Right split) --- */}
        <View style={styles.infoSection}>
          <View style={styles.leftInfo}>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ width: 80 }}>Quotation No:</Text>
              <Text style={styles.label}>{number}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: 80 }}>Date :</Text>
              <Text style={styles.label}>{formatDate(date)}</Text>
            </View>
            
            <View style={{ marginTop: 10 }}>
              <Text style={{ marginLeft: 20 }}>To,</Text>
              <Text style={[styles.label, { marginLeft: 40 }]}>{client.name}</Text>
              <Text style={{ marginLeft: 40, width: 200 }}>{client.address}</Text>
              <Text style={{ marginLeft: 40 }}>{client.city}</Text>
            </View>
          </View>
        </View>

        <Text style={{ marginBottom: 5 }}>Dear Sir,</Text>

        {/* --- Subject & Intro --- */}
        <View style={styles.subjectSection}>
          <Text style={[styles.subjectText, { textAlign: 'center' }]}>SUB: {defaults?.defaultSubject || 'QUOTATION FOR ELECTRICAL PANEL / WORKS.'}</Text>
          <Text style={styles.introText}>
            {defaults?.defaultIntro || 'We thank you for your enquiry and we have pleasure in submitting our offer towards above mentioned to subject which requires your approval.'}
          </Text>
        </View>

        {/* --- Price Offer Header --- */}
        <View style={styles.sectionHeaderBar}>
          <Text>(I) Price Offer</Text>
        </View>

        {/* --- Table --- */}
        <View style={styles.tableContainer}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Sl No</Text>
            <Text style={styles.col2}>Description</Text>
            <Text style={styles.col3}>Qty Nos</Text>
            <Text style={styles.col4}>Price</Text>
            <Text style={styles.col5}>Make</Text>
            <Text style={styles.col6}>Total (Rs)</Text>
          </View>

          {/* Data Rows */}
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{item.description}</Text>
              <Text style={styles.col3}>{item.qty} {item.unit || 'NOS'}</Text>
              {/* Note: Image has Price/Make empty, but we fill them if data exists */}
              <Text style={styles.col4}>{formatCurrency(item.rate)}</Text>
              <Text style={styles.col5}>{item.make || '-'}</Text>
              <Text style={styles.col6}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}

          {/* --- Totals Calculation Rows --- */}
          
          {/* BASIC */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabelCol}>BASIC</Text>
            <Text style={styles.totalValueCol}>{formatCurrency(totals.subtotal)}</Text>
          </View>

          {/* TOTAL (Can be same as basic in this layout, or subtotal) */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabelCol}>TOTAL</Text>
            <Text style={styles.totalValueCol}>{formatCurrency(totals.subtotal)}</Text>
          </View>

          {/* GST */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabelCol}>GST @ {gstRate}%</Text>
            <Text style={styles.totalValueCol}>{formatCurrency(totals.gst)}</Text>
          </View>

          {/* GRAND TOTAL */}
          <View style={[styles.totalsRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.totalLabelCol, { fontFamily: 'Helvetica-Bold' }]}>GRAND TOTAL</Text>
            <Text style={[styles.totalValueCol, { fontFamily: 'Helvetica-Bold' }]}>{formatCurrency(totals.total)}</Text>
          </View>
        </View>

        {/* Note Section */}
        <Text style={[styles.label, { fontSize: 9, textDecoration: 'underline', marginTop: 2 }]}>Note:</Text>

        {/* --- Terms & Conditions --- */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsHeader}>(II) TERMS & CONDITIONS</Text>

          {defaults?.terms ? (
            defaults.terms.split('\n').map((term, index) => (
              <View key={index} style={styles.termRow}>
                <Text style={styles.termBullet}>{String.fromCharCode(97 + index)}.</Text>
                <Text style={styles.termText}>{term.trim()}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.termRow}>
                <Text style={styles.termBullet}>a.</Text>
                <Text style={styles.termText}>Price Basis : Above prices are inclusive of all taxes & duties</Text>
              </View>
              <View style={styles.termRow}>
                <Text style={styles.termBullet}>b.</Text>
                <Text style={styles.termText}>Payment : 50% advance.</Text>
              </View>
              <View style={styles.termRow}>
                <Text style={styles.termBullet}>c.</Text>
                <Text style={styles.termText}>Transport : Extra</Text>
              </View>
              <View style={styles.termRow}>
                <Text style={styles.termBullet}>d.</Text>
                <Text style={styles.termText}>
                  Taxes & duties : The statutory levies rates given under are as applicable at present, however the rate applicable at the time of dispatch shall be applicable.
                  {'\n'}a) GST @ {gstRate}% Includes
                </Text>
              </View>
              <View style={styles.termRow}>
                <Text style={styles.termBullet}>e.</Text>
                <Text style={styles.termText}>Validity: 15 days from today & thereafter subject to our confirmation.</Text>
              </View>
            </>
          )}

          <Text style={{ marginTop: 10, textAlign: 'center' }}>
             We hope you will find our offer acceptable and we look forward to the pleasure of receiving your valued order, which we assure you will receive our best & prompt attention.
          </Text>
        </View>

        {/* --- Footer / Signature --- */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.label}>Thanking you,</Text>
            <Text style={styles.label}>Sincerely Yours,</Text>
          </View>
          
          <View style={styles.signatureBlock}>
            <Text style={styles.label}>for {company.name}</Text>
            <Text style={styles.signSpace}>AUTHORIZED SIGNATORY</Text>
            <Text style={{ marginTop: 2 }}>{company.phone}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default QuotationPDF;