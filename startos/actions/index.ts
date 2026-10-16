import { sdk } from '../sdk'
import { allowInsecureCookies } from './allowInsecureCookies'
import { createAccount } from './createAccount'
import { deleteAccount } from './deleteAccount'
import { listAccounts } from './listAccounts'
import { resetAccountPassword } from './resetAccountPassword'
import { rotateAppSecret } from './rotateAppSecret'
import { runReminderPass } from './runReminderPass'
import { setAdminPassword } from './setAdminPassword'
import { settings } from './settings'
import { toggleRegistration } from './toggleRegistration'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(createAccount)
  .addAction(listAccounts)
  .addAction(resetAccountPassword)
  .addAction(deleteAccount)
  .addAction(toggleRegistration)
  .addAction(settings)
  .addAction(runReminderPass)
  .addAction(allowInsecureCookies)
  .addAction(rotateAppSecret)
