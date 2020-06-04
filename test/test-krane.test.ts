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

  test('krane render', async () => {
    const expectedArgs = [
      'render',
      '--current-sha=my-sha',
      '--bindings=registry=my-reg',
      '--filenames=/nonono'
    ]
    const expectedOptions = {listeners: {stdout: expect.anything()}}
    await render('krane', 'my-sha', 'my-reg', '/nonono')
    expect(exec.exec).toHaveBeenCalledTimes(1)
    expect(exec.exec).toHaveBeenCalledWith(
      'krane',
      expectedArgs,
      expectedOptions
    )
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
