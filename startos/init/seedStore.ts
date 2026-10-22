import { utils } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

export const seedStore = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  await storeJson.merge(effects, {
    secretKey: utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 64 }),
  })
})
