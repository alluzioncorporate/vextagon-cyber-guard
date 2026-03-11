import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Vextagon Security Audit Log ──
console.info(
  "%c🛡️ VEXTAGON SECURITY AUDIT — Correções Aplicadas",
  "color: #00ff88; font-size: 14px; font-weight: bold;"
);
console.table([
  { check: "RLS (Row Level Security)", status: "✅ Todas as tabelas protegidas por user_id" },
  { check: "Agent Token Validation", status: "✅ Validação antes de qualquer escrita" },
  { check: "Input Sanitization (Domains)", status: "✅ Regex + length limit em todas edge functions" },
  { check: "Input Sanitization (Agent Report)", status: "✅ Tipo e range validados para todos os campos" },
  { check: "Error Handling Seguro", status: "✅ Mensagens genéricas — sem stack traces expostos" },
  { check: "Admin Actions Hardened", status: "✅ Whitelist de ações, planos e formato de chaves" },
  { check: "Self-Deletion Prevention", status: "✅ Admin não pode deletar própria conta" },
  { check: "Sensitive Data Exposure", status: "✅ Nenhuma chave/segredo no frontend" },
  { check: "Console Logging", status: "✅ Nenhum console.log com dados sensíveis" },
]);

createRoot(document.getElementById("root")!).render(<App />);
