import { createNoise3D } from "simplex-noise";
import Alea from "alea";

const headline = document.querySelector(".headline--text").innerText;
const subhead = document.querySelector(".subhead--text").innerText;

//remove subhead element if empty
if (subhead.length === 0 || subhead === "{subhead}") {
    document.querySelector(".subhead--text").remove();
}

const pnrg = new Alea(headline);
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const noise3D = createNoise3D(pnrg);

const randomArrayElement = (arr) => {
    return arr[Math.floor(pnrg() * arr.length)];
};

// hyperparameters
const WIDTH = 1200;
const HEIGHT = 675;
const MAXSCALE = 0.001;
const MINSCALE = 0.00004;
const MAXSPACE = 30;
const MINSPACE = 1;
const MAXBIGLINESIZE = 80;
const MAXSMALLLINESIZE = 4;
const MINSMALLLINESIZE = 1;
const MAXBIGLINES = 5;
const MAXMEDLINES = 20;
const MAXSMALLLINES = 40;
const MARGIN = 20;
const SCHEMES = [
    [
        // light
        "#EDEAE6", // background
        "#27272E", // foreground
        "#2D4771",
        "#3b6db6",
        "#4688e7",
        "#319bbc",
        "#19a290",
        "#84b88d",
        "#c6cf96",
        "#F4DA7C",
        "#FAC78F",
        "#f79c7a",
        "#f46161",
        "#C14F87",
        "#754F8D",
    ],
    [
        // dark
        "#233147", // background
        "#EDEAE6", // foreground
        "#375C93",
        "#377BA7",
        "#319BBC",
        "#19A290",
        "#A0BE9A",
        "#E2DDCF",
        "#F7CA6F",
        "#FC975A",
        "#F46161",
        "#C14F87",
        "#754F8D",
        "#5B5690",
    ],
];

const CELLSIZE = 2;
// computed values
const COLORS = randomArrayElement(SCHEMES);
const DOCUMENTROOT = document.querySelector(':root');
const BACKGROUND = COLORS.shift();
const FOREGROUND = COLORS.shift();
const CELLSBETWEENLINES = pnrg() * (MAXSPACE - MINSPACE) + MINSPACE;
const NOISESCALE = pnrg() * (MAXSCALE - MINSCALE) + MINSCALE;
const COLS = Math.ceil(WIDTH / CELLSIZE);
const ROWS = Math.ceil(HEIGHT / CELLSIZE);
const GRID = [...new Array(COLS * ROWS)].map(() => []);

// set document background and foreground
DOCUMENTROOT.style.setProperty('--foreground', FOREGROUND);
DOCUMENTROOT.style.setProperty('--background', BACKGROUND)

// state variables
const ACTIVELIST = [];

const distance = ([x1, y1], [x2, y2]) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

const vectorAtPoint = ([x, y], cartesian = true) => {
    const angle =
        (1 + noise3D(x * NOISESCALE, y * NOISESCALE, 0)) * Math.PI;
    const magnitude = CELLSIZE * 1.5;
    return cartesian
        ? radialToCart(magnitude, angle)
        : [magnitude, angle];
};

const radialToCart = (magnitude, angle) => [
    Math.cos(angle) * magnitude,
    Math.sin(angle) * magnitude,
];

const coordsToIndex = ([i, j]) => i + j * COLS;

const gridCellAtPoint = ([x, y]) => [
    Math.floor(x / CELLSIZE),
    Math.floor(y / CELLSIZE),
];

const gridIndexAtPoint = (point) => {
    const [x, y] = gridCellAtPoint(point);
    return coordsToIndex([x, y]);
};

const addPointToGrid = (point) => {
    GRID[gridIndexAtPoint(point)].push(point);
};

const closeNeighborsToPoint = (point) =>
    pointsInNeighboringCells(point).filter(
        (neighbor) => distance(neighbor, point) < CELLSIZE
    );

const pointsInNeighboringCells = (point) => {
    const [i, j] = gridCellAtPoint(point);
    const neighbors = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            if (
                i + x >= 0 &&
                i + x <= COLS &&
                j + y >= 0 &&
                j + y <= ROWS
            ) {
                const neighbor = GRID[coordsToIndex([i + x, j + y])];
                if (neighbor) {
                    neighbors.push(neighbor);
                }
            }
        }
    }
    return neighbors.flat();
};

const pointHasCloseNeighbors = (point) =>
    closeNeighborsToPoint(point).length !== 0;

const pointIsOutsideCanvas = ([x, y]) => {
    return (
        x < 0 + MARGIN ||
        x > WIDTH - MARGIN ||
        y < 0 + MARGIN ||
        y > HEIGHT - MARGIN
    );
};

const randomPointInRect = (w = WIDTH, h = HEIGHT) => {
    return [pnrg() * w, pnrg() * h];
};

const pointPairNormalToLineAtPoint = ([x, y], distance = CELLSIZE) => {
    const theta = vectorAtPoint([x, y], false)[1];
    const normal = radialToCart(distance, theta + Math.PI / 2);
    const antiNormal = radialToCart(distance, theta - Math.PI / 2);
    const pointAbove = [x + normal[0], y + normal[1]];
    const pointBelow = [x + antiNormal[0], y + antiNormal[1]];
    return [pointAbove, pointBelow];
};

const drawFlowLines = (
    seedPoint = randomPointInRect(),
    lineWidth = 1
) => {
    ACTIVELIST.push(seedPoint);

    while (ACTIVELIST.length > 0) {
        let point = ACTIVELIST.pop();
        if (closeNeighborsToPoint(point, 1).length > 0) {
            continue;
        } else {
            drawFlowLine(point, lineWidth);
        }
    }
};

const drawFlowLine = (
    currentPoint,
    lineSize = 1,
    direction = -1,
    line = [],
    splines = []
) => {
    // if this is the first segment, add the starting spline to the grid
    // and visited list
    if (line.length === 0) {
        line.push(currentPoint);
        const firstSpline = [currentPoint];
        for (
            let i = 0.5;
            i <= Math.ceil(lineSize / 2) + CELLSBETWEENLINES;
            i++
        ) {
            for (const normalPoint of pointPairNormalToLineAtPoint(
                currentPoint,
                i * CELLSIZE
            )) {
                if (!pointIsOutsideCanvas(normalPoint)) {
                    addPointToGrid(normalPoint);
                    firstSpline.push(normalPoint);
                }
            }
        }
        splines.push(firstSpline);
    }

    // get next point according to flow field vector
    const currentVector = vectorAtPoint(currentPoint);
    const nextPoint = [
        currentPoint[0] + currentVector[0] * direction,
        currentPoint[1] + currentVector[1] * direction,
    ];

    const nextSpline = [nextPoint];
    // build a spline for the next line segment
    // add extra points outside stroke to create for space between lines
    for (let i = 0.5; i <= Math.ceil(lineSize / 2 + 1); i++) {
        for (const normalPoint of pointPairNormalToLineAtPoint(
            nextPoint,
            i * CELLSIZE
        )) {
            nextSpline.push(normalPoint);
        }
    }

    // get last points visited from last three line segments
    // const lastSplines = splines.slice(-3);

    // check if all points in the next spline are valid
    // (inside the field and not intersecting another line)
    // TODO: ignore neighbors if they are in the current line
    if (
        nextSpline.some(pointIsOutsideCanvas) ||
        nextSpline.some(pointHasCloseNeighbors)
    ) {
        if (direction === -1) {
            // if we're going backward and at an edge or intersect, time to go the other way
            // flip the order of the visited points, and set the direction of motion forward
            line.reverse();
            splines.reverse();
            direction = 1;
            // start drawing the flow line from the end of the visited points
            drawFlowLine(
                line[line.length - 1],
                lineSize,
                direction,
                line,
                splines
            );
        } else {
            // if we're going forward and at an edge/intersection, time to draw the line
            // first, remove the current seed point from the active list
            ctx.lineWidth = CELLSIZE * lineSize;
            ctx.strokeStyle =
                COLORS[
                    Math.round(
                        (vectorAtPoint(line[0], false)[1] /
                            (Math.PI * 2)) *
                            COLORS.length
                    )
                ];
            ctx.beginPath();
            ctx.moveTo(...line[0]);
            for (let i = 1; i < line.length; i++) {
                ctx.lineTo(...line[i]);
            }
            ctx.stroke();
        }
    } else {
        // find the next flow line segment
        // add point on spline of current line to the grid
        nextSpline.map((p) => {
            addPointToGrid(p);
        });
        // add the next point to the line
        line.push(nextPoint);
        // add some active points for the next flow line
        if (line.length % 4 === 0) {
            for (const normalPoint of pointPairNormalToLineAtPoint(
                currentPoint,
                lineSize * CELLSIZE + 2 * CELLSBETWEENLINES * CELLSIZE
            )) {
                if (!pointIsOutsideCanvas(normalPoint)) {
                    ACTIVELIST.push(normalPoint);
                }
            }
        }
        drawFlowLine(nextPoint, lineSize, direction, line, splines);
    }
};

canvas.style.background = BACKGROUND;
const BIGLINESIZE = pnrg() * MAXBIGLINESIZE;
const SMALLLINESIZE = Math.round(
    pnrg() * (MAXSMALLLINESIZE - MINSMALLLINESIZE) + MINSMALLLINESIZE
);
// draw big lines
for (let i = 0; i < pnrg() * MAXBIGLINES; i++) {
    drawFlowLine(randomPointInRect(), BIGLINESIZE);
}
for (let i = 0; i < pnrg() * MAXMEDLINES; i++) {
    drawFlowLine(randomPointInRect(), BIGLINESIZE / 3);
}
for (let i = 0; i < pnrg() * MAXSMALLLINES; i++) {
    drawFlowLine(randomPointInRect(), BIGLINESIZE / 6);
}
drawFlowLines(randomPointInRect(), SMALLLINESIZE);
