import * as core from '@actions/core'

import {main} from './main'

function toBoolean(value: string): boolean {
  const regexp = new RegExp(/^(true|1|on|yes)$/i)
  return regexp.test(value.trim())
}

async function run(): Promise<void> {
  try {
    const currentSha: string = core.getInput('currentSha', {required: true})
    const dockerRegistry: string = core.getInput('dockerRegistry', {
      required: true
    })
    const kubernetesContext: string = core.getInput('kubernetesContext', {
      required: true
    })
    const kubernetesClusterDomain: string = core.getInput(
      'kubernetesClusterDomain',
      {required: true}
    )
    const kubernetesNamespace: string = core.getInput('kubernetesNamespace', {
      required: true
    })
    const kraneTemplateDir: string = core.getInput('kubernetesTemplateDir')
    const kraneSelector: string = core.getInput('kraneSelector')
    const kranePath: string = core.getInput('kranePath')
    const extraBindingsRaw: string = core.getInput('extraBindings')
    const renderOnly: boolean = toBoolean(core.getInput('renderOnly'))
    const deployTimeout: string = core.getInput('deployTimeout')

    await main(
      currentSha,
      dockerRegistry,
      kubernetesContext,
      kubernetesClusterDomain,
      kubernetesNamespace,
      kraneTemplateDir,
      kraneSelector,
      kranePath,
      extraBindingsRaw,
      renderOnly,
      deployTimeout
    )
  } catch (error) {
    core.setFailed(`${error}`)
  }
}

run()
