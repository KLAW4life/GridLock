import requests
import json

HEADERS = {
    "User-Agent": "GridLockChallenge-DataResearch/1.0 (kwrig082@fiu.edu)"
}

def search_overpass_by_operator(operator_pattern, bbox, timeout=180):
    """
    Search OpenStreetMap power infrastructure by OPERATOR (not name) across
    an entire region. Returns every tagged node/way/relation whose operator
    field matches the pattern -- useful for pulling ALL of a utility's
    infrastructure at once, rather than searching name-by-name.
    """
    endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ]

    query = (
        f'[out:json][timeout:{timeout}][bbox:{bbox}];'
        f'nwr["power"]["operator"~"{operator_pattern}",i];'
        f'out center;'
    )

    for endpoint in endpoints:
        try:
            print(f"Trying {endpoint} ...")
            response = requests.get(
                endpoint,
                params={"data": query},
                headers=HEADERS,
                timeout=timeout + 15,
            )
            response.raise_for_status()
            print(f"  Success.")
            return response.json()
        except Exception as e:
            print(f"  Failed: {e}")
            continue

    raise RuntimeError("All Overpass endpoints failed or timed out.")


def get_coords(el):
    if "lat" in el and "lon" in el:
        return el["lat"], el["lon"]
    elif "center" in el:
        return el["center"]["lat"], el["center"]["lon"]
    return None, None


def summarize_results(data):
    elements = data.get("elements", [])
    named = [el for el in elements if el.get("tags", {}).get("name")]

    print(f"\nTotal features returned: {len(elements)}")
    print(f"Named features: {len(named)}\n")

    if named:
        print("=== Named features ===")
        for el in named:
            tags = el["tags"]
            lat, lon = get_coords(el)
            print(f"{tags.get('name')} ({tags.get('power')}) "
                  f"[operator={tags.get('operator')}] -> {lat}, {lon}")


def save_as_geojson(data, filepath):
    """Convert Overpass JSON to a GeoJSON FeatureCollection and save it."""
    features = []
    for el in data.get("elements", []):
        lat, lon = get_coords(el)
        if lat is None:
            continue
        features.append({
            "type": "Feature",
            "properties": el.get("tags", {}),
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        })

    geojson = {"type": "FeatureCollection", "features": features}
    with open(filepath, "w") as f:
        json.dump(geojson, f, indent=2)
    print(f"\nSaved {len(features)} features to {filepath}")


if __name__ == "__main__":

    # Georgia Power operator names
    OPERATOR_PATTERN = "Georgia Power|Georgia Power Company"

    # Full Georgia bounding box (south, west, north, east)
    GA_BBOX = "30.35,-85.61,35.00,-80.84"

    result = search_overpass_by_operator(
        OPERATOR_PATTERN,
        bbox=GA_BBOX,
        timeout=180
    )

    summarize_results(result)

    save_as_geojson(
        result,
        "georgia_power_all.geojson"
    )