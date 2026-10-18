import React from 'react'
import {
  Heart,
  Utensils,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Palette,
  RotateCcw,
  HandMetal,
  Smile,
} from 'lucide-react'
import { PetStats, PetMood } from '../types/pet'

interface UIOverlayProps {
  petName: string
  stats: PetStats
  mood: PetMood
  isNightMode: boolean
  isMuted: boolean
  statusMessage: string
  isSleeping: boolean
  onToggleSound: () => void
  onToggleNightMode: () => void
  onOpenCustomizer: () => void
  onFeed: () => void
  onPet: () => void
  onPlay: () => void
  onWash: () => void
  onSleep: () => void
  onResetStats: () => void
}

export function UIOverlay({
  petName,
  stats,
  mood,
  isNightMode,
  isMuted,
  statusMessage,
  isSleeping,
  onToggleSound,
  onToggleNightMode,
  onOpenCustomizer,
  onFeed,
  onPet,
  onPlay,
  onWash,
  onSleep,
  onResetStats,
}: UIOverlayProps) {
  // Format percentage nicely
  const clamp = (val: number) => Math.max(0, Math.min(100, Math.round(val)))

  return (
    <div className="ui-overlay">
      {/* Top Navigation Bar */}
      <header className="top-bar">
        <div className="pet-identity glass-card">
          <div className="pet-name-row">
            <span className="pet-avatar-badge">🐾</span>
            <div className="pet-name-info">
              <h1 className="pet-title">{petName}</h1>
              <div className="pet-level-badge">
                Lv. {stats.level} • XP {stats.xp}%
              </div>
            </div>
          </div>
          <div className="xp-bar-bg">
            <div className="xp-bar-fill" style={{ width: `${stats.xp}%` }} />
          </div>
        </div>

        {/* Quick controls */}
        <div className="quick-actions">
          <button
            className="action-icon-btn glass-btn"
            onClick={onToggleSound}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>

          <button
            className="action-icon-btn glass-btn"
            onClick={onToggleNightMode}
            aria-label="Toggle day/night ambient"
            title="Toggle day/night ambient"
          >
            {isNightMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <button
            className="action-icon-btn glass-btn"
            onClick={onOpenCustomizer}
            aria-label="Wardrobe & Colors"
            title="Wardrobe & Colors"
          >
            <Palette size={19} />
          </button>

          <button
            className="action-icon-btn glass-btn"
            onClick={onResetStats}
            aria-label="Reset Pet Stats"
            title="Reset Pet Stats"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* Status Meters Card */}
      <div className="stats-container glass-card">
        {/* Happiness */}
        <div className="stat-row">
          <div className="stat-label">
            <Heart size={15} className="stat-icon heart-color" />
            <span>Happiness</span>
          </div>
          <div className="stat-bar-track">
            <div
              className="stat-bar-progress heart-progress"
              style={{ width: `${clamp(stats.happiness)}%` }}
            />
          </div>
          <span className="stat-value">{clamp(stats.happiness)}%</span>
        </div>

        {/* Fullness / Hunger */}
        <div className="stat-row">
          <div className="stat-label">
            <Utensils size={15} className="stat-icon food-color" />
            <span>Fullness</span>
          </div>
          <div className="stat-bar-track">
            <div
              className="stat-bar-progress food-progress"
              style={{ width: `${clamp(stats.hunger)}%` }}
            />
          </div>
          <span className="stat-value">{clamp(stats.hunger)}%</span>
        </div>

        {/* Energy */}
        <div className="stat-row">
          <div className="stat-label">
            <Zap size={15} className="stat-icon energy-color" />
            <span>Energy</span>
          </div>
          <div className="stat-bar-track">
            <div
              className="stat-bar-progress energy-progress"
              style={{ width: `${clamp(stats.energy)}%` }}
            />
          </div>
          <span className="stat-value">{clamp(stats.energy)}%</span>
        </div>

        {/* Cleanliness */}
        <div className="stat-row">
          <div className="stat-label">
            <Sparkles size={15} className="stat-icon clean-color" />
            <span>Hygiene</span>
          </div>
          <div className="stat-bar-track">
            <div
              className="stat-bar-progress clean-progress"
              style={{ width: `${clamp(stats.cleanliness)}%` }}
            />
          </div>
          <span className="stat-value">{clamp(stats.cleanliness)}%</span>
        </div>
      </div>

      {/* Floating Status Message / Speech Bubble */}
      {statusMessage && (
        <div className="speech-bubble-container">
          <div className="speech-bubble glass-card">
            <span className="speech-dot" />
            <span className="speech-text">{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Mobile-friendly hints banner */}
      <div className="interaction-hint">
        <span className="hint-pill">
          💡 Tap to squish & poke • Drag across Maxy to pet!
        </span>
      </div>

      {/* Bottom Action Dock */}
      <nav className="action-dock glass-card">
        <button
          className="dock-btn feed-btn"
          onClick={onFeed}
          disabled={isSleeping}
          aria-label="Feed pet treats"
        >
          <div className="dock-icon-wrapper">
            <span className="dock-emoji">🍓</span>
          </div>
          <span className="dock-label">Feed</span>
        </button>

        <button
          className="dock-btn pet-btn"
          onClick={onPet}
          aria-label="Pet and give love"
        >
          <div className="dock-icon-wrapper">
            <span className="dock-emoji">💖</span>
          </div>
          <span className="dock-label">Pet</span>
        </button>

        <button
          className="dock-btn play-btn"
          onClick={onPlay}
          disabled={isSleeping}
          aria-label="Play with ball"
        >
          <div className="dock-icon-wrapper">
            <span className="dock-emoji">🎾</span>
          </div>
          <span className="dock-label">Play</span>
        </button>

        <button
          className="dock-btn wash-btn"
          onClick={onWash}
          disabled={isSleeping}
          aria-label="Clean and wash pet"
        >
          <div className="dock-icon-wrapper">
            <span className="dock-emoji">🧼</span>
          </div>
          <span className="dock-label">Wash</span>
        </button>

        <button
          className={`dock-btn sleep-btn ${isSleeping ? 'active-sleep' : stats.energy < 30 ? 'needs-sleep' : ''}`}
          onClick={onSleep}
          aria-label={isSleeping ? 'Wake up pet' : 'Put pet to sleep'}
        >
          <div className="dock-icon-wrapper">
            <span className="dock-emoji">{isSleeping ? '☀️' : stats.energy < 30 ? '🥱' : '💤'}</span>
          </div>
          <span className="dock-label">{isSleeping ? 'Wake' : 'Sleep'}</span>
        </button>
      </nav>
    </div>
  )
}
