#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests

JST = timezone(timedelta(hours=9))
JMA_STATION = "50331"   # 静岡地方気象台
WBGT_STATION = "50331"  # 環境省 静岡
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data.json"

HEADERS = {
    "User-Agent": "Vending-shizuhoka-WBGT-monitor/1.1",
    "Accept": "application/json,text/plain,*/*",
}

def request(url: str, *, params: list[tuple[str, str]] | None = None) -> requests.Response:
    response = requests.get(url, params=params, headers=HEADERS, timeout=45)
    response.raise_for_status()
    return response

def read_previous() -> dict[str, Any]:
    try:
        return json.loads(OUTPUT.read_text(encoding="utf-8"))
    except Exception:
        return {}

def fetch_jma() -> dict[str, Any]:
    latest_text = request(
        "https://www.jma.go.jp/bosai/amedas/data/latest_time.txt"
    ).text.strip()
    latest = datetime.fromisoformat(latest_text)

    # 最新時刻のファイルに地点データがまだ入っていない場合があるため、
    # 10分ずつ過去へ戻って探索する。
    for offset in range(0, 13):
        observed = latest - timedelta(minutes=10 * offset)
        key = observed.strftime("%Y%m%d%H%M%S")
        url = f"https://www.jma.go.jp/bosai/amedas/data/map/{key}.json"

        try:
            payload = request(url).json()
        except Exception:
            continue

        station = payload.get(JMA_STATION)
        if not isinstance(station, dict):
            continue

        temp = station.get("temp")
        humidity = station.get("humidity")

        temperature = temp[0] if isinstance(temp, list) and temp else None
        humidity_value = humidity[0] if isinstance(humidity, list) and humidity else None

        if temperature is None or humidity_value is None:
            continue

        return {
            "temperature": float(temperature),
            "humidity": float(humidity_value),
            "weatherObservedAt": observed.astimezone(JST).isoformat(),
        }

    raise RuntimeError("静岡の温度・湿度を取得できませんでした")

def compact(dt: datetime) -> str:
    return dt.astimezone(JST).strftime("%Y%m%d%H%M%S")

def parse_wbgt_date(value: str) -> datetime:
    return datetime.strptime(value, "%Y/%m/%d %H:%M:%S").replace(tzinfo=JST)

def fetch_wbgt_type(data_type: int, start: datetime, end: datetime) -> list[dict[str, Any]]:
    params = [
        ("data_type", str(data_type)),
        ("location_type", "1"),
        ("wbgt_nos", WBGT_STATION),
        ("date_from", compact(start)),
        ("date_to", compact(end)),
    ]
    payload = request(
        "https://www.wbgt.env.go.jp/api/v1/getSurveyData",
        params=params,
    ).json()

    if payload.get("status") != "success":
        raise RuntimeError(payload.get("errMsg") or f"WBGT API error ({data_type})")

    return payload.get("data") or []

def fetch_wbgt() -> dict[str, Any]:
    now = datetime.now(JST)
    start = now - timedelta(hours=12)

    records: list[dict[str, Any]] = []
    errors: list[str] = []

    # 静岡地点が推定値・実測値のどちらで提供されても取得できるように両方確認。
    for data_type in (0, 1):
        try:
            records.extend(fetch_wbgt_type(data_type, start, now))
        except Exception as exc:
            errors.append(str(exc))

    candidates: list[tuple[datetime, float, dict[str, Any]]] = []
    for record in records:
        try:
            if str(record.get("wbgt_no")) != WBGT_STATION:
                continue
            observed = parse_wbgt_date(str(record["wbgt_date"]))
            value = float(record["wbgt_WO"])
        except (KeyError, TypeError, ValueError):
            continue
        candidates.append((observed, value, record))

    if not candidates:
        raise RuntimeError("静岡のWBGT実況値を取得できませんでした: " + " / ".join(errors))

    observed, value, record = max(candidates, key=lambda item: item[0])

    quality = record.get("wbgt_WI")
    return {
        "wbgt": value,
        "wbgtObservedAt": observed.isoformat(),
        "wbgtClass": int(record.get("wbgt_class", 0)),
        "wbgtQuality": float(quality) if quality not in (None, "") else None,
    }

def copy_previous(result: dict[str, Any], previous: dict[str, Any], keys: tuple[str, ...]) -> None:
    for key in keys:
        if key in previous:
            result[key] = previous[key]

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
        result.update(fetch_jma())
    except Exception as exc:
        errors.append(f"JMA: {exc}")
        copy_previous(
            result,
            previous,
            ("temperature", "humidity", "weatherObservedAt"),
        )

    try:
        result.update(fetch_wbgt())
    except Exception as exc:
        errors.append(f"WBGT: {exc}")
        copy_previous(
            result,
            previous,
            ("wbgt", "wbgtObservedAt", "wbgtClass", "wbgtQuality"),
        )

    missing = [key for key in ("temperature", "humidity", "wbgt") if key not in result]
    if missing:
        print(f"Missing required data: {', '.join(missing)}", file=sys.stderr)
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
