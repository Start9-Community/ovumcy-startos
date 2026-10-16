import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

/**
 * The escape hatch for a plain-HTTP LAN address.
 *
 * With COOKIE_SECURE on — the default — the session cookie is only ever sent
 * from a secure origin. That covers the two paths StartOS steers people
 * toward: the https LAN address, and an onion address in Tor Browser, which
 * treats .onion as a trustworthy origin. It does not cover http://…​.local or
 * a bare LAN IP, where the browser refuses the cookie and signing in simply
 * appears not to work. Rather than leave that as a mystery, this turns it into
 * a choice someone makes knowingly.
 */
export const allowInsecureCookies = sdk.Action.withoutInput(
  'allow-insecure-cookies',

  async ({ effects }) => {
    const secure = await storeJson.read((s) => s.cookieSecure).const(effects)
    return {
      name: secure
        ? i18n('Allow Sign-In Over Plain HTTP')
        : i18n('Require A Secure Connection To Sign In'),
      description: secure
        ? i18n(
            'Sign-in currently requires a secure address: the https LAN address, or your onion address in Tor Browser. Run this only if you need to sign in over a plain http:// address.',
          )
        : i18n(
            'Sign-in currently works over plain http, without the session cookie’s Secure flag. Run this to require a secure address again.',
          ),
      warning: secure
        ? i18n(
            'The session cookie loses its Secure flag, so it can be sent over an unencrypted connection. Anyone able to watch that traffic on your network could take over a signed-in session. Prefer trusting your server’s Root CA and using the https address.',
          )
        : i18n(
            'Sign-in over plain http:// addresses will stop working. Use the https LAN address, or Tor Browser for your onion address.',
          ),
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const secure = await storeJson.read((s) => s.cookieSecure).once()
    await storeJson.merge(effects, { cookieSecure: !secure })
  },
)
