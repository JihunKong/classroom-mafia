// server/src/handlers/AbilityHandlers.ts

import { Server } from 'socket.io';
import { roleService, AbilityResult } from '../services/RoleService';
import { EnhancedRoom, EnhancedPlayer, GameStateManager, DelayedEffect } from '../types/GameState';
import { GameAction } from '../shared/types/game';
import { ROLES } from '../shared/constants/roles';

export class AbilityHandlers {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // Process all night actions for a room
  async processNightActions(roomCode: string, room: EnhancedRoom): Promise<void> {
    console.log(`Processing enhanced night actions for room ${roomCode}`);

    // Clear previous night effects
    room.players.forEach(player => {
      player.isProtected = false;
    });

    const actionResults: AbilityResult[] = [];
    const protectedPlayers: Set<string> = new Set();
    const killedPlayers: Set<string> = new Set();
    const blockedPlayers: Set<string> = new Set();

    // Process mafia voting first
    const mafiaKillTarget = this.processMafiaVoting(room);
    
    // Process all other night actions
    for (const [playerId, action] of room.nightActions) {
      const actor = room.players.find(p => p.id === playerId);
      if (!actor || !actor.isAlive) continue;

      try {
        const result = await roleService.executeAbility(roomCode, actor, action, room, room.day);
        actionResults.push(result);

        // Handle immediate effects
        switch (result.effectType) {
          case 'heal':
            if (result.success && result.targetPlayer) {
              protectedPlayers.add(result.targetPlayer.id);
              result.targetPlayer.isProtected = true;
            }
            break;

          case 'block':
            if (result.success && result.targetPlayer) {
              blockedPlayers.add(result.targetPlayer.id);
            }
            break;

          case 'kill':
            if (result.success && result.targetPlayer) {
              killedPlayers.add(result.targetPlayer.id);
            }
            break;
        }

        // Handle delayed effects
        if (result.delayedEffect) {
          const delayedEffect = {
            effectType: 'publish' as const, // Default effect type, will be overridden based on ability
            sourcePlayer: actor.id,
            targetPlayers: result.delayedEffect.targets,
            isPublic: true,
            triggerPhase: result.delayedEffect.triggerPhase === 'death' ? 'day' as const : result.delayedEffect.triggerPhase as any,
            message: result.delayedEffect.message
          };
          GameStateManager.addDelayedEffect(room, delayedEffect);
        }

        // Send private messages
        if (result.privateMessage) {
          this.io.to(actor.id).emit('ability:result', {
            message: result.privateMessage,
            isPrivate: true
          });
        }

      } catch (error) {
        console.error(`Error processing ability for ${actor.name}:`, error);
      }
    }

    // Resolve kill vs heal interactions
    this.resolveKillHealInteractions(room, mafiaKillTarget, protectedPlayers, killedPlayers);

    // Apply all effects
    this.applyNightEffects(room, actionResults);

    // Broadcast results
    this.broadcastNightResults(roomCode, room, actionResults);

    // Check for turncoat team switching
    this.checkTurncoatSwitch(roomCode, room);

    // Clear night state
    GameStateManager.resetDayState(room);
  }

  private processMafiaVoting(room: EnhancedRoom): string | null {
    if (room.nightVotes.size === 0) return null;

    let maxVotes = 0;
    let mostVotedTarget: string | null = null;

    room.nightVotes.forEach((voters, targetId) => {
      if (voters.length > maxVotes) {
        maxVotes = voters.length;
        mostVotedTarget = targetId;
      }
    });

    console.log(`Mafia voted to kill: ${mostVotedTarget ? room.players.find(p => p.id === mostVotedTarget)?.name : 'nobody'} (${maxVotes} votes)`);
    return mostVotedTarget;
  }

  private resolveKillHealInteractions(
    room: EnhancedRoom,
    mafiaTarget: string | null,
    protectedPlayers: Set<string>,
    killedPlayers: Set<string>
  ): void {
    
    // Check mafia kill vs protection
    if (mafiaTarget) {
      const target = room.players.find(p => p.id === mafiaTarget);
      if (!target) return;

      // Check passive protection first (soldier shield, etc.)
      const passiveProtection = roleService.hasPassiveProtection(room.code, mafiaTarget);
      if (passiveProtection) {
        roleService.applyPassiveProtection(room.code, mafiaTarget, passiveProtection.type);
        GameStateManager.addPublicMessage(room, `${target.name}이(가) ${passiveProtection.message}`);
        return;
      }

      // Check doctor heal
      if (protectedPlayers.has(mafiaTarget)) {
        GameStateManager.addPublicMessage(room, `${target.name}이(가) 의사의 치료로 생명을 구했습니다!`);
        return;
      }

      // Kill the target
      target.isAlive = false;
      GameStateManager.recordDeath(room, target, 'mafia_kill');
      GameStateManager.addPublicMessage(room, `${target.name}이(가) 밤에 사망했습니다.`);
    }

    // Process other kills (werewolf, etc.)
    killedPlayers.forEach(targetId => {
      if (targetId === mafiaTarget) return; // Already processed

      const target = room.players.find(p => p.id === targetId);
      if (!target) return;

      // Check protections (doctor heal and passive abilities)
      const hasDocHeal = protectedPlayers.has(targetId);
      const passiveProtection = roleService.hasPassiveProtection(room.code, targetId);
      
      if (!hasDocHeal && !passiveProtection) {
        target.isAlive = false;
        GameStateManager.recordDeath(room, target, 'special_kill');
      } else if (passiveProtection) {
        roleService.applyPassiveProtection(room.code, targetId, passiveProtection.type);
        GameStateManager.addPublicMessage(room, `${target.name}이(가) ${passiveProtection.message}`);
      }
    });
  }

  private applyNightEffects(room: EnhancedRoom, results: AbilityResult[]): void {
    results.forEach(result => {
      if (!result.success) return;

      switch (result.effectType) {
        case 'investigate':
          // Private message already sent
          break;

        case 'curse':
          if (result.targetPlayer) {
            room.cursedPlayers.add(result.targetPlayer.id);
          }
          break;

        case 'steal':
          // Ability already stolen via roleService
          break;

        case 'swap':
          // Roles already swapped
          if (result.publicMessage) {
            GameStateManager.addPublicMessage(room, result.publicMessage);
          }
          break;
      }
    });
  }

  private broadcastNightResults(roomCode: string, room: EnhancedRoom, results: AbilityResult[]): void {
    // Send public messages
    room.publicMessages.forEach(message => {
      this.io.to(roomCode).emit('night:result', { message });
    });

    // Send private messages
    room.privateMessages.forEach((messages, playerId) => {
      messages.forEach(message => {
        this.io.to(playerId).emit('investigate:result', { message });
      });
    });

    // Send updated player list
    this.io.to(roomCode).emit('room:playerUpdate', { 
      players: room.players,
      alivePlayers: GameStateManager.getAlivePlayers(room)
    });
  }

  private checkTurncoatSwitch(roomCode: string, room: EnhancedRoom): void {
    const switchedTurncoats = roleService.checkTurncoatSwitch(roomCode, room);
    
    switchedTurncoats.forEach(turncoat => {
      GameStateManager.addPublicMessage(room, `${turncoat.name}이(가) 마피아로 전향했습니다!`);
      
      // Notify the turncoat
      this.io.to(turncoat.id).emit('role:changed', {
        newTeam: 'mafia',
        message: '시민이 줄어들어 마피아로 전향했습니다!'
      });
    });
  }

  // Process day phase actions (cheerleader, etc.)
  async processDayActions(roomCode: string, room: EnhancedRoom): Promise<void> {
    // Trigger delayed effects from previous nights
    const delayedEffects = GameStateManager.triggerDelayedEffects(room, 'day', room.day);
    
    delayedEffects.forEach(effect => {
      if (effect.isPublic) {
        this.io.to(roomCode).emit('day:announcement', { message: effect.message });
      } else {
        effect.targetPlayers.forEach(targetId => {
          this.io.to(targetId).emit('day:privateMessage', { message: effect.message });
        });
      }
    });

    // Clear curse effects from previous day
    room.cursedPlayers.clear();
  }

  // Process voting with special abilities
  async processVoting(roomCode: string, room: EnhancedRoom): Promise<void> {
    // Count votes with weights (cheerleader double vote)
    const voteCount = new Map<string, number>();
    const voterDetails = new Map<string, string[]>();

    room.votes.forEach((targetId, voterId) => {
      const voter = room.players.find(p => p.id === voterId);
      if (!voter) return;

      // Allow ghost voting (dead players with ghost ability)
      const isAlive = voter.isAlive;
      const canGhostVote = !isAlive && voter.role === 'ghost' && roleService.canGhostVote(roomCode, voterId);
      
      if (!isAlive && !canGhostVote) return;

      // Check if voter is cursed (only affects living players)
      if (isAlive && room.cursedPlayers.has(voterId)) {
        this.io.to(voterId).emit('vote:blocked', { 
          message: '저주로 인해 투표할 수 없습니다.' 
        });
        return;
      }

      // Handle special vote abilities
      let weight = 1;
      
      // Cheerleader double vote
      if (voter.role === 'cheerleader' && isAlive) {
        if (roleService.canUseCheerleaderDoubleVote(roomCode, voterId)) {
          if (roleService.useCheerleaderDoubleVote(roomCode, voterId)) {
            weight = 2;
          }
        }
      }

      // Ghost vote (consume ability)
      if (canGhostVote) {
        roleService.useGhostVote(roomCode, voterId);
        this.io.to(roomCode).emit('ghost:vote', {
          message: `${voter.name}의 영혼이 투표에 참여했습니다.`,
          ghost: voter.name
        });
      }

      const currentVotes = voteCount.get(targetId) || 0;
      voteCount.set(targetId, currentVotes + weight);

      if (!voterDetails.has(targetId)) {
        voterDetails.set(targetId, []);
      }
      voterDetails.get(targetId)!.push(voter.name + (weight > 1 ? ` (${weight}표)` : '') + (!isAlive ? ' (유령)' : ''));
    });

    // Find most voted player
    let maxVotes = 0;
    let eliminatedPlayer: string | null = null;

    voteCount.forEach((votes, targetId) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedPlayer = targetId;
      }
    });

    // Process elimination
    if (eliminatedPlayer && maxVotes > 0) {
      const player = room.players.find(p => p.id === eliminatedPlayer);
      if (player) {
        // Get all voters for terrorist revenge
        const allVoters = room.players.filter(p => {
          const playerVote = Array.from(room.votes.entries()).find(([voter, target]) => 
            voter === p.id && target === eliminatedPlayer
          );
          return playerVote && p.isAlive;
        });

        // Check for terrorist revenge
        if (player.role === 'terrorist' && roleService.canTerroristRevenge(roomCode, player.id)) {
          const victim = roleService.executeTerroristRevenge(roomCode, player, allVoters as any);
          if (victim) {
            (victim as any).isAlive = false;
            GameStateManager.recordDeath(room, victim as any, 'terrorist_revenge');
            
            this.io.to(roomCode).emit('terrorist:revenge', {
              message: `${player.name}이(가) 복수로 ${victim.name}을(를) 데려갔습니다!`,
              terrorist: player.name,
              victim: victim.name
            });
          }
        }

        player.isAlive = false;
        GameStateManager.recordDeath(room, player, 'execution');

        const voterList = voterDetails.get(eliminatedPlayer)?.join(', ') || '';
        const resultMessage = `투표 결과 ${player.name}(${ROLES[player.role].name})이(가) 처형되었습니다. (${maxVotes}표)`;
        
        this.io.to(roomCode).emit('voting:result', { 
          message: resultMessage,
          eliminatedPlayer: player.name,
          votes: maxVotes,
          voters: voterList,
          alivePlayers: GameStateManager.getAlivePlayers(room)
        });
      }
    } else {
      this.io.to(roomCode).emit('voting:result', { 
        message: '투표 결과 아무도 처형되지 않았습니다.',
        alivePlayers: GameStateManager.getAlivePlayers(room)
      });
    }
  }


  // Enhanced ability notification system
  notifySpecialAbilityUsed(roomCode: string, playerId: string, abilityType: string, message: string): void {
    this.io.to(roomCode).emit('ability:used', {
      playerId,
      abilityType,
      message,
      timestamp: Date.now()
    });
  }

  // Utility method to get room (injected from main game logic)
  private rooms: Map<string, EnhancedRoom> | null = null;
  
  setRoomsReference(rooms: Map<string, EnhancedRoom>): void {
    this.rooms = rooms;
  }
  
  private getRoom(roomCode: string): EnhancedRoom | null {
    return this.rooms?.get(roomCode) || null;
  }

  // Cleanup resources
  cleanup(roomCode: string): void {
    roleService.cleanup(roomCode);
  }
}