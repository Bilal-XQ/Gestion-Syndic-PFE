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

interface WelcomeEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export function WelcomeEmail({
  firstName,
  lastName,
  email,
  tempPassword,
  loginUrl,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            Bienvenue, {firstName} {lastName}
          </Heading>

          <Text style={textStyle}>
            Votre compte copropriétaire a été créé. Vous pouvez maintenant
            accéder à votre espace personnel pour consulter vos charges et
            paiements.
          </Text>

          <Section style={credentialsStyle}>
            <Text style={labelStyle}>Adresse e-mail</Text>
            <Text style={valueStyle}>{email}</Text>
            <Text style={labelStyle}>Mot de passe temporaire</Text>
            <Text style={valueStyle}>{tempPassword}</Text>
          </Section>

          <Hr style={hrStyle} />

          <Text style={textStyle}>
            Pour des raisons de sécurité, veuillez modifier votre mot de passe
            lors de votre première connexion.
          </Text>

          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Button style={buttonStyle} href={loginUrl}>
              Se connecter
            </Button>
          </Section>

          <Text style={footerStyle}>
            Si vous n&apos;avez pas demandé ce compte, veuillez ignorer cet
            e-mail.
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

const credentialsStyle = {
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

const hrStyle = {
  border: "none",
  borderTop: "1px solid #2a2a2a",
  margin: "24px 0",
};

const buttonStyle = {
  backgroundColor: "#ffffff",
  color: "#0a0a0a",
  fontSize: "14px",
  fontWeight: 500 as const,
  borderRadius: "10px",
  padding: "10px 24px",
  textDecoration: "none",
  display: "inline-block" as const,
};

const footerStyle = {
  color: "#636363",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "24px 0 0",
};
