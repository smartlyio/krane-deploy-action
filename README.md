# Krane deploy Action

This action deploys service to kubernetes cluster with [krane](https://github.com/Shopify/krane)

## Requirements
Requires kubectl and krane. Make sure krane is installed on your runner, only versions >= **1.1.0** are supported.

## Environment variables
- `KUBERNETES_AUTH_TOKEN` - Bearer token for the user entry in kubeconfig
- `KRANE_BINDING_*` - All variables of this pattern will be injected as bindings to `krane render`.  The binding name will be lower-case, with the `KRANE_BINDING_` prefix removed.

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

  validate:
    needs: build
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v2
      # Running with renderOnly:true does not require login
      - name: Render templates
        uses: smartlyio/krane-deploy-action@v3
        env:
          KRANE_BINDING_canary_revision: "abc123"
          KRANE_BINDING_user: "deploy-user"
        with:
          renderOnly: true
          currentSha: ${{ github.sha }}
          dockerRegistry: hub.docker.com
          kubernetesClusterDomain: my-kubernetes-server.example.com
          kubernetesContext: kube-prod
          kubernetesNamespace: my-service-name

  deploy:
    needs: build
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v2
      - uses: smartlyio/kubernetes-auth-action@v1
        env:
          KUBERNETES_AUTH_TOKEN: ${{ secrets.KUBERNETES_AUTH_TOKEN }}
        with:
          kubernetesClusterDomain: my-kubernetes-server.example.com
          kubernetesContext: kube-prod
          kubernetesNamespace: my-service-name
      - name: Deploy
        uses: smartlyio/krane-deploy-action@v3
        env:
          KRANE_BINDING_canary_revision: "abc123"
          KRANE_BINDING_user: "deploy-user"
        with:
          currentSha: ${{ github.sha }}
          dockerRegistry: hub.docker.com
          kubernetesClusterDomain: my-kubernetes-server.example.com
          kubernetesContext: kube-prod
          kubernetesNamespace: my-service-name
```

Use [docker publish action](https://github.com/smartlyio/Publish-Docker-Github-Action) to build and push docker images in `build` job.
