import * as exec from '@actions/exec'
import * as fs from 'fs'
import {promisify} from 'util'

class InvalidBindings extends Error {}

const readdir = promisify(fs.readdir)

function validateBindings(bindings: Record<string, string>): void {
  const bindingNames = Object.keys(bindings)
  for (const key of bindingNames) {
    // Ruby identifiers are consist of alphabets, decimal digits, and
    // the underscore character, and begin with a alphabets(including
    // underscore). There are no restrictions on the lengths of Ruby
    // identifiers.
    if (!/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(key)) {
      throw new InvalidBindings(
        `Binding name "${key}" should be a valid ruby identifier`
      )
    }
    const value = bindings[key]
    if (value.includes('"')) {
      throw new InvalidBindings(
        `Binding value for "${key}" shouldn't have a quote mark (") in it`
      )
    }
  }
}

function formatBindings(
  dockerRegistry: string,
  clusterDomain: string,
  extraBindings: Record<string, string>
): string {
  const bindings: Record<string, string> = {
    cluster_domain: clusterDomain,
    registry: dockerRegistry,
    ...extraBindings
  }

  const bindingsParts = Object.keys(bindings).map(key => {
    return `${key}=${bindings[key]}`
  })

  return bindingsParts.join(',')
}

async function render(
  kranePath: string,
  currentSha: string,
  dockerRegistry: string,
  clusterDomain: string,
  kraneTemplateDir: string,
  extraBindings: Record<string, string>
): Promise<string> {
  let renderedTemplates = ''
  const renderOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        renderedTemplates += data.toString()
      }
    }
  }

  // Throws an error on validation failure
  validateBindings(extraBindings)

  const bindingsString = formatBindings(
    dockerRegistry,
    clusterDomain,
    extraBindings
  )

  await exec.exec(
    kranePath,
    [
      'render',
      `--current-sha=${currentSha}`,
      `--bindings=${bindingsString}`,
      `--filenames=${kraneTemplateDir}`
    ],
    renderOptions
  )

  return renderedTemplates
}

async function findEjsonFiles(kraneTemplateDir: string): Promise<string[]> {
  let ejsonFiles = await readdir(kraneTemplateDir)
  ejsonFiles = ejsonFiles.filter(filename => filename.endsWith('.ejson'))
  return ejsonFiles.map(path => `${kraneTemplateDir}/${path}`)
}

async function deploy(
  kranePath: string,
  kubernetesContext: string,
  kubernetesNamespace: string,
  kraneSelector: string,
  kraneTemplateDir: string,
  renderedTemplates: string
): Promise<void> {
  const ejsonPaths = await findEjsonFiles(kraneTemplateDir)

  const deployCommand = [
    'deploy',
    kubernetesNamespace,
    kubernetesContext,
    `--selector=${kraneSelector}`,
    '--filenames',
    '-'
  ].concat(ejsonPaths)

  const deployOptions = {
    input: Buffer.from(renderedTemplates)
  }
  await exec.exec(kranePath, deployCommand, deployOptions)
}

export {render, deploy, findEjsonFiles}
