import os
from decimal import Decimal

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from supabase import create_client


load_dotenv()

app = Flask(__name__)

# TODO: [ENTER YOUR REACT FRONTEND ORIGIN(S)]
# For local Vite development, FRONTEND_ORIGIN=http://localhost:5173
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
CORS(app, resources={r"/api/*": {"origins": frontend_origin}})


def _get_supabase_client():
    """Build the client on demand so missing configuration gives a useful API error."""
    # TODO: [ENTER YOUR SUPABASE URL AND API KEY IN backend/.env]
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be configured in backend/.env")
    return create_client(supabase_url, supabase_key)


def _json_safe(value):
    """Convert common database scalar values into JSON-serializable values."""
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/map-data")
def get_map_data():
    try:
        supabase = _get_supabase_client()

        # TODO: [ENTER YOUR EXACT SUPABASE TABLE NAME]
        # Change "YOUR_TABLE_NAME" to the table that contains your map records.
        response = supabase.table("YOUR_TABLE_NAME").select("*").execute()
        rows = response.data or []

        # TODO: [ENTER YOUR DATABASE LATITUDE AND LONGITUDE COLUMN NAMES]
        # Replace these names with the exact column names in YOUR_TABLE_NAME.
        latitude_column = "latitude"
        longitude_column = "longitude"

        points = []
        for row in rows:
            try:
                latitude = float(row[latitude_column])
                longitude = float(row[longitude_column])
            except (KeyError, TypeError, ValueError):
                # Ignore rows without usable coordinates.
                continue

            # Preserve all columns for frontend popup customization.
            point = {key: _json_safe(value) for key, value in row.items()}
            point[latitude_column] = latitude
            point[longitude_column] = longitude
            points.append(point)

        return jsonify({"data": points, "count": len(points)})
    except RuntimeError as exc:
        app.logger.error("Supabase configuration error: %s", exc)
        return jsonify({"error": "Map data service is not configured"}), 500
    except Exception:
        app.logger.exception("Failed to fetch map data from Supabase")
        return jsonify({"error": "Unable to fetch map data"}), 502


if __name__ == "__main__":
    # Debug mode is for local development only. Use a production WSGI server when deploying.
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")
