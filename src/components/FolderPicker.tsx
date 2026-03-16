import { useCallback, useRef, useState } from 'react'
import { usePlayerStore } from '../playerStore'
import { FolderOpenIcon } from './Icons'

import styles from './FolderPicker.module.css'

export function FolderPicker() {
  const openLocalFolder = usePlayerStore(s => s.openLocalFolder)
  const loadDroppedFiles = usePlayerStore(s => s.loadDroppedFiles)
  const hasLocalFolder = usePlayerStore(s => s.hasLocalFolder)
  const localFolderName = usePlayerStore(s => s.localFolderName)
  const isScanning = usePlayerStore(s => s.isScanning)
  const supportsFileSystemAccess = usePlayerStore(s => s.supportsFileSystemAccess)

  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files: File[] = []
    if (e.dataTransfer.items) {
      for (const item of e.dataTransfer.items) {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
    } else {
      for (const file of e.dataTransfer.files) {
        files.push(file)
      }
    }

    if (files.length > 0) {
      loadDroppedFiles(files)
    }
  }, [loadDroppedFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      loadDroppedFiles(files)
    }
    // Reset so the same folder can be re-selected
    e.target.value = ''
  }, [loadDroppedFiles])

  const handleClick = useCallback(() => {
    if (supportsFileSystemAccess) {
      openLocalFolder()
    } else {
      fileInputRef.current?.click()
    }
  }, [supportsFileSystemAccess, openLocalFolder])

  return (
    <div
      className={`${styles.container} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        className={styles.button}
        onClick={handleClick}
        disabled={isScanning}
        title={hasLocalFolder ? `Loaded: ${localFolderName}` : 'Open a folder of tracker music'}
      >
        <FolderOpenIcon className={styles.icon} />
        <span className={styles.label}>
          {isScanning ? 'SCANNING...' : hasLocalFolder ? 'CHANGE FOLDER' : 'OPEN FOLDER'}
        </span>
      </button>

      {hasLocalFolder && localFolderName && (
        <span className={styles.folderName} title={localFolderName}>
          <FolderOpenIcon className={styles.folderNameIcon} /> {localFolderName}
        </span>
      )}

      {!supportsFileSystemAccess && (
        <div className={styles.fallbackNote}>
          <span className={styles.noteText}>
            Drag &amp; drop tracker files, or click to browse.
            For best experience, use Chrome or Edge.
          </span>
        </div>
      )}

      {/* Hidden file input for fallback browsers */}
      <input
        ref={fileInputRef}
        type="file"
        className={styles.hiddenInput}
        onChange={handleFileInput}
        multiple
        // @ts-expect-error webkitdirectory is a non-standard attribute
        webkitdirectory=""
        directory=""
      />
    </div>
  )
}

/** Compact folder button for the header */
export function FolderButton() {
  const openLocalFolder = usePlayerStore(s => s.openLocalFolder)
  const isScanning = usePlayerStore(s => s.isScanning)
  const supportsFileSystemAccess = usePlayerStore(s => s.supportsFileSystemAccess)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const loadDroppedFiles = usePlayerStore(s => s.loadDroppedFiles)

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      loadDroppedFiles(files)
    }
    e.target.value = ''
  }, [loadDroppedFiles])

  const handleClick = useCallback(() => {
    if (supportsFileSystemAccess) {
      openLocalFolder()
    } else {
      fileInputRef.current?.click()
    }
  }, [supportsFileSystemAccess, openLocalFolder])

  return (
    <>
      <button
        className={styles.headerButton}
        onClick={handleClick}
        disabled={isScanning}
        title="Open folder of tracker music"
      >
        <FolderOpenIcon className={styles.headerIcon} />
        <span className={styles.headerLabel}>OPEN FOLDER</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className={styles.hiddenInput}
        onChange={handleFileInput}
        multiple
        // @ts-expect-error webkitdirectory is a non-standard attribute
        webkitdirectory=""
        directory=""
      />
    </>
  )
}
