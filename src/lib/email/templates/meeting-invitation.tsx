import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Section,
} from "@react-email/components";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MeetingInvitationEmailProps {
  ownerName: string;
  meetingTitle: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  buildingName: string;
  portalUrl: string;
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------
export function MeetingInvitationEmail({
  ownerName,
  meetingTitle,
  meetingDate,
  startTime,
  endTime,
  location,
  description,
  buildingName,
  portalUrl,
}: MeetingInvitationEmailProps) {
  return (
    <Html>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Invitation à une réunion</Heading>

          <Text style={textStyle}>Bonjour {ownerName},</Text>

          <Text style={textStyle}>
            Vous êtes invité(e) à la réunion{" "}
            <strong style={{ color: "#ffffff" }}>{meetingTitle}</strong>.
          </Text>

          {/* Meeting details */}
          <Section style={detailsBoxStyle}>
            <Text style={labelStyle}>Date</Text>
            <Text style={valueStyle}>{meetingDate}</Text>

            <Text style={labelStyle}>Horaire</Text>
            <Text style={valueStyle}>
              {startTime} — {endTime}
            </Text>

            <Text style={labelStyle}>Lieu</Text>
            <Text style={valueStyle}>{location}</Text>

            {description && (
              <>
                <Text style={labelStyle}>Description</Text>
                <Text style={valueStyle}>{description}</Text>
              </>
            )}
          </Section>

          <Hr style={hrStyle} />

          <Text style={textStyle}>
            Veuillez vous connecter à votre espace personnel pour accepter ou
            décliner cette invitation.
          </Text>

          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Button style={buttonStyle} href={portalUrl}>
              Consulter mes invitations
            </Button>
          </Section>

          <Hr style={hrStyle} />

          {/* Building contact */}
          <Section style={footerSectionStyle}>
            <Text style={footerBuildingStyle}>{buildingName}</Text>
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
  margin: "0 0 12px",
};

const buttonStyle = {
  backgroundColor: "#ffffff",
  color: "#0a0a0a",
  fontSize: "14px",
  fontWeight: 600 as const,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block" as const,
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

const footerStyle = {
  color: "#636363",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "24px 0 0",
};
