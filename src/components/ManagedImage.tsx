import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type { ManagedImageCategory } from '../types'

function useManagedImageUrl(assetKey?: string) {
  const [loadedImage, setLoadedImage] = useState({ key: '', url: '' })
  const requestedKey = assetKey?.trim() ?? ''

  useEffect(() => {
    let isCurrent = true
    const key = assetKey?.trim()
    if (!key) {
      return () => {
        isCurrent = false
      }
    }
    getErpApi()
      .getManagedImageUrl(key)
      .then((result) => {
        if (isCurrent) setLoadedImage({ key, url: result.dataUrl ?? '' })
      })
      .catch(() => {
        if (isCurrent) setLoadedImage({ key, url: '' })
      })
    return () => {
      isCurrent = false
    }
  }, [assetKey])

  return requestedKey && loadedImage.key === requestedKey ? loadedImage.url : ''
}

export function ManagedImagePreview({
  assetKey,
  alt,
  className,
  fallback = null,
}: {
  assetKey?: string
  alt: string
  className?: string
  fallback?: ReactNode
}) {
  const url = useManagedImageUrl(assetKey)
  if (!url) return <>{fallback}</>
  return <img alt={alt} className={className} src={url} />
}

export function ManagedImageField({
  assetKey,
  category,
  disabled = false,
  label,
  ownerId,
  onChange,
  onBeforeSelect,
  onBeforeRemove,
  portrait = false,
  onError,
}: {
  assetKey?: string
  category: ManagedImageCategory
  disabled?: boolean
  label: string
  ownerId?: string
  onChange: (assetKey: string) => void
  onBeforeSelect?: () => boolean | Promise<boolean>
  onBeforeRemove?: () => boolean | Promise<boolean>
  portrait?: boolean
  onError?: (message: string) => void
}) {
  const [isSelecting, setIsSelecting] = useState(false)
  const url = useManagedImageUrl(assetKey)

  const chooseImage = async () => {
    if (disabled) return
    if (onBeforeSelect) {
      const shouldContinue = await onBeforeSelect()
      if (!shouldContinue) return
    }
    setIsSelecting(true)
    try {
      const result = await getErpApi().selectManagedImage({
        category,
        ownerId,
        currentAssetKey: assetKey,
      })
      if (!result.canceled && result.assetKey) {
        onChange(result.assetKey)
      }
    } catch (error) {
      onError?.(getErrorMessage(error, 'Image could not be selected.'))
    } finally {
      setIsSelecting(false)
    }
  }

  return (
    <div className={portrait ? 'managed-image-field managed-image-field--portrait' : 'managed-image-field'}>
      <div className="managed-image-field__preview">
        {url ? (
          <img alt={label} src={url} />
        ) : (
          <span>
            <Icon name="view" size={22} />
            No image
          </span>
        )}
      </div>
      <div className="managed-image-field__body">
        <strong>{label}</strong>
        <small>PNG, JPEG or WebP. Maximum 5 MB.</small>
        <div>
          <button
            className="secondary-button"
            disabled={disabled || isSelecting}
            onClick={() => void chooseImage()}
            type="button"
          >
            {assetKey ? 'Replace Image' : 'Choose Image'}
          </button>
          {assetKey && (
            <button
              className="text-button"
              disabled={disabled}
              onClick={() => {
                void (async () => {
                  if (onBeforeRemove) {
                    const shouldContinue = await onBeforeRemove()
                    if (!shouldContinue) return
                  }
                  onChange('')
                })()
              }}
              type="button"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
