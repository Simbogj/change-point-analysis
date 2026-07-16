"""
event.py

Creates the geopolitical events dataset for the Brent Oil Price project.
Run:
    src\python event.py
"""

from pathlib import Path
import pandas as pd


def create_events_dataset():
    events = [
        ["1973-10-19", "OPEC Oil Embargo", "OPEC Policy / Geopolitical", "High",
         "Arab OPEC members declare embargo against nations supporting Israel; prices quadruple."],

        ["1979-01-01", "Iranian Revolution", "Geopolitical / Supply Shock", "High",
         "Political upheaval in Iran severely reduces global oil output, triggering the second major oil crisis."],

        ["1980-09-22", "Iran-Iraq War", "Geopolitical / Supply Shock", "High",
         "Hostilities disrupt oil exports from both nations, leading to extended supply shortages."],

        ["1990-08-02", "Iraq Invasion of Kuwait", "Geopolitical", "High",
         "Iraqi invasion causes immediate spike in global crude prices ahead of the Gulf War."],

        ["1991-01-17", "Operation Desert Storm (Gulf War)", "Geopolitical / Supply Shock", "High",
         "US-led coalition launches military operations against Iraq, leading to volatile price swings."],

        ["1997-11-27", "OPEC Jakarta Quota Increase", "OPEC Policy", "Medium",
         "OPEC decides to raise production quotas amid oversupply, shortly before the 1997 Asian Financial Crisis."],

        ["1997-12-01", "Asian Financial Crisis Impact", "Economic Shock", "High",
         "Oversupply and collapsing Asian demand lead to a prolonged oil price slump below $10/bbl."],

        ["2001-09-11", "9/11 Terrorist Attacks", "Geopolitical / Economic Shock", "High",
         "Aviation halts and economic uncertainty trigger an immediate fall in oil demand and prices."],

        ["2003-03-20", "US Invasion of Iraq", "Geopolitical", "High",
         "Coalition forces invade Iraq, disrupting supply and driving oil prices upward due to security risks."],

        ["2008-07-01", "Global Financial Crisis Peak", "Economic Shock", "High",
         "Oil prices reach a record nominal high of $147/bbl before collapsing due to demand destruction."],

        ["2008-12-17", "OPEC Oran Production Cut", "OPEC Policy", "High",
         "OPEC agrees to a historic 2.2 million b/d cut in response to the GFC price collapse."],

        ["2011-02-15", "Libyan Civil War", "Geopolitical", "High",
         "Outbreak of the civil war halts Libyan oil production, creating a significant supply deficit in Europe."],

        ["2014-11-27", "OPEC Maintains Production", "OPEC Policy", "High",
         "OPEC decides not to cut production despite rising global oversupply, triggering a steep drop in oil prices."],

        ["2016-11-30", "OPEC+ Vienna Agreement", "OPEC Policy", "High",
         "OPEC and non-OPEC producers (OPEC+) agree to cut production by 1.2 million b/d, forming a new cartel."],

        ["2019-09-14", "Saudi Aramco Drone Attacks", "Geopolitical / Supply Shock", "High",
         "Drone attacks temporarily knock out 5% of global supply, causing the largest single-day surge in oil prices."],

        ["2020-03-09", "COVID-19 Pandemic & Price War", "Economic Shock / OPEC Policy", "High",
         "Global lockdowns crater oil demand; simultaneous breakdown in OPEC+ negotiations causes a severe short-term price crash."],

        ["2020-04-12", "OPEC+ Historic Production Cut", "OPEC Policy", "High",
         "OPEC+ coalition agrees to a record-breaking production cut of 9.7 million b/d to stabilize the cratered market."],

        ["2020-04-20", "WTI Crude Hits Negative Pricing", "Economic Shock", "High",
         "Due to massive oversupply and filled storage capacity during the COVID-19 pandemic, May WTI futures fall below zero."],

        ["2022-02-24", "Russia-Ukraine Conflict", "Geopolitical / Economic", "High",
         "Russian invasion triggers Western sanctions, shifting European energy markets and sending Brent surging over $120/bbl."],
    ]

    df = pd.DataFrame(
        events,
        columns=[
            "Date",
            "Event",
            "Category",
            "Severity",
            "Impact Summary"
        ],
    )

    df["Date"] = pd.to_datetime(df["Date"])

    return df


def main():
    # Project root (assuming event.py is inside src/)
    project_root = Path(__file__).resolve().parent.parent

    output_dir = project_root / "data"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / "events.csv"

    df = create_events_dataset()

    df.to_csv(output_file, index=False)

    print("=" * 60)
    print("Events dataset created successfully")
    print("=" * 60)
    print(f"Saved to : {output_file}")
    print(f"Records  : {len(df)}")
    print(df.head())


if __name__ == "__main__":
    main()