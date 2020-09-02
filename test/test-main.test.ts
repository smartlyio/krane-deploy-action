jest.mock('../src/krane')
import {render, deploy} from '../src/krane'
import {mocked} from 'ts-jest/utils'

import {main} from '../src/main'

const currentSha: string = 'abc123'
const dockerRegistry: string = 'dev.registry.example.com'
const kubernetesContext: string = 'prod'
const kubernetesClusterDomain: string = 'prod.example.com'
const kubernetesNamespace: string = 'my-service'
const kraneTemplateDir: string = 'kubernetes/production'
const kraneSelector: string = 'managed-by=krane'
const kranePath: string = 'krane'

describe('main entry point', () => {
  test('Configures kube, renders and deploys', async () => {
    const kubernetesServerRaw: string = ''
    const extraBindingsRaw: string = '{}'

    const renderedTemplates: string = 'rendered templates'
    mocked(render).mockImplementation(async () => {
      return renderedTemplates
    })

    await main(
      currentSha,
      dockerRegistry,
      kubernetesServerRaw,
      kubernetesContext,
      kubernetesClusterDomain,
      kubernetesNamespace,
      kraneTemplateDir,
      kraneSelector,
      kranePath,
      extraBindingsRaw,
      false
    )

    const extraBindings: Record<string, string> = {}
    expect(render).toHaveBeenCalledTimes(1)
    expect(render).toHaveBeenCalledWith(
      kranePath,
      currentSha,
      dockerRegistry,
      kubernetesClusterDomain,
      kraneTemplateDir,
      extraBindings
    )

    expect(deploy).toHaveBeenCalledTimes(1)
    expect(deploy).toHaveBeenCalledWith(
      kranePath,
      kubernetesContext,
      kubernetesNamespace,
      kraneSelector,
      kraneTemplateDir,
      renderedTemplates
    )
  })

  test('Configures kube, renders and deploys with custom server', async () => {
    const kubernetesServerRaw: string = 'https://other.example.com:6443'
    const extraBindingsRaw: string = '{}'

    const renderedTemplates: string = 'rendered templates'
    mocked(render).mockImplementation(async () => {
      return renderedTemplates
    })

    await main(
      currentSha,
      dockerRegistry,
      kubernetesServerRaw,
      kubernetesContext,
      kubernetesClusterDomain,
      kubernetesNamespace,
      kraneTemplateDir,
      kraneSelector,
      kranePath,
      extraBindingsRaw,
      false
    )

    const extraBindings: Record<string, string> = {}
    expect(render).toHaveBeenCalledTimes(1)
    expect(render).toHaveBeenCalledWith(
      kranePath,
      currentSha,
      dockerRegistry,
      kubernetesClusterDomain,
      kraneTemplateDir,
      extraBindings
    )

    expect(deploy).toHaveBeenCalledTimes(1)
    expect(deploy).toHaveBeenCalledWith(
      kranePath,
      kubernetesContext,
      kubernetesNamespace,
      kraneSelector,
      kraneTemplateDir,
      renderedTemplates
    )
  })

  test('Renders and does not configure kube or deploy', async () => {
    const kubernetesServerRaw: string = ''
    const extraBindingsRaw: string = '{}'

    const renderedTemplates: string = 'rendered templates'
    mocked(render).mockImplementation(async () => {
      return renderedTemplates
    })

    await main(
      currentSha,
      dockerRegistry,
      kubernetesServerRaw,
      kubernetesContext,
      kubernetesClusterDomain,
      kubernetesNamespace,
      kraneTemplateDir,
      kraneSelector,
      kranePath,
      extraBindingsRaw,
      true
    )

    const extraBindings: Record<string, string> = {}
    expect(render).toHaveBeenCalledTimes(1)
    expect(render).toHaveBeenCalledWith(
      kranePath,
      currentSha,
      dockerRegistry,
      kubernetesClusterDomain,
      kraneTemplateDir,
      extraBindings
    )

    expect(deploy).not.toHaveBeenCalled()
  })

  test('Validates JSON bindings invalid syntax', async () => {
    const kubernetesServerRaw: string = ''
    const extraBindingsRaw: string = '{'

    await expect(
      main(
        currentSha,
        dockerRegistry,
        kubernetesServerRaw,
        kubernetesContext,
        kubernetesClusterDomain,
        kubernetesNamespace,
        kraneTemplateDir,
        kraneSelector,
        kranePath,
        extraBindingsRaw,
        false
      )
    ).rejects.toThrow(/^Unexpected end of JSON/)

    expect(render).toHaveBeenCalledTimes(0)
    expect(deploy).toHaveBeenCalledTimes(0)
  })

  test('Validates JSON wrong type string', async () => {
    const kubernetesServerRaw: string = ''
    const extraBindingsRaw: string = '"value"'

    await expect(
      main(
        currentSha,
        dockerRegistry,
        kubernetesServerRaw,
        kubernetesContext,
        kubernetesClusterDomain,
        kubernetesNamespace,
        kraneTemplateDir,
        kraneSelector,
        kranePath,
        extraBindingsRaw,
        false
      )
    ).rejects.toThrow(/^Expected extraBindings to be a JSON object/)

    expect(render).toHaveBeenCalledTimes(0)
    expect(deploy).toHaveBeenCalledTimes(0)
  })

  test('Validates JSON wrong type array', async () => {
    const kubernetesServerRaw: string = ''
    const extraBindingsRaw: string = '[]'

    await expect(
      main(
        currentSha,
        dockerRegistry,
        kubernetesServerRaw,
        kubernetesContext,
        kubernetesClusterDomain,
        kubernetesNamespace,
        kraneTemplateDir,
        kraneSelector,
        kranePath,
        extraBindingsRaw,
        false
      )
    ).rejects.toThrow(/^Expected extraBindings to be a JSON object/)

    expect(render).toHaveBeenCalledTimes(0)
    expect(deploy).toHaveBeenCalledTimes(0)
  })
})
