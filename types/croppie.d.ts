declare module 'croppie' {
  export default class Croppie {
    constructor(element: HTMLElement, options?: Record<string, unknown>)
    bind(options: { url: string }): Promise<void>
    result(options: Record<string, unknown>): Promise<Blob>
    destroy(): void
  }
}
