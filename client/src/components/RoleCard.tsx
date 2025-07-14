import React from 'react'

// Import role images using Vite static imports for reliable paths
import mafiaImage from '../assets/images/roles/mafia-team/mafia.png'
import spyImage from '../assets/images/roles/mafia-team/spy.png'
import werewolfImage from '../assets/images/roles/mafia-team/werewolf.png'
import doubleAgentImage from '../assets/images/roles/mafia-team/double_agent.png'

import citizenImage from '../assets/images/roles/citizen-team/citizen.png'
import policeImage from '../assets/images/roles/citizen-team/police.png'
import doctorImage from '../assets/images/roles/citizen-team/doctor.png'
import soldierImage from '../assets/images/roles/citizen-team/soldier.png'
import reporterImage from '../assets/images/roles/citizen-team/reporter.png'
import detectiveImage from '../assets/images/roles/citizen-team/detective.png'
import bartenderImage from '../assets/images/roles/citizen-team/bartender.png'
import mediumImage from '../assets/images/roles/citizen-team/medium.png'
import wizardImage from '../assets/images/roles/citizen-team/wizard.png'
import thiefImage from '../assets/images/roles/citizen-team/thief.png'
import cheerleaderImage from '../assets/images/roles/citizen-team/cheerleader.png'

import turncoatImage from '../assets/images/roles/neutral-team/turncoat.png'
import terroristImage from '../assets/images/roles/neutral-team/terrorist.png'
import ghostImage from '../assets/images/roles/neutral-team/ghost.png'
import illusionistImage from '../assets/images/roles/neutral-team/illusionist.png'

// Default role image from public directory
const defaultRoleImage = '/assets/images/roles/ui/default_role.png'

interface RoleCardProps {
  role: string
  playerName?: string
  isRevealed?: boolean
  size?: 'small' | 'medium' | 'large'
}

// Role image mapping using imported images
const roleImagePaths: Record<string, string> = {
  // Mafia Team
  mafia: mafiaImage,
  spy: spyImage,
  werewolf: werewolfImage,
  doubleAgent: doubleAgentImage,
  
  // Citizen Team
  citizen: citizenImage,
  police: policeImage,
  doctor: doctorImage,
  soldier: soldierImage,
  reporter: reporterImage,
  detective: detectiveImage,
  bartender: bartenderImage,
  medium: mediumImage,
  wizard: wizardImage,
  thief: thiefImage,
  cheerleader: cheerleaderImage,
  
  // Neutral Team
  turncoat: turncoatImage,
  terrorist: terroristImage,
  ghost: ghostImage,
  illusionist: illusionistImage
}

// Role names in Korean
const roleNames: Record<string, string> = {
  // Mafia Team
  mafia: '마피아',
  spy: '스파이',
  werewolf: '늑대인간',
  doubleAgent: '이중스파이',
  
  // Citizen Team
  citizen: '시민',
  police: '경찰',
  doctor: '의사',
  soldier: '군인',
  reporter: '기자',
  detective: '탐정',
  bartender: '바텐더',
  medium: '영매',
  wizard: '마법사',
  thief: '도둑',
  cheerleader: '치어리더',
  
  // Neutral Team
  turncoat: '배신자',
  terrorist: '테러리스트',
  ghost: '유령',
  illusionist: '일루셔니스트'
}

// Role team colors
const roleTeamColors: Record<string, string> = {
  // Mafia Team
  mafia: 'bg-red-600',
  spy: 'bg-red-600',
  werewolf: 'bg-red-600',
  doubleAgent: 'bg-red-600',
  
  // Citizen Team
  citizen: 'bg-blue-600',
  police: 'bg-blue-600',
  doctor: 'bg-blue-600',
  soldier: 'bg-blue-600',
  reporter: 'bg-blue-600',
  detective: 'bg-blue-600',
  bartender: 'bg-blue-600',
  medium: 'bg-blue-600',
  wizard: 'bg-blue-600',
  thief: 'bg-blue-600',
  cheerleader: 'bg-blue-600',
  
  // Neutral Team
  turncoat: 'bg-purple-600',
  terrorist: 'bg-purple-600',
  ghost: 'bg-purple-600',
  illusionist: 'bg-purple-600'
}

const RoleCard: React.FC<RoleCardProps> = ({ 
  role, 
  playerName, 
  isRevealed = false,
  size = 'medium' 
}) => {
  const imagePath = roleImagePaths[role] || defaultRoleImage
  const roleName = roleNames[role] || role
  const teamColor = roleTeamColors[role] || 'bg-gray-600'
  
  const sizeClasses = {
    small: 'w-20 h-28',
    medium: 'w-32 h-44',
    large: 'w-48 h-64'
  }
  
  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  return (
    <div className={`${sizeClasses[size]} bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-300`}>
      {isRevealed ? (
        <>
          <div className="relative h-3/4">
            <img 
              src={imagePath} 
              alt={roleName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = defaultRoleImage
              }}
            />
            <div className={`absolute top-1 right-1 ${teamColor} text-white px-1 py-0.5 rounded text-xs font-bold`}>
              {roleName}
            </div>
          </div>
          <div className={`h-1/4 p-2 bg-gray-50 flex items-center justify-center ${textSizeClasses[size]}`}>
            <span className="font-medium text-center text-gray-800">
              {playerName || '플레이어'}
            </span>
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-2xl mb-2">🎭</div>
            <div className={`${textSizeClasses[size]} font-medium`}>
              {playerName || '???'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleCard