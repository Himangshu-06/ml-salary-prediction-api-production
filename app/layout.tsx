import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "CompAnalytics",
  description: "Swiss Editorial Salary Prediction Tool powered by FastAPI, Next.js, and Supabase",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/logo.png" },
      { url: "/Logo.png" }
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
