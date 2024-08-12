import * as core from '@actions/core'
import {addAnnotation, getChangeCauseAnnotation} from './annotations'
import {deploy, render} from './krane'
import Ajv from 'ajv'

const ajv = new Ajv({allErrors: true})

const validate = ajv.compile({
  type: 'object',
  patternProperties: {
    '^.*$': {
      type: 'string'
    }
  }
})

export const BINDING_PREFIX = 'KRANE_BINDING_'
export const CHANGE_CAUSE = 'kubernetes.io/change-cause'

export async function getExtraBindings(
  extraBindingsRaw: string
): Promise<Record<string, string>> {
  const extraBindings: Record<string, string> = JSON.parse(extraBindingsRaw)
  if (!validate(extraBindings)) {
    throw new Error(
      'Expected extraBindings to be a JSON object mapping binding names to string values'
    )
  }

  const bindingInputs: string[] = Object.keys(process.env).filter(name =>
    name.startsWith(BINDING_PREFIX)
  )

  for (const bindingInput of bindingInputs) {
    const bindingName = bindingInput
      .replace(new RegExp(`^${BINDING_PREFIX}`), '')
      .toLowerCase()
    const value = process.env[bindingInput]
    if (value) {
      core.info(`Adding krane binding ${bindingName}`)
      extraBindings[bindingName] = value
    } else {
      core.warning(
        `Failed adding krane binding ${bindingName}: Value doesn't appear to exist!`
      )
    }
  }

  return extraBindings
}

export async function main(
  currentSha: string,
  dockerRegistry: string,
  kubernetesContext: string,
  kubernetesClusterDomain: string,
  kubernetesNamespace: string,
  kraneTemplateDir: string,
  kraneSelector: string,
  kranePath: string,
  extraBindingsRaw: string,
  renderOnly: boolean,
  deployTimeout: string
): Promise<void> {
  const extraBindings: Record<string, string> =
    await getExtraBindings(extraBindingsRaw)

  const renderedTemplates = await render(
    kranePath,
    currentSha,
    dockerRegistry,
    kubernetesClusterDomain,
    kraneTemplateDir,
    extraBindings
  )

  const automaticChangeCauseAnnotation = getChangeCauseAnnotation(
    currentSha,
    extraBindings,
    new Date()
  )
  const annotatedTemplates = addAnnotation(
    renderedTemplates,
    CHANGE_CAUSE,
    automaticChangeCauseAnnotation
  )

  if (renderOnly) {
    return
  }

  await deploy(
    kranePath,
    kubernetesContext,
    kubernetesNamespace,
    kraneSelector,
    kraneTemplateDir,
    annotatedTemplates,
    deployTimeout
  )
}
