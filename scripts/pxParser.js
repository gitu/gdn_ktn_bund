/**
 * Minimal reader for PC-Axis (.px) cubes, as published by the BFS (Swiss Federal Statistical Office).
 *
 * A px file is a header of `KEYWORD("lang")=value;` entries followed by `DATA=` and the cube as
 * whitespace separated numbers. The first STUB dimension varies slowest, the last HEADING dimension
 * fastest. We never materialise the whole cube (the STATPOP one has 25 million cells); `readSlice`
 * scans the data once and only parses the cells that were asked for.
 */

const QUOTED_LIST = /"((?:[^"]|"")*)"/g

/** Split `"a","b"` style lists (used by STUB, HEADING and VALUES) into plain strings. */
export function parseQuotedList(text) {
  return [...text.matchAll(QUOTED_LIST)].map((match) => match[1].replaceAll('""', '"'))
}

/**
 * The BFS files all say CHARSET="ANSI", but some (STATPOP) are UTF-8 and some (STATENT) really are
 * Windows-1252. UTF-8 is strict about malformed sequences, so try it first and fall back.
 */
function decodeHeader(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

/**
 * Parse the header of a px file.
 * @param {Buffer} buffer the whole file (or at least its header)
 * @returns {{ dimensions: { name: string, values: string[] }[], dataOffset: number }}
 *   dimensions in storage order (slowest varying first)
 */
export function parsePxHeader(buffer) {
  const marker = buffer.indexOf('DATA=')
  if (marker === -1) {
    throw new Error('Not a px file: DATA= section not found')
  }
  const header = decodeHeader(buffer.subarray(0, marker))

  const entries = new Map()
  for (const match of header.matchAll(
    /^([A-Z-]+)(?:\(("(?:[^"]|"")*"|[^)]*)\))?=([\s\S]*?);\s*$/gm,
  )) {
    const key = match[2] === undefined ? match[1] : `${match[1]}(${match[2]})`
    entries.set(key, match[3])
  }

  const stub = parseQuotedList(entries.get('STUB') ?? '')
  const heading = parseQuotedList(entries.get('HEADING') ?? '')
  const dimensions = [...stub, ...heading].map((name) => {
    const values = entries.get(`VALUES("${name}")`)
    if (values === undefined) {
      throw new Error(`px file lists dimension "${name}" but has no VALUES for it`)
    }
    return { name, values: parseQuotedList(values) }
  })

  // DATA= is followed by a line break; the numbers start after it
  let dataOffset = marker + 'DATA='.length
  while (
    buffer[dataOffset] === 0x0d ||
    buffer[dataOffset] === 0x0a ||
    buffer[dataOffset] === 0x20
  ) {
    dataOffset++
  }
  return { dimensions, dataOffset }
}

/**
 * Read a dense sub-cube.
 *
 * Every dimension is either pinned to one value, restricted to a list of values (`select`), or read in
 * full. The result keeps the non-pinned dimensions in storage order; `data` is row-major over them and
 * holds NaN for the px missing-value markers ("." / "..." / "-").
 *
 * @param {Buffer} buffer the whole file
 * @param {{ dimensions: { name: string, values: string[] }[], dataOffset: number }} header
 * @param {{ pinned?: Record<string, string>, select?: Record<string, string[]> }} [spec]
 * @returns {{ dimensions: { name: string, values: string[] }[], data: Float64Array,
 *            offset: (coords: Record<string, string>) => number }}
 */
export function readCube(buffer, header, spec = {}) {
  const { pinned = {}, select = {} } = spec
  const { dimensions, dataOffset } = header

  const indexOfLabel = (dimension, label) => {
    const index = dimension.values.indexOf(label)
    if (index === -1) throw new Error(`Dimension "${dimension.name}" has no value "${label}"`)
    return index
  }
  for (const name of [...Object.keys(pinned), ...Object.keys(select)]) {
    if (!dimensions.some((dimension) => dimension.name === name)) {
      throw new Error(`Unknown dimension "${name}"`)
    }
  }

  // Row-major strides: the last dimension changes fastest
  const strides = Array.from({ length: dimensions.length }, () => 0)
  let totalCells = 1
  for (let i = dimensions.length - 1; i >= 0; i--) {
    strides[i] = totalCells
    totalCells *= dimensions[i].values.length
  }

  // Which value indices are read per dimension (ascending, so the wanted cells ascend too)
  const chosen = dimensions.map((dimension) => {
    if (dimension.name in pinned) return [indexOfLabel(dimension, pinned[dimension.name])]
    if (dimension.name in select) {
      return [
        ...new Set(select[dimension.name].map((label) => indexOfLabel(dimension, label))),
      ].sort((a, b) => a - b)
    }
    return dimension.values.map((_, index) => index)
  })

  // Expand the wanted cell numbers dimension by dimension (outermost first)
  let cells = Float64Array.of(0)
  dimensions.forEach((_, d) => {
    const next = new Float64Array(cells.length * chosen[d].length)
    let k = 0
    for (const cell of cells) {
      for (const valueIndex of chosen[d]) next[k++] = cell + valueIndex * strides[d]
    }
    cells = next
  })

  // Single scan over the data: count whitespace separated tokens, parse only the wanted ones
  const data = new Float64Array(cells.length).fill(Number.NaN)
  let wantedIndex = 0
  let cell = 0
  let position = dataOffset
  const end = buffer.length
  const isSpace = (byte) => byte === 0x20 || byte === 0x0a || byte === 0x0d || byte === 0x09
  while (position < end && wantedIndex < cells.length) {
    let byte = buffer[position]
    if (isSpace(byte)) {
      position++
      continue
    }
    if (byte === 0x3b) break // ';' ends the DATA section
    const start = position
    if (byte === 0x22) {
      // quoted missing-value marker such as "." or "..."
      position++
      while (position < end && buffer[position] !== 0x22) position++
      position++
    } else {
      while (position < end) {
        byte = buffer[position]
        if (isSpace(byte) || byte === 0x3b) break
        position++
      }
    }
    if (cell === cells[wantedIndex]) {
      const token = buffer.toString('latin1', start, position)
      data[wantedIndex] = token.startsWith('"') ? Number.NaN : Number(token)
      wantedIndex++
    }
    cell++
  }
  if (wantedIndex < cells.length) {
    throw new Error(`px data ended early: read ${cell} of ${totalCells} cells`)
  }

  // Describe what is left after pinning, plus a coordinate -> position helper
  const outDimensions = []
  const outStrides = []
  dimensions.forEach((dimension, d) => {
    if (dimension.name in pinned) return
    outDimensions.push({ name: dimension.name, values: chosen[d].map((i) => dimension.values[i]) })
  })
  let outStride = 1
  for (let i = outDimensions.length - 1; i >= 0; i--) {
    outStrides[i] = outStride
    outStride *= outDimensions[i].values.length
  }
  const offset = (coords) =>
    outDimensions.reduce((sum, dimension, i) => {
      const position = dimension.values.indexOf(coords[dimension.name])
      if (position === -1)
        throw new Error(`No value "${coords[dimension.name]}" in "${dimension.name}"`)
      return sum + position * outStrides[i]
    }, 0)

  return { dimensions: outDimensions, data, offset }
}
