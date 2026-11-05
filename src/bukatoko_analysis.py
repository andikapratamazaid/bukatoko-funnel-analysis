"""
BukaToko Case Study - User Behaviour & Funnel Analysis
======================================================
Author : Andika Pratama Zaid

Questions answered
  Q1  Which country has the most active users in Q2 2025?
  Q2  How is the MAU trend for each channel?
  Q3  (Extra) Which device is used most often, by session?
  Q4  (Extra) What % of users who search add to cart on the same day?
  +   Conversion funnel (user level) and device mix by country

Run from the repository root:
    python src/bukatoko_analysis.py
Input : data/raw/dirty_dummy_events.csv
Output: data/clean_events.csv and charts/*.png
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "dirty_dummy_events.csv"
CLEAN = ROOT / "data" / "clean_events.csv"
CHARTS = ROOT / "charts"
CHARTS.mkdir(exist_ok=True)

NAVY, ORANGE, TEAL, SLATE = "#1E2F55", "#E8541E", "#12A4A0", "#6B7A99"
plt.rcParams.update({"font.family": "DejaVu Sans", "text.color": NAVY,
                     "axes.labelcolor": NAVY, "axes.spines.top": False,
                     "axes.spines.right": False})

# ----------------------------------------------------------------------
# 1. LOAD & CLEAN
#   - device casing is inconsistent ("IOS" vs "android")  -> lowercase
#   - 100 rows have a blank channel                       -> "unknown"
#   - timestamps have non-padded hours ("2:02:51")        -> parsed
#   - no duplicate rows / event_ids / missing IDs (checked below)
# ----------------------------------------------------------------------
df = pd.read_csv(RAW, dtype=str, keep_default_na=False)
assert not df.duplicated().any() and df["event_id"].is_unique
df["device"] = df["device"].str.strip().str.lower()
df["channel"] = df["channel"].str.strip().replace("", "unknown").str.lower()
df["country"] = df["country"].str.strip().str.upper()
df["event_type"] = df["event_type"].str.strip().str.lower()
df["event_timestamp"] = pd.to_datetime(df["event_timestamp"])
df["date"] = df["event_timestamp"].dt.date
df["month"] = df["event_timestamp"].dt.strftime("%Y-%m")
df = df.sort_values("event_timestamp").reset_index(drop=True)
df.to_csv(CLEAN, index=False)

print(f"Rows: {len(df):,} | Users: {df['user_id'].nunique():,} | "
      f"Period: {df['event_timestamp'].min()} to {df['event_timestamp'].max()}")

# ----------------------------------------------------------------------
# 2. Q1 - Active users by country, Q2 2025 (1 Apr - 30 Jun)
#    Country is stored per event, so a user active in two countries is
#    counted once in each.
# ----------------------------------------------------------------------
q2 = df[(df["event_timestamp"] >= "2025-04-01") & (df["event_timestamp"] < "2025-07-01")]
q1 = (q2.groupby("country")
        .agg(active_users=("user_id", "nunique"), events=("event_id", "count"))
        .sort_values("active_users", ascending=False))
print("\nQ1 - Active users by country, Q2 2025")
print(q1)

fig, ax = plt.subplots(figsize=(8, 4.2))
colors = [ORANGE] + [NAVY] * (len(q1) - 1)
ax.barh(q1.index[::-1], q1["active_users"][::-1], color=colors[::-1])
for y, v in enumerate(q1["active_users"][::-1]):
    ax.text(v + 12, y, f"{v:,}", va="center", fontsize=10)
ax.set_xlabel("Distinct active users, Apr-Jun 2025")
ax.set_title("Q1. Indonesia has the most active users in Q2 2025", loc="left", fontweight="bold")
fig.tight_layout(); fig.savefig(CHARTS / "q1_country.png", dpi=160); plt.close(fig)

# ----------------------------------------------------------------------
# 3. Q2 - MAU per channel (distinct users per month and channel)
#    Mar (from 27 Mar) and Sep (to 23 Sep) are partial months.
# ----------------------------------------------------------------------
mau = df.groupby(["month", "channel"])["user_id"].nunique().unstack(fill_value=0)
print("\nQ2 - MAU per channel")
print(mau)
full = mau.loc["2025-04":"2025-08"].drop(columns="unknown")
change = ((full.loc["2025-08"] / full.loc["2025-04"] - 1) * 100).round(1)
print("\nChange Apr -> Aug (%):\n", change.sort_values(ascending=False))

fig, ax = plt.subplots(figsize=(8, 4.2))
for c in full.columns:
    hi = {"referral": ORANGE, "social": "#D64550"}.get(c)
    ax.plot(["Apr", "May", "Jun", "Jul", "Aug"], full[c], marker="o",
            lw=2.6 if hi else 1.6, color=hi or "#A9B4CC", label=c)
ax.set_ylim(200, 300); ax.set_ylabel("MAU")
ax.legend(ncol=3, frameon=False, fontsize=9, loc="upper center", bbox_to_anchor=(0.5, -0.1))
ax.set_title("Q2. MAU is flat across channels; referral grows, social declines", loc="left", fontweight="bold")
fig.tight_layout(); fig.savefig(CHARTS / "q2_mau_channel.png", dpi=160); plt.close(fig)

# ----------------------------------------------------------------------
# 4. Q3 - Device by session (each session_id holds exactly 1 event)
# ----------------------------------------------------------------------
q3 = df.groupby("device")["session_id"].nunique().sort_values(ascending=False)
share = (q3 / q3.sum() * 100).round(1)
print("\nQ3 - Sessions by device\n", pd.DataFrame({"sessions": q3, "share_pct": share}))

fig, ax = plt.subplots(figsize=(8, 3.6))
ax.barh(q3.index[::-1], q3[::-1], color=[SLATE, NAVY, ORANGE])
for y, (v, p) in enumerate(zip(q3[::-1], share[::-1])):
    ax.text(v + 40, y, f"{v:,} ({p}%)", va="center", fontsize=10)
ax.set_xlim(0, q3.max() * 1.25); ax.set_xlabel("Sessions")
ax.set_title("Q3. Android is the most used device; mobile is 89.6% of sessions", loc="left", fontweight="bold")
fig.tight_layout(); fig.savefig(CHARTS / "q3_device.png", dpi=160); plt.close(fig)

# ----------------------------------------------------------------------
# 5. Q4 - Search -> add_to_cart on the same day (ATC strictly after search)
# ----------------------------------------------------------------------
first_search = (df[df["event_type"] == "search"]
                .groupby(["user_id", "date"])["event_timestamp"].min())
atc = (df[df["event_type"] == "add_to_cart"]
       .groupby(["user_id", "date"])["event_timestamp"].apply(list))
joined = pd.concat([first_search.rename("t_search"), atc.rename("t_atc")], axis=1, join="inner")
ok = joined.apply(lambda r: any(t > r["t_search"] for t in r["t_atc"]), axis=1)

search_users = set(df.loc[df["event_type"] == "search", "user_id"])
atc_users = set(df.loc[df["event_type"] == "add_to_cart", "user_id"])
same_day = set(joined[ok].index.get_level_values(0))
n_s, n_any, n_same = len(search_users), len(search_users & atc_users), len(same_day)
print(f"\nQ4 - searched: {n_s} | ATC any day: {n_any} ({n_any / n_s:.1%}) | "
      f"ATC same day after search: {n_same} ({n_same / n_s:.2%})")

fig, ax = plt.subplots(figsize=(8, 4))
labels = ["Searched", "Added to cart\n(any day)", "Same day,\nafter search"]
ax.bar(labels, [n_s, n_any, n_same], color=[NAVY, TEAL, ORANGE])
for i, v in enumerate([n_s, n_any, n_same]):
    ax.text(i, v + 12, f"{v:,}", ha="center", fontsize=11)
ax.set_ylim(0, n_s * 1.12)
ax.set_title("Q4. Only 1 of 750 searchers adds to cart the same day (0.13%)", loc="left", fontweight="bold")
fig.tight_layout(); fig.savefig(CHARTS / "q4_search_to_cart.png", dpi=160); plt.close(fig)

# ----------------------------------------------------------------------
# 6. Conversion funnel (distinct users with >= 1 event of each type;
#    stages are not strictly sequential per user) + device mix by country
# ----------------------------------------------------------------------
stages = ["product_view", "add_to_cart", "checkout", "purchase"]
funnel = [df.loc[df["event_type"] == e, "user_id"].nunique() for e in stages]
print("\nFunnel (distinct users)")
for i, (e, n) in enumerate(zip(stages, funnel)):
    print(f"{e:<14}{n:>6,}  " + (f"{n / funnel[i - 1]:.1%} of previous" if i else "-"))
print(f"Product view -> purchase: {funnel[-1] / funnel[0]:.1%}")

fig, ax = plt.subplots(figsize=(8, 3.8))
ax.barh(["Product view", "Add to cart", "Checkout", "Purchase"][::-1], funnel[::-1],
        color=[NAVY, ORANGE, TEAL, NAVY][::-1])
for y, v in enumerate(funnel[::-1]):
    ax.text(v + 15, y, f"{v:,}", va="center", fontsize=10)
ax.set_xlim(0, max(funnel) * 1.15); ax.set_xlabel("Distinct users")
ax.set_title("Funnel. Biggest leak: product view to add to cart (53.2%)", loc="left", fontweight="bold")
fig.tight_layout(); fig.savefig(CHARTS / "funnel.png", dpi=160); plt.close(fig)

print("\nDevice share by country (events)")
print(pd.crosstab(df["country"], df["device"], normalize="index").round(3))
# ----------------------------------------------------------------------
# 7. Summary dashboard (used as the hero image in the README)
# ----------------------------------------------------------------------
from matplotlib.patches import FancyBboxPatch

fig = plt.figure(figsize=(16, 9.5), facecolor="white")
gs = fig.add_gridspec(3, 2, height_ratios=[0.55, 1, 1], hspace=0.55, wspace=0.2,
                      left=0.05, right=0.97, top=0.86, bottom=0.07)
fig.text(0.05, 0.955, "BukaToko: User Behaviour & Funnel Analysis", fontsize=24, fontweight="bold", color=NAVY)
fig.text(0.05, 0.915, f"{len(df):,} events  |  {df['user_id'].nunique():,} users  |  27 Mar - 23 Sep 2025",
         fontsize=13, color=SLATE)

kpi_ax = fig.add_subplot(gs[0, :]); kpi_ax.axis("off"); kpi_ax.set_xlim(0, 1); kpi_ax.set_ylim(0, 1)
kpis = [(f"{q1['active_users'].iloc[0]:,}", "active users in Indonesia\n(#1 market, Q2 2025)", ORANGE),
        ("~1,150", "MAU, flat Apr-Aug\n(1,129-1,170)", NAVY),
        (f"+{change['referral']}%", "referral MAU, Apr to Aug\n(social " + f"{change['social']}%)", TEAL),
        (f"{share['android'] + share['ios']:.1f}%", "of sessions on mobile\n(Android 49.6%)", NAVY),
        (f"{funnel[1] / funnel[0]:.1%}", "product view to add to cart\n(biggest funnel leak)", ORANGE)]
bw, gap = 0.19, 0.0125
for i, (big, small, col) in enumerate(kpis):
    x = i * (bw + gap)
    kpi_ax.add_patch(FancyBboxPatch((x, 0.02), bw, 0.96, boxstyle="round,pad=0,rounding_size=0.03",
                                    fc="#F1F4F9", ec="none", transform=kpi_ax.transAxes))
    kpi_ax.text(x + 0.015, 0.58, big, fontsize=26, fontweight="bold", color=col, va="center")
    kpi_ax.text(x + 0.015, 0.2, small, fontsize=10.5, color=NAVY, va="center", linespacing=1.3)

a1 = fig.add_subplot(gs[1, 0])
a1.barh(q1.index[::-1], q1["active_users"][::-1], color=([ORANGE] + [NAVY] * 7)[::-1])
for y, v in enumerate(q1["active_users"][::-1]):
    a1.text(v + 12, y, f"{v:,}", va="center", fontsize=9)
a1.set_title("Q1. Active users by country, Q2 2025", loc="left", fontweight="bold", fontsize=12)

a2 = fig.add_subplot(gs[1, 1])
for c in full.columns:
    hi = {"referral": ORANGE, "social": "#D64550"}.get(c)
    a2.plot(["Apr", "May", "Jun", "Jul", "Aug"], full[c], marker="o", lw=2.6 if hi else 1.4,
            color=hi or "#A9B4CC", label=c if hi else None)
a2.set_ylim(200, 300); a2.legend(frameon=False, fontsize=9, loc="lower left")
a2.set_title("Q2. MAU per channel (grey = other channels)", loc="left", fontweight="bold", fontsize=12)

a3 = fig.add_subplot(gs[2, 0])
a3.barh(q3.index[::-1], q3[::-1], color=[SLATE, NAVY, ORANGE])
for y, (v, pc) in enumerate(zip(q3[::-1], share[::-1])):
    a3.text(v + 40, y, f"{v:,} ({pc}%)", va="center", fontsize=9)
a3.set_xlim(0, q3.max() * 1.25)
a3.set_title("Q3. Sessions by device", loc="left", fontweight="bold", fontsize=12)

a4 = fig.add_subplot(gs[2, 1])
a4.barh(["Product view", "Add to cart", "Checkout", "Purchase"][::-1], funnel[::-1],
        color=[NAVY, ORANGE, TEAL, NAVY][::-1])
for y, v in enumerate(funnel[::-1]):
    a4.text(v + 15, y, f"{v:,}", va="center", fontsize=9)
a4.set_xlim(0, max(funnel) * 1.15)
a4.set_title("Funnel. Distinct users per stage", loc="left", fontweight="bold", fontsize=12)
fig.savefig(CHARTS / "dashboard.png", dpi=130); plt.close(fig)

print("\nDone. Charts saved to", CHARTS)
