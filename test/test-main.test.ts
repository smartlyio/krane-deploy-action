jest.mock('../src/krane')
import {render, deploy} from '../src/krane'
import {mocked} from 'ts-jest/utils'

import {main, getExtraBindings, BINDING_PREFIX} from '../src/main'

const currentSha: string = 'abc123'
const dockerRegistry: string = 'dev.registry.example.com'
const kubernetesContext: string = 'prod'
const kubernetesClusterDomain: string = 'prod.example.com'
const kubernetesNamespace: string = 'my-service'
const kraneTemplateDir: string = 'kubernetes/production'
const kraneSelector: string = 'managed-by=krane'
const kranePath: string = 'krane'
const timeout: string = '600s'

const OLD_ENV = process.env
beforeEach(() => {
  process.env = {...OLD_ENV}
})

afterEach(() => {
  process.env = OLD_ENV
})

describe('main entry point', () => {
  test('Configures kube, renders and deploys', async () => {
    const extraBindingsRaw: string = '{}'

    const renderedTemplates: string = 'rendered templates'
    mocked(render).mockImplementation(async () => {
      return renderedTemplates
    })

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
      false,
      timeout
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
      renderedTemplates,
      timeout
    )
  })

  test('Configures kube, renders and deploys with custom server', async () => {
    const extraBindingsRaw: string = '{}'

    const renderedTemplates: string = 'rendered templates'
    mocked(render).mockImplementation(async () => {
      return renderedTemplates
    })

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
      false,
      timeout
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
      renderedTemplates,
      timeout
    )
  })

  test('Renders with custom bindings', async () => {
    const extraBindingsRaw: string = '{"binding1": "value1"}'
    process.env[`${BINDING_PREFIX}BINDING2`] = 'value2'

    const renderedTemplates: string = 'rendered templates'
    mocked(render).mockImplementation(async () => {
      return renderedTemplates
    })

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
      true,
      timeout
    )

    const extraBindings: Record<string, string> = {
      binding1: 'value1',
      binding2: 'value2'
    }
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
})

describe('get extra bindings', () => {
  test('Validates JSON bindings invalid syntax', async () => {
    const extraBindingsRaw: string = '{'

    await expect(getExtraBindings(extraBindingsRaw)).rejects.toThrow(
      /^Unexpected end of JSON/
    )
  })

  test('Validates JSON wrong type string', async () => {
    const extraBindingsRaw: string = '"value"'

    await expect(getExtraBindings(extraBindingsRaw)).rejects.toThrow(
      /^Expected extraBindings to be a JSON object/
    )
  })

  test('Validates JSON wrong type array', async () => {
    const extraBindingsRaw: string = '[]'

    await expect(getExtraBindings(extraBindingsRaw)).rejects.toThrow(
      /^Expected extraBindings to be a JSON object/
    )
  })

  test('Validates JSON wrong type value', async () => {
    const extraBindingsRaw: string = '{"thing": 1}'

    await expect(getExtraBindings(extraBindingsRaw)).rejects.toThrow(
      /^Expected extraBindings to be a JSON object/
    )
  })

  test('Parses JSON extra bindings', async () => {
    const expected = {name: 'value'}
    const extraBindingsRaw: string = JSON.stringify(expected)

    const bindings = await getExtraBindings(extraBindingsRaw)

    expect(bindings).toEqual(expected)
  })

  test('Gets bindings from environment', async () => {
    const expected = {name: 'value'}
    process.env[`${BINDING_PREFIX}NAME`] = 'value'

    const bindings = await getExtraBindings('{}')

    expect(bindings).toEqual(expected)
  })

  test('Merges JSON bindings and environment bindings', async () => {
    const expected = {name: 'value', json: 'jsonvalue'}
    const extraBindingsRaw: string = '{"json": "jsonvalue"}'
    process.env[`${BINDING_PREFIX}NAME`] = 'value'

    const bindings = await getExtraBindings(extraBindingsRaw)

    expect(bindings).toEqual(expected)
  })

  test('Environment bindings take precedence', async () => {
    const expected = {name: 'value'}
    const extraBindingsRaw: string = '{"name": "jsonvalue"}'
    process.env[`${BINDING_PREFIX}NAME`] = 'value'

    const bindings = await getExtraBindings(extraBindingsRaw)

    expect(bindings).toEqual(expected)
  })
})
