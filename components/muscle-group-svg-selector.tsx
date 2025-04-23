"use client"
import { motion } from "framer-motion"

export default function MuscleGroupSvgSelector({ selectedGroups, onMuscleGroupSelect }) {
  // Mapping of SVG element IDs to muscle groups
  const muscleGroupMapping = {
    chest: "Upper Body Push",
    shoulders: "Shoulders",
    biceps: "Arms",
    triceps: "Arms",
    forearms: "Arms",
    abs: "Core",
    obliques: "Core",
    quads: "Lower Body Push",
    calves: "Lower Body Push",
    back: "Upper Body Pull",
    lats: "Upper Body Pull",
    traps: "Upper Body Pull",
    glutes: "Lower Body Pull",
    hamstrings: "Lower Body Pull",
    "lower-back": "Core",
  }

  // Check if a muscle group is selected
  const isMuscleSelected = (muscleId) => {
    const muscleGroup = muscleGroupMapping[muscleId]
    return muscleGroup && selectedGroups.includes(muscleGroup)
  }

  // Handle click on a muscle group
  const handleMuscleClick = (muscleId) => {
    const muscleGroup = muscleGroupMapping[muscleId]
    if (muscleGroup) {
      onMuscleGroupSelect(muscleGroup)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <svg viewBox="0 0 1200 1200" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {/* Base body outline - this is just a container, not interactive */}
          <path
            d="M600,100 C700,100 750,150 750,250 C750,350 730,400 730,450 C730,500 750,550 750,600 C750,650 730,700 710,750 C690,800 690,850 690,900 C690,950 710,1000 710,1050 C710,1100 690,1150 600,1200 C510,1150 490,1100 490,1050 C490,1000 510,950 510,900 C510,850 510,800 490,750 C470,700 450,650 450,600 C450,550 470,500 470,450 C470,400 450,350 450,250 C450,150 500,100 600,100"
            fill="#f5f5f5"
            stroke="#d1d5db"
            strokeWidth="2"
          />
          <circle cx="600" cy="70" r="50" fill="#f5f5f5" stroke="#d1d5db" strokeWidth="2" />

          {/* Chest */}
          <path
            id="chest"
            d="M550,300 C570,280 630,280 650,300 C660,320 660,360 650,380 C630,400 570,400 550,380 C540,360 540,320 550,300"
            fill={isMuscleSelected("chest") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("chest") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("chest")}
          />

          {/* Shoulders */}
          <path
            id="shoulders"
            d="M510,260 C520,240 540,230 560,240 C570,250 570,270 560,280 C550,290 520,290 510,280 C500,270 500,250 510,260 M690,260 C680,240 660,230 640,240 C630,250 630,270 640,280 C650,290 680,290 690,280 C700,270 700,250 690,260"
            fill={isMuscleSelected("shoulders") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("shoulders") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("shoulders")}
          />

          {/* Biceps */}
          <path
            id="biceps"
            d="M500,320 C490,340 480,380 490,400 C500,410 520,410 530,400 C540,380 540,340 530,320 C520,310 510,310 500,320 M700,320 C710,340 720,380 710,400 C700,410 680,410 670,400 C660,380 660,340 670,320 C680,310 690,310 700,320"
            fill={isMuscleSelected("biceps") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("biceps") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("biceps")}
          />

          {/* Triceps */}
          <path
            id="triceps"
            d="M490,340 C480,360 470,400 480,420 C490,430 510,430 520,420 C530,400 530,360 520,340 C510,330 500,330 490,340 M710,340 C720,360 730,400 720,420 C710,430 690,430 680,420 C670,400 670,360 680,340 C690,330 700,330 710,340"
            fill={isMuscleSelected("triceps") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("triceps") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("triceps")}
          />

          {/* Forearms */}
          <path
            id="forearms"
            d="M490,420 C480,440 470,480 480,500 C490,510 510,510 520,500 C530,480 530,440 520,420 C510,410 500,410 490,420 M710,420 C720,440 730,480 720,500 C710,510 690,510 680,500 C670,480 670,440 680,420 C690,410 700,410 710,420"
            fill={isMuscleSelected("forearms") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("forearms") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("forearms")}
          />

          {/* Abs */}
          <path
            id="abs"
            d="M570,400 C590,390 610,390 630,400 C640,420 640,480 630,500 C610,510 590,510 570,500 C560,480 560,420 570,400"
            fill={isMuscleSelected("abs") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("abs") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("abs")}
          />

          {/* Obliques */}
          <path
            id="obliques"
            d="M550,420 C560,410 570,410 570,420 C570,460 570,480 560,500 C550,510 540,510 540,500 C540,480 540,460 550,420 M650,420 C640,410 630,410 630,420 C630,460 630,480 640,500 C650,510 660,510 660,500 C660,480 660,460 650,420"
            fill={isMuscleSelected("obliques") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("obliques") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("obliques")}
          />

          {/* Quads */}
          <path
            id="quads"
            d="M570,550 C580,540 590,540 600,550 C610,560 610,650 600,670 C590,680 580,680 570,670 C560,650 560,560 570,550 M630,550 C620,540 610,540 600,550 C590,560 590,650 600,670 C610,680 620,680 630,670 C640,650 640,560 630,550"
            fill={isMuscleSelected("quads") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("quads") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("quads")}
          />

          {/* Calves */}
          <path
            id="calves"
            d="M570,690 C580,680 590,680 600,690 C610,700 610,790 600,810 C590,820 580,820 570,810 C560,790 560,700 570,690 M630,690 C620,680 610,680 600,690 C590,700 590,790 600,810 C610,820 620,820 630,810 C640,790 640,700 630,690"
            fill={isMuscleSelected("calves") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("calves") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("calves")}
          />

          {/* Back */}
          <path
            id="back"
            d="M530,280 C520,300 510,340 520,380 C530,390 540,390 550,380 C560,340 560,300 550,280 C540,270 540,270 530,280 M670,280 C680,300 690,340 680,380 C670,390 660,390 650,380 C640,340 640,300 650,280 C660,270 660,270 670,280"
            fill={isMuscleSelected("back") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("back") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("back")}
          />

          {/* Lats */}
          <path
            id="lats"
            d="M540,320 C530,340 520,380 530,420 C540,430 560,430 570,420 C580,380 580,340 570,320 C560,310 550,310 540,320 M660,320 C670,340 680,380 670,420 C660,430 640,430 630,420 C620,380 620,340 630,320 C640,310 650,310 660,320"
            fill={isMuscleSelected("lats") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("lats") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("lats")}
          />

          {/* Traps */}
          <path
            id="traps"
            d="M570,220 C590,210 610,210 630,220 C640,240 640,260 630,280 C610,290 590,290 570,280 C560,260 560,240 570,220"
            fill={isMuscleSelected("traps") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("traps") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("traps")}
          />

          {/* Glutes */}
          <path
            id="glutes"
            d="M570,500 C590,490 610,490 630,500 C640,520 640,540 630,560 C610,570 590,570 570,560 C560,540 560,520 570,500"
            fill={isMuscleSelected("glutes") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("glutes") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("glutes")}
          />

          {/* Hamstrings */}
          <path
            id="hamstrings"
            d="M580,560 C590,550 600,550 600,560 C600,600 600,620 590,640 C580,650 570,650 570,640 C570,620 570,600 580,560 M620,560 C610,550 600,550 600,560 C600,600 600,620 610,640 C620,650 630,650 630,640 C630,620 630,600 620,560"
            fill={isMuscleSelected("hamstrings") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("hamstrings") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("hamstrings")}
          />

          {/* Lower Back */}
          <path
            id="lower-back"
            d="M570,440 C590,430 610,430 630,440 C640,460 640,480 630,500 C610,510 590,510 570,500 C560,480 560,460 570,440"
            fill={isMuscleSelected("lower-back") ? "#a5b4fc" : "#e2e8f0"}
            stroke={isMuscleSelected("lower-back") ? "#6366f1" : "#cbd5e1"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-200 transition-colors duration-200"
            onClick={() => handleMuscleClick("lower-back")}
          />
        </svg>

        {/* Muscle group labels */}
        <div className="absolute inset-0 pointer-events-none">
          {Object.entries(muscleGroupMapping).map(
            ([muscleId, group]) =>
              isMuscleSelected(muscleId) && (
                <motion.div
                  key={muscleId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute text-xs font-medium text-indigo-900 bg-white/80 rounded px-1 py-0.5 shadow-sm"
                  style={{
                    // Position labels based on muscle ID
                    top:
                      muscleId === "chest"
                        ? "28%"
                        : muscleId === "shoulders"
                          ? "25%"
                          : muscleId === "biceps"
                            ? "30%"
                            : muscleId === "triceps"
                              ? "32%"
                              : muscleId === "forearms"
                                ? "38%"
                                : muscleId === "abs"
                                  ? "40%"
                                  : muscleId === "obliques"
                                    ? "42%"
                                    : muscleId === "quads"
                                      ? "50%"
                                      : muscleId === "calves"
                                        ? "60%"
                                        : muscleId === "back"
                                          ? "30%"
                                          : muscleId === "lats"
                                            ? "35%"
                                            : muscleId === "traps"
                                              ? "22%"
                                              : muscleId === "glutes"
                                                ? "45%"
                                                : muscleId === "hamstrings"
                                                  ? "48%"
                                                  : "36%",
                    left:
                      muscleId === "chest"
                        ? "50%"
                        : muscleId === "shoulders"
                          ? muscleId === "shoulders" && isMuscleSelected("shoulders")
                            ? "50%"
                            : "30%"
                          : muscleId === "biceps"
                            ? "30%"
                            : muscleId === "triceps"
                              ? "70%"
                              : muscleId === "forearms"
                                ? "30%"
                                : muscleId === "abs"
                                  ? "50%"
                                  : muscleId === "obliques"
                                    ? "70%"
                                    : muscleId === "quads"
                                      ? "50%"
                                      : muscleId === "calves"
                                        ? "50%"
                                        : muscleId === "back"
                                          ? "70%"
                                          : muscleId === "lats"
                                            ? "70%"
                                            : muscleId === "traps"
                                              ? "50%"
                                              : muscleId === "glutes"
                                                ? "50%"
                                                : muscleId === "hamstrings"
                                                  ? "70%"
                                                  : "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {muscleId.charAt(0).toUpperCase() + muscleId.slice(1).replace("-", " ")}
                </motion.div>
              ),
          )}
        </div>
      </div>
    </div>
  )
}
