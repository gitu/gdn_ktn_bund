import { describe, expect, it } from 'vitest'
import { EntitySemanticMapper } from '../EntitySemanticMapper'

describe('EntitySemanticMapper display names', () => {
  it('names all municipalities of a canton in the reader language, not in English', () => {
    expect(EntitySemanticMapper.getEntityDisplayName('gdn_zh').de).toBe(
      'Alle Gemeinden des Kantons Zürich',
    )
    expect(EntitySemanticMapper.getEntityDisplayName('gdn_bl').de).toBe(
      'Alle Gemeinden des Kantons Basel-Landschaft',
    )
    expect(EntitySemanticMapper.getEntityDisplayName('gdn_ge').de).toBe(
      'Alle Gemeinden des Kantons Genf',
    )
    expect(EntitySemanticMapper.getEntityDisplayName('gdn_ge').en).toBe(
      'All Municipalities of Canton Geneva',
    )
  })

  it('uses the German canton name for every canton in the German label', () => {
    for (const code of EntitySemanticMapper.getCantonCodes()) {
      const german = EntitySemanticMapper.getEntityDisplayName(`gdn_${code}`).de
      const canton = EntitySemanticMapper.getEntityDisplayName(`ktn_${code}`).de
      expect(
        german.endsWith(canton.replace(/^Kanton /, '')),
        `${code}: ${german} / ${canton}`,
      ).toBe(true)
      // "Kanton Zürich inklusive allen Gemeinden", not "Kanton Zurich …"
      expect(EntitySemanticMapper.getEntityDisplayName(`ktn_gdn_${code}`).de).toBe(
        `${canton} inklusive allen Gemeinden`,
      )
    }
  })

  it('knows what a canton-specific code is', () => {
    expect(EntitySemanticMapper.isCantonSpecific('ktn_gdn_ag')).toBe(true)
    expect(EntitySemanticMapper.isCantonSpecific('bund')).toBe(false)
    expect(EntitySemanticMapper.getCantonCodeFromEntity('ktn_gdn_ag')).toBe('ag')
  })

  describe('calculated rest of a canton', () => {
    it('recognises gdn_<canton>_rest and nothing else', () => {
      expect(EntitySemanticMapper.isRestOfCanton('gdn_zh_rest')).toBe(true)
      expect(EntitySemanticMapper.isRestOfCanton('GDN_AG_REST')).toBe(true)
      expect(EntitySemanticMapper.isRestOfCanton('gdn_zh')).toBe(false)
      expect(EntitySemanticMapper.isRestOfCanton('gdn_xx_rest')).toBe(false)
      expect(EntitySemanticMapper.isRestOfCanton('ktn_gdn_zh')).toBe(false)
    })

    it('belongs to its canton (the scaling and the facts look the canton up)', () => {
      expect(EntitySemanticMapper.isCantonSpecific('gdn_zh_rest')).toBe(true)
      expect(EntitySemanticMapper.getCantonCodeFromEntity('gdn_zh_rest')).toBe('zh')
    })

    it('is labelled as calculated in every language', () => {
      expect(EntitySemanticMapper.getEntityDisplayName('gdn_zh_rest')).toEqual({
        de: 'Übrige Gemeinden ZH (berechnet)',
        fr: 'Autres communes ZH (calculé)',
        it: 'Altri comuni ZH (calcolato)',
        en: 'Other municipalities ZH (calculated)',
      })
      const description = EntitySemanticMapper.getEntityDescription('gdn_zh_rest')
      expect(description.de).toContain('Kantons Zürich')
      for (const language of ['de', 'fr', 'it', 'en'] as const) {
        expect(description[language].length).toBeGreaterThan(40)
      }
    })
  })
})
