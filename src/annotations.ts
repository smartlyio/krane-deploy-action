import yaml from 'js-yaml'

/* eslint-disable  @typescript-eslint/no-explicit-any */
interface KubeAnnotations {
  readonly [propname: string]: string
}

interface KubeMetadata {
  readonly annotations?: KubeAnnotations
  readonly [propname: string]: any
}

export interface KubeManifest {
  readonly kind?: string
  readonly metadata?: KubeMetadata
  readonly [propname: string]: any
}
/* eslint-enable  @typescript-eslint/no-explicit-any */

export function addAnnotationToDocument(
  document: KubeManifest,
  annotationName: string,
  annotationValue: string
): KubeManifest {
  if (!document.kind) {
    return document
  }
  // change-cause (or rather, kubectl rollout history) is only valid
  // for deployments, daemonsets and statefulsets.
  if (
    !['deployment', 'daemonset', 'statefulset'].includes(
      document.kind.toLowerCase()
    )
  ) {
    return document
  }

  let metadata: KubeMetadata = {}
  let annotations: KubeAnnotations = {}
  if (document.metadata) {
    metadata = {...document.metadata}
  }
  if (metadata.annotations) {
    annotations = {...metadata.annotations}
  }
  if (annotationName in annotations) {
    return document
  }
  const newDocument: KubeManifest = {
    ...document,
    metadata: {
      ...metadata,
      annotations: {
        ...annotations,
        [annotationName]: annotationValue
      }
    }
  }
  return newDocument
}

export function addAnnotation(
  manifestStream: string,
  annotationName: string,
  annotationValue: string
): string {
  const yamlDocuments = yaml.loadAll(manifestStream) as KubeManifest[]
  let updatedManifests = ''
  for (const document of yamlDocuments) {
    const newDocument = addAnnotationToDocument(
      document,
      annotationName,
      annotationValue
    )
    const updatedDocument: string = yaml.dump(newDocument, {lineWidth: -1})
    updatedManifests = `${updatedManifests}---
${updatedDocument}`
  }
  return updatedManifests
}

function padInt(int: number, length: number): string {
  return `000${int}`.slice(-length)
}

export function formatDate(date: Date): string {
  const year = padInt(date.getUTCFullYear(), 4)
  // Months are 0-based in Javascript?!?
  const month = padInt(date.getUTCMonth() + 1, 2)
  const day = padInt(date.getUTCDate(), 2)
  const hour = padInt(date.getUTCHours(), 2)
  const minute = padInt(date.getUTCMinutes(), 2)
  const second = padInt(date.getUTCSeconds(), 2)
  return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`
}

export function getChangeCauseAnnotation(
  currentSha: string,
  bindings: Record<string, string>,
  now: Date
): string {
  const parts = ['type=krane']
  if (bindings.deployer) {
    parts.push(`deployer=${bindings.deployer}`)
  }
  const revision = bindings.deploy_revision
    ? bindings.deploy_revision
    : currentSha
  parts.push(`revision=${revision}`)
  // Quick and dirty date format similar to what ruby produces with Time.now.getutc
  const nowUtc = formatDate(now)
  parts.push(`at=${nowUtc}`)
  parts.push('annotated-automatically=true')
  return parts.join(',')
}
