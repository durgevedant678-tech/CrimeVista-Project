import os
from typing import Any


def _normalise(text: str) -> str:
    return " ".join(text.lower().split())


def _matches(message: str, *keywords: str) -> bool:
    normalised = _normalise(message)
    return any(keyword in normalised for keyword in keywords)


def _build_fallback_response(message: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
    cleaned = (message or "").strip()
    page = (context or {}).get("page") or "general"
    filters = (context or {}).get("filters") or {}
    selected_area = (context or {}).get("selectedArea")
    selected_incident = (context or {}).get("selectedIncident")

    if not cleaned:
        cleaned = "How do I use CrimeVista?"

    knowledge = {
        "overview": "This view shows the current citywide picture: total incidents, trend direction, and where pressure is building. If cases are rising in a small area, focus on the hotspot and compare it against the wider baseline.",
        "map": "The map shows where incidents are happening. Use clustering to reduce noise, click a marker to inspect the record, and check whether the pattern is concentrated in one area or spread across the city.",
        "hotspots": "Hotspots highlight the areas with the strongest concentration of incidents or repeated risk. These are the places to review first for patrol planning, surveillance, or deeper investigation.",
        "areas": "Area Explorer compares one area to the citywide pattern. It helps answer whether a neighbourhood spike is unusual, part of a larger trend, or tied to a specific crime type or time window.",
        "upload": "Upload lets you bring in a fresh city dataset. Once the file is validated, the app updates the active records and your dashboard, map, trends, and hotspots reflect the new data.",
        "reports": "Reports turn the current view into a shareable summary. They are useful for briefing a team, documenting a risk period, or explaining what changed in a set of areas.",
        "risk": "Risk is not just volume; it also reflects concentration and severity. A small area with repeated serious incidents is often more urgent than a larger low-severity spread.",
        "severity": "Severity tells you how serious an incident is. Critical and high-severity cases deserve faster attention, while low-severity events still matter if they cluster in one location over time.",
        "filters": "Filters help you narrow the data to a date range, crime type, area, severity, or time period. That makes the dashboard and map more actionable instead of overwhelming.",
        "faq": "CrimeVista helps people understand what is happening in a city, where risk is clustering, and which areas deserve attention. It is built for practical insight, not just system explanation.",
    }

    answer = knowledge.get(page, knowledge["faq"]) if page in knowledge else knowledge["faq"]

    if _matches(cleaned, "dashboard", "overview", "kpi", "executive"):
        answer = "The overview shows whether the citywide picture is stable, growing, or concentrated in a few hotspots. It is the best place to start when you want a quick read on how risk is changing."
    elif _matches(cleaned, "map", "incident", "location", "geo", "where"):
        answer = knowledge["map"]
    elif _matches(cleaned, "hotspot", "risk", "danger", "priority", "unsafe", "which area"):
        answer = knowledge["hotspots"]
    elif _matches(cleaned, "area", "area explorer", "comparison", "neighbourhood", "neighborhood"):
        answer = knowledge["areas"]
    elif _matches(cleaned, "upload", "dataset", "csv", "import", "new city", "new data"):
        answer = knowledge["upload"]
    elif _matches(cleaned, "report", "export", "pdf", "csv", "xlsx", "brief"):
        answer = knowledge["reports"]
    elif _matches(cleaned, "severity", "critical", "high", "low", "serious"):
        answer = knowledge["severity"]
    elif _matches(cleaned, "filter", "date", "crime type", "time period", "narrow"):
        answer = knowledge["filters"]
    elif _matches(cleaned, "how", "use", "start", "help", "guide", "what should i do"):
        answer = "Start with the overview to understand the citywide pattern, then move to hotspots or the map to find the specific areas that stand out. Use filters to narrow the view and focus on the most relevant pattern."
    elif _matches(cleaned, "which area", "safer", "more secure", "safest", "secure", "most risky", "highest risk", "riskier", "unsafe"):
        if selected_area:
            answer = (
                f"For a practical read, {selected_area} should be compared against nearby zones using three signals: incident count, severity mix, and whether the pattern is rising. "
                "An area with fewer incidents, fewer serious events, and less clustering is usually the safer option."
            )
        else:
            answer = (
                "To identify the safer area, compare the zones with the lowest incident volume, the fewest high-severity incidents, and the weakest recurring pattern. "
                "In plain terms, the safest area is usually the one with less concentration and less repeated risk over time."
            )

    if selected_area:
        answer += f" Right now, the active context is the area '{selected_area}'."
    if selected_incident:
        answer += " The selected incident gives you a more detailed view of that case and its surrounding pattern."
    if filters:
        answer += " The current filters are narrowing the dataset so this insight is based on a more specific view."

    suggested_actions = []
    if page == "dashboard":
        suggested_actions = ["Review KPI changes", "Check the hotspot list", "Open area comparison"]
    elif page == "map":
        suggested_actions = ["Inspect a cluster", "Open the area detail", "Compare nearby incidents"]
    elif page == "hotspots":
        suggested_actions = ["Review top-risk zones", "Compare area trends", "Check severity split"]
    elif page == "upload":
        suggested_actions = ["Load a fresh dataset", "Validate columns", "Review import status"]
    elif page == "reports":
        suggested_actions = ["Build a summary report", "Select key sections", "Share findings"]
    else:
        suggested_actions = ["Check the overview", "Review hotspots", "Use filters to narrow scope"]

    return {
        "answer": answer,
        "provider": "fallback",
        "context": {
            "page": page,
            "selectedArea": selected_area,
            "selectedIncident": bool(selected_incident),
            "activeFilters": bool(filters),
        },
        "suggestedActions": suggested_actions,
    }


async def generate_chat_response(payload: dict[str, Any]) -> dict[str, Any]:
    message = str((payload or {}).get("message") or "").strip()
    context = {
        "page": (payload or {}).get("page"),
        "filters": (payload or {}).get("filters") or {},
        "selectedArea": (payload or {}).get("selectedArea"),
        "selectedIncident": (payload or {}).get("selectedIncident"),
    }

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if api_key:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=api_key)
            completion = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are CrimeVista AI, a city crime intelligence assistant for global safety analytics. "
                            "Answer concisely using the app's existing metrics, filters, hotspots, trend analysis, "
                            "and reporting concepts. If the user asks about configuration or features that the app does not support, "
                            "explain the built-in CrimeVista workflow instead."
                        ),
                    },
                    {"role": "user", "content": message},
                ],
                temperature=0.2,
            )
            content = completion.choices[0].message.content.strip()
            if content:
                return {
                    "answer": content,
                    "provider": "openai",
                    "context": {
                        "page": context["page"],
                        "selectedArea": context["selectedArea"],
                        "selectedIncident": bool(context["selectedIncident"]),
                        "activeFilters": bool(context["filters"]),
                    },
                    "suggestedActions": ["Review the dashboard", "Inspect hotspots", "Open the Help guide"],
                }
        except Exception:
            pass

    return _build_fallback_response(message, context)
