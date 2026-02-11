import { AlertTriangle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 px-6 py-3">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="w-4 h-4 text-primary" />
        <p>
          <span className="font-semibold text-foreground">Leaf-Master 면책조항:</span> 모든 시그널은 AI 모의투자이며 실제 자금이 투입되지 않습니다. 
          투자 판단의 최종 책임은 본인에게 있습니다.
        </p>
      </div>
    </footer>
  );
}
