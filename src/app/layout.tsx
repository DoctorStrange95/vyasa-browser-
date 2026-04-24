import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeedbackButton from "@/components/FeedbackButton";
import FacilityDrawer from "@/components/FacilityDrawer";
import { getUserSession } from "@/lib/userAuth";

const BASE_URL = "https://healthforindia.vyasa.health";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "HealthForIndia — India's Public Health Transparency Platform",
    template: "%s | HealthForIndia",
  },
  description:
    "District-level public health data for every Indian state and UT — infant mortality, vaccination coverage, disease outbreaks, hospital infrastructure, nutrition and air quality. Powered by NFHS-5, SRS 2023, IDSP and MoHFW.",
  keywords: [
    "India public health data", "district health statistics India", "IMR India",
    "infant mortality rate India", "NFHS-5 data", "IDSP outbreak report",
    "vaccination coverage India", "hospital infrastructure India", "health score India",
    "India disease surveillance", "MoHFW data", "SRS 2023 India",
  ],
  authors: [{ name: "Vyasa Health", url: BASE_URL }],
  creator: "Vyasa Health",
  publisher: "Vyasa Health",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "HealthForIndia by Vyasa",
    title: "HealthForIndia — India's Public Health Transparency Platform",
    description:
      "Real-time district-level health data across 36 states and UTs. IMR, vaccination, disease outbreaks, hospital beds, air quality — all in one place.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "HealthForIndia Dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@VyasaHealth",
    creator: "@VyasaHealth",
    title: "HealthForIndia — India's Public Health Transparency Platform",
    description:
      "Real-time district-level health data across 36 states and UTs. IMR, vaccination, disease outbreaks, hospital beds, air quality.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: BASE_URL },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header user={session} />
        <main>{children}</main>
        <Footer />
        <FeedbackButton />
        <FacilityDrawer />
      </body>
    </html>
  );
}
