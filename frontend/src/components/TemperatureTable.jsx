import React, { useState } from "react";

export default function TemperatureTable({
  metadata,
  intervals,
  onIntervalsChange,
  onMetadataChange,
  onResetToOriginal,
  onResetAll,
  isUploading,
}) {
  const [resetFeedback, setResetFeedback] = useState(false);

  // Dynamic / manual configurable threshold limit
  const parseThreshold = (limitStr) => {
    if (!limitStr) return 40.0;
    const match = String(limitStr).match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 40.0;
  };

  const [thresholdLimit, setThresholdLimit] = useState(() =>
    parseThreshold(metadata?.temp_rise_limit)
  );

  React.useEffect(() => {
    if (metadata?.temp_rise_limit) {
      setThresholdLimit(parseThreshold(metadata.temp_rise_limit));
    }
  }, [metadata?.temp_rise_limit]);

  const handleThresholdChange = (newVal) => {
    const num = parseFloat(newVal) || 0;
    setThresholdLimit(num);
    if (onMetadataChange && metadata) {
      onMetadataChange({
        ...metadata,
        temp_rise_limit: `< ${num}°C over the ambient ( after 1hour )`,
      });
    }
  };
  const channelDefinitions = [
    { key: "input", actKey: "input_actual", riseKey: "input_rise", defaultLabel: "Input" },
    { key: "body1", actKey: "body_actual", riseKey: "body_rise", defaultLabel: "Body" },
    { key: "body2", actKey: "body2_actual", riseKey: "body2_rise", defaultLabel: "Body" },
    { key: "bc1", actKey: "bc1_actual", riseKey: "bc1_rise", defaultLabel: "Bearing Cover 1" },
    { key: "bc2", actKey: "bc2_actual", riseKey: "bc2_rise", defaultLabel: "Bearing Cover 2" },
    { key: "bc3", actKey: "bc3_actual", riseKey: "bc3_rise", defaultLabel: "Bearing Cover 3" },
    { key: "bc4", actKey: "bc4_actual", riseKey: "bc4_rise", defaultLabel: "Bearing Cover 4" },
    { key: "bc5", actKey: "bc5_actual", riseKey: "bc5_rise", defaultLabel: "Bearing Cover 5" },
    { key: "output", actKey: "output_actual", riseKey: "output_rise", defaultLabel: "Output" },
  ];

  const rawLabels = metadata?.channel_labels || [];
  const cleanLabels = Array.isArray(rawLabels)
    ? rawLabels.filter(
        (l) =>
          !/^(ambient|amb|ambt|noise|noies|sound|db|time|direction|direct|-|\s*)$/i.test(
            String(l).trim()
          )
      )
    : [];

  const dynamicChannelList = cleanLabels.length > 0
    ? cleanLabels.map((lbl, idx) => {
        const baseDef = channelDefinitions[idx] || {
          key: `ch_${idx}`,
          actKey: `ch_${idx}_actual`,
          riseKey: `ch_${idx}_rise`,
          defaultLabel: `Channel ${idx + 1}`
        };
        return {
          ...baseDef,
          label: String(lbl).trim()
        };
      })
    : channelDefinitions;

  const channelList = [
    ...dynamicChannelList,
    { key: "ambient", label: "Ambient" },
  ];

  if (!intervals || intervals.length === 0) {
    return (
      <div
        className="card"
        style={{
          minHeight: "180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "0.2rem",
              }}
            >
              THERMAL MEASUREMENT MATRIX
            </div>
            <h2
              className="card-title"
              style={{ margin: 0, fontSize: "1.05rem" }}
            >
              Laboratory Temperature Rise Matrix (2-Tier Calibrated)
            </h2>
          </div>
          <span
            className="badge"
            style={{
              backgroundColor: isUploading
                ? "var(--info-box-bg)"
                : "var(--bg-card-subtle)",
              color: isUploading
                ? "var(--brand-primary)"
                : "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              fontSize: "0.75rem",
              padding: "0.35rem 0.65rem",
            }}
          >
            {isUploading
              ? "⟳ Channels Mapped (10/10)"
              : "Awaiting Document Stream"}
          </span>
        </div>

        {/* Channel Badges Grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
            margin: "0.75rem 0",
          }}
        >
          {channelList.map((ch, idx) => (
            <span
              key={idx}
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-card-subtle)",
                color: isUploading
                  ? "var(--brand-primary)"
                  : "var(--text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <span>{ch.label}</span>
              {isUploading && (
                <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>⟳</span>
              )}
            </span>
          ))}
        </div>

        <div
          style={{
            padding: "0.75rem",
            borderRadius: "0.375rem",
            backgroundColor: "var(--bg-card-subtle)",
            border: "1px solid var(--border-color)",
            fontSize: "0.825rem",
            color: "var(--text-secondary)",
            textAlign: "center",
          }}
        >
          {isUploading ? (
            <span>
              Scanning OCR layers and extracting multi-interval temperature
              values...
            </span>
          ) : (
            <span>
              Upload your laboratory PDF test report above to populate the
              calibrated multi-interval matrix.
            </span>
          )}
        </div>
      </div>
    );
  }

  const handleCellChange = (rowIndex, field, value) => {
    if (!onIntervalsChange) return;
    const updated = [...intervals];
    const numVal = parseFloat(value) || 0;
    updated[rowIndex] = {
      ...updated[rowIndex],
      [field]: numVal,
    };

    // Auto recalculate temp rise (Actual - Ambient)
    const amb = updated[rowIndex].ambient || 28.0;
    const compKey = field.replace("_actual", "");
    if (field.endsWith("_actual")) {
      updated[rowIndex][`${compKey}_rise`] = parseFloat(
        (numVal - amb).toFixed(1),
      );
    } else if (field === "ambient") {
      [
        "input",
        "body",
        "body2",
        "bc1",
        "bc2",
        "bc3",
        "bc4",
        "bc5",
        "output",
      ].forEach((k) => {
        const act = updated[rowIndex][`${k}_actual`] || 0;
        updated[rowIndex][`${k}_rise`] = parseFloat((act - numVal).toFixed(1));
      });
    }

    onIntervalsChange(updated);
  };

  const handleAddRow = () => {
    if (!onIntervalsChange) return;
    const lastRow = intervals[intervals.length - 1];
    const amb = lastRow ? lastRow.ambient : 28.0;
    const nextRow = {
      time_label: `Interval ${intervals.length + 1}`,
      direction: 'CW',
      ambient: amb,
      input_actual: lastRow ? lastRow.input_actual : 28.0,
      input_rise: 0.0,
      body_actual: lastRow ? lastRow.body_actual : 27.0,
      body_rise: 0.0,
      body2_actual: lastRow ? lastRow.body2_actual : 27.0,
      body2_rise: 0.0,
      bc1_actual: lastRow ? lastRow.bc1_actual : 27.0,
      bc1_rise: 0.0,
      bc2_actual: lastRow ? lastRow.bc2_actual : 27.0,
      bc2_rise: 0.0,
      bc3_actual: lastRow ? lastRow.bc3_actual : 27.0,
      bc3_rise: 0.0,
      bc4_actual: lastRow ? lastRow.bc4_actual : 27.0,
      bc4_rise: 0.0,
      bc5_actual: lastRow ? lastRow.bc5_actual : 27.0,
      bc5_rise: 0.0,
      output_actual: lastRow ? lastRow.output_actual : 27.0,
      output_rise: 0.0,
    };
    onIntervalsChange([...intervals, nextRow]);
  };

  const handleDeleteRow = (index) => {
    if (!onIntervalsChange || intervals.length <= 1) return;
    const updated = intervals.filter((_, i) => i !== index);
    onIntervalsChange(updated);
  };

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <h2 className="card-title" style={{ margin: 0 }}>
            Laboratory Temperature Rise Matrix ({intervals.length} Intervals)
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Multi-interval thermal log (Input, Body, Body, Bearing Covers 1-5,
            Output & Ambient).
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddRow}
            style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
            title="Add a new test interval row"
          >
            ➕ Add Interval Row
          </button>
          {onResetToOriginal && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onResetToOriginal();
                setResetFeedback(true);
                setTimeout(() => setResetFeedback(false), 2000);
              }}
              style={{
                fontSize: "0.8rem",
                padding: "0.35rem 0.65rem",
                backgroundColor: resetFeedback ? "var(--success-bg)" : "var(--bg-card-subtle)",
                borderColor: resetFeedback ? "var(--success-text)" : "var(--border-color)",
                color: resetFeedback ? "var(--success-text)" : "var(--text-primary)",
                fontWeight: resetFeedback ? 700 : 500,
                transition: "all 0.2s ease"
              }}
              title="Reset table back to original extracted readings"
            >
              {resetFeedback ? "✓ Table Reset!" : "🔄 Reset Table"}
            </button>
          )}
          {onResetAll && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onResetAll}
              style={{
                fontSize: "0.8rem",
                padding: "0.35rem 0.65rem",
                backgroundColor: "var(--bg-card-subtle)",
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)"
              }}
              title="Clear report and upload a new PDF"
            >
              🗑️ Upload New PDF
            </button>
          )}
          <div
            className="badge badge-success"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.55rem",
              fontSize: "0.8rem",
            }}
          >
            <span>Criteria: Temp Rise &lt;</span>
            <input
              type="number"
              step="1"
              min="1"
              max="200"
              value={thresholdLimit}
              onChange={(e) => handleThresholdChange(e.target.value)}
              style={{
                width: "48px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "var(--success-text)",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--success-text)",
                borderRadius: "0.25rem",
                padding: "0.1rem 0.2rem",
                outline: "none"
              }}
              title="Click and type to change temperature rise limit (e.g. 45°C or 30°C)"
            />
            <span>°C over Ambient</span>
          </div>
        </div>
      </div>

      {/* Noise Level & Limit Banners */}
      <div
        style={{
          backgroundColor: "var(--info-box-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: "0.375rem",
          padding: "0.6rem 0.85rem",
          marginBottom: "0.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          fontSize: "0.85rem",
          color: "var(--text-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <strong>Noise Level Limit:</strong>
            <input
              type="text"
              value={metadata?.noise_level_limit || "< 85 dB"}
              onChange={(e) => {
                if (onMetadataChange && metadata) {
                  onMetadataChange({
                    ...metadata,
                    noise_level_limit: e.target.value
                  });
                }
              }}
              style={{
                width: "80px",
                padding: "0.15rem 0.35rem",
                borderRadius: "0.25rem",
                border: "1px solid var(--border-color)",
                fontSize: "0.85rem",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                fontWeight: 600,
                textAlign: "center"
              }}
              title="Click and type to adjust noise limit"
            />
          </div>
          <span>&nbsp;|&nbsp;</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <strong>Measured Noise:</strong>
            <input
              type="text"
              value={metadata?.noise_level_measured || ""}
              placeholder="e.g. 78.5 dB"
              onChange={(e) => {
                if (onMetadataChange && metadata) {
                  onMetadataChange({
                    ...metadata,
                    noise_level_measured: e.target.value
                  });
                }
              }}
              style={{
                width: "95px",
                padding: "0.15rem 0.35rem",
                borderRadius: "0.25rem",
                border: "1px solid var(--success-text)",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--success-text)",
                backgroundColor: "var(--bg-card)",
                textAlign: "center"
              }}
              title="Click and type to edit measured noise level"
            />
          </div>
        </div>
        <div>
          <strong>Acceptance Criteria:</strong>{" "}
          {metadata?.temp_rise_limit ||
            "Temperature rise < 40°C over ambient (after 1 hr)"}
        </div>
      </div>

      {/* Exact Table Layout */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid var(--table-border)",
          borderRadius: "0.375rem",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center",
            fontSize: "0.825rem",
          }}
        >
          <thead>
            {/* Top Tier Headers */}
            <tr
              style={{
                backgroundColor: "var(--table-head-bg)",
                borderBottom: "1px solid var(--table-border)",
                color: "var(--text-primary)",
              }}
            >
              <th
                rowSpan="2"
                style={{
                  border: "1px solid var(--table-border)",
                  padding: "0.5rem",
                  minWidth: "115px",
                  width: "115px",
                  whiteSpace: "nowrap",
                }}
              >
                Time
              </th>
              <th
                rowSpan="2"
                style={{
                  border: "1px solid var(--table-border)",
                  padding: "0.5rem",
                  minWidth: "90px",
                  width: "90px",
                  whiteSpace: "nowrap",
                }}
              >
                Direction
              </th>
              {dynamicChannelList.map((ch, idx) => (
                <th
                  key={idx}
                  colSpan="2"
                  style={{
                    border: "1px solid var(--table-border)",
                    padding: "0.4rem",
                    minWidth: "140px",
                  }}
                >
                  {ch.label}
                </th>
              ))}
              <th
                rowSpan="2"
                style={{
                  border: "1px solid var(--table-border)",
                  padding: "0.5rem",
                  minWidth: "95px",
                  width: "95px",
                }}
              >
                ambient
              </th>
              <th
                rowSpan="2"
                style={{
                  border: "1px solid var(--table-border)",
                  padding: "0.5rem",
                  minWidth: "60px",
                  width: "60px",
                }}
              >
                Action
              </th>
            </tr>
            {/* Sub Tier Headers */}
            <tr
              style={{
                backgroundColor: "var(--table-subhead-bg)",
                borderBottom: "2px solid var(--table-border)",
                color: "var(--text-secondary)",
              }}
            >
              {dynamicChannelList.map((_, i) => (
                <React.Fragment key={i}>
                  <th
                    style={{
                      border: "1px solid var(--table-inner-border)",
                      padding: "0.35rem 0.2rem",
                      minWidth: "70px",
                      width: "70px",
                    }}
                  >
                    Actual Temp
                  </th>
                  <th
                    style={{
                      border: "1px solid var(--table-inner-border)",
                      padding: "0.35rem 0.2rem",
                      minWidth: "70px",
                      width: "70px",
                      backgroundColor: "var(--table-rise-bg)",
                      color: "var(--table-rise-text)",
                    }}
                  >
                    Temp Rise
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {intervals.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  backgroundColor:
                    rIdx % 2 === 0
                      ? "var(--table-row-even)"
                      : "var(--table-row-odd)",
                  color: "var(--text-primary)",
                }}
              >
                {/* Column 1: Time */}
                <td
                  style={{
                    border: "1px solid var(--table-inner-border)",
                    padding: "0.35rem 0.4rem",
                    minWidth: "115px",
                    width: "115px",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="text"
                    value={row.time_label || ''}
                    title={row.time_label}
                    placeholder="10:00 AM"
                    onChange={(e) => {
                      const updated = [...intervals];
                      updated[rIdx] = {
                        ...updated[rIdx],
                        time_label: e.target.value,
                      };
                      onIntervalsChange(updated);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "1px solid transparent",
                      borderRadius: "0.25rem",
                      padding: "0.2rem 0.3rem",
                      color: "var(--text-primary)",
                      backgroundColor: "transparent",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  />
                </td>

                {/* Column 2: Direction */}
                <td
                  style={{
                    border: "1px solid var(--table-inner-border)",
                    padding: "0.35rem 0.3rem",
                    minWidth: "90px",
                    width: "90px",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="text"
                    value={row.direction || ''}
                    title={row.direction}
                    placeholder="CW"
                    onChange={(e) => {
                      const updated = [...intervals];
                      updated[rIdx] = {
                        ...updated[rIdx],
                        direction: e.target.value,
                      };
                      onIntervalsChange(updated);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "1px solid transparent",
                      borderRadius: "0.25rem",
                      padding: "0.2rem 0.3rem",
                      color: "var(--text-primary)",
                      backgroundColor: "transparent",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  />
                </td>

                {/* Dynamic Temperature Component Columns */}
                {dynamicChannelList.map((ch, cIdx) => {
                  const actVal = row[ch.actKey] ?? 0;
                  const riseVal = row[ch.riseKey] ?? 0;
                  return (
                    <React.Fragment key={cIdx}>
                      <td
                        style={{
                          border: "1px solid var(--table-inner-border)",
                          padding: "0.25rem",
                        }}
                      >
                        <input
                          type="number"
                          step="0.1"
                          value={actVal}
                          onChange={(e) =>
                            handleCellChange(rIdx, ch.actKey, e.target.value)
                          }
                          style={{
                            width: "100%",
                            textAlign: "center",
                            border: "1px solid transparent",
                            padding: "0.15rem",
                            color: "var(--text-primary)",
                            backgroundColor: "transparent",
                          }}
                        />
                      </td>
                      <td
                        style={{
                          border: "1px solid var(--table-inner-border)",
                          padding: "0.25rem",
                          fontWeight: 600,
                          color:
                            riseVal > thresholdLimit
                              ? "var(--danger-text)"
                              : "var(--table-rise-text)",
                          backgroundColor: "var(--table-rise-bg)",
                        }}
                      >
                        {riseVal > 0 ? `+${Number(riseVal).toFixed(1)}` : Number(riseVal).toFixed(1)}
                      </td>
                    </React.Fragment>
                  );
                })}

                {/* Ambient */}
                <td
                  style={{
                    border: "1px solid var(--table-inner-border)",
                    padding: "0.25rem",
                  }}
                >
                  <input
                    type="number"
                    step="0.1"
                    value={row.ambient}
                    onChange={(e) =>
                      handleCellChange(rIdx, "ambient", e.target.value)
                    }
                    style={{
                      width: "100%",
                      textAlign: "center",
                      fontWeight: 600,
                      color: "var(--brand-primary)",
                      border: "1px solid var(--table-inner-border)",
                      borderRadius: "0.25rem",
                      padding: "0.15rem",
                      backgroundColor: "var(--bg-card)",
                    }}
                  />
                </td>

                {/* Delete Row Action */}
                <td
                  style={{
                    border: "1px solid var(--table-inner-border)",
                    padding: "0.25rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(rIdx)}
                    disabled={intervals.length <= 1}
                    title="Delete this interval row"
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: intervals.length <= 1 ? "not-allowed" : "pointer",
                      opacity: intervals.length <= 1 ? 0.3 : 0.8,
                      fontSize: "0.85rem",
                    }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}

            {/* Footer row: Lubrication Leakage */}
            <tr
              style={{
                backgroundColor: "var(--table-subhead-bg)",
                borderTop: "2px solid var(--table-border)",
              }}
            >
              <td
                colSpan="2"
                style={{
                  border: "1px solid var(--table-inner-border)",
                  padding: "0.45rem",
                  fontWeight: 700,
                  textAlign: "left",
                  color: "var(--text-primary)",
                }}
              >
                Lubrication leakage
              </td>
              <td
                colSpan="10"
                style={{
                  border: "1px solid var(--table-inner-border)",
                  padding: "0.45rem",
                  fontWeight: 600,
                  color: "var(--success-text)",
                }}
              >
                {metadata?.lubrication_leakage || "No leakage"}
              </td>
              <td
                colSpan="10"
                style={{
                  border: "1px solid var(--table-inner-border)",
                  padding: "0.45rem",
                  fontWeight: 600,
                  color: "var(--success-text)",
                }}
              >
                {metadata?.lubrication_leakage || "No leakage"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
