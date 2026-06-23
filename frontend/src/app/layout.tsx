import "./globals.css";
import requests from "@/lib/requests";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getMeUrl } from "@/config/urls";
import AuthProvider from "@/providers/AuthProvider";
import { siteConfig } from "@/config/site";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const session = await requests.get(getMeUrl);

  return (
    <html lang="en">
      <body className="accent-primary" style={inter.style}>
        <AuthProvider session={session?.data}>
          <Toaster theme="light" richColors position="top-right" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

