import assert from 'node:assert/strict'
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

test('streams a generated ps1 script with download headers', async () => {
  const response = createResponseRecorder()

  await handleBuildInstallerRequest(createJsonRequest({
    apps: ['chrome', '7zip'],
    name: 'CorgiNite Bundle',
    options: { arch: 'x64', silentInstall: true },
  }), response, {
    logger: {
      error: () => assert.fail('expected no error log'),
    },
  })

  const body = response.getBody().toString()

  assert.equal(response.statusCode, 200)
  assert.equal(response.headers['Content-Type'], 'text/x-powershell;charset=utf-8')
  assert.equal(
    response.headers['Content-Disposition'],
    'attachment; filename="CorgiNite_Bundle.ps1"',
  )
  assert.match(body, /CorgiNite installer bootstrap/)
  assert.match(body, /& winget @arguments/)
  assert.match(body, /Google.Chrome/)
  assert.match(body, /7zip\.7zip/)
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
