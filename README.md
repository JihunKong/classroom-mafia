# 🎭 Korean Mafia Game - 교실용 마피아 게임

실시간 멀티플레이어 한국어 마피아 게임입니다. 6-20명의 학생들이 스마트폰으로 참여할 수 있습니다.

## 🚀 주요 기능

- **실시간 멀티플레이어**: Socket.io 기반 실시간 통신
- **모바일 최적화**: 스마트폰 화면에 최적화된 UI
- **18가지 역할**: 마피아팀, 시민팀, 중립팀의 다양한 역할
- **자동 진행**: 게임 마스터 없이 자동으로 진행
- **선생님 대시보드**: 교실 관리를 위한 별도 인터페이스
- **PWA 지원**: 오프라인 접속 가능

## 📱 게임 방법

1. 호스트가 "방 만들기"를 클릭하여 4자리 참여 코드 생성
2. 다른 플레이어들이 참여 코드를 입력하여 입장
3. 6명 이상 모이면 호스트가 게임 시작
4. 자동으로 역할 배정 및 게임 진행

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Socket.io
- **Testing**: Playwright (20명 동시 접속 테스트 완료)
- **Deployment**: Docker + Railway

## 📊 성능

20명 동시 접속 테스트 결과:
- 평균 로딩 시간: 44ms/플레이어
- 메모리 사용량: 10MB/플레이어
- 접속 성공률: 100%

## 🚀 설치 방법

### 로컬 개발 환경

```bash
# 의존성 설치
npm run install:all

# 개발 서버 실행 (클라이언트: 5173, 서버: 3001)
npm run dev
```

### Docker

```bash
# 개발 환경
npm run docker:dev

# 프로덕션 환경
npm run docker:prod
```

### Railway 배포

1. Fork this repository
2. Connect to Railway
3. Add environment variables:
   - `PORT`: 3001
   - `CLIENT_URL`: Your Railway URL
   - `NODE_ENV`: production

## 🎮 역할 목록

### 마피아 팀
- **마피아**: 밤에 시민 제거
- **스파이**: 경찰 수사 방해
- **늑대인간**: 강력한 살해 능력
- **이중간첩**: 팀 변경 가능

### 시민 팀
- **경찰**: 마피아 조사
- **의사**: 시민 보호
- **군인**: 마피아 공격 1회 방어
- **기자**: 정보 공개
- **탐정**: 상세 조사
- **바텐더**: 능력 차단
- **응원단장**: 투표 가중치 증가
- **마법사**: 부활 능력
- **영매**: 죽은 자와 소통
- **도둑**: 능력 훔치기

### 중립 팀
- **배신자**: 조건부 팀 변경
- **테러리스트**: 동반 자살
- **마술사**: 환상 생성
- **유령**: 사후 활동

## 📚 문서

- [Docker 가이드](./DOCKER_README.md)
- [테스트 가이드](./TESTING_GUIDE.md)
- [Playwright 테스트](./README-PLAYWRIGHT-TESTS.md)
- [개발 가이드](./CLAUDE.md)

## 📄 라이센스

MIT License

## 🤝 기여

Issues와 Pull Request를 환영합니다!

---

Made with ❤️ for Korean classrooms