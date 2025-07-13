import React, { useState, useEffect } from 'react'

interface TTSSettingsProps {
  onClose: () => void
}

export const TTSSettings: React.FC<TTSSettingsProps> = ({ onClose }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [rate, setRate] = useState(0.9)
  const [pitch, setPitch] = useState(1.0)
  const [volume, setVolume] = useState(0.9)

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      const koreanVoices = availableVoices.filter(voice => voice.lang.includes('ko'))
      setVoices(koreanVoices)
      
      // 저장된 설정 불러오기
      const savedVoice = localStorage.getItem('tts-voice')
      const savedRate = localStorage.getItem('tts-rate')
      const savedPitch = localStorage.getItem('tts-pitch')
      const savedVolume = localStorage.getItem('tts-volume')
      
      if (savedVoice) setSelectedVoice(savedVoice)
      if (savedRate) setRate(parseFloat(savedRate))
      if (savedPitch) setPitch(parseFloat(savedPitch))
      if (savedVolume) setVolume(parseFloat(savedVolume))
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  const testVoice = () => {
    const utterance = new SpeechSynthesisUtterance('안녕하세요. 마피아 게임에 오신 것을 환영합니다.')
    utterance.lang = 'ko-KR'
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume
    
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice)
      if (voice) utterance.voice = voice
    }
    
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const saveSettings = () => {
    localStorage.setItem('tts-voice', selectedVoice)
    localStorage.setItem('tts-rate', rate.toString())
    localStorage.setItem('tts-pitch', pitch.toString())
    localStorage.setItem('tts-volume', volume.toString())
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-white">🔊 음성 설정</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">음성 선택</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded"
            >
              <option value="">기본 음성</option>
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} {voice.localService ? '(로컬)' : '(온라인)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              속도: {rate.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              음높이: {pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              볼륨: {volume.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={testVoice}
            className="w-full p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            🔊 테스트
          </button>

          <div className="flex space-x-2">
            <button
              onClick={saveSettings}
              className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              저장
            </button>
            <button
              onClick={onClose}
              className="flex-1 p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              취소
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          💡 팁: 더 자연스러운 음성을 위해 Chrome 브라우저에서 
          'Google 한국어' 또는 'Microsoft Heami' 음성을 사용해보세요.
        </div>
      </div>
    </div>
  )
}