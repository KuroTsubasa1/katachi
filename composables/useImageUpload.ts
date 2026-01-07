// Image upload composable for handling file uploads and base64 conversion
import { ref } from 'vue'

export const useImageUpload = () => {
  const uploading = ref(false)
  const uploadError = ref<string | null>(null)

  /**
   * Upload a single image file and convert to base64
   */
  const uploadImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error('File must be an image'))
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        reject(new Error('Image must be smaller than 5MB'))
        return
      }

      const reader = new FileReader()

      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          resolve(result)
        } else {
          reject(new Error('Failed to read file'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }

      reader.readAsDataURL(file)
    })
  }

  /**
   * Upload multiple image files and convert to base64
   */
  const uploadMultipleImages = async (files: FileList | File[]): Promise<string[]> => {
    const fileArray = Array.from(files)
    const promises = fileArray.map(file => uploadImage(file))

    try {
      return await Promise.all(promises)
    } catch (error) {
      throw error
    }
  }

  /**
   * Handle file input change event
   */
  const handleFileChange = async (
    event: Event,
    multiple: boolean = false
  ): Promise<string | string[] | null> => {
    const input = event.target as HTMLInputElement
    const files = input.files

    if (!files || files.length === 0) {
      return null
    }

    uploading.value = true
    uploadError.value = null

    try {
      if (multiple) {
        const results = await uploadMultipleImages(files)
        return results
      } else {
        const result = await uploadImage(files[0])
        return result
      }
    } catch (error) {
      uploadError.value = error instanceof Error ? error.message : 'Upload failed'
      return null
    } finally {
      uploading.value = false
      // Reset input value to allow re-uploading the same file
      input.value = ''
    }
  }

  /**
   * Compress an image to reduce file size
   */
  const compressImage = (
    imageUrl: string,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.9
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

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', quality)

        resolve(compressed)
      }

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'))
      }

      img.src = imageUrl
    })
  }

  /**
   * Create a thumbnail from an image
   */
  const createThumbnail = (
    imageUrl: string,
    size: number = 200
  ): Promise<string> => {
    return compressImage(imageUrl, size, size, 0.8)
  }

  return {
    uploading,
    uploadError,
    uploadImage,
    uploadMultipleImages,
    handleFileChange,
    compressImage,
    createThumbnail
  }
}
