// /************************************************
//  *  HIERARCHICAL TREE TABLE
//  *  Region → Channel → (Direct, Seasonality, Holidays, Trends)
//  ************************************************/ 
// import React, { useEffect, useMemo, useState, useCallback, createContext, useContext } from "react";

// function TreeTable({ data }) {
//   const [openRegion, setOpenRegion] = useState({});
//   const [openChannel, setOpenChannel] = useState({});

//   const subCategories = ["Direct", "Seasonality", "Holidays", "Trends"];

//   // Group data: region → channel → aggregated metrics
//   const grouped = useMemo(() => {
//     const map = {};

//     data.forEach(row => {
//       const region = row.region || "Unknown";
//       const channel = row.channel || "Unknown";

//       if (!map[region]) map[region] = {};
//       if (!map[region][channel]) {
//         map[region][channel] = {
//           spend: 0,
//           revenue: 0,
//           impressions: 0,
//           conversions: 0,
//           clicks: 0,
//         };
//       }

//       map[region][channel].spend += Number(row.spend || 0);
//       map[region][channel].revenue += Number(row.revenue || 0);
//       map[region][channel].impressions += Number(row.impressions || 0);
//       map[region][channel].conversions += Number(row.conversions || 0);
//       map[region][channel].clicks += Number(row.clicks || 0);
//     });

//     return map;
//   }, [data]);

//   const toggleRegion = (region) => {
//     setOpenRegion(prev => ({ ...prev, [region]: !prev[region] }));
//   };

//   const toggleChannel = (channel) => {
//     setOpenChannel(prev => ({ ...prev, [channel]: !prev[channel] }));
//   };

//   const rowStyle = {
//     display: "flex",
//     padding: "8px 6px",
//     borderTop: "1px solid #eee",
//     alignItems: "center"
//   };

//   const cell = (w) => ({
//     width: w,
//     fontSize: 14
//   });

//   return (
//     <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginTop: 20 }}>
//       <div style={{ ...rowStyle, fontWeight: "bold", borderTop: "none" }}>
//         <div style={{ width: 200 }}>Category</div>
//         <div style={cell(110)}>Spend</div>
//         <div style={cell(110)}>Revenue</div>
//         <div style={cell(110)}>Impr.</div>
//         <div style={cell(110)}>Conv.</div>
//         <div style={cell(110)}>Clicks</div>
//       </div>

//       {/* Regions */}
//       {Object.keys(grouped).map(region => (
//         <React.Fragment key={region}>
//           <div style={{ ...rowStyle, cursor: "pointer", fontWeight: 600 }} onClick={() => toggleRegion(region)}>
//             <div style={{ width: 200 }}>
//               {openRegion[region] ? "▼" : "▶"} {region}
//             </div>
//             <div style={cell(110)}>-</div>
//             <div style={cell(110)}>-</div>
//             <div style={cell(110)}>-</div>
//             <div style={cell(110)}>-</div>
//             <div style={cell(110)}>-</div>
//           </div>

//           {openRegion[region] &&
//             Object.keys(grouped[region]).map(channel => (
//               <React.Fragment key={channel}>
//                 {/* Channel Row */}
//                 <div
//                   style={{
//                     ...rowStyle,
//                     cursor: "pointer",
//                     paddingLeft: 24,
//                     fontWeight: 500,
//                   }}
//                   onClick={() => toggleChannel(channel)}
//                 >
//                   <div style={{ width: 200 }}>
//                     {openChannel[channel] ? "▼" : "▶"} {channel}
//                   </div>

//                   <div style={cell(110)}>{formatMoney(grouped[region][channel].spend)}</div>
//                   <div style={cell(110)}>{formatMoney(grouped[region][channel].revenue)}</div>
//                   <div style={cell(110)}>{grouped[region][channel].impressions.toLocaleString()}</div>
//                   <div style={cell(110)}>{grouped[region][channel].conversions}</div>
//                   <div style={cell(110)}>{grouped[region][channel].clicks}</div>
//                 </div>

//                 {/* B1: Always show 4 sub-rows */}
//                 {openChannel[channel] &&
//                   subCategories.map(sub => (
//                     <div key={sub} style={{ ...rowStyle, paddingLeft: 48 }}>
//                       <div style={{ width: 200 }}>{sub}</div>
//                       <div style={cell(110)}>-</div>
//                       <div style={cell(110)}>-</div>
//                       <div style={cell(110)}>-</div>
//                       <div style={cell(110)}>-</div>
//                       <div style={cell(110)}>-</div>
//                     </div>
//                   ))}
//               </React.Fragment>
//             ))}
//         </React.Fragment>
//       ))}
//     </div>
//   );
// }
import React, { useState, useMemo } from "react";

function TreeTable({ data }) {
  const [openRegion, setOpenRegion] = useState({});
  const [openChannel, setOpenChannel] = useState({});

  const subCategories = ["Direct", "Seasonality", "Holidays", "Trends"];

  const grouped = useMemo(() => {
    const map = {};

    data.forEach((row) => {
      const region = row.region || "Unknown";
      const channel = row.channel || "Unknown";

      if (!map[region]) map[region] = {};
      if (!map[region][channel]) {
        map[region][channel] = {
          spend: 0,
          revenue: 0,
          impressions: 0,
          conversions: 0,
          clicks: 0,
        };
      }

      map[region][channel].spend += Number(row.spend || 0);
      map[region][channel].revenue += Number(row.revenue || 0);
      map[region][channel].impressions += Number(row.impressions || 0);
      map[region][channel].conversions += Number(row.conversions || 0);
      map[region][channel].clicks += Number(row.clicks || 0);
    });

    return map;
  }, [data]);

  const toggleRegion = (r) => {
    setOpenRegion((prev) => ({ ...prev, [r]: !prev[r] }));
  };

  const toggleChannel = (c) => {
    setOpenChannel((prev) => ({ ...prev, [c]: !prev[c] }));
  };

  const rowStyle = {
    display: "flex",
    padding: "8px 6px",
    borderTop: "1px solid #eee",
    alignItems: "center",
  };

  const cell = (w) => ({
    width: w,
    fontSize: 14,
  });

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginTop: 20 }}>
      <div style={{ ...rowStyle, fontWeight: "bold", borderTop: "none" }}>
        <div style={{ width: 200 }}>Category</div>
        <div style={cell(110)}>Spend</div>
        <div style={cell(110)}>Revenue</div>
        <div style={cell(110)}>Impr.</div>
        <div style={cell(110)}>Conv.</div>
        <div style={cell(110)}>Clicks</div>
      </div>

      {Object.keys(grouped).map((region) => (
        <React.Fragment key={region}>
          <div
            style={{ ...rowStyle, cursor: "pointer", fontWeight: 600 }}
            onClick={() => toggleRegion(region)}
          >
            <div style={{ width: 200 }}>
              {openRegion[region] ? "▼" : "▶"} {region}
            </div>
            <div style={cell(110)}>-</div>
            <div style={cell(110)}>-</div>
            <div style={cell(110)}>-</div>
            <div style={cell(110)}>-</div>
            <div style={cell(110)}>-</div>
          </div>

          {openRegion[region] &&
            Object.keys(grouped[region]).map((channel) => (
              <React.Fragment key={channel}>
                <div
                  style={{
                    ...rowStyle,
                    cursor: "pointer",
                    paddingLeft: 24,
                    fontWeight: 500,
                  }}
                  onClick={() => toggleChannel(channel)}
                >
                  <div style={{ width: 200 }}>
                    {openChannel[channel] ? "▼" : "▶"} {channel}
                  </div>

                  <div style={cell(110)}>{grouped[region][channel].spend}</div>
                  <div style={cell(110)}>{grouped[region][channel].revenue}</div>
                  <div style={cell(110)}>
                    {grouped[region][channel].impressions.toLocaleString()}
                  </div>
                  <div style={cell(110)}>{grouped[region][channel].conversions}</div>
                  <div style={cell(110)}>{grouped[region][channel].clicks}</div>
                </div>

                {openChannel[channel] &&
                  subCategories.map((sub) => (
                    <div key={sub} style={{ ...rowStyle, paddingLeft: 48 }}>
                      <div style={{ width: 200 }}>{sub}</div>
                      <div style={cell(110)}>-</div>
                      <div style={cell(110)}>-</div>
                      <div style={cell(110)}>-</div>
                      <div style={cell(110)}>-</div>
                      <div style={cell(110)}>-</div>
                    </div>
                  ))}
              </React.Fragment>
            ))}
        </React.Fragment>
      ))}
    </div>
  );
}

export default TreeTable;
