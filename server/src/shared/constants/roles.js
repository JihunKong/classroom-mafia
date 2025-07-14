"use strict";
// shared/constants/roles.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_ACTIONS = exports.ROLES = exports.ROLE_DISTRIBUTIONS = exports.MAX_PLAYERS = exports.MIN_PLAYERS = void 0;
exports.isValidPlayerCount = isValidPlayerCount;
exports.canUseRole = canUseRole;
exports.createRoleArray = createRoleArray;
exports.getTeamCounts = getTeamCounts;
// 최소/최대 인원 설정
exports.MIN_PLAYERS = 6;
exports.MAX_PLAYERS = 20;
// 인원수별 역할 배분 설정
exports.ROLE_DISTRIBUTIONS = {
    6: {
        mafia: 1,
        citizen: 4,
        doctor: 1
    },
    7: {
        mafia: 2,
        citizen: 4,
        doctor: 1
    },
    8: {
        mafia: 2,
        citizen: 5,
        doctor: 1
    },
    9: {
        mafia: 2,
        citizen: 5,
        doctor: 1,
        police: 1
    },
    10: {
        mafia: 2,
        citizen: 5,
        doctor: 1,
        police: 1,
        soldier: 1
    },
    11: {
        mafia: 2,
        spy: 1,
        citizen: 5,
        doctor: 1,
        police: 1,
        soldier: 1
    },
    12: {
        mafia: 3,
        citizen: 5,
        doctor: 1,
        police: 1,
        soldier: 1,
        reporter: 1
    },
    13: {
        mafia: 3,
        spy: 1,
        citizen: 5,
        doctor: 1,
        police: 1,
        soldier: 1,
        reporter: 1
    },
    14: {
        mafia: 3,
        spy: 1,
        citizen: 6,
        doctor: 1,
        police: 1,
        soldier: 1,
        detective: 1
    },
    15: {
        mafia: 3,
        spy: 1,
        citizen: 6,
        doctor: 1,
        police: 1,
        soldier: 1,
        reporter: 1,
        bartender: 1
    },
    16: {
        mafia: 3,
        spy: 1,
        citizen: 6,
        doctor: 1,
        police: 1,
        soldier: 1,
        reporter: 1,
        bartender: 1,
        terrorist: 1
    },
    17: {
        mafia: 3,
        spy: 1,
        werewolf: 1,
        citizen: 6,
        doctor: 1,
        police: 1,
        soldier: 1,
        reporter: 1,
        bartender: 1,
        terrorist: 1
    },
    18: {
        mafia: 3,
        spy: 1,
        werewolf: 1,
        citizen: 7,
        doctor: 1,
        police: 1,
        soldier: 1,
        reporter: 1,
        medium: 1,
        terrorist: 1
    },
    19: {
        mafia: 3,
        spy: 1,
        werewolf: 1,
        citizen: 7,
        doctor: 1,
        police: 1,
        soldier: 1,
        reporter: 1,
        wizard: 1,
        medium: 1,
        terrorist: 1
    },
    20: {
        mafia: 3,
        spy: 1,
        werewolf: 1,
        doubleAgent: 1,
        citizen: 7,
        doctor: 1,
        police: 1,
        soldier: 1,
        reporter: 1,
        wizard: 1,
        thief: 1,
        illusionist: 1
    }
};
// 역할 정의
exports.ROLES = {
    // ===== 마피아 팀 =====
    mafia: {
        id: 'mafia',
        name: '마피아',
        team: 'mafia',
        description: '마피아 조직의 일원입니다. 밤에 시민을 제거할 수 있습니다.',
        ability: {
            phase: 'night',
            action: 'kill',
            description: '매일 밤 팀원과 상의하여 한 명의 시민을 제거할 수 있습니다.'
        }
    },
    spy: {
        id: 'spy',
        name: '스파이',
        team: 'mafia',
        description: '시민인 척하는 마피아입니다. 낮에는 시민으로 보입니다.',
        special: {
            passive: '경찰 조사에서 시민으로 나타납니다.',
            condition: '마피아와 밤에 대화 가능'
        }
    },
    werewolf: {
        id: 'werewolf',
        name: '늑대인간',
        team: 'mafia',
        description: '특정 조건에서만 각성하는 특수 마피아입니다.',
        ability: {
            phase: 'night',
            action: 'wolfKill',
            description: '짝수 날 밤에만 추가로 한 명을 더 제거할 수 있습니다.',
            cooldown: 2
        }
    },
    doubleAgent: {
        id: 'doubleAgent',
        name: '간첩',
        team: 'mafia',
        description: '시민 팀에 잠입한 마피아입니다. 특수 능력자로 위장합니다.',
        special: {
            passive: '조사 시 무작위 시민 역할로 표시됩니다.'
        }
    },
    // ===== 시민 팀 =====
    citizen: {
        id: 'citizen',
        name: '시민',
        team: 'citizen',
        description: '평범한 시민입니다. 특별한 능력은 없지만 투표로 마피아를 찾아내세요.'
    },
    police: {
        id: 'police',
        name: '경찰',
        team: 'citizen',
        description: '정의로운 경찰관입니다. 밤에 한 명의 정체를 조사할 수 있습니다.',
        ability: {
            phase: 'night',
            action: 'investigate',
            description: '매일 밤 한 명을 조사하여 마피아 여부를 확인할 수 있습니다.'
        }
    },
    doctor: {
        id: 'doctor',
        name: '의사',
        team: 'citizen',
        description: '생명을 구하는 의사입니다. 밤에 한 명을 치료하여 보호할 수 있습니다.',
        ability: {
            phase: 'night',
            action: 'heal',
            description: '매일 밤 한 명을 선택하여 마피아의 공격으로부터 보호할 수 있습니다.'
        }
    },
    soldier: {
        id: 'soldier',
        name: '군인',
        team: 'citizen',
        description: '강인한 군인입니다. 한 번은 마피아의 공격을 방어할 수 있습니다.',
        special: {
            passive: '마피아의 첫 공격을 자동으로 방어합니다.',
            condition: '방어는 게임당 1회만 가능'
        }
    },
    reporter: {
        id: 'reporter',
        name: '기자',
        team: 'citizen',
        description: '진실을 추구하는 기자입니다. 밤에 얻은 정보를 공개할 수 있습니다.',
        ability: {
            phase: 'night',
            action: 'publish',
            description: '한 명의 직업을 조사하여 다음날 모두에게 공개합니다.'
        }
    },
    detective: {
        id: 'detective',
        name: '탐정',
        team: 'citizen',
        description: '사설탐정입니다. 조사는 가능하지만 결과가 항상 정확하지는 않습니다.',
        ability: {
            phase: 'night',
            action: 'detectiveInvestigate',
            description: '80% 확률로 정확한 정보를, 20% 확률로 잘못된 정보를 얻습니다.'
        }
    },
    bartender: {
        id: 'bartender',
        name: '술집사장',
        team: 'citizen',
        description: '술집을 운영하는 사장입니다. 술을 먹여 능력을 봉인할 수 있습니다.',
        ability: {
            phase: 'night',
            action: 'roleBlock',
            description: '한 명을 선택해 그날 밤 능력을 사용하지 못하게 합니다.'
        }
    },
    cheerleader: {
        id: 'cheerleader',
        name: '치어리더',
        team: 'citizen',
        description: '팀을 응원하는 치어리더입니다. 투표권을 강화할 수 있습니다.',
        ability: {
            phase: 'vote',
            action: 'doubleVote',
            description: '낮 투표 시 한 번, 자신의 투표를 2표로 만들 수 있습니다.',
            usageLimit: 1
        }
    },
    wizard: {
        id: 'wizard',
        name: '마법사',
        team: 'citizen',
        description: '신비한 힘을 가진 마법사입니다. 저주로 투표를 막을 수 있습니다.',
        ability: {
            phase: 'night',
            action: 'curse',
            description: '한 명에게 저주를 걸어 다음날 투표에 참여하지 못하게 합니다.'
        }
    },
    medium: {
        id: 'medium',
        name: '영매',
        team: 'citizen',
        description: '죽은 자와 대화하는 영매입니다. 죽은 사람의 정체를 알 수 있습니다.',
        ability: {
            phase: 'night',
            action: 'channelDead',
            description: '죽은 사람 중 한 명을 선택해 그의 역할을 알아낼 수 있습니다.'
        }
    },
    thief: {
        id: 'thief',
        name: '도둑',
        team: 'citizen',
        description: '능력을 훔치는 도둑입니다. 다른 사람의 능력을 복사할 수 있습니다.',
        ability: {
            phase: 'night',
            action: 'steal',
            description: '한 명의 능력을 훔쳐서 그날 밤 대신 사용할 수 있습니다.'
        }
    },
    // ===== 중립/특수 역할 =====
    turncoat: {
        id: 'turncoat',
        name: '변절자',
        team: 'neutral',
        description: '충성심이 약한 변절자입니다. 조건에 따라 팀이 바뀔 수 있습니다.',
        special: {
            passive: '시민으로 시작하지만, 시민이 3명 이하가 되면 마피아로 전향합니다.',
            condition: '전향 시 마피아 팀과 대화 가능'
        }
    },
    terrorist: {
        id: 'terrorist',
        name: '테러리스트',
        team: 'neutral',
        description: '복수심에 불타는 테러리스트입니다. 죽을 때 누군가를 데려갑니다.',
        ability: {
            phase: 'death',
            action: 'revenge',
            description: '낮에 처형당하면 자신에게 투표한 사람 중 한 명을 무작위로 제거합니다.'
        }
    },
    illusionist: {
        id: 'illusionist',
        name: '환술사',
        team: 'neutral',
        description: '환상을 다루는 환술사입니다. 역할을 바꿀 수 있습니다.',
        ability: {
            phase: 'night',
            action: 'swap',
            description: '두 명을 선택해 그들의 역할을 서로 바꿉니다.',
            usageLimit: 2
        }
    },
    ghost: {
        id: 'ghost',
        name: '귀신',
        team: 'neutral',
        description: '원한을 품은 귀신입니다. 죽어서도 영향력을 행사합니다.',
        special: {
            passive: '죽은 후에도 게임에 참여 가능',
            condition: '유령 상태에서 낮에 한 번 투표에 1표를 행사할 수 있습니다.'
        }
    }
};
// 역할 배분 유효성 검사
function isValidPlayerCount(count) {
    return count >= exports.MIN_PLAYERS && count <= exports.MAX_PLAYERS;
}
// 커스텀 역할 설정 가능 여부 확인
function canUseRole(roleId, playerCount) {
    const distribution = exports.ROLE_DISTRIBUTIONS[playerCount];
    if (!distribution)
        return false;
    return roleId in distribution && distribution[roleId] > 0;
}
// 역할 배열 생성 (실제 게임에서 사용)
function createRoleArray(playerCount) {
    const distribution = exports.ROLE_DISTRIBUTIONS[playerCount];
    if (!distribution) {
        throw new Error(`Invalid player count: ${playerCount}`);
    }
    const roles = [];
    Object.entries(distribution).forEach(([role, count]) => {
        for (let i = 0; i < count; i++) {
            roles.push(role);
        }
    });
    return roles;
}
// 팀별 인원수 계산
function getTeamCounts(playerCount) {
    const distribution = exports.ROLE_DISTRIBUTIONS[playerCount];
    if (!distribution) {
        throw new Error(`Invalid player count: ${playerCount}`);
    }
    let mafiaCount = 0;
    let citizenCount = 0;
    Object.entries(distribution).forEach(([role, count]) => {
        const roleInfo = exports.ROLES[role];
        if (roleInfo.team === 'mafia') {
            mafiaCount += count;
        }
        else if (roleInfo.team === 'citizen') {
            citizenCount += count;
        }
        // Neutral roles are counted as citizens for win condition
    });
    return { citizen: citizenCount, mafia: mafiaCount };
}
exports.ROLE_ACTIONS = {
    mafia: {
        roleId: 'mafia',
        phase: 'night',
        canTarget: (targetId, gameState) => {
            const target = gameState.players.find((p) => p.id === targetId);
            return target && target.isAlive && target.role !== 'mafia';
        },
        execute: (actorId, targetId, gameState) => {
            return { type: 'kill', targetId };
        }
    },
    doctor: {
        roleId: 'doctor',
        phase: 'night',
        canTarget: (targetId, gameState) => {
            const target = gameState.players.find((p) => p.id === targetId);
            return target && target.isAlive;
        },
        execute: (actorId, targetId, gameState) => {
            return { type: 'heal', targetId };
        }
    },
    police: {
        roleId: 'police',
        phase: 'night',
        canTarget: (targetId, gameState, actorId) => {
            const target = gameState.players.find((p) => p.id === targetId);
            const actor = gameState.players.find((p) => p.id === actorId);
            return target && target.isAlive && target.id !== actorId &&
                !actor?.investigated?.includes(targetId);
        },
        execute: (actorId, targetId, gameState) => {
            const target = gameState.players.find((p) => p.id === targetId);
            return {
                type: 'investigate',
                targetId,
                result: target.role === 'mafia' ? 'mafia' : 'citizen'
            };
        }
    },
    reporter: {
        roleId: 'reporter',
        phase: 'night',
        canTarget: () => true, // 기자는 정보를 선택하는 방식이 다름
        execute: (actorId, targetId, gameState) => {
            return { type: 'publish', message: targetId }; // targetId는 실제로는 메시지
        }
    }
};
