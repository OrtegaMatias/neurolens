import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Tipografías: Inter (texto), Space Grotesk (títulos) y JetBrains Mono (cifras)
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display-face", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NeuroLens · Clasificador educativo de tumores cerebrales",
  description:
    "Prototipo educativo que clasifica resonancias magnéticas cerebrales en 4 clases (glioma, meningioma, tumor pituitario o sin tumor) con YOLO-cls nano, Grad-CAM y explicaciones generadas por IA. No es un diagnóstico médico.",
};

export const viewport: Viewport = {
  themeColor: "#030712",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL" className={`${inter.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
