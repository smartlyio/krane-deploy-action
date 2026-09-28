# Krane deploy Action

**Deprecated. Do not use this for new workflows.**

GitHub Actions no longer deploy to Kubernetes with this action. Production deploys go through Shipit. Manifest checks go through `kube-manifest-validator` in `smartlyio/github-actions-private`.

`smartlyio/kubernetes-auth-action` is a separate action and stays.

Existing tags (`krane-deploy-action@v4` and earlier) remain resolvable for old workflow runs. Nothing in the `smartlyio` org calls this action anymore. The last caller was `kube-check-krane-manifests` in `smartlyio/github-actions`, removed in VLCN-4318.
