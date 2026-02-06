import { AlertTriangle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 px-6 py-3">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="w-4 h-4 text-primary" />
        <p>
          <span className="font-semibold text-foreground">면책조항:</span> 코인 선물은 고위험 투자 상품입니다. 
          투자 책임은 본인에게 있으며, AI 시그널은 참고용입니다.
        </p>
      </div>
    </footer>
  );
}
