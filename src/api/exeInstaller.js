export class InstallerDownloadError extends Error {
  constructor(message, statusCode = 0) {
    super(message)
    this.name = 'InstallerDownloadError'
    this.statusCode = statusCode
  }
}

const DEFAULT_SCRIPT_FILENAME = 'CorgiNite_Bundle.ps1'

const createFallbackScriptFilename = (name) => {
  const safeName = String(name || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)

  return `${safeName || 'CorgiNite_Bundle'}.ps1`
}

export const parseContentDispositionFilename = (contentDisposition) => {
  if (!contentDisposition) {
    return ''
  }

  const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i)
  if (filenameMatch?.[1]) {
    return filenameMatch[1]
  }

  const bareFilenameMatch = contentDisposition.match(/filename=([^;]+)/i)
  return bareFilenameMatch?.[1]?.trim() || ''
}

const readErrorMessage = async (response) => {
  try {
    const body = await response.json()
    return body?.error || body?.message || ''
  } catch (error) {
    console.error('Failed to parse installer API error response', {
      error,
      status: response.status,
    })
    return ''
  }
}

const downloadBlob = ({
  blob,
  filename,
  documentRef = globalThis.document,
  urlApi = globalThis.URL,
  logger = console,
}) => {
  if (!documentRef?.createElement || !urlApi?.createObjectURL) {
    throw new InstallerDownloadError(
      'This browser cannot start the installer download automatically.',
    )
  }

  let objectUrl = ''

  try {
    objectUrl = urlApi.createObjectURL(blob)
    const link = documentRef.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.rel = 'noopener'
    link.style.display = 'none'
    documentRef.body?.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    logger.error('Failed to start installer script download', {
      error,
      filename,
    })
    throw new InstallerDownloadError(
      'The script was created, but the browser could not start the download.',
    )
  } finally {
    if (objectUrl) {
      urlApi.revokeObjectURL(objectUrl)
    }
  }
}

export const requestInstallerScriptDownload = async ({
  apps,
  name,
  options,
  fetchImpl = globalThis.fetch,
  documentRef = globalThis.document,
  urlApi = globalThis.URL,
  endpoint = '/api/build-installer',
  logger = console,
}) => {
  if (!fetchImpl) {
    throw new InstallerDownloadError(
      'Installer script builder is unavailable in this browser.',
    )
  }

  const appIds = apps.map((app) => app.id)

  let response
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apps: appIds,
        name,
        options,
      }),
    })
  } catch (error) {
    logger.error('Installer API request failed', { error, endpoint })
    throw new InstallerDownloadError(
      'Could not connect to the installer script builder. Start the web server and try again.',
    )
  }

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new InstallerDownloadError(
      message || 'The installer script builder could not create the script.',
      response.status,
    )
  }

  const blob = await response.blob()
  const responseFilename = parseContentDispositionFilename(
    response.headers?.get?.('content-disposition'),
  )
  const filename =
    responseFilename || createFallbackScriptFilename(name) || DEFAULT_SCRIPT_FILENAME

  downloadBlob({
    blob,
    filename,
    documentRef,
    urlApi,
    logger,
  })

  return {
    filename,
    message: `Downloaded ${filename}. Open PowerShell as Administrator and run the script to install the selected apps.`,
  }
}

export const requestExeInstallerDownload = requestInstallerScriptDownload