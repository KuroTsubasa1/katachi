// Photography and Videography Utility Functions
import ExifReader from 'exifreader'
import * as SunCalc from 'suncalc'

// ==================== IMAGE PROCESSING UTILITIES ====================

/**
 * Extract dominant colors from an image
 */
export const extractColorsFromImage = async (
  imageUrl: string,
  count: number = 5
): Promise<{ hex: string; rgb: string; percentage: number }[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Scale down for performance
      const maxSize = 200
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      const colorMap = new Map<string, number>()

      // Sample every 5th pixel for performance
      for (let i = 0; i < pixels.length; i += 20) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const a = pixels[i + 3]

        // Skip transparent pixels
        if (a < 128) continue

        // Quantize colors to reduce variations
        const qR = Math.round(r / 32) * 32
        const qG = Math.round(g / 32) * 32
        const qB = Math.round(b / 32) * 32
        const key = `${qR},${qG},${qB}`

        colorMap.set(key, (colorMap.get(key) || 0) + 1)
      }

      // Sort by frequency and get top colors
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)

      const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0)

      const colors = sortedColors.map(([rgb, pixelCount]) => {
        const [r, g, b] = rgb.split(',').map(Number)
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        const percentage = Math.round((pixelCount / totalPixels) * 100)

        return {
          hex,
          rgb: `rgb(${r}, ${g}, ${b})`,
          percentage
        }
      })

      resolve(colors)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

/**
 * Extract EXIF data from an image
 */
export const extractExifData = async (imageUrl: string): Promise<{
  camera: string
  lens: string
  focalLength: string
  aperture: string
  shutterSpeed: string
  iso: string
  exposureCompensation: string
  whiteBalance: string
  flashUsed: boolean
  dateTaken: string
  gpsLocation?: { lat: number; lng: number }
} | null> => {
  try {
    // For base64 images
    const base64Match = imageUrl.match(/^data:image\/\w+;base64,(.+)$/)
    if (!base64Match) {
      return null
    }

    const base64Data = base64Match[1]
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const tags = ExifReader.load(bytes.buffer)

    return {
      camera: tags['Model']?.description || 'Unknown',
      lens: tags['LensModel']?.description || 'Unknown',
      focalLength: tags['FocalLength']?.description || 'Unknown',
      aperture: tags['FNumber']?.description || tags['ApertureValue']?.description || 'Unknown',
      shutterSpeed: tags['ExposureTime']?.description || 'Unknown',
      iso: tags['ISOSpeedRatings']?.description || 'Unknown',
      exposureCompensation: tags['ExposureCompensation']?.description || '0',
      whiteBalance: tags['WhiteBalance']?.description || 'Auto',
      flashUsed: tags['Flash']?.description?.toLowerCase().includes('fired') || false,
      dateTaken: tags['DateTime']?.description || 'Unknown',
      gpsLocation: tags['GPSLatitude'] && tags['GPSLongitude'] ? {
        lat: tags['GPSLatitude'].description,
        lng: tags['GPSLongitude'].description
      } : undefined
    }
  } catch (error) {
    console.error('EXIF extraction error:', error)
    return null
  }
}

/**
 * Resize image maintaining aspect ratio
 */
export const resizeImage = (
  imageUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

// ==================== CALCULATOR UTILITIES ====================

/**
 * Calculate depth of field
 */
export const calculateDepthOfField = (
  focalLength: number, // mm
  aperture: number, // f-stop
  subjectDistance: number, // meters
  sensorSize: 'full-frame' | 'aps-c' | 'micro-four-thirds' | 'medium-format'
): { near: number; far: number; total: number; hyperFocal: number } => {
  // Circle of confusion based on sensor size
  const cocMap = {
    'full-frame': 0.029,
    'aps-c': 0.019,
    'micro-four-thirds': 0.015,
    'medium-format': 0.045
  }
  const coc = cocMap[sensorSize]

  // Convert to meters
  const f = focalLength / 1000
  const s = subjectDistance

  // Hyperfocal distance
  const H = (f * f) / (aperture * coc) + f

  // Near and far focus limits
  const near = (s * (H - f)) / (H + s - 2 * f)
  const far = s >= H ? Infinity : (s * (H - f)) / (H - s)

  const total = far === Infinity ? Infinity : far - near

  return {
    near: Math.max(0, near),
    far,
    total,
    hyperFocal: H
  }
}

/**
 * Calculate timelapse parameters
 */
export const calculateTimeLapse = (
  eventDuration: number, // minutes
  clipLength: number, // seconds
  fps: number
): { interval: number; frames: number; fileSize: number } => {
  const eventDurationSeconds = eventDuration * 60
  const totalFrames = clipLength * fps
  const interval = eventDurationSeconds / totalFrames

  // Estimate file size (rough estimate: 1MB per 100 frames for 1080p)
  const estimatedFileSize = (totalFrames / 100) * 1

  return {
    interval: Math.round(interval * 10) / 10, // Round to 1 decimal
    frames: totalFrames,
    fileSize: Math.round(estimatedFileSize * 10) / 10
  }
}

/**
 * Calculate golden hour and blue hour times
 */
export const calculateGoldenHour = (
  latitude: number,
  longitude: number,
  date: Date
): {
  sunrise: string
  sunset: string
  goldenHourMorning: { start: string; end: string }
  goldenHourEvening: { start: string; end: string }
  blueHour: { start: string; end: string }
} => {
  const times = SunCalc.getTimes(date, latitude, longitude)

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return {
    sunrise: formatTime(times.sunrise),
    sunset: formatTime(times.sunset),
    goldenHourMorning: {
      start: formatTime(times.goldenHour),
      end: formatTime(times.sunriseEnd)
    },
    goldenHourEvening: {
      start: formatTime(times.goldenHourEnd),
      end: formatTime(times.sunset)
    },
    blueHour: {
      start: formatTime(times.dusk),
      end: formatTime(times.night)
    }
  }
}

// ==================== FORMAT UTILITIES ====================

/**
 * Convert seconds to HH:MM:SS:FF timecode
 */
export const formatTimecode = (seconds: number, fps: number = 24): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * fps)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
}

/**
 * Convert HH:MM:SS:FF timecode to seconds
 */
export const parseTimecode = (timecode: string, fps: number = 24): number => {
  const parts = timecode.split(':').map(Number)
  if (parts.length !== 4) return 0

  const [hours, minutes, seconds, frames] = parts
  return hours * 3600 + minutes * 60 + seconds + frames / fps
}

/**
 * Format file size in bytes to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * Format currency with locale support
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

// ==================== VALIDATION UTILITIES ====================

/**
 * Validate aspect ratio values
 */
export const validateAspectRatio = (width: number, height: number): boolean => {
  return width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height)
}

/**
 * Validate timecode format (HH:MM:SS:FF)
 */
export const validateTimecode = (timecode: string): boolean => {
  const pattern = /^([0-9]{2}):([0-5][0-9]):([0-5][0-9]):([0-9]{2})$/
  return pattern.test(timecode)
}

// ==================== ICON/SVG UTILITIES ====================

/**
 * Get SVG string for lighting icon
 */
export const getLightingIcon = (type: string, color: string = '#FFA500'): string => {
  const icons: { [key: string]: string } = {
    key: `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="${color}"/><path d="M20 4 L20 12 M20 28 L20 36 M4 20 L12 20 M28 20 L36 20 M8 8 L14 14 M26 26 L32 32 M8 32 L14 26 M26 14 L32 8" stroke="${color}" stroke-width="2"/></svg>`,
    fill: `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="10" fill="none" stroke="${color}" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="${color}" opacity="0.5"/></svg>`,
    back: `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="${color}"/><circle cx="20" cy="20" r="12" fill="none" stroke="${color}" stroke-width="1" opacity="0.5"/></svg>`,
    rim: `<svg width="40" height="40" viewBox="0 0 40 40"><path d="M20 8 A12 12 0 0 1 20 32" fill="none" stroke="${color}" stroke-width="3"/></svg>`,
    hair: `<svg width="40" height="40" viewBox="0 0 40 40"><path d="M15 10 L25 10 L20 20 Z" fill="${color}"/></svg>`,
    background: `<svg width="40" height="40" viewBox="0 0 40 40"><rect x="8" y="8" width="24" height="24" fill="none" stroke="${color}" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="${color}"/></svg>`,
    practical: `<svg width="40" height="40" viewBox="0 0 40 40"><rect x="12" y="8" width="16" height="8" fill="${color}"/><path d="M16 16 L16 28 L24 28 L24 16" stroke="${color}" stroke-width="2" fill="none"/></svg>`
  }

  return icons[type] || icons.key
}

/**
 * Get SVG string for camera icon
 */
export const getCameraIcon = (rotation: number = 0): string => {
  return `<svg width="40" height="40" viewBox="0 0 40 40" transform="rotate(${rotation})"><rect x="8" y="15" width="24" height="16" rx="2" fill="#333" stroke="#666" stroke-width="2"/><circle cx="20" cy="23" r="5" fill="#666" stroke="#333" stroke-width="1"/><rect x="28" y="18" width="4" height="4" fill="#666"/><path d="M14 15 L16 10 L24 10 L26 15" fill="#333"/></svg>`
}

/**
 * Get SVG string for subject icon
 */
export const getSubjectIcon = (type: 'person' | 'product' | 'custom' = 'person'): string => {
  const icons = {
    person: `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="12" r="6" fill="#4A90E2"/><path d="M10 35 Q10 25 20 25 Q30 25 30 35" fill="#4A90E2"/></svg>`,
    product: `<svg width="40" height="40" viewBox="0 0 40 40"><rect x="10" y="10" width="20" height="20" rx="2" fill="#4A90E2" stroke="#2E5C8A" stroke-width="2"/></svg>`,
    custom: `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="10" fill="#4A90E2"/></svg>`
  }

  return icons[type]
}
