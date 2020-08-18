import * as core from '@actions/core'

import {main} from './main'

async function run(): Promise<void> {
  try {
    const currentSha: string = core.getInput('currentSha')
    const dockerRegistry: string = core.getInput('dockerRegistry')
    const kubernetesServer: string = core.getInput('kubernetesServer')
    const kubernetesContext: string = core.getInput('kubernetesContext')
    const kubernetesClusterDomain: string = core.getInput(
      'kubernetesClusterDomain'
    )
    const kubernetesNamespace: string = core.getInput('kubernetesNamespace')
    const kraneTemplateDir: string = core.getInput('kubernetesTemplateDir')
    const kraneSelector: string = core.getInput('kraneSelector')
    const kranePath: string = core.getInput('kranePath')
    const extraBindings: string = core.getInput('extraBindings')

    await main(
      currentSha,
      dockerRegistry,
      kubernetesServer,
      kubernetesContext,
      kubernetesClusterDomain,
      kubernetesNamespace,
      kraneTemplateDir,
      kraneSelector,
      kranePath,
      extraBindings
    )
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
