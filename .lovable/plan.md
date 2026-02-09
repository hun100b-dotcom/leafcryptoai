

# AI 함께진입 포지션 P&L 자산 반영 수정

## 문제 분석

현재 `calculateRealTimeStats`에서 AI 함께진입 포지션의 종료된(WIN/LOSS/CANCELLED) 거래 수익/손실이 전혀 반영되지 않고 있습니다.

- 수동 포지션 종료 P&L: 반영됨 (getBaseStats의 closedPnL)
- AI 활성 포지션 미실현 P&L: 반영됨 (unrealizedAIPnL)
- **AI 종료 포지션 확정 P&L: 미반영** (이것이 문제)

따라서 AI 함께진입으로 수익/손실이 발생해도 현재 자산이 $1,000에서 변하지 않는 것입니다.

## 수정 계획

### 1. `useUserPositions.ts` - `calculateRealTimeStats` 함수 수정

`calculateRealTimeStats`의 `aiPositions` 파라미터를 확장하여 **종료된 AI 포지션도 포함**하도록 변경합니다.

변경 내용:
- 파라미터 타입에 `status`, `closePrice`, `currentPnl` 필드 추가
- 종료된 AI 포지션(WIN/LOSS/CANCELLED)의 확정 P&L을 `closedAIPnL`로 별도 계산
- `currentAsset = initialAsset + closedManualPnL + closedAIPnL + unrealizedPnL` 으로 수정

```text
closedAIPnL 계산 로직:
- 각 종료된 AI 포지션에 대해
- pnlPercent = (closePrice vs entryPrice) * leverage
- dollarPnL = allocatedAsset * (pnlPercent / 100)
- closedAIPnL += dollarPnL
```

### 2. `Positions.tsx` - AI 포지션 전체를 전달하도록 수정

현재 `ACTIVE` 상태만 필터링해서 전달하는 부분을 **모든 AI 포지션**을 전달하도록 변경합니다.

```text
변경 전: aiPositions.filter(p => p.status === 'ACTIVE')
변경 후: aiPositions (전체, status 포함)
```

### 3. 통계 표시에 AI 포지션 승패도 포함

`baseStats`의 wins/losses/winRate에 AI 종료 포지션 수도 합산하여 상단 통계에 전체 성적이 표시되도록 합니다.

---

### 기술 세부사항

**`useUserPositions.ts` 수정:**
- `calculateRealTimeStats`의 `aiPositions` 파라미터 타입 확장:
  ```
  { allocatedAsset, entryPrice, status, closePrice?, currentPnl?, signal? }[]
  ```
- 종료된 AI 포지션 P&L 합산 로직 추가
- AI 포지션 승/패 카운트를 stats에 합산

**`Positions.tsx` 수정:**
- `realTimeStats` 계산 시 모든 AI 포지션 데이터를 전달 (status, closePrice 포함)

