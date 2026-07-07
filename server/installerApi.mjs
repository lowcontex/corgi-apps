import { buildInstallerScript, createScriptFilename } from './installerScript.mjs'
import { PayloadValidationError, normalizeBuildPayload } from './installerPayload.mjs'

const SCRIPT_MIME_TYPE = 'text/x-powershell;charset=utf-8'

const writeJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

const createDownloadHeaders = ({ filename, size }) => ({
  'Content-Type': SCRIPT_MIME_TYPE,
  'Content-Disposition': `attachment; filename="${filename}"`,
  'Content-Length': String(size),
  'Cache-Control': 'no-store',
})

export const handleBuildInstallerRequest = async (request, response, { logger = console } = {}) => {
  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'Only POST is supported.' })
    return
  }

  try {
    const body = await new Promise((resolve, reject) => {
      let content = ''
      request.on('data', (chunk) => {
        content += chunk.toString('utf8')
        if (content.length > 64 * 1024) {
          reject(new PayloadValidationError('Installer request body is too large.'))
        }
      })
      request.on('end', () => resolve(content))
      request.on('error', reject)
    })

    const payload = normalizeBuildPayload(JSON.parse(body))
    const script = buildInstallerScript({ payload })
    const filename = createScriptFilename(payload.name)

    response.writeHead(
      200,
      createDownloadHeaders({
        filename,
        size: Buffer.byteLength(script, 'utf8'),
      }),
    )
    response.end(script)
  } catch (error) {
    if (error instanceof SyntaxError) {
      writeJson(response, 400, { error: 'Installer request body must be JSON.' })
      return
    }

    if (error instanceof PayloadValidationError) {
      writeJson(response, error.statusCode, { error: error.message })
      return
    }

    logger.error('Installer script build failed', { error })
    writeJson(response, 503, {
      error: 'The installer script could not be created.',
    })
  }
}