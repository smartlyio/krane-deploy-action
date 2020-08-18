# Krane deploy Action

This action deploys service to kubernetes cluster with [krane](https://github.com/Shopify/krane)

## Requirements
Requires kubectl and krane. Make sure krane is installed on your runner, only versions >= **1.1.0** are supported.

## Environment variables
- `KUBERNETES_AUTH_TOKEN` - Bearer token for the user entry in kubeconfig

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
        uses: smartlyio/krane-deploy-action@v3
        with:
          currentSha: ${{ github.sha }}
          dockerRegistry: hub.docker.com
          kubernetesClusterDomain: my-kubernetes-server.example.com
          kubernetesContext: kube-prod
          kubernetesNamespace: my-service-name
          extraBindings: |
            {
              "canary_revision": "abc123",
              "user": "deploy-user"
            }
```

Use [docker publish action](https://github.com/smartlyio/Publish-Docker-Github-Action) to build and push docker images in `build` job.
