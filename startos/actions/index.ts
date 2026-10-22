import { sdk } from '../sdk'
import { createAccount } from './createAccount'
import { deleteAccount } from './deleteAccount'
import { resetAccountPassword } from './resetAccountPassword'
import { rotateAppSecret } from './rotateAppSecret'
import { runReminderPass } from './runReminderPass'
import { setAdminPassword } from './setAdminPassword'
import { settings } from './settings'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(createAccount)
  .addAction(resetAccountPassword)
  .addAction(deleteAccount)
  .addAction(settings)
  .addAction(runReminderPass)
  .addAction(rotateAppSecret)
