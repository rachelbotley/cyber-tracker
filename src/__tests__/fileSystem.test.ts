import { describe, it, expect } from 'vitest'
import { buildTracksFromFiles, buildTracksFromFileList } from '../fileSystem'

// Mock FileSystemFileHandle
function mockHandle(name: string): FileSystemFileHandle {
  return {
    kind: 'file',
    name,
    getFile: async () => new File([''], name),
    isSameEntry: async () => false,
    queryPermission: async () => 'granted' as PermissionState,
    requestPermission: async () => 'granted' as PermissionState,
    createWritable: async () => { throw new Error('not implemented') },
  }
}

describe('buildTracksFromFiles', () => {
  it('builds tracks from files with artist subdirectories', () => {
    const files = [
      { handle: mockHandle('track1.mod'), pathSegments: ['ArtistA', 'track1.mod'] },
      { handle: mockHandle('track2.s3m'), pathSegments: ['ArtistA', 'track2.s3m'] },
      { handle: mockHandle('song.xm'), pathSegments: ['artist-b', 'song.xm'] },
    ]

    const { tracks, handles } = buildTracksFromFiles(files)

    expect(tracks).toHaveLength(3)
    expect(handles.size).toBe(3)

    // Tracks are sorted by path (localeCompare), lowercase before uppercase
    // artist-b/song.xm comes before ArtistA/track1.mod
    const artistA = tracks.filter(t => t.artist === 'ArtistA')
    const artistB = tracks.filter(t => t.artist === 'Artist B')
    expect(artistA).toHaveLength(2)
    expect(artistB).toHaveLength(1)

    // artist-b sorts first
    expect(tracks[0].artist).toBe('Artist B')
    expect(tracks[0].title).toBe('Song')
    expect(tracks[0].format).toBe('XM')

    // ArtistA tracks follow
    expect(artistA[0].title).toBe('Track1')
    expect(artistA[0].format).toBe('MOD')
  })

  it('uses "Unknown Artist" for files without subdirectories', () => {
    const files = [
      { handle: mockHandle('cool_song.it'), pathSegments: ['cool_song.it'] },
    ]

    const { tracks } = buildTracksFromFiles(files)

    expect(tracks).toHaveLength(1)
    expect(tracks[0].artist).toBe('Unknown Artist')
    expect(tracks[0].title).toBe('Cool Song')
    expect(tracks[0].format).toBe('IT')
  })

  it('handles deeply nested files (uses immediate parent as artist)', () => {
    const files = [
      { handle: mockHandle('tune.mod'), pathSegments: ['root', 'sub', 'artist_name', 'tune.mod'] },
    ]

    const { tracks } = buildTracksFromFiles(files)

    expect(tracks).toHaveLength(1)
    expect(tracks[0].artist).toBe('Artist Name')
  })

  it('starts IDs from given offset', () => {
    const files = [
      { handle: mockHandle('a.mod'), pathSegments: ['a.mod'] },
      { handle: mockHandle('b.mod'), pathSegments: ['b.mod'] },
    ]

    const { tracks } = buildTracksFromFiles(files, 10)

    expect(tracks[0].id).toBe('local-11')
    expect(tracks[1].id).toBe('local-12')
  })

  it('returns empty for empty input', () => {
    const { tracks, handles } = buildTracksFromFiles([])
    expect(tracks).toHaveLength(0)
    expect(handles.size).toBe(0)
  })

  it('sorts tracks by path', () => {
    const files = [
      { handle: mockHandle('z.mod'), pathSegments: ['z.mod'] },
      { handle: mockHandle('a.mod'), pathSegments: ['a.mod'] },
      { handle: mockHandle('m.mod'), pathSegments: ['m.mod'] },
    ]

    const { tracks } = buildTracksFromFiles(files)

    expect(tracks.map(t => t.title)).toEqual(['A', 'M', 'Z'])
  })

  it('handles all supported formats', () => {
    const formats = ['mod', 's3m', 'xm', 'it', 'mptm', 'stm', 'med']
    const files = formats.map(ext => ({
      handle: mockHandle(`track.${ext}`),
      pathSegments: [`track.${ext}`],
    }))

    const { tracks } = buildTracksFromFiles(files)

    expect(tracks).toHaveLength(7)
    // Sorted by filename (path), so alphabetical order
    const sortedFormats = [...formats].sort().map(f => f.toUpperCase())
    expect(tracks.map(t => t.format)).toEqual(sortedFormats)
  })

  it('formats title correctly (underscores, hyphens, capitalization)', () => {
    const files = [
      { handle: mockHandle('cool_song-remix.mod'), pathSegments: ['cool_song-remix.mod'] },
    ]

    const { tracks } = buildTracksFromFiles(files)

    expect(tracks[0].title).toBe('Cool Song Remix')
  })
})

describe('buildTracksFromFileList', () => {
  it('filters to tracker files only', () => {
    const files = [
      new File([''], 'song.mod'),
      new File([''], 'readme.txt'),
      new File([''], 'photo.jpg'),
      new File([''], 'track.xm'),
    ]

    const { tracks } = buildTracksFromFileList(files)

    expect(tracks).toHaveLength(2)
    expect(tracks[0].format).toBe('MOD')
    expect(tracks[1].format).toBe('XM')
  })

  it('extracts artist from webkitRelativePath', () => {
    const file = new File([''], 'theme.s3m')
    Object.defineProperty(file, 'webkitRelativePath', {
      value: 'music/Cool Artist/theme.s3m',
    })

    const { tracks } = buildTracksFromFileList([file])

    expect(tracks).toHaveLength(1)
    expect(tracks[0].artist).toBe('Cool Artist')
    expect(tracks[0].title).toBe("Theme")
  })

  it('uses "Unknown Artist" for flat files', () => {
    const { tracks } = buildTracksFromFileList([new File([''], 'song.mod')])

    expect(tracks).toHaveLength(1)
    expect(tracks[0].artist).toBe('Unknown Artist')
  })

  it('returns empty for no tracker files', () => {
    const { tracks } = buildTracksFromFileList([
      new File([''], 'readme.txt'),
    ])
    expect(tracks).toHaveLength(0)
  })

  it('stores blobs by track id', () => {
    const file = new File(['data'], 'a.mod')
    const { tracks, blobs } = buildTracksFromFileList([file])

    expect(blobs.size).toBe(1)
    expect(blobs.get(tracks[0].id)).toBe(file)
  })
})

describe('getBundledTracks', () => {
  it('returns the demo track', async () => {
    const { getBundledTracks } = await import('../tracks')
    const tracks = getBundledTracks()

    expect(tracks).toHaveLength(1)
    expect(tracks[0].id).toBe('demo-1')
    expect(tracks[0].title).toBe("Lizard King's Theme")
    expect(tracks[0].artist).toBe('Demo')
    expect(tracks[0].format).toBe('MOD')
    expect(tracks[0].source).toBe('bundled')
    expect(tracks[0].file).toContain('lizardkings_theme.mod')
  })
})

describe('hasFileSystemAccess', () => {
  it('returns false in test environment (no showDirectoryPicker)', async () => {
    // In vitest/node environment, window is not defined
    // hasFileSystemAccess guards against this
    const { hasFileSystemAccess } = await import('../fileSystem')
    expect(hasFileSystemAccess()).toBe(false)
  })
})
