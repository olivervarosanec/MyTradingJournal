# Trading Journal Backend

This is the Flask backend for the Trading Journal application.

## Setup and Installation

1. Make sure you have Python 3.7+ installed on your system.

2. Install the required packages:
```
pip install -r requirements.txt
```

3. Run the application:
```
python app.py
```

The server will start on `http://localhost:5000`.

## API Endpoints

### Trades

- `GET /api/trades` - Get all trades
- `GET /api/trades/<id>` - Get a specific trade by ID
- `POST /api/trades` - Create a new trade
- `PUT /api/trades/<id>` - Update an existing trade
- `DELETE /api/trades/<id>` - Delete a trade

### Statistics

- `GET /api/stats` - Get trading statistics

### Charts

- `GET /api/charts/<ticker>?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get stock chart data for a ticker within a date range 