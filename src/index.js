import SimplexNoise from "simplex-noise";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const simplex = new SimplexNoise("{headline}");

// hyperparameters
const WIDTH = 1200;
const HEIGHT = 675;
const MARGIN = 20;
const DENSITY = 0.25;
const NOISESCALE = 0.5;
const COLORS = [
    "#4b3d3a",
    "#2d4771",
    "#3b6db6",
    "#4688e7",
    "#4095df",
    "#319bbc",
    "#19a290",
    "#84b88d",
    "#c6cf96",
    "#f7e49e",
    "#fac78f",
    "#f79c7a",
    "#f46161",
    "#DFD7C7",
];

// computed values
const R = 1 / DENSITY; // search radius for poisson disc sampling
const CELLSIZE = R / Math.sqrt(2);
const COLS = Math.ceil(WIDTH / CELLSIZE);
const ROWS = Math.ceil(HEIGHT / CELLSIZE);
const GRID = [...new Array(COLS * ROWS)].map(() => []);
const ACTIVEPOINTINTERVAL = 5;

// state variables
let RANDOMCOUNTER = 1;
const ACTIVELIST = [];

const seededRandom = () => (simplex.noise2D(0, RANDOMCOUNTER++) + 1) / 2;

const getVectorMagnitude = ([dx, dy]) => Math.sqrt(dx * dx + dy * dy);

const distance = ([x1, y1], [x2, y2]) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

const getVectorAt = ([x, y], cartesian = true) => {
    const angle =
        simplex.noise2D((x / WIDTH) * NOISESCALE, (y / HEIGHT) * NOISESCALE) *
        Math.PI;
    const magnitude =
        (simplex.noise3D(
            (x / WIDTH) * NOISESCALE,
            (y / HEIGHT) * NOISESCALE,
            angle / (Math.PI * 2)
        ) +
            1) *
        CELLSIZE;
    return cartesian ? radialToCart(angle, magnitude) : [angle, magnitude];
};

const getRandomArrayElement = (arr) => {
    return arr[Math.floor(seededRandom() * arr.length)];
};

const radialToCart = (angle, magnitude) => [
    Math.cos(angle) * magnitude,
    Math.sin(angle) * magnitude,
];

const coordsToIndex = ([i, j]) => i + j * COLS;

const indexToCoords = (index) => [index % COLS, Math.floor(index / COLS)];

const getGridCellCoords = ([x, y]) => [
    Math.floor(x / CELLSIZE),
    Math.floor(y / CELLSIZE),
];

const getGridIndexFromPoint = (point) => {
    const [x, y] = getGridCellCoords(point);
    return coordsToIndex([x, y]);
};

const getPointsInNeighboringCells = (point) => {
    const [i, j] = getGridCellCoords(point);
    const neighbors = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            if (i + x >= 0 && i + x <= COLS && j + y >= 0 && j + y <= ROWS) {
                const neighbor = GRID[coordsToIndex([i + x, j + y])];
                if (neighbor) {
                    neighbors.push(neighbor);
                }
            }
        }
    }
    return neighbors.flat();
};

const checkForCloseNeighbor = (point, ignoreCurrentPath = false) => {
    const neighbors = getPointsInNeighboringCells(point);
    for (const neighbor of neighbors) {
        if (ignoreCurrentPath && ctx.isPointInPath(neighbor[0], neighbor[1])) {
            continue;
        } else if (distance(neighbor, point) < R) {
            return true;
        }
    }
    return false;
};

const checkIfPointIsOutsideCanvas = (point) => {
    const [x, y] = point;
    return (
        x < 0 + MARGIN ||
        x > WIDTH - MARGIN ||
        y < 0 + MARGIN ||
        y > HEIGHT - MARGIN
    );
};

const getRandomPointWithinAnnulus = (point, distance) => {
    const [x, y] = point;
    const [dx, dy] = radialToCart(
        seededRandom() * Math.PI * 2,
        distance + seededRandom() * distance
    );
    return [x + dx, y + dy];
};

const getRandomPointInRect = (w = WIDTH, h = HEIGHT) => {
    return [seededRandom() * w, seededRandom() * h];
};

const drawGridLines = () => {
    for (let i = 0; i <= COLS; i++) {
        ctx.moveTo(i * CELLSIZE, 0);
        ctx.lineTo(i * CELLSIZE, HEIGHT);
    }
    for (let j = 0; j <= ROWS; j++) {
        ctx.moveTo(0, j * CELLSIZE);
        ctx.lineTo(WIDTH, j * CELLSIZE);
    }
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.stroke();
};

const drawGridPoints = () => {
    for (let point of GRID) {
        if (point) {
            ctx.fillStyle = "green";
            ctx.beginPath();
            ctx.ellipse(point[0], point[1], 4, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

const drawVectors = () => {
    for (const i in GRID) {
        const [x, y] = GRID[i];
        const [dX, dY] = getVectorAt(GRID[i]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dX, y + dY);
        ctx.stroke();
    }
};

const addActivePoints = (point) => {
    /**
     * Try to add a point at distance 2R from the given point, tangent to the flow line.
     */
    const [x, y] = point;
    const vectorAngleAtPoint = getVectorAt(point, false)[0];
    const tangentVectors = [
        radialToCart(vectorAngleAtPoint - Math.PI / 2, R),
        radialToCart(vectorAngleAtPoint + Math.PI / 2, R),
    ];
    const candidates = [
        [x + tangentVectors[0][0], y + tangentVectors[0][1]],
        [x + tangentVectors[1][0], y + tangentVectors[1][1]],
    ];
    for (const candidate of candidates) {
        // check if the point is:
        // 1. in an empty grid cell
        // 2. inside the canvas
        if (
            !checkForCloseNeighbor(candidate, false) &&
            !checkIfPointIsOutsideCanvas(candidate)
        ) {
            //draw each candidate
            ACTIVELIST.push(candidate);
        }
    }
};

const drawFlowLines = (seedPoint = undefined) => {
    // pick a random start point and add it to the active list
    if (!seedPoint) {
        seedPoint = getRandomPointInRect();
    }
    ACTIVELIST.push(seedPoint);

    while (ACTIVELIST.length > 0) {
        const point = getRandomArrayElement(ACTIVELIST);
        if (checkForCloseNeighbor(point)) {
            ACTIVELIST.splice(ACTIVELIST.indexOf(point), 1);
            continue;
        } else {
            drawFlowLine(point);
        }
    }
};

const drawFlowLine = (
    origin,
    currentPoint = origin,
    direction = 1,
    isFirst = true,
    segments = 0
) => {
    // if this is the first point, start the line
    if (isFirst) {
        // make sure to add the start point to the grid
        ctx.beginPath();
        ctx.moveTo(origin[0], origin[1]);
    }

    // get the vector at the point
    const thisVector = getVectorAt(currentPoint);

    // calculate the next point
    let nextPoint = [
        currentPoint[0] + thisVector[0] * direction,
        currentPoint[1] + thisVector[1] * direction,
    ];
    // check to see if:
    // 1. next point is too close to another point
    // 2. or next point is outside the canvas
    if (
        checkForCloseNeighbor(nextPoint, true) ||
        checkIfPointIsOutsideCanvas(nextPoint)
    ) {
        // if we're going forward, we need to go backwards
        if (direction > 0) {
            ctx.moveTo(...origin);
            nextPoint = origin;
            drawFlowLine(origin, nextPoint, -1, false);
        } else {
            // if we're going backward, we should stop drawing
            ctx.lineWidth = 2;
            ctx.strokeStyle =
                COLORS[
                    Math.round(
                        (getVectorAt(origin, false)[1] / (CELLSIZE * 2)) *
                            COLORS.length
                    )
                ];
            ctx.stroke();
            // splice the origin from the active list
            ACTIVELIST.splice(ACTIVELIST.indexOf(origin), 1);
        }
    } else {
        // otherwise, add the point to the grid and continue drawing
        // also, if it's the first jump, add the starting point to the grid list
        // NB: I tried to do this at the beginning of the loop, but for some reason
        // the ctx.isPointInPath() function was returning false for the first point
        // before we did a lineTo(). I don't know why.
        if (isFirst) {
            GRID[getGridIndexFromPoint(currentPoint)].push(currentPoint);
        }
        // add active points to the list at a regular interval from the start point of the line
        if (segments % ACTIVEPOINTINTERVAL === 0) {
            addActivePoints(currentPoint);
        }
        segments++;
        GRID[getGridIndexFromPoint(nextPoint)].push(nextPoint);
        ctx.lineTo(nextPoint[0], nextPoint[1]);
        drawFlowLine(origin, nextPoint, direction, false, segments);
    }
};

const getTextBoundingBox = (text) => {
    const metrics = ctx.measureText(text);
    const left = metrics.actualBoundingBoxLeft * -1;
    const top = metrics.actualBoundingBoxAscent * -1;
    const right = metrics.actualBoundingBoxRight;
    const bottom = metrics.actualBoundingBoxDescent;
    const width = right + left;
    const height = bottom + top;
    return { left, top, right, bottom, width, height };
};

canvas.style.background = "#27272E";
drawFlowLines();
