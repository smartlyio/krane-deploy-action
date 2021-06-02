import YAML from 'yaml'
import {YAMLMap} from 'yaml/types'

export function addAnnotationToDocument(
  document: YAML.Document,
  annotationName: string,
  annotationValue: string
): void {
  const kind = document.get('kind')
  if (!kind) {
    return
  }
  // change-cause (or rather, kubectl rollout history) is only valid
  // for deployments, daemonsets and statefulsets.
  if (
    !['deployment', 'daemonset', 'statefulset'].includes(kind.toLowerCase())
  ) {
    return
  }
  if (!document.has('metadata')) {
    document.set('metadata', YAML.createNode({}))
  }
  const metadata: YAMLMap = document.get('metadata')
  if (!metadata.has('annotations')) {
    metadata.set('annotations', YAML.createNode({}))
  }
  const annotations: YAMLMap = metadata.get('annotations')
  if (!annotations.has(annotationName)) {
    annotations.set(annotationName, annotationValue)
  }
}

export function addAnnotation(
  manifestStream: string,
  annotationName: string,
  annotationValue: string
): string {
  const yamlDocuments = YAML.parseAllDocuments(manifestStream)
  let updatedManifests = ''
  for (const document of yamlDocuments) {
    addAnnotationToDocument(document, annotationName, annotationValue)
    const updatedDocument: string = YAML.stringify(document)
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
