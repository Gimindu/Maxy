import React from 'react'
import { X, Sparkles, Check } from 'lucide-react'
import { PetColor, AccessoryType } from '../types/pet'

export const PET_COLORS: PetColor[] = [
  { id: 'marshmallow', name: 'Marshmallow', hex: '#FFFFFF', roughness: 0.85, blushHex: '#FFAAA6' },
  { id: 'sakura', name: 'Sakura Pink', hex: '#FFCCD5', roughness: 0.8, blushHex: '#FF758F' },
  { id: 'minty', name: 'Mint Sorbet', hex: '#D8F3DC', roughness: 0.82, blushHex: '#FF9EAA' },
  { id: 'lavender', name: 'Taro Mochi', hex: '#E8D7F1', roughness: 0.85, blushHex: '#FF70A6' },
  { id: 'honey', name: 'Honey Butter', hex: '#FFE8A3', roughness: 0.78, blushHex: '#FF8FAB' },
  { id: 'sky', name: 'Sky Cotton', hex: '#CBEBFB', roughness: 0.82, blushHex: '#FFAAA6' },
  { id: 'peach', name: 'Peachy Cream', hex: '#FFD7BA', roughness: 0.85, blushHex: '#FF5964' },
]

export const ACCESSORIES: { id: AccessoryType; name: string; emoji: string }[] = [
  { id: 'none', name: 'Natural Mochi', emoji: '✨' },
  { id: 'crown', name: 'Royal Crown', emoji: '👑' },
  { id: 'bunny_ears', name: 'Bunny Ears', emoji: '🐰' },
  { id: 'chef_hat', name: 'Master Chef', emoji: '🧑‍🍳' },
  { id: 'cool_glasses', name: 'Cool Shades', emoji: '🕶️' },
  { id: 'halo', name: 'Angel Halo', emoji: '😇' },
  { id: 'flower', name: 'Sakura Petal', emoji: '🌸' },
  { id: 'sleep_hat', name: 'Cozy Nightcap', emoji: '🌙' },
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
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles className="icon-gold" size={22} />
            <h2>Maxy Wardrobe & Style</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Pet Name input */}
        <div className="modal-section">
          <label className="section-label">Pet Name</label>
          <input
            type="text"
            className="input-petname"
            value={petName}
            maxLength={18}
            onChange={(e) => onChangePetName(e.target.value)}
            placeholder="Name your pet..."
          />
        </div>

        {/* Color Palette */}
        <div className="modal-section">
          <label className="section-label">Mochi Flavor & Coat</label>
          <div className="color-grid">
            {PET_COLORS.map((color) => {
              const isSelected = selectedColor.id === color.id
              return (
                <button
                  key={color.id}
                  className={`color-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectColor(color)}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {isSelected && <Check size={16} color="#333" />}
                  <span className="color-tooltip">{color.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Accessories */}
        <div className="modal-section">
          <label className="section-label">Cute Accessories</label>
          <div className="accessory-grid">
            {ACCESSORIES.map((acc) => {
              const isSelected = selectedAccessory === acc.id
              return (
                <button
                  key={acc.id}
                  className={`acc-card ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectAccessory(acc.id)}
                >
                  <span className="acc-emoji">{acc.emoji}</span>
                  <span className="acc-name">{acc.name}</span>
                  {isSelected && <span className="acc-badge">Equipped</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
