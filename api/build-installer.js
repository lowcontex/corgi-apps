import { buildInstallerScript, createScriptFilename } from '../server/installerScript.mjs'
import { PayloadValidationError, normalizeBuildPayload } from '../server/installerPayload.mjs'

const SCRIPT_MIME_TYPE = 'text/x-powershell;charset=utf-8'

const writeJson = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return writeJson(405, { error: 'Only POST is supported.' })
    }

    try {
      const rawPayload = await request.json()
      const payload = normalizeBuildPayload(rawPayload)
      const script = buildInstallerScript({ payload })
      const filename = createScriptFilename(payload.name)

      return new Response(script, {
        status: 200,
        headers: {
          'Content-Type': SCRIPT_MIME_TYPE,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    } catch (error) {
      if (error instanceof SyntaxError) {
        return writeJson(400, { error: 'Installer request body must be JSON.' })
      }

      if (error instanceof PayloadValidationError) {
        return writeJson(error.statusCode || 400, { error: error.message })
      }

      return writeJson(503, {
        error: 'The installer script could not be created.',
      })
    }
  },
}