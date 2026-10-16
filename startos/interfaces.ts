import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, 'ui-multi')
  // Plain HTTP: StartOS terminates TLS at its own proxy and forwards HTTP to
  // the container. The app's port is never published to the network itself.
  const uiMultiOrigin = await uiMulti.bindPort(uiPort, { protocol: 'http' })

  const ui = sdk.createInterface(effects, {
    name: i18n('Web Interface'),
    id: 'ui',
    description: i18n(
      'The Ovumcy calendar and settings. Everyone with an account on this server signs in here.',
    ),
    type: 'ui',
    // Nothing secret in the address itself — accounts are password-protected,
    // and an address a household has to share is not a credential.
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await uiMultiOrigin.export([ui])]
})
