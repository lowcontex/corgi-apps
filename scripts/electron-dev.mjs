import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const defaultCwd = path.resolve(__dirname, '..')

export const resolveElectronCli = (cwd = defaultCwd) =>
  path.join(cwd, 'node_modules', 'electron', 'cli.js')

export const createElectronSpawnConfig = ({
  cwd = defaultCwd,
  nodePath = process.execPath,
} = {}) => ({
  command: nodePath,
  args: [resolveElectronCli(cwd), '.'],
  options: {
    cwd,
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
    shell: false,
    stdio: 'inherit',
  },
})

export const isDevServerReachable = async (
  url = 'http://localhost:5173',
  fetchImpl = fetch,
) => {
  try {
    const response = await fetchImpl(url)
    return Boolean(response?.ok)
  } catch {
    return false
  }
}

const run = async () => {
  const cwd = defaultCwd
  let server = null

  let electronProcess

  const shutdown = async (exitCode = 0) => {
    if (electronProcess && !electronProcess.killed) {
      electronProcess.kill()
    }
    if (server) {
      await server.close()
    }
    process.exit(exitCode)
  }

  process.on('SIGINT', () => {
    void shutdown(0)
  })
  process.on('SIGTERM', () => {
    void shutdown(0)
  })

  if (await isDevServerReachable()) {
    console.log('Using existing Vite server at http://localhost:5173')
  } else {
    server = await createServer({
      root: cwd,
      server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
      },
    })
    await server.listen()
    server.printUrls()
  }

  const electronConfig = createElectronSpawnConfig({ cwd })
  electronProcess = spawn(
    electronConfig.command,
    electronConfig.args,
    electronConfig.options,
  )

  electronProcess.on('error', async (error) => {
    console.error('Failed to start Electron:', error)
    await shutdown(1)
  })

  electronProcess.on('exit', async (code) => {
    if (server) {
      await server.close()
    }
    process.exit(code ?? 0)
  })
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  if (process.argv.includes('--dry-run')) {
    const config = createElectronSpawnConfig({ cwd: defaultCwd })
    console.log(
      JSON.stringify({
        command: config.command,
        args: config.args,
        cwd: config.options.cwd,
        shell: config.options.shell,
        nodeEnv: config.options.env.NODE_ENV,
      }),
    )
    process.exit(0)
  }

  run().catch((error) => {
    console.error('Failed to start dev environment:', error)
    process.exit(1)
  })
}
