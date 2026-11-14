import { sdk } from './sdk'

// Never restore `fence`: revoked access must stay revoked across restores.
export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) => sdk.Backups.ofVolumes('main', 'startos'),
)
