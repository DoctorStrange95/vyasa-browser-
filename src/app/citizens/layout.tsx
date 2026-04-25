import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citizens Health Centre — Find Hospitals, Emergency & Health Locker",
  description: "Find Ayushman Bharat empanelled hospitals across all 36 Indian states by district and speciality. Emergency helplines: 108 ambulance, 14555 PM-JAY. Secure health document locker.",
};

export default function CitizensLayout({ children }: { children: React.ReactNode }) {
  return children;
}
