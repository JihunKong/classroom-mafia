# 마피아 게임 디버깅 도구 사용 가이드

## 개요
시나리오 기반 디버깅 도구는 다양한 게임 상황을 자동으로 시뮬레이션하여 버그를 찾고 게임 로직을 검증하는 도구입니다.

## 사용 방법

### 1. 디버깅 모드 활성화
개발 환경에서만 사용 가능합니다:
```bash
NODE_ENV=development npm run dev:server
```

### 2. API 엔드포인트

#### 시나리오 목록 조회
```bash
GET http://localhost:3001/api/debug/scenarios
```

응답 예시:
```json
{
  "success": true,
  "scenarios": [
    {
      "id": "doctor-self-heal",
      "name": "의사 자가 치료",
      "playerCount": 6,
      "description": "의사가 마피아의 공격 대상이 되었을 때 자신을 치료하는 시나리오"
    },
    {
      "id": "spy-mafia-vote",
      "name": "스파이 마피아 투표 참여",
      "playerCount": 11,
      "description": "스파이가 마피아 투표에 참여하고 정보를 확인하는 시나리오"
    }
  ]
}
```

#### 시나리오 실행
```bash
POST http://localhost:3001/api/debug/scenarios/{scenario-id}/run
```

응답 예시:
```json
{
  "success": true,
  "result": {
    "scenarioId": "doctor-self-heal",
    "success": true,
    "results": [
      { "success": true }
    ],
    "finalState": {
      "phase": "night",
      "day": 1,
      "alivePlayers": [
        { "id": "mafia1", "role": "mafia", "roleName": "마피아" },
        { "id": "doctor1", "role": "doctor", "roleName": "의사" }
      ],
      "deadPlayers": []
    },
    "message": "의사가 자신을 치료하여 생존"
  }
}
```

## 사전 정의된 시나리오

### 1. doctor-self-heal (6명)
- **설명**: 의사가 마피아의 공격 대상이 되었을 때 자신을 치료
- **검증 항목**: 의사의 자가 치료 기능
- **예상 결과**: 의사 생존

### 2. spy-mafia-vote (11명)
- **설명**: 스파이가 마피아 투표에 참여하고 정보 확인
- **검증 항목**: 스파이의 마피아 투표 참여 기능
- **예상 결과**: 스파이가 투표한 대상이 제거됨

### 3. reporter-publish (12명)
- **설명**: 기자가 밤에 조사한 정보를 다음날 공개
- **검증 항목**: 기자의 역할 공개 기능
- **예상 결과**: 다음날 낮에 대상의 역할이 공개됨

### 4. complex-16-player (16명)
- **설명**: 여러 특수 역할이 동시에 행동하는 복잡한 시나리오
- **검증 항목**: 
  - 의사 자가 치료
  - 경찰의 스파이 조사 (무고한 시민으로 표시)
  - 기자의 역할 공개
  - 바텐더의 능력 봉인
- **예상 결과**: 복합적인 상호작용이 올바르게 처리됨

## 시나리오 추가 방법

`server/src/debug/GameDebugger.ts` 파일의 `initializeScenarios()` 메서드에 새 시나리오를 추가합니다:

```typescript
this.scenarios.set('new-scenario-id', {
  name: '시나리오 이름',
  playerCount: 10,
  description: '시나리오 설명',
  steps: [
    {
      phase: 'night',
      actions: [
        { playerId: 'mafia1', actionType: 'kill', targetId: 'citizen1' },
        { playerId: 'doctor1', actionType: 'heal', targetId: 'citizen1' }
      ],
      expectedState: {
        alivePlayers: ['mafia1', 'doctor1', 'citizen1', ...],
        deadPlayers: []
      }
    }
  ],
  expectedOutcome: '예상 결과 설명'
});
```

## 주의사항

1. **개발 환경 전용**: 프로덕션 환경에서는 디버그 API가 비활성화됩니다.
2. **시뮬레이션 한계**: 실제 게임의 모든 복잡한 상호작용을 완벽하게 재현하지 못할 수 있습니다.
3. **로그 확인**: 시나리오 실행 시 서버 콘솔에 상세한 로그가 출력됩니다.

## 활용 예시

### CI/CD 파이프라인에서 자동 테스트
```bash
# 모든 시나리오 실행 스크립트
#!/bin/bash
scenarios=("doctor-self-heal" "spy-mafia-vote" "reporter-publish" "complex-16-player")

for scenario in "${scenarios[@]}"; do
  echo "Running scenario: $scenario"
  result=$(curl -X POST http://localhost:3001/api/debug/scenarios/$scenario/run)
  success=$(echo $result | jq -r '.result.success')
  
  if [ "$success" != "true" ]; then
    echo "Scenario $scenario failed!"
    exit 1
  fi
done

echo "All scenarios passed!"
```

### 버그 재현
특정 버그를 재현하는 시나리오를 작성하여 수정 전후 동작을 비교할 수 있습니다.