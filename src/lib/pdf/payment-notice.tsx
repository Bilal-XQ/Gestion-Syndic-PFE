import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface PaymentNoticeProps {
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  apartment: {
    unitNumber: string;
    floor: number;
    buildingName: string;
  };
  charge: {
    title: string;
    description?: string;
    category: string;
    totalAmount: string;
    amountPaid: string;
    remainingAmount: string;
    dueDate: string;
  };
  building: {
    name: string;
    address: string;
  };
  generatedAt: string;
  labels: {
    title: string;
    ownerSectionTitle: string;
    fullName: string;
    apartment: string;
    floorPrefix: string;
    email: string;
    phone: string;
    chargeDetailsTitle: string;
    chargeTitle: string;
    category: string;
    description: string;
    dueDate: string;
    financialSummaryTitle: string;
    itemHeader: string;
    amountHeader: string;
    totalAmount: string;
    amountPaid: string;
    remainingBalance: string;
    generatedOn: string;
    informationalNotice: string;
    categories: Record<string, string>;
  };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    textAlign: "center",
    color: "#636363",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 16,
    color: "#1a1a1a",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "40%",
    color: "#636363",
    fontSize: 10,
  },
  value: {
    width: "60%",
    fontSize: 10,
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d4d4d4",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
    padding: 8,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tableRowHighlight: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fef3c7",
  },
  tableCellLeft: {
    width: "60%",
    fontSize: 10,
  },
  tableCellRight: {
    width: "40%",
    fontSize: 10,
    textAlign: "right",
  },
  tableCellBold: {
    width: "40%",
    fontSize: 11,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#d4d4d4",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#636363",
    textAlign: "center",
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatAmount(value: string): string {
  return `${Number(value).toFixed(2)} MAD`;
}

// ---------------------------------------------------------------------------
// Document component
// ---------------------------------------------------------------------------
export function PaymentNoticeDocument({
  owner,
  apartment,
  charge,
  building,
  generatedAt,
  labels,
}: PaymentNoticeProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{labels.title}</Text>
          <Text style={styles.headerSubtitle}>
            {building.name} — {building.address}
          </Text>
        </View>

        {/* Owner section */}
        <Text style={styles.sectionTitle}>{labels.ownerSectionTitle}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{labels.fullName}</Text>
          <Text style={styles.value}>
            {owner.firstName} {owner.lastName}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{labels.apartment}</Text>
          <Text style={styles.value}>
            {apartment.unitNumber} — {labels.floorPrefix} {apartment.floor}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{labels.email}</Text>
          <Text style={styles.value}>{owner.email}</Text>
        </View>
        {owner.phone && (
          <View style={styles.row}>
            <Text style={styles.label}>{labels.phone}</Text>
            <Text style={styles.value}>{owner.phone}</Text>
          </View>
        )}

        {/* Charge details */}
        <Text style={styles.sectionTitle}>{labels.chargeDetailsTitle}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{labels.chargeTitle}</Text>
          <Text style={styles.value}>{charge.title}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{labels.category}</Text>
          <Text style={styles.value}>
            {labels.categories[charge.category] ?? charge.category}
          </Text>
        </View>
        {charge.description && (
          <View style={styles.row}>
            <Text style={styles.label}>{labels.description}</Text>
            <Text style={styles.value}>{charge.description}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>{labels.dueDate}</Text>
          <Text style={styles.value}>{charge.dueDate}</Text>
        </View>

        {/* Financial table */}
        <Text style={styles.sectionTitle}>{labels.financialSummaryTitle}</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellLeft, styles.tableHeaderCell]}>
              {labels.itemHeader}
            </Text>
            <Text style={[styles.tableCellRight, styles.tableHeaderCell]}>
              {labels.amountHeader}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>{labels.totalAmount}</Text>
            <Text style={styles.tableCellRight}>
              {formatAmount(charge.totalAmount)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>{labels.amountPaid}</Text>
            <Text style={styles.tableCellRight}>
              {formatAmount(charge.amountPaid)}
            </Text>
          </View>
          <View style={styles.tableRowHighlight}>
            <Text style={[styles.tableCellLeft, { fontFamily: "Helvetica-Bold" }]}>
              {labels.remainingBalance}
            </Text>
            <Text style={styles.tableCellBold}>
              {formatAmount(charge.remainingAmount)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {labels.generatedOn} {generatedAt} — {building.name},{" "}
            {building.address}
          </Text>
          <Text style={styles.footerText}>
            {labels.informationalNotice}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Render function (server-side)
// ---------------------------------------------------------------------------
export async function renderPaymentNotice(
  props: PaymentNoticeProps
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <PaymentNoticeDocument {...props} />
  );
  return buffer as Buffer;
}
