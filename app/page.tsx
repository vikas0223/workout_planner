import { WorkoutHub } from "@/components/workout/workout-hub";
import Link from "next/link";
import { Dumbbell, LayoutGrid, BarChart2 } from "lucide-react";

export default function Home() {
  return (
    <main className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 text-slate-800 py-6 sm:py-10 px-3 sm:px-6 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navbar */}
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                FinWise Workout Hub
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Local-first, deterministic training</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/exercises"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100/80 px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exercise Library & Anatomy</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100/80 px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Workout Coordinator Container */}
        <WorkoutHub />
      </div>
    </main>
  );
}
