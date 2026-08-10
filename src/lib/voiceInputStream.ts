export const VOICE_SAMPLE_RATE = 16_000
export const VOICE_CHANNELS = 1
export const VOICE_FORMAT = 'pcm_s16le'

export type VoiceStreamEvent =
  | { type: 'ready'; modelId?: string; sampleRate?: number; channels?: number; format?: string }
  | { type: 'partial'; text: string; sentenceId?: number }
  | { type: 'final'; text: string; sentenceId?: number }
  | { type: 'completed'; transcript: string }
  | { type: 'cancelled' }
  | { type: 'pong' }
  | { type: 'error'; code?: string; message?: string }

interface VoiceInputStreamOptions {
  token: string
  onEvent?: (event: VoiceStreamEvent) => void
  onError?: (error: Error) => void
}

const PROCESSOR_NAME = 'yusi-pcm-capture'
const SOCKET_TIMEOUT_MS = 12_000

const WORKLET_SOURCE = `
class YusiPcmCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.targetSampleRate = options.processorOptions.targetSampleRate
    this.sourceSampleRate = sampleRate
    this.step = this.sourceSampleRate / this.targetSampleRate
    this.sourceSamples = []
    this.sourceOffset = 0
    this.packet = []
    this.packetSize = Math.round(this.targetSampleRate * 0.02)
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (!channel || channel.length === 0) return true

    for (let index = 0; index < channel.length; index += 1) {
      this.sourceSamples.push(channel[index])
    }

    while (this.sourceOffset + 1 < this.sourceSamples.length) {
      const base = Math.floor(this.sourceOffset)
      const fraction = this.sourceOffset - base
      const sample = this.sourceSamples[base] +
        (this.sourceSamples[base + 1] - this.sourceSamples[base]) * fraction
      const clamped = Math.max(-1, Math.min(1, sample))
      this.packet.push(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff)
      this.sourceOffset += this.step

      if (this.packet.length >= this.packetSize) {
        const pcm = new Int16Array(this.packet.length)
        for (let sampleIndex = 0; sampleIndex < this.packet.length; sampleIndex += 1) {
          pcm[sampleIndex] = Math.round(this.packet[sampleIndex])
        }
        this.port.postMessage(pcm.buffer, [pcm.buffer])
        this.packet = []
      }
    }

    const consumed = Math.floor(this.sourceOffset)
    if (consumed > 0) {
      this.sourceSamples = this.sourceSamples.slice(consumed)
      this.sourceOffset -= consumed
    }
    return true
  }
}

registerProcessor('${PROCESSOR_NAME}', YusiPcmCaptureProcessor)
`

export class VoiceInputStream {
  private readonly options: VoiceInputStreamOptions
  private socket: WebSocket | null = null
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private processorNode: AudioWorkletNode | null = null
  private muteGain: GainNode | null = null
  private readyPromise: Promise<void> | null = null
  private readyResolve: (() => void) | null = null
  private readyReject: ((error: Error) => void) | null = null
  private completionPromise: Promise<string> | null = null
  private completionResolve: ((transcript: string) => void) | null = null
  private completionReject: ((error: Error) => void) | null = null
  private cleanupStarted = false

  public constructor(options: VoiceInputStreamOptions) {
    this.options = options
  }

  public async start(): Promise<void> {
    if (this.socket) {
      throw new Error('Voice input is already active')
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not support microphone input')
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: { ideal: VOICE_CHANNELS },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    try {
      this.audioContext = new AudioContext({ sampleRate: VOICE_SAMPLE_RATE })
      if (!this.audioContext.audioWorklet) {
        throw new Error('This browser does not support real-time audio capture')
      }
      const moduleUrl = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: 'application/javascript' }))
      try {
        await this.audioContext.audioWorklet.addModule(moduleUrl)
      } finally {
        URL.revokeObjectURL(moduleUrl)
      }

      const socket = new WebSocket(this.socketUrl())
      socket.binaryType = 'arraybuffer'
      this.socket = socket
      this.installSocketHandlers(socket)
      await this.waitForSocketOpen(socket)

      this.readyPromise = new Promise<void>((resolve, reject) => {
        this.readyResolve = resolve
        this.readyReject = reject
      })
      socket.send(JSON.stringify({
        type: 'start',
        authorization: `Bearer ${this.options.token}`,
        format: VOICE_FORMAT,
        sampleRate: VOICE_SAMPLE_RATE,
        channels: VOICE_CHANNELS,
      }))
      await this.readyPromise
      await this.audioContext.resume()
      this.connectCaptureGraph()
    } catch (error) {
      this.cleanup()
      throw error
    }
  }

  public async stop(): Promise<string> {
    const socket = this.socket
    if (!socket) return ''
    if (this.completionPromise) return this.completionPromise

    this.stopCapture()
    this.completionPromise = new Promise<string>((resolve, reject) => {
      this.completionResolve = resolve
      this.completionReject = reject
    })
    if (socket.readyState !== WebSocket.OPEN) {
      const error = new Error('Voice input connection is no longer open')
      this.completionReject?.(error)
      this.cleanup()
      throw error
    }
    socket.send(JSON.stringify({ type: 'finish' }))
    return this.completionPromise
  }

  public cancel(): void {
    this.stopCapture()
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'cancel' }))
    }
    this.cleanup()
  }

  private socketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws-diary-voice`
  }

  private installSocketHandlers(socket: WebSocket): void {
    socket.onmessage = (message) => {
      if (typeof message.data !== 'string') return
      let event: VoiceStreamEvent
      try {
        event = JSON.parse(message.data) as VoiceStreamEvent
      } catch {
        this.notifyError(new Error('Invalid voice input response'))
        return
      }
      this.options.onEvent?.(event)
      if (event.type === 'ready') {
        this.readyResolve?.()
        this.readyResolve = null
        this.readyReject = null
        return
      }
      if (event.type === 'completed') {
        this.completionResolve?.(event.transcript)
        this.completionResolve = null
        this.completionReject = null
        this.cleanup()
        return
      }
      if (event.type === 'error') {
        const error = new Error(event.message || 'Voice input failed')
        this.readyReject?.(error)
        this.completionReject?.(error)
        this.readyResolve = null
        this.readyReject = null
        this.completionResolve = null
        this.completionReject = null
        this.notifyError(error)
        this.cleanup()
      }
    }
    socket.onclose = () => {
      if (this.cleanupStarted) return
      if (this.completionResolve || this.readyResolve) {
        const error = new Error('Voice input connection closed unexpectedly')
        this.readyReject?.(error)
        this.completionReject?.(error)
        this.readyResolve = null
        this.readyReject = null
        this.completionResolve = null
        this.completionReject = null
        this.notifyError(error)
      } else {
        this.notifyError(new Error('Voice input connection closed unexpectedly'))
      }
      this.cleanup()
    }
    socket.onerror = () => {
      if (this.readyReject || this.completionReject) {
        this.notifyError(new Error('Voice input connection failed'))
      }
    }
  }

  private waitForSocketOpen(socket: WebSocket): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('Voice input connection timed out'))
        socket.close()
      }, SOCKET_TIMEOUT_MS)
      socket.addEventListener('open', () => {
        window.clearTimeout(timeout)
        resolve()
      }, { once: true })
      socket.addEventListener('error', () => {
        window.clearTimeout(timeout)
        reject(new Error('Voice input connection failed'))
      }, { once: true })
      socket.addEventListener('close', () => {
        window.clearTimeout(timeout)
        reject(new Error('Voice input connection closed'))
      }, { once: true })
    })
  }

  private connectCaptureGraph(): void {
    if (!this.audioContext || !this.mediaStream || !this.socket) {
      throw new Error('Voice input audio graph is not ready')
    }
    const sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
    const processorNode = new AudioWorkletNode(this.audioContext, PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: VOICE_CHANNELS,
      channelCountMode: 'explicit',
      processorOptions: { targetSampleRate: VOICE_SAMPLE_RATE },
    })
    const muteGain = this.audioContext.createGain()
    muteGain.gain.value = 0
    processorNode.port.onmessage = (message: MessageEvent<ArrayBuffer>) => {
      if (this.socket?.readyState === WebSocket.OPEN && message.data.byteLength > 0) {
        this.socket.send(message.data)
      }
    }
    sourceNode.connect(processorNode)
    processorNode.connect(muteGain)
    muteGain.connect(this.audioContext.destination)
    this.sourceNode = sourceNode
    this.processorNode = processorNode
    this.muteGain = muteGain
  }

  private stopCapture(): void {
    this.sourceNode?.disconnect()
    this.processorNode?.disconnect()
    this.muteGain?.disconnect()
    this.sourceNode = null
    this.processorNode = null
    this.muteGain = null
    this.mediaStream?.getTracks().forEach((track) => track.stop())
    this.mediaStream = null
  }

  private cleanup(): void {
    if (this.cleanupStarted) return
    this.cleanupStarted = true
    this.stopCapture()
    const context = this.audioContext
    this.audioContext = null
    if (context) void context.close().catch(() => undefined)
    const socket = this.socket
    this.socket = null
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'voice input finished')
    }
  }

  private notifyError(error: Error): void {
    this.options.onError?.(error)
  }
}
