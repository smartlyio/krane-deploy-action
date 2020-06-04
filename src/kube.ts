import * as exec from '@actions/exec'

async function configureKube(
  server: string,
  context: string,
  namespace: string
): Promise<void> {
  await exec.exec('kubectl config set-cluster', [
    context,
    `--server=${server}`,
    `--insecure-skip-tls-verify=true`
  ])
  await exec.exec(`kubectl config set-context`, [
    context,
    `--user=deploy`,
    `--cluster=${context}`,
    `--namespace=${namespace}`
  ])
  await exec.exec(
    '/bin/bash -c "kubectl config set-credentials deploy --token=$KUBERNETES_AUTH_TOKEN"'
  )
}

export {configureKube}
