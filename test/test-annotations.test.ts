import YAML from 'yaml'
import {
  addAnnotation,
  addAnnotationToDocument,
  getChangeCauseAnnotation,
  formatDate
} from '../src/annotations'

const BASIC_DOCUMENT = `
kind: Deployment
metadata:
  name: test-deployment
  labels:
    krane: "yes"
`


const DOCUMENT_STREAM = `
---
${BASIC_DOCUMENT}
---
kind: Service
metadata:
  name: a-service
  labels:
    application: web
---
kind: DaemonSet
metadata:
  name: a-service
  annotations:
    colour: blue
`

describe('add annotation', () => {
  test('addAnnotationToDocument', () => {
    const document: YAML.Document = YAML.parseDocument(BASIC_DOCUMENT)
    const annotation = 'annotation-name'
    const value = 'annotation-value'
    addAnnotationToDocument(document, annotation, value)

    expect(document.get('metadata').has('annotations')).toEqual(true)
    const annotations = document.get('metadata').get('annotations')
    expect(annotations.has(annotation)).toEqual(true)
    expect(annotations.get(annotation)).toEqual(value)
  })

  test('addAnnotation', () => {
    const annotation = 'annotation-name'
    const value = 'annotation-value'
    const updatedDocuments = addAnnotation(
      DOCUMENT_STREAM,
      annotation,
      value
    )

    const documents = YAML.parseAllDocuments(updatedDocuments).map((d) => d.toJSON())

    const [deployment, service, daemonset] = documents
    expect('annotations' in service.metadata).toEqual(false)
    expect(deployment.metadata.annotations).toEqual({[annotation]: value})
    expect(daemonset.metadata.annotations).toEqual({
      [annotation]: value,
      colour: 'blue'
    })
  })
})

describe('getChangeCauseAnnotation', () => {
  test('no deploy revision specified', () => {
    const now = new Date()
    const currentSha = 'abc123'
    const bindings: Record<string, string> = {
      deployer: 'lego'
    }
    const changeCause = getChangeCauseAnnotation(currentSha, bindings, now)
    expect(changeCause).toEqual(`type=krane,deployer=lego,revision=abc123,at=${formatDate(now)},annotated-automatically=true`)
  })

  test('different deploy_revision specified', () => {
    const now = new Date()
    const currentSha = 'abc123'
    const bindings: Record<string, string> = {
      deployer: 'lego',
      deploy_revision: '456def'
    }
    const changeCause = getChangeCauseAnnotation(currentSha, bindings, now)
    expect(changeCause).toEqual(`type=krane,deployer=lego,revision=456def,at=${formatDate(now)},annotated-automatically=true`)
  })
});
