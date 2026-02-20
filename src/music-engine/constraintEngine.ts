/**
 * Constraint Engine
 *
 * Combines the tonal field, harmonic gravity, phrase memory, and voice relations
 * into a unified pipeline:
 *
 *   position → tonal context → candidate notes → rules → scheduled music
 *
 * This replaces the direct input → note → play architecture.
 */

import { getCandidateNotes, type TonalFieldConfig, DEFAULT_TONAL_FIELD_CONFIG } from './tonalField'
import { applyGravity, type GravityConfig, DEFAULT_GRAVITY_CONFIG } from './harmonicGravity'
import { deriveAllVoices, type VoiceRelation } from './voiceRelations'
import { PhraseMemory, type PhraseMemoryConfig, DEFAULT_PHRASE_CONFIG } from './phraseMemory'

export interface ConstraintEngineConfig {
  tonalField: TonalFieldConfig
  gravity: GravityConfig
  phrase: PhraseMemoryConfig
  voiceRelations: VoiceRelation[]
  enabled: boolean // master toggle for the constraint engine
}

export const DEFAULT_CONSTRAINT_CONFIG: ConstraintEngineConfig = {
  tonalField: DEFAULT_TONAL_FIELD_CONFIG,
  gravity: DEFAULT_GRAVITY_CONFIG,
  phrase: DEFAULT_PHRASE_CONFIG,
  voiceRelations: [],
  enabled: false,
}

export interface EngineOutput {
  primaryNote: number
  primaryVelocity: number
  secondaryNotes: number[]
  candidates: number[]
  varied: boolean
}

/**
 * The ConstraintEngine is the central music logic:
 * given a position, it computes what notes should play.
 */
export class ConstraintEngine {
  private config: ConstraintEngineConfig
  private phraseMemory: PhraseMemory
  private previousPrimaryNote: number | null = null

  constructor(config: Partial<ConstraintEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONSTRAINT_CONFIG, ...config }
    this.phraseMemory = new PhraseMemory(this.config.phrase)
  }

  /**
   * Process a cursor position through the full pipeline.
   *
   * @param nx - Normalized x position [0, 1]
   * @param ny - Normalized y position [0, 1]
   * @param velocity - Note velocity (0–127)
   * @param rand - Random value for deterministic selection
   * @param timestamp - Current time for phrase recording
   */
  process(
    nx: number,
    ny: number,
    velocity: number = 100,
    rand: number = Math.random(),
    timestamp: number = Date.now()
  ): EngineOutput {
    // Step 1: Get candidate notes from tonal field
    const candidates = getCandidateNotes(nx, ny, this.config.tonalField)

    // Step 2: Apply harmonic gravity to select primary note
    let primaryNote = applyGravity(candidates, this.config.gravity, rand)

    // Step 3: Apply phrase variation if gesture is too similar
    const currentPattern = this.phraseMemory.getIntervalPattern()
    let varied = false
    if (currentPattern.length > 2) {
      // Build what pattern would look like with this new note
      const lastNote = this.phraseMemory.getLastNote()
      if (lastNote !== null) {
        const hypotheticalInterval = primaryNote - lastNote
        const testPattern = [...currentPattern.slice(1), hypotheticalInterval]
        if (this.phraseMemory.checkAndEvolve(testPattern)) {
          primaryNote = this.phraseMemory.applyVariation(primaryNote, rand)
          primaryNote = Math.max(0, Math.min(127, primaryNote))
          varied = true
        }
      }
    }

    // Step 4: Record to phrase memory
    this.phraseMemory.record(primaryNote, velocity, timestamp)

    // Step 5: Derive secondary voices
    const secondaryNotes = deriveAllVoices(
      primaryNote,
      this.previousPrimaryNote,
      this.config.voiceRelations
    )

    this.previousPrimaryNote = primaryNote

    return {
      primaryNote,
      primaryVelocity: velocity,
      secondaryNotes,
      candidates,
      varied,
    }
  }

  /**
   * Update configuration at runtime.
   */
  updateConfig(partial: Partial<ConstraintEngineConfig>): void {
    this.config = { ...this.config, ...partial }
  }

  /**
   * Get the current configuration.
   */
  getConfig(): ConstraintEngineConfig {
    return { ...this.config }
  }

  /**
   * Get phrase memory for external inspection.
   */
  getPhraseMemory(): PhraseMemory {
    return this.phraseMemory
  }

  /**
   * Reset all internal state.
   */
  reset(): void {
    this.phraseMemory.clear()
    this.previousPrimaryNote = null
  }
}
