"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          success: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/40',
          title: 'text-[15px] font-bold text-white',
          description: 'text-[13px] text-emerald-50 mt-1.5 font-medium leading-relaxed',
        },
        style: {
          background: 'white',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: '500',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
