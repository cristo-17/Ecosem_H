import { GpsIcon, SeatIcon, YearsBadgeIcon } from "@/components/ui/icons";

const ITEMS = [
  { Icon: YearsBadgeIcon, label: "15+ años de experiencia" },
  { Icon: GpsIcon, label: "GPS en tiempo real" },
  { Icon: SeatIcon, label: "Asientos cómodos" },
];

export function TrustRow() {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {ITEMS.map(({ Icon, label }) => (
        <li key={label} className="flex flex-col items-center gap-1.5 text-center">
          <Icon />
          <span className="text-xs font-medium text-navy/70">{label}</span>
        </li>
      ))}
    </ul>
  );
}
