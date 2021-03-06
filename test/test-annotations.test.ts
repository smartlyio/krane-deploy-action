import yaml from 'js-yaml'
import {
  KubeManifest,
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

const INVALID_DOCUMENT = `
metadata:
  name: test-deployment
  labels:
    krane: "yes"
`

const MERGE_KEYS = `
kind: Deployment
metadata:
  name: test-deployment
  labels:
    krane: "yes"
fakeTestStuff:
  <<: [{"item1": "value"}, {"item2": "another"}]
  <<: {"item3": "more value"}
  regular-key: new value
`

const DOCUMENT_STREAM = `
---
${BASIC_DOCUMENT}
---
---
invalidDocument
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
    const document: KubeManifest = yaml.load(BASIC_DOCUMENT) as KubeManifest
    const annotation = 'annotation-name'
    const value = 'annotation-value'
    const newDocument = addAnnotationToDocument(document, annotation, value)

    expect(newDocument?.metadata?.annotations).toEqual({[annotation]: value})
  })

  test('addAnnotationToDocument without kind', () => {
    const document: KubeManifest = yaml.load(INVALID_DOCUMENT) as KubeManifest
    const annotation = 'annotation-name'
    const value = 'annotation-value'
    const newDocument = addAnnotationToDocument(document, annotation, value)

    expect(document).toEqual(newDocument)
  })

  describe('addAnnotation', () => {
    test('basic document stream', () => {
      const annotation = 'annotation-name'
      const value = 'annotation-value'
      // We have one empty (null) document
      expect(yaml.loadAll(DOCUMENT_STREAM).length).toEqual(5)

      const updatedDocuments = addAnnotation(DOCUMENT_STREAM, annotation, value)

      const documents = yaml.loadAll(updatedDocuments) as KubeManifest[]

      // Empty (null) document is dropped
      expect(documents.length).toEqual(4)
      const [deployment, invalid, service, daemonset] = documents
      expect(invalid).toEqual('invalidDocument')
      expect(service?.metadata?.annotations).toEqual(undefined)
      expect(deployment?.metadata?.annotations).toEqual({[annotation]: value})
      expect(daemonset?.metadata?.annotations).toEqual({
        [annotation]: value,
        colour: 'blue'
      })
    })

    test('document with yaml merge keys <<:', () => {
      const annotation = 'annotation-name'
      const value = 'annotation-value'
      const updatedDocuments = addAnnotation(MERGE_KEYS, annotation, value)

      const documents = yaml.loadAll(updatedDocuments) as KubeManifest[]

      expect(documents.length).toEqual(1)
      const [deployment] = documents
      expect(deployment?.metadata?.annotations).toEqual({[annotation]: value})
      expect(deployment?.fakeTestStuff).toEqual({
        item1: 'value',
        item2: 'another',
        item3: 'more value',
        'regular-key': 'new value'
      })
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
    expect(changeCause).toEqual(
      `type=krane,deployer=lego,revision=abc123,at=${formatDate(
        now
      )},annotated-automatically=true`
    )
  })

  test('different deploy_revision specified', () => {
    const now = new Date()
    const currentSha = 'abc123'
    const bindings: Record<string, string> = {
      deployer: 'lego',
      deploy_revision: '456def'
    }
    const changeCause = getChangeCauseAnnotation(currentSha, bindings, now)
    expect(changeCause).toEqual(
      `type=krane,deployer=lego,revision=456def,at=${formatDate(
        now
      )},annotated-automatically=true`
    )
  })
})

test('formatDate', () => {
  expect(formatDate(new Date('2021-01-07T23:45:27.123Z'))).toEqual(
    '2021-01-07 23:45:27 UTC'
  )
  expect(formatDate(new Date('2021-07-29T02:45:27.123Z'))).toEqual(
    '2021-07-29 02:45:27 UTC'
  )
})
