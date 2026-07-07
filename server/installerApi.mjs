import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import {
  PayloadValidationError,
  createExeFilename,
  normalizeBuildPayload,
} from './installerPayload.mjs'
import { runExeBuildPipeline } from './wingetExeBuilder.mjs'

const MAX_REQUEST_BYTES = 64 * 1024
const EXE_MIME_TYPE = 'application/vnd.microsoft.portable-executable'

const readRequestBody = async (request) => {
  let body = ''

  for await (const chunk of request) {
    body += chunk.toString('utf8')
    if (body.length > MAX_REQUEST_BYTES) {
      throw new PayloadValidationError('Installer request body is too large.')
    }
  }

  return body
}

const writeJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

const escapeHeaderFilename = (filename) =>
  filename.replace(/["\\\r\n]/g, '_')

const createDownloadHeaders = ({ filename, size }) => ({
  'Content-Type': EXE_MIME_TYPE,
  'Content-Disposition': `attachment; filename="${escapeHeaderFilename(filename)}"`,
  'Content-Length': String(size),
  'Cache-Control': 'no-store',
})

const getClientBuildError = (error) => {
  const message = error instanceof Error ? error.message : String(error)

  if (/makensis|NSIS|ENOENT/i.test(message)) {
    return 'Installer builder is missing NSIS. Install NSIS and try again.'
  }

  if (/HTTP \d+|download/i.test(message)) {
    return 'Could not prepare one of the selected offline app installers. Try again in a moment.'
  }

  return 'The installer builder could not create the EXE.'
}

const streamFile = async (filePath, response) =>
  new Promise((resolve, reject) => {
    const stream = createReadStream(filePath)
    stream.on('error', reject)
    response.on?.('error', reject)
    response.on?.('finish', resolve)
    stream.pipe(response)
  })

export const handleBuildInstallerRequest = async (
  request,
  response,
  { buildPipeline = runExeBuildPipeline, logger = console } = {},
) => {
  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'Only POST is supported.' })
    return
  }

  try {
    const body = await readRequestBody(request)
    const payload = normalizeBuildPayload(JSON.parse(body))
    const result = await buildPipeline(payload, () => {}, () => false)

    if (!result?.outputPath) {
      throw new Error('Installer build completed without an output path.')
    }

    const fileStats = await stat(result.outputPath)
    const filename = path.basename(result.outputPath) || createExeFilename(payload.name)

    response.writeHead(
      200,
      createDownloadHeaders({
        filename,
        size: fileStats.size,
      }),
    )
    try {
      await streamFile(result.outputPath, response)
    } finally {
      await result.cleanup?.()
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      writeJson(response, 400, { error: 'Installer request body must be JSON.' })
      return
    }

    if (error instanceof PayloadValidationError) {
      writeJson(response, error.statusCode, { error: error.message })
      return
    }

    logger.error('Installer EXE build failed', { error })
    writeJson(response, 503, {
      error: getClientBuildError(error),
    })
  }
}
