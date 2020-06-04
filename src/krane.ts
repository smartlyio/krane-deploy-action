import * as exec from '@actions/exec'
import * as fs from 'fs'
import {promisify} from 'util'

const readdir = promisify(fs.readdir)

async function render(
  kranePath: string,
  currentSha: string,
  dockerRegistry: string,
  kraneTemplateDir: string
): Promise<string> {
  let renderedTemplates = ''
  const renderOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        renderedTemplates += data.toString()
      }
    }
  }
  await exec.exec(
    kranePath,
    [
      'render',
      `--current-sha=${currentSha}`,
      `--bindings=registry=${dockerRegistry}`,
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
