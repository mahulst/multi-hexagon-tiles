const allHexParts = [0, 1, 2, 3, 4, 5]
let drawCoords = true
let shape = [
  { hex: { row: 3, col: 6 }, parts: [0] },
  { hex: { row: 2, col: 7 }, parts: allHexParts },
  { hex: { row: 2, col: 8 }, parts: allHexParts },
  { hex: { row: 1, col: 9 }, parts: allHexParts },
  { hex: { row: 3, col: 7 }, parts: [3] },
]
var HexDirection
;(function (HexDirection) {
  HexDirection[(HexDirection["North"] = 0)] = "North"
  HexDirection[(HexDirection["NorthEast"] = 1)] = "NorthEast"
  HexDirection[(HexDirection["SouthEast"] = 2)] = "SouthEast"
  HexDirection[(HexDirection["South"] = 3)] = "South"
  HexDirection[(HexDirection["SouthWest"] = 4)] = "SouthWest"
  HexDirection[(HexDirection["NorthWest"] = 5)] = "NorthWest"
})(HexDirection || (HexDirection = {}))

const EVEN_Q_OFFSETS = {
  [HexDirection.SouthEast]: [+1, 0],
  [HexDirection.NorthEast]: [+1, -1],
  [HexDirection.North]: [0, -1],
  [HexDirection.NorthWest]: [-1, -1],
  [HexDirection.SouthWest]: [-1, 0],
  [HexDirection.South]: [0, +1],
}

const ODD_Q_OFFSETS = {
  [HexDirection.SouthEast]: [+1, +1],
  [HexDirection.NorthEast]: [+1, 0],
  [HexDirection.North]: [0, -1],
  [HexDirection.NorthWest]: [-1, 0],
  [HexDirection.SouthWest]: [-1, +1],
  [HexDirection.South]: [0, +1],
}

function findHexNeighbor(hex, direction, amount = 1) {
  const offsets = hex.col % 2 === 0 ? EVEN_Q_OFFSETS : ODD_Q_OFFSETS
  const [dq, dr] = offsets[direction]
  if (amount === 1) {
    return {
      col: hex.col + dq,
      row: hex.row + dr,
    }
  } else {
    return findHexNeighbor(
      {
        col: hex.col + dq,
        row: hex.row + dr,
      },
      direction,
      amount - 1,
    )
  }
}
function redraw() {
  const canvas = document.getElementById("hexCanvas")
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const padding = 32
  const hexSize = 30

  const hexHeight = Math.sqrt(3) * hexSize
  const hexWidth = 2 * hexSize
  const hexVertDist = hexHeight
  const hexHorizDist = 1.5 * hexWidth
  const allHexLines = []
  const allInnerLines = []

  function hexCenter(q, r) {
    const centerX = hexSize * ((3 / 2) * q) + padding
    const centerY = hexSize * (Math.sqrt(3) * r + (Math.sqrt(3) / 2) * (q % 2)) + padding
    return { centerX, centerY }
  }
  function drawHexagon(x, y, skip = [], row, col) {
    const { centerX, centerY } = hexCenter(col, row)
    ctx.beginPath()
    let prev = undefined
    for (let i = 0; i <= 6; i++) {
      const angle = (Math.PI / 3) * i
      const nextX = Math.round(centerX + hexSize * Math.cos(angle))
      const nextY = Math.round(centerY + hexSize * Math.sin(angle))
      if (prev !== undefined) {
        allHexLines.push([prev, [nextX, nextY]])
      }
      if (drawCoords) {
        ctx.fillText(`${col},${row}`, centerX, centerY)
      }
      prev = [nextX, nextY]
    }
    //ctx.closePath()
    ctx.stroke()

    ctx.lineWidth = 1
    // Draw inner pie parts (lines from center to each vertex)
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const vertexX = centerX + hexSize * Math.cos(angle)
      const vertexY = centerY + hexSize * Math.sin(angle)
      allInnerLines.push([
        [centerX, centerY],
        [vertexX, vertexY],
      ])
    }
  }
  function filterDuplicates(arr) {
    return arr.filter((item, index, self) => {
      return (
        index ===
        self.findIndex((t) => {
          const [a, b] = t
          const [c, d] = item

          return (
            (JSON.stringify(a) === JSON.stringify(c) && JSON.stringify(b) === JSON.stringify(d)) ||
            (JSON.stringify(b) === JSON.stringify(c) && JSON.stringify(a) === JSON.stringify(d))
          )
        })
      )
    })
  }
  function drawFilledHexShape(shape) {
    shape.forEach(({ hex, parts }) => {
      const { centerX, centerY } = hexCenter(hex.col, hex.row)
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        if (!parts.includes(i)) {
          continue
        }
        const angle = (Math.PI / 3) * i
        const nextAngle = (Math.PI / 3) * (i + 1)
        const vertexX = centerX + hexSize * Math.cos(angle)
        const vertexY = centerY + hexSize * Math.sin(angle)
        const nextVertexX = centerX + hexSize * Math.cos(nextAngle)
        const nextVertexY = centerY + hexSize * Math.sin(nextAngle)

        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(vertexX, vertexY)
        ctx.lineTo(nextVertexX, nextVertexY)
        ctx.closePath()
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
        ctx.fill()
      }
    })
  }
  drawFilledHexShape(shape)
  function drawHexGrid(rows, cols) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let skips = []
        const isEven = row % 2 === 0
        const x = isEven ? hexWidth * 1.5 * col : hexWidth * 1.5 * col + (hexWidth * 1.5) / 2
        const y = isEven ? (hexHeight / 2) * row : (hexHeight / 2) * row
        drawHexagon(col, col, skips, row, col)
      }
    }
    ctx.lineWidth = 1
    ctx.strokeStyle = "rgba(0, 0, 0, 1)"
    const filteredHexLines = filterDuplicates(allHexLines)

    filteredHexLines.forEach(([from, to]) => {
      ctx.beginPath()
      ctx.moveTo(from[0], from[1])
      ctx.lineTo(to[0], to[1])
      ctx.stroke()
    })
    ctx.lineWidth = 1
    allInnerLines.forEach(([from, to]) => {
      ctx.beginPath()
      ctx.moveTo(from[0], from[1])
      ctx.lineTo(to[0], to[1])

      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
      ctx.stroke()
    })
  }
  drawHexGrid(8, 16)
}
function hexToCube(hex) {
  const x = hex.col
  const z = hex.row - Math.floor(hex.col / 2)
  const y = -x - z
  return { x, y, z }
}

function cubeDistance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z))
}

function hexDistance(a, b) {
  const cubeA = hexToCube(a)
  const cubeB = hexToCube(b)
  return cubeDistance(cubeA, cubeB)
}
function rotateHexShapeClockwise(hexShape) {
  if (hexShape.length === 0) return []

  const centerHex = hexShape[0].hex

  return hexShape.map((shape, index) => {
    if (index === 0) {
      // The center hex itself doesn't move, just rotates its pie parts
      const rotatedPieParts = shape.parts.map((index) => (index + 1) % 6)
      return {
        hex: { ...centerHex },
        parts: rotatedPieParts,
      }
    } else {
      const { hex, parts } = shape
      const distance = hexDistance(centerHex, hex)
      const neighbour = findHexNeighbor(centerHex, HexDirection.SouthWest, distance)
      //console.log(`${centerHex.col},${centerHex.row}`)
      //console.log(`${neighbour.col},${neighbour.row}`)
      function getRing(start, radius) {
        const ring = [start]
        let pos = start
        for (var i = 0; i < 6; i++) {
          for (var r = 0; r < radius; r++) {
            //console.log(`from ${pos.col},${pos.row} direction ${HexDirection[i]}`)
            pos = findHexNeighbor(pos, i)
            //console.log(`to ${pos.col},${pos.row}`)
            ring.push(pos)
          }
        }
        ring.pop()
        return ring
      }
      const ring = getRing(neighbour, distance)
      console.log(ring)
      const index = ring.findIndex((h) => h.row == hex.row && h.col == hex.col)
      const target = (index + distance) % ring.length
      const rotatedPieParts = parts.map((index) => {
        const result = index + 1
        return result > 5 ? 0 : result
      })
      return {
        hex: ring[target],
        parts: rotatedPieParts,
      }
    }
  })
}
function shiftRight(shape) {
  const newShapes = []
  shape.parts.forEach((p) => {
    switch (p) {
      case 0:
        newShapes.push({
          hex: findHexNeighbor(shape.hex, HexDirection.SouthEast),
          parts: [4],
        })
        break
      case 1:
        newShapes.push({
          hex: findHexNeighbor(shape.hex, HexDirection.SouthEast),
          parts: [3],
        })
        break
      case 2:
        newShapes.push({
          hex: shape.hex,
          parts: [0],
        })
        break
      case 3:
        newShapes.push({
          hex: shape.hex,
          parts: [5],
        })
        break
      case 4:
        newShapes.push({
          hex: findHexNeighbor(shape.hex, HexDirection.NorthEast),
          parts: [2],
        })
        break
      case 5:
        newShapes.push({
          hex: findHexNeighbor(shape.hex, HexDirection.NorthEast),
          parts: [1],
        })
        break
      default:
        throw new Error("invalid hex part")
    }
  })

  return newShapes
}
function shiftLeft(shape) {
  const newShapes = []
  shape.parts.forEach((p) => {
    switch (p) {
      case 0:
        newShapes.push({
          hex: shape.hex,
          parts: [2],
        })
        break
      case 1:
        newShapes.push({
          hex: findHexNeighbor(shape.hex, HexDirection.SouthWest),
          parts: [5],
        })
        break
      case 2:
        newShapes.push({
          hex: findHexNeighbor(shape.hex, HexDirection.SouthWest),
          parts: [4],
        })
        break
      case 3:
        newShapes.push({
          hex: findHexNeighbor(shape.hex, HexDirection.NorthWest),
          parts: [1],
        })
        break
      case 4:
        newShapes.push({
          hex: findHexNeighbor(shape.hex, HexDirection.NorthWest),
          parts: [0],
        })
        break
      case 5:
        newShapes.push({
          hex: shape.hex,
          parts: [3],
        })
        break
      default:
        throw new Error("invalid hex part")
    }
  })

  return newShapes
}
function shiftUp(shape) {
  return shape.map((s) => {
    return {
      hex: findHexNeighbor(s.hex, HexDirection.North),
      parts: s.parts,
    }
  })
}
function shiftDown(shape) {
  return shape.map((s) => {
    return {
      hex: findHexNeighbor(s.hex, HexDirection.South),
      parts: s.parts,
    }
  })
}
function mergeHexParts(shape) {
  const hexMap = new Map()

  shape.forEach(({ hex, parts }) => {
    const key = `${hex.col},${hex.row}`
    if (!hexMap.has(key)) {
      hexMap.set(key, [])
    }
    // Merge the parts for the hex
    hexMap.set(key, hexMap.get(key).concat(parts))
  })

  const mergedShape = []

  hexMap.forEach((parts, key) => {
    const [col, row] = key.split(",").map(Number)
    // Sort and remove duplicates
    const uniqueSortedParts = Array.from(new Set(parts)).sort((a, b) => a - b)
    mergedShape.push({
      hex: { col, row },
      parts: uniqueSortedParts,
    })
  })

  return mergedShape
}
redraw()
document.addEventListener("keyup", function (event) {
  if (event.key === "C" || event.key === "c") {
    drawCoords = !drawCoords
    redraw()
  }
  if (event.key === "R" || event.key === "r") {
    shape = rotateHexShapeClockwise(shape)

    redraw()
  }
  if (event.key === "L" || event.key === "l") {
    const newHexes = shape.flatMap(shiftRight)
    shape = mergeHexParts(newHexes)

    redraw()
  }
  if (event.key === "H" || event.key === "h") {
    const newHexes = shape.flatMap(shiftLeft)
    shape = mergeHexParts(newHexes)

    redraw()
  }
  if (event.key === "K" || event.key === "k") {
    shape = shiftUp(shape)

    redraw()
  }
  if (event.key === "J" || event.key === "j") {
    shape = shiftDown(shape)

    redraw()
  }
})
