import json
import os
from datetime import date, datetime
from decimal import Decimal
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from postgrest import APIError
from datetime import datetime, timedelta
import math

from typing import Final, Literal, TypeAlias
from zipfile import ZipFile

from openpyxl import load_workbook, Workbook
from openpyxl.utils import get_column_letter

load_dotenv()

app = Flask(__name__)

def to_number(value):
    """Safely convert Excel values to floats."""
    if value is None or value == "":
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_excel_date(value):
    """
    Converts Excel dates into Python datetime objects.

    Handles:
    - Actual Excel datetime values
    - Excel serial numbers
    - Common date strings
    """

    if value is None or value == "":
        return None

    if isinstance(value, datetime):
        return value

    # Excel serial date
    if isinstance(value, (int, float)):
        return datetime(1899, 12, 30) + timedelta(days=float(value))

    value = str(value).strip()

    formats = [
        "%m/%d/%Y",
        "%m/%d/%y",
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S"
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            pass

    return None


def calculate_center(lat1, lon1, lat2=None, lon2=None):
    """
    Calculate project center.

    If both sub-points exist:
        center = midpoint of the two points

    If only one exists:
        that point becomes the center
    """

    points = []

    if lat1 is not None and lon1 is not None:
        points.append((lat1, lon1))

    if lat2 is not None and lon2 is not None:
        points.append((lat2, lon2))

    if not points:
        return None

    center_lat = sum(p[0] for p in points) / len(points)
    center_lon = sum(p[1] for p in points) / len(points)

    return center_lat, center_lon


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate straight-line distance between two geographic
    coordinates using the Haversine formula.

    Returns miles.
    """

    EARTH_RADIUS_MILES = 3958.7613

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.asin(math.sqrt(a))

    return EARTH_RADIUS_MILES * c

OUTPUT_FILE = "utility_overlap_analysis.xlsx"

# Projects must be LESS than this distance to count as overlap
OVERLAP_DISTANCE_MILES = 25

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"), # type: ignore
    os.environ.get("SUPABASE_PUBLISHABLE_KEY") # type: ignore
)

@app.route('/api/georgia')
def getGeorgiaData():
    try:
        response = supabase.table('Georgia').select("*").execute()
    except APIError as error:
        return f'<p>Error loading places: {error.message}</p>'

    places = response.data or []
    return jsonify(places)

@app.route('/api/southCarolina')
def getSouthCarolinaData():
    try:
        response = supabase.table('South_Carolina').select("*").execute()
    except APIError as error:
        return f'<p>Error loading places: {error.message}</p>'

    places = response.data or []
    return jsonify(places)

# Defining functions 
def createWorkbooks(stateData):
    workbook1 = load_workbook(stateData,data_only=True)
    return workbook1


def json_safe(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    return value


@app.route('/api/overlapTable')
def createOverlapTable():
    georgiaData = getGeorgiaData()
    southCarolinaData = getSouthCarolinaData()

    #create and load the two Workbooks
    georgiaWorkbook = createWorkbooks(georgiaData)
    southCarolinaWorkbook = createWorkbooks(southCarolinaData)

    # ============================================================
    # READ UTILITY A
    # ============================================================
        # Georgia workbook
    utility_a_sheet = georgiaWorkbook["10 Year Expansion Plan"]

    utility_a_projects = []

    for row in range(2, utility_a_sheet.max_row + 1):

        project_id = utility_a_sheet.cell(row, 3).value
        project_name = utility_a_sheet.cell(row, 4).value
        project_date = utility_a_sheet.cell(row, 5).value
        sponsor = utility_a_sheet.cell(row, 6).value

        location1 = utility_a_sheet.cell(row, 12).value
        lat1 = to_number(utility_a_sheet.cell(row, 13).value)
        lon1 = to_number(utility_a_sheet.cell(row, 14).value)

        location2 = utility_a_sheet.cell(row, 15).value
        lat2 = to_number(utility_a_sheet.cell(row, 16).value)
        lon2 = to_number(utility_a_sheet.cell(row, 17).value)

        # Skip blank project rows
        if project_id is None:
            continue

        center = calculate_center(
            lat1,
            lon1,
            lat2,
            lon2
        )

        # Can't calculate overlap without coordinates
        if center is None:
            continue

        utility_a_projects.append({

            "project_id": str(project_id),
            "project_name": project_name,
            "date": parse_excel_date(project_date),
            "sponsor": sponsor,

            "location1": location1,
            "lat1": lat1,
            "lon1": lon1,

            "location2": location2,
            "lat2": lat2,
            "lon2": lon2,

            "center_lat": center[0],
            "center_lon": center[1]
        })

    # ============================================================
    # READ UTILITY B
    # ============================================================
        # South Carolina workbook

    utility_b_sheet = southCarolinaWorkbook["Dominion Project Matches"]

    utility_b_projects = []

    for row in range(2, utility_b_sheet.max_row + 1):
        project_id = utility_b_sheet.cell(row, 2).value
        project_name = utility_b_sheet.cell(row, 3).value

        status = utility_b_sheet.cell(row, 5).value
        project_date = utility_b_sheet.cell(row, 6).value

        location = utility_b_sheet.cell(row, 7).value

        lat = to_number(
            utility_b_sheet.cell(row, 8).value
        )

        lon = to_number(
            utility_b_sheet.cell(row, 9).value
        )

        if project_id is None:
            continue

        if lat is None or lon is None:
            continue

        utility_b_projects.append({

            "project_id": str(project_id),
            "project_name": project_name,
            "date": parse_excel_date(project_date),
            "status": status,

            "location1": location,
            "lat1": lat,
            "lon1": lon,

            # Only one located point in this workbook,
            # so this point is the center.
            "center_lat": lat,
            "center_lon": lon
        })

    # ============================================================
    # CALCULATE ALL PROJECT PAIRS
    # ============================================================
    overlaps = []

    for project_a in utility_a_projects:

        for project_b in utility_b_projects:

            distance = haversine_distance(

                project_a["center_lat"],
                project_a["center_lon"],

                project_b["center_lat"],
                project_b["center_lon"]
            )

            # Only count projects LESS THAN 25 miles apart
            if distance < OVERLAP_DISTANCE_MILES:

                # Calculate time difference
                if (
                    project_a["date"] is not None
                    and project_b["date"] is not None
                ):

                    time_gap_days = abs(
                        (
                            project_b["date"]
                            - project_a["date"]
                        ).days
                    )

                else:
                    time_gap_days = None

                overlaps.append({

                    "a_id": project_a["project_id"],
                    "a_name": project_a["project_name"],
                    "a_date": project_a["date"],
                    "a_lat": project_a["center_lat"],
                    "a_lon": project_a["center_lon"],

                    "b_id": project_b["project_id"],
                    "b_name": project_b["project_name"],
                    "b_date": project_b["date"],
                    "b_lat": project_b["center_lat"],
                    "b_lon": project_b["center_lon"],

                    "distance": distance,
                    "time_gap": time_gap_days
                })


    # Sort nearest projects first
    overlaps.sort(
        key=lambda x: x["distance"]
    )

    print(
        f"Overlap pairs under "
        f"{OVERLAP_DISTANCE_MILES} miles: "
        f"{len(overlaps)}"
    )
    
    # ============================================================
    # CREATE OUTPUT WORKBOOK
    # ============================================================
    output_workbook = Workbook()

    # Remove default sheet
    default_sheet = output_workbook.active
    output_workbook.remove(default_sheet)

    # ============================================================
    # UTILITY A PROJECT SHEET
    # ============================================================
    sheet_a = output_workbook.create_sheet(
    "Utility A Projects"
    )

    headers_a = [

        "Project ID",
        "Project Name",
        "In-Service Date",
        "Sponsor",

        "Sub-point 1",
        "Latitude 1",
        "Longitude 1",

        "Sub-point 2",
        "Latitude 2",
        "Longitude 2",

        "Center Latitude",
        "Center Longitude"
    ]

    sheet_a.append(headers_a)

    for p in utility_a_projects:

        sheet_a.append([

            p["project_id"],
            p["project_name"],
            p["date"],
            p["sponsor"],

            p["location1"],
            p["lat1"],
            p["lon1"],

            p["location2"],
            p["lat2"],
            p["lon2"],

            p["center_lat"],
            p["center_lon"]
        ])

    # ============================================================
    # UTILITY B PROJECT SHEET
    # ============================================================
    sheet_b = output_workbook.create_sheet(
    "Utility B Projects"
    )

    headers_b = [

        "Project ID",
        "Project Name",
        "In-Service Date",
        "Status",

        "Located Point",
        "Latitude",
        "Longitude",

        "Center Latitude",
        "Center Longitude"
    ]

    sheet_b.append(headers_b)

    for p in utility_b_projects:

        sheet_b.append([

            p["project_id"],
            p["project_name"],
            p["date"],
            p["status"],

            p["location1"],
            p["lat1"],
            p["lon1"],

            p["center_lat"],
            p["center_lon"]
        ])


    # ============================================================
    # OVERLAP TABLE
    # ============================================================
    overlap_sheet = output_workbook.create_sheet(
    "Overlap Table"
    )

    overlap_headers = [

        "Utility A Project ID",
        "Utility A Project",
        "Utility A In-Service Date",

        "A Center Latitude",
        "A Center Longitude",

        "Utility B Project ID",
        "Utility B Project",
        "Utility B In-Service Date",

        "B Center Latitude",
        "B Center Longitude",

        "Distance (miles)",
        "Time Gap (days)"
    ]

    overlap_sheet.append(overlap_headers)


    for overlap in overlaps:

        overlap_sheet.append([

            overlap["a_id"],
            overlap["a_name"],
            overlap["a_date"],

            overlap["a_lat"],
            overlap["a_lon"],

            overlap["b_id"],
            overlap["b_name"],
            overlap["b_date"],

            overlap["b_lat"],
            overlap["b_lon"],

            round(overlap["distance"], 2),

            overlap["time_gap"]
        ])


    # ============================================================
    # FORMAT WORKBOOK
    # ============================================================
    # HEADER_FILL = PatternFill(
    #     "solid",
    #     fgColor="1F4E78"
    # )

    # HEADER_FONT = Font(
    #     bold=True,
    #     color="FFFFFF"
    # )


    for sheet in [
        sheet_a,
        sheet_b,
        overlap_sheet
    ]:

        # # Header formatting
        # for cell in sheet[1]:

        #     cell.fill = HEADER_FILL
        #     cell.font = HEADER_FONT

        #     cell.alignment = Alignment(
        #         horizontal="center",
        #         vertical="center",
        #         wrap_text=True
        #     )

        # Freeze headers
        sheet.freeze_panes = "A2"

        # Add filters
        sheet.auto_filter.ref = sheet.dimensions

        # Auto-size columns
        for column_cells in sheet.columns:

            max_length = 0

            column_letter = get_column_letter(
                column_cells[0].column
            )

            for cell in column_cells:

                try:
                    if cell.value is not None:

                        length = len(str(cell.value))

                        if length > max_length:
                            max_length = length

                except:
                    pass

            # Prevent absurdly wide project-name columns
            adjusted_width = min(
                max_length + 2,
                45
            )

            sheet.column_dimensions[
                column_letter
            ].width = adjusted_width

    # ============================================================
    # FORMAT DATES
    # ============================================================
    # Utility A date column
    for cell in sheet_a["C"][1:]:

        if cell.value is not None:
            cell.number_format = "mm/dd/yyyy"


    # Utility B date column
    for cell in sheet_b["C"][1:]:

        if cell.value is not None:
            cell.number_format = "mm/dd/yyyy"


    # Overlap Utility A dates
    for cell in overlap_sheet["C"][1:]:

        if cell.value is not None:
            cell.number_format = "mm/dd/yyyy"


    # Overlap Utility B dates
    for cell in overlap_sheet["H"][1:]:

        if cell.value is not None:
            cell.number_format = "mm/dd/yyyy"

    # ============================================================
    # SAVE AS JSON + RETURN DATA
    # ============================================================
    json_payload = {
        "utility_a_projects": [
            {key: json_safe(value) for key, value in project.items()}
            for project in utility_a_projects
        ],
        "utility_b_projects": [
            {key: json_safe(value) for key, value in project.items()}
            for project in utility_b_projects
        ],
        "overlap_table": [
            {key: json_safe(value) for key, value in overlap.items()}
            for overlap in overlaps
        ],
        "count": len(overlaps)
    }

    output_json_file = OUTPUT_FILE.rsplit(".", 1)[0] + ".json"
    with open(output_json_file, "w", encoding="utf-8") as json_file:
        json.dump(json_payload, json_file, indent=2, ensure_ascii=False, default=str)

    return jsonify(json_payload)

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
