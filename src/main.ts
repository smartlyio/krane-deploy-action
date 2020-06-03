import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import promisify from 'util'

const readdir = promisify(fs.readdir)

async function run(): Promise<void> {
  try {
    const currentSha: string = core.getInput('currentSha')
    const dockerRegistry: string = core.getInput('dockerRegistry')
    const kubernetesServer: string = core.getInput('kubernetesServer')
    const kubernetesContext: string = core.getInput('kubernetesContext')
    const kubernetesNamespace: string = core.getInput('kubernetesNamespace')
    const kubernetesTemplateDir: string = core.getInput('kubernetesTemplateDir')
    const kraneSelector: string = core.getInput('kraneSelector')

    await exec.exec(`kubectl config set-cluster`, [
      kubernetesContext,
      `--server=${kubernetesServer}`,
      `--insecure-skip-tls-verify=true`
    ])
    await exec.exec(`kubectl config set-context`, [
      kubernetesContext,
      `--user=deploy`,
      `--cluster=${kubernetesContext}`,
      `--namespace=${kubernetesNamespace}`
    ])
    await exec.exec(
      '/bin/bash -c "kubectl config set-credentials deploy --token=$KUBERNETES_AUTH_TOKEN"'
    )

    let renderedTemplates = ''
    const renderOptions = {}
    renderOptions.listeners = {
      stdout: (data: Buffer) => {
        renderedTemplates += data.toString()
      }
    }
    await exec.exec(
      'krane',
      [
        'render',
        `--current-sha=${currentSha}`,
        `--bindings=registry=${dockerRegistry}`,
        `--filenames=${kubernetesTemplateDir}`
      ],
      renderOptions
    )

    let ejsonFiles = await readdir(kubernetesTemplateDir)
    ejsonFiles = await ejsonFiles.filter(async filename =>
      filename.endswith('.ejson')
    )
    const ejsonPaths = ejsonFiles.map(
      path => `${kubernetesTemplateDir}/${path}`
    )

    const deployCommand = [
      'deploy',
      kubernetesNamespace,
      kubernetesContext,
      `--selector=${kraneSelector}`,
      '--filenames',
      '-'
    ].concat(ejsonPaths)

    const deployOptions = {}
    deployOptions.input = Buffer.from(renderedTemplates)
    await exec.exec('krane', deployCommand, deployOptions)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
