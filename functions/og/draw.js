const simplex = new SimplexNoise();
const ctx = document.querySelector("canvas").getContext("2d");

// hyperparameters
const SEED = Math.random();
const WIDTH = 1200;
const HEIGHT = 675;
const DENSITY = 0.1;
const K = 10; // iterations for poisson disc sampling

// computed values
const R = 1 / DENSITY; // search radius for poisson disc sampling
const CELLSIZE = R / Math.sqrt(2);
const COLS = Math.ceil(WIDTH / CELLSIZE);
const ROWS = Math.ceil(HEIGHT / CELLSIZE);
const GRID = [...new Array(COLS * ROWS)].map(() => []);

const getVectorMagnitude = ([dx, dy]) => Math.sqrt(dx * dx + dy * dy);

const distance = ([x1, y1], [x2, y2]) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

const getVectorAt = ([x, y]) => {
    const angle = simplex.noise2D(x / WIDTH, y / HEIGHT) * Math.PI;
    const magnitude =
        (simplex.noise3D(x / WIDTH, y / HEIGHT, angle / (Math.PI * 2)) + 1) *
        CELLSIZE;
    return radialToCart(angle, magnitude);
};

const getRandomArrayElement = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
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
}

const checkIfPointIsOutsideGrid = (point) => {
    const [x, y] = point;
    return x < 0 || x > WIDTH || y < 0 || y > HEIGHT;
};

const getRandomPointWithinAnnulus = (point, distance) => {
    const [x, y] = point;
    const [dx, dy] = radialToCart(
        Math.random() * Math.PI * 2,
        distance + Math.random() * distance
    );
    return [x + dx, y + dy];
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

const drawFlowLines = (seedPoint = undefined) => {
    const activeList = [];
    const startPoint = seedPoint || [Math.random() * WIDTH, Math.random() * HEIGHT];
    activeList.push(startPoint);
    while (activeList.length > 0 && activeList.length < GRID.length) {
        const activePoint = getRandomArrayElement(activeList);
        // try k times to find a new point
        let found = false;
        for (let i = 0; i < K; i++) {
            // get a random candidate point within the annulus
            const candidatePoint = getRandomPointWithinAnnulus(activePoint, R);
            // check the neighbors of that candidate point
            const tooClose = checkForCloseNeighbor(candidatePoint);
            // if the candidate point is:
            // 1. not too close to any other point
            // 2. not out of bounds,
            // add it to the active list
            if (!tooClose && !checkIfPointIsOutsideGrid(candidatePoint)) {
                found = true;
                activeList.push(candidatePoint);
                drawFlowLine(candidatePoint);
                break;
            }
        }
        // if no candidate point was found, remove the active point from the active list
        if (!found) {
            activeList.splice(activeList.indexOf(activePoint), 1);
        }
    }
};

const drawFlowLine = (thisPoint, isFirst = true) => {
    // if this is the first point, start the line
    if (isFirst) {
        // make sure to add the start point to the grid
        ctx.beginPath();
        ctx.moveTo(thisPoint[0], thisPoint[1]);
    }

    // get the vector at the point
    const thisVector = getVectorAt(thisPoint);

    // get the next point
    const nextPoint = [
        thisPoint[0] + thisVector[0],
        thisPoint[1] + thisVector[1],
    ];
    // check to see if:
    // 1. next point is too close to another point
    // 2. or next point is outside the canvas
    if (
        checkForCloseNeighbor(nextPoint, true) ||
        checkIfPointIsOutsideGrid(nextPoint)
    ) {
        // if either of these conditions are met, stop drawing
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.stroke();
    } else {
        // otherwise, add the point to the grid and continue drawing
        // also, if it's the first jump, add the starting point to the grid list
        // NB: I tried to do this at the beginning of the loop, but for some reason
        // the ctx.isPointInPath() function was returning false for the first point
        // before we did a lineTo(). I don't know why.
        if (isFirst) {
            GRID[getGridIndexFromPoint(thisPoint)].push(thisPoint);
        }
        GRID[getGridIndexFromPoint(nextPoint)].push(nextPoint);
        ctx.lineTo(nextPoint[0], nextPoint[1]);
        drawFlowLine(nextPoint, false);
    }
};

drawFlowLines();
