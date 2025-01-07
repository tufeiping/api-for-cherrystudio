import { ElectronAPI } from '@electron-toolkit/preload'
import { AddLoaderReturn, ExtractChunkData } from '@llm-tools/embedjs-interfaces'
import { FileType } from '@renderer/types'
import { WebDavConfig } from '@renderer/types'
import { AppInfo, KnowledgeBaseParams, KnowledgeItem, LanguageVarious } from '@renderer/types'
import type { OpenDialogOptions } from 'electron'
import type { UpdateInfo } from 'electron-updater'
import { Readable } from 'stream'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getAppInfo: () => Promise<AppInfo>
      checkForUpdate: () => Promise<{ currentVersion: string; updateInfo: UpdateInfo | null }>
      openWebsite: (url: string) => void
      setProxy: (proxy: string | undefined) => void
      setLanguage: (theme: LanguageVarious) => void
      setTray: (isActive: boolean) => void
      setTheme: (theme: 'light' | 'dark') => void
      minApp: (options: { url: string; windowOptions?: Electron.BrowserWindowConstructorOptions }) => void
      reload: () => void
      clearCache: () => Promise<{ success: boolean; error?: string }>
      zip: {
        compress: (text: string) => Promise<Buffer>
        decompress: (text: Buffer) => Promise<string>
      }
      backup: {
        backup: (fileName: string, data: string, destinationPath?: string) => Promise<Readable>
        restore: (backupPath: string) => Promise<string>
        backupToWebdav: (data: string, webdavConfig: WebDavConfig) => Promise<boolean>
        restoreFromWebdav: (webdavConfig: WebDavConfig) => Promise<string>
      }
      file: {
        select: (options?: OpenDialogOptions) => Promise<FileType[] | null>
        upload: (file: FileType) => Promise<FileType>
        delete: (fileId: string) => Promise<void>
        read: (fileId: string) => Promise<string>
        clear: () => Promise<void>
        get: (filePath: string) => Promise<FileType | null>
        selectFolder: () => Promise<string | null>
        create: (fileName: string) => Promise<string>
        write: (filePath: string, data: Uint8Array | string) => Promise<void>
        open: (options?: OpenDialogOptions) => Promise<{ fileName: string; filePath: string; content: Buffer } | null>
        openPath: (path: string) => Promise<void>
        save: (
          path: string,
          content: string | NodeJS.ArrayBufferView,
          options?: SaveDialogOptions
        ) => Promise<string | null>
        saveImage: (name: string, data: string) => void
        base64Image: (fileId: string) => Promise<{ mime: string; base64: string; data: string }>
        download: (url: string) => Promise<FileType | null>
        copy: (fileId: string, destPath: string) => Promise<void>
      }
      export: {
        toWord: (markdown: string, fileName: string) => Promise<void>
      }
      openPath: (path: string) => Promise<void>
      shortcuts: {
        update: (shortcuts: Shortcut[]) => Promise<void>
      }
      knowledgeBase: {
        create: ({ id, model, apiKey, baseURL }: KnowledgeBaseParams) => Promise<void>
        reset: ({ base }: { base: KnowledgeBaseParams }) => Promise<void>
        delete: (id: string) => Promise<void>
        add: ({
          base,
          item,
          forceReload = false
        }: {
          base: KnowledgeBaseParams
          item: KnowledgeItem
          forceReload?: boolean
        }) => Promise<AddLoaderReturn>
        remove: ({ uniqueId, base }: { uniqueId: string; base: KnowledgeBaseParams }) => Promise<void>
        search: ({ search, base }: { search: string; base: KnowledgeBaseParams }) => Promise<ExtractChunkData[]>
      }
      window: {
        setMinimumSize: (width: number, height: number) => Promise<void>
        resetMinimumSize: () => Promise<void>
      }
    }
  }
}
