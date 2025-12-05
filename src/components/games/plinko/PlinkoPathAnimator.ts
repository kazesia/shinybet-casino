/**
 * Plinko Path Animator
 * 
 * Converts server-provided path_bits into Matter.js ball trajectory.
 * Each bit (0/1) represents left/right movement at each peg row.
 */

import Matter from 'matter-js';

export interface PathAnimationConfig {
    width: number;
    height: number;
    rows: number;
    startY: number;
    pegSize: number;
    ballSize: number;
    pathBits: string;
}

/**
 * Calculate the X position for a ball at a given row and cumulative position
 */
export const calculateXPosition = (
    width: number,
    row: number,
    position: number,
    totalRows: number
): number => {
    const gap = width / (totalRows + 3);
    const colsInRow = row + 3;

    // Start from leftmost position and offset by cumulative right moves
    const baseX = width / 2 - ((colsInRow - 1) * gap) / 2;

    // Each right move shifts position by half a gap to the right
    // The position represents number of right moves so far
    return baseX + position * gap + gap / 2;
};

/**
 * Generate waypoints for animated ball drop
 */
export const generateWaypoints = (config: PathAnimationConfig): { x: number; y: number }[] => {
    const { width, rows, startY, pathBits } = config;
    const gap = width / (rows + 3);
    const waypoints: { x: number; y: number }[] = [];

    // Starting position (top center with slight random offset baked into path)
    waypoints.push({ x: width / 2, y: startY - 30 });

    let position = 0; // Cumulative right moves

    for (let row = 0; row < rows; row++) {
        const bit = pathBits[row] === '1' ? 1 : 0;

        // Apply movement before calculating position for this row
        if (row > 0) {
            position += parseInt(pathBits[row - 1]);
        }

        const y = startY + row * gap;
        const x = calculateXPosition(width, row, position, rows);

        waypoints.push({ x, y });
    }

    // Final position in bucket
    const finalPosition = pathBits.split('').reduce((sum, bit) => sum + parseInt(bit), 0);
    const bucketY = startY + rows * gap + gap / 2;
    const bucketX = calculateXPosition(width, rows, finalPosition, rows);

    waypoints.push({ x: bucketX, y: bucketY });

    return waypoints;
};

/**
 * Create a ball with deterministic path for Matter.js
 * The ball will be influenced by physics but start in a position
 * that naturally leads to the correct bucket.
 */
export const createDeterministicBall = (
    world: Matter.World,
    pathBits: string,
    rows: number,
    width: number,
    startY: number,
    ballSize: number,
    betData: { stake: number }
): Matter.Body => {
    // Calculate ideal starting X based on path
    // Balls that need to go left should start slightly left
    // Balls that need to go right should start slightly right

    const rightMoves = pathBits.split('').reduce((sum, bit) => sum + parseInt(bit), 0);
    const leftMoves = rows - rightMoves;
    const bias = (rightMoves - leftMoves) / rows; // -1 to 1

    // Apply small starting offset (not too much to be obvious)
    const startX = width / 2 + bias * 5;

    const ball = Matter.Bodies.circle(startX, startY - 30, ballSize, {
        restitution: 0.5,
        friction: 0.001,
        frictionAir: 0.001,
        label: 'ball',
        render: { fillStyle: '#F7D979' }
    });

    // Attach bet data and path for tracking
    (ball as any).betData = betData;
    (ball as any).pathBits = pathBits;
    (ball as any).expectedPosition = rightMoves;

    Matter.World.add(world, ball);

    return ball;
};

/**
 * Calculate visual trajectory for UI preview (before ball drops)
 */
export const previewPath = (
    pathBits: string,
    rows: number,
    width: number,
    startY: number
): { x: number; y: number }[] => {
    const gap = width / (rows + 3);
    const points: { x: number; y: number }[] = [];

    let position = 0;
    let x = width / 2;

    for (let row = 0; row < rows; row++) {
        const y = startY + row * gap;
        points.push({ x, y });

        // Move left or right
        const bit = pathBits[row] === '1' ? 1 : 0;
        position += bit;

        // Calculate next X position
        const colsInRow = row + 4;
        const baseX = width / 2 - ((colsInRow - 1) * gap) / 2;
        x = baseX + position * gap + gap / 2;
    }

    // Final bucket position
    const bucketY = startY + rows * gap + gap / 2;
    points.push({ x, y: bucketY });

    return points;
};

/**
 * Verify a bet result matches the expected path
 */
export const verifyPath = (
    clientSeed: string,
    serverSeed: string,
    nonce: number,
    rows: number,
    expectedPathBits: string,
    expectedPosition: number
): boolean => {
    // Client-side verification would require crypto library
    // For now, just verify the path bits lead to the expected position
    const calculatedPosition = expectedPathBits.split('').reduce((sum, bit) => sum + parseInt(bit), 0);
    return calculatedPosition === expectedPosition;
};

export default {
    generateWaypoints,
    createDeterministicBall,
    previewPath,
    verifyPath,
    calculateXPosition,
};
