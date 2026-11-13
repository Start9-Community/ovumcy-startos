import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v1_9_2 } from './v1_9_2'

export const versionGraph = VersionGraph.of({
  current,
  other: [v1_9_2],
})
