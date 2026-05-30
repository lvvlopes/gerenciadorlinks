import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "LinkVault — Sua biblioteca de links com IA",
  description: "Salve, organize e resuma seus links favoritos com inteligência artificial",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1a1b24",
                color: "#e8e9f0",
                border: "1px solid #2a2c3a",
                fontFamily: "'Space Grotesk', sans-serif",
              },
              success: {
                iconTheme: { primary: "#39ff14", secondary: "#0a0b0e" },
              },
              error: {
                iconTheme: { primary: "#ff4444", secondary: "#0a0b0e" },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
