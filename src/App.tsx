import Header from "./components/Header";
import SummaryStrip from "./components/SummaryStrip";
import ServersCard from "./components/ServersCard";
import HostsCard from "./components/HostsCard";
import SsdCard from "./components/SsdCard";
import RamCard from "./components/RamCard";
import CpuCard from "./components/CpuCard";
import SlaPanel from "./components/SlaPanel";
import AiForecastPanel from "./components/AiForecastPanel";

export default function App() {
  return (
    <div className="app-bg min-h-screen font-sans text-ink-900">
      <div className="mx-auto w-full max-w-[1640px] px-7 py-6">
        <div className="space-y-4">
          <Header />

          <SummaryStrip />

          {/* Section header row: label */}
          <div className="flex items-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
              Ёмкость инфраструктуры
            </span>
          </div>

          {/* Main metrics row — five equal-height cards */}
          <div className="grid grid-cols-5 gap-4 max-[1180px]:grid-cols-2 max-[680px]:grid-cols-1">
            <ServersCard />
            <HostsCard />
            <SsdCard />
            <RamCard />
            <CpuCard />
          </div>

          {/* Bottom row — SLA (narrow) + AI forecast (wide) */}
          <div className="grid grid-cols-[9fr_16fr] gap-4 max-[980px]:grid-cols-1">
            <SlaPanel />
            <AiForecastPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
