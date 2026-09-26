from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from datetime import datetime, timedelta
import math


# ============================================================
# FILE NAMES
# ============================================================

UTILITY_A_FILE = "Georgia File.xlsx"
UTILITY_B_FILE = "South Carolina File.xlsx"

OUTPUT_FILE = "utility_overlap_analysis.xlsx"

# Projects must be LESS than this distance to count as overlap
OVERLAP_DISTANCE_MILES = 25


# ============================================================
# HELPER FUNCTIONS
# ============================================================

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


# ============================================================
# LOAD THE TWO WORKBOOKS
# ============================================================

print("Loading Excel files...")

utility_a_workbook = load_workbook(
    UTILITY_A_FILE,
    data_only=True
)

utility_b_workbook = load_workbook(
    UTILITY_B_FILE,
    data_only=True
)


# ============================================================
# READ UTILITY A
# ============================================================

# Georgia workbook
utility_a_sheet = utility_a_workbook["10 Year Expansion Plan"]

utility_a_projects = []

# Columns in your Georgia workbook:
#
# A = Zone
# B = Year
# C = TEAMS Number
# D = Project Name
# E = Need Date
# F = Project Sponsor
#
# L = Location 1
# M = Latitude 1
# N = Longitude 1
#
# O = Location 2
# P = Latitude 2
# Q = Longitude 2

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

utility_b_sheet = utility_b_workbook["Dominion Project Matches"]

utility_b_projects = []

# Columns in your Dominion workbook:
#
# B = Project ID
# C = Project Name
# E = Status
# F = In-Service Date
# G = Matched Location
# H = Latitude
# I = Longitude

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


print(
    f"Utility A projects with coordinates: "
    f"{len(utility_a_projects)}"
)

print(
    f"Utility B projects with coordinates: "
    f"{len(utility_b_projects)}"
)


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

HEADER_FILL = PatternFill(
    "solid",
    fgColor="1F4E78"
)

HEADER_FONT = Font(
    bold=True,
    color="FFFFFF"
)


for sheet in [
    sheet_a,
    sheet_b,
    overlap_sheet
]:

    # Header formatting
    for cell in sheet[1]:

        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT

        cell.alignment = Alignment(
            horizontal="center",
            vertical="center",
            wrap_text=True
        )

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
# SAVE
# ============================================================

output_workbook.save(
    OUTPUT_FILE
)


print()
print("DONE")
print("----------------------------")
print(f"Output file: {OUTPUT_FILE}")
print(
    f"Overlap pairs: {len(overlaps)}"
)

missing_a_dates = sum(
    1
    for x in overlaps
    if x["a_date"] is None
)

missing_b_dates = sum(
    1
    for x in overlaps
    if x["b_date"] is None
)

missing_time_gaps = sum(
    1
    for x in overlaps
    if x["time_gap"] is None
)

print(
    f"Missing Utility A dates: "
    f"{missing_a_dates}"
)

print(
    f"Missing Utility B dates: "
    f"{missing_b_dates}"
)

print(
    f"Missing time gaps: "
    f"{missing_time_gaps}"
)