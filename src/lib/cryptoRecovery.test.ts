import { describe, expect, it } from 'vitest'
import {
  base64ToBytes,
  bytesToBase64,
  exportRsaOaepPublicKeyToSpkiBase64,
  generateRsaOaepKeyPair,
  rsaOaepDecryptFromBase64,
  rsaOaepEncryptToBase64,
} from './crypto'

describe('browser key recovery crypto', () => {
  it('round-trips a recovery payload through an ephemeral RSA key pair', async () => {
    const keyPair = await generateRsaOaepKeyPair()
    const spkiBytes = base64ToBytes(await exportRsaOaepPublicKeyToSpkiBase64(keyPair.publicKey))
    const publicKey = await crypto.subtle.importKey(
      'spki',
      spkiBytes.buffer.slice(spkiBytes.byteOffset, spkiBytes.byteOffset + spkiBytes.byteLength) as ArrayBuffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt'],
    )
    const payload = new Uint8Array([1, 2, 3, 4])

    const encrypted = await rsaOaepEncryptToBase64(payload, publicKey)
    const decrypted = await rsaOaepDecryptFromBase64(encrypted, keyPair.privateKey)

    expect(bytesToBase64(decrypted)).toBe(bytesToBase64(payload))
  })
})
