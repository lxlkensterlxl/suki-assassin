const i2cBus = require("i2c-bus");
const { Pca9685Driver } = require("pca9685");

// ==========================================
// 1. SERVO PIN & CALIBRATION CONFIGURATION
// ==========================================
const CHANNELS = {
  FL_HIP: 0,  // Front Left Hip
  FL_KNEE: 1, // Front Left Knee
  FR_HIP: 2,  // Front Right Hip
  FR_KNEE: 3, // Front Right Knee
  BL_HIP: 4,  // Back Left Hip
  BL_KNEE: 5, // Back Left Knee
  BR_HIP: 6,  // Back Right Hip
  BR_KNEE: 7, // Back Right Knee
};

// Fine-tune neutral standing angles (degrees) so every leg sits straight at rest
const NEUTRAL = {
  FL_HIP: 90, FL_KNEE: 90,
  FR_HIP: 90, FR_KNEE: 90,
  BL_HIP: 90, BL_KNEE: 90,
  BR_HIP: 90, BR_KNEE: 90,
};

// Direction multipliers (1 or -1) to account for mirrored left/right servo mounting
// +1 hip delta = swing leg forward | +1 knee delta = lift foot up
const DIR = {
  FL_HIP: 1,  FL_KNEE: -1,
  FR_HIP: -1, FR_KNEE: 1,
  BL_HIP: 1,  BL_KNEE: -1,
  BR_HIP: -1, BR_KNEE: 1,
};

// Gait tuning parameters
const GAIT = {
  STEP_LENGTH: 24,   // Total hip sweep in degrees
  STEP_HEIGHT: 18,   // Knee lift height in degrees
  PHASE_DELAY_MS: 90 // Time between gait phases (lower = faster walk)
};

// Standard servo pulse range in microseconds (adjust if your servos use 600-2400)
const SERVO_MIN_US = 500;
const SERVO_MAX_US = 2500;

// ==========================================
// 2. HARDWARE DRIVER LAYER (PCA9685)
// ==========================================
let pwm = null;

function initPwm() {
  return new Promise((resolve, reject) => {
    const options = {
      i2c: i2cBus.openSync(1), // /dev/i2c-1 on Raspberry Pi
      address: 0x40,
      frequency: 50,           // 50Hz standard analog/digital servo frequency
      debug: false,
    };

    pwm = new Pca9685Driver(options, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function angleToPulseUs(angle) {
  const clamped = Math.max(0, Math.min(180, angle));
  return Math.round(SERVO_MIN_US + (clamped / 180) * (SERVO_MAX_US - SERVO_MIN_US));
}

function setJoint(jointName, deltaDegrees) {
  const channel = CHANNELS[jointName];
  const targetAngle = NEUTRAL[jointName] + deltaDegrees * DIR[jointName];
  const pulseUs = angleToPulseUs(targetAngle);
  pwm.setPulseLength(channel, pulseUs);
}

function applyPose(pose) {
  for (const [joint, delta] of Object.entries(pose)) {
    setJoint(joint, delta);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// 3. POSTURES & GAIT MOVEMENTS
// ==========================================
async function standUp() {
  console.log("Standing up...");
  applyPose({
    FL_HIP: 0, FL_KNEE: 0,
    FR_HIP: 0, FR_KNEE: 0,
    BL_HIP: 0, BL_KNEE: 0,
    BR_HIP: 0, BR_KNEE: 0,
  });
  await sleep(600);
}

async function sitDown() {
  console.log("Sitting down...");
  applyPose({
    FL_HIP: 0, FL_KNEE: 35,
    FR_HIP: 0, FR_KNEE: 35,
    BL_HIP: 0, BL_KNEE: 35,
    BR_HIP: 0, BR_KNEE: 35,
  });
  await sleep(600);
}

/**
 * Executes a 4-phase diagonal trot gait.
 * direction: 1 for forward, -1 for backward
 */
async function trot(steps = 4, direction = 1) {
  const halfSwing = (GAIT.STEP_LENGTH / 2) * direction;
  const lift = GAIT.STEP_HEIGHT;

  for (let i = 0; i < steps; i++) {
    // Phase 1: Lift FL + BR and swing forward; push planted FR + BL backward
    applyPose({
      FL_HIP: halfSwing,  FL_KNEE: lift,
      BR_HIP: halfSwing,  BR_KNEE: lift,
      FR_HIP: -halfSwing, FR_KNEE: 0,
      BL_HIP: -halfSwing, BL_KNEE: 0,
    });
    await sleep(GAIT.PHASE_DELAY_MS);

    // Phase 2: Plant FL + BR
    applyPose({
      FL_HIP: halfSwing,  FL_KNEE: 0,
      BR_HIP: halfSwing,  BR_KNEE: 0,
      FR_HIP: -halfSwing, FR_KNEE: 0,
      BL_HIP: -halfSwing, BL_KNEE: 0,
    });
    await sleep(GAIT.PHASE_DELAY_MS);

    // Phase 3: Lift FR + BL and swing forward; push planted FL + BR backward
    applyPose({
      FR_HIP: halfSwing,  FR_KNEE: lift,
      BL_HIP: halfSwing,  BL_KNEE: lift,
      FL_HIP: -halfSwing, FL_KNEE: 0,
      BR_HIP: -halfSwing, BR_KNEE: 0,
    });
    await sleep(GAIT.PHASE_DELAY_MS);

    // Phase 4: Plant FR + BL
    applyPose({
      FR_HIP: halfSwing,  FR_KNEE: 0,
      BL_HIP: halfSwing,  BL_KNEE: 0,
      FL_HIP: -halfSwing, FL_KNEE: 0,
      BR_HIP: -halfSwing, BR_KNEE: 0,
    });
    await sleep(GAIT.PHASE_DELAY_MS);
  }
}

async function walkForward(steps = 4) {
  console.log(`Walking forward (${steps} cycles)...`);
  await trot(steps, 1);
  await standUp();
}

async function walkBackward(steps = 4) {
  console.log(`Walking backward (${steps} cycles)...`);
  await trot(steps, -1);
  await standUp();
}

/**
 * Pivots in place by driving left and right sides in opposite directions.
 * turnDir: 1 for right turn, -1 for left turn
 */
async function turn(steps = 4, turnDir = 1) {
  const halfSwing = (GAIT.STEP_LENGTH / 2) * turnDir;
  const lift = GAIT.STEP_HEIGHT;

  for (let i = 0; i < steps; i++) {
    // Lift FL + BR
    applyPose({
      FL_HIP: halfSwing,  FL_KNEE: lift,
      BR_HIP: -halfSwing, BR_KNEE: lift,
      FR_HIP: halfSwing,  FR_KNEE: 0,
      BL_HIP: -halfSwing, BL_KNEE: 0,
    });
    await sleep(GAIT.PHASE_DELAY_MS);

    // Plant FL + BR
    applyPose({
      FL_HIP: halfSwing,  FL_KNEE: 0,
      BR_HIP: -halfSwing, BR_KNEE: 0,
      FR_HIP: halfSwing,  FR_KNEE: 0,
      BL_HIP: -halfSwing, BL_KNEE: 0,
    });
    await sleep(GAIT.PHASE_DELAY_MS);

    // Lift FR + BL
    applyPose({
      FR_HIP: -halfSwing, FR_KNEE: lift,
      BL_HIP: halfSwing,  BL_KNEE: lift,
      FL_HIP: -halfSwing, FL_KNEE: 0,
      BR_HIP: halfSwing,  BR_KNEE: 0,
    });
    await sleep(GAIT.PHASE_DELAY_MS);

    // Plant FR + BL
    applyPose({
      FR_HIP: -halfSwing, FR_KNEE: 0,
      BL_HIP: halfSwing,  BL_KNEE: 0,
      FL_HIP: -halfSwing, FL_KNEE: 0,
      BR_HIP: halfSwing,  BR_KNEE: 0,
    });
    await sleep(GAIT.PHASE_DELAY_MS);
  }
  await standUp();
}

// ==========================================
// 4. MAIN EXECUTION & SAFE SHUTDOWN
// ==========================================
function releaseServos() {
  if (!pwm) return;
  for (const ch of Object.values(CHANNELS)) {
    pwm.channelOff(ch);
  }
}

process.on("SIGINT", () => {
  console.log("\nStopping and relaxing servos...");
  releaseServos();
  process.exit(0);
});

async function main() {
  try {
    await initPwm();
    console.log("PCA9685 initialized.");

    await standUp();
    await walkForward(5);
    await sleep(500);

    console.log("Turning right...");
    await turn(3, 1);
    await sleep(500);

    await walkBackward(5);
    await sleep(500);

    await sitDown();
    releaseServos();
    console.log("Done.");
  } catch (err) {
    console.error("Error running Sukibot script:", err);
    releaseServos();
  }
}

main();
