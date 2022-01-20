const simplex = new SimplexNoise('seed');
const ctx = document.querySelector("canvas").getContext("2d");

// hyperparameters
const SEED = Math.random();
const WIDTH = 1200;
const HEIGHT = 675;
const DENSITY = 0.08;
const K = 10; // iterations for poisson disc sampling
const FRICTION = 0.5; // how much to reduce the velocity of the line during each iteration

// computed values
const R = 1 / DENSITY; // search radius for poisson disc sampling
const CELLSIZE = R / Math.sqrt(2);
const COLS = Math.floor(WIDTH / CELLSIZE);
const ROWS = Math.floor(HEIGHT / CELLSIZE);
const GRID = new Array(COLS * ROWS);

const getVectorMagnitude = ([dx, dy]) => Math.sqrt(dx * dx + dy * dy);

const distance = ([x1, y1], [x2, y2]) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

const getVectorAt = ([x, y]) => {
    const angle = (simplex.noise2D(x / WIDTH, y / HEIGHT)) * Math.PI;
    const magnitude =
        (simplex.noise3D(x / WIDTH, y / HEIGHT, angle / (Math.PI * 2)) + 1) *
        CELLSIZE;
    return radialToCart(angle, magnitude);
};

const getRandomArrayElement = (arr) => {
    let index = Math.floor(Math.random() * arr.length);
    while (arr[index] === undefined) {
        index++;
    }
    return arr[index];
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

const getPointsInNeighboringCells = ([i, j]) => {
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
    return neighbors;
};

const generateStartingPoints = () => {
    const activeList = [];

    // 1. put a random point in the grid and add it to the active list
    const initialPoint = [Math.random() * WIDTH, Math.random() * HEIGHT];

    GRID[coordsToIndex(getGridCellCoords(initialPoint))] = initialPoint;
    activeList.push(initialPoint);

    // 2. while there are still active points, pick a random point from the active list
    while (activeList.length > 0) {
        const randomActive = getRandomArrayElement(activeList);
        // check up to K points around the random active point
        let found = false;
        for (let i = 0; i < K; i++) {
            const randomVector = radialToCart(
                Math.random() * Math.PI * 2,
                R + Math.random() * R
            );
            const candidatePoint = [
                randomActive[0] + randomVector[0],
                randomActive[1] + randomVector[1],
            ];
            const candidateGridCell = getGridCellCoords(candidatePoint);
            if (
                candidatePoint[0] < 0 ||
                candidatePoint[0] > WIDTH ||
                candidatePoint[1] < 0 ||
                candidatePoint[1] > HEIGHT
            ) {
                continue;
            }
            let pass = true;

            if (GRID[coordsToIndex(getGridCellCoords(candidatePoint))]) {
                continue;
            }
            for (const point of getPointsInNeighboringCells(
                candidateGridCell
            )) {
                if (distance(point, candidatePoint) < R * 10) {
                    pass = false;
                    break;
                }
            }
            if (pass) {
                found = true;
                GRID[coordsToIndex(candidateGridCell)] = candidatePoint;
                activeList.push(candidatePoint);
            }
        }
        if (!found) {
            activeList.splice(activeList.indexOf(randomActive), 1);
        }
    }
};

generateStartingPoints();

const drawGrid = () => {
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

const drawFlowLine = (currentPoint, isFirst = true) => {
    if (! currentPoint) return;
    // set the start point as either the previous point or a random point in the grid
    const thisPoint = currentPoint || getRandomArrayElement(GRID);

    // if this is the first point, start the line
    if (isFirst) {
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
    // draw the line
    ctx.lineTo(nextPoint[0], nextPoint[1]);

    // check the grid cells around the next point for points that are too close
    const nextGridCell = getGridCellCoords(nextPoint);
    for (const point of getPointsInNeighboringCells(nextGridCell)) {
        if (distance(point, nextPoint) < R) {
            GRID.splice(getGridIndexFromPoint(point), 1);
        }
    }
    if ( nextPoint[0] < 0 || nextPoint[0] > WIDTH || nextPoint[1] < 0 || nextPoint[1] > HEIGHT ) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.stroke();
    } else {
        drawFlowLine(nextPoint, false);
    }
};


for (let i = 0; i < GRID.length; i++) {
    drawFlowLine(GRID[i]);
}
