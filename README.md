# Krane deploy Action

This action deploys service to kubernetes cluster with [krane](https://github.com/Shopify/krane)

## Requirements
Requires kubectl and krane (kubernetes-deploy). Make sure krane is installed on your runner, only versions <= **0.31.1** are supported.

## Environment variables
- `KUBERNETES_AUTH_TOKEN` - Bearer token for the user entry in kubeconfig
- `REVISION` - The SHA of the commit you are deploying. Will be exposed to your ERB templates as `current_sha`

## Example usage

``` yaml
name: Build & Deploy

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master
jobs:
  build:
    steps:
      - My awesome build job

  deploy:
    needs: build
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        env:
          KUBERNETES_AUTH_TOKEN: ${{ secrets.KUBERNETES_AUTH_TOKEN }}
          REVISION: ${{ github.sha }}
        uses: smartlyio/krane-deploy-action@v1
        with:
          dockerRegistry: hub.docker.com
          kubernetesServer: https://my-kubernetes-server:6443
          kubernetesContext: kube-prod
          kubernetesNamespace: my-service-name
```

Use [docker publish action](https://github.com/smartlyio/Publish-Docker-Github-Action) to build and push docker images in `build` job.
