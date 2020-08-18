import {configureKube} from './kube'
import {render, deploy} from './krane'

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
  extraBindingsRaw: string
): Promise<void> {
  const extraBindings: Record<string, string> = JSON.parse(extraBindingsRaw)

  let kubernetesServer = kubernetesServerRaw
  if (kubernetesServer === '') {
    kubernetesServer = `https://${kubernetesClusterDomain}:6443`
  }

  await configureKube(kubernetesServer, kubernetesContext, kubernetesNamespace)

  const renderedTemplates = await render(
    kranePath,
    currentSha,
    dockerRegistry,
    kubernetesClusterDomain,
    kraneTemplateDir,
    extraBindings
  )
  await deploy(
    kranePath,
    kubernetesContext,
    kubernetesNamespace,
    kraneSelector,
    kraneTemplateDir,
    renderedTemplates
  )
}
