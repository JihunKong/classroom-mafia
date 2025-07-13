// server/src/dashboard/TeacherDashboard.ts

import { Server } from 'socket.io';
import { EnhancedRoom, EnhancedPlayer, GameStateManager } from '../types/GameState';
import { ROLES } from '../../../shared/constants/roles';
import { roleService } from '../services/RoleService';

export interface ClassroomSession {
  id: string;
  teacherName: string;
  className: string;
  createdAt: Date;
  isActive: boolean;
  rooms: ClassroomRoom[];
  settings: ClassroomSettings;
  analytics: ClassroomAnalytics;
}

export interface ClassroomRoom {
  code: string;
  name: string; // Custom name set by teacher
  playerCount: number;
  maxPlayers: number;
  phase: string;
  day: number;
  isStarted: boolean;
  alivePlayers: number;
  studentBehavior: StudentBehaviorRecord[];
  gameEvents: GameEvent[];
  startTime?: Date;
  endTime?: Date;
  winner?: string;
}

export interface ClassroomSettings {
  allowCustomRoles: boolean;
  enableDeadChat: boolean;
  enableVoiceChat: boolean;
  gameTimeLimit: number; // minutes
  maxGamesPerStudent: number;
  profanityFilter: boolean;
  pauseOnDisconnect: boolean;
  showRoleReveal: boolean;
  enableSpectatorMode: boolean;
}

export interface StudentBehaviorRecord {
  studentName: string;
  timestamp: Date;
  event: 'joined' | 'left' | 'inappropriate_message' | 'excessive_actions' | 'rule_violation';
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface GameEvent {
  timestamp: Date;
  phase: string;
  day: number;
  event: string;
  details: any;
}

export interface ClassroomAnalytics {
  totalGames: number;
  totalStudents: number;
  averageGameDuration: number;
  roleDistribution: Record<string, number>;
  winRates: Record<string, number>;
  studentEngagement: StudentEngagement[];
  gameOutcomes: GameOutcome[];
}

export interface StudentEngagement {
  studentName: string;
  gamesPlayed: number;
  averageActionTime: number;
  participationScore: number;
  rolePreferences: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface GameOutcome {
  roomCode: string;
  duration: number;
  winner: string;
  playerCount: number;
  roles: string[];
  keyEvents: string[];
}

export class TeacherDashboard {
  private io: Server;
  private rooms: Map<string, EnhancedRoom>;
  private classroomSessions: Map<string, ClassroomSession> = new Map();
  private teacherSockets: Map<string, string> = new Map(); // teacherId -> socketId

  constructor(io: Server, rooms: Map<string, EnhancedRoom>) {
    this.io = io;
    this.rooms = rooms;
    this.setupTeacherNamespace();
  }

  private setupTeacherNamespace(): void {
    const teacherNamespace = this.io.of('/teacher');
    
    teacherNamespace.on('connection', (socket) => {
      console.log(`Teacher connected: ${socket.id}`);
      
      socket.on('teacher:authenticate', (data) => {
        this.authenticateTeacher(socket, data);
      });
      
      socket.on('classroom:create', (data) => {
        this.createClassroomSession(socket, data);
      });
      
      socket.on('classroom:join', (data) => {
        this.joinClassroomSession(socket, data);
      });
      
      socket.on('room:create', (data) => {
        this.createManagedRoom(socket, data);
      });
      
      socket.on('room:control', (data) => {
        this.controlRoom(socket, data);
      });
      
      socket.on('student:moderate', (data) => {
        this.moderateStudent(socket, data);
      });
      
      socket.on('analytics:request', (data) => {
        this.sendAnalytics(socket, data);
      });
      
      socket.on('settings:update', (data) => {
        this.updateClassroomSettings(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.handleTeacherDisconnection(socket);
      });
    });
  }

  private authenticateTeacher(socket: any, data: any): void {
    try {
      const { teacherName, accessCode } = data;
      
      // Simple authentication for demo (in production, use proper auth)
      const validAccessCodes = ['TEACHER2024', 'EDUCATOR', 'CLASSROOM'];
      
      if (!teacherName || !accessCode || !validAccessCodes.includes(accessCode)) {
        socket.emit('teacher:authFailed', { message: '잘못된 인증 정보입니다.' });
        return;
      }
      
      socket.teacherId = `teacher_${Date.now()}`;
      socket.teacherName = teacherName;
      this.teacherSockets.set(socket.teacherId, socket.id);
      
      socket.emit('teacher:authenticated', {
        teacherId: socket.teacherId,
        teacherName: teacherName,
        capabilities: this.getTeacherCapabilities()
      });
      
      console.log(`Teacher authenticated: ${teacherName} (${socket.teacherId})`);
    } catch (error) {
      socket.emit('teacher:authFailed', { message: '인증 처리 중 오류가 발생했습니다.' });
    }
  }

  private createClassroomSession(socket: any, data: any): void {
    try {
      const { className, settings } = data;
      
      if (!socket.teacherId) {
        socket.emit('error', { message: '인증이 필요합니다.' });
        return;
      }
      
      const sessionId = `classroom_${Date.now()}`;
      const defaultSettings: ClassroomSettings = {
        allowCustomRoles: false,
        enableDeadChat: true,
        enableVoiceChat: false,
        gameTimeLimit: 45, // 45 minutes
        maxGamesPerStudent: 3,
        profanityFilter: true,
        pauseOnDisconnect: true,
        showRoleReveal: true,
        enableSpectatorMode: true,
        ...settings
      };
      
      const session: ClassroomSession = {
        id: sessionId,
        teacherName: socket.teacherName,
        className: className,
        createdAt: new Date(),
        isActive: true,
        rooms: [],
        settings: defaultSettings,
        analytics: this.initializeAnalytics()
      };
      
      this.classroomSessions.set(sessionId, session);
      socket.join(sessionId);
      socket.classroomId = sessionId;
      
      socket.emit('classroom:created', {
        sessionId,
        session,
        message: `클래스룸 '${className}'이 생성되었습니다.`
      });
      
      console.log(`Classroom created: ${className} by ${socket.teacherName}`);
    } catch (error) {
      socket.emit('error', { message: '클래스룸 생성 중 오류가 발생했습니다.' });
    }
  }

  private joinClassroomSession(socket: any, data: any): void {
    try {
      const { sessionId } = data;
      
      const session = this.classroomSessions.get(sessionId);
      if (!session) {
        socket.emit('error', { message: '존재하지 않는 클래스룸입니다.' });
        return;
      }
      
      socket.join(sessionId);
      socket.classroomId = sessionId;
      
      socket.emit('classroom:joined', {
        session,
        currentRooms: this.getClassroomRoomStatus(sessionId),
        message: `클래스룸 '${session.className}'에 참여했습니다.`
      });
      
    } catch (error) {
      socket.emit('error', { message: '클래스룸 참여 중 오류가 발생했습니다.' });
    }
  }

  private createManagedRoom(socket: any, data: any): void {
    try {
      const { roomName, maxPlayers, customRoles } = data;
      
      if (!socket.classroomId) {
        socket.emit('error', { message: '클래스룸에 먼저 참여해주세요.' });
        return;
      }
      
      const session = this.classroomSessions.get(socket.classroomId);
      if (!session) {
        socket.emit('error', { message: '클래스룸 세션을 찾을 수 없습니다.' });
        return;
      }
      
      // Generate unique room code
      const roomCode = this.generateClassroomRoomCode();
      
      // Create enhanced room
      const room = GameStateManager.createEnhancedRoom({
        code: roomCode,
        hostId: socket.teacherId, // Teacher is the host
        players: [],
        maxPlayers: Math.min(maxPlayers || 10, 20),
        phase: 'waiting',
        day: 0,
        timeRemaining: 0,
        isStarted: false
      });
      
      // Add to global rooms
      this.rooms.set(roomCode, room);
      
      // Add to classroom session
      const classroomRoom: ClassroomRoom = {
        code: roomCode,
        name: roomName || `게임 ${session.rooms.length + 1}`,
        playerCount: 0,
        maxPlayers: room.maxPlayers,
        phase: 'waiting',
        day: 0,
        isStarted: false,
        alivePlayers: 0,
        studentBehavior: [],
        gameEvents: [],
        startTime: undefined
      };
      
      session.rooms.push(classroomRoom);
      
      socket.emit('room:created', {
        roomCode,
        roomName: classroomRoom.name,
        maxPlayers: room.maxPlayers,
        teacherControls: this.getTeacherControls(roomCode)
      });
      
      // Notify other teachers in the classroom
      socket.to(socket.classroomId).emit('classroom:roomAdded', {
        room: classroomRoom
      });
      
      console.log(`Managed room created: ${roomCode} (${roomName}) by ${socket.teacherName}`);
    } catch (error) {
      socket.emit('error', { message: '방 생성 중 오류가 발생했습니다.' });
    }
  }

  private controlRoom(socket: any, data: any): void {
    try {
      const { roomCode, action, parameters } = data;
      
      const room = this.rooms.get(roomCode);
      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }
      
      switch (action) {
        case 'start':
          this.startGameWithTeacherControl(room, parameters);
          break;
        case 'pause':
          this.pauseGame(room);
          break;
        case 'resume':
          this.resumeGame(room);
          break;
        case 'force_phase':
          this.forcePhaseTransition(room, parameters.targetPhase);
          break;
        case 'eliminate_player':
          this.eliminatePlayer(room, parameters.playerId);
          break;
        case 'reveal_roles':
          this.revealAllRoles(room);
          break;
        case 'end_game':
          this.endGameByTeacher(room, parameters.reason);
          break;
        default:
          socket.emit('error', { message: '알 수 없는 제어 명령입니다.' });
          return;
      }
      
      // Log teacher action
      this.logTeacherAction(socket.classroomId, socket.teacherName, action, roomCode, parameters);
      
      socket.emit('room:controlSuccess', {
        action,
        roomCode,
        message: '제어 명령이 실행되었습니다.'
      });
      
    } catch (error) {
      socket.emit('error', { message: '방 제어 중 오류가 발생했습니다.' });
    }
  }

  private moderateStudent(socket: any, data: any): void {
    try {
      const { roomCode, studentId, action, reason } = data;
      
      const room = this.rooms.get(roomCode);
      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }
      
      const student = room.players.find(p => p.id === studentId);
      if (!student) {
        socket.emit('error', { message: '학생을 찾을 수 없습니다.' });
        return;
      }
      
      switch (action) {
        case 'warn':
          this.warnStudent(room, student, reason);
          break;
        case 'mute':
          this.muteStudent(room, student, reason);
          break;
        case 'kick':
          this.kickStudent(room, student, reason);
          break;
        case 'spectate':
          this.makeStudentSpectator(room, student);
          break;
        default:
          socket.emit('error', { message: '알 수 없는 조치입니다.' });
          return;
      }
      
      // Record behavior incident
      this.recordStudentBehavior(socket.classroomId, roomCode, {
        studentName: student.name,
        timestamp: new Date(),
        event: 'rule_violation',
        details: `Teacher action: ${action} - ${reason}`,
        severity: action === 'warn' ? 'low' : action === 'mute' ? 'medium' : 'high'
      });
      
      socket.emit('moderation:success', {
        action,
        studentName: student.name,
        message: '조치가 실행되었습니다.'
      });
      
    } catch (error) {
      socket.emit('error', { message: '학생 조치 중 오류가 발생했습니다.' });
    }
  }

  private sendAnalytics(socket: any, data: any): void {
    try {
      const { type, roomCode, timeRange } = data;
      
      if (!socket.classroomId) {
        socket.emit('error', { message: '클래스룸 세션이 필요합니다.' });
        return;
      }
      
      const session = this.classroomSessions.get(socket.classroomId);
      if (!session) {
        socket.emit('error', { message: '클래스룸 세션을 찾을 수 없습니다.' });
        return;
      }
      
      switch (type) {
        case 'overview':
          socket.emit('analytics:overview', this.generateOverviewAnalytics(session));
          break;
        case 'student_engagement':
          socket.emit('analytics:engagement', this.generateEngagementAnalytics(session));
          break;
        case 'game_outcomes':
          socket.emit('analytics:outcomes', this.generateOutcomeAnalytics(session, timeRange));
          break;
        case 'behavior_report':
          socket.emit('analytics:behavior', this.generateBehaviorReport(session, timeRange));
          break;
        case 'room_specific':
          if (roomCode) {
            socket.emit('analytics:room', this.generateRoomAnalytics(session, roomCode));
          }
          break;
        default:
          socket.emit('error', { message: '알 수 없는 분석 요청입니다.' });
      }
      
    } catch (error) {
      socket.emit('error', { message: '분석 데이터 생성 중 오류가 발생했습니다.' });
    }
  }

  private updateClassroomSettings(socket: any, data: any): void {
    try {
      const { settings } = data;
      
      if (!socket.classroomId) {
        socket.emit('error', { message: '클래스룸 세션이 필요합니다.' });
        return;
      }
      
      const session = this.classroomSessions.get(socket.classroomId);
      if (!session) {
        socket.emit('error', { message: '클래스룸 세션을 찾을 수 없습니다.' });
        return;
      }
      
      // Update settings
      session.settings = { ...session.settings, ...settings };
      
      // Apply settings to active rooms
      session.rooms.forEach(classroomRoom => {
        const room = this.rooms.get(classroomRoom.code);
        if (room) {
          this.applySettingsToRoom(room, session.settings);
        }
      });
      
      socket.emit('settings:updated', {
        settings: session.settings,
        message: '설정이 업데이트되었습니다.'
      });
      
      // Notify other teachers
      socket.to(socket.classroomId).emit('classroom:settingsChanged', {
        settings: session.settings
      });
      
    } catch (error) {
      socket.emit('error', { message: '설정 업데이트 중 오류가 발생했습니다.' });
    }
  }

  private handleTeacherDisconnection(socket: any): void {
    if (socket.teacherId) {
      this.teacherSockets.delete(socket.teacherId);
      console.log(`Teacher disconnected: ${socket.teacherName} (${socket.teacherId})`);
    }
  }

  // Helper methods
  private getTeacherCapabilities(): any {
    return {
      roomControl: ['start', 'pause', 'resume', 'force_phase', 'end_game'],
      playerModeration: ['warn', 'mute', 'kick', 'spectate'],
      analytics: ['overview', 'engagement', 'outcomes', 'behavior'],
      settings: ['game_rules', 'time_limits', 'behavior_filters']
    };
  }

  private generateClassroomRoomCode(): string {
    // Generate classroom-specific room codes (4 letters + 2 numbers)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let code;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      for (let i = 0; i < 2; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
    } while (this.rooms.has(code));
    
    return code;
  }

  private getTeacherControls(roomCode: string): any {
    return {
      gameControls: {
        start: { label: '게임 시작', icon: 'play' },
        pause: { label: '일시정지', icon: 'pause' },
        resume: { label: '재개', icon: 'play' },
        forcePhase: { label: '단계 강제 전환', icon: 'skip' },
        endGame: { label: '게임 종료', icon: 'stop' }
      },
      playerControls: {
        eliminatePlayer: { label: '플레이어 제거', icon: 'user-x' },
        revealRoles: { label: '역할 공개', icon: 'eye' },
        makeSpectator: { label: '관전자로 전환', icon: 'eye-off' }
      },
      moderationControls: {
        warn: { label: '경고', icon: 'alert-triangle' },
        mute: { label: '음소거', icon: 'mic-off' },
        kick: { label: '추방', icon: 'user-minus' }
      }
    };
  }

  private initializeAnalytics(): ClassroomAnalytics {
    return {
      totalGames: 0,
      totalStudents: 0,
      averageGameDuration: 0,
      roleDistribution: {},
      winRates: { mafia: 0, citizen: 0, neutral: 0 },
      studentEngagement: [],
      gameOutcomes: []
    };
  }

  private getClassroomRoomStatus(sessionId: string): ClassroomRoom[] {
    const session = this.classroomSessions.get(sessionId);
    if (!session) return [];
    
    return session.rooms.map(classroomRoom => {
      const room = this.rooms.get(classroomRoom.code);
      if (room) {
        return {
          ...classroomRoom,
          playerCount: room.players.length,
          phase: room.phase,
          day: room.day,
          isStarted: room.isStarted,
          alivePlayers: room.players.filter(p => p.isAlive).length
        };
      }
      return classroomRoom;
    });
  }

  // Game control methods
  private startGameWithTeacherControl(room: EnhancedRoom, parameters: any): void {
    if (room.isStarted) return;
    
    room.isStarted = true;
    room.phase = 'night';
    room.day = 1;
    
    // Initialize role abilities
    roleService.initializePlayerAbilities(room.code, room.players);
    
    // Notify players
    this.io.to(room.code).emit('game:started', {
      message: '선생님이 게임을 시작했습니다!',
      phase: 'night',
      day: 1
    });
  }

  private pauseGame(room: EnhancedRoom): void {
    if (room.phaseTimer) {
      clearTimeout(room.phaseTimer);
      room.phaseTimer = undefined;
    }
    
    this.io.to(room.code).emit('game:paused', {
      message: '선생님이 게임을 일시정지했습니다.'
    });
  }

  private resumeGame(room: EnhancedRoom): void {
    this.io.to(room.code).emit('game:resumed', {
      message: '게임이 재개됩니다.',
      phase: room.phase,
      day: room.day
    });
  }

  private forcePhaseTransition(room: EnhancedRoom, targetPhase: string): void {
    const validPhases = ['night', 'day', 'voting'];
    if (!validPhases.includes(targetPhase)) return;
    
    room.phase = targetPhase as any;
    
    this.io.to(room.code).emit('phase:forced', {
      message: `선생님이 ${targetPhase} 단계로 전환했습니다.`,
      phase: targetPhase,
      day: room.day
    });
  }

  private eliminatePlayer(room: EnhancedRoom, playerId: string): void {
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    
    player.isAlive = false;
    
    this.io.to(room.code).emit('player:eliminated', {
      message: `${player.name}이(가) 선생님에 의해 제거되었습니다.`,
      playerId: playerId,
      playerName: player.name
    });
  }

  private revealAllRoles(room: EnhancedRoom): void {
    const roleReveals = room.players.map(player => ({
      name: player.name,
      role: player.role,
      roleInfo: ROLES[player.role]
    }));
    
    this.io.to(room.code).emit('roles:revealed', {
      message: '선생님이 모든 역할을 공개했습니다!',
      players: roleReveals
    });
  }

  private endGameByTeacher(room: EnhancedRoom, reason: string): void {
    room.phase = 'ended';
    
    if (room.phaseTimer) {
      clearTimeout(room.phaseTimer);
    }
    
    this.io.to(room.code).emit('game:ended', {
      message: `선생님이 게임을 종료했습니다. (${reason})`,
      reason: 'teacher_ended',
      finalPlayers: room.players
    });
  }

  // Student moderation methods
  private warnStudent(room: EnhancedRoom, student: EnhancedPlayer, reason: string): void {
    this.io.to(student.id).emit('moderation:warning', {
      message: `선생님 경고: ${reason}`,
      reason: reason
    });
  }

  private muteStudent(room: EnhancedRoom, student: EnhancedPlayer, reason: string): void {
    // In a real implementation, this would disable chat for the student
    this.io.to(student.id).emit('moderation:muted', {
      message: `선생님에 의해 음소거되었습니다: ${reason}`,
      reason: reason
    });
  }

  private kickStudent(room: EnhancedRoom, student: EnhancedPlayer, reason: string): void {
    // Remove student from game
    room.players = room.players.filter(p => p.id !== student.id);
    
    this.io.to(student.id).emit('moderation:kicked', {
      message: `선생님에 의해 게임에서 제거되었습니다: ${reason}`,
      reason: reason
    });
    
    this.io.to(room.code).emit('player:removed', {
      message: `${student.name}이(가) 선생님에 의해 제거되었습니다.`,
      playerId: student.id,
      playerName: student.name
    });
  }

  private makeStudentSpectator(room: EnhancedRoom, student: EnhancedPlayer): void {
    student.isAlive = false; // Effectively makes them a spectator
    
    this.io.to(student.id).emit('moderation:spectator', {
      message: '관전자로 전환되었습니다. 게임을 지켜볼 수 있습니다.'
    });
  }

  // Analytics generation methods
  private generateOverviewAnalytics(session: ClassroomSession): any {
    return {
      totalGames: session.analytics.totalGames,
      totalStudents: session.analytics.totalStudents,
      activeRooms: session.rooms.filter(r => {
        const room = this.rooms.get(r.code);
        return room && room.isStarted && room.phase !== 'ended';
      }).length,
      averageGameDuration: session.analytics.averageGameDuration,
      winRates: session.analytics.winRates,
      sessionDuration: Date.now() - session.createdAt.getTime()
    };
  }

  private generateEngagementAnalytics(session: ClassroomSession): any {
    return {
      studentEngagement: session.analytics.studentEngagement,
      participationTrends: this.calculateParticipationTrends(session),
      mostActiveStudents: session.analytics.studentEngagement
        .sort((a, b) => b.participationScore - a.participationScore)
        .slice(0, 5)
    };
  }

  private generateOutcomeAnalytics(session: ClassroomSession, timeRange: any): any {
    return {
      gameOutcomes: session.analytics.gameOutcomes,
      roleDistribution: session.analytics.roleDistribution,
      winRatesByPlayerCount: this.calculateWinRatesByPlayerCount(session),
      averageDurationByOutcome: this.calculateAverageDurationByOutcome(session)
    };
  }

  private generateBehaviorReport(session: ClassroomSession, timeRange: any): any {
    const allBehaviorRecords = session.rooms.flatMap(room => room.studentBehavior);
    
    return {
      totalIncidents: allBehaviorRecords.length,
      incidentsByType: this.groupBy(allBehaviorRecords, 'event'),
      incidentsBySeverity: this.groupBy(allBehaviorRecords, 'severity'),
      studentsWithIncidents: [...new Set(allBehaviorRecords.map(r => r.studentName))].length,
      timeline: this.createBehaviorTimeline(allBehaviorRecords)
    };
  }

  private generateRoomAnalytics(session: ClassroomSession, roomCode: string): any {
    const classroomRoom = session.rooms.find(r => r.code === roomCode);
    const room = this.rooms.get(roomCode);
    
    if (!classroomRoom || !room) return null;
    
    return {
      roomInfo: classroomRoom,
      currentState: {
        phase: room.phase,
        day: room.day,
        players: room.players.map(p => ({
          name: p.name,
          role: p.role,
          isAlive: p.isAlive
        }))
      },
      gameEvents: classroomRoom.gameEvents,
      behaviorRecords: classroomRoom.studentBehavior
    };
  }

  // Utility methods
  private recordStudentBehavior(classroomId: string, roomCode: string, record: StudentBehaviorRecord): void {
    const session = this.classroomSessions.get(classroomId);
    if (!session) return;
    
    const classroomRoom = session.rooms.find(r => r.code === roomCode);
    if (classroomRoom) {
      classroomRoom.studentBehavior.push(record);
    }
  }

  private logTeacherAction(classroomId: string, teacherName: string, action: string, roomCode: string, parameters: any): void {
    console.log(`Teacher Action: ${teacherName} performed ${action} on room ${roomCode}`, parameters);
  }

  private applySettingsToRoom(room: EnhancedRoom, settings: ClassroomSettings): void {
    // Apply classroom settings to the room
    // This would modify room behavior based on teacher preferences
  }

  private calculateParticipationTrends(session: ClassroomSession): any {
    // Calculate how student participation changes over time
    return {};
  }

  private calculateWinRatesByPlayerCount(session: ClassroomSession): any {
    // Calculate win rates for different player counts
    return {};
  }

  private calculateAverageDurationByOutcome(session: ClassroomSession): any {
    // Calculate average game duration by outcome type
    return {};
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }

  private createBehaviorTimeline(records: StudentBehaviorRecord[]): any {
    // Create timeline of behavior incidents
    return records
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(record => ({
        timestamp: record.timestamp,
        event: record.event,
        severity: record.severity,
        student: record.studentName
      }));
  }

  // Public API methods for external access
  getClassroomSessions(): Map<string, ClassroomSession> {
    return this.classroomSessions;
  }

  getSessionById(sessionId: string): ClassroomSession | undefined {
    return this.classroomSessions.get(sessionId);
  }

  getAllActiveRooms(): ClassroomRoom[] {
    const allRooms: ClassroomRoom[] = [];
    this.classroomSessions.forEach(session => {
      allRooms.push(...session.rooms);
    });
    return allRooms;
  }

  getTeacherBySocket(socketId: string): string | undefined {
    for (const [teacherId, currentSocketId] of this.teacherSockets.entries()) {
      if (currentSocketId === socketId) {
        return teacherId;
      }
    }
    return undefined;
  }
}