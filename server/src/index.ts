import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { handleDeadChatEvents, notifyPlayerDeath } from './socket/deadChatHandlers'
import { generateSecureRoomCode, sanitizePlayerName, RATE_LIMITS, SECURITY_CONFIG } from './shared/constants/security'
import { roleService } from './services/RoleService'
import { AbilityHandlers } from './handlers/AbilityHandlers'
import { EnhancedRoom, EnhancedPlayer, GameStateManager } from './types/GameState'
import { ROLES, createRoleArray } from './shared/constants/roles'
import { ErrorHandler, ErrorType } from './utils/ErrorHandler'
import { GameValidator } from './utils/GameValidator'
import { GameTestSuite } from './testing/GameTestSuite'
import { TeacherDashboard } from './dashboard/TeacherDashboard'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: SECURITY_CONFIG.CORS,
  // Connection settings for better concurrent handling
  pingTimeout: 60000,       // 60 seconds
  pingInterval: 25000,      // 25 seconds
  upgradeTimeout: 30000,    // 30 seconds
  maxHttpBufferSize: 1e6,   // 1MB
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: false
  },
  transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
  allowEIO3: true // Allow older Socket.IO clients
})

const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Landing page route - redirect to client
app.get('/', (req, res) => {
  // For Railway deployment, serve the client from the server
  if (process.env.NODE_ENV === 'production') {
    res.sendFile('index.html', { root: '../client/dist' })
  } else {
    // In development, redirect to Vite dev server
    res.redirect('http://localhost:5173')
  }
})

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../client/dist'))
  
  // Catch-all handler for client-side routing
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/health')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    res.sendFile('index.html', { root: '../client/dist' })
  })
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Error monitoring endpoint
app.get('/admin/errors', (req, res) => {
  try {
    const stats = errorHandler.getErrorStats();
    res.status(200).json({
      ...stats,
      activeRooms: rooms.size,
      activePlayers: players.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get error stats' });
  }
})

// Room status endpoint
app.get('/admin/rooms', (req, res) => {
  try {
    const roomStats = Array.from(rooms.values()).map(room => ({
      code: room.code,
      playerCount: room.players.length,
      phase: room.phase,
      day: room.day,
      isStarted: room.isStarted,
      alivePlayers: room.players.filter(p => p.isAlive).length
    }));
    
    res.status(200).json({
      totalRooms: rooms.size,
      rooms: roomStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get room stats' });
  }
})

// Comprehensive testing endpoints
app.post('/admin/test/all', async (req, res) => {
  try {
    console.log('🧪 Starting comprehensive test suite...');
    const results = await gameTestSuite.runAllTests();
    
    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
      results: results
    };
    
    res.status(200).json({
      message: 'Comprehensive test suite completed',
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Test suite failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
})

app.post('/admin/test/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['basic', 'roles', 'interactions', 'errors', 'classroom'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid test category' });
    }
    
    console.log(`🧪 Running ${category} tests...`);
    const results = await gameTestSuite.runTestCategory(category as any);
    
    const summary = {
      category,
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
      results: results
    };
    
    res.status(200).json({
      message: `${category} tests completed`,
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Test category failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
})

// System validation endpoint
app.post('/admin/validate', async (req, res) => {
  try {
    const validationResults = [];
    
    // Validate all active rooms
    for (const [roomCode, room] of rooms.entries()) {
      const validation = await gameValidator.validateRoom(room);
      validationResults.push({
        roomCode,
        valid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        fixableIssues: validation.fixableIssues
      });
    }
    
    const summary = {
      totalRooms: rooms.size,
      validRooms: validationResults.filter(v => v.valid).length,
      invalidRooms: validationResults.filter(v => !v.valid).length,
      results: validationResults
    };
    
    res.status(200).json({
      message: 'System validation completed',
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Validation failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
})

// Performance benchmark endpoint
app.post('/admin/benchmark', async (req, res) => {
  try {
    const benchmarks = [];
    const startTime = Date.now();
    
    // Test room creation performance
    const roomCreationStart = Date.now();
    for (let i = 0; i < 10; i++) {
      const testRoom = GameStateManager.createEnhancedRoom({
        code: `BENCH${i}`,
        hostId: `host${i}`,
        players: [],
        maxPlayers: 20,
        phase: 'waiting',
        day: 0,
        timeRemaining: 0,
        isStarted: false
      });
    }
    benchmarks.push({
      operation: 'Room Creation (10 rooms)',
      duration: Date.now() - roomCreationStart
    });
    
    // Test role assignment performance
    const roleAssignmentStart = Date.now();
    for (let playerCount = 6; playerCount <= 20; playerCount++) {
      const roles = createRoleArray(playerCount);
      roleService.initializePlayerAbilities(`BENCH_ROLES_${playerCount}`, 
        roles.map((role: string, i: number) => ({
          id: `player${i}`,
          name: `Player${i}`,
          isHost: i === 0,
          isAlive: true,
          role
        }))
      );
    }
    benchmarks.push({
      operation: 'Role Assignment (6-20 players)',
      duration: Date.now() - roleAssignmentStart
    });
    
    res.status(200).json({
      message: 'Performance benchmark completed',
      totalDuration: Date.now() - startTime,
      benchmarks,
      systemInfo: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Benchmark failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
})

// In-memory storage
const rooms = new Map<string, EnhancedRoom>()
const players = new Map()

// Initialize error handling and validation
const errorHandler = new ErrorHandler(io, rooms)
const gameValidator = new GameValidator(errorHandler)

// Initialize ability handlers
const abilityHandlers = new AbilityHandlers(io)
abilityHandlers.setRoomsReference(rooms)

// Initialize test suite
const gameTestSuite = new GameTestSuite(io)

// Initialize teacher dashboard
const teacherDashboard = new TeacherDashboard(io, rooms)

// Connection tracking
const connectionAttempts = new Map() // Track connection attempts per IP
const activeConnections = new Map()  // Track active connections per IP

// Periodic maintenance tasks
setInterval(async () => {
  try {
    // Cleanup old error logs
    errorHandler.clearOldErrors(24); // Clear errors older than 24 hours
    
    // Validate all active rooms
    for (const [roomCode, room] of rooms.entries()) {
      try {
        const validation = await gameValidator.validateRoom(room);
        if (!validation.isValid) {
          console.warn(`Room ${roomCode} validation failed:`, validation.errors);
          
          // Attempt auto-fix
          const fixSuccess = await gameValidator.autoFixRoom(room);
          if (!fixSuccess) {
            console.error(`Failed to auto-fix room ${roomCode}`);
          }
        }
      } catch (error) {
        console.error(`Error validating room ${roomCode}:`, error);
      }
    }
    
    // Cleanup empty or stale rooms
    const now = Date.now();
    for (const [roomCode, room] of rooms.entries()) {
      // Remove rooms that have been empty for more than 10 minutes
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`Cleaned up empty room: ${roomCode}`);
      }
      
      // Check for rooms stuck in phases for too long
      if (room.phase !== 'waiting' && room.phase !== 'ended') {
        const timeInPhase = now - (room.lastPhaseChange || now);
        if (timeInPhase > 10 * 60 * 1000) { // 10 minutes
          console.warn(`Room ${roomCode} stuck in ${room.phase} phase for ${Math.round(timeInPhase / 60000)} minutes`);
          
          await errorHandler.handleError({
            type: ErrorType.PHASE_MISMATCH,
            message: `Room stuck in ${room.phase} phase`,
            roomCode: roomCode,
            timestamp: new Date(),
            severity: 'medium'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in periodic maintenance:', error);
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Rate limiting constants (now using shared constants)
const MAX_CONNECTIONS_PER_IP = RATE_LIMITS.MAX_CONNECTIONS_PER_IP
const CONNECTION_ATTEMPT_WINDOW = RATE_LIMITS.CONNECTION_ATTEMPT_WINDOW
const MAX_CONNECTION_ATTEMPTS = RATE_LIMITS.MAX_CONNECTION_ATTEMPTS

// Generate secure room code using crypto
function generateRoomCode(): string {
  return generateSecureRoomCode()
}

// Middleware for connection limiting
io.use((socket, next) => {
  const clientIp = socket.handshake.address
  const now = Date.now()
  
  // Track connection attempts
  const attempts = connectionAttempts.get(clientIp) || []
  const recentAttempts = attempts.filter((time: number) => now - time < CONNECTION_ATTEMPT_WINDOW)
  
  if (recentAttempts.length >= MAX_CONNECTION_ATTEMPTS) {
    return next(new Error('Too many connection attempts'))
  }
  
  recentAttempts.push(now)
  connectionAttempts.set(clientIp, recentAttempts)
  
  // Track active connections
  const activeCount = activeConnections.get(clientIp) || 0
  if (activeCount >= MAX_CONNECTIONS_PER_IP) {
    return next(new Error('Too many connections from this IP'))
  }
  
  activeConnections.set(clientIp, activeCount + 1)
  
  socket.on('disconnect', () => {
    const count = activeConnections.get(clientIp) || 0
    if (count > 0) {
      activeConnections.set(clientIp, count - 1)
    }
  })
  
  next()
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  // Set socket-specific timeouts
  socket.timeout(60000) // 60 second timeout for responses

  // Error handler for this socket
  socket.on('error', (error) => {
    console.error('Socket error:', socket.id, error)
  })
  
  // Initialize dead chat handlers
  handleDeadChatEvents(io, socket, players)
  
  socket.on('room:create', ({ playerName, maxPlayers }) => {
    try {
      // Input validation
      let sanitizedName;
      try {
        sanitizedName = sanitizePlayerName(playerName);
      } catch (validationError) {
        socket.emit('error', { message: `이름 오류: ${(validationError as Error).message}` });
        return;
      }
      
      // Check max players bounds
      const validMaxPlayers = Math.min(Math.max(maxPlayers || 20, 6), 20)
      
      const roomCode = generateRoomCode()
      const player = {
        id: socket.id,
        name: sanitizedName,
        isHost: true,
        isAlive: true
      }

    const baseRoom = {
      code: roomCode,
      players: [player],
      maxPlayers: validMaxPlayers,
      phase: 'waiting' as const,
      day: 0,
      timeRemaining: 0,
      isStarted: false,
      hostId: socket.id,
      nightActions: new Map(),
      actionSubmitted: new Set(),
      nightVotes: new Map(),
      gameLog: [] as string[]
    }

    const room = GameStateManager.createEnhancedRoom(baseRoom)

    rooms.set(roomCode, room)
    players.set(socket.id, { roomCode, player })
    
    socket.join(roomCode)
    
    // Set socket metadata for dead chat
    ;(socket as any).roomCode = roomCode
    ;(socket as any).player = player
    
    socket.emit('room:created', { roomCode, room })
    
    console.log(`Room ${roomCode} created by ${playerName}`)
    } catch (error) {
      console.error('Error creating room:', error)
      socket.emit('error', { message: '방 생성 중 오류가 발생했습니다.' })
    }
  })

  socket.on('room:join', ({ playerName, roomCode }) => {
    try {
      // Input validation
      let sanitizedName;
      try {
        sanitizedName = sanitizePlayerName(playerName);
      } catch (validationError) {
        socket.emit('error', { message: `이름 오류: ${(validationError as Error).message}` });
        return;
      }
      
      const upperRoomCode = roomCode?.toUpperCase()
      
      if (!upperRoomCode || upperRoomCode.length !== 4) {
        socket.emit('error', { message: '올바르지 않은 방 코드입니다.' })
        return
      }
      
      const room = rooms.get(upperRoomCode)
    
    if (!room) {
      socket.emit('error', { message: '존재하지 않는 방입니다.' })
      return
    }

    // Check for existing player (reconnection)
    const existingPlayer = room.players.find(p => p.name === sanitizedName)
    
    if (existingPlayer && existingPlayer.socketId === undefined) {
      // Reconnection: Update existing player's socket info
      existingPlayer.socketId = socket.id
      existingPlayer.id = socket.id
      players.set(socket.id, { roomCode: upperRoomCode, player: existingPlayer })
      
      socket.join(upperRoomCode)
      
      // Set socket metadata for dead chat
      ;(socket as any).roomCode = upperRoomCode
      ;(socket as any).player = existingPlayer
      
      // Send reconnection success with current game state via room:joined
      socket.emit('room:joined', { 
        roomCode: upperRoomCode, 
        players: room.players,
        gameState: {
          isStarted: room.isStarted,
          phase: room.phase,
          day: room.day,
          timeRemaining: room.timeRemaining || 0
        },
        myPlayer: existingPlayer
      })
      
      // Notify other players of reconnection via game log
      io.to(upperRoomCode).emit('room:playerUpdate', { 
        players: room.players,
        message: `${sanitizedName}이(가) 다시 접속했습니다.`
      })
      
      console.log(`${sanitizedName} reconnected to room ${upperRoomCode}`)
      return
    }
    
    // Check if room is full for new players
    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: '방이 가득 찼습니다.' })
      return
    }
    
    // Check if player name already exists for active players
    if (existingPlayer && existingPlayer.socketId !== undefined) {
      socket.emit('error', { message: '이미 사용 중인 이름입니다.' })
      return
    }

    // Create new player
    const player = GameStateManager.createEnhancedPlayer({
      id: socket.id,
      name: sanitizedName,
      isHost: false,
      isAlive: true,
      role: '',
      socketId: socket.id
    })

    room.players.push(player)
    players.set(socket.id, { roomCode: upperRoomCode, player })
    
    socket.join(upperRoomCode)
    
    // Set socket metadata for dead chat
    ;(socket as any).roomCode = upperRoomCode
    ;(socket as any).player = player
    
    socket.emit('room:joined', { roomCode: upperRoomCode, players: room.players })
    io.to(upperRoomCode).emit('room:playerUpdate', { players: room.players })
    
    console.log(`${sanitizedName} joined room ${upperRoomCode}`)
    } catch (error) {
      console.error('Error joining room:', error)
      socket.emit('error', { message: '방 참여 중 오류가 발생했습니다.' })
    }
  })

  socket.on('game:start', ({ roomCode }) => {
    try {
    const room = rooms.get(roomCode)
    
    if (!room) {
      socket.emit('error', { message: '존재하지 않는 방입니다.' })
      return
    }

    if (room.players.length < 6) {
      socket.emit('error', { message: '최소 6명이 필요합니다.' })
      return
    }

    if (room.players.length > 20) {
      socket.emit('error', { message: '최대 20명까지 참여 가능합니다.' })
      return
    }

    if (socket.id !== room.hostId) {
      socket.emit('error', { message: '방장만 게임을 시작할 수 있습니다.' })
      return
    }

    // 역할 배정 로직 (enhanced)
    const roles = assignRoles(room.players.length)
    room.players.forEach((player, index) => {
      player.role = roles[index]
    })

    // Initialize role abilities for all players
    roleService.initializePlayerAbilities(roomCode, room.players)

    // 게임 상태 초기화 (enhanced)
    room.isStarted = true
    room.phase = 'night'
    room.day = 1
    room.phaseTimer = undefined
    GameStateManager.resetDayState(room)
    
    // 각 플레이어에게 개별 역할 정보 전송 (enhanced)
    room.players.forEach(player => {
      const roleData = ROLES[player.role]
      io.to(player.id).emit('role:assigned', {
        role: player.role,
        roleInfo: {
          name: roleData.name,
          team: roleData.team,
          description: roleData.description,
          ability: roleData.ability,
          special: roleData.special
        }
      })
    })
    
    // 게임 시작 알림
    io.to(roomCode).emit('game:started', { 
      message: '게임이 시작되었습니다!',
      playerCount: room.players.length,
      phase: 'night',
      day: 1
    })
    
    console.log(`Game started in room ${roomCode} with ${room.players.length} players`)
    
    // 첫 번째 밤 페이즈 시작
    startNightPhase(roomCode)
    } catch (error) {
      console.error('Error starting game:', error)
      socket.emit('error', { message: '게임 시작 중 오류가 발생했습니다.' })
    }
  })

  socket.on('disconnect', async () => {
    const playerData = players.get(socket.id)
    
    if (playerData) {
      const { roomCode, player } = playerData
      console.log(`Player ${player?.name || 'Unknown'} disconnected from room ${roomCode}`)
      
      try {
        // Handle disconnection with error recovery
        await errorHandler.handleError({
          type: ErrorType.SOCKET_DISCONNECTION,
          message: `Player ${player?.name || socket.id} disconnected`,
          roomCode: roomCode,
          playerId: socket.id,
          timestamp: new Date(),
          severity: 'medium'
        });

        const room = rooms.get(roomCode)
        if (room) {
          // For active games, maintain player in room but mark as disconnected
          if (room.isStarted && room.phase !== 'ended') {
            const playerInRoom = room.players.find(p => p.id === socket.id);
            if (playerInRoom) {
              // Keep player in game but mark socketId as undefined for reconnection
              playerInRoom.socketId = undefined;
              
              // Submit dummy action if needed
              if (room.phase === 'night' && !room.actionSubmitted.has(socket.id)) {
                room.actionSubmitted.add(socket.id);
                checkAllPlayersActed(roomCode);
              }
            }
            
            // Notify disconnection but keep player in game via room update
            io.to(roomCode).emit('room:playerUpdate', { 
              players: room.players,
              message: `${player?.name || 'Unknown'}의 연결이 끊어졌습니다. 재접속을 기다립니다.`
            });
          } else {
            // For non-active games, remove player completely
            room.players = room.players.filter(p => p.id !== socket.id)
            
            if (room.players.length === 0) {
              if (room.phaseTimer) {
                clearTimeout(room.phaseTimer)
              }
              rooms.delete(roomCode)
              console.log(`Room ${roomCode} deleted (empty)`)
            } else {
              // 방장이 나갔으면 다음 사람을 방장으로
              if (room.hostId === socket.id) {
                room.players[0].isHost = true
                room.hostId = room.players[0].id
              }
              
              io.to(roomCode).emit('room:playerUpdate', { 
                players: room.players,
                message: `${player?.name || 'Unknown'}이(가) 게임을 나갔습니다.`
              })
            }
          }
        }
        
        players.delete(socket.id)
      } catch (error) {
        console.error(`Error handling disconnect for ${socket.id}:`, error);
        // Ensure cleanup even if error handling fails
        players.delete(socket.id);
      }
    }
    
    console.log('User disconnected:', socket.id)
  })

  // 투표 이벤트 처리
  socket.on('vote:cast', ({ roomCode, targetPlayerId }) => {
    try {
      const room = rooms.get(roomCode)
      if (!room || (room.phase !== 'voting' && room.phase !== 'day')) {
        socket.emit('error', { message: '현재 투표할 수 없습니다.' })
        return
      }

      const player = room.players.find(p => p.id === socket.id)
      if (!player || !player.isAlive) {
        socket.emit('error', { message: '투표할 수 없습니다.' })
        return
      }

      const targetPlayer = room.players.find(p => p.id === targetPlayerId)
      if (!targetPlayer || !targetPlayer.isAlive) {
        socket.emit('error', { message: '유효하지 않은 대상입니다.' })
        return
      }

      room.votes.set(socket.id, targetPlayerId)
      
      socket.emit('vote:confirmed', { 
        target: targetPlayer?.name || '',
        message: `${targetPlayer?.name || 'Unknown'}에게 투표했습니다.` 
      })

      console.log(`${player.name} voted for ${targetPlayer?.name || 'Unknown'} in room ${roomCode}`)
      
      // 모든 플레이어가 투표했는지 확인
      checkAllPlayersVoted(roomCode)
    } catch (error) {
      console.error('Error casting vote:', error)
      socket.emit('error', { message: '투표 중 오류가 발생했습니다.' })
    }
  })

  // 밤 행동 이벤트 처리
  socket.on('night:action', async ({ roomCode, actionType, targetPlayerId }) => {
    try {
      const room = rooms.get(roomCode)
      if (!room || room.phase !== 'night') {
        socket.emit('error', { message: '현재 밤 행동을 할 수 없습니다.' })
        return
      }

      const player = room.players.find(p => p.id === socket.id)
      if (!player || !player.isAlive) {
        socket.emit('error', { message: '행동할 수 없습니다.' })
        return
      }

      // Validate action before processing
      const actionValidation = gameValidator.validateAction(room, socket.id, {
        actionType,
        targetPlayerId
      });

      if (!actionValidation.isValid) {
        await errorHandler.handleError({
          type: ErrorType.INVALID_ACTION,
          message: `Invalid night action: ${actionValidation.errors.join(', ')}`,
          roomCode: roomCode,
          playerId: socket.id,
          details: { actionType, targetPlayerId, errors: actionValidation.errors },
          timestamp: new Date(),
          severity: 'low'
        });

        socket.emit('error', { message: actionValidation.errors[0] || '유효하지 않은 행동입니다.' })
        return
      }

      // Enhanced ability handling
      
      // 더미 액션 처리
      if (actionType === 'dummy') {
        room.actionSubmitted.add(socket.id)
        socket.emit('night:actionConfirmed', { 
          target: '',
          message: '대기 중... 다른 플레이어들이 행동을 마칠 때까지 기다려주세요.'
        })
        
        // 모든 플레이어가 행동했는지 확인
        checkAllPlayersActed(roomCode)
        return
      }

      // Use enhanced role service for validation
      const canUse = roleService.canUseAbility(roomCode, player, room.day)
      if (!canUse) {
        socket.emit('error', { message: '현재 능력을 사용할 수 없습니다.' })
        return
      }

      const targetPlayer = room.players.find(p => p.id === targetPlayerId)
      if (targetPlayerId && (!targetPlayer || !roleService.validateTarget(player, targetPlayer, actionType, room))) {
        socket.emit('error', { message: '유효하지 않은 대상입니다.' })
        return
      }

      // 마피아 투표 시스템 - Enhanced validation
      const roleInfo = getRoleInfo(player.role)
      if (actionType === 'kill' && roleInfo.canKill) {
        // 마피아 투표 기록
        if (!room.nightVotes.has(targetPlayerId)) {
          room.nightVotes.set(targetPlayerId, [])
        }
        room.nightVotes.get(targetPlayerId)!.push(socket.id)
        
        // 다른 마피아들에게 투표 현황 알림
        const mafiaTeam = room.players.filter(p => 
          p.isAlive && getRoleInfo(p.role).team === 'mafia' && getRoleInfo(p.role).canKill
        )
        
        const voteStatus = Array.from(room.nightVotes.entries()).map(([targetId, voters]) => ({
          targetName: room.players.find(p => p.id === targetId)?.name,
          voteCount: voters.length
        }))
        
        mafiaTeam.forEach(mafia => {
          io.to(mafia.id).emit('mafia:voteStatus', {
            voteStatus,
            totalMafia: mafiaTeam.length,
            message: `${player.name}이(가) ${targetPlayer?.name || 'Unknown'}에게 투표했습니다.`
          })
        })
      } else {
        // 일반 행동 처리
        room.nightActions.set(socket.id, {
          type: actionType,
          target: targetPlayerId
        })
      }

      room.actionSubmitted.add(socket.id)

      let actionMessage = ''
      switch (actionType) {
        case 'kill':
          actionMessage = `${targetPlayer?.name || 'Unknown'}을(를) 공격 대상으로 투표했습니다.`
          break
        case 'heal':
          actionMessage = `${targetPlayer?.name || 'Unknown'}을(를) 치료했습니다.`
          break
        case 'investigate':
          actionMessage = `${targetPlayer?.name || 'Unknown'}을(를) 조사했습니다.`
          break
      }

      socket.emit('night:actionConfirmed', { 
        target: targetPlayer?.name || '',
        message: actionMessage
      })

      console.log(`${player.name} performed ${actionType} on ${targetPlayer?.name || 'Unknown'} in room ${roomCode}`)
      
      // 모든 플레이어가 행동했는지 확인
      checkAllPlayersActed(roomCode)
      
    } catch (error) {
      console.error('Error processing night action:', error)
      socket.emit('error', { message: '밤 행동 중 오류가 발생했습니다.' })
    }
  })
})

// 역할 배정 함수 (6-20명 지원)
function assignRoles(playerCount: number): string[] {
  const roleDistribution: { [key: number]: string[] } = {
    6: ['mafia', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor'],
    7: ['mafia', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor'], // 마피아 비율 조정 (1/7 = 14.3%)
    8: ['mafia', 'mafia', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor'],
    9: ['mafia', 'mafia', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police'],
    10: ['mafia', 'mafia', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier'],
    11: ['mafia', 'mafia', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier'], // spy 제거로 밸런스 조정
    12: ['mafia', 'mafia', 'mafia', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier', 'reporter'],
    13: ['mafia', 'mafia', 'mafia', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier', 'reporter'], // spy 제거로 밸런스 조정
    14: ['mafia', 'mafia', 'mafia', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier', 'detective'],
    15: ['mafia', 'mafia', 'mafia', 'spy', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier', 'reporter', 'bartender'],
    16: ['mafia', 'mafia', 'mafia', 'spy', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier', 'reporter', 'bartender', 'terrorist'],
    17: ['mafia', 'mafia', 'mafia', 'spy', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier', 'reporter', 'bartender', 'terrorist'],
    18: ['mafia', 'mafia', 'mafia', 'spy', 'werewolf', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier', 'reporter', 'medium', 'terrorist'],
    19: ['mafia', 'mafia', 'mafia', 'spy', 'werewolf', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier', 'reporter', 'wizard', 'medium', 'terrorist'],
    20: ['mafia', 'mafia', 'mafia', 'spy', 'werewolf', 'doubleAgent', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'doctor', 'police', 'soldier', 'reporter', 'wizard', 'thief', 'illusionist']
  }

  const roles = roleDistribution[playerCount] || roleDistribution[6]
  
  // 역할 섞기
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]]
  }
  
  return roles
}

// 역할 정보 반환 함수
function getRoleInfo(role: string) {
  const roleInfoMap: { [key: string]: any } = {
    // 마피아 팀
    mafia: { team: 'mafia', description: '밤에 시민을 제거할 수 있습니다.', canKill: true },
    spy: { team: 'mafia', description: '마피아팀이지만 경찰 조사에 시민으로 나타납니다.', canKill: false, appearsInnocent: true },
    werewolf: { team: 'mafia', description: '홀수 밤에만 활동할 수 있는 마피아입니다.', canKill: true, oddNightsOnly: true },
    doubleAgent: { team: 'mafia', description: '두 번의 생명을 가진 마피아입니다.', canKill: true, hasExtraLife: true },
    
    // 시민 팀
    citizen: { team: 'citizen', description: '평범한 시민입니다.', abilities: [] },
    police: { team: 'citizen', description: '밤에 한 명을 조사하여 마피아인지 확인할 수 있습니다.', canInvestigate: true },
    doctor: { team: 'citizen', description: '밤에 한 명을 치료하여 죽음으로부터 보호할 수 있습니다.', canHeal: true },
    soldier: { team: 'citizen', description: '마피아의 공격을 한 번 버틸 수 있습니다.', hasShield: true },
    reporter: { team: 'citizen', description: '죽은 후에도 하루 더 말할 수 있습니다.', canSpeakAfterDeath: true },
    detective: { team: 'citizen', description: '죽은 플레이어의 역할을 확인할 수 있습니다.', canInvestigateDead: true },
    bartender: { team: 'citizen', description: '플레이어를 취하게 만들어 능력을 봉인할 수 있습니다.', canBlock: true },
    medium: { team: 'citizen', description: '죽은 플레이어와 소통할 수 있습니다.', canCommunicateWithDead: true },
    wizard: { team: 'citizen', description: '밤에 마법을 사용해 특수 능력을 발휘합니다.', canCastSpell: true },
    thief: { team: 'citizen', description: '다른 플레이어의 역할을 훔칠 수 있습니다.', canStealRole: true },
    
    // 중립 팀
    turncoat: { team: 'neutral', description: '마지막까지 살아남으면 승리합니다.', winCondition: 'survive' },
    terrorist: { team: 'neutral', description: '죽을 때 한 명을 함께 데려갑니다.', canRevenge: true },
    illusionist: { team: 'neutral', description: '환상을 만들어 다른 플레이어들을 속입니다.', canCreateIllusion: true }
  }
  
  return roleInfoMap[role] || { team: 'citizen', description: '알 수 없는 역할입니다.' }
}

// 모든 플레이어가 행동했는지 확인
function checkAllPlayersActed(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room || room.phase !== 'night') return
  
  const alivePlayers = room.players.filter(p => p.isAlive)
  const actedPlayers = room.actionSubmitted.size
  
  console.log(`Room ${roomCode} - Actions completed: ${actedPlayers}/${alivePlayers.length}`)
  console.log(`Acted players:`, Array.from(room.actionSubmitted))
  console.log(`Alive players:`, alivePlayers.map(p => ({ id: p.id, name: p.name })))
  
  // 모든 살아있는 플레이어가 행동했으면 즉시 처리
  if (actedPlayers >= alivePlayers.length) {
    console.log(`All players acted in room ${roomCode}, processing night actions...`)
    clearTimeout(room.phaseTimer)
    processNightActionsEnhanced(roomCode)
  }
}

// 모든 플레이어가 투표했는지 확인
function checkAllPlayersVoted(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room || (room.phase !== 'day' && room.phase !== 'voting')) return
  
  const alivePlayers = room.players.filter(p => p.isAlive)
  const votedPlayers = room.votes.size
  
  console.log(`Room ${roomCode} - Votes completed: ${votedPlayers}/${alivePlayers.length}`)
  console.log(`Voted players:`, Array.from(room.votes.keys()))
  console.log(`Alive players:`, alivePlayers.map(p => ({ id: p.id, name: p.name })))
  
  // 투표 진행률 알림
  io.to(roomCode).emit('voting:progress', {
    voted: votedPlayers,
    total: alivePlayers.length,
    message: `투표 진행률: ${votedPlayers}/${alivePlayers.length}명`
  })
  
  // 모든 살아있는 플레이어가 투표했으면 즉시 처리
  if (votedPlayers >= alivePlayers.length) {
    console.log(`All players voted in room ${roomCode}, processing voting results...`)
    clearTimeout(room.phaseTimer)
    
    // day 페이즈에서 투표 완료 시 즉시 결과 처리
    if (room.phase === 'day') {
      room.phase = 'voting' // 잠시 voting 상태로 변경
    }
    processVotingResults(roomCode)
  }
}

// 게임 페이즈 관리 함수들
function startNightPhase(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return
  
  room.phase = 'night'
  room.nightActions.clear()
  room.nightVotes.clear()
  room.actionSubmitted.clear()
  
  console.log(`Night phase started in room ${roomCode}`)
  
  // 밤 페이즈 시작 알림
  io.to(roomCode).emit('phase:night', {
    phase: 'night',
    day: room.day,
    timeRemaining: 60000, // 60초
    message: `${room.day}일차 밤이 되었습니다.`
  })
  
  // Enhanced ability assignment using RoleService
  room.players.forEach(player => {
    if (player.isAlive) {
      const roleData = ROLES[player.role]
      const canUseAbility = roleService.canUseAbility(roomCode, player, room.day)
      
      console.log(`Sending action to ${player.name} (${player.role}):`, { 
        hasAbility: !!roleData.ability, 
        canUse: canUseAbility,
        abilityType: roleData.ability?.action 
      })
      
      // Check if player has night phase ability and can use it
      if (roleData.ability?.phase === 'night' && canUseAbility) {
        const actionType = roleService.getActionType(player.role)
        console.log(`  -> Special action: ${actionType}`)
        
        io.to(player.id).emit('night:actionAvailable', {
          canAct: true,
          actionType: actionType,
          isDummy: false,
          abilityDescription: roleData.ability.description
        })
      } 
      // Citizens without abilities get dummy actions
      else {
        console.log(`  -> Dummy action`)
        io.to(player.id).emit('night:actionAvailable', {
          canAct: true,
          actionType: 'dummy',
          isDummy: true,
          message: '잠시 대기하세요. 다른 플레이어들이 행동 중입니다.'
        })
      }
    }
  })
  
  // 60초 타이머 설정
  room.phaseTimer = setTimeout(() => {
    processNightActionsEnhanced(roomCode)
  }, 60000)
}

async function startDayPhase(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return
  
  room.phase = 'day'
  room.votes.clear()
  
  console.log(`Day phase started in room ${roomCode}`)
  
  try {
    // Process day actions (delayed effects, announcements)
    await abilityHandlers.processDayActions(roomCode, room)
  } catch (error) {
    console.error(`Error processing day actions for room ${roomCode}:`, error)
  }
  
  // 낮 페이즈 시작 알림 (토론과 투표 동시 진행)
  io.to(roomCode).emit('phase:day', {
    phase: 'day',
    day: room.day,
    timeRemaining: 180000, // 3분 (최대 시간)
    message: `${room.day}일차 낮이 되었습니다. 토론하고 투표하세요.`,
    alivePlayers: room.players.filter(p => p.isAlive),
    canVote: true // 낮 페이즈에서 투표 가능
  })
  
  // 3분 타이머 설정 (최대 대기 시간)
  room.phaseTimer = setTimeout(() => {
    // 시간이 다 되면 바로 투표 결과 처리 (별도 투표 페이즈 없이)
    processVotingResults(roomCode)
  }, 180000)
}

function startVotingPhase(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return
  
  room.phase = 'voting'
  room.votes.clear()
  
  console.log(`Voting phase started in room ${roomCode}`)
  
  // 투표 페이즈 시작 알림
  io.to(roomCode).emit('phase:voting', {
    phase: 'voting',
    day: room.day,
    timeRemaining: 60000, // 1분
    message: '투표를 시작합니다. 의심스러운 사람을 선택하세요.',
    alivePlayers: room.players.filter(p => p.isAlive)
  })
  
  // 1분 타이머 설정
  room.phaseTimer = setTimeout(() => {
    processVotingResults(roomCode)
  }, 60000)
}

// Enhanced night actions processing
async function processNightActionsEnhanced(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return
  
  console.log(`Processing enhanced night actions for room ${roomCode}`)
  
  try {
    // Use the enhanced ability handlers
    await abilityHandlers.processNightActions(roomCode, room)
    
    // Check win conditions
    const winCondition = GameStateManager.checkWinConditions(room, roleService)
    if (winCondition) {
      endGame(roomCode, winCondition)
      return
    }
    
    // Start new day and clear night state
    roleService.startNewDay(roomCode)
    
    // Transition to day phase
    setTimeout(() => startDayPhase(roomCode), 3000)
    
  } catch (error) {
    console.error(`Error processing night actions for room ${roomCode}:`, error)
    
    // Fallback to old system if enhanced processing fails
    processNightActions(roomCode)
  }
}

// Original function kept as fallback
function processNightActions(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return
  
  console.log(`Processing night actions for room ${roomCode} (fallback mode)`)
  
  let killTarget: string | null = null
  let healTarget = null
  let investigateTarget = null
  let investigateResult = null
  
  // 마피아 투표 결과 처리 - 가장 많은 표를 받은 대상을 공격
  if (room.nightVotes.size > 0) {
    let maxVotes = 0
    let mostVotedTarget = null
    
    room.nightVotes.forEach((voters, targetId) => {
      if (voters.length > maxVotes) {
        maxVotes = voters.length
        mostVotedTarget = targetId
      }
    })
    
    // 동률일 경우 첫 번째 대상 선택
    if (mostVotedTarget) {
      killTarget = mostVotedTarget
      console.log(`Mafia voted to kill: ${room.players.find(p => p.id === killTarget)?.name} (${maxVotes} votes)`)
    }
  }
  
  // 기타 밤 행동 처리
  room.nightActions.forEach((action, playerId) => {
    const player = room.players.find(p => p.id === playerId)
    if (!player || !player.isAlive) return
    
    if (action.type === 'heal' && getRoleInfo(player.role).canHeal) {
      healTarget = action.target
    } else if (action.type === 'investigate' && getRoleInfo(player.role).canInvestigate) {
      investigateTarget = action.target
      const targetPlayer = room.players.find(p => p.id === action.target)
      if (targetPlayer) {
        const targetRoleInfo = getRoleInfo(targetPlayer.role)
        // 스파이는 마피아팀이지만 경찰 조사에는 무고하게 나타남
        if (targetRoleInfo.appearsInnocent) {
          investigateResult = 'innocent'
        } else {
          investigateResult = targetRoleInfo.team === 'mafia' ? 'mafia' : 'innocent'
        }
      }
    }
  })
  
  // 살해 시도 처리 (의사의 치료와 대조)
  if (killTarget && killTarget !== healTarget) {
    const targetPlayer = room.players.find(p => p.id === killTarget)
    if (targetPlayer) {
      targetPlayer.isAlive = false
      room.gameLog.push(`${targetPlayer.name}이(가) 밤에 사망했습니다.`)
      
      // Notify dead chat system
      notifyPlayerDeath(io, roomCode, targetPlayer, players)
    }
  }
  
  // 경찰 조사 결과 전송
  if (investigateTarget && investigateResult) {
    const investigator = room.players.find(p => p.id === Array.from(room.nightActions.keys()).find(id => 
      room.nightActions.get(id)?.type === 'investigate'
    ))
    if (investigator) {
      io.to(investigator.id).emit('investigate:result', {
        target: investigateTarget,
        result: investigateResult
      })
    }
  }
  
  // 밤 결과 알림
  const dayResultMessage = killTarget && killTarget !== healTarget ? 
    `밤 사이에 ${room.players.find(p => p.id === killTarget)?.name}이(가) 사망했습니다.` :
    '평화로운 밤이었습니다.'
  
  io.to(roomCode).emit('night:result', {
    message: dayResultMessage,
    deadPlayers: room.players.filter(p => !p.isAlive),
    alivePlayers: room.players.filter(p => p.isAlive)
  })
  
  // 승부 판정
  if (checkWinCondition(roomCode)) {
    return
  }
  
  // 다음 낮 페이즈로
  room.day++
  setTimeout(() => startDayPhase(roomCode), 3000)
}

// Enhanced game ending with proper win condition handling
function endGame(roomCode: string, winCondition: any): void {
  const room = rooms.get(roomCode)
  if (!room) return

  console.log(`Game ended in room ${roomCode}:`, winCondition)

  // Clear any active timers
  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer)
  }

  // Set final game state
  room.phase = 'ended'
  room.winner = winCondition.team
  room.winCondition = winCondition.message

  // Reveal all player roles
  const finalPlayers = room.players.map(player => ({
    ...player,
    role: player.role,
    roleInfo: ROLES[player.role]
  }))

  // Broadcast game end
  io.to(roomCode).emit('game:ended', {
    winner: winCondition.team,
    message: winCondition.message,
    finalPlayers: finalPlayers,
    gameLog: room.gameLog,
    winningPlayers: winCondition.winners
  })

  // Cleanup resources
  abilityHandlers.cleanup(roomCode)
  
  // Schedule room cleanup
  setTimeout(() => {
    rooms.delete(roomCode)
    console.log(`Room ${roomCode} cleaned up`)
  }, 300000) // 5 minutes
}

async function processVotingResults(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return
  
  console.log(`Processing enhanced voting results for room ${roomCode}`)
  
  try {
    // Use enhanced ability handlers for voting with special abilities
    await abilityHandlers.processVoting(roomCode, room)
    
    // Check win conditions with enhanced system
    const winCondition = GameStateManager.checkWinConditions(room, roleService)
    if (winCondition) {
      endGame(roomCode, winCondition)
      return
    }
    
    // Transition to next night phase
    setTimeout(() => startNightPhase(roomCode), 3000)
    
  } catch (error) {
    console.error(`Error processing voting results for room ${roomCode}:`, error)
    
    // Fallback to old system if enhanced processing fails
    processVotingResultsFallback(roomCode)
  }
}

// Fallback voting processing (original function)
function processVotingResultsFallback(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return
  
  console.log(`Processing voting results for room ${roomCode} (fallback mode)`)
  
  // 투표 집계
  const voteCounts = new Map()
  room.votes.forEach((target) => {
    voteCounts.set(target, (voteCounts.get(target) || 0) + 1)
  })
  
  // 최다 득표자 찾기
  let maxVotes = 0
  let eliminatedPlayer: string | null = null
  
  voteCounts.forEach((count, playerId) => {
    if (count > maxVotes) {
      maxVotes = count
      eliminatedPlayer = playerId
    }
  })
  
  let resultMessage = ''
  if (eliminatedPlayer && maxVotes > 0) {
    const player = room.players.find(p => p.id === eliminatedPlayer)
    if (player) {
      player.isAlive = false
      resultMessage = `투표 결과 ${player.name}(${getRoleInfo(player.role).team})이(가) 추방되었습니다.`
      room.gameLog.push(resultMessage)
      
      // Notify dead chat system
      notifyPlayerDeath(io, roomCode, player, players)
    }
  } else {
    resultMessage = '투표 결과 아무도 추방되지 않았습니다.'
  }
  
  // 투표 결과 알림
  io.to(roomCode).emit('voting:result', {
    message: resultMessage,
    eliminatedPlayer: eliminatedPlayer,
    voteCounts: Object.fromEntries(voteCounts),
    alivePlayers: room.players.filter(p => p.isAlive)
  })
  
  // 승부 판정
  if (checkWinCondition(roomCode)) {
    return
  }
  
  // 다음 밤 페이즈로
  setTimeout(() => startNightPhase(roomCode), 3000)
}

function checkWinCondition(roomCode: string): boolean {
  const room = rooms.get(roomCode)
  if (!room) return false
  
  const alivePlayers = room.players.filter(p => p.isAlive)
  const aliveMafia = alivePlayers.filter(p => getRoleInfo(p.role).team === 'mafia')
  const aliveCitizens = alivePlayers.filter(p => getRoleInfo(p.role).team === 'citizen')
  const aliveNeutral = alivePlayers.filter(p => getRoleInfo(p.role).team === 'neutral')
  
  let winner = null
  let message = ''
  
  // 중립 팀 생존 승리 조건 체크 (turncoat)
  const survivorNeutral = aliveNeutral.find(p => getRoleInfo(p.role).winCondition === 'survive')
  if (survivorNeutral && alivePlayers.length === 1) {
    winner = 'neutral'
    message = `${survivorNeutral.name}(배신자)가 최후의 생존자가 되어 승리했습니다!`
  }
  // 마피아팀 전멸
  else if (aliveMafia.length === 0) {
    winner = 'citizens'
    message = '시민팀이 승리했습니다! 모든 마피아가 제거되었습니다.'
  } 
  // 마피아가 시민과 같거나 많아짐 (중립 제외)
  else if (aliveMafia.length >= aliveCitizens.length) {
    winner = 'mafia'
    message = '마피아팀이 승리했습니다! 마피아가 시민과 같거나 더 많아졌습니다.'
  }
  
  if (winner) {
    room.phase = 'ended'
    if (room.phaseTimer) {
      clearTimeout(room.phaseTimer)
    }
    
    io.to(roomCode).emit('game:ended', {
      winner: winner,
      message: message,
      finalPlayers: room.players,
      gameLog: room.gameLog
    })
    
    console.log(`Game ended in room ${roomCode}: ${winner} wins`)
    return true
  }
  
  return false
}

// Periodic cleanup
setInterval(() => {
  // Clean up empty rooms
  for (const [code, room] of rooms.entries()) {
    if (room.players.length === 0) {
      rooms.delete(code)
      console.log(`Cleaned up empty room: ${code}`)
    }
  }
  
  // Clean up old connection attempts
  const now = Date.now()
  for (const [ip, attempts] of connectionAttempts.entries()) {
    const recentAttempts = attempts.filter((time: number) => now - time < CONNECTION_ATTEMPT_WINDOW)
    if (recentAttempts.length === 0) {
      connectionAttempts.delete(ip)
    } else {
      connectionAttempts.set(ip, recentAttempts)
    }
  }
}, 60000) // Run every minute

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Socket.IO settings:`)
  console.log(`  - Max connections per IP: ${MAX_CONNECTIONS_PER_IP}`)
  console.log(`  - Ping timeout: 60s`)
  console.log(`  - Ping interval: 25s`)
})