// Comprehensive exercise database with expanded exercises for different equipment types
export const exerciseDatabase = {
  strength: {
    "full-body": [
      {
        name: "Barbell Squat",
        sets: 4,
        reps: "6-8",
        rest: "2-3 min",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand with feet shoulder-width apart, barbell across upper back. Bend knees and hips to lower until thighs are parallel to ground. Push through heels to return to starting position.",
      },
      {
        name: "Bench Press",
        sets: 4,
        reps: "6-8",
        rest: "2-3 min",
        equipment: ["barbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on bench with feet flat on floor. Grip barbell with hands slightly wider than shoulder-width. Lower bar to chest, then press back up to starting position.",
      },
      {
        name: "Deadlift",
        sets: 3,
        reps: "5-6",
        rest: "3 min",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Stand with feet hip-width apart, barbell over mid-foot. Bend at hips and knees to grip bar. Keep back flat, chest up, and pull bar up along legs until standing upright.",
      },
      {
        name: "Pull-ups",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["bodyweight"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hang from bar with hands slightly wider than shoulder-width. Pull body up until chin clears bar, then lower with control.",
      },
      {
        name: "Overhead Press",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells", "dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand with feet shoulder-width apart, holding weight at shoulder level. Press weight overhead until arms are fully extended, then lower back to shoulders.",
      },
      {
        name: "Barbell Rows",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Bend at hips with slight knee bend, back flat. Hold barbell with hands shoulder-width apart. Pull bar to lower chest, squeezing shoulder blades, then lower with control.",
      },
      {
        name: "Dips",
        sets: 3,
        reps: "8-12",
        rest: "2 min",
        equipment: ["bodyweight"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Support body on parallel bars with arms extended. Lower body by bending elbows until shoulders are below elbows. Push back up to starting position.",
      },
      {
        name: "Lunges",
        sets: 3,
        reps: "10-12 per leg",
        rest: "2 min",
        equipment: ["bodyweight", "dumbbells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand with feet hip-width apart. Step forward with one leg and lower body until both knees are bent at 90 degrees. Push through front heel to return to starting position.",
      },
      {
        name: "Face Pulls",
        sets: 3,
        reps: "12-15",
        rest: "1-2 min",
        equipment: ["cables"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand facing cable machine with rope attachment at head height. Pull rope toward face, separating ends as you pull and focusing on squeezing shoulder blades together.",
      },
      {
        name: "Plank",
        sets: 3,
        duration: "30-60 sec",
        rest: "1 min",
        equipment: ["bodyweight"],
        muscleGroup: "Core",
        instructions:
          "Start in push-up position with forearms on ground. Keep body in straight line from head to heels, engaging core muscles throughout.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell Swing",
        sets: 3,
        reps: "15-20",
        rest: "1-2 min",
        equipment: ["kettlebells"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Stand with feet shoulder-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then swing it between legs and up to shoulder height using hip drive.",
      },
      {
        name: "TRX Row",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["trx"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hold TRX handles with body at an angle, arms extended. Pull body up by bending elbows and squeezing shoulder blades, then lower with control.",
      },
      {
        name: "Resistance Band Chest Press",
        sets: 3,
        reps: "12-15",
        rest: "1-2 min",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Secure band behind you at chest height. Hold handles at chest level with elbows bent. Press hands forward until arms are extended, then return to starting position.",
      },
      {
        name: "Medicine Ball Slam",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["medicine ball"],
        muscleGroup: "Core",
        instructions:
          "Stand with feet shoulder-width apart, medicine ball overhead. Forcefully throw ball to ground while bending at hips. Catch ball on bounce or pick it up and repeat.",
      },
    ],
    "upper-body": [
      {
        name: "Bench Press",
        sets: 4,
        reps: "6-8",
        rest: "2-3 min",
        equipment: ["barbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on bench with feet flat on floor. Grip barbell with hands slightly wider than shoulder-width. Lower bar to chest, then press back up to starting position.",
      },
      {
        name: "Bent Over Rows",
        sets: 4,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells", "dumbbells"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Bend at hips with slight knee bend, back flat. Hold weight with hands shoulder-width apart. Pull weight to lower chest, squeezing shoulder blades, then lower with control.",
      },
      {
        name: "Overhead Press",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells", "dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand with feet shoulder-width apart, holding weight at shoulder level. Press weight overhead until arms are fully extended, then lower back to shoulders.",
      },
      {
        name: "Pull-ups",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["bodyweight"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hang from bar with hands slightly wider than shoulder-width. Pull body up until chin clears bar, then lower with control.",
      },
      {
        name: "Tricep Dips",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["bodyweight", "machine"],
        muscleGroup: "Arms",
        instructions:
          "Support body on parallel bars with arms extended. Lower body by bending elbows until shoulders are below elbows. Push back up to starting position.",
      },
      {
        name: "Incline Dumbbell Press",
        sets: 3,
        reps: "8-12",
        rest: "2 min",
        equipment: ["dumbbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on incline bench with dumbbells at shoulder level. Press weights up until arms are extended, then lower back to starting position.",
      },
      {
        name: "Lat Pulldown",
        sets: 3,
        reps: "10-12",
        rest: "2 min",
        equipment: ["machine", "cables"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Sit at lat pulldown machine with thighs secured. Grip bar with hands wider than shoulder-width. Pull bar down to upper chest, then slowly return to starting position.",
      },
      {
        name: "Lateral Raises",
        sets: 3,
        reps: "12-15",
        rest: "1-2 min",
        equipment: ["dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand with feet shoulder-width apart, holding dumbbells at sides. Raise arms out to sides until parallel with floor, then lower with control.",
      },
      {
        name: "Bicep Curls",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["dumbbells", "barbells"],
        muscleGroup: "Arms",
        instructions:
          "Stand with feet shoulder-width apart, holding weights with arms extended. Curl weights toward shoulders, keeping elbows close to body, then lower with control.",
      },
      {
        name: "Tricep Pushdowns",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["cables"],
        muscleGroup: "Arms",
        instructions:
          "Stand facing cable machine with rope or bar attachment at chest height. Push attachment down until arms are fully extended, keeping elbows close to body.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell Single-Arm Press",
        sets: 3,
        reps: "8-10 per arm",
        rest: "1-2 min",
        equipment: ["kettlebells"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand with feet shoulder-width apart, holding kettlebell at shoulder level. Press kettlebell overhead until arm is fully extended, then lower back to shoulder.",
      },
      {
        name: "TRX Chest Press",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["trx"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Face away from TRX anchor with handles at chest level, feet forward to create angle. Lower chest toward hands by bending elbows, then push back to starting position.",
      },
      {
        name: "Resistance Band Pull-Apart",
        sets: 3,
        reps: "15-20",
        rest: "1 min",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hold band with hands at shoulder width, arms extended in front. Pull band apart by moving hands outward, squeezing shoulder blades together, then return to starting position.",
      },
      // For Upper Body Push with resistance bands
      {
        name: "Resistance Band Chest Press",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Stand with feet shoulder-width apart, resistance band behind your back. Hold handles at chest level with elbows bent. Press hands forward until arms are extended, then return to starting position.",
      },
      {
        name: "Resistance Band Push-ups",
        sets: 3,
        reps: "10-12",
        rest: "60 sec",
        equipment: ["resistance bands", "bodyweight"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Place a resistance band across your upper back, holding ends with hands on the floor in push-up position. Perform push-ups against the band's resistance, focusing on controlled movement.",
      },
      {
        name: "Resistance Band Incline Press",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Secure band at mid-height. Face away from anchor, holding handles at chest level. Step forward to create tension. Press forward until arms extend, then return to starting position.",
      },
      {
        name: "Resistance Band Chest Flyes",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Secure band behind you at chest height. Hold handles with arms extended to sides. Bring hands together in front of chest in an arc motion, then return to starting position with controlled movement.",
      },

      // For Upper Body Pull with resistance bands
      {
        name: "Resistance Band Rows",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Secure band at chest height. Sit or stand facing anchor point. Hold handles with arms extended, then pull elbows back, squeezing shoulder blades together. Return to starting position with control.",
      },
      {
        name: "Resistance Band Lat Pulldowns",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Secure band to a high anchor point. Kneel or sit facing anchor. Grasp band with arms extended overhead, then pull down toward shoulders, focusing on engaging lats. Return to starting position slowly.",
      },
      {
        name: "Resistance Band Pull-Aparts",
        sets: 3,
        reps: "15-20",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hold band with hands at shoulder width, arms extended in front. Pull band apart by moving hands outward, squeezing shoulder blades together, then return to starting position.",
      },
      {
        name: "Resistance Band Face Pulls",
        sets: 3,
        reps: "15-20",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Secure band at head height. Stand facing anchor point. Pull band toward face with elbows high, separating hands as you pull. Focus on squeezing shoulder blades together.",
      },
      {
        name: "Resistance Band Single-Arm Rows",
        sets: 3,
        reps: "12-15 per arm",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Secure band at chest height. Stand sideways to anchor point. Grasp handle with outside hand, then pull elbow back while keeping torso stable. Return to starting position with control.",
      },

      // For Arms with resistance bands
      {
        name: "Resistance Band Bicep Curls",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Arms",
        instructions:
          "Stand on middle of band with feet shoulder-width apart. Hold handles with palms facing forward. Curl hands toward shoulders while keeping elbows stationary, then lower with control.",
      },
      {
        name: "Resistance Band Hammer Curls",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Arms",
        instructions:
          "Stand on middle of band with feet shoulder-width apart. Hold handles with palms facing each other. Curl hands toward shoulders while maintaining neutral grip, then lower with control.",
      },
      {
        name: "Resistance Band Tricep Extensions",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Arms",
        instructions:
          "Secure band at head height behind you. Face away from anchor point. Hold handle with both hands behind head, elbows bent. Extend arms overhead, then return to starting position.",
      },
      {
        name: "Resistance Band Tricep Pushdowns",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Arms",
        instructions:
          "Secure band at head height. Stand facing anchor point. Hold handle with both hands at chest level, elbows bent. Push hands down until arms are fully extended, then return to starting position.",
      },
      {
        name: "Resistance Band Concentration Curls",
        sets: 3,
        reps: "12-15 per arm",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Arms",
        instructions:
          "Sit on chair with legs spread. Place band under foot, holding other end with arm extended. Curl hand toward shoulder while keeping upper arm against inner thigh, then lower with control.",
      },
      {
        name: "Resistance Band Skull Crushers",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Arms",
        instructions:
          "Lie on back with band secured under shoulders. Hold handles with arms extended upward. Bend elbows to lower hands toward forehead, keeping upper arms stationary, then extend arms back up.",
      },

      // For Shoulders with resistance bands
      {
        name: "Resistance Band Shoulder Press",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand on band with feet shoulder-width apart. Hold handles at shoulder level, palms facing forward. Press hands overhead until arms are extended, then lower with control.",
      },
      {
        name: "Resistance Band Lateral Raises",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand on middle of band with feet close together. Hold handles at sides, palms facing in. Raise arms out to sides until parallel with floor, then lower with control.",
      },
      {
        name: "Resistance Band Front Raises",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand on middle of band with feet shoulder-width apart. Hold handles in front of thighs, palms facing back. Raise arms forward until parallel with floor, then lower with control.",
      },
      {
        name: "Resistance Band Upright Rows",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand on middle of band with feet shoulder-width apart. Hold handles in front of thighs, palms facing body. Pull hands up toward chin, leading with elbows, then lower with control.",
      },
      {
        name: "Resistance Band Reverse Flyes",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Shoulders",
        instructions:
          "Secure band at chest height. Stand facing anchor point. Hold handles with arms extended forward. Pull arms out to sides, squeezing shoulder blades together, then return to starting position.",
      },
      {
        name: "Resistance Band External Rotations",
        sets: 3,
        reps: "12-15 per arm",
        rest: "30 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Shoulders",
        instructions:
          "Secure band at elbow height. Stand sideways to anchor point. Hold handle with elbow bent 90 degrees, upper arm against side. Rotate forearm outward against resistance, then return to starting position.",
      },
    ],
    "lower-body": [
      {
        name: "Barbell Squat",
        sets: 4,
        reps: "6-8",
        rest: "2-3 min",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand with feet shoulder-width apart, barbell across upper back. Bend knees and hips to lower until thighs are parallel to ground. Push through heels to return to starting position.",
      },
      {
        name: "Deadlift",
        sets: 3,
        reps: "5-6",
        rest: "3 min",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Stand with feet hip-width apart, barbell over mid-foot. Bend at hips and knees to grip bar. Keep back flat, chest up, and pull bar up along legs until standing upright.",
      },
      {
        name: "Leg Press",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit in leg press machine with feet shoulder-width apart on platform. Lower platform by bending knees until they're at 90 degrees, then push back to starting position.",
      },
      {
        name: "Romanian Deadlift",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells", "dumbbells"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Stand with feet hip-width apart, holding weight in front of thighs. Hinge at hips to lower weight along legs while maintaining slight knee bend and flat back.",
      },
      {
        name: "Calf Raises",
        sets: 3,
        reps: "12-15",
        rest: "1 min",
        equipment: ["bodyweight", "machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand with balls of feet on elevated surface, heels hanging off. Lower heels toward floor, then raise up onto toes as high as possible.",
      },
      {
        name: "Leg Extensions",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit in leg extension machine with pads on front of ankles. Extend legs until knees are straight, then lower with control.",
      },
      {
        name: "Leg Curls",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["machine"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Lie face down on leg curl machine with pads behind ankles. Curl legs up by bending knees, bringing heels toward buttocks, then lower with control.",
      },
      {
        name: "Hip Thrusts",
        sets: 3,
        reps: "10-12",
        rest: "2 min",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit with upper back against bench, barbell across hips. Plant feet firmly on ground and thrust hips upward until body forms straight line from shoulders to knees.",
      },
      {
        name: "Bulgarian Split Squats",
        sets: 3,
        reps: "8-10 per leg",
        rest: "2 min",
        equipment: ["dumbbells", "bodyweight"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand with one foot forward and one foot elevated behind on bench. Lower body by bending front knee until thigh is parallel to ground, then push back up.",
      },
      {
        name: "Glute-Ham Raises",
        sets: 3,
        reps: "8-12",
        rest: "2 min",
        equipment: ["machine", "bodyweight"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Position body in glute-ham developer with feet secured. Start with body upright, then lower torso toward ground by bending at hips while keeping back straight.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell Goblet Squat",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["kettlebells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Hold kettlebell close to chest with both hands. Stand with feet slightly wider than shoulder-width. Squat down until thighs are parallel to ground, then push through heels to stand.",
      },
      {
        name: "Resistance Band Lateral Walk",
        sets: 3,
        reps: "15-20 steps each direction",
        rest: "1 min",
        equipment: ["resistance bands"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Place resistance band around legs just above knees. Take small steps sideways while maintaining tension on band, keeping feet parallel and knees slightly bent.",
      },
      {
        name: "TRX Hamstring Curl",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["trx"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Lie on back with heels in TRX straps. Lift hips off ground, then pull heels toward buttocks by bending knees. Return to starting position with control.",
      },
    ],
    push: [
      {
        name: "Bench Press",
        sets: 4,
        reps: "6-8",
        rest: "2-3 min",
        equipment: ["barbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on bench with feet flat on floor. Grip barbell with hands slightly wider than shoulder-width. Lower bar to chest, then press back up to starting position.",
      },
      {
        name: "Overhead Press",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells", "dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand with feet shoulder-width apart, holding weight at shoulder level. Press weight overhead until arms are fully extended, then lower back to shoulders.",
      },
      {
        name: "Incline Bench Press",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells", "dumbbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on incline bench with feet flat on floor. Grip weight with hands slightly wider than shoulder-width. Lower weight to upper chest, then press back up to starting position.",
      },
      {
        name: "Dips",
        sets: 3,
        reps: "8-12",
        rest: "2 min",
        equipment: ["bodyweight"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Support body on parallel bars with arms extended. Lower body by bending elbows until shoulders are below elbows. Push back up to starting position.",
      },
      {
        name: "Tricep Pushdowns",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["cables"],
        muscleGroup: "Arms",
        instructions:
          "Stand facing cable machine with rope or bar attachment at chest height. Push attachment down until arms are fully extended, keeping elbows close to body.",
      },
      {
        name: "Lateral Raises",
        sets: 3,
        reps: "12-15",
        rest: "1-2 min",
        equipment: ["dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand with feet shoulder-width apart, holding dumbbells at sides. Raise arms out to sides until parallel with floor, then lower with control.",
      },
      {
        name: "Chest Flyes",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["dumbbells", "cables", "machine"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on bench with weights extended above chest, slight bend in elbows. Lower weights out to sides in arc motion, feeling stretch in chest, then bring weights back together.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell Floor Press",
        sets: 3,
        reps: "8-10 per arm",
        rest: "1-2 min",
        equipment: ["kettlebells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on floor with kettlebell at shoulder level. Press kettlebell up until arm is extended, then lower back to starting position.",
      },
      {
        name: "Medicine Ball Chest Pass",
        sets: 3,
        reps: "10-12",
        rest: "1 min",
        equipment: ["medicine ball"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Stand facing wall with medicine ball at chest level. Throw ball forcefully against wall by extending arms, then catch and repeat.",
      },
      {
        name: "Resistance Band Chest Press",
        sets: 3,
        reps: "12-15",
        rest: "1 min",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Secure band behind you at chest height. Hold handles at chest level with elbows bent. Press hands forward until arms are extended, then return to starting position.",
      },
    ],
    pull: [
      {
        name: "Pull-ups",
        sets: 4,
        reps: "6-10",
        rest: "2 min",
        equipment: ["bodyweight"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hang from bar with hands slightly wider than shoulder-width. Pull body up until chin clears bar, then lower with control.",
      },
      {
        name: "Barbell Rows",
        sets: 4,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Bend at hips with slight knee bend, back flat. Hold barbell with hands shoulder-width apart. Pull bar to lower chest, squeezing shoulder blades, then lower with control.",
      },
      {
        name: "Deadlift",
        sets: 3,
        reps: "5-6",
        rest: "3 min",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Stand with feet hip-width apart, barbell over mid-foot. Bend at hips and knees to grip bar. Keep back flat, chest up, and pull bar up along legs until standing upright.",
      },
      {
        name: "Lat Pulldown",
        sets: 3,
        reps: "10-12",
        rest: "2 min",
        equipment: ["machine", "cables"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Sit at lat pulldown machine with thighs secured. Grip bar with hands wider than shoulder-width. Pull bar down to upper chest, then slowly return to starting position.",
      },
      {
        name: "Face Pulls",
        sets: 3,
        reps: "12-15",
        rest: "1-2 min",
        equipment: ["cables"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand facing cable machine with rope attachment at head height. Pull rope toward face, separating ends as you pull and focusing on squeezing shoulder blades together.",
      },
      {
        name: "Bicep Curls",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["dumbbells", "barbells"],
        muscleGroup: "Arms",
        instructions:
          "Stand with feet shoulder-width apart, holding weights with arms extended. Curl weights toward shoulders, keeping elbows close to body, then lower with control.",
      },
      {
        name: "Hammer Curls",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["dumbbells"],
        muscleGroup: "Arms",
        instructions:
          "Stand with feet shoulder-width apart, holding dumbbells with palms facing each other. Curl weights toward shoulders while maintaining neutral grip, then lower with control.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell High Pull",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["kettlebells"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Stand with feet shoulder-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then explosively pull it up to shoulder height, leading with elbows.",
      },
      {
        name: "TRX Row",
        sets: 3,
        reps: "10-12",
        rest: "1-2 min",
        equipment: ["trx"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hold TRX handles with body at an angle, arms extended. Pull body up by bending elbows and squeezing shoulder blades, then lower with control.",
      },
      {
        name: "Resistance Band Pull-Apart",
        sets: 3,
        reps: "15-20",
        rest: "1 min",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hold band with hands at shoulder width, arms extended in front. Pull band apart by moving hands outward, squeezing shoulder blades together, then return to starting position.",
      },
    ],
    split: [
      {
        name: "Bench Press",
        sets: 4,
        reps: "6-8",
        rest: "2-3 min",
        equipment: ["barbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on bench with feet flat on floor. Grip barbell with hands slightly wider than shoulder-width. Lower bar to chest, then press back up to starting position.",
      },
      {
        name: "Squat",
        sets: 4,
        reps: "6-8",
        rest: "2-3 min",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand with feet shoulder-width apart, barbell across upper back. Bend knees and hips to lower until thighs are parallel to ground. Push through heels to return to starting position.",
      },
      {
        name: "Pull-ups",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["bodyweight"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hang from bar with hands slightly wider than shoulder-width. Pull body up until chin clears bar, then lower with control.",
      },
      {
        name: "Romanian Deadlift",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Stand with feet hip-width apart, holding barbell in front of thighs. Hinge at hips to lower barbell along legs while maintaining slight knee bend and flat back.",
      },
      {
        name: "Overhead Press",
        sets: 3,
        reps: "8-10",
        rest: "2 min",
        equipment: ["barbells", "dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand with feet shoulder-width apart, holding weight at shoulder level. Press weight overhead until arms are fully extended, then lower back to shoulders.",
      },
      {
        name: "Leg Press",
        sets: 3,
        reps: "10-12",
        rest: "2 min",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit in leg press machine with feet shoulder-width apart on platform. Lower platform by bending knees until they're at 90 degrees, then push back to starting position.",
      },
      {
        name: "Lat Pulldown",
        sets: 3,
        reps: "10-12",
        rest: "2 min",
        equipment: ["machine", "cables"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Sit at lat pulldown machine with thighs secured. Grip bar with hands wider than shoulder-width. Pull bar down to upper chest, then slowly return to starting position.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell Turkish Get-Up",
        sets: 2,
        reps: "5 per side",
        rest: "2 min",
        equipment: ["kettlebells"],
        muscleGroup: "Core",
        instructions:
          "Lie on back with kettlebell held in one hand above shoulder. Rise to standing position while keeping kettlebell overhead, then reverse movement to return to starting position.",
      },
      {
        name: "TRX Pistol Squat",
        sets: 3,
        reps: "6-8 per leg",
        rest: "1-2 min",
        equipment: ["trx"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Hold TRX handles for support. Extend one leg forward while squatting down on the other leg. Return to standing position using supporting leg.",
      },
      {
        name: "Medicine Ball Rotational Throw",
        sets: 3,
        reps: "8-10 per side",
        rest: "1 min",
        equipment: ["medicine ball"],
        muscleGroup: "Core",
        instructions:
          "Stand perpendicular to wall with feet shoulder-width apart. Rotate away from wall, then explosively rotate toward wall while throwing medicine ball against it.",
      },
    ],
  },
  cardio: {
    "full-body": [
      {
        name: "Jump Rope",
        duration: "5 min",
        intensity: "Moderate",
        equipment: ["jump rope"],
        instructions:
          "Hold rope handles with relaxed grip. Jump just high enough to clear rope, landing softly on balls of feet. Keep elbows close to body and rotate rope with wrists.",
      },
      {
        name: "Burpees",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start standing, then squat down and place hands on floor. Jump feet back to plank position, perform a push-up, jump feet forward to squat, then explosively jump up with arms overhead.",
      },
      {
        name: "Mountain Climbers",
        sets: 3,
        reps: "20 per leg",
        rest: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start in plank position with arms straight. Alternately drive knees toward chest in running motion while maintaining stable upper body and core engagement.",
      },
      {
        name: "Jumping Jacks",
        duration: "3 min",
        intensity: "High",
        equipment: ["bodyweight"],
        instructions:
          "Stand with feet together and arms at sides. Simultaneously jump feet apart and raise arms overhead, then jump back to starting position.",
      },
      {
        name: "High Knees",
        duration: "2 min",
        intensity: "High",
        equipment: ["bodyweight"],
        instructions:
          "Run in place, lifting knees to hip height with each step. Maintain upright posture and pump arms in running motion.",
      },
      {
        name: "Kettlebell Swings",
        sets: 3,
        reps: "15-20",
        rest: "45 sec",
        equipment: ["kettlebells"],
        instructions:
          "Stand with feet shoulder-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then swing it between legs and up to shoulder height using hip drive.",
      },
      {
        name: "Box Jumps",
        sets: 3,
        reps: "12",
        rest: "45 sec",
        equipment: ["box"],
        instructions:
          "Stand facing box with feet shoulder-width apart. Lower into quarter squat, then explosively jump onto box, landing softly with knees slightly bent.",
      },
      {
        name: "Battle Ropes",
        sets: 3,
        duration: "30 sec",
        rest: "30 sec",
        equipment: ["ropes"],
        instructions:
          "Stand with feet shoulder-width apart, holding one rope end in each hand. Create waves by alternately raising and lowering arms, or move both arms simultaneously.",
      },
      {
        name: "Rowing Machine",
        duration: "5 min",
        intensity: "High",
        equipment: ["machine"],
        instructions:
          "Sit on rower with feet secured on footplates. Grab handle with both hands. Push with legs, lean back slightly, then pull handle to lower ribs. Return to starting position by extending arms, leaning forward, then bending knees.",
      },
      {
        name: "Assault Bike",
        duration: "3 min",
        intensity: "Very High",
        equipment: ["machine"],
        instructions:
          "Sit on bike with feet on pedals and hands on handles. Simultaneously push with legs and pull/push with arms in coordinated motion.",
      },
      // Additional equipment-specific exercises
      {
        name: "TRX Jump Squats",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["trx"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Hold TRX straps with feet shoulder-width apart. Lower into squat position, then explosively jump up while maintaining grip on straps.",
      },
      {
        name: "Medicine Ball Slams",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["medicine ball"],
        instructions:
          "Stand with feet shoulder-width apart, medicine ball overhead. Forcefully throw ball to ground while bending at hips. Catch ball on bounce or pick it up and repeat.",
      },
      {
        name: "Resistance Band Jumping Jacks",
        sets: 3,
        duration: "30 sec",
        rest: "30 sec",
        equipment: ["resistance bands"],
        instructions:
          "Place resistance band under feet and hold handles at sides. Perform jumping jacks against band resistance, feeling tension in shoulders and upper back.",
      },
    ],
    "upper-body": [
      {
        name: "Battle Ropes",
        sets: 3,
        duration: "30 sec",
        rest: "30 sec",
        equipment: ["ropes"],
        instructions:
          "Stand with feet shoulder-width apart, holding one rope end in each hand. Create waves by alternately raising and lowering arms, or move both arms simultaneously.",
      },
      {
        name: "Push-up Burpees",
        sets: 3,
        reps: "10",
        rest: "45 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start standing, then squat down and place hands on floor. Jump feet back to plank position, perform a push-up, jump feet forward to squat, then explosively jump up with arms overhead.",
      },
      {
        name: "Medicine Ball Slams",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["medicine ball"],
        instructions:
          "Stand with feet shoulder-width apart, medicine ball overhead. Forcefully throw ball to ground while bending at hips. Catch ball on bounce or pick it up and repeat.",
      },
      {
        name: "Boxing Punches",
        duration: "3 min",
        intensity: "High",
        equipment: ["bodyweight"],
        instructions:
          "Stand in boxing stance with knees slightly bent. Throw various punch combinations (jabs, crosses, hooks, uppercuts) with proper form and rotation.",
      },
      {
        name: "Plank Shoulder Taps",
        sets: 3,
        reps: "20 total",
        rest: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start in plank position with arms straight. Alternately lift one hand to tap opposite shoulder while maintaining stable hips and core engagement.",
      },
      {
        name: "Kettlebell Clean and Press",
        sets: 3,
        reps: "10 per side",
        rest: "45 sec",
        equipment: ["kettlebells"],
        instructions:
          "Stand with feet shoulder-width apart, kettlebell between feet. Hinge at hips to grip kettlebell, then explosively pull it to shoulder in clean motion. Press kettlebell overhead, then return to starting position.",
      },
      {
        name: "TRX Rows",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["trx"],
        instructions:
          "Hold TRX handles with body at an angle, arms extended. Pull body up by bending elbows and squeezing shoulder blades, then lower with control.",
      },
      {
        name: "Dumbbell Thrusters",
        sets: 3,
        reps: "12",
        rest: "45 sec",
        equipment: ["dumbbells"],
        instructions:
          "Hold dumbbells at shoulder level, feet shoulder-width apart. Lower into squat position, then explosively stand while pressing dumbbells overhead. Return to starting position.",
      },
      {
        name: "Renegade Rows",
        sets: 3,
        reps: "10 per side",
        rest: "45 sec",
        equipment: ["dumbbells"],
        instructions:
          "Start in plank position with hands on dumbbells. Perform a row by pulling one dumbbell to hip while stabilizing body, then lower and repeat on other side.",
      },
      // Additional equipment-specific exercises
      {
        name: "Resistance Band Push-Pull",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["resistance bands"],
        instructions:
          "Secure band at chest height. Stand facing anchor point. Push hands forward until arms extend, then pull elbows back in rowing motion. Alternate between pushing and pulling movements.",
      },
      {
        name: "Medicine Ball Push-ups",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["medicine ball"],
        instructions:
          "Place one hand on medicine ball, other hand on floor in push-up position. Perform push-up, then roll ball to other hand and repeat.",
      },
    ],
    "lower-body": [
      {
        name: "Jump Squats",
        sets: 4,
        reps: "15",
        rest: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Stand with feet shoulder-width apart. Lower into squat position, then explosively jump up. Land softly by bending knees, and immediately lower into next rep.",
      },
      {
        name: "Box Jumps",
        sets: 3,
        reps: "12",
        rest: "45 sec",
        equipment: ["box"],
        instructions:
          "Stand facing box with feet shoulder-width apart. Lower into quarter squat, then explosively jump onto box, landing softly with knees slightly bent.",
      },
      {
        name: "Lunge Jumps",
        sets: 3,
        reps: "10 per leg",
        rest: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start in lunge position with one foot forward, both knees bent. Jump up explosively, switching leg positions in mid-air. Land softly and immediately lower into next rep.",
      },
      {
        name: "Speed Skaters",
        sets: 3,
        reps: "20 total",
        rest: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Jump laterally from one foot to the other, mimicking speed skating motion. Land softly on outside foot while bringing other foot behind, touching floor lightly for balance if needed.",
      },
      {
        name: "Hill Sprints",
        sets: 5,
        duration: "30 sec",
        rest: "1 min",
        equipment: ["bodyweight"],
        instructions:
          "Find moderate incline. Sprint uphill at maximum effort, focusing on powerful arm drive and knee lift. Walk back down for recovery.",
      },
      {
        name: "Kettlebell Swings",
        sets: 3,
        reps: "20",
        rest: "45 sec",
        equipment: ["kettlebells"],
        instructions:
          "Stand with feet shoulder-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then swing it between legs and up to shoulder height using hip drive.",
      },
      {
        name: "Sled Push",
        sets: 3,
        distance: "20m",
        rest: "1 min",
        equipment: ["sled"],
        instructions:
          "Position hands on sled handles, arms extended, with body leaning forward. Drive with legs in running motion to push sled forward, maintaining low body position throughout.",
      },
      {
        name: "Step-ups",
        sets: 3,
        reps: "15 per leg",
        rest: "45 sec",
        equipment: ["box", "bodyweight"],
        instructions:
          "Stand facing box or bench. Step one foot completely onto box, driving through heel to lift body up. Step down with same foot, then repeat on other side.",
      },
      {
        name: "Jumping Rope",
        duration: "3 min",
        intensity: "High",
        equipment: ["jump rope"],
        instructions:
          "Hold rope handles with relaxed grip. Jump just high enough to clear rope, landing softly on balls of feet. Keep elbows close to body and rotate rope with wrists.",
      },
      // Additional equipment-specific exercises
      {
        name: "Resistance Band Squat Jumps",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["resistance bands"],
        instructions:
          "Place resistance band under feet and hold handles at shoulder level. Perform squat jumps against band resistance, focusing on explosive upward movement.",
      },
      {
        name: "TRX Suspended Lunges",
        sets: 3,
        reps: "10 per leg",
        rest: "45 sec",
        equipment: ["trx"],
        instructions:
          "Place one foot in TRX foot cradle. Lower into lunge position with suspended leg extended behind you. Push through front heel to return to standing position.",
      },
      {
        name: "Medicine Ball Squat Throws",
        sets: 3,
        reps: "12",
        rest: "45 sec",
        equipment: ["medicine ball"],
        instructions:
          "Stand facing wall with medicine ball at chest. Lower into squat, then explosively stand while throwing ball against wall at chest height. Catch ball on rebound and immediately lower into next rep.",
      },
    ],
    push: [
      {
        name: "Push-up Variations",
        sets: 4,
        reps: "15",
        rest: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Perform different push-up variations (standard, wide, diamond, decline) in sequence. Maintain rigid plank position throughout, lowering chest toward floor and pushing back up to straight-arm position.",
      },
      {
        name: "Medicine Ball Chest Pass",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["medicine ball"],
        instructions:
          "Stand facing wall with medicine ball at chest. Throw ball forcefully against wall by extending arms, then catch and repeat.",
      },
      {
        name: "Dumbbell Punches",
        sets: 3,
        reps: "20 per arm",
        rest: "30 sec",
        equipment: ["dumbbells"],
        instructions:
          "Hold light dumbbells at shoulder height. Extend one arm forward in punching motion while rotating torso slightly, then return to starting position and repeat with other arm.",
      },
      {
        name: "Plyo Push-ups",
        sets: 3,
        reps: "10",
        rest: "45 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start in push-up position. Lower chest toward floor, then push up explosively so hands leave ground. Land softly and immediately lower into next rep.",
      },
      {
        name: "Kettlebell Press",
        sets: 3,
        reps: "12 per arm",
        rest: "30 sec",
        equipment: ["kettlebells"],
        instructions:
          "Hold kettlebell at shoulder level with elbow close to body. Press kettlebell overhead until arm is fully extended, then lower back to shoulder with control.",
      },
      {
        name: "Burpees",
        sets: 3,
        reps: "12",
        rest: "45 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start standing, then squat down and place hands on floor. Jump feet back to plank position, perform a push-up, jump feet forward to squat, then explosively jump up with arms overhead.",
      },
      // Additional equipment-specific exercises
      {
        name: "TRX Push-ups",
        sets: 3,
        reps: "12-15",
        rest: "45 sec",
        equipment: ["trx"],
        instructions:
          "Hold TRX handles with arms extended, body at an angle. Lower chest between handles by bending elbows, then push back up to starting position.",
      },
      {
        name: "Resistance Band Chest Press",
        sets: 3,
        reps: "15-20",
        rest: "30 sec",
        equipment: ["resistance bands"],
        instructions:
          "Secure band behind you at chest height. Hold handles at chest level with elbows bent. Press hands forward until arms are extended, then return to starting position.",
      },
    ],
    pull: [
      {
        name: "Battle Ropes",
        sets: 4,
        duration: "30 sec",
        rest: "30 sec",
        equipment: ["ropes"],
        instructions:
          "Stand with feet shoulder-width apart, holding one rope end in each hand. Create waves by alternately raising and lowering arms, or move both arms simultaneously.",
      },
      {
        name: "TRX Rows",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["trx"],
        instructions:
          "Hold TRX handles with body at an angle, arms extended. Pull body up by bending elbows and squeezing shoulder blades, then lower with control.",
      },
      {
        name: "Kettlebell High Pulls",
        sets: 3,
        reps: "12",
        rest: "30 sec",
        equipment: ["kettlebells"],
        instructions:
          "Stand with feet shoulder-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then explosively pull it up to shoulder height, leading with elbows.",
      },
      {
        name: "Renegade Rows",
        sets: 3,
        reps: "10 per side",
        rest: "45 sec",
        equipment: ["dumbbells"],
        instructions:
          "Start in plank position with hands on dumbbells. Perform a row by pulling one dumbbell to hip while stabilizing body, then lower and repeat on other side.",
      },
      {
        name: "Medicine Ball Slams",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["medicine ball"],
        instructions:
          "Stand with feet shoulder-width apart, medicine ball overhead. Forcefully throw ball to ground while bending at hips. Catch ball on bounce or pick it up and repeat.",
      },
      {
        name: "Band Pull-Aparts",
        sets: 3,
        reps: "20",
        rest: "30 sec",
        equipment: ["resistance bands"],
        instructions:
          "Hold band with hands at shoulder width, arms extended in front. Pull band apart by moving hands outward, squeezing shoulder blades together, then return to starting position.",
      },
      // Additional equipment-specific exercises
      {
        name: "Suspension Trainer Face Pulls",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["trx"],
        instructions:
          "Hold TRX handles with arms extended forward. Pull handles toward face while spreading hands apart, focusing on squeezing shoulder blades together.",
      },
      {
        name: "Resistance Band Bent-Over Row",
        sets: 3,
        reps: "15-20",
        rest: "30 sec",
        equipment: ["resistance bands"],
        instructions:
          "Stand on middle of band with feet shoulder-width apart. Hinge at hips with slight knee bend. Pull handles to sides of torso, squeezing shoulder blades together.",
      },
    ],
    split: [
      {
        name: "Jumping Jacks",
        duration: "3 min",
        intensity: "Moderate",
        equipment: ["bodyweight"],
        instructions:
          "Stand with feet together and arms at sides. Simultaneously jump feet apart and raise arms overhead, then jump back to starting position.",
      },
      {
        name: "Mountain Climbers",
        sets: 3,
        reps: "20 per leg",
        rest: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start in plank position with arms straight. Alternately drive knees toward chest in running motion while maintaining stable upper body and core engagement.",
      },
      {
        name: "Kettlebell Swings",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["kettlebells"],
        instructions:
          "Stand with feet shoulder-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then swing it between legs and up to shoulder height using hip drive.",
      },
      {
        name: "Jump Squats",
        sets: 3,
        reps: "15",
        rest: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Stand with feet shoulder-width apart. Lower into squat position, then explosively jump up. Land softly by bending knees, and immediately lower into next rep.",
      },
      {
        name: "Push-up to Row",
        sets: 3,
        reps: "10",
        rest: "45 sec",
        equipment: ["dumbbells"],
        instructions:
          "Start in push-up position with hands on dumbbells. Perform push-up, then row one dumbbell to hip while stabilizing body. Lower dumbbell, then repeat push-up and row with other arm.",
      },
      {
        name: "Burpees",
        sets: 3,
        reps: "10",
        rest: "45 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start standing, then squat down and place hands on floor. Jump feet back to plank position, perform a push-up, jump feet forward to squat, then explosively jump up with arms overhead.",
      },
      // Additional equipment-specific exercises
      {
        name: "TRX Jump Lunges",
        sets: 3,
        reps: "10 per leg",
        rest: "45 sec",
        equipment: ["trx"],
        instructions:
          "Hold TRX handles for support. Perform alternating jump lunges, switching legs in mid-air and landing softly in lunge position.",
      },
      {
        name: "Medicine Ball Rotational Throw",
        sets: 3,
        reps: "8 per side",
        rest: "30 sec",
        equipment: ["medicine ball"],
        instructions:
          "Stand perpendicular to wall with feet shoulder-width apart. Rotate away from wall, then explosively rotate toward wall while throwing medicine ball against it.",
      },
      {
        name: "Resistance Band Jumping Jacks",
        sets: 3,
        duration: "30 sec",
        rest: "30 sec",
        equipment: ["resistance bands"],
        instructions:
          "Place resistance band under feet and hold handles at sides. Perform jumping jacks against band resistance, feeling tension in shoulders and upper back.",
      },
    ],
  },
  flexibility: {
    "full-body": [
      {
        name: "Sun Salutation",
        sets: 3,
        duration: "2 min",
        equipment: ["bodyweight"],
        instructions:
          "Flow through sequence: Mountain pose, Forward fold, Half lift, Plank, Low push-up, Upward dog, Downward dog, Half lift, Forward fold, Mountain pose. Coordinate movement with breath.",
      },
      {
        name: "World's Greatest Stretch",
        sets: 2,
        reps: "5 per side",
        duration: "30 sec hold",
        equipment: ["bodyweight"],
        instructions:
          "Start in lunge position. Place opposite hand on ground inside front foot. Rotate torso open, extending arm upward. Return to starting position and repeat on other side.",
      },
      {
        name: "Downward Dog to Cobra",
        sets: 2,
        reps: "10",
        duration: "5 breaths each",
        equipment: ["bodyweight"],
        instructions:
          "Start in downward dog position (inverted V). Lower to floor into cobra pose by bending elbows and lifting chest while keeping hips down. Return to downward dog and repeat.",
      },
      {
        name: "Standing Forward Fold",
        duration: "1 min",
        equipment: ["bodyweight"],
        instructions:
          "Stand with feet hip-width apart. Hinge at hips to fold forward, allowing arms to hang toward floor. Bend knees slightly if needed to release tension in lower back.",
      },
      {
        name: "Child's Pose to Cat-Cow",
        sets: 2,
        reps: "10",
        duration: "5 breaths each",
        equipment: ["bodyweight"],
        instructions:
          "Start in child's pose with knees wide, big toes touching, arms extended. Move to hands and knees for cat-cow: alternate between arching back (cat) and dropping belly (cow).",
      },
      {
        name: "Pigeon Pose",
        sets: 2,
        duration: "1 min per side",
        equipment: ["bodyweight"],
        instructions:
          "From hands and knees, bring one knee forward behind wrist, extending other leg back. Keep hips square and fold forward over front leg for deeper stretch.",
      },
      {
        name: "Butterfly Stretch",
        sets: 2,
        duration: "1 min",
        equipment: ["bodyweight"],
        instructions:
          "Sit with soles of feet together, knees out to sides. Hold feet with hands and gently press knees toward floor, maintaining straight back.",
      },
      {
        name: "Spinal Twist",
        sets: 2,
        duration: "30 sec per side",
        equipment: ["bodyweight"],
        instructions:
          "Sit with legs extended. Bend one knee and place foot outside opposite thigh. Twist torso toward bent knee, using arm as lever against knee. Look over back shoulder.",
      },
      {
        name: "Hip Flexor Stretch",
        sets: 2,
        duration: "45 sec per side",
        equipment: ["bodyweight"],
        instructions:
          "Kneel on one knee with other foot flat on floor in front. Keep torso upright and push hips forward until stretch is felt in front of hip. Switch sides and repeat.",
      },
      {
        name: "Foam Rolling Sequence",
        duration: "5 min",
        equipment: ["foam roller"],
        instructions:
          "Roll major muscle groups (calves, hamstrings, quads, glutes, back, chest) by placing foam roller under each area. Roll slowly, pausing on tight spots for 20-30 seconds.",
      },
      // Additional equipment-specific exercises
      {
        name: "Resistance Band Hamstring Stretch",
        sets: 2,
        duration: "45 sec per leg",
        equipment: ["resistance bands"],
        instructions:
          "Lie on back with resistance band looped around one foot. Extend leg up with band, gently pulling to increase stretch in hamstring. Keep other leg flat or bent with foot on floor.",
      },
      {
        name: "TRX Assisted Stretches",
        sets: 2,
        duration: "30 sec per position",
        equipment: ["trx"],
        instructions:
          "Use TRX for support in various stretches: forward fold (holding handles in front), chest stretch (arms extended to sides), and assisted lunges (rear foot in foot cradle).",
      },
    ],
    "upper-body": [
      {
        name: "Thread the Needle",
        sets: 2,
        reps: "5 per side",
        duration: "30 sec hold",
        equipment: ["bodyweight"],
        instructions:
          "Start on hands and knees. Slide one arm under body, rotating until shoulder touches ground. Extend opposite arm overhead or place on lower back. Return to starting position and repeat on other side.",
      },
      {
        name: "Chest Opener",
        sets: 2,
        duration: "45 sec hold",
        equipment: ["bodyweight"],
        instructions:
          "Stand in doorway with arms extended to sides, elbows bent at 90 degrees. Place forearms on doorframe and step forward until stretch is felt across chest.",
      },
      {
        name: "Shoulder Rolls",
        sets: 2,
        reps: "10 each direction",
        equipment: ["bodyweight"],
        instructions:
          "Stand or sit with good posture. Roll shoulders forward in circular motion, then backward. Focus on full range of motion and relaxing between repetitions.",
      },
      {
        name: "Eagle Arms",
        sets: 2,
        reps: "5 per side",
        duration: "30 sec hold",
        equipment: ["bodyweight"],
        instructions:
          "Extend arms forward at shoulder height. Cross one arm over other, then bend elbows and try to touch palms together (or back of hands). Lift elbows while keeping shoulders down.",
      },
      {
        name: "Wrist Stretches",
        sets: 2,
        duration: "30 sec each position",
        equipment: ["bodyweight"],
        instructions:
          "Extend one arm forward, palm up. Use other hand to gently pull fingers down/back. Repeat with palm down, pulling fingers toward body. Rotate wrist in both directions.",
      },
      {
        name: "Neck Stretches",
        sets: 2,
        duration: "30 sec each direction",
        equipment: ["bodyweight"],
        instructions:
          "Sit or stand with good posture. Tilt head to one side, bringing ear toward shoulder without raising shoulder. Repeat on other side, then forward and backward.",
      },
      {
        name: "Lat Stretch with Band",
        sets: 2,
        duration: "45 sec per side",
        equipment: ["resistance bands"],
        instructions:
          "Hold band overhead with both hands. Keeping arms straight, pull one arm down and across body while maintaining grip on band with other hand. Feel stretch along side of torso.",
      },
      {
        name: "Tricep Stretch",
        sets: 2,
        duration: "30 sec per arm",
        equipment: ["bodyweight"],
        instructions:
          "Raise one arm overhead, bend elbow to place hand behind neck. Use other hand to gently press elbow back and down. Repeat on other side.",
      },
      {
        name: "Forearm Stretches",
        sets: 2,
        duration: "30 sec each",
        equipment: ["bodyweight"],
        instructions:
          "Extend one arm forward, palm up. Use other hand to gently pull fingers back toward body. Repeat with palm down, pulling fingers down toward floor.",
      },
      // Additional equipment-specific exercises
      {
        name: "TRX Chest Stretch",
        sets: 2,
        duration: "45 sec",
        equipment: ["trx"],
        instructions:
          "Stand facing away from TRX anchor point. Hold handles with straight arms extended to sides at shoulder height. Lean forward slightly, allowing arms to move behind body.",
      },
      {
        name: "Foam Roller Thoracic Extension",
        sets: 2,
        reps: "10",
        equipment: ["foam roller"],
        instructions:
          "Place foam roller horizontally under upper back, hands behind head. Allow back to arch over roller, extending thoracic spine. Roll slightly up and down upper back region.",
      },
    ],
    "lower-body": [
      {
        name: "Pigeon Pose",
        sets: 2,
        duration: "1 min per side",
        equipment: ["bodyweight"],
        instructions:
          "From hands and knees, bring one knee forward behind wrist, extending other leg back. Keep hips square and fold forward over front leg for deeper stretch.",
      },
      {
        name: "Lizard Pose",
        sets: 2,
        duration: "45 sec per side",
        equipment: ["bodyweight"],
        instructions:
          "From downward dog, step one foot forward to outside of hand. Lower back knee to ground and sink hips forward. For deeper stretch, lower to forearms if comfortable.",
      },
      {
        name: "Seated Forward Fold",
        sets: 2,
        duration: "1 min",
        equipment: ["bodyweight"],
        instructions:
          "Sit with legs extended straight in front. Hinge at hips to fold forward, reaching toward feet. Keep back straight as long as possible before rounding forward.",
      },
      {
        name: "Butterfly Stretch",
        sets: 2,
        duration: "1 min",
        equipment: ["bodyweight"],
        instructions:
          "Sit with soles of feet together, knees out to sides. Hold feet with hands and gently press knees toward floor, maintaining straight back.",
      },
      {
        name: "Standing Quad Stretch",
        sets: 2,
        duration: "30 sec per leg",
        equipment: ["bodyweight"],
        instructions:
          "Stand on one leg, using wall or chair for balance if needed. Bend other knee and grasp foot behind you. Gently pull heel toward buttock while keeping knees close together.",
      },
      {
        name: "Hamstring Stretch with Band",
        sets: 2,
        duration: "45 sec per leg",
        equipment: ["resistance bands"],
        instructions:
          "Lie on back with resistance band looped around one foot. Extend leg up with band, gently pulling to increase stretch in hamstring. Keep other leg flat or bent with foot on floor.",
      },
      {
        name: "Calf Stretch",
        sets: 2,
        duration: "30 sec per leg",
        equipment: ["bodyweight"],
        instructions:
          "Stand facing wall with hands on wall at shoulder height. Step one foot back, keeping it straight with heel on floor. Bend front knee slightly until stretch is felt in back calf.",
      },
      {
        name: "Ankle Rotations",
        sets: 2,
        reps: "10 each direction",
        equipment: ["bodyweight"],
        instructions:
          "Sit with one leg extended. Rotate foot in circular motion, 10 circles in each direction. Repeat with other foot.",
      },
      {
        name: "Frog Pose",
        sets: 2,
        duration: "45 sec",
        equipment: ["bodyweight"],
        instructions:
          "Start on hands and knees. Widen knees as far as comfortable while keeping ankles in line with knees. Sink hips back and down while keeping back flat.",
      },
      {
        name: "Foam Rolling Legs",
        duration: "5 min",
        equipment: ["foam roller"],
        instructions:
          "Roll major leg muscles (calves, hamstrings, quads, IT bands, glutes) by placing foam roller under each area. Roll slowly, pausing on tight spots for 20-30 seconds.",
      },
      // Additional equipment-specific exercises
      {
        name: "TRX Hamstring Stretch",
        sets: 2,
        duration: "45 sec per leg",
        equipment: ["trx"],
        instructions:
          "Place one foot in TRX foot cradle. Keeping both legs straight, hinge at hips and fold forward, feeling stretch in hamstring of suspended leg.",
      },
      {
        name: "Resistance Band Adductor Stretch",
        sets: 2,
        duration: "30 sec per side",
        equipment: ["resistance bands"],
        instructions:
          "Loop resistance band around ankle and secure to fixed point. Stand with banded leg furthest from anchor. Step away to create tension, then move banded leg across body, feeling stretch in inner thigh.",
      },
    ],
    push: [
      {
        name: "Chest Opener",
        sets: 2,
        duration: "45 sec",
        equipment: ["bodyweight"],
        instructions:
          "Stand in doorway with arms extended to sides, elbows bent at 90 degrees. Place forearms on doorframe and step forward until stretch is felt across chest.",
      },
      {
        name: "Shoulder Stretch",
        sets: 2,
        duration: "30 sec per side",
        equipment: ["bodyweight"],
        instructions:
          "Bring one arm across chest. Use other arm to gently pull elbow toward chest, feeling stretch in shoulder. Keep shoulders relaxed away from ears.",
      },
      {
        name: "Tricep Stretch",
        sets: 2,
        duration: "30 sec per arm",
        equipment: ["bodyweight"],
        instructions:
          "Raise one arm overhead, bend elbow to place hand behind neck. Use other hand to gently press elbow back and down. Repeat on other side.",
      },
      {
        name: "Wall Angels",
        sets: 2,
        reps: "10",
        equipment: ["bodyweight"],
        instructions:
          "Stand with back against wall, feet slightly away from wall. Press lower back, shoulders, and arms against wall. Slide arms up and down in snow angel motion while maintaining contact with wall.",
      },
      {
        name: "Child's Pose",
        sets: 2,
        duration: "1 min",
        equipment: ["bodyweight"],
        instructions:
          "Kneel with knees wide, big toes touching. Sit back on heels and extend arms forward, lowering chest toward floor. Rest forehead on mat and breathe deeply.",
      },
      {
        name: "Foam Rolling Chest and Shoulders",
        duration: "3 min",
        equipment: ["foam roller"],
        instructions:
          "Place foam roller horizontally under upper back. Support head with hands and roll from mid-back to shoulders. For chest, place roller vertically beside you and extend arm across it.",
      },
      // Additional equipment-specific exercises
      {
        name: "TRX Chest Stretch",
        sets: 2,
        duration: "45 sec",
        equipment: ["trx"],
        instructions:
          "Stand facing away from TRX anchor point. Hold handles with straight arms extended to sides at shoulder height. Lean forward slightly, allowing arms to move behind body.",
      },
      {
        name: "Resistance Band Chest Expansion",
        sets: 2,
        reps: "10",
        duration: "5 sec hold",
        equipment: ["resistance bands"],
        instructions:
          "Hold resistance band in front of chest with both hands. Extend arms out to sides against band resistance, squeezing shoulder blades together. Hold briefly, then return to starting position.",
      },
    ],
    pull: [
      {
        name: "Lat Stretch",
        sets: 2,
        duration: "45 sec per side",
        equipment: ["bodyweight"],
        instructions:
          "Kneel beside bench or chair. Place one arm on surface with palm down. Sink hips back while keeping arm straight to feel stretch along side of torso. Turn palm up for variation.",
      },
      {
        name: "Cat-Cow",
        sets: 2,
        reps: "10",
        equipment: ["bodyweight"],
        instructions:
          "Start on hands and knees. Alternate between arching back upward (cat) while tucking chin to chest, and dropping belly toward floor (cow) while lifting chest and tailbone.",
      },
      {
        name: "Thread the Needle",
        sets: 2,
        duration: "30 sec per side",
        equipment: ["bodyweight"],
        instructions:
          "Start on hands and knees. Slide one arm under body, rotating until shoulder touches ground. Extend opposite arm overhead or place on lower back. Return to starting position and repeat on other side.",
      },
      {
        name: "Bicep Stretch",
        sets: 2,
        duration: "30 sec per arm",
        equipment: ["bodyweight"],
        instructions:
          "Extend one arm forward at shoulder height, palm facing up. Use other hand to gently pull fingers back toward body until stretch is felt in forearm and bicep.",
      },
      {
        name: "Foam Rolling Back",
        duration: "3 min",
        equipment: ["foam roller"],
        instructions:
          "Place foam roller horizontally under mid-back. Support head with hands and bend knees with feet flat on floor. Roll from mid-back to upper back, avoiding lower spine.",
      },
      {
        name: "Band Pull-Aparts",
        sets: 2,
        reps: "15",
        equipment: ["resistance bands"],
        instructions:
          "Hold band with hands at shoulder width, arms extended in front. Pull band apart by moving hands outward, squeezing shoulder blades together, then return to starting position.",
      },
      // Additional equipment-specific exercises
      {
        name: "TRX Back Stretch",
        sets: 2,
        duration: "45 sec",
        equipment: ["trx"],
        instructions:
          "Hold TRX handles and walk forward until arms are extended and body forms diagonal line. Relax upper back and allow gravity to create gentle traction through spine.",
      },
      {
        name: "Resistance Band Lat Pulldown Stretch",
        sets: 2,
        duration: "30 sec per side",
        equipment: ["resistance bands"],
        instructions:
          "Secure resistance band to high anchor point. Kneel and grasp band with one hand. Extend arm fully, then lean away from anchor point until stretch is felt along side of torso.",
      },
    ],
    split: [
      {
        name: "World's Greatest Stretch",
        sets: 2,
        reps: "5 per side",
        equipment: ["bodyweight"],
        instructions:
          "Start in lunge position. Place opposite hand on ground inside front foot. Rotate torso open, extending arm upward. Return to starting position and repeat on other side.",
      },
      {
        name: "Pigeon Pose",
        sets: 2,
        duration: "45 sec per side",
        equipment: ["bodyweight"],
        instructions:
          "From hands and knees, bring one knee forward behind wrist, extending other leg back. Keep hips square and fold forward over front leg for deeper stretch.",
      },
      {
        name: "Chest Opener",
        sets: 2,
        duration: "30 sec",
        equipment: ["bodyweight"],
        instructions:
          "Stand in doorway with arms extended to sides, elbows bent at 90 degrees. Place forearms on doorframe and step forward until stretch is felt across chest.",
      },
      {
        name: "Seated Forward Fold",
        sets: 2,
        duration: "45 sec",
        equipment: ["bodyweight"],
        instructions:
          "Sit with legs extended straight in front. Hinge at hips to fold forward, reaching toward feet. Keep back straight as long as possible before rounding forward.",
      },
      {
        name: "Spinal Twist",
        sets: 2,
        duration: "30 sec per side",
        equipment: ["bodyweight"],
        instructions:
          "Sit with legs extended. Bend one knee and place foot outside opposite thigh. Twist torso toward bent knee, using arm as lever against knee. Look over back shoulder.",
      },
      {
        name: "Foam Rolling Full Body",
        duration: "5 min",
        equipment: ["foam roller"],
        instructions:
          "Roll major muscle groups (calves, hamstrings, quads, glutes, back, chest) by placing foam roller under each area. Roll slowly, pausing on tight spots for 20-30 seconds.",
      },
      // Additional equipment-specific exercises
      {
        name: "TRX Assisted Stretches",
        sets: 2,
        duration: "30 sec per position",
        equipment: ["trx"],
        instructions:
          "Use TRX for support in various stretches: forward fold (holding handles in front), chest stretch (arms extended to sides), and assisted lunges (rear foot in foot cradle).",
      },
      {
        name: "Resistance Band Full-Body Stretch Routine",
        sets: 1,
        duration: "5 min",
        equipment: ["resistance bands"],
        instructions:
          "Use resistance band to assist in stretching major muscle groups: hamstrings (band around foot), chest (pulling band apart), shoulders (overhead stretch), and back (seated row position hold).",
      },
    ],
  },
  hypertrophy: {
    "full-body": [
      {
        name: "Barbell Squat",
        sets: 4,
        reps: "8-12",
        rest: "90 sec",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand with feet shoulder-width apart, barbell across upper back. Bend knees and hips to lower until thighs are parallel to ground. Push through heels to return to starting position.",
      },
      {
        name: "Bench Press",
        sets: 4,
        reps: "8-12",
        rest: "90 sec",
        equipment: ["barbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on bench with feet flat on floor. Grip barbell with hands slightly wider than shoulder-width. Lower bar to chest, then press back up to starting position.",
      },
      {
        name: "Romanian Deadlift",
        sets: 3,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Stand with feet hip-width apart, holding barbell in front of thighs. Hinge at hips to lower barbell along legs while maintaining slight knee bend and flat back.",
      },
      {
        name: "Lat Pulldown",
        sets: 3,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["machine", "cables"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Sit at lat pulldown machine with thighs secured. Grip bar with hands wider than shoulder-width. Pull bar down to upper chest, then slowly return to starting position.",
      },
      {
        name: "Dumbbell Shoulder Press",
        sets: 3,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Sit or stand with dumbbells at shoulder level, palms facing forward. Press weights overhead until arms are extended, then lower back to starting position.",
      },
      {
        name: "Leg Extensions",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit in leg extension machine with pads on front of ankles. Extend legs until knees are straight, then lower with control.",
      },
      {
        name: "Bicep Curls",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["dumbbells"],
        muscleGroup: "Arms",
        instructions:
          "Stand with feet shoulder-width apart, holding dumbbells with arms extended. Curl weights toward shoulders, keeping elbows close to body, then lower with control.",
      },
      {
        name: "Tricep Pushdowns",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["cables"],
        muscleGroup: "Arms",
        instructions:
          "Stand facing cable machine with rope or bar attachment at chest height. Push attachment down until arms are fully extended, keeping elbows close to body.",
      },
      {
        name: "Calf Raises",
        sets: 4,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand on calf raise machine with balls of feet on platform, heels hanging off. Lower heels toward floor, then raise up onto toes as high as possible.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell Goblet Squat",
        sets: 3,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["kettlebells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Hold kettlebell close to chest with both hands. Stand with feet slightly wider than shoulder-width. Squat down until thighs are parallel to ground, then push through heels to stand.",
      },
      {
        name: "TRX Chest Press",
        sets: 3,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["trx"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Face away from TRX anchor with handles at chest level, feet forward to create angle. Lower chest toward hands by bending elbows, then push back to starting position.",
      },
      {
        name: "Resistance Band Pull-Apart",
        sets: 3,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hold band with hands at shoulder width, arms extended in front. Pull band apart by moving hands outward, squeezing shoulder blades together, then return to starting position.",
      },
    ],
    "upper-body": [
      {
        name: "Incline Bench Press",
        sets: 4,
        reps: "8-12",
        rest: "90 sec",
        equipment: ["barbells", "dumbbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on incline bench with feet flat on floor. Grip weight with hands slightly wider than shoulder-width. Lower weight to upper chest, then press back up to starting position.",
      },
      {
        name: "Seated Cable Rows",
        sets: 4,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["cables"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Sit at cable row machine with feet on platform and knees slightly bent. Grasp handle with both hands, pull toward lower chest while keeping back straight, then return to starting position.",
      },
      {
        name: "Dumbbell Shoulder Press",
        sets: 3,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Sit or stand with dumbbells at shoulder level, palms facing forward. Press weights overhead until arms are extended, then lower back to starting position.",
      },
      {
        name: "Lat Pulldown",
        sets: 3,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["machine", "cables"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Sit at lat pulldown machine with thighs secured. Grip bar with hands wider than shoulder-width. Pull bar down to upper chest, then slowly return to starting position.",
      },
      {
        name: "Chest Flyes",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["dumbbells", "cables"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on bench with weights extended above chest, slight bend in elbows. Lower weights out to sides in arc motion, feeling stretch in chest, then bring weights back together.",
      },
      {
        name: "Face Pulls",
        sets: 3,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["cables"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand facing cable machine with rope attachment at head height. Pull rope toward face, separating ends as you pull and focusing on squeezing shoulder blades together.",
      },
      {
        name: "Bicep Curls",
        sets: 4,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["dumbbells", "barbells"],
        muscleGroup: "Arms",
        instructions:
          "Stand with feet shoulder-width apart, holding weights with arms extended. Curl weights toward shoulders, keeping elbows close to body, then lower with control.",
      },
      {
        name: "Tricep Extensions",
        sets: 4,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["dumbbells", "cables"],
        muscleGroup: "Arms",
        instructions:
          "Stand or sit holding weight overhead with both hands. Lower weight behind head by bending elbows, keeping upper arms stationary. Extend arms to return to starting position.",
      },
      {
        name: "Lateral Raises",
        sets: 3,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand with feet shoulder-width apart, holding dumbbells at sides. Raise arms out to sides until parallel with floor, then lower with control.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell Single-Arm Row",
        sets: 3,
        reps: "10-12 per arm",
        rest: "60 sec",
        equipment: ["kettlebells"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Place one hand and knee on bench, opposite foot on floor. Hold kettlebell in free hand hanging toward floor. Pull kettlebell to hip, keeping elbow close to body, then lower with control.",
      },
      {
        name: "TRX Bicep Curl",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["trx"],
        muscleGroup: "Arms",
        instructions:
          "Stand facing TRX anchor point, holding handles with palms up. Lean back slightly with arms extended. Pull body up by bending elbows, keeping elbows stationary.",
      },
      {
        name: "Resistance Band Overhead Press",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand on resistance band with feet shoulder-width apart. Hold handles at shoulder level, palms facing forward. Press handles overhead until arms are extended, then lower with control.",
      },
    ],
    "lower-body": [
      {
        name: "Barbell Squat",
        sets: 4,
        reps: "8-12",
        rest: "90 sec",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand with feet shoulder-width apart, barbell across upper back. Bend knees and hips to lower until thighs are parallel to ground. Push through heels to return to starting position.",
      },
      {
        name: "Romanian Deadlift",
        sets: 4,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Stand with feet hip-width apart, holding barbell in front of thighs. Hinge at hips to lower barbell along legs while maintaining slight knee bend and flat back.",
      },
      {
        name: "Leg Press",
        sets: 3,
        reps: "12-15",
        rest: "90 sec",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit in leg press machine with feet shoulder-width apart on platform. Lower platform by bending knees until they're at 90 degrees, then push back to starting position.",
      },
      {
        name: "Leg Curls",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["machine"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Lie face down on leg curl machine with pads behind ankles. Curl legs up by bending knees, bringing heels toward buttocks, then lower with control.",
      },
      {
        name: "Leg Extensions",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit in leg extension machine with pads on front of ankles. Extend legs until knees are straight, then lower with control.",
      },
      {
        name: "Hip Thrusts",
        sets: 3,
        reps: "12-15",
        rest: "90 sec",
        equipment: ["barbells"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit with upper back against bench, barbell across hips. Plant feet firmly on ground and thrust hips upward until body forms straight line from shoulders to knees.",
      },
      {
        name: "Calf Raises",
        sets: 5,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Stand on calf raise machine with balls of feet on platform, heels hanging off. Lower heels toward floor, then raise up onto toes as high as possible.",
      },
      {
        name: "Adductor Machine",
        sets: 3,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit in adductor machine with pads against inner thighs. Press legs together against resistance, then return to starting position with control.",
      },
      {
        name: "Abductor Machine",
        sets: 3,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["machine"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Sit in abductor machine with pads against outer thighs. Press legs outward against resistance, then return to starting position with control.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell Sumo Deadlift",
        sets: 3,
        reps: "12-15",
        rest: "90 sec",
        equipment: ["kettlebells"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Stand with feet wider than shoulder-width, toes pointed out. Hold kettlebell between legs with both hands. Hinge at hips to lower kettlebell toward floor, then stand by driving through heels.",
      },
      {
        name: "Resistance Band Lateral Walk",
        sets: 3,
        reps: "15-20 steps each direction",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Lower Body Push",
        instructions:
          "Place resistance band around legs just above knees. Take small steps sideways while maintaining tension on band, keeping feet parallel and knees slightly bent.",
      },
      {
        name: "TRX Hamstring Curl",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["trx"],
        muscleGroup: "Lower Body Pull",
        instructions:
          "Lie on back with heels in TRX straps. Lift hips off ground, then pull heels toward buttocks by bending knees. Return to starting position with control.",
      },
    ],
    push: [
      {
        name: "Bench Press",
        sets: 4,
        reps: "8-12",
        rest: "90 sec",
        equipment: ["barbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on bench with feet flat on floor. Grip barbell with hands slightly wider than shoulder-width. Lower bar to chest, then press back up to starting position.",
      },
      {
        name: "Incline Dumbbell Press",
        sets: 4,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["dumbbells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on incline bench with dumbbells at shoulder level. Press weights up until arms are extended, then lower back to starting position.",
      },
      {
        name: "Shoulder Press",
        sets: 3,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["barbells", "dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Sit or stand with weight at shoulder level. Press weight overhead until arms are extended, then lower back to starting position.",
      },
      {
        name: "Chest Flyes",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["dumbbells", "cables"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on bench with weights extended above chest, slight bend in elbows. Lower weights out to sides in arc motion, feeling stretch in chest, then bring weights back together.",
      },
      {
        name: "Lateral Raises",
        sets: 3,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand with feet shoulder-width apart, holding dumbbells at sides. Raise arms out to sides until parallel with floor, then lower with control.",
      },
      {
        name: "Tricep Pushdowns",
        sets: 4,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["cables"],
        muscleGroup: "Arms",
        instructions:
          "Stand facing cable machine with rope or bar attachment at chest height. Push attachment down until arms are fully extended, keeping elbows close to body.",
      },
      {
        name: "Overhead Tricep Extensions",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["dumbbells", "cables"],
        muscleGroup: "Arms",
        instructions:
          "Stand or sit holding weight overhead with both hands. Lower weight behind head by bending elbows, keeping upper arms stationary. Extend arms to return to starting position.",
      },
      {
        name: "Dips",
        sets: 3,
        reps: "10-15",
        rest: "90 sec",
        equipment: ["bodyweight", "machine"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Support body on parallel bars with arms extended. Lower body by bending elbows until shoulders are below elbows. Push back up to starting position.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell Floor Press",
        sets: 3,
        reps: "10-12 per arm",
        rest: "60 sec",
        equipment: ["kettlebells"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Lie on floor with kettlebell at shoulder level. Press kettlebell up until arm is extended, then lower back to starting position.",
      },
      {
        name: "TRX Push-ups",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["trx"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Hold TRX handles with arms extended, body at an angle. Lower chest between handles by bending elbows, then push back up to starting position.",
      },
      {
        name: "Resistance Band Chest Press",
        sets: 3,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Push",
        instructions:
          "Secure band behind you at chest height. Hold handles at chest level with elbows bent. Press hands forward until arms are extended, then return to starting position.",
      },
    ],
    pull: [
      {
        name: "Barbell Rows",
        sets: 4,
        reps: "8-12",
        rest: "90 sec",
        equipment: ["barbells"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Bend at hips with slight knee bend, back flat. Hold barbell with hands shoulder-width apart. Pull bar to lower chest, squeezing shoulder blades, then lower with control.",
      },
      {
        name: "Lat Pulldown",
        sets: 4,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["machine", "cables"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Sit at lat pulldown machine with thighs secured. Grip bar with hands wider than shoulder-width. Pull bar down to upper chest, then slowly return to starting position.",
      },
      {
        name: "Seated Cable Rows",
        sets: 3,
        reps: "10-12",
        rest: "90 sec",
        equipment: ["cables"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Sit at cable row machine with feet on platform and knees slightly bent. Grasp handle with both hands, pull toward lower chest while keeping back straight, then return to starting position.",
      },
      {
        name: "Face Pulls",
        sets: 3,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["cables"],
        muscleGroup: "Shoulders",
        instructions:
          "Stand facing cable machine with rope attachment at head height. Pull rope toward face, separating ends as you pull and focusing on squeezing shoulder blades together.",
      },
      {
        name: "Bicep Curls",
        sets: 4,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["dumbbells", "barbells"],
        muscleGroup: "Arms",
        instructions:
          "Stand with feet shoulder-width apart, holding weights with arms extended. Curl weights toward shoulders, keeping elbows close to body, then lower with control.",
      },
      {
        name: "Hammer Curls",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["dumbbells"],
        muscleGroup: "Arms",
        instructions:
          "Stand with feet shoulder-width apart, holding dumbbells with palms facing each other. Curl weights toward shoulders while maintaining neutral grip, then lower with control.",
      },
      {
        name: "Rear Delt Flyes",
        sets: 3,
        reps: "15-20",
        rest: "60 sec",
        equipment: ["dumbbells"],
        muscleGroup: "Shoulders",
        instructions:
          "Bend at hips with slight knee bend, back flat. Hold dumbbells with arms extended toward floor. Raise arms out to sides until parallel with floor, squeezing shoulder blades together.",
      },
      // Additional equipment-specific exercises
      {
        name: "Kettlebell High Pull",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["kettlebells"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Stand with feet shoulder-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then explosively pull it up to shoulder height, leading with elbows.",
      },
      {
        name: "TRX Row",
        sets: 3,
        reps: "12-15",
        rest: "60 sec",
        equipment: ["trx"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hold TRX handles with body at an angle, arms extended. Pull body up by bending elbows and squeezing shoulder blades, then lower with control.",
      },
      {
        name: "Resistance Band Pull-Apart",
        sets: 3,
        reps: "15-20",
        rest: "45 sec",
        equipment: ["resistance bands"],
        muscleGroup: "Upper Body Pull",
        instructions:
          "Hold band with hands at shoulder width, arms extended in front. Pull band apart by moving hands outward, squeezing shoulder blades together, then return to starting position.",
      },
    ],
  },
}
