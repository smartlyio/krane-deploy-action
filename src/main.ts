import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    const dockerRegistry: string = core.getInput('dockerRegistry')
    const kubernetesServer: string = core.getInput('kubernetesServer')
    const kubernetesContext: string = core.getInput('kubernetesContext')
    const kubernetesNamespace: string = core.getInput('kubernetesNamespace')
    const kubernetesTemplateDir: string = core.getInput('kubernetesTemplateDir')

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
    await exec.exec('kubernetes-deploy', [
      kubernetesNamespace,
      kubernetesContext,
      `--template-dir=${kubernetesTemplateDir}`,
      `--bindings=registry=${dockerRegistry}`
    ])
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
