import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
} from "@react-email/components";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PaymentReminderEmailProps {
  ownerName: string;
  chargeTitle: string;
  totalAmount: string;
  amountPaid: string;
  remainingAmount: string;
  dueDate: string;
  buildingName: string;
  buildingAddress: string;
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------
export function PaymentReminderEmail({
  ownerName,
  chargeTitle,
  totalAmount,
  amountPaid,
  remainingAmount,
  dueDate,
  buildingName,
  buildingAddress,
}: PaymentReminderEmailProps) {
  return (
    <Html>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Rappel de paiement</Heading>

          <Text style={textStyle}>
            Bonjour {ownerName},
          </Text>

          <Text style={textStyle}>
            Nous vous rappelons qu&apos;un paiement est en attente pour la
            charge suivante :
          </Text>

          {/* Charge details */}
          <Section style={detailsBoxStyle}>
            <Text style={labelStyle}>Charge</Text>
            <Text style={valueStyle}>{chargeTitle}</Text>

            <Text style={labelStyle}>Date d&apos;échéance</Text>
            <Text style={valueStyle}>{dueDate}</Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Financial summary */}
          <Section style={detailsBoxStyle}>
            <Text style={labelStyle}>Montant total</Text>
            <Text style={valueStyle}>{totalAmount} MAD</Text>

            <Text style={labelStyle}>Montant payé</Text>
            <Text style={valueStyle}>{amountPaid} MAD</Text>

            <Text style={labelStyle}>Solde restant</Text>
            <Text style={highlightValueStyle}>{remainingAmount} MAD</Text>
          </Section>

          <Hr style={hrStyle} />

          <Text style={textStyle}>
            Merci de procéder au règlement dans les meilleurs délais afin
            d&apos;éviter tout retard.
          </Text>

          {/* Building contact */}
          <Section style={footerSectionStyle}>
            <Text style={footerBuildingStyle}>{buildingName}</Text>
            <Text style={footerAddressStyle}>{buildingAddress}</Text>
          </Section>

          <Text style={footerStyle}>
            Cet e-mail a été envoyé automatiquement par le système de gestion
            de votre copropriété.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Inline styles (email client compatibility)
// ---------------------------------------------------------------------------
const bodyStyle = {
  backgroundColor: "#0a0a0a",
  fontFamily: "system-ui, -apple-system, sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "40px 24px",
};

const headingStyle = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: 600 as const,
  lineHeight: "1.3",
  margin: "0 0 16px",
};

const textStyle = {
  color: "#a0a0a0",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const detailsBoxStyle = {
  backgroundColor: "#161616",
  borderRadius: "10px",
  border: "1px solid #2a2a2a",
  padding: "16px 20px",
  margin: "16px 0",
};

const labelStyle = {
  color: "#636363",
  fontSize: "11px",
  fontWeight: 400 as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  margin: "0 0 4px",
};

const valueStyle = {
  color: "#ffffff",
  fontSize: "14px",
  fontFamily: "monospace",
  margin: "0 0 12px",
};

const highlightValueStyle = {
  color: "#f97316",
  fontSize: "16px",
  fontWeight: 600 as const,
  fontFamily: "monospace",
  margin: "0 0 4px",
};

const hrStyle = {
  border: "none",
  borderTop: "1px solid #2a2a2a",
  margin: "24px 0",
};

const footerSectionStyle = {
  margin: "24px 0 8px",
};

const footerBuildingStyle = {
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 500 as const,
  margin: "0 0 2px",
};

const footerAddressStyle = {
  color: "#636363",
  fontSize: "12px",
  margin: "0 0 0",
};

const footerStyle = {
  color: "#636363",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "24px 0 0",
};
