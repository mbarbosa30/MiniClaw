import { AlertCircle } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function NotFound() {
  const t = useTheme();
  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
      <div style={{ padding: '24px', maxWidth: 400, width: '100%', margin: '0 16px', border: `1px solid ${t.divider}`, borderRadius: 16, background: t.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AlertCircle size={22} color="#f87171" strokeWidth={1.5} />
          <h1 style={{ fontSize: 18, fontWeight: 600, color: t.text, letterSpacing: '-0.02em' }}>404 — Not Found</h1>
        </div>
        <p style={{ fontSize: 12, color: t.label, lineHeight: 1.6 }}>
          This page doesn't exist. Open MiniClaw from MiniPay.
        </p>
      </div>
    </div>
  );
}
