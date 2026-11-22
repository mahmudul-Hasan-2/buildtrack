import { HardHat, ShieldCheck, BarChart3, Layers } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950">
      {/* Left Brand & Telemetry Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0B192C] text-white p-12 relative overflow-hidden">
        {/* Blueprint Grid Overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <HardHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight">
              Build<span className="text-orange-500">Track</span>
            </span>
            <p className="text-xs text-slate-400 uppercase tracking-widest">
              Project Intelligence
            </p>
          </div>
        </div>

        {/* Center Value Prop */}
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            Enterprise Field & Cost Control
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Precision control from blueprint to handover.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Unify site engineering logs, subcontractor schedules, and real-time
            CAPEX forecasting in a single command center.
          </p>

          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Layers className="h-5 w-5 text-orange-500 shrink-0" />
              <span>Real-time BOQ & daily site progress tracking</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <BarChart3 className="h-5 w-5 text-orange-500 shrink-0" />
              <span>Automated budget variance & cashflow alerts</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ShieldCheck className="h-5 w-5 text-orange-500 shrink-0" />
              <span>Role-isolated workspaces for field & finance teams</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-500 flex justify-between">
          <span>© 2026 BuildTrack Systems Inc.</span>
          <span>ISO 19650 Compliant</span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
