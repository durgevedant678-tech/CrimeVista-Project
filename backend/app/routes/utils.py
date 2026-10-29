from fastapi import Query


def filter_params(
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    crime_type: str | None = Query(default=None),
    area_filter: str | None = Query(default=None, alias="area"),
    severity: str | None = Query(default=None),
    time_period: str | None = Query(default=None),
    status: str | None = Query(default=None),
    city: str | None = Query(default=None),
    police_station: str | None = Query(default=None),
):
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "crime_type": crime_type,
        "area": area_filter,
        "severity": severity,
        "time_period": time_period,
        "status": status,
        "city": city,
        "police_station": police_station,
    }
    return {key: value for key, value in params.items() if value is not None}
