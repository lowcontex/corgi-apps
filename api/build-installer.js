import { createExeFilename, normalizeBuildPayload } from '../server/installerPayload.mjs'

const EXE_MIME_TYPE = 'application/vnd.microsoft.portable-executable'
const DEMO_MODE_HEADER = 'x-corginite-mode'
const TEXT_ENCODER = new TextEncoder()

const writeJson = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })

const createPreviewInstallerBytes = (payload) => {
  const lines = [
    'CorgiNite preview installer',
    '',
    `Installer: ${payload.name}`,
    `Applications: ${payload.apps.length}`,
    `Architecture: ${payload.options.arch}`,
    `Silent mode: ${payload.options.silentInstall ? 'Enabled' : 'Disabled'}`,
    `Restore point: ${payload.options.restorePoint ? 'Enabled' : 'Disabled'}`,
    '',
    'This is a Vercel preview build.',
    'The real NSIS/winget build runs in the desktop/server environment.',
  ]

  return TEXT_ENCODER.encode(lines.join('\r\n'))
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return writeJson(405, { error: 'Only POST is supported.' })
    }

    try {
      const rawPayload = await request.json()
      const payload = normalizeBuildPayload(rawPayload)
      const filename = createExeFilename(payload.name)
      const body = createPreviewInstallerBytes(payload)

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': EXE_MIME_TYPE,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(body.byteLength),
          'Cache-Control': 'no-store',
          [DEMO_MODE_HEADER]: 'preview',
        },
      })
    } catch (error) {
      if (error instanceof SyntaxError) {
        return writeJson(400, { error: 'Installer request body must be JSON.' })
      }

      if (error?.name === 'PayloadValidationError') {
        return writeJson(error.statusCode || 400, { error: error.message })
      }

      return writeJson(503, {
        error: 'The installer builder could not create the EXE.',
      })
    }
  },
}
