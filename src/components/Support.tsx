import { HelpCircle, MessageSquare, Book, Mail, ExternalLink } from 'lucide-react';

export function Support() {
  return (
    <div className="p-4 md:p-10 space-y-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl md:text-4xl font-black font-headline tracking-tighter text-on-surface">Central de Suporte</h2>
        <p className="text-on-surface-variant mt-2">Como podemos ajudar você com a gestão do cofre?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-4 hover:border-secondary/30 transition-all group">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Book className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="text-lg font-bold text-on-surface">Base de Conhecimento</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Tutoriais detalhados sobre como cadastrar ativos, realizar transferências e interpretar os relatórios do dashboard.
          </p>
          <button className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-widest hover:underline">
            Acessar Documentação <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-4 hover:border-primary/30 transition-all group">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-on-surface">Chat em Tempo Real</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Fale com um especialista técnico para resolver problemas críticos de inventário ou erros de sincronização.
          </p>
          <button className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest hover:underline">
            Iniciar Conversa <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-4 hover:border-tertiary/30 transition-all group">
          <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mail className="w-6 h-6 text-tertiary" />
          </div>
          <h3 className="text-lg font-bold text-on-surface">Suporte por E-mail</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Para dúvidas menos urgentes ou solicitações de novas funcionalidades, envie um ticket para nossa equipe.
          </p>
          <button className="flex items-center gap-2 text-tertiary text-xs font-bold uppercase tracking-widest hover:underline">
            Enviar E-mail <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-surface-container p-6 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center space-y-4">
          <HelpCircle className="w-10 h-10 text-on-surface-variant/20" />
          <p className="text-xs text-on-surface-variant font-medium">
            Versão do Sistema: 2.4.0-build.2024<br/>
            ID da Instância: COFRE-PR-001
          </p>
        </div>
      </div>
    </div>
  );
}
