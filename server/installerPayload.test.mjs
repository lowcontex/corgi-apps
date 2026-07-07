import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createExeFilename,
  normalizeBuildPayload,
} from './installerPayload.mjs'

test('normalizes a valid installer build payload', () => {
  assert.deepEqual(
    normalizeBuildPayload({
      apps: ['chrome', '7zip'],
      name: 'CorgiNite Bundle',
      options: {
        arch: 'x64',
        silentInstall: true,
        restorePoint: false,
        ignored: 'value',
      },
    }),
    {
      apps: ['chrome', '7zip'],
      name: 'CorgiNite Bundle',
      options: {
        arch: 'x64',
        silentInstall: true,
        restorePoint: false,
      },
    },
  )
})

test('rejects payloads without selected apps', () => {
  assert.throws(
    () =>
      normalizeBuildPayload({
        apps: [],
        name: 'CorgiNite Bundle',
        options: {},
      }),
    /Select at least one app before building the installer\./,
  )
})

test('rejects unsafe app IDs', () => {
  assert.throws(
    () =>
      normalizeBuildPayload({
        apps: ['chrome; Remove-Item C:\\'],
        name: 'CorgiNite Bundle',
        options: {},
      }),
    /contains an invalid app ID/,
  )
})

test('creates a safe exe filename', () => {
  assert.equal(
    createExeFilename('Office / Help Desk: Bundle?'),
    'Office_Help_Desk_Bundle.exe',
  )
})
