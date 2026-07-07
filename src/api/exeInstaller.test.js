import assert from 'node:assert/strict'
import test from 'node:test'
import {
  InstallerDownloadError,
  parseContentDispositionFilename,
  requestInstallerScriptDownload,
} from './exeInstaller.js'

test('parses script filename from content disposition header', () => {
  assert.equal(
    parseContentDispositionFilename('attachment; filename="CorgiNite_Bundle.ps1"'),
    'CorgiNite_Bundle.ps1',
  )
})

test('requests a script and starts the browser download', async () => {
  let requestUrl = ''
  let requestBody = null
  let clickedDownload = ''
  let clickedHref = ''
  let revokedUrl = ''
  const responseBlob = new Blob(['MZ fake executable bytes'], {
    type: 'text/x-powershell',
  })

  const result = await requestInstallerScriptDownload({
    apps: [
      { id: 'chrome', name: 'Google Chrome' },
      { id: '7zip', name: '7-Zip' },
    ],
    name: 'CorgiNite Bundle',
    options: {
      arch: 'x64',
      silentInstall: true,
    },
    fetchImpl: async (url, init) => {
      requestUrl = url
      requestBody = JSON.parse(init.body)
      return {
        ok: true,
        headers: {
          get: (key) =>
            key.toLowerCase() === 'content-disposition'
              ? 'attachment; filename="CorgiNite_Bundle.ps1"'
              : null,
        },
        blob: async () => responseBlob,
      }
    },
    documentRef: {
      body: {
        appendChild: () => {},
      },
      createElement: () => ({
        href: '',
        download: '',
        rel: '',
        style: {},
        click() {
          clickedDownload = this.download
          clickedHref = this.href
        },
        remove() {},
      }),
    },
    urlApi: {
      createObjectURL: (blob) => {
        assert.equal(blob, responseBlob)
        return 'blob:corginite-exe'
      },
      revokeObjectURL: (url) => {
        revokedUrl = url
      },
    },
  })

  assert.equal(requestUrl, '/api/build-installer')
  assert.deepEqual(requestBody, {
    apps: ['chrome', '7zip'],
    name: 'CorgiNite Bundle',
    options: {
      arch: 'x64',
      silentInstall: true,
    },
  })
  assert.equal(clickedDownload, 'CorgiNite_Bundle.ps1')
  assert.equal(clickedHref, 'blob:corginite-exe')
  assert.equal(revokedUrl, 'blob:corginite-exe')
  assert.deepEqual(result, {
    filename: 'CorgiNite_Bundle.ps1',
    message:
      'Downloaded CorgiNite_Bundle.ps1. Open PowerShell as Administrator and run the script to install the selected apps.',
  })
})

test('throws a user-facing error when the script build fails', async () => {
  await assert.rejects(
    () =>
      requestInstallerScriptDownload({
        apps: [{ id: 'chrome', name: 'Google Chrome' }],
        name: 'CorgiNite Bundle',
        options: {},
        fetchImpl: async () => ({
          ok: false,
          status: 503,
          json: async () => ({
            error: 'The installer script could not be created.',
          }),
        }),
      }),
    (error) => {
      assert.equal(error instanceof InstallerDownloadError, true)
      assert.equal(error.message, 'The installer script could not be created.')
      return true
    },
  )
})
