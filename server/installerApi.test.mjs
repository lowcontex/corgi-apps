import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable, Writable } from 'node:stream'
import test from 'node:test'
import { handleBuildInstallerRequest } from './installerApi.mjs'

const createJsonRequest = (body) => {
  const request = Readable.from([JSON.stringify(body)])
  request.method = 'POST'
  request.url = '/api/build-installer'
  request.headers = {
    'content-type': 'application/json',
  }
  return request
}

const createResponseRecorder = () => {
  const chunks = []
  const response = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk))
      callback()
    },
  })
  response.statusCode = 200
  response.headers = {}
  response.writeHead = (statusCode, headers) => {
    response.statusCode = statusCode
    response.headers = headers
  }
  response.getBody = () => Buffer.concat(chunks)
  return response
}

test('streams a generated exe with download headers', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'corginite-api-test-'))
  const exePath = path.join(tempDir, 'CorgiNite_Bundle.exe')
  await writeFile(exePath, Buffer.from('MZ fake executable bytes'))

  try {
    const response = createResponseRecorder()
    let receivedPayload = null

    await handleBuildInstallerRequest(createJsonRequest({
      apps: ['chrome', '7zip'],
      name: 'CorgiNite Bundle',
      options: { arch: 'x64', silentInstall: true },
    }), response, {
      buildPipeline: async (payload) => {
        receivedPayload = payload
        return { outputPath: exePath }
      },
      logger: {
        error: () => assert.fail('expected no error log'),
      },
    })

    assert.deepEqual(receivedPayload, {
      apps: ['chrome', '7zip'],
      name: 'CorgiNite Bundle',
      options: {
        arch: 'x64',
        silentInstall: true,
        restorePoint: false,
      },
    })
    assert.equal(response.statusCode, 200)
    assert.equal(
      response.headers['Content-Type'],
      'application/vnd.microsoft.portable-executable',
    )
    assert.equal(
      response.headers['Content-Disposition'],
      'attachment; filename="CorgiNite_Bundle.exe"',
    )
    assert.equal(response.getBody().toString(), 'MZ fake executable bytes')
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
})

test('returns validation errors as JSON', async () => {
  const response = createResponseRecorder()

  await handleBuildInstallerRequest(createJsonRequest({
    apps: [],
    name: 'CorgiNite Bundle',
    options: {},
  }), response, {
    buildPipeline: async () => assert.fail('expected no build call'),
    logger: {
      error: () => assert.fail('expected no error log'),
    },
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(response.getBody().toString()), {
    error: 'Select at least one app before building the installer.',
  })
})
