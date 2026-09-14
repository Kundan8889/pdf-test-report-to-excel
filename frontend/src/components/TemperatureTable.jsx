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
          minHeight: "200px",
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
            marginBottom: "0.85rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.725rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--brand-primary)",
                textTransform: "uppercase",
                marginBottom: "0.25rem",
              }}
            >
              STEP 2 • THERMAL MEASUREMENT MATRIX
            </div>
            <h2
              className="card-title"
              style={{ margin: 0, fontSize: "1.2rem" }}
            >
              Laboratory Temperature Rise Matrix (2-Tier Calibrated)
            </h2>
          </div>
          <span
            className={`badge ${isUploading ? 'badge-primary' : 'badge-neutral'}`}
            style={{
              fontSize: "0.75rem",
              padding: "0.35rem 0.75rem",
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
            gap: "0.5rem",
            margin: "0.85rem 0",
          }}
        >
          {channelList.map((ch, idx) => (
            <span
              key={idx}
              style={{
                fontSize: "0.775rem",
                fontWeight: 600,
                padding: "0.3rem 0.65rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-card-subtle)",
                color: isUploading
                  ? "var(--brand-primary)"
                  : "var(--text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)"
              }}
            >
              <span>{ch.label}</span>
              {isUploading && (
                <span className="spinner spinner-blue" style={{ width: '0.65rem', height: '0.65rem' }} />
              )}
            </span>
          ))}
        </div>

        <div
          style={{
            padding: "1rem",
            borderRadius: "0.65rem",
            backgroundColor: "var(--bg-card-subtle)",
            border: "1px solid var(--border-color)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            textAlign: "center",
          }}
        >
          {isUploading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="spinner spinner-blue" style={{ width: '0.85rem', height: '0.85rem' }} />
              Scanning OCR layers and extracting multi-interval temperature values...
            </span>
          ) : (
            <span>
              Upload your laboratory PDF test report above to populate the calibrated multi-interval matrix.
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

  const hasVibration = intervals.some(
    (r) => r.vibration !== undefined && r.vibration !== null && r.vibration !== "" && r.vibration !== 0
  );

  const handleAddRow = () => {
    if (!onIntervalsChange) return;
    const lastRow = intervals[intervals.length - 1];
    const amb = lastRow ? lastRow.ambient : 28.0;
    const nextRow = {
      time_label: `Interval ${intervals.length + 1}`,
      direction: 'CW',
      ambient: amb,
      noise: lastRow ? lastRow.noise : 72.0,
      vibration: lastRow ? lastRow.vibration : 0.50,
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
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.725rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--brand-primary)",
              textTransform: "uppercase",
              marginBottom: "0.25rem",
            }}
          >
            STEP 2 • THERMAL MEASUREMENT MATRIX
          </div>
          <h2 className="card-title" style={{ margin: 0, fontSize: "1.2rem" }}>
            Laboratory Temperature Rise Matrix ({intervals.length} Intervals)
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Multi-interval thermal log (Input, Body, Body, Bearing Covers 1-5, Output &amp; Ambient).
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddRow}
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
            title="Add a new test interval row"
          >
            ➕ Add Row
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
                padding: "0.4rem 0.75rem",
                backgroundColor: resetFeedback ? "var(--success-bg)" : "var(--bg-card-subtle)",
                borderColor: resetFeedback ? "var(--success-border)" : "var(--border-color)",
                color: resetFeedback ? "var(--success-text)" : "var(--text-primary)",
                fontWeight: resetFeedback ? 700 : 600,
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
                padding: "0.4rem 0.75rem",
                backgroundColor: "var(--danger-bg)",
                borderColor: "var(--danger-border)",
                color: "var(--danger-text)"
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
              gap: "0.4rem",
              padding: "0.35rem 0.65rem",
              fontSize: "0.825rem",
              boxShadow: "0 1px 3px rgba(16, 185, 129, 0.15)"
            }}
          >
            <span>Criteria: ΔT &lt;</span>
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
                border: "1px solid var(--success-border)",
                borderRadius: "0.35rem",
                padding: "0.15rem 0.25rem",
                outline: "none"
              }}
              title="Click and type to change temperature rise limit (e.g. 40°C, 45°C or 30°C)"
            />
            <span>°C over Ambient</span>
          </div>
        </div>
      </div>

      {/* Noise Level & Limit Banners */}
      <div
        style={{
          backgroundColor: "var(--bg-card-subtle)",
          border: "1px solid var(--border-color)",
          borderRadius: "0.65rem",
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.85rem",
          fontSize: "0.875rem",
          color: "var(--text-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Noise Level Limit:</span>
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
                width: "84px",
                padding: "0.2rem 0.45rem",
                borderRadius: "0.35rem",
                border: "1px solid var(--border-color)",
                fontSize: "0.85rem",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                fontWeight: 700,
                textAlign: "center"
              }}
              title="Click and type to adjust noise limit"
            />
          </div>
          <span style={{ color: "var(--border-dashed)" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Measured Noise:</span>
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
                padding: "0.2rem 0.45rem",
                borderRadius: "0.35rem",
                border: "1px solid var(--success-border)",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--success-text)",
                backgroundColor: "var(--bg-card)",
                textAlign: "center",
                boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.1)"
              }}
              title="Click and type to edit measured noise level"
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Acceptance Criteria:</span>
          <span className="badge badge-neutral" style={{ fontWeight: 600, fontSize: '0.8rem' }}>
            {metadata?.temp_rise_limit || "Temperature rise < 40°C over ambient (after 1 hr)"}
          </span>
        </div>
      </div>

      {/* Exact Table Layout with Auto-Scroll on Large Datasets */}
      <div
        style={{
          overflowX: "auto",
          overflowY: intervals.length > 7 ? "auto" : "visible",
          maxHeight: intervals.length > 7 ? "520px" : "none",
          border: "1px solid var(--table-border)",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
          position: "relative"
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
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
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
                  position: "sticky",
                  top: 0,
                  zIndex: 12,
                  backgroundColor: "var(--table-head-bg)",
                  border: "1px solid var(--table-inner-border)",
                  padding: "0.45rem 0.35rem",
                  minWidth: "100px",
                  width: "100px",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  fontSize: "0.8rem"
                }}
              >
                Time
              </th>
              <th
                rowSpan="2"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 12,
                  backgroundColor: "var(--table-head-bg)",
                  border: "1px solid var(--table-inner-border)",
                  padding: "0.45rem 0.35rem",
                  minWidth: "75px",
                  width: "75px",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  fontSize: "0.8rem"
                }}
              >
                Direction
              </th>
              {dynamicChannelList.map((ch, idx) => (
                <th
                  key={idx}
                  colSpan="2"
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 11,
                    backgroundColor: "var(--table-head-bg)",
                    border: "1px solid var(--table-inner-border)",
                    padding: "0.45rem 0.3rem",
                    minWidth: "124px",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "var(--text-primary)"
                  }}
                >
                  {ch.label}
                </th>
              ))}
              <th
                rowSpan="2"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 12,
                  backgroundColor: "var(--table-head-bg)",
                  border: "1px solid var(--table-inner-border)",
                  padding: "0.45rem 0.35rem",
                  minWidth: "80px",
                  width: "80px",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "var(--brand-primary)"
                }}
              >
                Ambient (°C)
              </th>
              <th
                rowSpan="2"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 12,
                  backgroundColor: "var(--table-head-bg)",
                  border: "1px solid var(--table-inner-border)",
                  padding: "0.45rem 0.35rem",
                  minWidth: "75px",
                  width: "75px",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "var(--success-text)"
                }}
              >
                Noise (dB)
              </th>
              {hasVibration && (
                <th
                  rowSpan="2"
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 12,
                    backgroundColor: "var(--table-head-bg)",
                    border: "1px solid var(--table-inner-border)",
                    padding: "0.45rem 0.35rem",
                    minWidth: "80px",
                    width: "80px",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "var(--text-primary)"
                  }}
                >
                  Vibration (cm/s)
                </th>
              )}
              <th
                rowSpan="2"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 12,
                  backgroundColor: "var(--table-head-bg)",
                  border: "1px solid var(--table-inner-border)",
                  padding: "0.45rem 0.25rem",
                  minWidth: "50px",
                  width: "50px",
                  fontWeight: 700,
                  fontSize: "0.78rem"
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
                      position: "sticky",
                      top: "30px",
                      zIndex: 11,
                      backgroundColor: "var(--table-subhead-bg)",
                      border: "1px solid var(--table-inner-border)",
                      padding: "0.3rem 0.2rem",
                      minWidth: "62px",
                      width: "62px",
                      fontSize: "0.725rem",
                      fontWeight: 600
                    }}
                  >
                    Actual (°C)
                  </th>
                  <th
                    style={{
                      position: "sticky",
                      top: "30px",
                      zIndex: 11,
                      border: "1px solid var(--table-inner-border)",
                      padding: "0.3rem 0.2rem",
                      minWidth: "62px",
                      width: "62px",
                      backgroundColor: "var(--table-rise-bg)",
                      color: "var(--table-rise-text)",
                      fontSize: "0.725rem",
                      fontWeight: 700
                    }}
                  >
                    ΔT Rise (°C)
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {intervals.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="table-data-row"
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
                    padding: "0.2rem 0.25rem",
                    minWidth: "100px",
                    width: "100px",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="text"
                    className="table-input-field"
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
                      fontWeight: 700,
                    }}
                  />
                </td>

                {/* Column 2: Direction */}
                <td
                  style={{
                    border: "1px solid var(--table-inner-border)",
                    padding: "0.2rem 0.25rem",
                    minWidth: "75px",
                    width: "75px",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="text"
                    className="table-input-field"
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
                      fontWeight: 700,
                    }}
                  />
                </td>

                {/* Dynamic Temperature Component Columns */}
                {dynamicChannelList.map((ch, cIdx) => {
                  const actVal = row[ch.actKey] ?? 0;
                  const riseVal = row[ch.riseKey] ?? 0;
                  const displayAct = actVal !== "" && actVal !== undefined && actVal !== null
                    ? (typeof actVal === "number" ? actVal.toFixed(1) : actVal)
                    : "";
                  return (
                    <React.Fragment key={cIdx}>
                      <td
                        style={{
                          border: "1px solid var(--table-inner-border)",
                          padding: "0.15rem 0.2rem",
                          minWidth: "62px",
                          width: "62px"
                        }}
                      >
                        <input
                          type="text"
                          className="table-input-field"
                          value={displayAct}
                          onChange={(e) =>
                            handleCellChange(rIdx, ch.actKey, e.target.value)
                          }
                          onBlur={(e) => {
                            const num = parseFloat(e.target.value);
                            if (!isNaN(num)) {
                              handleCellChange(rIdx, ch.actKey, parseFloat(num.toFixed(1)));
                            }
                          }}
                        />
                      </td>
                      <td
                        style={{
                          border: "1px solid var(--table-inner-border)",
                          padding: "0.15rem 0.2rem",
                          minWidth: "62px",
                          width: "62px",
                          fontWeight: 700,
                          fontSize: "0.8rem",
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
                    padding: "0.15rem 0.2rem",
                    minWidth: "80px",
                    width: "80px"
                  }}
                >
                  <input
                    type="text"
                    className="table-input-field"
                    value={row.ambient !== "" && row.ambient !== undefined && row.ambient !== null ? (typeof row.ambient === "number" ? row.ambient.toFixed(1) : row.ambient) : ""}
                    onChange={(e) =>
                      handleCellChange(rIdx, "ambient", e.target.value)
                    }
                    onBlur={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) {
                        handleCellChange(rIdx, "ambient", parseFloat(num.toFixed(1)));
                      }
                    }}
                    style={{
                      fontWeight: 700,
                      color: "var(--brand-primary)",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "0.3rem",
                      padding: "0.15rem 0.2rem",
                      fontSize: "0.8rem"
                    }}
                  />
                </td>

                {/* Noise Column */}
                <td
                  style={{
                    border: "1px solid var(--table-inner-border)",
                    padding: "0.15rem 0.2rem",
                    minWidth: "75px",
                    width: "75px"
                  }}
                >
                  <input
                    type="text"
                    className="table-input-field"
                    placeholder="72.0"
                    value={row.noise !== "" && row.noise !== undefined && row.noise !== null ? (typeof row.noise === "number" ? row.noise.toFixed(1) : row.noise) : ""}
                    onChange={(e) => {
                      const updated = [...intervals];
                      updated[rIdx] = {
                        ...updated[rIdx],
                        noise: e.target.value,
                      };
                      onIntervalsChange(updated);
                    }}
                    onBlur={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) {
                        const updated = [...intervals];
                        updated[rIdx] = {
                          ...updated[rIdx],
                          noise: parseFloat(num.toFixed(1)),
                        };
                        onIntervalsChange(updated);
                      }
                    }}
                    style={{
                      fontWeight: 700,
                      color: "var(--success-text)",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "0.3rem",
                      padding: "0.15rem 0.2rem",
                      fontSize: "0.8rem"
                    }}
                  />
                </td>

                {/* Vibration Column */}
                {hasVibration && (
                  <td
                    style={{
                      border: "1px solid var(--table-inner-border)",
                      padding: "0.15rem 0.2rem",
                      minWidth: "80px",
                      width: "80px"
                    }}
                  >
                    <input
                      type="text"
                      className="table-input-field"
                      placeholder="0.59"
                      value={row.vibration !== "" && row.vibration !== undefined && row.vibration !== null ? (typeof row.vibration === "number" ? row.vibration.toFixed(2) : row.vibration) : ""}
                      onChange={(e) => {
                        const updated = [...intervals];
                        updated[rIdx] = {
                          ...updated[rIdx],
                          vibration: e.target.value,
                        };
                        onIntervalsChange(updated);
                      }}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) {
                          const updated = [...intervals];
                          updated[rIdx] = {
                            ...updated[rIdx],
                            vibration: parseFloat(num.toFixed(2)),
                          };
                          onIntervalsChange(updated);
                        }
                      }}
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "0.3rem",
                        padding: "0.15rem 0.2rem",
                        fontSize: "0.8rem"
                      }}
                    />
                  </td>
                )}

                {/* Delete Row Action */}
                <td
                  style={{
                    border: "1px solid var(--table-inner-border)",
                    padding: "0.15rem 0.2rem",
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
                      opacity: intervals.length <= 1 ? 0.3 : 0.75,
                      fontSize: "0.85rem",
                      transition: "transform 0.15s ease, opacity 0.15s ease",
                    }}
                    onMouseEnter={(e) => { if (intervals.length > 1) e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { if (intervals.length > 1) e.currentTarget.style.opacity = '0.75'; }}
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
                  padding: "0.6rem 0.85rem",
                  fontWeight: 700,
                  textAlign: "left",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem"
                }}
              >
                Lubrication leakage
              </td>
              <td
                colSpan={dynamicChannelList.length * 2 + 2 + (hasVibration ? 1 : 0) + 1}
                style={{
                  border: "1px solid var(--table-inner-border)",
                  padding: "0.6rem 0.85rem",
                  fontWeight: 700,
                  color: "var(--success-text)",
                  textAlign: "center",
                  fontSize: "0.85rem"
                }}
              >
                <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                  ✓ {metadata?.lubrication_leakage || "No leakage observed during full test duration"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

