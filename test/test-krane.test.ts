jest.mock('@actions/exec')
import * as exec from '@actions/exec'
import mockfs from 'mock-fs'

import {findEjsonFiles, render, deploy} from '../src/krane'

describe('krane utilities', () => {
  beforeEach(() => {
    mockfs({
      '/nonono': {
        'first.ejson': 'ejson 1',
        'second.yml': 'yml 1',
        'third.ejson': 'ejson 2',
        'fourth.yaml': 'yml 2',
        'fifth.yml.erb': 'template'
      }
    })
  })

  afterEach(() => {
    mockfs.restore()
  })

  test("Find's ejson files in template directory", async () => {
    const ejsonFiles = await findEjsonFiles('/nonono')
    expect(ejsonFiles).toEqual(['/nonono/first.ejson', '/nonono/third.ejson'])
  })

  describe('krane render', () => {
    test('without extra bindings', async () => {
      const expectedArgs = [
        'render',
        '--current-sha=my-sha',
        '--bindings=cluster_domain="cluster.example.com",registry="my-reg"',
        '--filenames=/nonono'
      ]
      const expectedOptions = {listeners: {stdout: expect.anything()}}
      await render(
        'krane',
        'my-sha',
        'my-reg',
        'cluster.example.com',
        '/nonono',
        {}
      )
      expect(exec.exec).toHaveBeenCalledTimes(1)
      expect(exec.exec).toHaveBeenCalledWith(
        'krane',
        expectedArgs,
        expectedOptions
      )
    })

    test('with extra bindings', async () => {
      const expectedArgs = [
        'render',
        '--current-sha=my-sha',
        '--bindings=cluster_domain="cluster.example.com",registry="my-reg",myExampleBinding="yes"',
        '--filenames=/nonono'
      ]
      const bindings = {
        myExampleBinding: 'yes'
      }
      const expectedOptions = {listeners: {stdout: expect.anything()}}
      await render(
        'krane',
        'my-sha',
        'my-reg',
        'cluster.example.com',
        '/nonono',
        bindings
      )
      expect(exec.exec).toHaveBeenCalledTimes(1)
      expect(exec.exec).toHaveBeenCalledWith(
        'krane',
        expectedArgs,
        expectedOptions
      )
    })

    test('extra bindings with spaces are not allowed', async () => {
      const bindings = {
        'example binding': 'yes'
      }
      const expectedOptions = {listeners: {stdout: expect.anything()}}
      await expect(
        render(
          'krane',
          'my-sha',
          'my-reg',
          'cluster.example.com',
          '/nonono',
          bindings
        )
      ).rejects.toThrow(
        /^Binding name "example binding" should be a valid ruby identifier/
      )
      expect(exec.exec).toHaveBeenCalledTimes(0)
    })

    test('extra bindings with quotes in value', async () => {
      const bindings = {
        exampleBinding: 'not"allowed'
      }
      const expectedOptions = {listeners: {stdout: expect.anything()}}
      await expect(
        render(
          'krane',
          'my-sha',
          'my-reg',
          'cluster.example.com',
          '/nonono',
          bindings
        )
      ).rejects.toThrow(
        /^Binding value for "exampleBinding" shouldn't have a quote mark \("\) in it/
      )
      expect(exec.exec).toHaveBeenCalledTimes(0)
    })
  })

  test('krane deploy', async () => {
    const expectedArgs = [
      'deploy',
      'ns',
      'context',
      '--selector=krane=true',
      '--filenames',
      '-',
      '/nonono/first.ejson',
      '/nonono/third.ejson'
    ]
    const expectedOptions = {input: expect.anything()}
    await deploy('krane', 'context', 'ns', 'krane=true', '/nonono', '')
    expect(exec.exec).toHaveBeenCalledTimes(1)
    expect(exec.exec).toHaveBeenCalledWith(
      'krane',
      expectedArgs,
      expectedOptions
    )
  })
})
