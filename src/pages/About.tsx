import { Shield, ExternalLink, MapPin, Globe } from "lucide-react";

export default function About() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">Sobre o Vextagon</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Plataforma de cibersegurança corporativa</p>
      </div>

      <div className="v-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">VEXTAGON</h2>
            <p className="font-mono text-[10px] text-muted-foreground">Cybersecurity Platform v1.0</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-foreground leading-relaxed">
            O Vextagon é uma plataforma completa de cibersegurança desenvolvida para empresas que precisam 
            de monitoramento contínuo, proteção ativa e inteligência de ameaças. Inclui WAF, EASM Scanner, 
            monitoramento de servidores, detecção de vazamentos, simulação de phishing e muito mais.
          </p>
          <p className="text-xs text-foreground leading-relaxed">
            Projetado com foco em performance, segurança e usabilidade, o Vextagon integra múltiplas 
            ferramentas de segurança em uma única interface minimalista e profissional.
          </p>
        </div>
      </div>

      <div className="v-card p-6 space-y-4">
        <h3 className="v-section-title">Desenvolvido por</h3>
        <div className="rounded bg-secondary/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Alluzion Corporate</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Segurança cibernética avançada, hardware de alto desempenho e suporte completo. 
            A Alluzion Corporate atua em Londrina e região, oferecendo soluções personalizadas 
            em tecnologia, incluindo o Firewall Onagon, criação de sites, manutenção especializada 
            e recuperação de dados.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Londrina e Região — Paraná, Brasil</span>
          </div>
          <a
            href="https://www.alluzioncorporate.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-cyan transition-colors hover:bg-primary/10"
          >
            <Globe className="h-3 w-3" />
            www.alluzioncorporate.com
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="v-card p-6 space-y-3">
        <h3 className="v-section-title">Serviços Alluzion</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Firewall Onagon",
            "Criação de Sites",
            "Formatação de Sistemas",
            "Manutenção Especializada",
            "Recuperação de Dados",
            "Consultoria em Segurança",
          ].map((s) => (
            <div key={s} className="rounded bg-secondary/40 px-3 py-2">
              <span className="font-mono text-[11px] text-foreground">{s}</span>
            </div>
          ))}
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
