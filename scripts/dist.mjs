import { deflateRawSync } from "node:zlib"
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"

const projectRoot = new URL("..", import.meta.url)
const outputPath = new URL("dist/package.zip", projectRoot)
const entries = []
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }

  return value >>> 0
})

console.log("Put binaries into bin/ directory first.")
console.log("Make sure binaries have execute permission before packaging.")
console.log("This should be run from a Linux shell so that permissions are properly copied into the package.")

await addRootFiles()
await addBinFiles()
await writeZip(outputPath, entries)

console.log(`Wrote ${new URL(outputPath).pathname}`)

async function addRootFiles() {
  const files = await readdir(projectRoot)

  for (const file of files.filter((name) => name.endsWith(".js")).sort()) {
    await addFile(file)
  }

  await addFile("package.json")
  await addFile("package-lock.json")
}

async function addBinFiles() {
  const binDir = new URL("bin/", projectRoot)

  try {
    const files = await readdir(binDir)

    for (const file of files.sort()) {
      const path = `bin/${file}`
      const info = await stat(new URL(path, projectRoot))

      if (info.isFile()) {
        await addFile(path)
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error
    }
  }
}

async function addFile(path) {
  const url = new URL(path, projectRoot)
  const info = await stat(url)

  entries.push({
    path,
    mode: info.mode & 0o777,
    mtime: info.mtime,
    data: await readBytes(url),
  })
}

async function readBytes(url) {
  return Buffer.from(await readFile(url))
}

async function writeZip(path, files) {
  const localHeaders = []
  const centralHeaders = []
  let offset = 0

  for (const file of files) {
    const name = Buffer.from(file.path)
    const compressed = deflateRawSync(file.data)
    const crc = crc32(file.data)
    const { time, date } = dosDateTime(file.mtime)
    const mode = ((0o100000 | (file.mode || 0o644)) << 16) >>> 0

    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0x0800, 6)
    localHeader.writeUInt16LE(8, 8)
    localHeader.writeUInt16LE(time, 10)
    localHeader.writeUInt16LE(date, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(compressed.length, 18)
    localHeader.writeUInt32LE(file.data.length, 22)
    localHeader.writeUInt16LE(name.length, 26)

    localHeaders.push(localHeader, name, compressed)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(0x031e, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0x0800, 8)
    centralHeader.writeUInt16LE(8, 10)
    centralHeader.writeUInt16LE(time, 12)
    centralHeader.writeUInt16LE(date, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(compressed.length, 20)
    centralHeader.writeUInt32LE(file.data.length, 24)
    centralHeader.writeUInt16LE(name.length, 28)
    centralHeader.writeUInt32LE(mode, 38)
    centralHeader.writeUInt32LE(offset, 42)

    centralHeaders.push(centralHeader, name)
    offset += localHeader.length + name.length + compressed.length
  }

  const centralDirectory = Buffer.concat(centralHeaders)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(offset, 16)

  await mkdir(new URL(".", path), { recursive: true })
  await writeFile(path, Buffer.concat([...localHeaders, centralDirectory, end]))
}

function dosDateTime(date) {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  }
}

function crc32(data) {
  let crc = 0xffffffff

  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]
  }

  return (crc ^ 0xffffffff) >>> 0
}
