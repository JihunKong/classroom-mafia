# 역할별 이미지 생성 프롬프트

## 이미지 생성 가이드라인
- **스타일**: Flat design, minimalist, game icon style
- **배경**: 투명 배경 (PNG) 또는 단색 원형 배경
- **색상**: 각 팀별 통일된 색상 테마 사용
  - 마피아팀: 빨강/검정 계열
  - 시민팀: 파랑/초록 계열  
  - 중립팀: 보라/회색 계열
- **크기**: 512x512px (정사각형)

## 마피아 팀 이미지 프롬프트

### 1. 마피아 (mafia.png)
```
A minimalist game icon of a mysterious mafia boss character, wearing a black fedora hat and dark suit, with a red tie, shadowy face partially hidden, circular red background, flat design style, simple geometric shapes, game asset
```

### 2. 스파이 (spy.png)
```
A minimalist game icon of a spy character with sunglasses and earpiece, wearing a black suit, holding a briefcase, mysterious silhouette, circular dark red background, flat design style, simple geometric shapes, game asset
```

### 3. 늑대인간 (werewolf.png)
```
A minimalist game icon of a werewolf transformation, half human half wolf face, glowing yellow eyes, sharp fangs, full moon in background, circular crimson background, flat design style, simple geometric shapes, game asset
```

### 4. 간첩 (double_agent.png)
```
A minimalist game icon of a double agent with two faces (like theater masks), one smiling one serious, wearing formal attire, circular burgundy background, flat design style, simple geometric shapes, game asset
```

## 시민 팀 이미지 프롬프트

### 5. 시민 (citizen.png)
```
A minimalist game icon of a friendly civilian character, simple smiling face, casual clothing, representing everyday person, circular light blue background, flat design style, simple geometric shapes, game asset
```

### 6. 경찰 (police.png)
```
A minimalist game icon of a police officer with police cap and badge, holding magnifying glass, detective pose, circular navy blue background, flat design style, simple geometric shapes, game asset
```

### 7. 의사 (doctor.png)
```
A minimalist game icon of a doctor character with white coat and stethoscope, medical cross symbol, healing gesture, circular teal background, flat design style, simple geometric shapes, game asset
```

### 8. 군인 (soldier.png)
```
A minimalist game icon of a soldier in military uniform with helmet, protective stance, shield symbol, circular green background, flat design style, simple geometric shapes, game asset
```

### 9. 기자 (reporter.png)
```
A minimalist game icon of a reporter with press badge, holding microphone and notepad, news camera in background, circular blue background, flat design style, simple geometric shapes, game asset
```

### 10. 탐정 (detective.png)
```
A minimalist game icon of a detective with detective hat and coat, holding magnifying glass, question marks around, circular indigo background, flat design style, simple geometric shapes, game asset
```

### 11. 술집사장 (bartender.png)
```
A minimalist game icon of a bartender with bow tie, holding cocktail shaker, bar counter silhouette, circular amber background, flat design style, simple geometric shapes, game asset
```

### 12. 치어리더 (cheerleader.png)
```
A minimalist game icon of a cheerleader with pom-poms, energetic pose, star symbols, circular bright blue background, flat design style, simple geometric shapes, game asset
```

### 13. 마법사 (wizard.png)
```
A minimalist game icon of a wizard with pointed hat and beard, holding magic wand with sparkles, mystical symbols, circular deep blue background, flat design style, simple geometric shapes, game asset
```

### 14. 영매 (medium.png)
```
A minimalist game icon of a medium with crystal ball, mystical third eye symbol, ghost wisps around, circular midnight blue background, flat design style, simple geometric shapes, game asset
```

### 15. 도둑 (thief.png)
```
A minimalist game icon of a thief with mask and hood, sneaky pose, lock-picking tools, circular dark blue background, flat design style, simple geometric shapes, game asset
```

## 중립/특수 팀 이미지 프롬프트

### 16. 변절자 (turncoat.png)
```
A minimalist game icon of a character with split personality, half light half dark clothing, turning arrow symbol, circular purple background, flat design style, simple geometric shapes, game asset
```

### 17. 테러리스트 (terrorist.png)
```
A minimalist game icon of a masked character with dynamite or bomb symbol (non-violent representation), countdown timer, circular dark gray background, flat design style, simple geometric shapes, game asset
```

### 18. 환술사 (illusionist.png)
```
A minimalist game icon of an illusionist with top hat, magic cards floating, smoke effects, swap arrows, circular violet background, flat design style, simple geometric shapes, game asset
```

### 19. 귀신 (ghost.png)
```
A minimalist game icon of a cute ghost character, translucent floating spirit, ethereal wisps, circular pale purple background, flat design style, simple geometric shapes, game asset
```

## 추가 UI 아이콘

### 20. 낮 (day_phase.png)
```
A minimalist sun icon with radiating rays, bright yellow and orange colors, circular design, flat style game asset
```

### 21. 밤 (night_phase.png)
```
A minimalist moon and stars icon, crescent moon with small stars, dark blue and yellow colors, circular design, flat style game asset
```

### 22. 투표 (vote_icon.png)
```
A minimalist ballot box icon with hand inserting vote, simple geometric shapes, blue and white colors, flat style game asset
```

### 23. 사망 (death_icon.png)
```
A minimalist skull or gravestone icon (non-scary, game-friendly), gray colors, simple shapes, flat style game asset
```

## 파일 구조
```
client/src/assets/images/roles/
├── mafia-team/
│   ├── mafia.png
│   ├── spy.png
│   ├── werewolf.png
│   └── double_agent.png
├── citizen-team/
│   ├── citizen.png
│   ├── police.png
│   ├── doctor.png
│   ├── soldier.png
│   ├── reporter.png
│   ├── detective.png
│   ├── bartender.png
│   ├── cheerleader.png
│   ├── wizard.png
│   ├── medium.png
│   └── thief.png
├── neutral-team/
│   ├── turncoat.png
│   ├── terrorist.png
│   ├── illusionist.png
│   └── ghost.png
└── ui/
    ├── day_phase.png
    ├── night_phase.png
    ├── vote_icon.png
    └── death_icon.png
```