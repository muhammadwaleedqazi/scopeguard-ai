import type { Metadata } from "next";
import { Header } from "@/components/header";
import { ProjectProvider } from "@/components/project-provider";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ScopeGuard AI — Keep client scope clear",
    template: "%s | ScopeGuard AI",
  },
  description:
    "Turn scattered client agreements into a clear project record and protect your work from scope creep.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <ProjectProvider>
            <Header />
            <main>{children}</main>
          </ProjectProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
