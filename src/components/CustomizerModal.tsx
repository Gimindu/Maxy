import { useState } from 'react'
import { X, Sparkles, Check, Palette, Crown, User, Heart } from 'lucide-react'
import { PetColor, AccessoryType } from '../types/pet'
import { sound } from '../utils/audio'

export const PET_COLORS: (PetColor & { desc: string; tag: string })[] = [
  {
    id: 'marshmallow',
    name: 'Marshmallow',
    hex: '#FFFFFF',
    roughness: 0.85,
    blushHex: '#FFAAA6',
    desc: 'Pure, fluffy, and cloud-soft',
    tag: 'Classic',
  },
  {
    id: 'sakura',
    name: 'Sakura Blossom',
    hex: '#FFCCD5',
    roughness: 0.8,
    blushHex: '#FF758F',
    desc: 'Sweet floral petals and spring glow',
    tag: 'Floral',
  },
  {
    id: 'minty',
    name: 'Mint Sorbet',
    hex: '#D8F3DC',
    roughness: 0.82,
    blushHex: '#FF9EAA',
    desc: 'Crisp, cooling, and refreshing',
    tag: 'Fresh',
  },
  {
    id: 'lavender',
    name: 'Taro Boba',
    hex: '#E8D7F1',
    roughness: 0.85,
    blushHex: '#FF70A6',
    desc: 'Dreamy velvet lavender sweetness',
    tag: 'Sweet',
  },
  {
    id: 'honey',
    name: 'Honey Butter',
    hex: '#FFE8A3',
    roughness: 0.78,
    blushHex: '#FF8FAB',
    desc: 'Warm golden toasted sweetness',
    tag: 'Warm',
  },
  {
    id: 'sky',
    name: 'Sky Cotton',
    hex: '#CBEBFB',
    roughness: 0.82,
    blushHex: '#FFAAA6',
    desc: 'Airy summer breeze and puffy clouds',
    tag: 'Pastel',
  },
  {
    id: 'peach',
    name: 'Peachy Cream',
    hex: '#FFD7BA',
    roughness: 0.85,
    blushHex: '#FF5964',
    desc: 'Sun-kissed peach and soft velvet',
    tag: 'Fruity',
  },
  {
    id: 'matcha',
    name: 'Matcha Cream',
    hex: '#D6E5D8',
    roughness: 0.84,
    blushHex: '#FF9EAA',
    desc: 'Earthy green tea and tranquil serenity',
    tag: 'Earthy',
  },
  {
    id: 'twilight',
    name: 'Velvet Midnight',
    hex: '#3E3759',
    roughness: 0.82,
    blushHex: '#FF758F',
    desc: 'Mystical twilight dusk with cosmic charm',
    tag: 'Cosmic',
  },
]

export const ACCESSORIES: {
  id: AccessoryType
  name: string
  emoji: string
  category: string
  desc: string
}[] = [
  { id: 'none', name: 'Natural Mochi', emoji: '✨', category: 'Pure', desc: 'No accessories, just pure squishy cuteness' },
  { id: 'crown', name: 'Royal Crown', emoji: '👑', category: 'Royalty', desc: 'Golden imperial crown topped with glowing ruby gems' },
  { id: 'bunny_ears', name: 'Bunny Ears', emoji: '🐰', category: 'Cutie', desc: 'Soft pastel bunny ears that wiggle as you move' },
  { id: 'chef_hat', name: 'Master Chef', emoji: '🧑‍🍳', category: 'Culinary', desc: 'Puffy pastry chef hat for baking treats' },
  { id: 'cool_glasses', name: 'Cool Shades', emoji: '🕶️', category: 'Style', desc: 'Retro pixel dark sunglasses with glossy shine' },
  { id: 'halo', name: 'Angel Halo', emoji: '😇', category: 'Aura', desc: 'Floating golden angel halo with radiant warmth' },
  { id: 'flower', name: 'Sakura Petal', emoji: '🌸', category: 'Nature', desc: 'Delicate tropical cherry blossom tucked behind ear' },
  { id: 'sleep_hat', name: 'Cozy Nightcap', emoji: '🌙', category: 'Sleepwear', desc: 'Fluffy nightcap with golden crescent moon and pom-pom' },
]

interface CustomizerModalProps {
  isOpen: boolean
  onClose: () => void
  selectedColor: PetColor
  onSelectColor: (c: PetColor) => void
  selectedAccessory: AccessoryType
  onSelectAccessory: (a: AccessoryType) => void
  petName: string
  onChangePetName: (name: string) => void
}

type TabType = 'colors' | 'accessories' | 'profile'

export function CustomizerModal({
  isOpen,
  onClose,
  selectedColor,
  onSelectColor,
  selectedAccessory,
  onSelectAccessory,
  petName,
  onChangePetName,
}: CustomizerModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('colors')

  if (!isOpen) return null

  const handlePickColor = (c: PetColor) => {
    sound.playPet()
    onSelectColor(c)
  }

  const handlePickAccessory = (a: AccessoryType) => {
    sound.playPoke()
    onSelectAccessory(a)
  }

  const currentAccessoryData = ACCESSORIES.find((a) => a.id === selectedAccessory) || ACCESSORIES[0]

  return (
    <div className="wardrobe-backdrop" onClick={onClose}>
      <div className="wardrobe-modal glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="wardrobe-header">
          <div className="wardrobe-title-group">
            <div className="wardrobe-icon-badge">
              <Sparkles className="icon-sparkle" size={20} />
            </div>
            <div>
              <h2 className="wardrobe-title">Maxy's Dressing Studio</h2>
              <p className="wardrobe-subtitle">Customize coat flavors, accessories & profile</p>
            </div>
          </div>
          <button className="wardrobe-close-btn" onClick={onClose} aria-label="Close wardrobe">
            <X size={20} />
          </button>
        </div>

        {/* Live Mini Preview Banner */}
        <div className="wardrobe-preview-banner">
          <div className="preview-avatar-wrapper" style={{ backgroundColor: selectedColor.hex }}>
            <span className="preview-accessory-emoji">{currentAccessoryData.emoji}</span>
            <div className="preview-face-dots">
              <span className="p-eye" />
              <span className="p-mouth" />
              <span className="p-eye" />
            </div>
          </div>
          <div className="preview-details">
            <div className="preview-name-row">
              <span className="preview-pet-name">{petName || 'Maxy'}</span>
              <span className="preview-flavor-badge" style={{ borderColor: selectedColor.blushHex }}>
                {selectedColor.name}
              </span>
            </div>
            <p className="preview-tagline">
              Wearing: <strong>{currentAccessoryData.name}</strong>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="wardrobe-tabs">
          <button
            className={`wardrobe-tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            <Palette size={16} />
            <span>Mochi Coat</span>
          </button>
          <button
            className={`wardrobe-tab-btn ${activeTab === 'accessories' ? 'active' : ''}`}
            onClick={() => setActiveTab('accessories')}
          >
            <Crown size={16} />
            <span>Accessories</span>
          </button>
          <button
            className={`wardrobe-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            <span>Profile</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="wardrobe-body">
          {/* COLORS TAB */}
          {activeTab === 'colors' && (
            <div className="tab-pane">
              <div className="flavors-grid">
                {PET_COLORS.map((col) => {
                  const isSelected = selectedColor.id === col.id
                  return (
                    <button
                      key={col.id}
                      className={`flavor-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handlePickColor(col)}
                    >
                      <div className="flavor-swatch-wrapper">
                        <div
                          className="flavor-swatch-circle"
                          style={{
                            backgroundColor: col.hex,
                            boxShadow: `0 6px 16px ${col.hex}66`,
                          }}
                        >
                          {isSelected && <Check size={16} className="check-icon" />}
                        </div>
                        <span className="flavor-tag">{col.tag}</span>
                      </div>
                      <div className="flavor-text-info">
                        <span className="flavor-name">{col.name}</span>
                        <span className="flavor-desc">{col.desc}</span>
                      </div>
                      {isSelected && (
                        <span className="equipped-pill">
                          <Heart size={11} fill="currentColor" /> Active
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ACCESSORIES TAB */}
          {activeTab === 'accessories' && (
            <div className="tab-pane">
              <div className="accessories-showcase-grid">
                {ACCESSORIES.map((acc) => {
                  const isSelected = selectedAccessory === acc.id
                  return (
                    <button
                      key={acc.id}
                      className={`accessory-showcase-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handlePickAccessory(acc.id)}
                    >
                      <div className="acc-icon-box">
                        <span className="acc-emoji-large">{acc.emoji}</span>
                      </div>
                      <div className="acc-info-box">
                        <div className="acc-title-line">
                          <span className="acc-title">{acc.name}</span>
                          <span className="acc-category-pill">{acc.category}</span>
                        </div>
                        <span className="acc-desc">{acc.desc}</span>
                      </div>
                      {isSelected && (
                        <div className="acc-selected-mark">
                          <Check size={14} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="tab-pane profile-pane">
              <div className="profile-group">
                <label className="profile-label">Pet Name</label>
                <div className="profile-input-wrapper">
                  <span className="input-icon">🐾</span>
                  <input
                    type="text"
                    className="profile-input"
                    value={petName}
                    maxLength={16}
                    onChange={(e) => onChangePetName(e.target.value)}
                    placeholder="Enter pet name..."
                  />
                </div>
                <span className="profile-hint">
                  This name will appear on Maxy's identity badge and speech bubbles.
                </span>
              </div>

              <div className="profile-group">
                <label className="profile-label">Quick Name Ideas</label>
                <div className="quick-names-row">
                  {['Maxy', 'Mochi', 'Boba', 'Puff', 'Buttercup', 'Yuki', 'Koko'].map((name) => (
                    <button
                      key={name}
                      className="quick-name-chip"
                      onClick={() => {
                        sound.playPoke()
                        onChangePetName(name)
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="wardrobe-footer">
          <button className="wardrobe-done-btn" onClick={onClose}>
            <span>Done Styling</span>
            <Sparkles size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
