/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin uses native Node.js modules — must not be bundled by webpack
  serverExternalPackages: ["firebase-admin", "google-auth-library"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",            value: "DENY" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security",  value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://firestore.googleapis.com https://api.groq.com https://news.google.com https://idsp.mohfw.gov.in https://nominatim.openstreetmap.org https://overpass-api.de https://wa.me",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
