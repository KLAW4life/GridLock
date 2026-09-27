import os
from decimal import Decimal
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from postgrest import APIError

load_dotenv()

app = Flask(__name__)

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"), # type: ignore
    os.environ.get("SUPABASE_PUBLISHABLE_KEY") # type: ignore
)

@app.route('/api/georgia')
def georgiaData():
    try:
        response = supabase.table('Georgia').select("*").execute()
    except APIError as error:
        return f'<p>Error loading places: {error.message}</p>'

    places = response.data or []
    return jsonify(places)

@app.route('/api/southCarolina')
def southCarolinaData():
    try:
        response = supabase.table('South_Carolina').select("*").execute()
    except APIError as error:
        return f'<p>Error loading places: {error.message}</p>'

    places = response.data or []
    return jsonify(places)

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

@app.route("/")
def index():
    return """
    <h1>Welcome to My Flask API</h1>
    <p>Try these endpoints:</p>
    <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/items">/api/items</a></li>
        <li><a href="/api/items/1">/api/items/1</a></li>
    </ul>
    """

# if __name__ == "__main__":
#     app.run(debug=True, port=5055)


# # @app.get("/api/map-data")
# # def get_map_data():
# #     try:
# #         supabase = _get_supabase_client()

# #         # TODO: [ENTER YOUR EXACT SUPABASE TABLE NAME]
# #         # Change "YOUR_TABLE_NAME" to the table that contains your map records.
# #         response = supabase.table("YOUR_TABLE_NAME").select("*").execute()
# #         rows = response.data or []

# #         # TODO: [ENTER YOUR DATABASE LATITUDE AND LONGITUDE COLUMN NAMES]
# #         # Replace these names with the exact column names in YOUR_TABLE_NAME.
# #         latitude_column = "latitude"
# #         longitude_column = "longitude"

# #         points = []
# #         for row in rows:
# #             try:
# #                 latitude = float(row[latitude_column])
# #                 longitude = float(row[longitude_column])
# #             except (KeyError, TypeError, ValueError):
# #                 # Ignore rows without usable coordinates.
# #                 continue

# #             # Preserve all columns for frontend popup customization.
# #             point = {key: _json_safe(value) for key, value in row.items()}
# #             point[latitude_column] = latitude
# #             point[longitude_column] = longitude
# #             points.append(point)

# #         return jsonify({"data": points, "count": len(points)})
# #     except RuntimeError as exc:
# #         app.logger.error("Supabase configuration error: %s", exc)
# #         return jsonify({"error": "Map data service is not configured"}), 500
# #     except Exception:
# #         app.logger.exception("Failed to fetch map data from Supabase")
# #         return jsonify({"error": "Unable to fetch map data"}), 502

if __name__ == "__main__":
    # Debug mode is for local development only. Use a production WSGI server when deploying.
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5001")), debug=os.getenv("FLASK_DEBUG") == "1")
