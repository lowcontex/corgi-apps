import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer as createViteServer } from 'vite'
import { handleBuildInstallerRequest } from './installerApi.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const isDev = process.argv.includes('--dev')
const port = Number(process.env.PORT || 5173)

const mimeTypes = new Map([
  ['.html', 'text/html;charset=utf-8'],
  ['.js', 'text/javascript;charset=utf-8'],
  ['.css', 'text/css;charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon'],
])

const sendStaticFile = async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host}`)
  const decodedPath = decodeURIComponent(requestUrl.pathname)
  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.slice(1)
  const requestedPath = path.normalize(path.join(distDir, relativePath))
  const safePath = requestedPath.startsWith(distDir)
    ? requestedPath
    : path.join(distDir, 'index.html')

  let filePath = safePath
  try {
    const fileStats = await stat(filePath)
    if (!fileStats.isFile()) {
      filePath = path.join(distDir, 'index.html')
    }
  } catch {
    filePath = path.join(distDir, 'index.html')
  }

  const fileStats = await stat(filePath)
  response.writeHead(200, {
    'Content-Type': mimeTypes.get(path.extname(filePath)) || 'application/octet-stream',
    'Content-Length': String(fileStats.size),
    'Cache-Control': filePath.endsWith('index.html')
      ? 'no-store'
      : 'public, max-age=31536000, immutable',
  })
  createReadStream(filePath).pipe(response)
}

const vite = isDev
  ? await createViteServer({
      root: rootDir,
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    })
  : null

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host}`)

  if (requestUrl.pathname === '/api/build-installer') {
    await handleBuildInstallerRequest(request, response)
    return
  }

  if (vite) {
    vite.middlewares(request, response, () => {
      response.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' })
      response.end('Not found')
    })
    return
  }

  try {
    await sendStaticFile(request, response)
  } catch (error) {
    console.error('Failed to serve static asset', { error, url: request.url })
    response.writeHead(500, { 'Content-Type': 'text/plain;charset=utf-8' })
    response.end('Server error')
  }
})

server.listen(port, () => {
  const mode = isDev ? 'development' : 'production'
  console.log(`CorgiNite web server running in ${mode} mode at http://localhost:${port}`)
})

const shutdown = async () => {
  await vite?.close()
  server.close()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
