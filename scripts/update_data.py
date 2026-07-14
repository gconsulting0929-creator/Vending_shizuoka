#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests

JST = timezone(timedelta(hours=9))
JMA_STATION = "50331"       # 静岡地方気象台
WBGT_STATION = "50331"      # 環境省 WBGT 静岡地点
OUTPUT = Path(__file__).resolve().parents[1] / "data.json"

HEADERS = {
    "User-Agent": "Vending-shizuhoka-WBGT-monitor/1.0",
    "Accept": "application/json,text/plain,*/*",
}

def get_json(url: str, *, params: dict[str, Any] | None = None) -> dict[str, Any]:
    response = requests.get(url, params=params, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.json()

def get_text(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.text.strip()

def parse_jma_time(value: str) -> datetime:
    # Example: 2026-07-14T18:10:00+09:00
    return datetime.fromisoformat(value)

def get_jma_weather() -> dict[str, Any]:
    latest_url = "https://www.jma.go.jp/bosai/amedas/data/latest_time.txt"
    latest_text = get_text(latest_url)
    latest = parse_jma_time(latest_text)

    # Try the latest map and a few preceding 10-minute maps.
    for step in range(0, 7):
        target = latest - timedelta(minutes=10 * step)
        key = target.strftime("%Y%m%d%H%M%S")
        url = f"https://www.jma.go.jp/bosai/amedas/data/map/{key}.json"
        try:
            payload = get_json(url)
        except requests.RequestException:
            continue

        station = payload.get(JMA_STATION)
        if not station:
            continue

        temp = station.get("temp")
        humidity = station.get("humidity")
        temperature = temp[0] if isinstance(temp, list) and temp else None
        humidity_value = humidity[0] if isinstance(humidity, list) and humidity else None

        if temperature is not None and humidity_value is not None:
            return {
                "temperature": float(temperature),
                "humidity": float(humidity_value),
                "weatherObservedAt": target.isoformat(),
            }

    raise RuntimeError("気象庁アメダスから静岡の温度・湿度を取得できませんでした")

def compact_timestamp(dt: datetime) -> str:
    return dt.astimezone(JST).strftime("%Y%m%d%H%M%S")

def parse_wbgt_date(value: str) -> datetime:
    return datetime.strptime(value, "%Y/%m/%d %H:%M:%S").replace(tzinfo=JST)

def get_wbgt() -> dict[str, Any]:
    now = datetime.now(JST)
    start = now - timedelta(hours=6)
    params = [
        ("data_type", "0"),
        ("data_type", "1"),
        ("location_type", "1"),
        ("wbgt_nos", WBGT_STATION),
        ("date_from", compact_timestamp(start)),
        ("date_to", compact_timestamp(now)),
    ]

    response = requests.get(
        "https://www.wbgt.env.go.jp/api/v1/getSurveyData",
        params=params,
        headers=HEADERS,
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()

    if payload.get("status") != "success":
        raise RuntimeError(payload.get("errMsg") or "環境省WBGT API error")

    records = payload.get("data") or []
    valid = []
    for record in records:
        try:
            value = float(record["wbgt_WO"])
            observed = parse_wbgt_date(record["wbgt_date"])
        except (KeyError, TypeError, ValueError):
            continue
        valid.append((observed, value, record))

    if not valid:
        raise RuntimeError("環境省WBGT APIから静岡の実況値を取得できませんでした")

    observed, value, record = max(valid, key=lambda item: item[0])
    return {
        "wbgt": value,
        "wbgtObservedAt": observed.isoformat(),
        "wbgtClass": int(record.get("wbgt_class", 0)),
        "wbgtQuality": float(record["wbgt_WI"]) if record.get("wbgt_WI") not in (None, "") else None,
    }

def read_previous() -> dict[str, Any]:
    if not OUTPUT.exists():
        return {}
    try:
        return json.loads(OUTPUT.read_text(encoding="utf-8"))
    except Exception:
        return {}

def main() -> int:
    previous = read_previous()
    result: dict[str, Any] = {
        "location": "静岡市",
        "station": JMA_STATION,
        "source": {
            "temperature": "気象庁",
            "humidity": "気象庁",
            "wbgt": "環境省",
        },
    }

    errors: list[str] = []

    try:
        result.update(get_jma_weather())
    except Exception as exc:
        errors.append(f"JMA: {exc}")
        for key in ("temperature", "humidity", "weatherObservedAt"):
            if key in previous:
                result[key] = previous[key]

    try:
        result.update(get_wbgt())
    except Exception as exc:
        errors.append(f"WBGT: {exc}")
        for key in ("wbgt", "wbgtObservedAt", "wbgtClass", "wbgtQuality"):
            if key in previous:
                result[key] = previous[key]

    required = ("temperature", "humidity", "wbgt")
    missing = [key for key in required if key not in result]
    if missing:
        print("Missing required values:", ", ".join(missing), file=sys.stderr)
        print("\n".join(errors), file=sys.stderr)
        return 1

    result["updatedAt"] = datetime.now(JST).isoformat(timespec="seconds")
    result["errors"] = errors

    OUTPUT.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
