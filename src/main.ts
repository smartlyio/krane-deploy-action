import * as core from '@actions/core'

import {configureKube} from './kube'
import {render, deploy} from './krane'

async function run(): Promise<void> {
  try {
    const currentSha: string = core.getInput('currentSha')
    const dockerRegistry: string = core.getInput('dockerRegistry')
    const kubernetesServer: string = core.getInput('kubernetesServer')
    const kubernetesContext: string = core.getInput('kubernetesContext')
    const kubernetesNamespace: string = core.getInput('kubernetesNamespace')
    const kraneTemplateDir: string = core.getInput('kubernetesTemplateDir')
    const kraneSelector: string = core.getInput('kraneSelector')

    await configureKube(
      kubernetesServer,
      kubernetesContext,
      kubernetesNamespace
    )

    const renderedTemplates = await render(
      currentSha,
      dockerRegistry,
      kraneTemplateDir
    )
    await deploy(
      kubernetesContext,
      kubernetesNamespace,
      kraneSelector,
      kraneTemplateDir,
      renderedTemplates
    )
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
