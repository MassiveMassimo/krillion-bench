"use client";

import { useState } from "react";
import { InputField, InputGroup } from "@/components/ui/input-group";
import { TabsSubtle, TabsSubtleItem } from "@/components/ui/tabs-subtle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { aggregateEvaluations } from "@/evaluation/aggregate";
import { fontWeights } from "@/lib/font-weight";
import { useIcons } from "@/lib/icon-context";
import { typeClass } from "@/lib/type-scale";

type Summary = ReturnType<typeof aggregateEvaluations>;
const headingWeight = { fontVariationSettings: fontWeights.semibold };
const meanLabel = (row: Summary[number]) => row.meanPoints?.toFixed(2) ?? "Pending";

export function ModelComparison({ rows }: { rows: Summary }) {
  const [order, setOrder] = useState<"points" | "model">("points");
  const [search, setSearch] = useState("");
  const icons = useIcons();
  const query = search.trim().toLowerCase();
  const ordered = rows
    .filter((row) => row.model.toLowerCase().includes(query))
    .toSorted((a, b) =>
      order === "points"
        ? (b.meanPoints ?? -1) - (a.meanPoints ?? -1)
        : a.model.localeCompare(b.model),
    );
  return (
    <>
      <div className="comparison-toolbar">
        <div className="comparison-order">
          <span id="comparison-order-label" className={typeClass("caption")}>
            Order by
          </span>
          <TabsSubtle
            selectedIndex={order === "points" ? 0 : 1}
            onSelect={(index) => setOrder(index === 0 ? "points" : "model")}
            aria-labelledby="comparison-order-label"
          >
            <TabsSubtleItem
              index={0}
              label="Mean points"
              className="min-h-11"
              id="comparison-order-points"
              aria-controls="comparison-results"
            />
            <TabsSubtleItem
              index={1}
              label="Model"
              className="min-h-11"
              id="comparison-order-model"
              aria-controls="comparison-results"
            />
          </TabsSubtle>
        </div>
        <InputGroup className="comparison-search">
          <InputField
            index={0}
            label="Search models"
            labelHidden
            placeholder="Search models"
            icon={icons.search}
            type="search"
            value={search}
            onChange={setSearch}
            aria-controls="comparison-results"
          />
        </InputGroup>
      </div>
      <p
        role="status"
        className={`comparison-search-status ${typeClass("caption")}${query ? "" : " sr-only"}`}
      >
        {ordered.length === 0
          ? "No models match your search. Try another name."
          : `${ordered.length} of ${rows.length} configurations shown.`}
      </p>
      <div
        id="comparison-results"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`comparison-order-${order}`}
      >
        {ordered.length > 0 && (
          <>
            <div className="desktop-results model-comparison">
              <Table aria-label="Development model comparison" aria-describedby="comparison-note">
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col" aria-sort={order === "model" ? "ascending" : undefined}>
                      Model
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="points-column"
                      aria-sort={order === "points" ? "descending" : undefined}
                    >
                      Mean points
                    </TableHead>
                    <TableHead scope="col" className="points-column">
                      Accepted
                    </TableHead>
                    <TableHead scope="col" className="points-column">
                      Scored coverage
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordered.map((row, index) => (
                    <TableRow index={index} key={`${row.model}-${row.requestedEffort}-${row.mode}`}>
                      <TableHead scope="row" className="comparison-model">
                        {row.model} ({row.requestedEffort})
                      </TableHead>
                      <TableCell className="points-column comparison-mean" style={headingWeight}>
                        {meanLabel(row)}
                      </TableCell>
                      <TableCell className="points-column">
                        {row.accepted} / {row.expected}
                      </TableCell>
                      <TableCell className="points-column">
                        {row.scored} / {row.expected}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul
              className="mobile-results comparison-mobile"
              aria-label="Development model comparison"
              aria-describedby="comparison-note"
            >
              {ordered.map((row) => (
                <li key={`${row.model}-${row.requestedEffort}-${row.mode}`}>
                  <div className="mobile-row-heading">
                    <h3 className={typeClass("subtitle")} style={headingWeight}>
                      {row.model} ({row.requestedEffort})
                    </h3>
                  </div>
                  <dl className={typeClass("body")}>
                    <div>
                      <dt>Mean native points</dt>
                      <dd className="comparison-mean" style={headingWeight}>
                        {meanLabel(row)}
                      </dd>
                    </div>
                    <div>
                      <dt>Accepted</dt>
                      <dd>
                        {row.accepted} / {row.expected}
                      </dd>
                    </div>
                    <div>
                      <dt>Scored coverage</dt>
                      <dd>
                        {row.scored} / {row.expected}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
