const APP_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/
const MAX_SELECTED_APPS = 50
const MAX_INSTALLER_NAME_LENGTH = 80
const VALID_ARCHES = new Set(['x64', 'x86', 'mixed'])

export class PayloadValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PayloadValidationError'
    this.statusCode = 400
  }
}

export const createExeFilename = (name) => {
  const safeName = String(name || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_INSTALLER_NAME_LENGTH)

  return `${safeName || 'CorgiNite_Bundle'}.exe`
}

const normalizeAppIds = (apps) => {
  if (!Array.isArray(apps) || apps.length === 0) {
    throw new PayloadValidationError(
      'Select at least one app before building the installer.',
    )
  }

  if (apps.length > MAX_SELECTED_APPS) {
    throw new PayloadValidationError(
      `Select ${MAX_SELECTED_APPS} apps or fewer per installer.`,
    )
  }

  const normalized = apps.map((app) => String(app || '').trim())
  const invalidId = normalized.find((appId) => !APP_ID_PATTERN.test(appId))

  if (invalidId) {
    throw new PayloadValidationError('The request contains an invalid app ID.')
  }

  return [...new Set(normalized)]
}

const normalizeOptions = (options = {}) => ({
  arch: VALID_ARCHES.has(options.arch) ? options.arch : 'x64',
  silentInstall: options.silentInstall !== false,
  restorePoint: Boolean(options.restorePoint),
})

export const normalizeBuildPayload = (rawPayload) => {
  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new PayloadValidationError('Installer request body is required.')
  }

  const name = String(rawPayload.name || '').trim()

  if (!name) {
    throw new PayloadValidationError('Installer name is required.')
  }

  if (name.length > MAX_INSTALLER_NAME_LENGTH) {
    throw new PayloadValidationError(
      `Installer name must be ${MAX_INSTALLER_NAME_LENGTH} characters or fewer.`,
    )
  }

  return {
    apps: normalizeAppIds(rawPayload.apps),
    name,
    options: normalizeOptions(rawPayload.options),
  }
}
