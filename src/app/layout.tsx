import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeedbackButton from "@/components/FeedbackButton";
import FacilityDrawer from "@/components/FacilityDrawer";
import { getUserSession } from "@/lib/userAuth";

export const metadata: Metadata = {
  title: "HealthForIndia by Vyasa",
  description: "India's public health transparency platform — district-level data on IMR, hospitals, vaccination, PMJAY and air quality.",
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
