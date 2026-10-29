from collections import Counter
from datetime import datetime, time, timedelta

from ..models import Crime

TIME_PERIODS = ["Morning", "Afternoon", "Evening", "Night"]
SEVERITY_ORDER = ["Critical", "High", "Medium", "Low"]


def time_period_for(value: str | time | None) -> str | None:
    if value is None:
        return None
    try:
        clock = (
            value if isinstance(value, time) else time.fromisoformat(str(value).strip())
        )
    except ValueError:
        return None
    hour = clock.hour
    if 5 <= hour < 12:
        return "Morning"
    if 12 <= hour < 17:
        return "Afternoon"
    if 17 <= hour < 21:
        return "Evening"
    return "Night"


def counts(
    rows: list[Crime],
    field: str,
    limit: int | None = None,
    ordered_values: list[str] | None = None,
    drop_missing: bool = True,
):
    counter = Counter()
    for row in rows:
        value = (
            time_period_for(row.time) if field == "time_period" else getattr(row, field)
        )
        if value is None and drop_missing:
            continue
        counter[str(value or "Unknown")] += 1
    if ordered_values is not None:
        keys = [value for value in ordered_values if value in counter]
        keys.extend(sorted(set(counter) - set(keys)))
        result = [(key, counter[key]) for key in keys]
    else:
        result = sorted(
            counter.items(), key=lambda item: (-item[1], item[0].casefold())
        )
    return result[:limit] if limit else result


def distribution(
    rows: list[Crime],
    field: str,
    key: str,
    limit: int | None = None,
    order: list[str] | None = None,
):
    return [
        {key: value, "count": count}
        for value, count in counts(rows, field, limit, order)
    ]


def monthly(rows: list[Crime]):
    tally = Counter(row.date.replace(day=1).isoformat() for row in rows if row.date)
    return [{"month_start": month, "count": tally[month]} for month in sorted(tally)]


def monthly_by(rows: list[Crime], field: str, output_key: str, top_n: int):
    top_values = [value for value, _ in counts(rows, field, top_n)]
    tally = Counter()
    for row in rows:
        value = (
            time_period_for(row.time) if field == "time_period" else getattr(row, field)
        )
        if row.date and value in top_values:
            tally[(row.date.replace(day=1).isoformat(), value)] += 1
    return [
        {"month_start": month, output_key: value, "count": count}
        for (month, value), count in sorted(tally.items())
    ]


def _percent(part: int, total: int) -> str:
    return f"{part / total * 100:.1f}%" if total else "0%"


def _month_label(value: str) -> str:
    return datetime.fromisoformat(value).strftime("%b %Y")


def build_kpis(rows: list[Crime], total_records: int | None = None):
    total = len(rows)
    high_count = sum(row.severity in {"High", "Critical"} for row in rows)
    top_area = counts(rows, "area", 1)
    top_type = counts(rows, "crime_type", 1)
    months = monthly(rows)
    current = months[-1] if months else None
    previous = months[-2] if len(months) > 1 else None
    change = None
    if current and previous and previous["count"]:
        change = (current["count"] - previous["count"]) / previous["count"] * 100
    items = [
        {
            "id": "total_incidents",
            "label": "Total incidents",
            "value": total,
            "context": f"{_percent(total, total_records or total)} of all recorded incidents",
            "icon": "activity",
            "tone": "neutral",
        },
        {
            "id": "high_severity",
            "label": "High-severity incidents",
            "value": high_count,
            "context": f"{_percent(high_count, total)} rated High or Critical",
            "icon": "shield-alert",
            "tone": "alert",
        },
        {
            "id": "top_area",
            "label": "Most affected area",
            "value": top_area[0][0] if top_area else "—",
            "context": f"{top_area[0][1]:,} incidents" if top_area else "No incidents",
            "icon": "map-pin",
            "tone": "analytics",
        },
        {
            "id": "top_crime_type",
            "label": "Most common crime type",
            "value": top_type[0][0] if top_type else "—",
            "context": (
                f"{_percent(top_type[0][1], total)} of incidents"
                if top_type
                else "No incidents"
            ),
            "icon": "tag",
            "tone": "neutral",
        },
    ]
    if current and previous:
        value = "n/a" if change is None else f"{change:+.1f}%"
        direction = (
            "up"
            if change and change > 0.5
            else "down" if change is not None and change < -0.5 else "flat"
        )
        items.append(
            {
                "id": "incident_change",
                "label": "Month-over-month change",
                "value": value,
                "context": f"{_month_label(current['month_start'])} vs {_month_label(previous['month_start'])}",
                "icon": (
                    "trending-down"
                    if change is not None and change < 0
                    else "trending-up"
                ),
                "tone": "neutral",
                "trend": {
                    "direction": direction,
                    "value": f"{current['count']} vs {previous['count']}",
                    "is_positive": change is not None and change <= 0,
                },
            }
        )
    return items


def build_insights(rows: list[Crime]):
    if not rows:
        return []
    result = []
    area = counts(rows, "area", 1)
    crime_type = counts(rows, "crime_type", 1)
    period = counts(rows, "time_period", 1)
    months = monthly(rows)
    if len(months) > 1 and months[-2]["count"]:
        change = (months[-1]["count"] - months[-2]["count"]) / months[-2]["count"] * 100
        verb = "increased" if change >= 0 else "decreased"
        result.append(
            {
                "text": f"Incident volume {verb} by {abs(change):.1f}% in {_month_label(months[-1]['month_start'])} compared with {_month_label(months[-2]['month_start'])}.",
                "category": "increase" if change >= 0 else "decrease",
            }
        )
    if area:
        result.append(
            {
                "text": f"{area[0][0]} has the highest recorded incidents ({area[0][1]:,}, {_percent(area[0][1], len(rows))} of the filtered total).",
                "category": "location",
            }
        )
    if crime_type:
        result.append(
            {
                "text": f"{crime_type[0][0]} is the largest crime category at {_percent(crime_type[0][1], len(rows))} of incidents.",
                "category": "category",
            }
        )
    if period:
        result.append(
            {
                "text": f"The highest incident count falls in the {period[0][0].lower()} time period ({_percent(period[0][1], len(rows))}).",
                "category": "time",
            }
        )
    high_count = sum(row.severity in {"High", "Critical"} for row in rows)
    result.append(
        {
            "text": f"{_percent(high_count, len(rows))} of incidents are classified as High or Critical severity.",
            "category": "severity",
        }
    )
    return result


def comparison(rows: list[Crime]):
    if not rows:
        return None
    end = max(row.date for row in rows if row.date)
    current_start = end - timedelta(days=89)
    previous_start = end - timedelta(days=179)
    current_count = sum(current_start <= row.date <= end for row in rows)
    previous_count = sum(previous_start <= row.date < current_start for row in rows)
    pct = (
        round((current_count - previous_count) / previous_count * 100, 1)
        if previous_count
        else None
    )
    return {
        "current_label": f"{current_start:%d %b %Y} – {end:%d %b %Y}",
        "previous_label": f"{previous_start:%d %b %Y} – {(current_start - timedelta(days=1)):%d %b %Y}",
        "current_count": current_count,
        "previous_count": previous_count,
        "change_pct": pct,
    }


def area_location(rows: list[Crime]):
    coordinates = [
        (row.latitude, row.longitude)
        for row in rows
        if row.latitude is not None and row.longitude is not None
    ]
    if not coordinates:
        return None
    return {
        "latitude": sum(point[0] for point in coordinates) / len(coordinates),
        "longitude": sum(point[1] for point in coordinates) / len(coordinates),
    }
