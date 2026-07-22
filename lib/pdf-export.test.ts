import { describe, expect, it } from 'vitest'
import { escapeHTML } from './pdf-export'

describe('PDF export escaping', () => {
  it('neutralizes user-entered HTML and attributes', () => {
    expect(escapeHTML(`<img src=x onerror="alert('x')">`)).toBe('&lt;img src=x onerror=&quot;alert(&#039;x&#039;)&quot;&gt;')
  })
})
