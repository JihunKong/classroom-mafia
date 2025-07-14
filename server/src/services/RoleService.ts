// server/src/services/RoleService.ts

import { ROLES, Role } from '../shared/constants/roles';
import { Player, GameAction, Room } from '../shared/types/game';
import { EnhancedRoom } from '../types/GameState';

export interface AbilityState {
  usageCount: number;
  maxUsages?: number;
  cooldownTurns: number;
  lastUsedDay?: number;
  isBlocked: boolean;
  stolenAbility?: string;
  curseTarget?: string;
  hasShield: boolean;
  shieldUsed: boolean;
  investigatedPlayers: string[];
  publishedInformation?: string;
  teamSwitched: boolean;
}

export interface AbilityResult {
  success: boolean;
  message: string;
  targetPlayer?: Player;
  publicMessage?: string;
  privateMessage?: string;
  effectType: 'kill' | 'heal' | 'investigate' | 'block' | 'curse' | 'steal' | 'swap' | 'publish' | 'protect' | 'revenge' | 'vote' | 'none';
  delayedEffect?: {
    triggerPhase: 'day' | 'night' | 'vote' | 'death';
    message: string;
    targets: string[];
  };
}

export class RoleService {
  private abilityStates: Map<string, Map<string, AbilityState>> = new Map(); // roomCode -> playerId -> state

  constructor() {
    // Initialize service
  }

  // Get default max usages for roles without explicit limits
  private getDefaultMaxUsages(role: string): number | undefined {
    switch (role) {
      case 'cheerleader':
        return 1; // Can use double vote once per game
      case 'ghost':
        return 1; // Can vote once when dead
      case 'illusionist':
        return 2; // Can swap roles twice per game
      case 'soldier':
        return 1; // Shield protection once per game
      default:
        return undefined;
    }
  }

  // Initialize ability states for a new game
  initializePlayerAbilities(roomCode: string, players: Player[]): void {
    if (!this.abilityStates.has(roomCode)) {
      this.abilityStates.set(roomCode, new Map());
    }

    const roomStates = this.abilityStates.get(roomCode)!;
    
    players.forEach(player => {
      const role = ROLES[player.role];
      const initialState: AbilityState = {
        usageCount: 0,
        maxUsages: role?.ability?.usageLimit || this.getDefaultMaxUsages(player.role),
        cooldownTurns: 0,
        isBlocked: false,
        hasShield: player.role === 'soldier',
        shieldUsed: false,
        investigatedPlayers: [],
        teamSwitched: false,
      };

      roomStates.set(player.id, initialState);
    });
  }

  // Get a player's current ability state
  getAbilityState(roomCode: string, playerId: string): AbilityState | null {
    return this.abilityStates.get(roomCode)?.get(playerId) || null;
  }

  // Update a player's ability state
  updateAbilityState(roomCode: string, playerId: string, updates: Partial<AbilityState>): void {
    const roomStates = this.abilityStates.get(roomCode);
    if (!roomStates) return;

    const currentState = roomStates.get(playerId);
    if (!currentState) return;

    roomStates.set(playerId, { ...currentState, ...updates });
  }

  // Check if a player can use their ability
  canUseAbility(roomCode: string, player: Player, currentDay: number): boolean {
    const state = this.getAbilityState(roomCode, player.id);
    if (!state) return false;

    const role = ROLES[player.role];
    if (!role?.ability) return false;

    // Check if blocked by bartender
    if (state.isBlocked) return false;

    // Check usage limits
    if (state.maxUsages && state.usageCount >= state.maxUsages) return false;

    // Check cooldown
    if (state.cooldownTurns > 0) return false;

    // Role-specific checks
    if (player.role === 'werewolf') {
      // Werewolf can only act on even days
      return currentDay % 2 === 0;
    }

    return true;
  }

  // Get the appropriate action type for a role
  getActionType(role: string): string {
    const roleData = ROLES[role];
    if (!roleData?.ability) return 'dummy';
    
    return roleData.ability.action;
  }

  // Validate if an action target is valid
  validateTarget(actor: Player, target: Player, action: string, room: EnhancedRoom): boolean {
    // Basic validation
    if (!target.isAlive) return false;
    if (actor.id === target.id) return false;

    // Role-specific target validation
    switch (action) {
      case 'kill':
        // Mafia can't kill other mafia
        const actorRole = ROLES[actor.role];
        const targetRole = ROLES[target.role];
        if (actorRole.team === 'mafia' && targetRole.team === 'mafia') return false;
        break;

      case 'channelDead':
        // Medium can only target dead players
        return !target.isAlive;

      case 'swap':
        // Illusionist needs two targets - handled separately
        return true;

      default:
        return true;
    }

    return true;
  }

  // Execute a role ability
  async executeAbility(
    roomCode: string, 
    actor: Player, 
    action: GameAction, 
    room: EnhancedRoom, 
    currentDay: number
  ): Promise<AbilityResult> {
    
    const state = this.getAbilityState(roomCode, actor.id);
    if (!state) {
      return { success: false, message: '능력 상태를 찾을 수 없습니다.', effectType: 'none' };
    }

    // Check if ability can be used
    if (!this.canUseAbility(roomCode, actor, currentDay)) {
      return { success: false, message: '현재 능력을 사용할 수 없습니다.', effectType: 'none' };
    }

    const targetPlayer = room.players.find(p => p.id === action.targetPlayerId);
    
    // Validate target
    if (action.targetPlayerId && !this.validateTarget(actor, targetPlayer!, action.actionType, room)) {
      return { success: false, message: '유효하지 않은 대상입니다.', effectType: 'none' };
    }

    // Execute role-specific ability
    let result: AbilityResult;
    
    switch (action.actionType) {
      case 'kill':
        result = await this.executeMafiaKill(actor, targetPlayer!, room);
        break;
        
      case 'heal':
        result = await this.executeDoctorHeal(actor, targetPlayer!, room);
        break;
        
      case 'investigate':
        result = await this.executePoliceInvestigate(actor, targetPlayer!, room);
        break;
        
      case 'detectiveInvestigate':
        result = await this.executeDetectiveInvestigate(actor, targetPlayer!, room);
        break;
        
      case 'publish':
        result = await this.executeReporterPublish(actor, targetPlayer!, room);
        break;
        
      case 'roleBlock':
        result = await this.executeBartenderBlock(roomCode, actor, targetPlayer!, room);
        break;
        
      case 'curse':
        result = await this.executeWizardCurse(roomCode, actor, targetPlayer!, room);
        break;
        
      case 'channelDead':
        result = await this.executeMediumChannel(actor, targetPlayer!, room);
        break;
        
      case 'steal':
        result = await this.executeThiefSteal(roomCode, actor, targetPlayer!, room);
        break;
        
      case 'wolfKill':
        result = await this.executeWerewolfKill(actor, targetPlayer!, room);
        break;
        
      case 'swap':
        result = await this.executeIllusionistSwap(actor, action.targetPlayerIds!, room);
        break;
        
      case 'doubleVote':
        result = await this.executeCheerleaderVote(roomCode, actor, targetPlayer!, room);
        break;

      default:
        result = { success: false, message: '알 수 없는 능력입니다.', effectType: 'none' };
    }

    // Update ability state if successful
    if (result.success) {
      this.updateAbilityState(roomCode, actor.id, {
        usageCount: state.usageCount + 1,
        lastUsedDay: currentDay,
        cooldownTurns: ROLES[actor.role]?.ability?.cooldown || 0
      });
    }

    return result;
  }

  // Individual ability implementations
  private async executeMafiaKill(actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    return {
      success: true,
      message: `${target.name}을(를) 공격 대상으로 선택했습니다.`,
      targetPlayer: target,
      effectType: 'kill'
    };
  }

  private async executeDoctorHeal(actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    return {
      success: true,
      message: `${target.name}을(를) 치료했습니다.`,
      targetPlayer: target,
      effectType: 'heal'
    };
  }

  private async executePoliceInvestigate(actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    // Use enhanced investigation system with all disguises
    const result = this.getInvestigationResult(room.code, actor, target);

    return {
      success: true,
      message: `${target.name}을(를) 조사했습니다.`,
      privateMessage: `조사 결과: ${target.name}은(는) ${result === 'mafia' ? '마피아' : '무고한 시민'}입니다.`,
      targetPlayer: target,
      effectType: 'investigate'
    };
  }

  private async executeDetectiveInvestigate(actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    const accuracy = Math.random();
    let result: string;
    
    if (accuracy <= 0.8) {
      // 80% accurate result - use enhanced investigation system
      result = this.getInvestigationResult(room.code, actor, target);
    } else {
      // 20% incorrect result - flip the accurate result
      const accurateResult = this.getInvestigationResult(room.code, actor, target);
      result = accurateResult === 'mafia' ? 'innocent' : 'mafia';
    }

    return {
      success: true,
      message: `${target.name}을(를) 조사했습니다.`,
      privateMessage: `조사 결과: ${target.name}은(는) ${result === 'mafia' ? '마피아' : '무고한 시민'}입니다. (정확도 80%)`,
      targetPlayer: target,
      effectType: 'investigate'
    };
  }

  private async executeReporterPublish(actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    const targetRole = ROLES[target.role];
    const publishMessage = `기자 보도: ${target.name}의 역할은 ${targetRole.name}입니다.`;

    return {
      success: true,
      message: `${target.name}에 대한 정보를 발표할 예정입니다.`,
      publicMessage: publishMessage,
      targetPlayer: target,
      effectType: 'publish',
      delayedEffect: {
        triggerPhase: 'day',
        message: publishMessage,
        targets: [target.id]
      }
    };
  }

  private async executeBartenderBlock(roomCode: string, actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    // Block the target's ability for this night
    this.updateAbilityState(roomCode, target.id, { isBlocked: true });

    return {
      success: true,
      message: `${target.name}에게 술을 먹여 능력을 봉인했습니다.`,
      targetPlayer: target,
      effectType: 'block'
    };
  }

  private async executeWizardCurse(roomCode: string, actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    // Curse prevents voting next day
    this.updateAbilityState(roomCode, target.id, { curseTarget: target.id });

    return {
      success: true,
      message: `${target.name}에게 저주를 걸었습니다.`,
      targetPlayer: target,
      effectType: 'curse',
      delayedEffect: {
        triggerPhase: 'vote',
        message: `${target.name}은(는) 저주로 인해 투표할 수 없습니다.`,
        targets: [target.id]
      }
    };
  }

  private async executeMediumChannel(actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    if (target.isAlive) {
      return { success: false, message: '죽은 플레이어만 조사할 수 있습니다.', effectType: 'none' };
    }

    const targetRole = ROLES[target.role];
    return {
      success: true,
      message: `${target.name}의 영혼과 교감했습니다.`,
      privateMessage: `영혼 조사 결과: ${target.name}의 역할은 ${targetRole.name}이었습니다.`,
      targetPlayer: target,
      effectType: 'investigate'
    };
  }

  private async executeThiefSteal(roomCode: string, actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    const targetRole = ROLES[target.role];
    if (!targetRole.ability) {
      return { success: false, message: '능력이 없는 플레이어입니다.', effectType: 'none' };
    }

    // Steal the target's ability for one use
    this.updateAbilityState(roomCode, actor.id, { stolenAbility: targetRole.ability.action });

    return {
      success: true,
      message: `${target.name}의 능력을 훔쳤습니다.`,
      privateMessage: `훔친 능력: ${targetRole.ability.description}`,
      targetPlayer: target,
      effectType: 'steal'
    };
  }

  private async executeWerewolfKill(actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    return {
      success: true,
      message: `${target.name}을(를) 늑대의 힘으로 공격했습니다.`,
      targetPlayer: target,
      effectType: 'kill'
    };
  }

  private async executeIllusionistSwap(actor: Player, targetIds: string[], room: EnhancedRoom): Promise<AbilityResult> {
    if (targetIds.length !== 2) {
      return { success: false, message: '두 명의 플레이어를 선택해야 합니다.', effectType: 'none' };
    }

    const target1 = room.players.find(p => p.id === targetIds[0]);
    const target2 = room.players.find(p => p.id === targetIds[1]);

    if (!target1 || !target2) {
      return { success: false, message: '유효하지 않은 대상입니다.', effectType: 'none' };
    }

    // Swap roles
    const temp = target1.role;
    target1.role = target2.role;
    target2.role = temp;

    return {
      success: true,
      message: `${target1.name}과 ${target2.name}의 역할을 바꿨습니다.`,
      publicMessage: `환술사가 두 플레이어의 역할을 바꿨습니다.`,
      effectType: 'swap'
    };
  }

  private async executeCheerleaderVote(roomCode: string, actor: Player, target: Player, room: EnhancedRoom): Promise<AbilityResult> {
    return {
      success: true,
      message: `${target.name}에게 2표를 행사했습니다.`,
      targetPlayer: target,
      effectType: 'vote'
    };
  }


  // Clear ability states for new day
  startNewDay(roomCode: string): void {
    const roomStates = this.abilityStates.get(roomCode);
    if (!roomStates) return;

    roomStates.forEach((state, playerId) => {
      // Clear blocks and reduce cooldowns
      this.updateAbilityState(roomCode, playerId, {
        isBlocked: false,
        cooldownTurns: Math.max(0, state.cooldownTurns - 1)
      });
    });
  }

  // Check soldier protection
  checkSoldierProtection(roomCode: string, targetId: string): boolean {
    const state = this.getAbilityState(roomCode, targetId);
    if (!state) return false;

    if (state.hasShield && !state.shieldUsed) {
      this.updateAbilityState(roomCode, targetId, { shieldUsed: true, hasShield: false });
      return true;
    }

    return false;
  }

  // Check turncoat team switching
  checkTurncoatSwitch(roomCode: string, room: EnhancedRoom): Player[] {
    const aliveCitizens = room.players.filter(p => 
      p.isAlive && ROLES[p.role].team === 'citizen'
    );

    if (aliveCitizens.length <= 3) {
      const turncoats = room.players.filter(p => 
        p.isAlive && p.role === 'turncoat'
      );

      turncoats.forEach(turncoat => {
        const state = this.getAbilityState(roomCode, turncoat.id);
        if (state && !state.teamSwitched) {
          // Switch turncoat to mafia team
          this.updateAbilityState(roomCode, turncoat.id, { teamSwitched: true });
        }
      });

      return turncoats;
    }

    return [];
  }

  // Get disguised role for double agent when investigated
  getDoubleAgentDisguise(roomCode: string, agentId: string): string {
    const state = this.getAbilityState(roomCode, agentId);
    
    // If disguise hasn't been set, randomly assign a citizen role
    if (!state?.stolenAbility) {
      const citizenRoles = ['citizen', 'police', 'doctor', 'soldier', 'reporter', 'detective', 'bartender', 'wizard', 'medium', 'thief'];
      const randomRole = citizenRoles[Math.floor(Math.random() * citizenRoles.length)];
      
      this.updateAbilityState(roomCode, agentId, { stolenAbility: randomRole });
      return randomRole;
    }
    
    return state.stolenAbility;
  }

  // Enhanced investigation result with disguises
  getInvestigationResult(roomCode: string, investigator: Player, target: Player): string {
    const targetRole = target.role;
    
    // Spy appears innocent to all investigations
    if (targetRole === 'spy') {
      return 'innocent';
    }
    
    // Double agent appears as their disguised role
    if (targetRole === 'doubleAgent') {
      const disguisedRole = this.getDoubleAgentDisguise(roomCode, target.id);
      const disguisedRoleInfo = ROLES[disguisedRole];
      return disguisedRoleInfo.team === 'mafia' ? 'mafia' : 'innocent';
    }
    
    // Turncoat team affiliation changes based on switch status
    if (targetRole === 'turncoat') {
      const state = this.getAbilityState(roomCode, target.id);
      if (state?.teamSwitched) {
        return 'mafia'; // Switched turncoats appear as mafia
      } else {
        return 'innocent'; // Unswapped turncoats appear innocent
      }
    }
    
    // Standard role team check
    const roleInfo = ROLES[targetRole];
    return roleInfo.team === 'mafia' ? 'mafia' : 'innocent';
  }

  // Check if player has passive protection abilities
  hasPassiveProtection(roomCode: string, targetId: string): { type: string; message: string } | null {
    const roomStates = this.abilityStates.get(roomCode);
    if (!roomStates) return null;
    
    const targetState = roomStates.get(targetId);
    if (!targetState) return null;
    
    // Soldier shield protection
    if (targetState.hasShield && !targetState.shieldUsed) {
      return {
        type: 'soldier_shield',
        message: '군인의 방패가 공격을 막았습니다!'
      };
    }
    
    return null;
  }

  // Apply passive protection (consume shield, etc.)
  applyPassiveProtection(roomCode: string, targetId: string, protectionType: string): void {
    if (protectionType === 'soldier_shield') {
      this.updateAbilityState(roomCode, targetId, { 
        shieldUsed: true, 
        hasShield: false 
      });
    }
  }

  // Vote phase abilities
  canUseCheerleaderDoubleVote(roomCode: string, playerId: string): boolean {
    const state = this.getAbilityState(roomCode, playerId);
    return state ? state.usageCount === 0 && state.maxUsages === 1 : false;
  }

  useCheerleaderDoubleVote(roomCode: string, playerId: string): boolean {
    if (!this.canUseCheerleaderDoubleVote(roomCode, playerId)) {
      return false;
    }
    
    this.updateAbilityState(roomCode, playerId, { usageCount: 1 });
    return true;
  }

  canGhostVote(roomCode: string, playerId: string): boolean {
    const state = this.getAbilityState(roomCode, playerId);
    return state ? state.usageCount === 0 && state.maxUsages === 1 : false;
  }

  useGhostVote(roomCode: string, playerId: string): boolean {
    if (!this.canGhostVote(roomCode, playerId)) {
      return false;
    }
    
    this.updateAbilityState(roomCode, playerId, { usageCount: 1 });
    return true;
  }

  // Death phase abilities
  canTerroristRevenge(roomCode: string, playerId: string): boolean {
    // Terrorist can always use revenge when executed during voting
    return true;
  }

  public executeTerroristRevenge(roomCode: string, terrorist: Player, voters: Player[]): Player | null {
    if (voters.length === 0) return null;
    
    // Random selection from voters
    const randomIndex = Math.floor(Math.random() * voters.length);
    const victim = voters[randomIndex];
    
    return victim;
  }

  // Clean up room data
  cleanup(roomCode: string): void {
    this.abilityStates.delete(roomCode);
  }
}

// Singleton instance
export const roleService = new RoleService();