import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Fonts, Radius, Theme } from "@/constants/theme";
import { PROPERTY_TYPE_META, PropertyType } from "@/constants/propertyTypes";

export type Unit = {
  id: string;
  customUnitId: string | null;
  code: string | null;
  type: number;
  area: number;
  status: number;
  occupantFirstName: string | null;
  occupantLastName: string | null;
  occupantEmail: string | null;
  occupantPhone: string | null;
};

export const occupantFullName = (u: Unit) =>
  [u.occupantFirstName, u.occupantLastName].filter(Boolean).join(" ") || null;

export type Floor = {
  id: string;
  buildingId: string | null;
  number: number;
  customId: string | null;
  status: number;
  unitCount: number | null;
  units: Unit[];
};

export type Building = {
  id: string;
  propertyId: string;
  name: string | null;
  customId: string | null;
  status: number;
  floorCount: number | null;
  unitCount: number | null;
  floors: Floor[];
  directUnits: Unit[];
};

export type ViewState =
  | { level: "buildings" }
  | { level: "floors"; buildingIdx: number }
  | { level: "units"; buildingIdx: number; floorIdx: number };

type Props = {
  theme: Theme;
  propertyType: PropertyType;
  propertyId: string;
  buildings: Building[];
  propertyUnits?: Unit[];
  view: ViewState;
  setView: (v: ViewState) => void;
};

export const isOccupied = (u: Unit) => !!(u.occupantFirstName || u.occupantLastName);

export function BuildingsDrillDown({ theme, propertyType, propertyId, buildings, propertyUnits = [], view, setView }: Props) {
  const router = useRouter();
  const meta = PROPERTY_TYPE_META[propertyType];

  const skipBuilding = buildings.length === 1;
  const effLevel = view.level === "buildings" && skipBuilding ? "floors" : view.level;
  const buildingIdx = view.level === "buildings" ? 0 : view.buildingIdx;
  const floorIdx = view.level === "units" ? view.floorIdx : 0;
  const building = buildings[buildingIdx];
  const floor = building?.floors[floorIdx];
  const unitPrefix = meta.unitPrefix ?? "Enhet";
  const sectionLabel = propertyType === "land" ? "TOMTER" : `${unitPrefix.toUpperCase()}ER`;

  // No buildings — show property-level units (tomter / plots) directly
  if (buildings.length === 0) {
    if (propertyUnits.length > 0) {
      return (
        <View>
          <Text style={[s.sectionLabel, { color: theme.textMute }]}>{sectionLabel}</Text>
          <UnitsGrid theme={theme} units={propertyUnits} propertyId={propertyId} router={router} />
          <View style={[s.legend, { borderTopColor: theme.border }]}>
            <LegendItem color="#16A34A" label="Uthyrd" theme={theme} />
            <LegendItem color={theme.textMute} label="Ledig" theme={theme} />
          </View>
        </View>
      );
    }
    return (
      <View>
        <Text style={[s.sectionLabel, { color: theme.textMute }]}>{propertyType === "land" ? "TOMTER" : "BYGGNADER"}</Text>
        <View style={[s.row, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: "center" }]}>
          <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: theme.textMute }}>
            {propertyType === "land"
              ? "Inga tomter registrerade. Skapa tomter i Covabe-webbsidan."
              : "Inga byggnader registrerade för denna fastighet"}
          </Text>
        </View>
      </View>
    );
  }

  if (effLevel === "buildings") {
    return (
      <View>
        <Text style={[s.sectionLabel, { color: theme.textMute }]}>BYGGNADER</Text>
        <View style={{ gap: 8 }}>
          {buildings.map((b, i) => {
            const floorUnits = b.floors.flatMap((f) => f.units);
            const directUnits = b.directUnits ?? [];
            const allUnits = [...floorUnits, ...directUnits];
            const total = allUnits.length;
            const occ = allUnits.filter(isOccupied).length;
            const summary = b.floors.length > 0
              ? `${b.floors.length} ${b.floors.length === 1 ? "våning" : "våningar"} · ${occ}/${total} uthyrda`
              : `${total} ${unitPrefix.toLowerCase()}${total === 1 ? "" : "er"} · ${occ} uthyrda`;
            return (
              <Pressable
                key={b.id}
                onPress={() => setView({ level: "floors", buildingIdx: i })}
                style={({ pressed }) => [
                  s.row,
                  { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.92 : 1 },
                ]}
              >
                <View style={[s.rowIcon, { backgroundColor: theme.accentSoft }]}>
                  <BuildingIcon color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowTitle, { color: theme.text }]}>{b.name || "Namnlös byggnad"}</Text>
                  <Text style={[s.rowSub, { color: theme.textMute }]}>{summary}</Text>
                </View>
                <ChevronRight color={theme.textMute} />
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (effLevel === "floors") {
    const hasFloors = building.floors.length > 0;
    const directUnits = building.directUnits ?? [];

    // If building has no floors but direct units, show units grid directly
    if (!hasFloors && directUnits.length > 0) {
      return (
        <View>
          <Breadcrumbs theme={theme} crumbs={[
            ...(!skipBuilding ? [{ label: "Byggnader", onPress: () => setView({ level: "buildings" }) }] : []),
            { label: building.name || "Byggnad" },
          ]} />
          <Text style={[s.sectionLabel, { color: theme.textMute }]}>
            {(building.name || "BYGGNAD").toUpperCase()} · {unitPrefix.toUpperCase()}ER
          </Text>
          <UnitsGrid theme={theme} units={directUnits} propertyId={propertyId} router={router} />
          <View style={[s.legend, { borderTopColor: theme.border }]}>
            <LegendItem color="#16A34A" label="Uthyrd" theme={theme} />
            <LegendItem color={theme.textMute} label="Ledig" theme={theme} />
          </View>
        </View>
      );
    }

    return (
      <View>
        <Breadcrumbs theme={theme} crumbs={[
          ...(!skipBuilding ? [{ label: "Byggnader", onPress: () => setView({ level: "buildings" }) }] : []),
          { label: building.name || "Byggnad" },
        ]} />
        <Text style={[s.sectionLabel, { color: theme.textMute }]}>
          {skipBuilding ? "VÅNINGAR" : `${(building.name || "BYGGNAD").toUpperCase()} · VÅNINGAR`}
        </Text>
        <View style={{ gap: 8 }}>
          {!hasFloors ? (
            <View style={[s.row, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: "center" }]}>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: theme.textMute }}>
                Inga våningar eller enheter registrerade
              </Text>
            </View>
          ) : building.floors.map((f, i) => {
            const total = f.units.length;
            const occ = f.units.filter(isOccupied).length;
            return (
              <Pressable
                key={f.id}
                onPress={() => setView({ level: "units", buildingIdx, floorIdx: i })}
                style={({ pressed }) => [
                  s.row,
                  { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.92 : 1 },
                ]}
              >
                <View style={[s.floorBadge, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[s.floorBadgeText, { color: theme.text }]}>{f.number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowTitle, { color: theme.text }]}>Våning {f.number}</Text>
                  <Text style={[s.rowSub, { color: theme.textMute }]}>
                    {total} {unitPrefix.toLowerCase()}er · {occ} uthyrda
                  </Text>
                </View>
                <ChevronRight color={theme.textMute} />
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View>
      <Breadcrumbs theme={theme} crumbs={[
        ...(!skipBuilding ? [{ label: "Byggnader", onPress: () => setView({ level: "buildings" }) }] : []),
        { label: building.name || "Byggnad", onPress: () => setView({ level: "floors", buildingIdx }) },
        { label: `Våning ${floor.number}` },
      ]} />
      <Text style={[s.sectionLabel, { color: theme.textMute }]}>
        VÅNING {floor.number} · {unitPrefix.toUpperCase()}ER
      </Text>
      <UnitsGrid theme={theme} units={floor.units} propertyId={propertyId} router={router} />
      <View style={[s.legend, { borderTopColor: theme.border }]}>
        <LegendItem color="#16A34A" label="Uthyrd" theme={theme} />
        <LegendItem color={theme.textMute} label="Ledig" theme={theme} />
      </View>
    </View>
  );
}

function UnitsGrid({
  theme, units, propertyId, router,
}: {
  theme: Theme;
  units: Unit[];
  propertyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  if (units.length === 0) {
    return (
      <View style={[s.row, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: "center" }]}>
        <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: theme.textMute }}>
          Inga enheter registrerade
        </Text>
      </View>
    );
  }
  return (
    <View style={s.grid}>
      {units.map((u) => {
        const occ = isOccupied(u);
        const dot = occ ? "#16A34A" : theme.textMute;
        const bg = occ ? `${theme.accent}10` : theme.surfaceAlt;
        const areaStr = u.area > 0 ? `${formatArea(u.area)} m²` : null;
        return (
          <Pressable
            key={u.id}
            onPress={() =>
              router.push({
                pathname: "/unit/[id]",
                params: { id: u.id, propertyId },
              })
            }
            style={({ pressed }) => [
              s.unitCard,
              { backgroundColor: bg, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[s.unitNumber, { color: theme.text }]}>
                {u.code || u.customUnitId || "—"}
              </Text>
              <View style={[s.unitDot, { backgroundColor: dot }]} />
            </View>
            {areaStr ? (
              <Text style={[s.unitArea, { color: theme.textMute }]} numberOfLines={1}>
                {areaStr}
              </Text>
            ) : null}
            <Text style={[s.unitOccupant, { color: theme.textMute }]} numberOfLines={1}>
              {occ ? occupantFullName(u) : "Ledig"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function formatArea(area: number): string {
  if (Number.isInteger(area)) return area.toString();
  return area.toFixed(1).replace(".", ",");
}

function Breadcrumbs({ theme, crumbs }: { theme: Theme; crumbs: { label: string; onPress?: () => void }[] }) {
  return (
    <View style={s.crumbs}>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Text style={[s.crumbSep, { color: theme.textMute }]}>›</Text>}
          {c.onPress ? (
            <Pressable onPress={c.onPress}>
              <Text style={[s.crumbLink, { color: theme.accent }]}>{c.label}</Text>
            </Pressable>
          ) : (
            <Text style={[s.crumbCurrent, { color: theme.text }]}>{c.label}</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function LegendItem({ color, label, theme }: { color: string; label: string; theme: Theme }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={[s.legendText, { color: theme.textMute }]}>{label}</Text>
    </View>
  );
}

const IconWrap = ({ children, color = "#000", size = 20 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);
const BuildingIcon = (p: any) => <IconWrap {...p}><Path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h.01M8 11h.01M8 15h.01M12 7h.01M12 11h.01M12 15h.01"/></IconWrap>;
const ChevronRight = (p: any) => <IconWrap {...p} size={18}><Path d="M9 6l6 6-6 6"/></IconWrap>;

const s = StyleSheet.create({
  sectionLabel: {
    fontFamily: Fonts.semibold, fontSize: 12, letterSpacing: 0.6,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: Radius.md, padding: 14,
  },
  rowIcon: {
    width: 42, height: 42, borderRadius: Radius.sm,
    alignItems: "center", justifyContent: "center",
  },
  rowTitle: { fontFamily: Fonts.semibold, fontSize: 14 },
  rowSub:   { fontFamily: Fonts.regular, fontSize: 11.5, marginTop: 3 },

  floorBadge: {
    width: 38, height: 38, borderRadius: Radius.sm, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  floorBadgeText: { fontFamily: Fonts.bold, fontSize: 13 },

  crumbs: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  crumbSep:     { fontFamily: Fonts.medium, fontSize: 11 },
  crumbLink:    { fontFamily: Fonts.semibold, fontSize: 11 },
  crumbCurrent: { fontFamily: Fonts.semibold, fontSize: 11 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  unitCard: {
    width: "31%", aspectRatio: 1.2,
    borderWidth: 1, borderRadius: Radius.md,
    padding: 10, justifyContent: "space-between",
  },
  unitNumber:   { fontFamily: Fonts.bold, fontSize: 12 },
  unitDot:      { width: 8, height: 8, borderRadius: 4, marginTop: 3 },
  unitArea:     { fontFamily: Fonts.semibold, fontSize: 10.5 },
  unitOccupant: { fontFamily: Fonts.medium, fontSize: 10 },

  legend: {
    flexDirection: "row", gap: 14, marginTop: 12,
    paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: Fonts.medium, fontSize: 11 },
});
