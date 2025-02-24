"use client";
import { AuthProvider } from "@/app/context/AuthContext";
import Navbar from "@/components/Navbar";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100"> {/* Đặt màu nền để nhìn rõ UI hơn */}
        <AuthProvider>
          <Navbar />
          <main className="main-content">{children}</main> {/* Đẩy nội dung xuống */}
        </AuthProvider>
      </body>
    </html>
  );
}
