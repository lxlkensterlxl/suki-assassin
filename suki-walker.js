import time
from robot_hat import Servo

# --- Configuration ---
# Servo Channel Mapping (Adjust these to match your Sukibot's actual wiring)
FL_HIP_PIN = 0  # Front Left Hip
FL_KNEE_PIN = 1  # Front Left Knee
FR_HIP_PIN = 2  # Front Right Hip
FR_KNEE_PIN = 3  # Front Right Knee
BL_HIP_PIN = 4  # Back Left Hip
BL_KNEE_PIN = 5  # Back Left Knee
BR_HIP_PIN = 6  # Back Right Hip
BR_KNEE_PIN = 7  # Back Right Knee

# Servo Calibration (Adjust these values for your specific Sukibot)
# These values map to the PWM signal (often 0-180 degrees or 500-2500us)
# A good neutral (standing) position is usually around 90 degrees for all servos.
HIP_MIN = 60
HIP_MAX = 120
HIP_NEUTRAL = 90

KNEE_MIN = 60
KNEE_MAX = 120
KNEE_NEUTRAL = 90

# Walking Parameters
STEP_HEIGHT = 15  # How high the leg lifts (in degrees)
STEP_LENGTH = 20  # How far forward/backward the leg moves (in degrees)
WALK_SPEED = 0.05  # Delay between servo movements (in seconds) - lower is faster

# --- Initialization ---
# Initialize all servos
fl_hip = Servo(FL_HIP_PIN)
fl_knee = Servo(FL_KNEE_PIN)
fr_hip = Servo(FR_HIP_PIN)
fr_knee = Servo(FR_KNEE_PIN)
bl_hip = Servo(BL_HIP_PIN)
bl_knee = Servo(BL_KNEE_PIN)
br_hip = Servo(BR_HIP_PIN)
br_knee = Servo(BR_KNEE_PIN)

servos = [fl_hip, fl_knee, fr_hip, fr_knee, bl_hip, bl_knee, br_hip, br_knee]

def set_servos(angles):
    """Sets all 8 servos to the given angles."""
    fl_hip.angle(angles[0])
    fl_knee.angle(angles[1])
    fr_hip.angle(angles[2])
    fr_knee.angle(angles[3])
    bl_hip.angle(angles[4])
    bl_knee.angle(angles[5])
    br_hip.angle(angles[6])
    br_knee.angle(angles[7])

def stand_up():
    """Puts the robot into a neutral, standing position."""
    stand_angles = [
        HIP_NEUTRAL, KNEE_NEUTRAL,  # Front Left
        HIP_NEUTRAL, KNEE_NEUTRAL,  # Front Right
        HIP_NEUTRAL, KNEE_NEUTRAL,  # Back Left
        HIP_NEUTRAL, KNEE_NEUTRAL   # Back Right
    ]
    set_servos(stand_angles)
    time.sleep(1)  # Give it time to settle

def walk_forward(steps=5):
    """Makes the Sukibot walk forward."""
    print(f"Walking forward for {steps} steps...")

    for _ in range(steps):
        # --- Step Phase 1: Lift Front-Left (FL) and Back-Right (BR) legs ---
        # Lift them up (knee up) and prepare to move them back (hip back)
        target_angles_phase1 = [
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # FL
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # FR (planted)
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # BL (planted)
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT   # BR
        ]
        set_servos(target_angles_phase1)
        time.sleep(WALK_SPEED)

        # Move them forward while lifted
        target_angles_phase1_move = [
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # FL
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # FR (planted)
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # BL (planted)
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT   # BR
        ]
        set_servos(target_angles_phase1_move)
        time.sleep(WALK_SPEED)

        # Plant them (knee down)
        target_angles_phase1_plant = [
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # FL
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # FR (planted)
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # BL (planted)
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL               # BR
        ]
        set_servos(target_angles_phase1_plant)
        time.sleep(WALK_SPEED)

        # --- Step Phase 2: Lift Front-Right (FR) and Back-Left (BL) legs ---
        # Lift them up (knee up) and prepare to move them back (hip back)
        target_angles_phase2 = [
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # FL (planted)
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # FR
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # BL
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL               # BR (planted)
        ]
        set_servos(target_angles_phase2)
        time.sleep(WALK_SPEED)

        # Move them forward while lifted
        target_angles_phase2_move = [
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # FL (planted)
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # FR
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # BL
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL               # BR (planted)
        ]
        set_servos(target_angles_phase2_move)
        time.sleep(WALK_SPEED)

        # Plant them (knee down)
        target_angles_phase2_plant = [
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # FL (planted)
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # FR
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL,              # BL
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL               # BR (planted)
        ]
        set_servos(target_angles_phase2_plant)
        time.sleep(WALK_SPEED)

def walk_backward(steps=5):
    """Makes the Sukibot walk backward."""
    # This is the exact reverse logic of `walk_forward`
    print(f"Walking backward for {steps} steps...")

    for _ in range(steps):
         # --- Step Phase 1: Lift Front-Left (FL) and Back-Right (BR) legs ---
        target_angles_phase1 = [
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # FL
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,              # FR (planted)
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,              # BL (planted)
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT   # BR
        ]
        set_servos(target_angles_phase1)
        time.sleep(WALK_SPEED)

        # Move them backward while lifted
        target_angles_phase1_move = [
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # FL
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,              # FR (planted)
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,              # BL (planted)
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT   # BR
        ]
        set_servos(target_angles_phase1_move)
        time.sleep(WALK_SPEED)

        # Plant them
        target_angles_phase1_plant = [
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL
        ]
        set_servos(target_angles_phase1_plant)
        time.sleep(WALK_SPEED)

         # --- Step Phase 2: Lift Front-Right (FR) and Back-Left (BL) legs ---
        target_angles_phase2 = [
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,              # FL (planted)
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # FR
            HIP_NEUTRAL + (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # BL
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL               # BR (planted)
        ]
        set_servos(target_angles_phase2)
        time.sleep(WALK_SPEED)

        # Move them backward while lifted
        target_angles_phase2_move = [
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,              # FL (planted)
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # FR
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL - STEP_HEIGHT,  # BL
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL               # BR (planted)
        ]
        set_servos(target_angles_phase2_move)
        time.sleep(WALK_SPEED)

        # Plant them
        target_angles_phase2_plant = [
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL,
            HIP_NEUTRAL - (STEP_LENGTH/2), KNEE_NEUTRAL
        ]
        set_servos(target_angles_phase2_plant)
        time.sleep(WALK_SPEED)


def sit_down():
    """Puts the robot into a low, sitting position."""
    print("Sitting down.")
    sitting_angles = [
        HIP_NEUTRAL, KNEE_MAX,  # Front Left (Knees bent)
        HIP_NEUTRAL, KNEE_MAX,  # Front Right
        HIP_NEUTRAL, KNEE_MIN,  # Back Left (Knees bent the other way)
        HIP_NEUTRAL, KNEE_MIN   # Back Right
    ]
    set_servos(sitting_angles)
    time.sleep(1)

def turn_left(steps=5):
    # Turning requires rotating the hips in a specific pattern to pivot the body
    pass # Implementation is more complex; this is left for a more advanced script.

def main():
    print("Sukibot Walking Script Starting...")
    stand_up()

    # Main Sequence
    walk_forward(steps=5)
    time.sleep(1)
    walk_backward(steps=5)
    time.sleep(1)

    # Return to a safe resting position
    sit_down()
    print("Script finished.")

if __name__ == '__main__':
    main()

