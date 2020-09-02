import {configureKube} from './kube'
import {render, deploy} from './krane'
import Ajv from 'ajv'

const ajv = new Ajv({allErrors: true})

const validate = ajv.compile({
  type: 'object'
})

export async function main(
  currentSha: string,
  dockerRegistry: string,
  kubernetesServerRaw: string,
  kubernetesContext: string,
  kubernetesClusterDomain: string,
  kubernetesNamespace: string,
  kraneTemplateDir: string,
  kraneSelector: string,
  kranePath: string,
  extraBindingsRaw: string,
  renderOnly: boolean
): Promise<void> {
  const extraBindings: Record<string, string> = JSON.parse(extraBindingsRaw)
  if (!validate(extraBindings)) {
    throw new Error(
      'Expected extraBindings to be a JSON object mapping binding names to values'
    )
  }

  let kubernetesServer = kubernetesServerRaw
  if (kubernetesServer === '') {
    kubernetesServer = `https://${kubernetesClusterDomain}:6443`
  }

  const renderedTemplates = await render(
    kranePath,
    currentSha,
    dockerRegistry,
    kubernetesClusterDomain,
    kraneTemplateDir,
    extraBindings
  )

  if (renderOnly) {
    return
  }

  await configureKube(kubernetesServer, kubernetesContext, kubernetesNamespace)

  await deploy(
    kranePath,
    kubernetesContext,
    kubernetesNamespace,
    kraneSelector,
    kraneTemplateDir,
    renderedTemplates
  )
}
