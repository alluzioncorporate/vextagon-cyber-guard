import { HeadphonesIcon, Globe, MapPin, Mail, MessageSquare, ExternalLink, Clock } from "lucide-react";

export default function Support() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">Contato & Suporte</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Entre em contato com a Alluzion Corporate</p>
      </div>

      {/* Contact Info */}
      <div className="v-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HeadphonesIcon className="h-4 w-4 text-primary" />
          <h3 className="v-section-title">Canais de Atendimento</h3>
        </div>

        <div className="space-y-2">
          <a
            href="https://www.alluzioncorporate.com/contato.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary/60"
          >
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-cyan" />
              <div>
                <p className="text-xs font-medium text-foreground">Site Oficial</p>
                <p className="font-mono text-[10px] text-muted-foreground">www.alluzioncorporate.com/contato</p>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>

          <a
            href="https://wa.me/5543999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary/60"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs font-medium text-foreground">WhatsApp Comercial</p>
                <p className="font-mono text-[10px] text-muted-foreground">Atendimento rápido via WhatsApp</p>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>

          <a
            href="mailto:contato@alluzioncorporate.com"
            className="flex items-center justify-between rounded bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary/60"
          >
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gold" />
              <div>
                <p className="text-xs font-medium text-foreground">E-mail</p>
                <p className="font-mono text-[10px] text-muted-foreground">contato@alluzioncorporate.com</p>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Location */}
      <div className="v-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="v-section-title">Localização</h3>
        </div>
        <div className="rounded bg-secondary/40 px-4 py-3">
          <p className="text-xs text-foreground font-medium">Alluzion Corporate</p>
          <p className="text-[11px] text-muted-foreground mt-1">Londrina e Região — Paraná, Brasil</p>
        </div>
      </div>

      {/* Hours */}
      <div className="v-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="v-section-title">Horário de Atendimento</h3>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between rounded bg-secondary/40 px-4 py-2">
            <span className="text-xs text-muted-foreground">Segunda a Sexta</span>
            <span className="font-mono text-xs text-foreground">08:00 – 18:00</span>
          </div>
          <div className="flex justify-between rounded bg-secondary/40 px-4 py-2">
            <span className="text-xs text-muted-foreground">Sábado</span>
            <span className="font-mono text-xs text-foreground">08:00 – 12:00</span>
          </div>
          <div className="flex justify-between rounded bg-secondary/40 px-4 py-2">
            <span className="text-xs text-muted-foreground">Emergências</span>
            <span className="font-mono text-xs text-cyan">24/7 via WhatsApp</span>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="font-mono text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} Alluzion Corporate. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
