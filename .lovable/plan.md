

# 수정 계획: 화이트리스트 DB 저장 + AI 포지션 P&L 자산 반영

---

## 문제 1: 화이트리스트 설정이 초기화됨

**원인**: 화이트리스트가 브라우저 `localStorage`에만 저장됩니다. AI 시그널 생성은 서버(백엔드 함수)에서 실행되기 때문에 `localStorage`에 접근할 수 없어, 항상 기본 하드코딩된 5개 코인(BTC, ETH, SOL, XRP, DOGE)만 분석합니다.

**해결 방법**: 화이트리스트를 데이터베이스 `user_settings` 테이블에 저장하고, 시그널 생성 시 DB에서 읽어옵니다.

### 변경 사항

1. **DB 마이그레이션**: `user_settings` 테이블에 `whitelist_coins` 컬럼 추가 (text[] 타입, 기본값 모든 코인)

2. **`WhitelistSettings.tsx`**: `localStorage` 대신 Supabase `user_settings` 테이블에서 읽고 저장하도록 변경

3. **`ai-signal-generator/index.ts`**: 하드코딩된 `symbols` 배열 대신, DB의 `user_settings.whitelist_coins`를 읽어 해당 코인만 분석

---

## 문제 2: AI 함께진입 종료 포지션 P&L 미반영

**원인**: `Positions.tsx`에서 `calculateRealTimeStats`에 ACTIVE 상태의 AI 포지션만 전달하고 있어, 종료된(WIN/LOSS) AI 포지션의 확정 수익/손실이 현재 자산에 반영되지 않습니다.

**해결 방법**: 종료된 AI 포지션도 함께 전달하여 확정 P&L을 자산에 합산합니다.

### 변경 사항

1. **`useUserPositions.ts`** - `calculateRealTimeStats` 수정:
   - 파라미터 타입 확장: `status`, `closePrice`, `currentPnl` 필드 추가
   - 종료된 AI 포지션(WIN/LOSS/CANCELLED)의 확정 P&L을 별도 합산
   - `currentAsset = initialAsset + closedManualPnL + closedAIPnL + unrealizedPnL`

2. **`Positions.tsx`** - 전체 AI 포지션 전달:
   - ACTIVE만 필터하던 로직을 모든 AI 포지션(status, closePrice, currentPnl 포함)으로 변경
   - AI 포지션 승/패도 전체 통계(승률, 승/패 수)에 합산

---

## 기술 세부사항

### DB 마이그레이션 SQL
```sql
ALTER TABLE user_settings 
ADD COLUMN whitelist_coins text[] DEFAULT ARRAY['BTC','ETH','SOL','XRP','DOGE','ADA','AVAX','LINK','DOT','MATIC','UNI','ATOM','LTC','BCH','APT'];
```

### WhitelistSettings.tsx 주요 변경
- `localStorage.getItem/setItem` 제거
- `supabase.from('user_settings').select('whitelist_coins')` 로 로드
- `supabase.from('user_settings').update({ whitelist_coins: [...] })` 로 저장

### ai-signal-generator/index.ts 주요 변경
- 하드코딩된 `symbols = ["BTCUSDT", ...]` 제거
- DB에서 `whitelist_coins`를 읽어 `symbols = whitelist.map(s => s + "USDT")` 로 동적 생성

### calculateRealTimeStats 파라미터 확장
```text
aiPositions 타입 변경:
기존: { allocatedAsset, entryPrice, signal? }[]
변경: { allocatedAsset, entryPrice, status, closePrice?, currentPnl?, signal? }[]

새 로직:
- ACTIVE 포지션 -> 미실현 P&L (기존 로직 유지)
- WIN/LOSS/CANCELLED 포지션 -> closedAIPnL에 확정 P&L 합산
- currentAsset에 closedAIPnL 추가
```

### Positions.tsx 변경
```text
기존: aiPositions.filter(p => p.status === 'ACTIVE').map(...)
변경: aiPositions.map(p => ({ ...p에서 필요한 필드 전부 포함 }))
```

