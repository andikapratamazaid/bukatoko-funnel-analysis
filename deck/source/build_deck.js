const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require("./apply_theme.js");

const THEME = {
  name: "BukaToko Insight",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "111C34", lt1: "FFFFFF", dk2: "1E2F55", lt2: "F1F4F9",
    accent1: "E8541E", accent2: "12A4A0", accent3: "F5B700",
    accent4: "6B7A99", accent5: "2B4C9B", accent6: "D64550",
    hlink: "2B4C9B", folHlink: "6B7A99",
  },
};
const H = THEME.colors; // hex access for charts
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "BukaToko Case Study: User Behaviour & Funnel Analysis";
pres.author = "Andika Pratama Zaid";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ---------- icons ----------
async function icon(name, color = "FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ---------- layouts ----------
const FOOT = "BukaToko Case Study  |  Andika Pratama Zaid";
pres.defineSlideMaster({
  title: "COVER", background: { color: H.dk1 },
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 1.25, w: 5.2, h: 0.3, fontSize: 12, bold: true, color: C.accent1, charSpacing: 2, margin: 0, valign: "top" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.65, w: 5.2, h: 1.7, fontSize: 34, bold: true, color: C.background1, margin: 0, valign: "top", align: "left" }, text: "" } },
    { placeholder: { options: { name: "subtitle", type: "body", x: 0.6, y: 3.6, w: 5.0, h: 0.7, fontSize: 16, color: "C9D2E6", margin: 0, valign: "top", align: "left" }, text: "" } },
    { placeholder: { options: { name: "byline", type: "body", x: 0.6, y: 4.55, w: 5.6, h: 0.7, fontSize: 12, color: "C9D2E6", margin: 0, valign: "top", align: "left" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT", background: { color: "FFFFFF" },
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: 0.5, y: 0.3, w: 9, h: 0.25, fontSize: 11, bold: true, color: C.accent1, charSpacing: 2, margin: 0, valign: "top" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.56, w: 9, h: 0.85, fontSize: 26, bold: true, color: C.text1, margin: 0, valign: "top", align: "left" }, text: "" } },
    { text: { text: FOOT, options: { x: 0.5, y: 5.3, w: 6, h: 0.22, fontSize: 9, color: C.accent4, margin: 0 } } },
  ],
  slideNumber: { x: 8.7, y: 5.3, w: 0.8, h: 0.22, fontSize: 9, color: C.accent4, align: "right", margin: 0 },
});

// ---------- helpers ----------
const card = (s, x, y, w, h, fill = C.background2, name = "card") =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { type: "none" }, rectRadius: 0.08, objectName: name });
const txt = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0, valign: "top" }, o));
const circleIcon = (s, img, x, y, d, bg) => {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { type: "none" }, objectName: "icon-bg" });
  s.addImage({ data: img, x: x + d * 0.26, y: y + d * 0.26, w: d * 0.48, h: d * 0.48, objectName: "icon" });
};
const answerBar = (s, y, h, label, body) => {
  card(s, 0.5, y, 9, h, C.background2, "answer-bar");
  txt(s, [{ text: label + "  ", options: { bold: true, color: C.accent1 } }, { text: body, options: { color: C.text1 } }],
    { x: 0.7, y: y + 0.06, w: 8.6, h: h - 0.12, fontSize: 12, valign: "middle" });
};
const funnelMotif = (s, x, y) => {
  const rows = [[3.6, H.accent1], [2.9, H.accent3], [2.2, H.accent2], [2.1, H.accent5]];
  rows.forEach((r, i) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: x + (3.6 - r[0]) / 2, y: y + i * 0.78, w: r[0], h: 0.58, fill: { color: r[1] }, line: { type: "none" }, rectRadius: 0.1, objectName: "funnel-motif-" + (i + 1),
  }));
};
const chartText = { catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt", legendFontFace: "+mn-lt" };
const GRID = { color: "E3E7EF", size: 0.5 };
const tblHead = (arr) => arr.map((t, i) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text2 }, align: i === 0 ? "left" : "right" } }));

(async () => {
  const I = {};
  const need = { globe: "FaGlobeAsia", users: "FaUsers", chart: "FaChartLine", mobile: "FaMobileAlt", search: "FaSearch", cart: "FaShoppingCart",
    db: "FaDatabase", check: "FaCheck", bullseye: "FaBullseye", handshake: "FaHandshake", bullhorn: "FaBullhorn", store: "FaStore",
    route: "FaRoute", code: "FaCode", sheet: "FaTable", shield: "FaShieldAlt", funnel: "FaFilter", sync: "FaSyncAlt", compass: "FaCompass", clock: "FaRegClock", ruler: "FaRulerCombined", warn: "FaExclamationTriangle" };
  for (const k in need) I[k] = await icon(need[k]);

  // ===== 1 COVER =====
  pres.addSection({ title: "Introduction" });
  let s = pres.addSlide({ masterName: "COVER", sectionTitle: "Introduction" });
  s.addText("PYTHON FOR DATA ANALYST  |  CASE STUDY", { placeholder: "kicker" });
  s.addText("BukaToko: User Behaviour & Funnel Analysis", { placeholder: "title" });
  s.addText("From 10,000 user events to a clear growth agenda", { placeholder: "subtitle" });
  s.addText([{ text: "Andika Pratama Zaid", options: { bold: true, color: C.background1, breakLine: true } },
    { text: "Dataset: 10,000 events, 27 Mar – 23 Sep 2025  |  Python (pandas, matplotlib), Google Sheets" }], { placeholder: "byline" });
  funnelMotif(s, 6.1, 1.35);
  s.addNotes("Opening: this deck analyses 10,000 BukaToko events to answer four questions and then goes one step further, into the conversion funnel and what to do about it.");

  // ===== 2 EXEC SUMMARY =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Introduction" });
  s.addText("EXECUTIVE SUMMARY", { placeholder: "kicker" });
  s.addText("Growth is stalled at ~1,150 MAU: the lever is conversion, not acquisition", { placeholder: "title" });
  const ex = [
    ["globe", "1,055", "active users in Indonesia, the #1 market in Q2 2025 (25.2% of activity)", H.accent1],
    ["chart", "~1,150", "monthly active users, flat for five months (1,129–1,170, Apr–Aug)", H.accent5],
    ["handshake", "+19.7%", "referral MAU growth, the only growing channel; social falls −13.0%", H.accent2],
    ["mobile", "89.6%", "of sessions on mobile; Android alone is 49.6%", H.accent5],
    ["funnel", "53.2%", "of product viewers add to cart: the biggest leak in the funnel", H.accent1],
    ["search", "0.13%", "same-day search-to-cart, but 38.1% of searchers add to cart on another day", H.accent2],
  ];
  const cw = (9 - 0.5) / 3;
  ex.forEach((e, i) => {
    const x = 0.5 + (i % 3) * (cw + 0.25), y = 1.6 + Math.floor(i / 3) * 1.8;
    card(s, x, y, cw, 1.55, C.background2, "summary-card-" + (i + 1));
    circleIcon(s, I[e[0]], x + 0.2, y + 0.2, 0.5, e[3]);
    txt(s, e[1], { x: x + 0.85, y: y + 0.2, w: cw - 1.0, h: 0.5, fontSize: 26, bold: true, color: C.text1, fontFace: undefined, valign: "middle" });
    txt(s, e[2], { x: x + 0.2, y: y + 0.82, w: cw - 0.4, h: 0.65, fontSize: 12, color: C.text1 });
  });
  s.addNotes("Six numbers carry the story. Indonesia is the engine, acquisition is flat, referral is the one channel that grows, mobile (Android first) dominates, and the funnel leaks hardest between product view and add to cart.");

  // ===== 3 CONTEXT =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Introduction" });
  s.addText("CONTEXT", { placeholder: "kicker" });
  s.addText("The case: a new analyst on the BukaToko analytics team", { placeholder: "title" });
  const ctx = [
    ["store", "A regional e-commerce platform", "Web and mobile app, operating across Southeast Asia, the US and Australia."],
    ["route", "A familiar shopper journey", "Users browse, search, view products, add to cart and check out; some buy, some drop off."],
    ["bullhorn", "Six acquisition channels", "Organic search, paid ads, email, social media, referrals and direct visits."],
    ["compass", "My job", "Explore user behaviour in the event-level data and find where the funnel can improve."],
  ];
  ctx.forEach((c, i) => {
    const y = 1.6 + i * 0.85;
    circleIcon(s, I[c[0]], 0.5, y + 0.07, 0.55, i % 2 ? H.accent2 : H.accent1);
    txt(s, c[1], { x: 1.25, y: y, w: 4.7, h: 0.28, fontSize: 14, bold: true, color: C.text1 });
    txt(s, c[2], { x: 1.25, y: y + 0.28, w: 4.7, h: 0.45, fontSize: 12, color: C.text1 });
  });
  card(s, 6.3, 1.6, 3.2, 3.3, C.text2, "questions-card");
  txt(s, "QUESTIONS TO ANSWER", { x: 6.55, y: 1.8, w: 2.7, h: 0.25, fontSize: 11, bold: true, color: C.accent3, charSpacing: 2 });
  const qs = [["Q1", "Which country has the most active users in Q2 2025?"], ["Q2", "How is the MAU trend for each channel?"],
    ["Q3", "Which device is used most often, by session?"], ["Q4", "What % of users who search add to cart the same day?"]];
  txt(s, qs.flatMap((q, i) => [
    { text: q[0] + "  ", options: { bold: true, color: C.accent3 } },
    { text: q[1], options: { color: C.background1, breakLine: i < qs.length - 1 } }]),
    { x: 6.55, y: 2.2, w: 2.7, h: 2.5, fontSize: 13, paraSpaceAfter: 9 });
  s.addNotes("Two core questions (Q1, Q2) and two extra questions (Q3, Q4). After answering them I add a funnel view, because the case is ultimately about where users drop off.");

  // ===== 4 DATA =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Introduction" });
  s.addText("DATA", { placeholder: "kicker" });
  s.addText("10,000 events from 1,982 users, cleaned and verified before analysis", { placeholder: "title" });
  const st = [["10,000", "events (1 event per session)"], ["1,982", "distinct users"], ["8", "countries and 8 event types"], ["6 months", "27 Mar – 23 Sep 2025"]];
  st.forEach((a, i) => {
    const x = 0.5 + (i % 2) * 2.5, y = 1.6 + Math.floor(i / 2) * 1.65;
    card(s, x, y, 2.3, 1.45, i % 3 === 0 ? C.text2 : C.background2, "stat-card-" + (i + 1));
    txt(s, a[0], { x: x + 0.2, y: y + 0.28, w: 1.9, h: 0.55, fontSize: 28, bold: true, color: i % 3 === 0 ? C.accent3 : C.text1, valign: "middle" });
    txt(s, a[1], { x: x + 0.2, y: y + 0.88, w: 1.9, h: 0.45, fontSize: 12, color: i % 3 === 0 ? C.background1 : C.text1 });
  });
  card(s, 5.6, 1.6, 3.9, 3.3, C.background2, "cleaning-card");
  txt(s, "Cleaning applied", { x: 5.85, y: 1.75, w: 3.4, h: 0.3, fontSize: 15, bold: true, color: C.text1 });
  const cl = ["Device casing normalised (“IOS”, “android”)", "100 blank channels mapped to “unknown”", "Non-padded hours parsed; all timestamps valid",
    "No duplicate rows or event IDs; no missing IDs", "product_id empty on 5,537 non-product events (expected)"];
  cl.forEach((t, i) => {
    const y = 2.18 + i * 0.53;
    circleIcon(s, I.check, 5.85, y + 0.02, 0.34, H.accent2);
    txt(s, t, { x: 6.35, y: y, w: 3.0, h: 0.42, fontSize: 12, color: C.text1, valign: "middle" });
  });
  s.addNotes("The data was already tidy apart from three issues: device casing, blank channels and non-padded hours. Every session_id holds exactly one event, which matters when reading the device result.");

  // ===== 5 Q1 =====
  pres.addSection({ title: "Analysis" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Analysis" });
  s.addText("QUESTION 1", { placeholder: "kicker" });
  s.addText("Indonesia has the most active users in Q2 2025", { placeholder: "title" });
  const ctry = ["ID", "US", "VN", "PH", "MY", "SG", "TH", "AU"], cu = [1055, 815, 485, 464, 460, 459, 236, 215];
  s.addChart(pres.charts.BAR, [{ name: "Active users", labels: ctry, values: cu }], Object.assign({
    x: 0.5, y: 1.5, w: 5.8, h: 3.1, barDir: "bar", barGapWidthPct: 45, catAxisOrientation: "maxMin",
    chartColors: [H.accent1, H.dk2, H.dk2, H.dk2, H.dk2, H.dk2, H.dk2, H.dk2],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: H.dk1, dataLabelFormatCode: "#,##0",
    catAxisLabelFontSize: 12, catAxisLabelColor: H.dk1, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    showTitle: true, title: "Distinct active users by country, Apr–Jun 2025", titleFontSize: 12, titleColor: H.dk1, titleFontFace: "+mn-lt",
  }, chartText));
  card(s, 6.6, 1.55, 2.9, 1.75, C.text2, "key-number");
  txt(s, "1,055", { x: 6.85, y: 1.7, w: 2.4, h: 0.75, fontSize: 40, bold: true, color: C.accent3, valign: "middle" });
  txt(s, "active users in Indonesia, out of 1,848 distinct users active in Q2", { x: 6.85, y: 2.5, w: 2.4, h: 0.65, fontSize: 12, color: C.background1 });
  card(s, 6.6, 3.45, 2.9, 1.15, C.background2, "key-number-2");
  txt(s, [{ text: "44.7%", options: { bold: true, fontSize: 20, color: C.accent1, breakLine: true } }, { text: "of country activity comes from ID + US", options: { fontSize: 12, color: C.text1 } }], { x: 6.85, y: 3.55, w: 2.4, h: 0.95 });
  answerBar(s, 4.72, 0.45, "Answer:", "Indonesia (ID), with 1,055 distinct active users and 1,490 events in Apr–Jun 2025, ahead of the US (815).");
  s.addNotes("Indonesia leads clearly with 1,055 active users, followed by the US with 815. Together they account for 44.7% of country activity.");

  // ===== 6 Q1 detail =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Analysis" });
  s.addText("QUESTION 1  |  DETAIL", { placeholder: "kicker" });
  s.addText("Two market tiers, and Southeast Asia dominates the rest", { placeholder: "title" });
  const ev = [1490, 1032, 541, 526, 515, 521, 249, 231], sh = ["25.2%", "19.5%", "11.6%", "11.1%", "11.0%", "11.0%", "5.6%", "5.1%"];
  const rows1 = [tblHead(["Country", "Active users", "Events", "Share"])];
  ctry.forEach((c, i) => rows1.push([
    { text: c, options: { bold: true, align: "left" } }, { text: cu[i].toLocaleString("en-US"), options: { align: "right" } },
    { text: ev[i].toLocaleString("en-US"), options: { align: "right" } }, { text: sh[i], options: { align: "right" } }]
    .map((cell) => { cell.options.fill = { color: i === 0 ? "FCE3D9" : i % 2 ? "FFFFFF" : H.lt2 }; cell.options.color = C.text1; return cell; })));
  s.addTable(rows1, { x: 0.5, y: 1.55, w: 5.2, colW: [1.1, 1.5, 1.3, 1.3], rowH: 0.33, fontSize: 12, border: { type: "solid", pt: 0.5, color: "E3E7EF" }, valign: "middle", margin: [0, 0.1, 0, 0.1] });
  txt(s, "Method note: country is stored per event and most users appear under more than one country, so a user is counted once in each. Shares are of 4,189 user-country pairs.",
    { x: 0.5, y: 4.62, w: 5.2, h: 0.5, fontSize: 10, italic: true, color: C.accent4 });
  const ins1 = [["Two clear tiers", "ID and US lead. VN, PH, MY and SG form a tight middle band (459–485). TH and AU trail.", "chart", H.accent1],
    ["SEA is the core", "Six of eight markets are in Southeast Asia, consistent with BukaToko’s home region.", "globe", H.accent2]];
  ins1.forEach((a, i) => {
    const y = 1.55 + i * 1.8;
    card(s, 6.0, y, 3.5, 1.6, C.background2, "insight-" + (i + 1));
    circleIcon(s, I[a[2]], 6.2, y + 0.2, 0.45, a[3]);
    txt(s, a[0], { x: 6.8, y: y + 0.2, w: 2.5, h: 0.45, fontSize: 14, bold: true, color: C.text1, valign: "middle" });
    txt(s, a[1], { x: 6.2, y: y + 0.78, w: 3.1, h: 0.75, fontSize: 12, color: C.text1 });
  });
  s.addNotes("The country table in full. The method note matters: because country is recorded per event, the same user can show up in several countries.");

  // ===== 7 Q2 =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Analysis" });
  s.addText("QUESTION 2", { placeholder: "kicker" });
  s.addText("MAU per channel: flat overall, referral grows, social declines", { placeholder: "title" });
  const mon = ["Apr", "May", "Jun", "Jul", "Aug"];
  const ch = [["referral", [244, 244, 289, 255, 292], H.accent1], ["social", [276, 268, 262, 250, 240], H.accent6], ["paid_search", [255, 259, 258, 288, 251], "8795B3"],
    ["email", [258, 284, 263, 290, 248], "5E6F94"], ["organic", [260, 251, 259, 268, 249], "A9B4CC"], ["direct", [262, 270, 271, 257, 250], H.dk2]];
  s.addChart(pres.charts.LINE, ch.map((c) => ({ name: c[0], labels: mon, values: c[1] })), Object.assign({
    x: 0.5, y: 1.5, w: 6.3, h: 3.15, chartColors: ch.map((c) => c[2]), lineSize: 2.5, lineDataSymbol: "circle", lineDataSymbolSize: 6,
    valAxisMinVal: 200, valAxisMaxVal: 300, valAxisMajorUnit: 25, valAxisLabelFontSize: 11, valAxisLabelColor: H.accent4, catAxisLabelFontSize: 12, catAxisLabelColor: H.dk1,
    valGridLine: GRID, catGridLine: { style: "none" }, showLegend: true, legendPos: "b", legendFontSize: 11, legendColor: H.dk1,
    showTitle: true, title: "Monthly active users by channel, 2025 (y-axis starts at 200)", titleFontSize: 12, titleColor: H.dk1, titleFontFace: "+mn-lt",
  }, chartText));
  card(s, 7.1, 1.55, 2.4, 1.6, C.text2, "key-number");
  txt(s, "1,129–1,170", { x: 7.3, y: 1.7, w: 2.1, h: 0.5, fontSize: 21, bold: true, color: C.accent3, valign: "middle" });
  txt(s, "total MAU per month, Apr–Aug", { x: 7.3, y: 2.25, w: 2.0, h: 0.8, fontSize: 12, color: C.background1 });
  card(s, 7.1, 3.3, 2.4, 1.35, C.background2, "key-number-2");
  txt(s, "No channel breaks away: each holds roughly 240–290 MAU.", { x: 7.3, y: 3.42, w: 2.0, h: 1.1, fontSize: 12, color: C.text1, valign: "middle" });
  answerBar(s, 4.74, 0.45, "Answer:", "every channel is essentially flat across Apr–Aug. Referral is the only grower (+19.7%); social falls the most (−13.0%).");
  s.addNotes("Total MAU stays in a narrow band for five full months. March and September are partial months, so they are left out of the trend. The 'unknown' channel is tiny and omitted from the chart.");

  // ===== 8 Q2 detail =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Analysis" });
  s.addText("QUESTION 2  |  DETAIL", { placeholder: "kicker" });
  s.addText("Referral overtakes social as the #1 channel by August", { placeholder: "title" });
  const cl2 = ["referral", "paid_search", "email", "organic", "direct", "social"];
  s.addChart(pres.charts.BAR, [
    { name: "Apr", labels: cl2, values: [244, 255, 258, 260, 262, 276] },
    { name: "Aug", labels: cl2, values: [292, 251, 248, 249, 250, 240] }], Object.assign({
    x: 0.5, y: 1.5, w: 5.9, h: 3.1, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60, chartColors: ["9AA7C4", H.accent1],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 10, dataLabelColor: H.dk1, catAxisLabelFontSize: 11, catAxisLabelColor: H.dk1,
    valAxisHidden: true, valAxisMinVal: 0, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: true, legendPos: "b", legendFontSize: 11, legendColor: H.dk1,
    showTitle: true, title: "MAU by channel, April vs August 2025", titleFontSize: 12, titleColor: H.dk1, titleFontFace: "+mn-lt",
  }, chartText));
  const ins2 = [["Referral +19.7%", "Up from 244 to 292 (uneven month to month), now the #1 channel.", H.accent2],
    ["Social −13.0%", "From the top channel in April (276) to the bottom of the main group (240).", H.accent6],
    ["Others −1.6% to −4.6%", "Paid search, email, organic and direct are flat: acquisition is not compounding.", H.accent5]];
  ins2.forEach((a, i) => {
    const y = 1.55 + i * 1.05;
    card(s, 6.7, y, 2.8, 0.95, C.background2, "insight-" + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: 6.85, y: y + 0.12, w: 0.14, h: 0.14, fill: { color: a[2] }, line: { type: "none" }, objectName: "dot" });
    txt(s, a[0], { x: 7.1, y: y + 0.07, w: 2.3, h: 0.3, fontSize: 13, bold: true, color: C.text1, valign: "middle" });
    txt(s, a[1], { x: 6.85, y: y + 0.4, w: 2.5, h: 0.52, fontSize: 11, color: C.text1 });
  });
  txt(s, "Mar and Sep are partial months in the data (from 27 Mar, to 23 Sep), so their lower MAU is a coverage effect. “unknown” is omitted (tiny base: 15 → 20).",
    { x: 0.5, y: 4.72, w: 9, h: 0.42, fontSize: 10, italic: true, color: C.accent4 });
  s.addNotes("Apr versus Aug makes the story concrete. Referral rises from 244 to 292, social drops from 276 to 240. Everything else is within a few percent.");

  // ===== 9 Q3 =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Analysis" });
  s.addText("EXTRA QUESTION 3", { placeholder: "kicker" });
  s.addText("Android is the most used device, and mobile is nearly 90% of sessions", { placeholder: "title" });
  s.addChart(pres.charts.DOUGHNUT, [{ name: "Sessions", labels: ["Android", "iOS", "Desktop"], values: [4961, 4000, 1039] }], Object.assign({
    x: 0.5, y: 1.5, w: 4.3, h: 3.15, holeSize: 58, chartColors: [H.accent1, H.dk2, H.accent4],
    showPercent: true, showValue: false, showLabel: false, dataLabelColor: "FFFFFF", dataLabelFontSize: 12, dataLabelFormatCode: "0.0%",
    showLegend: true, legendPos: "b", legendFontSize: 12, legendColor: H.dk1, showTitle: true, title: "Share of sessions by device", titleFontSize: 12, titleColor: H.dk1, titleFontFace: "+mn-lt",
  }, chartText));
  card(s, 5.1, 1.55, 4.4, 1.45, C.text2, "key-number");
  txt(s, "89.6%", { x: 5.35, y: 1.65, w: 1.9, h: 0.75, fontSize: 36, bold: true, color: C.accent3, valign: "middle" });
  txt(s, "of sessions are on mobile (Android 49.6% + iOS 40.0%)", { x: 7.1, y: 1.7, w: 2.2, h: 1.1, fontSize: 12, color: C.background1, valign: "middle" });
  txt(s, "Sessions: Android 4,961  |  iOS 4,000  |  Desktop 1,039", { x: 5.35, y: 2.55, w: 4.0, h: 0.3, fontSize: 11, color: "C9D2E6" });
  const ins3 = [["Android leads everywhere", "It is the top device in all 8 markets (47–52% of events per country)."], ["Desktop is niche", "10.4% overall and only 9–12% in any single country."]];
  ins3.forEach((a, i) => {
    const y = 3.15 + i * 0.8;
    card(s, 5.1, y, 4.4, 0.7, C.background2, "insight-" + (i + 1));
    txt(s, [{ text: a[0] + "  ", options: { bold: true } }, { text: a[1] }], { x: 5.3, y: y + 0.05, w: 4.0, h: 0.6, fontSize: 12, color: C.text1, valign: "middle" });
  });
  answerBar(s, 4.74, 0.45, "Answer:", "Android, 4,961 of 10,000 sessions (49.6%). Each session holds one event, so session share equals event share.");
  s.addNotes("Android is the single biggest device. The device mix is almost identical across countries, so the same mobile-first approach applies in every market.");

  // ===== 10 Q4 =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Analysis" });
  s.addText("EXTRA QUESTION 4", { placeholder: "kicker" });
  s.addText("Almost no one searches and adds to cart on the same day: 0.13%", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [{ name: "Users", labels: ["Searched", "Added to cart (any day)", "Same day, after search"], values: [750, 286, 1] }], Object.assign({
    x: 0.5, y: 1.5, w: 5.5, h: 3.1, barDir: "col", barGapWidthPct: 50, chartColors: [H.dk2, H.accent2, H.accent1],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 13, dataLabelColor: H.dk1, dataLabelFormatCode: "#,##0",
    catAxisLabelFontSize: 11, catAxisLabelColor: H.dk1, valAxisHidden: true, valAxisMinVal: 0, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    showTitle: true, title: "Searching users and what they did next", titleFontSize: 12, titleColor: H.dk1, titleFontFace: "+mn-lt",
  }, chartText));
  card(s, 6.3, 1.55, 3.2, 1.5, C.text2, "key-number");
  txt(s, "0.13%", { x: 6.5, y: 1.62, w: 2.8, h: 0.7, fontSize: 36, bold: true, color: C.accent3, valign: "middle" });
  txt(s, "1 of 750 searching users added to cart the same day", { x: 6.5, y: 2.32, w: 2.8, h: 0.6, fontSize: 12, color: C.background1 });
  card(s, 6.3, 3.2, 3.2, 1.4, C.background2, "rule-card");
  txt(s, [{ text: "The rule", options: { bold: true, breakLine: true, color: C.accent1 } },
    { text: "Add to cart must come after a search, same user, same date. Only 2 user-days contain both events.", options: { color: C.text1 } }],
    { x: 6.5, y: 3.3, w: 2.8, h: 1.2, fontSize: 12 });
  answerBar(s, 4.74, 0.45, "Why so low?", "users average 5.05 events in ~6 months, so a search and a cart add rarely share a day. 38.1% add to cart on another day.");
  s.addNotes("Same-day attribution understates search. 286 of 750 searchers (38.1%) do add to cart eventually, just not on the same calendar day.");

  // ===== 11 FUNNEL (new) =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Analysis" });
  s.addText("FUNNEL ANALYSIS", { placeholder: "kicker" });
  s.addText("The biggest leak: nearly half of product viewers never add to cart", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [{ name: "Users", labels: ["Product view", "Add to cart", "Checkout", "Purchase"], values: [1454, 773, 453, 449] }], Object.assign({
    x: 0.5, y: 1.5, w: 5.5, h: 3.0, barDir: "bar", barGapWidthPct: 35, catAxisOrientation: "maxMin", chartColors: [H.dk2, H.accent1, H.accent2, H.accent5],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 13, dataLabelColor: H.dk1, dataLabelFormatCode: "#,##0",
    catAxisLabelFontSize: 12, catAxisLabelColor: H.dk1, valAxisHidden: true, valAxisMinVal: 0, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    showTitle: true, title: "Distinct users reaching each funnel stage", titleFontSize: 12, titleColor: H.dk1, titleFontFace: "+mn-lt",
  }, chartText));
  const stp = [["Product view → Add to cart", "53.2%", "−46.8% drop: the biggest leak", true], ["Add to cart → Checkout", "58.6%", "−41.4% drop: second leak", false], ["Checkout → Purchase", "99.1%", "Checkout is almost frictionless", false]];
  stp.forEach((a, i) => {
    const y = 1.55 + i * 1.02;
    card(s, 6.3, y, 3.2, 0.92, a[3] ? C.text2 : C.background2, "step-card-" + (i + 1));
    txt(s, a[1], { x: 6.5, y: y + 0.1, w: 1.15, h: 0.72, fontSize: 24, bold: true, color: a[3] ? C.accent3 : C.accent1, valign: "middle" });
    txt(s, [{ text: a[0], options: { bold: true, breakLine: true } }, { text: a[2] }], { x: 7.7, y: y + 0.1, w: 1.7, h: 0.72, fontSize: 11, color: a[3] ? C.background1 : C.text1, valign: "middle" });
  });
  answerBar(s, 4.6, 0.42, "Overall:", "449 of 1,454 product viewers (30.9%) purchase. Fix view → cart first, then cart → checkout.");
  txt(s, "User-level counts: distinct users with at least one event of that type. Stages are not strictly sequential per user.", { x: 0.5, y: 5.05, w: 9, h: 0.2, fontSize: 10, italic: true, color: C.accent4 });
  s.addNotes("This slide is new. It uses the full event list to show the funnel end to end. Almost everyone who reaches checkout buys, so the real problem sits earlier: viewing products without adding them to the cart.");

  // ===== 12 RECOMMENDATIONS =====
  pres.addSection({ title: "Recommendations" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Recommendations" });
  s.addText("RECOMMENDATIONS", { placeholder: "kicker" });
  s.addText("Six moves to turn flat MAU into growth", { placeholder: "title" });
  const rc = [
    ["cart", "Fix the cart gap", "Test product-page changes to lift view → cart above 53.2%.", "HIGH", H.accent1],
    ["globe", "Back Indonesia", "Prioritise ID assortment, payments and logistics (25.2% of activity).", "HIGH", H.accent1],
    ["sync", "Retain, don’t just acquire", "MAU is flat at ~1,150: invest in conversion and re-engagement.", "HIGH", H.accent1],
    ["handshake", "Scale referral", "The only growing channel (+19.7%): build a referral programme.", "MEDIUM", H.accent2],
    ["bullhorn", "Fix or shift social", "Down −13.0%: review creative and targeting, or shift budget.", "MEDIUM", H.accent2],
    ["mobile", "Mobile-first, Android-first", "89.6% of sessions are mobile; Android alone is half.", "MEDIUM", H.accent2],
  ];
  rc.forEach((r, i) => {
    const x = 0.5 + (i % 3) * (cw + 0.25), y = 1.6 + Math.floor(i / 3) * 1.8;
    card(s, x, y, cw, 1.65, C.background2, "rec-card-" + (i + 1));
    circleIcon(s, I[r[0]], x + 0.2, y + 0.2, 0.46, r[4]);
    txt(s, r[3], { x: x + cw - 1.0, y: y + 0.22, w: 0.8, h: 0.24, fontSize: 10, bold: true, color: r[4] === H.accent1 ? C.accent1 : C.accent2, align: "right", charSpacing: 1 });
    txt(s, r[1], { x: x + 0.2, y: y + 0.76, w: cw - 0.4, h: 0.28, fontSize: 14, bold: true, color: C.text1 });
    txt(s, r[2], { x: x + 0.2, y: y + 1.05, w: cw - 0.4, h: 0.55, fontSize: 11, color: C.text1 });
  });
  s.addNotes("Priority labels are my proposal, based on size of effect in the data. The first three address the central finding: growth is stuck, and the biggest funnel leak is between product view and add to cart.");

  // ===== 13 ROADMAP =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Recommendations" });
  s.addText("NEXT STEPS  |  PROPOSED", { placeholder: "kicker" });
  s.addText("A 90-day roadmap: measure, test, then scale", { placeholder: "title" });
  const rm = [["30", "Measure", ["Baseline KPIs: MAU, view → cart, cart → checkout", "Adopt a 7/30-day search-to-cart window", "Audit social creative and targeting"], H.accent5],
    ["60", "Test", ["A/B test product-page changes for view → cart", "Pilot a referral programme in Indonesia", "Android-first review of key flows"], H.accent2],
    ["90", "Scale", ["Roll out winning tests to US and SEA markets", "Rebalance channel budget on attribution data", "Track retention cohorts monthly"], H.accent1]];
  rm.forEach((r, i) => {
    const x = 0.5 + i * (cw + 0.25);
    card(s, x, 1.6, cw, 2.75, C.background2, "roadmap-card-" + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: 1.78, w: 0.62, h: 0.62, fill: { color: r[3] }, line: { type: "none" }, objectName: "day-badge" });
    txt(s, r[0], { x: x + 0.2, y: 1.78, w: 0.62, h: 0.62, fontSize: 18, bold: true, color: C.background1, align: "center", valign: "middle" });
    txt(s, [{ text: r[1], options: { bold: true, fontSize: 16, breakLine: true } }, { text: "days " + (i === 0 ? "1–30" : i === 1 ? "31–60" : "61–90"), options: { fontSize: 11, color: C.accent4 } }], { x: x + 0.95, y: 1.82, w: cw - 1.1, h: 0.6, color: C.text1 });
    txt(s, r[2].map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < r[2].length - 1 } })), { x: x + 0.2, y: 2.62, w: cw - 0.4, h: 1.65, fontSize: 12, color: C.text1, paraSpaceAfter: 6 });
  });
  card(s, 0.5, 4.5, 9, 0.6, C.text2, "kpi-bar");
  txt(s, [{ text: "KPIs to watch  ", options: { bold: true, color: C.accent3 } }, { text: "MAU  |  view → cart rate  |  cart → checkout rate  |  referral share of MAU  |  7/30-day search → cart rate", options: { color: C.background1 } }],
    { x: 0.7, y: 4.5, w: 8.6, h: 0.6, fontSize: 12, valign: "middle" });
  s.addNotes("This roadmap is a proposal. Targets should be set after the baseline is measured in the first 30 days.");

  // ===== 14 METHODOLOGY =====
  pres.addSection({ title: "Appendix" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Appendix" });
  s.addText("METHODOLOGY", { placeholder: "kicker" });
  s.addText("Definitions, rules and limitations", { placeholder: "title" });
  const df = [["Active user", "Distinct user_id with at least one event in the period. Q2 2025 = 1 Apr to 30 Jun."],
    ["MAU", "Distinct users with at least one event in the month carrying that channel; multi-channel users count in each."],
    ["Session (Q3)", "Distinct session_id per device. In this dataset each session holds exactly one event."],
    ["Same-day conversion (Q4)", "Add to cart strictly after the user’s first search that date. 1 of 945 search days = 0.11% per user-day."]];
  df.forEach((d, i) => {
    const y = 1.55 + i * 0.84;
    card(s, 0.5, y, 5.5, 0.74, C.background2, "definition-" + (i + 1));
    txt(s, d[0], { x: 0.7, y: y + 0.06, w: 1.45, h: 0.62, fontSize: 12, bold: true, color: C.accent1, valign: "middle" });
    txt(s, d[1], { x: 2.2, y: y + 0.06, w: 3.7, h: 0.62, fontSize: 11, color: C.text1, valign: "middle" });
  });
  card(s, 6.3, 1.55, 3.2, 3.26, C.text2, "limits-card");
  circleIcon(s, I.warn, 6.5, 1.72, 0.42, H.accent3);
  txt(s, "Limitations", { x: 7.05, y: 1.72, w: 2.3, h: 0.42, fontSize: 15, bold: true, color: C.background1, valign: "middle" });
  const lim = ["Country and channel are per-event, so totals overlap across users", "March and September are partial months", "Funnel stages are not strictly sequential per user", "Figures cross-checked with an independent SQL recount: exact match"];
  txt(s, lim.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < lim.length - 1 } })), { x: 6.5, y: 2.3, w: 2.8, h: 2.4, fontSize: 12, color: C.background1, paraSpaceAfter: 6 });
  s.addNotes("The main limitations come from per-event country and channel attributes and from the partial first and last months.");

  // ===== 15 APPENDIX =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Appendix" });
  s.addText("APPENDIX", { placeholder: "kicker" });
  s.addText("Code and supporting files", { placeholder: "title" });
  const ap = [["code", "Python code", "bukatoko_analysis.py (pandas + matplotlib) reproduces every number and chart from the raw CSV: cleaning rules, groupby aggregations for Q1–Q3 and a first-search vs add-to-cart join for Q4.", H.accent1],
    ["sheet", "Calculations", "The supporting Google Sheet holds the Q1 country table, Q2 MAU matrix, Q3 device table and Q4 attribution summary, all from the same cleaned data.", H.accent2],
    ["shield", "Verification", "Headline figures were recomputed independently in SQL (sqlite) from the cleaned dataset; all matched the pandas results exactly.", H.accent5]];
  ap.forEach((a, i) => {
    const x = 0.5 + i * (cw + 0.25);
    card(s, x, 1.6, cw, 2.6, C.background2, "appendix-card-" + (i + 1));
    circleIcon(s, I[a[0]], x + 0.2, 1.8, 0.55, a[3]);
    txt(s, a[1], { x: x + 0.2, y: 2.5, w: cw - 0.4, h: 0.3, fontSize: 15, bold: true, color: C.text1 });
    txt(s, a[2], { x: x + 0.2, y: 2.85, w: cw - 0.4, h: 1.3, fontSize: 11, color: C.text1 });
  });
  txt(s, [{ text: "Files  ", options: { bold: true, color: C.accent1 } }, { text: "bukatoko_analysis.py  |  clean_events.csv  |  dirty_dummy_events.csv  |  charts/", options: { color: C.text1 } }],
    { x: 0.5, y: 4.45, w: 9, h: 0.35, fontSize: 12 });
  s.addNotes("Everything is reproducible from the raw CSV with the supplied Python script.");

  // ===== 16 CLOSING =====
  s = pres.addSlide({ masterName: "COVER", sectionTitle: "Appendix" });
  s.addText("THANK YOU", { placeholder: "kicker" });
  s.addText("Questions & discussion", { placeholder: "title" });
  s.addText("Indonesia is the engine, referral is the growth signal, and the cart gap is the fix worth making first.", { placeholder: "subtitle" });
  s.addText([{ text: "Andika Pratama Zaid", options: { bold: true, color: C.background1, breakLine: true } }, { text: "BukaToko Case Study  |  Python for Data Analyst" }], { placeholder: "byline" });
  funnelMotif(s, 6.1, 1.35);

  await pres.writeFile({ fileName: "../BukaToko_Case_Study.pptx" });
  await applyTheme("../BukaToko_Case_Study.pptx", THEME);
  console.log("done");
})();
