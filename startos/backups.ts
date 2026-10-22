import { sdk } from './sdk'

// 'fence' is excluded on purpose: it is how Ovumcy detects a restored database and disarms revoked calendar feeds.
export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) => sdk.Backups.ofVolumes('main', 'startos'),
)
