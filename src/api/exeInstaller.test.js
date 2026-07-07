import assert from 'node:assert/strict'
import test from 'node:test'
import {
  InstallerDownloadError,
  parseContentDispositionFilename,
  requestExeInstallerDownload,
} from './exeInstaller.js'

test('parses executable filename from content disposition header', () => {
  assert.equal(
    parseContentDispositionFilename('attachment; filename="CorgiNite_Bundle.exe"'),
    'CorgiNite_Bundle.exe',
  )
})

test('requests an exe and starts the browser download', async () => {
  let requestUrl = ''
  let requestBody = null
  let clickedDownload = ''
  let clickedHref = ''
  let revokedUrl = ''
  const responseBlob = new Blob(['MZ fake executable bytes'], {
    type: 'application/vnd.microsoft.portable-executable',
  })

  const result = await requestExeInstallerDownload({
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
              ? 'attachment; filename="CorgiNite_Bundle.exe"'
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
  assert.equal(clickedDownload, 'CorgiNite_Bundle.exe')
  assert.equal(clickedHref, 'blob:corginite-exe')
  assert.equal(revokedUrl, 'blob:corginite-exe')
  assert.deepEqual(result, {
    filename: 'CorgiNite_Bundle.exe',
    message:
      'Downloaded CorgiNite_Bundle.exe. Run it to install the selected apps.',
  })
})

test('throws a user-facing error when the exe build fails', async () => {
  await assert.rejects(
    () =>
      requestExeInstallerDownload({
        apps: [{ id: 'chrome', name: 'Google Chrome' }],
        name: 'CorgiNite Bundle',
        options: {},
        fetchImpl: async () => ({
          ok: false,
          status: 503,
          json: async () => ({
            error:
              'Installer builder is missing NSIS. Install NSIS and try again.',
          }),
        }),
      }),
    (error) => {
      assert.equal(error instanceof InstallerDownloadError, true)
      assert.equal(
        error.message,
        'Installer builder is missing NSIS. Install NSIS and try again.',
      )
      return true
    },
  )
})
